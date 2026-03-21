'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import type { Project } from '@/lib/types'

interface HeroSectionProps {
  project: Project
}

export function HeroSection({ project }: HeroSectionProps) {
  const screenshotAttachment = project.attachments?.find(a => a.file_type === 'screenshot')
  const bgImage =
    project.screenshots?.[0]?.image_url || screenshotAttachment?.file_url || '/placeholder.png'

  return (
    <section className="relative h-[60vh] min-h-[400px] mb-8">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${bgImage})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-[#141414]/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#141414]/80 to-transparent" />
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
            Detaylar
          </Link>
          {project.demo_url && (
            <a
              href={project.demo_url}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-gray-500/70 text-white font-bold px-6 py-2 rounded hover:bg-gray-500 transition"
            >
              Demo
            </a>
          )}
        </div>
      </motion.div>
    </section>
  )
}
