import { createServerClient } from '@/lib/supabase-server'
import { HeroSlider } from '@/components/HeroSlider'
import { CategoryRow } from '@/components/CategoryRow'
import Link from 'next/link'
import type { Project, Category } from '@/lib/types'

export const dynamic = 'force-dynamic'

async function getPublishedProjects(): Promise<Project[]> {
  const supabase = createServerClient()
  const { data } = await supabase
    .from('projects')
    .select('*, screenshots(*), attachments(*)')
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

  const featuredProjects = projects
    .filter((p) => p.featured)
    .sort((a, b) => a.featured_order - b.featured_order)

  // If no featured selected, use the 3 most recent
  const heroProjects =
    featuredProjects.length > 0
      ? featuredProjects
      : projects.slice(0, 3)

  const projectsByCategory = categories
    .map((cat) => ({
      ...cat,
      projects: projects.filter((p) => p.category === cat.name),
    }))
    .filter((cat) => cat.projects.length > 0)

  return (
    <main className="min-h-screen bg-surface">
      {/* Glassmorphism fixed navbar */}
      <header className="fixed top-0 left-0 right-0 z-50 glass border-b border-[rgba(72,71,77,0.15)]">
        <div className="flex items-center justify-between px-6 py-3 max-w-screen-2xl mx-auto">
          <h1 className="font-heading text-2xl font-bold text-gradient tracking-tight">
            VibeFlix
          </h1>
          <nav className="flex items-center gap-4">
            <Link
              href="/admin"
              className="font-mono text-sm text-on-surface-variant hover:text-on-surface transition-colors duration-200"
            >
              Admin
            </Link>
          </nav>
        </div>
      </header>

      {/* Decorative ambient glow orbs behind hero */}
      <div
        className="fixed inset-0 pointer-events-none overflow-hidden"
        aria-hidden="true"
      >
        <div
          className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full opacity-20 animate-[glow-pulse_6s_ease-in-out_infinite]"
          style={{
            background:
              'radial-gradient(ellipse at center, var(--primary-dim) 0%, transparent 70%)',
          }}
        />
        <div
          className="absolute top-1/4 -right-40 w-[500px] h-[500px] rounded-full opacity-15 animate-[glow-pulse_8s_ease-in-out_infinite_2s]"
          style={{
            background:
              'radial-gradient(ellipse at center, var(--secondary) 0%, transparent 70%)',
          }}
        />
        <div
          className="absolute bottom-1/3 left-1/3 w-[400px] h-[400px] rounded-full opacity-10 animate-[glow-pulse_10s_ease-in-out_infinite_4s]"
          style={{
            background:
              'radial-gradient(ellipse at center, var(--tertiary) 0%, transparent 70%)',
          }}
        />
      </div>

      {/* Hero section — top padding for fixed navbar */}
      <div className="pt-12">
        {heroProjects.length > 0 && <HeroSlider projects={heroProjects} />}
      </div>

      {/* Category rows with slight overlap on hero */}
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
        <div className="flex items-center justify-center h-[60vh] text-on-surface-variant text-xl font-sans">
          Henuz onaylanmis proje yok
        </div>
      )}

      {/* Footer */}
      <footer className="relative z-10 mt-16">
        <div
          className="mx-6"
          style={{ height: '1px', background: 'rgba(72,71,77,0.2)' }}
        />
        <div className="flex items-center justify-center gap-3 py-8 px-6">
          <span className="font-mono text-xs text-on-surface-variant">
            built by
          </span>
          <span className="font-mono text-sm font-semibold text-gradient">
            sokrateng
          </span>
          <span className="font-mono text-xs text-on-surface-variant opacity-40">
            ·
          </span>
          <span className="font-mono text-xs text-on-surface-variant opacity-60">
            VibeFlix Obsidian
          </span>
        </div>
      </footer>
    </main>
  )
}
