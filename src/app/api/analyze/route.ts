import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { verifyAdminToken } from '@/lib/auth'
import { fetchRepo, fetchReadme, fetchLanguages, slugify } from '@/lib/github'
import { analyzeRepo } from '@/lib/claude'
import { DEFAULT_CATEGORIES } from '@/lib/constants'
import type { ApiResponse, AiAnalysisResult } from '@/lib/types'

function guessCategory(languages: Record<string, number>, description: string | null): string {
  const desc = (description || '').toLowerCase()
  if (desc.includes('sap') || desc.includes('rfc') || desc.includes('erp') || desc.includes('penta')) return 'sap-erp'
  if (desc.includes('butce') || desc.includes('kredi') || desc.includes('finans') || desc.includes('maliyet') || desc.includes('fatura')) return 'finans'
  if (desc.includes('ai') || desc.includes('llm') || desc.includes('gemini') || desc.includes('gpt') || desc.includes('token')) return 'ai-araclar'
  if (desc.includes('mobil') || desc.includes('ios') || desc.includes('android') || desc.includes('swift')) return 'mobile'
  if (Object.keys(languages).some(l => ['HTML', 'CSS', 'JavaScript', 'TypeScript'].includes(l))) return 'web-app'
  return 'utility'
}

function buildBasicAnalysis(
  repo: { name: string; description: string | null },
  languages: Record<string, number>
): AiAnalysisResult {
  const techStack = Object.keys(languages).slice(0, 5)
  const category = guessCategory(languages, repo.description)
  const catDisplay = DEFAULT_CATEGORIES.find(c => c.name === category)?.display_name || category

  return {
    description: repo.description || `${repo.name} projesi`,
    category,
    ai_trailer: `${repo.name} — ${catDisplay} kategorisinde bir proje. ${techStack.length > 0 ? `Kullanilan teknolojiler: ${techStack.join(', ')}.` : ''} ${repo.description || ''}`.trim(),
    activity: 'aktif',
    tech_stack: techStack,
  }
}

export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse<{ id: string; ai_used: boolean }>>> {
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

    // Check if AI is enabled
    const { data: aiSetting } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'ai_enabled')
      .single()
    const aiEnabled = aiSetting?.value !== 'false'

    const [repo, readme, languages] = await Promise.all([
      fetchRepo(repoName),
      fetchReadme(repoName),
      fetchLanguages(repoName),
    ])

    let analysis: AiAnalysisResult
    let aiUsed = false

    if (aiEnabled) {
      try {
        analysis = await analyzeRepo({ readme, languages, description: repo.description, repoName: repo.name })
        aiUsed = true
      } catch (aiError) {
        console.error('AI analysis failed, falling back to basic:', aiError instanceof Error ? aiError.message : aiError)
        analysis = buildBasicAnalysis(repo, languages)
      }
    } else {
      analysis = buildBasicAnalysis(repo, languages)
    }

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

    return NextResponse.json({ success: true, data: { id: data.id, ai_used: aiUsed } })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error('Analyze error:', message)
    return NextResponse.json(
      { success: false, error: `Analysis failed: ${message}` },
      { status: 500 }
    )
  }
}
