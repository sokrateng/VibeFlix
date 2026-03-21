import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { verifyAdminToken } from '@/lib/auth'
import type { ApiResponse } from '@/lib/types'

export async function GET(
  request: NextRequest
): Promise<NextResponse<ApiResponse<Record<string, string>>>> {
  if (!verifyAdminToken(request)) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    )
  }

  const supabase = createServerClient()
  const { data, error } = await supabase.from('settings').select('key, value')

  if (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }

  const settings: Record<string, string> = {}
  for (const row of data || []) {
    settings[row.key] = row.value
  }

  return NextResponse.json({ success: true, data: settings })
}

export async function PUT(
  request: NextRequest
): Promise<NextResponse<ApiResponse<null>>> {
  if (!verifyAdminToken(request)) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    )
  }

  try {
    const body = await request.json() as Record<string, string>
    const supabase = createServerClient()

    const entries = Object.entries(body)
    for (const [key, value] of entries) {
      await supabase
        .from('settings')
        .upsert({ key, value }, { onConflict: 'key' })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    return NextResponse.json(
      { success: false, error: msg },
      { status: 500 }
    )
  }
}
