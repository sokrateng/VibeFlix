import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { createServerClient } from '@/lib/supabase-server'
import { fetchRepo, fetchReadme, fetchLanguages, slugify } from '@/lib/github'
import { analyzeRepo } from '@/lib/claude'
import type { ApiResponse } from '@/lib/types'

function verifyWebhookSignature(
  payload: string,
  signature: string | null
): boolean {
  if (!signature || !process.env.GITHUB_WEBHOOK_SECRET) return false
  const expected = `sha256=${crypto
    .createHmac('sha256', process.env.GITHUB_WEBHOOK_SECRET)
    .update(payload)
    .digest('hex')}`
  try {
    const sigBuf = Buffer.from(signature)
    const expBuf = Buffer.from(expected)
    if (sigBuf.length !== expBuf.length) return false
    return crypto.timingSafeEqual(sigBuf, expBuf)
  } catch {
    return false
  }
}

export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse<{ id: string }>>> {
  try {
    const body = await request.text()
    const signature = request.headers.get('x-hub-signature-256')

    if (!verifyWebhookSignature(body, signature)) {
      return NextResponse.json(
        { success: false, error: 'Invalid signature' },
        { status: 401 }
      )
    }

    const payload = JSON.parse(body)
    const repoName = payload.repository?.name
    if (!repoName) {
      return NextResponse.json(
        { success: false, error: 'No repository in payload' },
        { status: 400 }
      )
    }

    const supabase = createServerClient()

    const { data: existing } = await supabase
      .from('projects')
      .select('id')
      .eq('github_repo', payload.repository.full_name)
      .single()

    if (existing) {
      return NextResponse.json({
        success: true,
        data: { id: existing.id },
      })
    }

    const [repo, readme, languages] = await Promise.all([
      fetchRepo(repoName),
      fetchReadme(repoName),
      fetchLanguages(repoName),
    ])

    const { data: project, error: insertError } = await supabase
      .from('projects')
      .insert({
        github_repo: repo.full_name,
        name: repo.name,
        slug: slugify(repo.name),
        github_url: repo.html_url,
        demo_url: repo.homepage || null,
        last_updated: repo.updated_at,
        status: 'ANALYZING',
      })
      .select('id')
      .single()

    if (insertError || !project) {
      throw new Error(`Insert failed: ${insertError?.message}`)
    }

    analyzeRepo({
      readme,
      languages,
      description: repo.description,
      repoName: repo.name,
    })
      .then(async (analysis) => {
        await supabase
          .from('projects')
          .update({
            description: analysis.description,
            category: analysis.category,
            ai_trailer: analysis.ai_trailer,
            activity: analysis.activity,
            tech_stack: analysis.tech_stack,
            status: 'PENDING',
          })
          .eq('id', project.id)
      })
      .catch(async (err) => {
        console.error('AI analysis failed:', err)
        await supabase
          .from('projects')
          .update({ status: 'PENDING' })
          .eq('id', project.id)
      })

    return NextResponse.json({
      success: true,
      data: { id: project.id },
    })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
