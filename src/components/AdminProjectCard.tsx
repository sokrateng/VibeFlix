'use client'

import { useState } from 'react'
import { FileUploader } from './FileUploader'
import type { Project, ComplexityLevel } from '@/lib/types'

interface AdminProjectCardProps {
  project: Project
  token: string
  onUpdate: () => void
  onDelete: (id: string) => void
}

export function AdminProjectCard({
  project,
  token,
  onUpdate,
  onDelete,
}: AdminProjectCardProps) {
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({
    description: project.description,
    category: project.category,
    ai_trailer: project.ai_trailer,
    features: project.features || '',
    use_case: project.use_case || '',
    complexity: project.complexity || 'orta',
  })
  const [saving, setSaving] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [statusMsg, setStatusMsg] = useState<{type: 'error' | 'success', text: string} | null>(null)

  const statusColors: Record<string, string> = {
    NEW: 'bg-blue-500',
    ANALYZING: 'bg-yellow-500',
    PENDING: 'bg-orange-500',
    APPROVED: 'bg-green-500',
    REJECTED: 'bg-red-500',
  }

  const complexityLabels: Record<string, string> = {
    basit: 'Basit',
    orta: 'Orta',
    karmasik: 'Karmasik',
  }

  const complexityColors: Record<string, string> = {
    basit: 'bg-green-700',
    orta: 'bg-yellow-700',
    karmasik: 'bg-red-700',
  }

  function showStatus(type: 'error' | 'success', text: string) {
    setStatusMsg({ type, text })
    setTimeout(() => setStatusMsg(null), 3000)
  }

  async function updateStatus(status: string) {
    try {
      await fetch(`/api/projects/${project.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      })

      if (status === 'APPROVED') {
        await fetch('/api/revalidate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ slug: project.slug }),
        })
      }

      onUpdate()
    } catch {
      showStatus('error', 'Islem basarisiz')
    }
  }

  async function toggleFeatured() {
    try {
      await fetch(`/api/projects/${project.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ featured: !project.featured }),
      })
      onUpdate()
    } catch {
      showStatus('error', 'Islem basarisiz')
    }
  }

  async function analyzeRepo() {
    setAnalyzing(true)
    try {
      const repoName = project.github_repo.split('/')[1]
      await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ repoName }),
      })
      onUpdate()
    } catch {
      showStatus('error', 'Islem basarisiz')
    } finally {
      setAnalyzing(false)
    }
  }

  async function handleSave() {
    setSaving(true)
    try {
      await fetch(`/api/projects/${project.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      })
      setEditing(false)
      onUpdate()
    } catch {
      showStatus('error', 'Islem basarisiz')
    } finally {
      setSaving(false)
    }
  }

  const screenshots = project.screenshots || []

  return (
    <div className="bg-[#1F1F1F] rounded-lg p-4 mb-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={toggleFeatured}
            className={`text-lg ${project.featured ? 'text-yellow-400' : 'text-gray-600 hover:text-yellow-400'}`}
            title={project.featured ? 'Vitrin\'den kaldir' : 'Vitrin\'e ekle'}
          >
            ★
          </button>
          <h3 className="text-white font-bold">{project.name}</h3>
          {project.featured && (
            <span className="bg-yellow-600 text-white text-[10px] px-1.5 py-0.5 rounded">VITRIN</span>
          )}
          {project.complexity && (
            <span className={`${complexityColors[project.complexity] || 'bg-gray-600'} text-white text-[10px] px-1.5 py-0.5 rounded`}>
              {complexityLabels[project.complexity] || project.complexity}
            </span>
          )}
        </div>
        <span
          className={`${statusColors[project.status] || 'bg-gray-500'} text-white text-xs px-2 py-1 rounded`}
        >
          {project.status}
        </span>
      </div>

      {statusMsg && (
        <div className={`text-xs px-2 py-1 rounded mb-2 ${statusMsg.type === 'error' ? 'bg-red-900/50 text-red-300' : 'bg-green-900/50 text-green-300'}`}>
          {statusMsg.text}
        </div>
      )}

      {/* Screenshots preview */}
      {screenshots.length > 0 && (
        <div className="flex gap-1 mb-3 overflow-x-auto">
          {screenshots.map((ss) => (
            <img
              key={ss.id}
              src={ss.image_url}
              alt={ss.caption}
              className="h-16 rounded border border-gray-700 object-cover"
            />
          ))}
        </div>
      )}

      {editing ? (
        /* Edit Mode */
        <div className="space-y-3 mb-3">
          <div>
            <label className="text-gray-500 text-xs">Aciklama</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full bg-black/30 text-white border border-gray-600 rounded px-3 py-2 text-sm mt-1"
              rows={2}
            />
          </div>
          <div>
            <label className="text-gray-500 text-xs">Kategori</label>
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="w-full bg-black/30 text-white border border-gray-600 rounded px-3 py-2 text-sm mt-1"
            >
              <option value="sap-erp">SAP / ERP</option>
              <option value="finans">Finans & Yonetim</option>
              <option value="ai-araclar">AI Araclari</option>
              <option value="web-app">Web Uygulamalari</option>
              <option value="utility">Utility & Araclar</option>
              <option value="mobile">Mobil Uygulamalar</option>
            </select>
          </div>
          <div>
            <label className="text-gray-500 text-xs">AI Fragman</label>
            <textarea
              value={form.ai_trailer}
              onChange={(e) => setForm({ ...form, ai_trailer: e.target.value })}
              className="w-full bg-black/30 text-white border border-gray-600 rounded px-3 py-2 text-sm mt-1"
              rows={3}
            />
          </div>
          <div>
            <label className="text-gray-500 text-xs">Ozellikler (her satir bir madde)</label>
            <textarea
              value={form.features}
              onChange={(e) => setForm({ ...form, features: e.target.value })}
              className="w-full bg-black/30 text-white border border-gray-600 rounded px-3 py-2 text-sm mt-1"
              rows={4}
              placeholder={"• Ozellik 1\n• Ozellik 2\n• Ozellik 3"}
            />
          </div>
          <div>
            <label className="text-gray-500 text-xs">Kullanim Senaryosu</label>
            <textarea
              value={form.use_case}
              onChange={(e) => setForm({ ...form, use_case: e.target.value })}
              className="w-full bg-black/30 text-white border border-gray-600 rounded px-3 py-2 text-sm mt-1"
              rows={2}
            />
          </div>
          <div>
            <label className="text-gray-500 text-xs">Karmasiklik</label>
            <select
              value={form.complexity}
              onChange={(e) => setForm({ ...form, complexity: e.target.value as ComplexityLevel })}
              className="w-full bg-black/30 text-white border border-gray-600 rounded px-3 py-2 text-sm mt-1"
            >
              <option value="basit">Basit</option>
              <option value="orta">Orta</option>
              <option value="karmasik">Karmasik</option>
            </select>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-green-600 text-white px-4 py-1 rounded text-sm hover:bg-green-700 disabled:opacity-50"
            >
              {saving ? 'Kaydediliyor...' : 'Kaydet'}
            </button>
            <button
              onClick={() => setEditing(false)}
              className="bg-gray-600 text-white px-4 py-1 rounded text-sm hover:bg-gray-700"
            >
              Iptal
            </button>
          </div>
        </div>
      ) : (
        /* View Mode */
        <>
          <p className="text-gray-400 text-sm mb-2">
            {project.description || 'Aciklama yok'}
          </p>
          <p className="text-gray-500 text-xs mb-1">
            Kategori: {project.category || 'Belirlenmedi'}
          </p>
          <p className="text-gray-500 text-xs mb-1">
            Tech: {project.tech_stack?.join(', ') || 'Bilinmiyor'}
          </p>
          {project.use_case && (
            <p className="text-gray-500 text-xs mb-1">
              Kullanim: {project.use_case}
            </p>
          )}

          {project.features && (
            <div className="bg-black/20 rounded p-2 mb-2 mt-2">
              <p className="text-gray-500 text-[10px] uppercase mb-1">Ozellikler</p>
              <p className="text-gray-400 text-xs whitespace-pre-line">{project.features}</p>
            </div>
          )}

          {project.ai_trailer && (
            <div className="bg-black/30 rounded p-3 mb-3 mt-2">
              <p className="text-gray-300 text-sm italic">{project.ai_trailer}</p>
            </div>
          )}
        </>
      )}

      {/* Actions */}
      <div className="flex gap-2 flex-wrap">
        {project.status === 'PENDING' && (
          <>
            <button
              onClick={() => updateStatus('APPROVED')}
              className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
            >
              Onayla
            </button>
            <button
              onClick={() => updateStatus('REJECTED')}
              className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
            >
              Reddet
            </button>
          </>
        )}
        <button
          onClick={analyzeRepo}
          disabled={analyzing}
          className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 disabled:opacity-50"
        >
          {analyzing ? 'Analiz...' : 'AI Analiz'}
        </button>
        {project.status === 'REJECTED' && (
          <button
            onClick={() => updateStatus('PENDING')}
            className="bg-orange-600 text-white px-3 py-1 rounded text-sm hover:bg-orange-700"
          >
            Tekrar Incele
          </button>
        )}
        {!editing && (
          <button
            onClick={() => setEditing(true)}
            className="bg-gray-600 text-white px-3 py-1 rounded text-sm hover:bg-gray-500"
          >
            Duzenle
          </button>
        )}
        <a
          href={project.github_url}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-gray-600 text-white px-3 py-1 rounded text-sm hover:bg-gray-700"
        >
          GitHub
        </a>
        <button
          onClick={() => onDelete(project.id)}
          className="bg-red-900 text-red-300 px-3 py-1 rounded text-sm hover:bg-red-800 ml-auto"
        >
          Sil
        </button>
      </div>

      {/* File Upload Section */}
      <FileUploader
        projectId={project.id}
        token={token}
        attachments={project.attachments || []}
        screenshots={project.screenshots || []}
        onUpdate={onUpdate}
      />
    </div>
  )
}
