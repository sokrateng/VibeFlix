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
  }[project.activity]

  return (
    <main className="min-h-screen bg-[#141414]">
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
          <div className="bg-[#1F1F1F] rounded-lg p-4">
            <span className="text-gray-500">Kategori</span>
            <p className="text-white mt-1">{project.category}</p>
          </div>
          <div className="bg-[#1F1F1F] rounded-lg p-4">
            <span className="text-gray-500">Son Guncelleme</span>
            <p className="text-white mt-1">{updatedDate}</p>
          </div>
          <div className="bg-[#1F1F1F] rounded-lg p-4">
            <span className="text-gray-500">Durum</span>
            <p className="text-white mt-1">{activityLabel}</p>
          </div>
          {project.complexity && (
            <div className="bg-[#1F1F1F] rounded-lg p-4">
              <span className="text-gray-500">Karmasiklik</span>
              <p className="text-white mt-1 capitalize">{project.complexity}</p>
            </div>
          )}
        </div>

        {project.tech_stack.length > 0 && (
          <div className="mt-6 flex gap-2 flex-wrap">
            {project.tech_stack.map((tech) => (
              <span
                key={tech}
                className="bg-[#1F1F1F] text-gray-300 px-3 py-1 rounded-full text-sm"
              >
                {tech}
              </span>
            ))}
          </div>
        )}

        {project.features && (
          <section className="mt-8 bg-[#1F1F1F] rounded-lg p-6">
            <h2 className="text-xl font-bold text-white mb-3">
              Ozellikler
            </h2>
            <p className="text-gray-300 leading-relaxed whitespace-pre-line">
              {project.features}
            </p>
          </section>
        )}

        {project.use_case && (
          <section className="mt-4 bg-[#1F1F1F] rounded-lg p-6">
            <h2 className="text-xl font-bold text-white mb-3">
              Kullanim Senaryosu
            </h2>
            <p className="text-gray-300 leading-relaxed">
              {project.use_case}
            </p>
          </section>
        )}

        {project.ai_trailer && (
          <section className="mt-4 bg-[#1F1F1F] rounded-lg p-6">
            <h2 className="text-xl font-bold text-white mb-3">
              Proje Fragmani
            </h2>
            <p className="text-gray-300 leading-relaxed">
              {project.ai_trailer}
            </p>
          </section>
        )}

        {/* Presentations & HTML Attachments */}
        {(() => {
          const attachments = project.attachments || []
          const presentations = attachments.filter(a => a.file_type === 'presentation')
          const htmlFiles = attachments.filter(a => a.file_type === 'html')
          const hasContent = presentations.length > 0 || htmlFiles.length > 0

          if (!hasContent) return null

          return (
            <section className="mt-4 bg-[#1F1F1F] rounded-lg p-6">
              <h2 className="text-xl font-bold text-white mb-4">
                Proje Dokumanlari
              </h2>

              {presentations.map((a) => (
                <div key={a.id} className="mb-3 flex items-center gap-3">
                  <span className="text-2xl">📊</span>
                  <div>
                    <a
                      href={a.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:underline"
                    >
                      {a.file_name}
                    </a>
                    <p className="text-gray-500 text-xs">PowerPoint Sunum</p>
                  </div>
                </div>
              ))}

              {htmlFiles.map((a) => (
                <div key={a.id} className="mb-3">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">🌐</span>
                    <div>
                      <a
                        href={a.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:underline"
                      >
                        {a.file_name}
                      </a>
                      <p className="text-gray-500 text-xs">HTML Icerik</p>
                    </div>
                  </div>
                  <iframe
                    src={a.file_url}
                    className="w-full h-[400px] rounded border border-gray-700 bg-white"
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
