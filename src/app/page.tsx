import { createServerClient } from '@/lib/supabase-server'
import { HeroSlider } from '@/components/HeroSlider'
import { CategoryRow } from '@/components/CategoryRow'
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
    <main className="min-h-screen">
      <header className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-b from-black/80 to-transparent px-4 py-4">
        <h1 className="text-2xl font-bold text-[#E50914]">VibeFlix</h1>
      </header>

      {heroProjects.length > 0 && <HeroSlider projects={heroProjects} />}

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
