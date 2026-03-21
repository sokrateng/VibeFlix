'use client'

import { useState, useRef } from 'react'
import type { Attachment, Screenshot } from '@/lib/types'

interface FileUploaderProps {
  projectId: string
  token: string
  attachments: Attachment[]
  screenshots: Screenshot[]
  onUpdate: () => void
}

const TYPE_LABELS: Record<string, string> = {
  screenshot: 'Ekran Goruntusu',
  presentation: 'Sunum (PPT)',
  html: 'HTML Icerik',
  other: 'Diger',
}

const TYPE_ICONS: Record<string, string> = {
  screenshot: '🖼️',
  presentation: '📊',
  html: '🌐',
  other: '📎',
}

export function FileUploader({ projectId, token, attachments, screenshots, onUpdate }: FileUploaderProps) {
  const [uploading, setUploading] = useState(false)
  const [uploadType, setUploadType] = useState<string>('auto')
  const fileRef = useRef<HTMLInputElement>(null)

  async function handleUpload(files: FileList | null) {
    if (!files || files.length === 0) return
    setUploading(true)

    for (const file of Array.from(files)) {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('projectId', projectId)
      if (uploadType !== 'auto') {
        formData.append('fileType', uploadType)
      }

      await fetch('/api/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      })
    }

    setUploading(false)
    if (fileRef.current) fileRef.current.value = ''
    onUpdate()
  }

  async function handleDelete(attachmentId: string) {
    await fetch('/api/upload', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ attachmentId }),
    })
    onUpdate()
  }

  async function handleDeleteScreenshot(screenshotId: string) {
    await fetch('/api/upload', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ screenshotId }),
    })
    onUpdate()
  }

  const screenshotAttachments = attachments.filter(a => a.file_type === 'screenshot')
  const presentations = attachments.filter(a => a.file_type === 'presentation')
  const htmlFiles = attachments.filter(a => a.file_type === 'html')
  const others = attachments.filter(a => a.file_type === 'other')
  const hasAnyContent = attachments.length > 0 || screenshots.length > 0

  return (
    <div className="mt-3 border-t border-gray-700 pt-3">
      {/* Upload Area */}
      <div className="flex gap-2 items-center mb-3">
        <select
          value={uploadType}
          onChange={(e) => setUploadType(e.target.value)}
          className="bg-black/30 text-white border border-gray-600 rounded px-2 py-1 text-xs"
        >
          <option value="auto">Otomatik Algila</option>
          <option value="screenshot">Ekran Goruntusu</option>
          <option value="presentation">Sunum (PPT/PPTX)</option>
          <option value="html">HTML Icerik</option>
          <option value="other">Diger</option>
        </select>
        <label className="bg-purple-600 text-white px-3 py-1 rounded text-xs hover:bg-purple-700 cursor-pointer">
          {uploading ? 'Yukleniyor...' : '+ Dosya Yukle'}
          <input
            ref={fileRef}
            type="file"
            multiple
            accept="image/*,.ppt,.pptx,.html,.htm,.pdf"
            className="hidden"
            onChange={(e) => handleUpload(e.target.files)}
            disabled={uploading}
          />
        </label>
      </div>

      {/* Uploaded Files List */}
      {hasAnyContent && (
        <div className="space-y-2">
          {/* Screenshots from screenshots table */}
          {screenshots.length > 0 && (
            <div>
              <p className="text-gray-500 text-[10px] uppercase mb-1">Screenshots Tablosu ({screenshots.length})</p>
              <div className="flex gap-1 flex-wrap">
                {screenshots.map((ss) => (
                  <div key={ss.id} className="relative group">
                    <img
                      src={ss.image_url}
                      alt={ss.caption}
                      className="h-14 rounded border border-gray-700 object-cover"
                    />
                    <button
                      onClick={() => handleDeleteScreenshot(ss.id)}
                      className="absolute -top-1 -right-1 bg-red-600 text-white w-4 h-4 rounded-full text-[10px] hidden group-hover:flex items-center justify-center"
                    >
                      x
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Screenshots from attachments */}
          {screenshotAttachments.length > 0 && (
            <div>
              <p className="text-gray-500 text-[10px] uppercase mb-1">Ekran Goruntuleri ({screenshotAttachments.length})</p>
              <div className="flex gap-1 flex-wrap">
                {screenshotAttachments.map((a) => (
                  <div key={a.id} className="relative group">
                    <img
                      src={a.file_url}
                      alt={a.file_name}
                      className="h-14 rounded border border-gray-700 object-cover"
                    />
                    <button
                      onClick={() => handleDelete(a.id)}
                      className="absolute -top-1 -right-1 bg-red-600 text-white w-4 h-4 rounded-full text-[10px] hidden group-hover:flex items-center justify-center"
                    >
                      x
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Presentations */}
          {presentations.length > 0 && (
            <div>
              <p className="text-gray-500 text-[10px] uppercase mb-1">Sunumlar ({presentations.length})</p>
              {presentations.map((a) => (
                <div key={a.id} className="flex items-center gap-2 text-xs">
                  <span>{TYPE_ICONS.presentation}</span>
                  <a href={a.file_url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline truncate">
                    {a.file_name}
                  </a>
                  <button onClick={() => handleDelete(a.id)} className="text-red-400 hover:text-red-300 text-[10px]">sil</button>
                </div>
              ))}
            </div>
          )}

          {/* HTML Files */}
          {htmlFiles.length > 0 && (
            <div>
              <p className="text-gray-500 text-[10px] uppercase mb-1">HTML Icerikler ({htmlFiles.length})</p>
              {htmlFiles.map((a) => (
                <div key={a.id} className="flex items-center gap-2 text-xs">
                  <span>{TYPE_ICONS.html}</span>
                  <a href={a.file_url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline truncate">
                    {a.file_name}
                  </a>
                  <button onClick={() => handleDelete(a.id)} className="text-red-400 hover:text-red-300 text-[10px]">sil</button>
                </div>
              ))}
            </div>
          )}

          {/* Others */}
          {others.length > 0 && (
            <div>
              <p className="text-gray-500 text-[10px] uppercase mb-1">Diger Dosyalar ({others.length})</p>
              {others.map((a) => (
                <div key={a.id} className="flex items-center gap-2 text-xs">
                  <span>{TYPE_ICONS.other}</span>
                  <a href={a.file_url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline truncate">
                    {a.file_name}
                  </a>
                  <button onClick={() => handleDelete(a.id)} className="text-red-400 hover:text-red-300 text-[10px]">sil</button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
