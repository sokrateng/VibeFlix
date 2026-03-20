'use client'

import type { Project } from '@/lib/types'

interface AdminProjectCardProps {
  project: Project
  token: string
  onUpdate: () => void
}

export function AdminProjectCard({
  project,
  token,
  onUpdate,
}: AdminProjectCardProps) {
  const statusColors: Record<string, string> = {
    NEW: 'bg-blue-500',
    ANALYZING: 'bg-yellow-500',
    PENDING: 'bg-orange-500',
    APPROVED: 'bg-green-500',
    REJECTED: 'bg-red-500',
  }

  async function updateStatus(status: string) {
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
  }

  async function analyzeRepo() {
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
  }

  return (
    <div className="bg-[#1F1F1F] rounded-lg p-4 mb-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-white font-bold">{project.name}</h3>
        <span
          className={`${statusColors[project.status] || 'bg-gray-500'} text-white text-xs px-2 py-1 rounded`}
        >
          {project.status}
        </span>
      </div>
      <p className="text-gray-400 text-sm mb-2">
        {project.description || 'Aciklama yok'}
      </p>
      <p className="text-gray-500 text-xs mb-1">
        Kategori: {project.category || 'Belirlenmedi'}
      </p>
      <p className="text-gray-500 text-xs mb-3">
        Tech: {project.tech_stack.join(', ') || 'Bilinmiyor'}
      </p>

      {project.ai_trailer && (
        <div className="bg-black/30 rounded p-3 mb-3">
          <p className="text-gray-300 text-sm italic">{project.ai_trailer}</p>
        </div>
      )}

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
        {(project.status === 'NEW' || !project.description) && (
          <button
            onClick={analyzeRepo}
            className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
          >
            AI Analiz
          </button>
        )}
        {project.status === 'REJECTED' && (
          <button
            onClick={() => updateStatus('PENDING')}
            className="bg-orange-600 text-white px-3 py-1 rounded text-sm hover:bg-orange-700"
          >
            Tekrar Incele
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
      </div>
    </div>
  )
}
