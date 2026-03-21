import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest): Promise<NextResponse> {
  const url = request.nextUrl.searchParams.get('url')

  if (!url) {
    return new NextResponse('url parameter required', { status: 400 })
  }

  try {
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
