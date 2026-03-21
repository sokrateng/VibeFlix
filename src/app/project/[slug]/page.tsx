import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createServerClient } from '@/lib/supabase-server'
import { ScreenshotCarousel } from '@/components/ScreenshotCarousel'
import type { Project } from '@/lib/types'

export const dynamic = 'force-dynamic'

interface PageProps {
  params: Promise<{ slug: string }>
}

async function getProject(slug: string): Promise<Project | null> {
  const supabase = createServerClient()
  const { data } = await supabase
    .from('projects')
    .select('*, screenshots(*), attachments(*)')
    .eq('slug', slug)
    .eq('status', 'APPROVED')
    .single()
  return data as Project | null
}

const complexityColor: Record<string, string> = {
  basit: 'text-green-400',
  orta: 'text-yellow-400',
  karmasik: 'text-[color:var(--error)]',
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
    aktif: 'Aktif',
    arsiv: 'Arsiv',
    bakimda: 'Bakimda',
  }[project.activity] ?? project.activity

  const activityDotClass = {
    aktif: 'status-aktif',
    arsiv: 'status-arsiv',
    bakimda: 'status-bakimda',
  }[project.activity] ?? 'status-arsiv'

  return (
    <main className="min-h-screen bg-surface relative overflow-x-hidden">
      {/* Decorative ambient glow orbs */}
      <div
        className="pointer-events-none absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full opacity-20 animate-[glow-pulse_3s_ease-in-out_infinite]"
        style={{ background: 'radial-gradient(ellipse at center, #7e51ff 0%, transparent 70%)' }}
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute top-1/3 -right-60 w-[500px] h-[500px] rounded-full opacity-10 animate-[glow-pulse_4s_ease-in-out_infinite_1s]"
        style={{ background: 'radial-gradient(ellipse at center, #00e3fd 0%, transparent 70%)' }}
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] rounded-full opacity-10"
        style={{ background: 'radial-gradient(ellipse at center, #e966ff 0%, transparent 70%)' }}
        aria-hidden="true"
      />

      {/* Glass Navbar */}
      <nav className="glass sticky top-0 z-50 px-6 py-4 flex items-center justify-between">
        <Link
          href="/"
          className="text-on-surface-variant hover:text-on-surface transition-colors text-sm font-sans flex items-center gap-2"
        >
          <span aria-hidden="true">&#8592;</span>
          <span>Geri Don</span>
        </Link>
        <div className="flex gap-3 items-center">
          <a
            href={project.github_url}
            target="_blank"
            rel="noopener noreferrer"
            className="glass px-4 py-1.5 rounded-full text-sm text-on-surface-variant hover:text-on-surface transition-all font-mono"
          >
            GitHub
          </a>
          {project.demo_url && (
            <a
              href={project.demo_url}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-gradient px-4 py-1.5 rounded-full text-sm font-mono font-medium"
            >
              Demo
            </a>
          )}
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 pb-20 pt-10 relative z-10">
        {/* Project header */}
        <header className="mb-8">
          <h1 className="font-heading text-4xl md:text-5xl font-bold tracking-tight text-on-surface mb-3">
            {project.name}
          </h1>
          <p className="font-sans text-lg text-on-surface-variant leading-relaxed mb-4">
            {project.description}
          </p>
          {project.ai_trailer && (
            <p className="font-sans text-base italic text-secondary border-l-2 border-secondary/40 pl-4 leading-relaxed glow-secondary rounded-sm">
              {project.ai_trailer}
            </p>
          )}
        </header>

        {/* Screenshot carousel */}
        <ScreenshotCarousel screenshots={screenshots} />

        {/* Tech stack */}
        {project.tech_stack.length > 0 && (
          <div className="mt-8 flex gap-2 flex-wrap">
            {project.tech_stack.map((tech) => (
              <span key={tech} className="tech-pill">
                {tech}
              </span>
            ))}
          </div>
        )}

        {/* Info cards grid */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <div className="glass-card p-4">
            <p className="font-mono text-xs text-on-surface-variant mb-1 uppercase tracking-wider">
              Kategori
            </p>
            <p className="font-sans font-medium text-secondary">{project.category}</p>
          </div>

          <div className="glass-card p-4">
            <p className="font-mono text-xs text-on-surface-variant mb-1 uppercase tracking-wider">
              Son Guncelleme
            </p>
            <p className="font-sans font-medium text-on-surface">{updatedDate}</p>
          </div>

          <div className="glass-card p-4">
            <p className="font-mono text-xs text-on-surface-variant mb-1 uppercase tracking-wider">
              Durum
            </p>
            <div className="flex items-center gap-2 mt-1">
              <span className={`status-dot ${activityDotClass}`} aria-hidden="true" />
              <p className="font-sans font-medium text-on-surface">{activityLabel}</p>
            </div>
          </div>

          {project.complexity && (
            <div className="glass-card p-4">
              <p className="font-mono text-xs text-on-surface-variant mb-1 uppercase tracking-wider">
                Karmasiklik
              </p>
              <p className={`font-sans font-medium capitalize ${complexityColor[project.complexity] ?? 'text-on-surface'}`}>
                {project.complexity}
              </p>
            </div>
          )}
        </div>

        {/* Features section */}
        {project.features && (
          <section className="glass-card mt-8 p-6">
            <h2 className="font-heading text-xl font-bold text-on-surface mb-4 flex items-center gap-3">
              <span className="w-1 h-5 rounded-full bg-secondary shrink-0" aria-hidden="true" />
              Ozellikler
            </h2>
            <ul className="space-y-2.5">
              {project.features
                .split('\n')
                .filter(Boolean)
                .map((line, i) => (
                  <li key={i} className="flex items-start gap-3 text-on-surface-variant leading-relaxed">
                    <span className="mt-1.5 w-2 h-2 rounded-full bg-secondary shrink-0" aria-hidden="true" />
                    <span className="font-sans">{line.replace(/^[-*]\s*/, '')}</span>
                  </li>
                ))}
            </ul>
          </section>
        )}

        {/* Use case section */}
        {project.use_case && (
          <section className="glass-card mt-4 p-6">
            <h2 className="font-heading text-xl font-bold text-on-surface mb-4 flex items-center gap-3">
              <span className="w-1 h-5 rounded-full bg-primary shrink-0" aria-hidden="true" />
              Kullanim Senaryosu
            </h2>
            <p className="font-sans text-on-surface-variant leading-relaxed">{project.use_case}</p>
          </section>
        )}

        {/* Attachments section */}
        {(() => {
          const attachments = project.attachments || []
          const presentations = attachments.filter((a) => a.file_type === 'presentation')
          const htmlFiles = attachments.filter((a) => a.file_type === 'html')
          const hasContent = presentations.length > 0 || htmlFiles.length > 0

          if (!hasContent) return null

          return (
            <section className="glass-card mt-4 p-6">
              <h2 className="font-heading text-xl font-bold text-on-surface mb-6 flex items-center gap-3">
                <span className="w-1 h-5 rounded-full bg-tertiary shrink-0" aria-hidden="true" />
                Proje Dokumanlari
              </h2>

              {presentations.map((a) => (
                <div key={a.id} className="mb-6 last:mb-0">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="glass w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0" aria-hidden="true">
                      &#128202;
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-sans font-medium text-on-surface truncate">{a.file_name}</p>
                      <p className="font-mono text-xs text-on-surface-variant">PowerPoint Sunum</p>
                    </div>
                    <a
                      href={a.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="glass px-3 py-1 rounded-full text-xs text-primary hover:text-on-surface transition-colors font-mono shrink-0"
                    >
                      Indir
                    </a>
                  </div>
                  <iframe
                    src={`https://docs.google.com/gview?url=${encodeURIComponent(a.file_url)}&embedded=true`}
                    className="w-full h-[500px] rounded-xl border border-white/10"
                    title={a.file_name}
                  />
                </div>
              ))}

              {htmlFiles.map((a) => (
                <div key={a.id} className="mb-6 last:mb-0">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="glass w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0" aria-hidden="true">
                      &#127758;
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-sans font-medium text-on-surface truncate">{a.file_name}</p>
                      <p className="font-mono text-xs text-on-surface-variant">HTML Icerik</p>
                    </div>
                    <a
                      href={a.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="glass px-3 py-1 rounded-full text-xs text-secondary hover:text-on-surface transition-colors font-mono shrink-0"
                    >
                      Yeni sekmede ac
                    </a>
                  </div>
                  <iframe
                    src={`/api/html-proxy?url=${encodeURIComponent(a.file_url)}`}
                    className="w-full h-[600px] rounded-xl border border-white/10 bg-white"
                    title={a.file_name}
                  />
                </div>
              ))}
            </section>
          )
        })()}
      </div>
    </main>
  )
}
