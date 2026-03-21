import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminToken } from '@/lib/auth'
import { fetchAllRepos } from '@/lib/github'
import type { ApiResponse } from '@/lib/types'

interface RepoListItem {
  name: string
  full_name: string
  description: string | null
  language: string | null
  updated_at: string
  homepage: string | null
}

export async function GET(
  request: NextRequest
): Promise<NextResponse<ApiResponse<RepoListItem[]>>> {
  if (!verifyAdminToken(request)) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    )
  }

  try {
    const repos = await fetchAllRepos()
    const list: RepoListItem[] = repos.map((r) => ({
      name: r.name,
      full_name: r.full_name,
      description: r.description,
      language: r.language,
      updated_at: r.updated_at,
      homepage: r.homepage,
    }))
    return NextResponse.json({ success: true, data: list })
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    return NextResponse.json(
      { success: false, error: msg },
      { status: 500 }
    )
  }
}
