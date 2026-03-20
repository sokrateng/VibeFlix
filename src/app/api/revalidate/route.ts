import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { verifyAdminToken } from '@/lib/auth'
import type { ApiResponse } from '@/lib/types'

export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse<null>>> {
  if (!verifyAdminToken(request)) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    )
  }

  const { slug } = await request.json()

  revalidatePath('/')
  if (slug) {
    revalidatePath(`/project/${slug}`)
  }

  return NextResponse.json({ success: true })
}
