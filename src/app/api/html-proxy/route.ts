import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminToken } from '@/lib/auth'

export async function GET(request: NextRequest): Promise<NextResponse> {
  if (!verifyAdminToken(request)) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  const url = request.nextUrl.searchParams.get('url')
  if (!url) {
    return new NextResponse('url parameter required', { status: 400 })
  }

  try {
    const parsed = new URL(url)
    if (!parsed.hostname.endsWith('.supabase.co')) {
      return new NextResponse('Forbidden: only Supabase storage URLs allowed', { status: 403 })
    }

    const res = await fetch(url)
    const html = await res.text()

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=3600',
      },
    })
  } catch {
    return new NextResponse('Failed to fetch HTML', { status: 500 })
  }
}
