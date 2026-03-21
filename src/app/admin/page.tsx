'use client'

import { useState, useEffect, useCallback } from 'react'
import { AdminProjectCard } from '@/components/AdminProjectCard'
import { AiSettings } from '@/components/AiSettings'
import { CategoryManager } from '@/components/CategoryManager'
import type { Project } from '@/lib/types'

interface GitHubRepo {
  name: string
  full_name: string
  description: string | null
  language: string | null
  updated_at: string
  homepage: string | null
}

export default function AdminPage() {
  const [token, setToken] = useState('')
  const [authenticated, setAuthenticated] = useState(false)
  const [projects, setProjects] = useState<Project[]>([])
  const [filter, setFilter] = useState<string>('ALL')
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'projects' | 'categories' | 'ai'>('projects')
  const [githubRepos, setGithubRepos] = useState<GitHubRepo[]>([])
  const [selectedRepo, setSelectedRepo] = useState('')
  const [loadingRepos, setLoadingRepos] = useState(false)

  const fetchProjects = useCallback(async () => {
    const res = await fetch('/api/projects', {
      headers: { Authorization: `Bearer ${token}` },
    })
    const json = await res.json()
    if (json.success) setProjects(json.data)
  }, [token])

  const fetchGithubRepos = useCallback(async () => {
    setLoadingRepos(true)
    const res = await fetch('/api/github-repos', {
      headers: { Authorization: `Bearer ${token}` },
    })
    const json = await res.json()
    if (json.success) setGithubRepos(json.data)
    setLoadingRepos(false)
  }, [token])

  useEffect(() => {
    const saved = localStorage.getItem('vibeflix-admin-token')
    if (saved) {
      setToken(saved)
      setAuthenticated(true)
    }
  }, [])

  useEffect(() => {
    if (authenticated) {
      fetchProjects()
      fetchGithubRepos()
    }
  }, [authenticated, fetchProjects, fetchGithubRepos])

  function handleLogin() {
    localStorage.setItem('vibeflix-admin-token', token)
    setAuthenticated(true)
  }

  async function handleDeleteProject(id: string) {
    await fetch(`/api/projects/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })
    fetchProjects()
  }

  async function handleDeleteAll() {
    if (!confirm('Tum projeleri silmek istediginize emin misiniz?')) return
    for (const p of projects) {
      await fetch(`/api/projects/${p.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
    }
    fetchProjects()
  }

  async function handleAddRepo() {
    if (!selectedRepo) return
    setLoading(true)
    await fetch('/api/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ repoName: selectedRepo }),
    })
    setSelectedRepo('')
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

  const addedRepoNames = new Set(projects.map((p) => p.github_repo.split('/')[1]))

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
            onClick={() => setActiveTab('categories')}
            className={`px-4 py-2 rounded-t text-sm font-bold ${
              activeTab === 'categories'
                ? 'bg-[#1F1F1F] text-white'
                : 'text-gray-500 hover:text-white'
            }`}
          >
            Kategoriler
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

        {/* Categories Tab */}
        {activeTab === 'categories' && <CategoryManager token={token} />}

        {/* AI Settings Tab */}
        {activeTab === 'ai' && <AiSettings token={token} />}

        {/* Projects Tab */}
        {activeTab === 'projects' && (
          <>
            {/* Repo Selector */}
            <div className="bg-[#1F1F1F] rounded-lg p-4 mb-6">
              <p className="text-gray-400 text-xs mb-2">GitHub Repo Sec</p>
              <div className="flex gap-2">
                <select
                  value={selectedRepo}
                  onChange={(e) => setSelectedRepo(e.target.value)}
                  className="flex-1 bg-black/30 text-white border border-gray-600 rounded px-3 py-2 text-sm"
                  disabled={loadingRepos}
                >
                  <option value="">
                    {loadingRepos ? 'Repolar yukleniyor...' : '-- Repo sec --'}
                  </option>
                  {githubRepos.map((repo) => {
                    const isAdded = addedRepoNames.has(repo.name)
                    return (
                      <option
                        key={repo.name}
                        value={repo.name}
                        disabled={isAdded}
                      >
                        {repo.name}
                        {repo.language ? ` (${repo.language})` : ''}
                        {isAdded ? ' — Eklendi' : ''}
                        {repo.description ? ` — ${repo.description.slice(0, 40)}` : ''}
                      </option>
                    )
                  })}
                </select>
                <button
                  onClick={handleAddRepo}
                  disabled={loading || !selectedRepo}
                  className="bg-blue-600 text-white px-4 py-2 rounded font-bold hover:bg-blue-700 disabled:opacity-50 whitespace-nowrap"
                >
                  {loading ? 'Analiz...' : '+ Ekle & Analiz'}
                </button>
              </div>
              {!loadingRepos && githubRepos.length > 0 && (
                <p className="text-gray-600 text-[10px] mt-2">
                  {githubRepos.length} repo bulundu, {addedRepoNames.size} tanesi eklenmis
                </p>
              )}
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
                onDelete={handleDeleteProject}
              />
            ))}

            {projects.length > 0 && (
              <div className="mt-6 pt-4 border-t border-gray-700 flex justify-end">
                <button
                  onClick={handleDeleteAll}
                  className="bg-red-900 text-red-300 px-4 py-2 rounded text-sm hover:bg-red-800"
                >
                  Tum Projeleri Sil ({projects.length})
                </button>
              </div>
            )}

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
