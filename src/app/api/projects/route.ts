import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { verifyAdminToken } from '@/lib/auth'
import type { ApiResponse, Project } from '@/lib/types'

export async function GET(
  request: NextRequest
): Promise<NextResponse<ApiResponse<Project[]>>> {
  if (!verifyAdminToken(request)) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    )
  }

  const supabase = createServerClient()
  const status = request.nextUrl.searchParams.get('status')

  let query = supabase
    .from('projects')
    .select('*, screenshots(*), attachments(*)')
    .order('created_at', { ascending: false })

  if (status) {
    query = query.eq('status', status)
  }

  const { data, error } = await query

  if (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }

  return NextResponse.json({ success: true, data: data as Project[] })
}
