import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { verifyAdminToken } from '@/lib/auth'
import type { ApiResponse, Attachment, AttachmentType } from '@/lib/types'

function detectFileType(mimeType: string, fileName: string): AttachmentType {
  if (mimeType.startsWith('image/')) return 'screenshot'
  if (
    mimeType === 'application/vnd.ms-powerpoint' ||
    mimeType === 'application/vnd.openxmlformats-officedocument.presentationml.presentation' ||
    fileName.endsWith('.ppt') ||
    fileName.endsWith('.pptx')
  ) return 'presentation'
  if (mimeType === 'text/html' || fileName.endsWith('.html') || fileName.endsWith('.htm')) return 'html'
  return 'other'
}

export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse<Attachment>>> {
  if (!verifyAdminToken(request)) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    )
  }

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const projectId = formData.get('projectId') as string | null
    const fileTypeOverride = formData.get('fileType') as string | null

    if (!file || !projectId) {
      return NextResponse.json(
        { success: false, error: 'file and projectId required' },
        { status: 400 }
      )
    }

    const supabase = createServerClient()
    const buffer = await file.arrayBuffer()
    const ext = file.name.split('.').pop() || 'bin'
    const storagePath = `${projectId}/${Date.now()}-${file.name}`

    const { error: uploadError } = await supabase.storage
      .from('attachments')
      .upload(storagePath, buffer, {
        contentType: file.type,
        upsert: false,
      })

    if (uploadError) {
      throw new Error(`Upload failed: ${uploadError.message}`)
    }

    const { data: urlData } = supabase.storage
      .from('attachments')
      .getPublicUrl(storagePath)

    const fileType = (fileTypeOverride as AttachmentType) || detectFileType(file.type, file.name)

    const { data, error } = await supabase
      .from('attachments')
      .insert({
        project_id: projectId,
        file_url: urlData.publicUrl,
        file_name: file.name,
        file_type: fileType,
        mime_type: file.type,
      })
      .select()
      .single()

    if (error || !data) {
      throw new Error(`DB insert failed: ${error?.message}`)
    }

    // If it's a screenshot, also add to screenshots table
    if (fileType === 'screenshot') {
      await supabase.from('screenshots').insert({
        project_id: projectId,
        image_url: urlData.publicUrl,
        caption: file.name,
        sort_order: 0,
      })
    }

    return NextResponse.json({ success: true, data: data as Attachment })
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    return NextResponse.json(
      { success: false, error: msg },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest
): Promise<NextResponse<ApiResponse<null>>> {
  if (!verifyAdminToken(request)) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    )
  }

  try {
    const { attachmentId } = await request.json()
    const supabase = createServerClient()

    const { data: attachment } = await supabase
      .from('attachments')
      .select('file_url')
      .eq('id', attachmentId)
      .single()

    if (attachment) {
      // Extract storage path from URL
      const url = new URL(attachment.file_url)
      const pathParts = url.pathname.split('/attachments/')
      if (pathParts[1]) {
        await supabase.storage.from('attachments').remove([decodeURIComponent(pathParts[1])])
      }
    }

    await supabase.from('attachments').delete().eq('id', attachmentId)

    return NextResponse.json({ success: true })
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    return NextResponse.json(
      { success: false, error: msg },
      { status: 500 }
    )
  }
}
