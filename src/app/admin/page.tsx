'use client'

import { useState, useEffect, useCallback } from 'react'
import { AdminProjectCard } from '@/components/AdminProjectCard'
import { AiSettings } from '@/components/AiSettings'
import type { Project } from '@/lib/types'

export default function AdminPage() {
  const [token, setToken] = useState('')
  const [authenticated, setAuthenticated] = useState(false)
  const [projects, setProjects] = useState<Project[]>([])
  const [filter, setFilter] = useState<string>('ALL')
  const [newRepoName, setNewRepoName] = useState('')
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'projects' | 'ai'>('projects')

  const fetchProjects = useCallback(async () => {
    const res = await fetch('/api/projects', {
      headers: { Authorization: `Bearer ${token}` },
    })
    const json = await res.json()
    if (json.success) setProjects(json.data)
  }, [token])

  useEffect(() => {
    const saved = localStorage.getItem('vibeflix-admin-token')
    if (saved) {
      setToken(saved)
      setAuthenticated(true)
    }
  }, [])

  useEffect(() => {
    if (authenticated) fetchProjects()
  }, [authenticated, fetchProjects])

  function handleLogin() {
    localStorage.setItem('vibeflix-admin-token', token)
    setAuthenticated(true)
  }

  async function handleAddRepo() {
    if (!newRepoName.trim()) return
    setLoading(true)
    await fetch('/api/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ repoName: newRepoName.trim() }),
    })
    setNewRepoName('')
    setLoading(false)
    fetchProjects()
  }

  if (!authenticated) {
    return (
      <main className="min-h-screen bg-[#141414] flex items-center justify-center">
        <div className="bg-[#1F1F1F] rounded-lg p-8 w-full max-w-sm">
          <h1 className="text-2xl font-bold text-white mb-4">
            VibeFlix Admin
          </h1>
          <input
            type="password"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="Admin token"
            className="w-full bg-black/30 text-white border border-gray-600 rounded px-3 py-2 mb-4"
            onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
          />
          <button
            onClick={handleLogin}
            className="w-full bg-[#E50914] text-white py-2 rounded font-bold hover:bg-red-700"
          >
            Giris
          </button>
        </div>
      </main>
    )
  }

  const filtered =
    filter === 'ALL'
      ? projects
      : projects.filter((p) => p.status === filter)

  const counts: Record<string, number> = {
    ALL: projects.length,
    PENDING: projects.filter((p) => p.status === 'PENDING').length,
    APPROVED: projects.filter((p) => p.status === 'APPROVED').length,
    REJECTED: projects.filter((p) => p.status === 'REJECTED').length,
  }

  return (
    <main className="min-h-screen bg-[#141414] p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-6">
          VibeFlix Admin
        </h1>

        {/* Tab Navigation */}
        <div className="flex gap-1 mb-6 border-b border-gray-700 pb-1">
          <button
            onClick={() => setActiveTab('projects')}
            className={`px-4 py-2 rounded-t text-sm font-bold ${
              activeTab === 'projects'
                ? 'bg-[#1F1F1F] text-white'
                : 'text-gray-500 hover:text-white'
            }`}
          >
            Projeler
          </button>
          <button
            onClick={() => setActiveTab('ai')}
            className={`px-4 py-2 rounded-t text-sm font-bold ${
              activeTab === 'ai'
                ? 'bg-[#1F1F1F] text-white'
                : 'text-gray-500 hover:text-white'
            }`}
          >
            AI Ayarlari
          </button>
        </div>

        {/* AI Settings Tab */}
        {activeTab === 'ai' && <AiSettings token={token} />}

        {/* Projects Tab */}
        {activeTab === 'projects' && (
          <>
            <div className="bg-[#1F1F1F] rounded-lg p-4 mb-6 flex gap-2">
              <input
                type="text"
                value={newRepoName}
                onChange={(e) => setNewRepoName(e.target.value)}
                placeholder="Repo adi (orn: SAP_Gateway)"
                className="flex-1 bg-black/30 text-white border border-gray-600 rounded px-3 py-2"
                onKeyDown={(e) => e.key === 'Enter' && handleAddRepo()}
              />
              <button
                onClick={handleAddRepo}
                disabled={loading}
                className="bg-blue-600 text-white px-4 py-2 rounded font-bold hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Analiz...' : '+ Ekle & Analiz'}
              </button>
            </div>

            <div className="flex gap-2 mb-6">
              {(['ALL', 'PENDING', 'APPROVED', 'REJECTED'] as const).map(
                (s) => (
                  <button
                    key={s}
                    onClick={() => setFilter(s)}
                    className={`px-3 py-1 rounded text-sm ${
                      filter === s
                        ? 'bg-[#E50914] text-white'
                        : 'bg-[#1F1F1F] text-gray-400 hover:text-white'
                    }`}
                  >
                    {s} ({counts[s]})
                  </button>
                )
              )}
            </div>

            {filtered.map((project) => (
              <AdminProjectCard
                key={project.id}
                project={project}
                token={token}
                onUpdate={fetchProjects}
              />
            ))}

            {filtered.length === 0 && (
              <p className="text-gray-500 text-center py-8">
                Bu filtrede proje yok
              </p>
            )}
          </>
        )}
      </div>
    </main>
  )
}
