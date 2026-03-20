# VibeFlix Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Netflix-style project catalog that auto-analyzes GitHub repos with AI, generates screenshots, and lets the owner approve before publishing.

**Architecture:** Hybrid Next.js 15 app with SSG/ISR for public pages and API routes for webhook/AI/admin operations. Supabase for data + storage. Claude API for AI analysis. Playwright for automated screenshots.

**Tech Stack:** Next.js 15 (App Router), TypeScript, Tailwind CSS, Framer Motion, Embla Carousel, Supabase, Claude API, Playwright

**Spec:** `docs/specs/2026-03-21-vibeflix-design.md`

---

## File Structure

```
VibeFlix/
├── src/
│   ├── app/
│   │   ├── layout.tsx                    # Root layout with fonts, metadata
│   │   ├── page.tsx                      # Main catalog page (SSG+ISR)
│   │   ├── globals.css                   # Tailwind + custom Netflix styles
│   │   ├── project/
│   │   │   └── [slug]/
│   │   │       └── page.tsx              # Project detail (SSG+ISR)
│   │   ├── admin/
│   │   │   └── page.tsx                  # Admin panel (client-side)
│   │   └── api/
│   │       ├── webhook/route.ts          # GitHub webhook receiver
│   │       ├── analyze/route.ts          # AI analysis trigger
│   │       ├── projects/route.ts         # CRUD for admin
│   │       ├── projects/[id]/route.ts    # Single project operations
│   │       └── revalidate/route.ts       # ISR revalidation
│   ├── components/
│   │   ├── HeroSection.tsx               # Featured project banner
│   │   ├── CategoryRow.tsx               # Horizontal scroll row
│   │   ├── ProjectCard.tsx               # Single project card with hover
│   │   ├── ScreenshotCarousel.tsx        # Embla-based image carousel
│   │   └── AdminProjectCard.tsx          # Admin review card
│   └── lib/
│       ├── types.ts                      # All TypeScript interfaces
│       ├── supabase-server.ts            # Server-side Supabase client
│       ├── supabase-browser.ts           # Browser-side Supabase client
│       ├── github.ts                     # GitHub API helpers
│       ├── claude.ts                     # Claude AI analysis
│       ├── auth.ts                       # Admin token verification
│       └── constants.ts                  # Default categories, config
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql        # DB schema
├── .env.local.example                    # Template for env vars
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## Chunk 1: Project Scaffolding & Database

### Task 1: Initialize Next.js Project

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `tailwind.config.ts`
- Create: `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/globals.css`

- [ ] **Step 1: Create Next.js app with TypeScript + Tailwind**

```bash
cd C:\Users\engin.coban\Projects\VibeFlix
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm
```

Select: Yes to all defaults. This will scaffold into existing directory.

- [ ] **Step 2: Install dependencies**

```bash
npm install @supabase/supabase-js @anthropic-ai/sdk framer-motion embla-carousel-react embla-carousel-autoplay
npm install -D @types/node
```

- [ ] **Step 3: Verify dev server starts**

```bash
npm run dev
```

Expected: Server starts at localhost:3000, default Next.js page shows.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: initialize Next.js 15 project with dependencies"
```

---

### Task 2: Environment Variables Setup

**Files:**
- Create: `.env.local.example`
- Modify: `.gitignore`

- [ ] **Step 1: Create env template**

Create `.env.local.example`:
```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# AI Analysis
ANTHROPIC_API_KEY=your-anthropic-key

# GitHub
GITHUB_WEBHOOK_SECRET=your-webhook-secret
GITHUB_TOKEN=your-github-pat

# Admin
ADMIN_TOKEN=your-admin-token
```

- [ ] **Step 2: Verify .gitignore includes .env.local**

Check that `.env.local` is in `.gitignore` (Next.js adds it by default).

- [ ] **Step 3: Commit**

```bash
git add .env.local.example .gitignore
git commit -m "chore: add environment variable template"
```

---

### Task 3: Supabase Schema

**Files:**
- Create: `supabase/migrations/001_initial_schema.sql`

- [ ] **Step 1: Write migration SQL**

Create `supabase/migrations/001_initial_schema.sql`:
```sql
-- Categories table
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  icon TEXT DEFAULT '',
  sort_order INT DEFAULT 0
);

-- Projects table
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  github_repo TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT DEFAULT '',
  category TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'NEW'
    CHECK (status IN ('NEW', 'ANALYZING', 'PENDING', 'APPROVED', 'REJECTED')),
  tech_stack TEXT[] DEFAULT '{}',
  demo_url TEXT,
  github_url TEXT NOT NULL,
  last_updated TIMESTAMPTZ,
  activity TEXT DEFAULT 'aktif'
    CHECK (activity IN ('aktif', 'arsiv', 'bakimda')),
  ai_trailer TEXT DEFAULT '',
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Screenshots table
CREATE TABLE screenshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  caption TEXT DEFAULT '',
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed default categories
INSERT INTO categories (name, display_name, icon, sort_order) VALUES
  ('sap-erp', 'SAP / ERP Entegrasyonlari', '🏢', 1),
  ('finans', 'Finans & Yonetim', '💰', 2),
  ('ai-araclar', 'AI Araclari', '🤖', 3),
  ('web-app', 'Web Uygulamalari', '🌐', 4),
  ('utility', 'Utility & Araclar', '🔧', 5),
  ('mobile', 'Mobil Uygulamalar', '📱', 6);

-- Indexes
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_category ON projects(category);
CREATE INDEX idx_projects_slug ON projects(slug);
CREATE INDEX idx_screenshots_project ON screenshots(project_id);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

- [ ] **Step 2: Apply migration to Supabase**

Go to Supabase Dashboard → SQL Editor → paste and run the migration.
Or if Supabase CLI is available:
```bash
npx supabase db push
```

- [ ] **Step 3: Create Supabase Storage bucket**

In Supabase Dashboard → Storage → Create bucket named `screenshots` with public access.

- [ ] **Step 4: Commit**

```bash
git add supabase/
git commit -m "feat: add database schema with categories, projects, screenshots"
```

---

### Task 4: TypeScript Types & Supabase Clients

**Files:**
- Create: `src/lib/types.ts`
- Create: `src/lib/supabase-server.ts`
- Create: `src/lib/supabase-browser.ts`
- Create: `src/lib/constants.ts`
- Create: `src/lib/auth.ts`

- [ ] **Step 1: Define TypeScript types**

Create `src/lib/types.ts`:
```typescript
export type ProjectStatus = 'NEW' | 'ANALYZING' | 'PENDING' | 'APPROVED' | 'REJECTED'
export type ActivityStatus = 'aktif' | 'arsiv' | 'bakimda'

export interface Project {
  id: string
  github_repo: string
  name: string
  slug: string
  description: string
  category: string
  status: ProjectStatus
  tech_stack: string[]
  demo_url: string | null
  github_url: string
  last_updated: string | null
  activity: ActivityStatus
  ai_trailer: string
  sort_order: number
  created_at: string
  updated_at: string
  screenshots?: Screenshot[]
}

export interface Screenshot {
  id: string
  project_id: string
  image_url: string
  caption: string
  sort_order: number
  created_at: string
}

export interface Category {
  id: string
  name: string
  display_name: string
  icon: string
  sort_order: number
}

export interface AiAnalysisResult {
  description: string
  category: string
  ai_trailer: string
  activity: ActivityStatus
  tech_stack: string[]
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}
```

- [ ] **Step 2: Create Supabase server client**

Create `src/lib/supabase-server.ts`:
```typescript
import { createClient } from '@supabase/supabase-js'

export function createServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    throw new Error('Missing Supabase environment variables')
  }

  return createClient(url, key)
}
```

- [ ] **Step 3: Create Supabase browser client**

Create `src/lib/supabase-browser.ts`:
```typescript
import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(url, key)
```

- [ ] **Step 4: Create constants**

Create `src/lib/constants.ts`:
```typescript
export const DEFAULT_CATEGORIES = [
  { name: 'sap-erp', display_name: 'SAP / ERP Entegrasyonlari', icon: '🏢' },
  { name: 'finans', display_name: 'Finans & Yonetim', icon: '💰' },
  { name: 'ai-araclar', display_name: 'AI Araclari', icon: '🤖' },
  { name: 'web-app', display_name: 'Web Uygulamalari', icon: '🌐' },
  { name: 'utility', display_name: 'Utility & Araclar', icon: '🔧' },
  { name: 'mobile', display_name: 'Mobil Uygulamalar', icon: '📱' },
] as const

export const GITHUB_USERNAME = 'sokrateng'
export const REVALIDATE_INTERVAL = 3600 // 1 hour
```

- [ ] **Step 5: Create auth helper**

Create `src/lib/auth.ts`:
```typescript
import { NextRequest } from 'next/server'

export function verifyAdminToken(request: NextRequest): boolean {
  const token = request.headers.get('Authorization')?.replace('Bearer ', '')
  return token === process.env.ADMIN_TOKEN
}
```

- [ ] **Step 6: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 7: Commit**

```bash
git add src/lib/
git commit -m "feat: add TypeScript types, Supabase clients, auth helper"
```

---

## Chunk 2: API Routes (Backend)

### Task 5: GitHub API Helper

**Files:**
- Create: `src/lib/github.ts`

- [ ] **Step 1: Write GitHub helper**

Create `src/lib/github.ts`:
```typescript
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
```

- [ ] **Step 2: Verify compiles**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/github.ts
git commit -m "feat: add GitHub API helper with repo, readme, languages fetch"
```

---

### Task 6: Claude AI Analysis Helper

**Files:**
- Create: `src/lib/claude.ts`

- [ ] **Step 1: Write Claude analysis helper**

Create `src/lib/claude.ts`:
```typescript
import Anthropic from '@anthropic-ai/sdk'
import type { AiAnalysisResult } from './types'
import { DEFAULT_CATEGORIES } from './constants'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export async function analyzeRepo(params: {
  readme: string
  languages: Record<string, number>
  description: string | null
  repoName: string
}): Promise<AiAnalysisResult> {
  const categoryNames = DEFAULT_CATEGORIES.map((c) => c.name).join(', ')
  const langList = Object.keys(params.languages).join(', ')

  const message = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: `Analyze this GitHub repository and return JSON.

Repository: ${params.repoName}
Description: ${params.description || 'None'}
Languages: ${langList}
README (first 2000 chars):
${params.readme.slice(0, 2000)}

Return ONLY valid JSON with these fields:
{
  "description": "1-2 sentence Turkish description of what this project does",
  "category": "one of: ${categoryNames}",
  "ai_trailer": "3-4 sentence engaging Turkish summary, like a Netflix trailer",
  "activity": "aktif or arsiv (based on how maintained it looks)",
  "tech_stack": ["array", "of", "technologies", "used"]
}`,
      },
    ],
  })

  const text =
    message.content[0].type === 'text' ? message.content[0].text : ''
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    throw new Error('AI response did not contain valid JSON')
  }

  return JSON.parse(jsonMatch[0]) as AiAnalysisResult
}
```

- [ ] **Step 2: Verify compiles**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/claude.ts
git commit -m "feat: add Claude AI analysis helper for repo analysis"
```

---

### Task 7: Webhook API Route

**Files:**
- Create: `src/app/api/webhook/route.ts`

- [ ] **Step 1: Write webhook handler**

Create `src/app/api/webhook/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { createServerClient } from '@/lib/supabase-server'
import { fetchRepo, fetchReadme, fetchLanguages, slugify } from '@/lib/github'
import { analyzeRepo } from '@/lib/claude'
import type { ApiResponse } from '@/lib/types'

function verifyWebhookSignature(
  payload: string,
  signature: string | null
): boolean {
  if (!signature || !process.env.GITHUB_WEBHOOK_SECRET) return false
  const expected = `sha256=${crypto
    .createHmac('sha256', process.env.GITHUB_WEBHOOK_SECRET)
    .update(payload)
    .digest('hex')}`
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
}

export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse<{ id: string }>>> {
  try {
    const body = await request.text()
    const signature = request.headers.get('x-hub-signature-256')

    if (!verifyWebhookSignature(body, signature)) {
      return NextResponse.json(
        { success: false, error: 'Invalid signature' },
        { status: 401 }
      )
    }

    const payload = JSON.parse(body)
    const repoName = payload.repository?.name
    if (!repoName) {
      return NextResponse.json(
        { success: false, error: 'No repository in payload' },
        { status: 400 }
      )
    }

    const supabase = createServerClient()

    // Check if already exists
    const { data: existing } = await supabase
      .from('projects')
      .select('id')
      .eq('github_repo', payload.repository.full_name)
      .single()

    if (existing) {
      return NextResponse.json({
        success: true,
        data: { id: existing.id },
      })
    }

    // Fetch repo data
    const [repo, readme, languages] = await Promise.all([
      fetchRepo(repoName),
      fetchReadme(repoName),
      fetchLanguages(repoName),
    ])

    // Save as ANALYZING
    const { data: project, error: insertError } = await supabase
      .from('projects')
      .insert({
        github_repo: repo.full_name,
        name: repo.name,
        slug: slugify(repo.name),
        github_url: repo.html_url,
        demo_url: repo.homepage || null,
        last_updated: repo.updated_at,
        status: 'ANALYZING',
      })
      .select('id')
      .single()

    if (insertError || !project) {
      throw new Error(`Insert failed: ${insertError?.message}`)
    }

    // AI Analysis (async - don't block webhook response)
    analyzeRepo({
      readme,
      languages,
      description: repo.description,
      repoName: repo.name,
    })
      .then(async (analysis) => {
        await supabase
          .from('projects')
          .update({
            description: analysis.description,
            category: analysis.category,
            ai_trailer: analysis.ai_trailer,
            activity: analysis.activity,
            tech_stack: analysis.tech_stack,
            status: 'PENDING',
          })
          .eq('id', project.id)
      })
      .catch(async (err) => {
        console.error('AI analysis failed:', err)
        await supabase
          .from('projects')
          .update({ status: 'PENDING' })
          .eq('id', project.id)
      })

    return NextResponse.json({
      success: true,
      data: { id: project.id },
    })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

- [ ] **Step 2: Verify compiles**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add src/app/api/webhook/
git commit -m "feat: add GitHub webhook handler with AI analysis pipeline"
```

---

### Task 8: Admin API Routes

**Files:**
- Create: `src/app/api/projects/route.ts`
- Create: `src/app/api/projects/[id]/route.ts`
- Create: `src/app/api/analyze/route.ts`
- Create: `src/app/api/revalidate/route.ts`

- [ ] **Step 1: Write projects list/create route**

Create `src/app/api/projects/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { verifyAdminToken } from '@/lib/auth'
import type { ApiResponse, Project } from '@/lib/types'

export async function GET(
  request: NextRequest
): Promise<NextResponse<ApiResponse<Project[]>>> {
  if (!verifyAdminToken(request)) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    )
  }

  const supabase = createServerClient()
  const status = request.nextUrl.searchParams.get('status')

  let query = supabase
    .from('projects')
    .select('*, screenshots(*)')
    .order('created_at', { ascending: false })

  if (status) {
    query = query.eq('status', status)
  }

  const { data, error } = await query

  if (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }

  return NextResponse.json({ success: true, data: data as Project[] })
}
```

- [ ] **Step 2: Write single project route (update/delete)**

Create `src/app/api/projects/[id]/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { verifyAdminToken } from '@/lib/auth'
import type { ApiResponse, Project } from '@/lib/types'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<Project>>> {
  if (!verifyAdminToken(request)) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    )
  }

  const { id } = await params
  const body = await request.json()
  const supabase = createServerClient()

  const { data, error } = await supabase
    .from('projects')
    .update(body)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }

  return NextResponse.json({ success: true, data: data as Project })
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<null>>> {
  if (!verifyAdminToken(request)) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    )
  }

  const { id } = await params
  const supabase = createServerClient()

  const { error } = await supabase.from('projects').delete().eq('id', id)

  if (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }

  return NextResponse.json({ success: true })
}
```

- [ ] **Step 3: Write manual analyze route**

Create `src/app/api/analyze/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { verifyAdminToken } from '@/lib/auth'
import { fetchRepo, fetchReadme, fetchLanguages, slugify } from '@/lib/github'
import { analyzeRepo } from '@/lib/claude'
import type { ApiResponse } from '@/lib/types'

export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse<{ id: string }>>> {
  if (!verifyAdminToken(request)) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    )
  }

  try {
    const { repoName } = await request.json()
    if (!repoName) {
      return NextResponse.json(
        { success: false, error: 'repoName required' },
        { status: 400 }
      )
    }

    const supabase = createServerClient()

    const [repo, readme, languages] = await Promise.all([
      fetchRepo(repoName),
      fetchReadme(repoName),
      fetchLanguages(repoName),
    ])

    const analysis = await analyzeRepo({
      readme,
      languages,
      description: repo.description,
      repoName: repo.name,
    })

    const { data, error } = await supabase
      .from('projects')
      .upsert(
        {
          github_repo: repo.full_name,
          name: repo.name,
          slug: slugify(repo.name),
          description: analysis.description,
          category: analysis.category,
          status: 'PENDING',
          tech_stack: analysis.tech_stack,
          demo_url: repo.homepage || null,
          github_url: repo.html_url,
          last_updated: repo.updated_at,
          activity: analysis.activity,
          ai_trailer: analysis.ai_trailer,
        },
        { onConflict: 'github_repo' }
      )
      .select('id')
      .single()

    if (error || !data) {
      throw new Error(`Upsert failed: ${error?.message}`)
    }

    return NextResponse.json({ success: true, data: { id: data.id } })
  } catch (error) {
    console.error('Analyze error:', error)
    return NextResponse.json(
      { success: false, error: 'Analysis failed' },
      { status: 500 }
    )
  }
}
```

- [ ] **Step 4: Write revalidate route**

Create `src/app/api/revalidate/route.ts`:
```typescript
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
```

- [ ] **Step 5: Verify all compiles**

```bash
npx tsc --noEmit
```

- [ ] **Step 6: Commit**

```bash
git add src/app/api/
git commit -m "feat: add admin API routes - projects CRUD, analyze, revalidate"
```

---

## Chunk 3: Frontend Components

### Task 9: Netflix-Style Global Styles

**Files:**
- Modify: `src/app/globals.css`
- Modify: `tailwind.config.ts`

- [ ] **Step 1: Update Tailwind config with Netflix theme**

Replace `tailwind.config.ts`:
```typescript
import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'vibe-dark': '#141414',
        'vibe-red': '#E50914',
        'vibe-gray': '#1F1F1F',
        'vibe-light': '#E5E5E5',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
export default config
```

- [ ] **Step 2: Update globals.css**

Replace `src/app/globals.css`:
```css
@import "tailwindcss";

:root {
  --background: #141414;
  --foreground: #e5e5e5;
}

body {
  background: var(--background);
  color: var(--foreground);
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
}

/* Hide scrollbar for category rows */
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
```

- [ ] **Step 3: Commit**

```bash
git add tailwind.config.ts src/app/globals.css
git commit -m "feat: add Netflix-style dark theme and custom animations"
```

---

### Task 10: ProjectCard Component

**Files:**
- Create: `src/components/ProjectCard.tsx`

- [ ] **Step 1: Write ProjectCard**

Create `src/components/ProjectCard.tsx`:
```typescript
'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import type { Project } from '@/lib/types'

interface ProjectCardProps {
  project: Project
}

export function ProjectCard({ project }: ProjectCardProps) {
  const thumbnail =
    project.screenshots?.[0]?.image_url || '/placeholder.png'

  return (
    <Link href={`/project/${project.slug}`}>
      <motion.div
        className="relative min-w-[250px] h-[140px] rounded-md overflow-hidden cursor-pointer group"
        whileHover={{ scale: 1.05, zIndex: 10 }}
        transition={{ duration: 0.2 }}
      >
        <img
          src={thumbnail}
          alt={project.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="absolute bottom-0 left-0 right-0 p-3">
            <h3 className="text-white text-sm font-bold truncate">
              {project.name}
            </h3>
            <p className="text-gray-300 text-xs truncate">
              {project.description}
            </p>
            <div className="flex gap-1 mt-1 flex-wrap">
              {project.tech_stack.slice(0, 3).map((tech) => (
                <span
                  key={tech}
                  className="text-[10px] bg-white/20 text-white px-1.5 py-0.5 rounded"
                >
                  {tech}
                </span>
              ))}
            </div>
          </div>
        </div>
        {project.activity === 'aktif' && (
          <span className="absolute top-2 right-2 w-2 h-2 bg-green-500 rounded-full" />
        )}
      </motion.div>
    </Link>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/ProjectCard.tsx
git commit -m "feat: add ProjectCard with Netflix hover effect"
```

---

### Task 11: CategoryRow Component

**Files:**
- Create: `src/components/CategoryRow.tsx`

- [ ] **Step 1: Write CategoryRow**

Create `src/components/CategoryRow.tsx`:
```typescript
'use client'

import { useRef } from 'react'
import { motion } from 'framer-motion'
import { ProjectCard } from './ProjectCard'
import type { Project } from '@/lib/types'

interface CategoryRowProps {
  title: string
  icon: string
  projects: Project[]
}

export function CategoryRow({ title, icon, projects }: CategoryRowProps) {
  const rowRef = useRef<HTMLDivElement>(null)

  const scroll = (direction: 'left' | 'right') => {
    if (!rowRef.current) return
    const amount = direction === 'left' ? -400 : 400
    rowRef.current.scrollBy({ left: amount, behavior: 'smooth' })
  }

  if (projects.length === 0) return null

  return (
    <motion.section
      className="mb-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <h2 className="text-xl font-bold text-white mb-3 px-4">
        {icon} {title}
      </h2>
      <div className="relative group/row">
        <button
          onClick={() => scroll('left')}
          className="absolute left-0 top-0 bottom-0 z-10 w-10 bg-black/50 text-white opacity-0 group-hover/row:opacity-100 transition-opacity flex items-center justify-center"
        >
          ◀
        </button>
        <div
          ref={rowRef}
          className="flex gap-2 overflow-x-auto scrollbar-hide px-4 py-2"
        >
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
        <button
          onClick={() => scroll('right')}
          className="absolute right-0 top-0 bottom-0 z-10 w-10 bg-black/50 text-white opacity-0 group-hover/row:opacity-100 transition-opacity flex items-center justify-center"
        >
          ▶
        </button>
      </div>
    </motion.section>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/CategoryRow.tsx
git commit -m "feat: add CategoryRow with horizontal scroll and navigation"
```

---

### Task 12: HeroSection Component

**Files:**
- Create: `src/components/HeroSection.tsx`

- [ ] **Step 1: Write HeroSection**

Create `src/components/HeroSection.tsx`:
```typescript
'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import type { Project } from '@/lib/types'

interface HeroSectionProps {
  project: Project
}

export function HeroSection({ project }: HeroSectionProps) {
  const bgImage =
    project.screenshots?.[0]?.image_url || '/placeholder.png'

  return (
    <section className="relative h-[60vh] min-h-[400px] mb-8">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${bgImage})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-vibe-dark via-vibe-dark/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-vibe-dark/80 to-transparent" />
      </div>
      <motion.div
        className="relative h-full flex flex-col justify-end p-8 max-w-2xl"
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8 }}
      >
        <h1 className="text-5xl font-bold text-white mb-3">
          {project.name}
        </h1>
        <p className="text-lg text-gray-200 mb-4 line-clamp-3">
          {project.ai_trailer || project.description}
        </p>
        <div className="flex gap-3">
          <Link
            href={`/project/${project.slug}`}
            className="bg-white text-black font-bold px-6 py-2 rounded hover:bg-gray-200 transition"
          >
            ▶ Detaylar
          </Link>
          {project.demo_url && (
            <a
              href={project.demo_url}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-gray-500/70 text-white font-bold px-6 py-2 rounded hover:bg-gray-500 transition"
            >
              🔗 Demo
            </a>
          )}
        </div>
      </motion.div>
    </section>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/HeroSection.tsx
git commit -m "feat: add HeroSection with gradient overlay and CTA buttons"
```

---

### Task 13: ScreenshotCarousel Component

**Files:**
- Create: `src/components/ScreenshotCarousel.tsx`

- [ ] **Step 1: Write ScreenshotCarousel**

Create `src/components/ScreenshotCarousel.tsx`:
```typescript
'use client'

import useEmblaCarousel from 'embla-carousel-react'
import Autoplay from 'embla-carousel-autoplay'
import { useCallback } from 'react'
import type { Screenshot } from '@/lib/types'

interface ScreenshotCarouselProps {
  screenshots: Screenshot[]
}

export function ScreenshotCarousel({
  screenshots,
}: ScreenshotCarouselProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true }, [
    Autoplay({ delay: 3000, stopOnInteraction: true }),
  ])

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi])
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi])

  if (screenshots.length === 0) {
    return (
      <div className="w-full h-[400px] bg-vibe-gray rounded-lg flex items-center justify-center text-gray-500">
        Ekran goruntusu yok
      </div>
    )
  }

  return (
    <div className="relative group">
      <div className="overflow-hidden rounded-lg" ref={emblaRef}>
        <div className="flex">
          {screenshots.map((ss) => (
            <div key={ss.id} className="flex-[0_0_100%] min-w-0">
              <img
                src={ss.image_url}
                alt={ss.caption || 'Screenshot'}
                className="w-full h-[400px] object-cover"
              />
              {ss.caption && (
                <p className="text-center text-gray-400 text-sm mt-2">
                  {ss.caption}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
      {screenshots.length > 1 && (
        <>
          <button
            onClick={scrollPrev}
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/60 text-white w-10 h-10 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
          >
            ◀
          </button>
          <button
            onClick={scrollNext}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/60 text-white w-10 h-10 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
          >
            ▶
          </button>
        </>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/ScreenshotCarousel.tsx
git commit -m "feat: add ScreenshotCarousel with autoplay and navigation"
```

---

## Chunk 4: Pages

### Task 14: Main Catalog Page

**Files:**
- Modify: `src/app/layout.tsx`
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Update root layout**

Replace `src/app/layout.tsx`:
```typescript
import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'VibeFlix - Project Catalog',
  description: 'Netflix-style catalog of vibe coding projects by sokrateng',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="tr">
      <body className="bg-vibe-dark min-h-screen">{children}</body>
    </html>
  )
}
```

- [ ] **Step 2: Write main catalog page**

Replace `src/app/page.tsx`:
```typescript
import { createServerClient } from '@/lib/supabase-server'
import { HeroSection } from '@/components/HeroSection'
import { CategoryRow } from '@/components/CategoryRow'
import type { Project, Category } from '@/lib/types'
import { REVALIDATE_INTERVAL } from '@/lib/constants'

export const revalidate = REVALIDATE_INTERVAL

async function getPublishedProjects(): Promise<Project[]> {
  const supabase = createServerClient()
  const { data } = await supabase
    .from('projects')
    .select('*, screenshots(*)')
    .eq('status', 'APPROVED')
    .order('sort_order', { ascending: true })
  return (data as Project[]) || []
}

async function getCategories(): Promise<Category[]> {
  const supabase = createServerClient()
  const { data } = await supabase
    .from('categories')
    .select('*')
    .order('sort_order', { ascending: true })
  return (data as Category[]) || []
}

export default async function HomePage() {
  const [projects, categories] = await Promise.all([
    getPublishedProjects(),
    getCategories(),
  ])

  const heroProject = projects[0]
  const projectsByCategory = categories
    .map((cat) => ({
      ...cat,
      projects: projects.filter((p) => p.category === cat.name),
    }))
    .filter((cat) => cat.projects.length > 0)

  return (
    <main className="min-h-screen">
      <header className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-b from-black/80 to-transparent px-4 py-4">
        <h1 className="text-2xl font-bold text-vibe-red">VibeFlix</h1>
      </header>

      {heroProject && <HeroSection project={heroProject} />}

      <div className="relative z-10 -mt-8">
        {projectsByCategory.map((cat) => (
          <CategoryRow
            key={cat.id}
            title={cat.display_name}
            icon={cat.icon}
            projects={cat.projects}
          />
        ))}
      </div>

      {projects.length === 0 && (
        <div className="flex items-center justify-center h-[60vh] text-gray-500 text-xl">
          Henuz onaylanmis proje yok
        </div>
      )}
    </main>
  )
}
```

- [ ] **Step 3: Verify build**

```bash
npm run build
```

- [ ] **Step 4: Commit**

```bash
git add src/app/layout.tsx src/app/page.tsx
git commit -m "feat: add main catalog page with hero and category rows"
```

---

### Task 15: Project Detail Page

**Files:**
- Create: `src/app/project/[slug]/page.tsx`

- [ ] **Step 1: Write detail page**

Create `src/app/project/[slug]/page.tsx`:
```typescript
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createServerClient } from '@/lib/supabase-server'
import { ScreenshotCarousel } from '@/components/ScreenshotCarousel'
import type { Project } from '@/lib/types'
import { REVALIDATE_INTERVAL } from '@/lib/constants'

export const revalidate = REVALIDATE_INTERVAL

interface PageProps {
  params: Promise<{ slug: string }>
}

async function getProject(slug: string): Promise<Project | null> {
  const supabase = createServerClient()
  const { data } = await supabase
    .from('projects')
    .select('*, screenshots(*)')
    .eq('slug', slug)
    .eq('status', 'APPROVED')
    .single()
  return data as Project | null
}

export default async function ProjectPage({ params }: PageProps) {
  const { slug } = await params
  const project = await getProject(slug)

  if (!project) notFound()

  const screenshots = project.screenshots || []
  const updatedDate = project.last_updated
    ? new Date(project.last_updated).toLocaleDateString('tr-TR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : 'Bilinmiyor'

  const activityLabel = {
    aktif: '🟢 Aktif',
    arsiv: '🔴 Arsiv',
    bakimda: '🟡 Bakimda',
  }[project.activity]

  return (
    <main className="min-h-screen bg-vibe-dark">
      <nav className="px-6 py-4 flex items-center justify-between">
        <Link
          href="/"
          className="text-gray-400 hover:text-white transition"
        >
          ← Geri
        </Link>
        <div className="flex gap-3">
          <a
            href={project.github_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-400 hover:text-white transition"
          >
            GitHub
          </a>
          {project.demo_url && (
            <a
              href={project.demo_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-white transition"
            >
              Demo
            </a>
          )}
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 pb-16">
        <h1 className="text-4xl font-bold text-white mb-2">
          {project.name}
        </h1>
        <p className="text-lg text-gray-300 mb-6">{project.description}</p>

        <ScreenshotCarousel screenshots={screenshots} />

        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="bg-vibe-gray rounded-lg p-4">
            <span className="text-gray-500">Kategori</span>
            <p className="text-white mt-1">{project.category}</p>
          </div>
          <div className="bg-vibe-gray rounded-lg p-4">
            <span className="text-gray-500">Son Guncelleme</span>
            <p className="text-white mt-1">{updatedDate}</p>
          </div>
          <div className="bg-vibe-gray rounded-lg p-4">
            <span className="text-gray-500">Durum</span>
            <p className="text-white mt-1">{activityLabel}</p>
          </div>
        </div>

        {project.tech_stack.length > 0 && (
          <div className="mt-6 flex gap-2 flex-wrap">
            {project.tech_stack.map((tech) => (
              <span
                key={tech}
                className="bg-vibe-gray text-gray-300 px-3 py-1 rounded-full text-sm"
              >
                {tech}
              </span>
            ))}
          </div>
        )}

        {project.ai_trailer && (
          <section className="mt-8 bg-vibe-gray rounded-lg p-6">
            <h2 className="text-xl font-bold text-white mb-3">
              🎬 Proje Fragmani
            </h2>
            <p className="text-gray-300 leading-relaxed">
              {project.ai_trailer}
            </p>
          </section>
        )}
      </div>
    </main>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/project/
git commit -m "feat: add project detail page with carousel and AI trailer"
```

---

### Task 16: Admin Panel Page

**Files:**
- Create: `src/components/AdminProjectCard.tsx`
- Create: `src/app/admin/page.tsx`

- [ ] **Step 1: Write AdminProjectCard**

Create `src/components/AdminProjectCard.tsx`:
```typescript
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
  const statusColors = {
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
    <div className="bg-vibe-gray rounded-lg p-4 mb-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-white font-bold">{project.name}</h3>
        <span
          className={`${statusColors[project.status]} text-white text-xs px-2 py-1 rounded`}
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
```

- [ ] **Step 2: Write admin page**

Create `src/app/admin/page.tsx`:
```typescript
'use client'

import { useState, useEffect, useCallback } from 'react'
import { AdminProjectCard } from '@/components/AdminProjectCard'
import type { Project } from '@/lib/types'

export default function AdminPage() {
  const [token, setToken] = useState('')
  const [authenticated, setAuthenticated] = useState(false)
  const [projects, setProjects] = useState<Project[]>([])
  const [filter, setFilter] = useState<string>('ALL')
  const [newRepoName, setNewRepoName] = useState('')
  const [loading, setLoading] = useState(false)

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
      <main className="min-h-screen bg-vibe-dark flex items-center justify-center">
        <div className="bg-vibe-gray rounded-lg p-8 w-full max-w-sm">
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
            className="w-full bg-vibe-red text-white py-2 rounded font-bold hover:bg-red-700"
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

  const counts = {
    ALL: projects.length,
    PENDING: projects.filter((p) => p.status === 'PENDING').length,
    APPROVED: projects.filter((p) => p.status === 'APPROVED').length,
    REJECTED: projects.filter((p) => p.status === 'REJECTED').length,
  }

  return (
    <main className="min-h-screen bg-vibe-dark p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-6">
          VibeFlix Admin
        </h1>

        {/* Add repo */}
        <div className="bg-vibe-gray rounded-lg p-4 mb-6 flex gap-2">
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

        {/* Filters */}
        <div className="flex gap-2 mb-6">
          {(['ALL', 'PENDING', 'APPROVED', 'REJECTED'] as const).map(
            (s) => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`px-3 py-1 rounded text-sm ${
                  filter === s
                    ? 'bg-vibe-red text-white'
                    : 'bg-vibe-gray text-gray-400 hover:text-white'
                }`}
              >
                {s} ({counts[s]})
              </button>
            )
          )}
        </div>

        {/* Projects */}
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
      </div>
    </main>
  )
}
```

- [ ] **Step 3: Verify build**

```bash
npm run build
```

- [ ] **Step 4: Commit**

```bash
git add src/components/AdminProjectCard.tsx src/app/admin/
git commit -m "feat: add admin panel with project review and manual repo analysis"
```

---

## Chunk 5: Deployment & Integration

### Task 17: Next.js Config & Placeholder

**Files:**
- Modify: `next.config.ts`
- Create: `public/placeholder.png`

- [ ] **Step 1: Update Next.js config for images**

Replace `next.config.ts`:
```typescript
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'opengraph.githubassets.com',
      },
    ],
  },
}

export default nextConfig
```

- [ ] **Step 2: Create placeholder image**

Create a simple dark placeholder PNG (300x170) or download one. Save to `public/placeholder.png`.

Alternatively, use a data URL fallback in components (already handled with gray bg).

- [ ] **Step 3: Commit**

```bash
git add next.config.ts public/
git commit -m "chore: configure image domains and add placeholder"
```

---

### Task 18: Vercel Deployment

- [ ] **Step 1: Push to GitHub**

```bash
cd C:\Users\engin.coban\Projects\VibeFlix
git push origin main
```

- [ ] **Step 2: Connect to Vercel**

1. Go to vercel.com → Import Project → Select `sokrateng/VibeFlix`
2. Framework: Next.js (auto-detected)
3. Add Environment Variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `ANTHROPIC_API_KEY`
   - `GITHUB_WEBHOOK_SECRET`
   - `GITHUB_TOKEN`
   - `ADMIN_TOKEN`
4. Deploy

- [ ] **Step 3: Configure GitHub Webhook**

1. Go to GitHub → Settings → Webhooks → Add webhook
2. Payload URL: `https://vibeflix.vercel.app/api/webhook`
3. Content type: `application/json`
4. Secret: Same as `GITHUB_WEBHOOK_SECRET`
5. Events: Select "Pushes" and "Repositories" (create)

- [ ] **Step 4: Test end-to-end**

1. Visit `https://vibeflix.vercel.app` — should show empty state
2. Visit `https://vibeflix.vercel.app/admin` — login with token
3. Add a repo manually (e.g., "SAP_Gateway")
4. Wait for AI analysis
5. Approve the project
6. Check main page — project should appear

---

### Task 19: Seed Existing Repos

- [ ] **Step 1: Use admin panel to add existing repos**

Go to `/admin` and add these repos one by one (or batch via API):

Priority repos (real projects):
1. SAP_Gateway
2. penta-elastic-mcp
3. PentaDepom_Mutabakat
4. Microsoft-ESD-QR
5. penta-service-manager
6. aile-butce-takip
7. penta-project-tracker
8. SAP_EWA_Reports_Analizer
9. kredi-yonetim
10. tokenizer-chrome-extension
11. FreelanceApp
12. Destek_Talep
13. kargo-maliyet-app
14. fifo-pyp

- [ ] **Step 2: Review and approve each one**

Check AI descriptions, categories, and trailers. Edit where needed. Approve.

- [ ] **Step 3: Verify catalog**

Visit main page — all approved projects should appear in their categories.

---

## Summary

| Chunk | Tasks | Description |
|-------|-------|-------------|
| 1 | 1-4 | Project setup, DB schema, types, clients |
| 2 | 5-8 | API routes: GitHub, Claude, webhook, admin |
| 3 | 9-13 | Frontend components: cards, rows, hero, carousel |
| 4 | 14-16 | Pages: catalog, detail, admin |
| 5 | 17-19 | Deploy to Vercel, webhook setup, seed data |

**Total: 19 tasks, ~50 steps**
