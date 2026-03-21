import { GITHUB_USERNAME } from './constants'

async function fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs = 10000): Promise<Response> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)
  try {
    return await fetch(url, { ...options, signal: controller.signal })
  } finally {
    clearTimeout(timeout)
  }
}

interface GitHubRepo {
  name: string
  full_name: string
  description: string | null
  html_url: string
  homepage: string | null
  language: string | null
  topics: string[]
  updated_at: string
  stargazers_count: number
}

interface GitHubLanguages {
  [language: string]: number
}

const headers: HeadersInit = {
  Accept: 'application/vnd.github.v3+json',
  ...(process.env.GITHUB_TOKEN
    ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` }
    : {}),
}

export async function fetchRepo(repoName: string): Promise<GitHubRepo> {
  const res = await fetchWithTimeout(
    `https://api.github.com/repos/${GITHUB_USERNAME}/${repoName}`,
    { headers }
  )
  if (!res.ok) throw new Error(`GitHub API error: ${res.status}`)
  return res.json()
}

export async function fetchReadme(repoName: string): Promise<string> {
  try {
    const res = await fetchWithTimeout(
      `https://api.github.com/repos/${GITHUB_USERNAME}/${repoName}/readme`,
      { headers: { ...headers, Accept: 'application/vnd.github.v3.raw' } }
    )
    if (!res.ok) return ''
    return res.text()
  } catch {
    return ''
  }
}

export async function fetchLanguages(repoName: string): Promise<GitHubLanguages> {
  const res = await fetchWithTimeout(
    `https://api.github.com/repos/${GITHUB_USERNAME}/${repoName}/languages`,
    { headers }
  )
  if (!res.ok) return {}
  return res.json()
}

export async function fetchAllRepos(): Promise<GitHubRepo[]> {
  // Use /user/repos for authenticated access (includes private repos)
  // Falls back to /users/:user/repos for unauthenticated
  const isAuthenticated = !!process.env.GITHUB_TOKEN
  const url = isAuthenticated
    ? `https://api.github.com/user/repos?per_page=100&sort=updated&affiliation=owner`
    : `https://api.github.com/users/${GITHUB_USERNAME}/repos?per_page=100&sort=updated`

  const res = await fetchWithTimeout(url, { headers })
  if (!res.ok) throw new Error(`GitHub API error: ${res.status}`)
  return res.json()
}

export async function fetchPackageJson(repoName: string): Promise<string> {
  try {
    const res = await fetchWithTimeout(
      `https://api.github.com/repos/${GITHUB_USERNAME}/${repoName}/contents/package.json`,
      { headers: { ...headers, Accept: 'application/vnd.github.v3.raw' } }
    )
    if (!res.ok) return ''
    return res.text()
  } catch {
    return ''
  }
}

export async function fetchFileTree(repoName: string): Promise<string> {
  try {
    const res = await fetchWithTimeout(
      `https://api.github.com/repos/${GITHUB_USERNAME}/${repoName}/git/trees/main?recursive=1`,
      { headers }
    )
    if (!res.ok) return ''
    const data = await res.json()
    const paths = (data.tree || [])
      .filter((t: { type: string }) => t.type === 'blob')
      .map((t: { path: string }) => t.path)
      .slice(0, 50)
    return paths.join('\n')
  } catch {
    return ''
  }
}

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}
