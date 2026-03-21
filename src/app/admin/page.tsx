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

  /* ── Login screen ── */
  if (!authenticated) {
    return (
      <main className="min-h-screen bg-surface flex items-center justify-center relative overflow-hidden">
        {/* Ambient glow */}
        <div
          className="pointer-events-none absolute inset-0 opacity-20"
          style={{ background: 'radial-gradient(ellipse at 50% 60%, #7e51ff 0%, transparent 60%)' }}
          aria-hidden="true"
        />

        <div className="glass-elevated rounded-2xl p-8 w-full max-w-sm relative z-10 glow-primary">
          <h1 className="font-heading text-2xl font-bold text-on-surface mb-1">
            VibeFlix Admin
          </h1>
          <p className="font-sans text-sm text-on-surface-variant mb-6">
            Devam etmek icin token giriniz
          </p>
          <input
            type="password"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="Admin token"
            className="glass-input w-full px-4 py-2.5 mb-4 font-sans"
            onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            autoComplete="current-password"
          />
          <button
            onClick={handleLogin}
            className="btn-gradient w-full py-2.5 rounded-xl font-heading font-bold text-sm"
          >
            Giris Yap
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

  const filterAccentClass: Record<string, string> = {
    ALL: 'text-primary border-primary/40 bg-primary/10',
    PENDING: 'text-yellow-400 border-yellow-400/40 bg-yellow-400/10',
    APPROVED: 'text-green-400 border-green-400/40 bg-green-400/10',
    REJECTED: 'text-[color:var(--error)] border-[color:var(--error)]/40 bg-[color:var(--error)]/10',
  }

  return (
    <main className="min-h-screen bg-surface relative overflow-x-hidden">
      {/* Ambient glow */}
      <div
        className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] opacity-10"
        style={{ background: 'radial-gradient(ellipse at center, #7e51ff 0%, transparent 70%)' }}
        aria-hidden="true"
      />

      {/* Glass Navbar */}
      <nav className="glass sticky top-0 z-50 px-6 py-4 flex items-center justify-between">
        <h1 className="font-heading text-xl font-bold text-gradient">
          VibeFlix Admin
        </h1>

        {/* Tab pills */}
        <div className="flex gap-1.5" role="tablist">
          {(['projects', 'categories', 'ai'] as const).map((tab) => {
            const label = { projects: 'Projeler', categories: 'Kategoriler', ai: 'AI Ayarlari' }[tab]
            const isActive = activeTab === tab
            return (
              <button
                key={tab}
                role="tab"
                aria-selected={isActive}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-1.5 rounded-full text-sm font-mono transition-all ${
                  isActive
                    ? 'bg-primary/15 text-primary border border-primary/30'
                    : 'text-on-surface-variant hover:text-on-surface glass'
                }`}
              >
                {label}
              </button>
            )
          })}
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-8 relative z-10">
        {/* Categories Tab */}
        {activeTab === 'categories' && <CategoryManager token={token} />}

        {/* AI Settings Tab */}
        {activeTab === 'ai' && <AiSettings token={token} />}

        {/* Projects Tab */}
        {activeTab === 'projects' && (
          <>
            {/* Repo selector */}
            <div className="glass-card p-5 mb-6">
              <p className="font-mono text-xs text-on-surface-variant mb-3 uppercase tracking-wider">
                GitHub Repo Sec
              </p>
              <div className="flex gap-3">
                <select
                  value={selectedRepo}
                  onChange={(e) => setSelectedRepo(e.target.value)}
                  className="glass-input flex-1 px-3 py-2 text-sm font-sans"
                  disabled={loadingRepos}
                >
                  <option value="">
                    {loadingRepos ? 'Repolar yukleniyor...' : '-- Repo sec --'}
                  </option>
                  {githubRepos.map((repo) => {
                    const isAdded = addedRepoNames.has(repo.name)
                    return (
                      <option key={repo.name} value={repo.name} disabled={isAdded}>
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
                  className="btn-gradient px-5 py-2 rounded-xl font-mono font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none whitespace-nowrap"
                >
                  {loading ? 'Analiz...' : '+ Ekle & Analiz'}
                </button>
              </div>
              {!loadingRepos && githubRepos.length > 0 && (
                <p className="font-mono text-[10px] text-on-surface-variant/50 mt-2.5">
                  {githubRepos.length} repo bulundu, {addedRepoNames.size} tanesi eklenmis
                </p>
              )}
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-4 gap-2 mb-6">
              {(['ALL', 'PENDING', 'APPROVED', 'REJECTED'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setFilter(s)}
                  className={`glass-card p-3 text-center transition-all ${
                    filter === s
                      ? filterAccentClass[s]
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  <p className="font-heading text-2xl font-bold">{counts[s]}</p>
                  <p className="font-mono text-[10px] uppercase tracking-wider mt-0.5">{s}</p>
                </button>
              ))}
            </div>

            {/* Project list */}
            {filtered.map((project) => (
              <AdminProjectCard
                key={project.id}
                project={project}
                token={token}
                onUpdate={fetchProjects}
                onDelete={handleDeleteProject}
              />
            ))}

            {/* Delete all */}
            {projects.length > 0 && (
              <div className="mt-8 pt-4 border-t border-white/5 flex justify-end">
                <button
                  onClick={handleDeleteAll}
                  className="glass px-4 py-2 rounded-xl text-sm font-mono text-[color:var(--error)] border-[color:var(--error)]/20 hover:bg-[color:var(--error)]/10 transition-all"
                >
                  Tum Projeleri Sil ({projects.length})
                </button>
              </div>
            )}

            {/* Empty state */}
            {filtered.length === 0 && (
              <p className="font-sans text-on-surface-variant text-center py-12">
                Bu filtrede proje yok
              </p>
            )}
          </>
        )}
      </div>
    </main>
  )
}
