import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { verifyAdminToken } from '@/lib/auth'
import { fetchRepo, fetchReadme, fetchLanguages, slugify } from '@/lib/github'
import { analyzeRepo } from '@/lib/claude'
import type { ApiResponse } from '@/lib/types'

export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse<{ id: string }>>> {
  if (!verifyAdminToken(request)) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    )
  }

  try {
    const { repoName } = await request.json()
    if (!repoName) {
      return NextResponse.json(
        { success: false, error: 'repoName required' },
        { status: 400 }
      )
    }

    const supabase = createServerClient()

    const [repo, readme, languages] = await Promise.all([
      fetchRepo(repoName),
      fetchReadme(repoName),
      fetchLanguages(repoName),
    ])

    const analysis = await analyzeRepo({
      readme,
      languages,
      description: repo.description,
      repoName: repo.name,
    })

    const { data, error } = await supabase
      .from('projects')
      .upsert(
        {
          github_repo: repo.full_name,
          name: repo.name,
          slug: slugify(repo.name),
          description: analysis.description,
          category: analysis.category,
          status: 'PENDING',
          tech_stack: analysis.tech_stack,
          demo_url: repo.homepage || null,
          github_url: repo.html_url,
          last_updated: repo.updated_at,
          activity: analysis.activity,
          ai_trailer: analysis.ai_trailer,
        },
        { onConflict: 'github_repo' }
      )
      .select('id')
      .single()

    if (error || !data) {
      throw new Error(`Upsert failed: ${error?.message}`)
    }

    return NextResponse.json({ success: true, data: { id: data.id } })
  } catch (error) {
    console.error('Analyze error:', error)
    return NextResponse.json(
      { success: false, error: 'Analysis failed' },
      { status: 500 }
    )
  }
}
