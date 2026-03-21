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
    if (row.key === 'gemini_api_key' || row.key === 'anthropic_api_key') {
      settings[row.key] = row.value ? '••••••••' + row.value.slice(-4) : ''
    } else {
      settings[row.key] = row.value
    }
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

    const VALID_KEYS = ['ai_enabled', 'ai_provider', 'gemini_api_key', 'gemini_model', 'anthropic_api_key', 'anthropic_model'] as const
    const validKeySet = new Set<string>(VALID_KEYS)

    const entries = Object.entries(body).filter(([key]) => validKeySet.has(key))

    const rows = entries.map(([key, value]) => ({ key, value: value as string }))
    if (rows.length > 0) {
      await supabase.from('settings').upsert(rows, { onConflict: 'key' })
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
