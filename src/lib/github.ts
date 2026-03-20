import { GITHUB_USERNAME } from './constants'

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
  const res = await fetch(
    `https://api.github.com/repos/${GITHUB_USERNAME}/${repoName}`,
    { headers }
  )
  if (!res.ok) throw new Error(`GitHub API error: ${res.status}`)
  return res.json()
}

export async function fetchReadme(repoName: string): Promise<string> {
  try {
    const res = await fetch(
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
  const res = await fetch(
    `https://api.github.com/repos/${GITHUB_USERNAME}/${repoName}/languages`,
    { headers }
  )
  if (!res.ok) return {}
  return res.json()
}

export async function fetchAllRepos(): Promise<GitHubRepo[]> {
  const res = await fetch(
    `https://api.github.com/users/${GITHUB_USERNAME}/repos?per_page=100&sort=updated`,
    { headers }
  )
  if (!res.ok) throw new Error(`GitHub API error: ${res.status}`)
  return res.json()
}

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}
