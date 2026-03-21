'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import type { Project } from '@/lib/types'

interface HeroSliderProps {
  projects: Project[]
}

export function HeroSlider({ projects }: HeroSliderProps) {
  const [current, setCurrent] = useState(0)

  const next = useCallback(() => {
    setCurrent((c) => (c + 1) % projects.length)
  }, [projects.length])

  useEffect(() => {
    if (projects.length <= 1) return
    const timer = setInterval(next, 6000)
    return () => clearInterval(timer)
  }, [next, projects.length])

  if (projects.length === 0) return null

  const project = projects[current]
  const screenshotAttachment = project.attachments?.find(a => a.file_type === 'screenshot')
  const bgImage = project.screenshots?.[0]?.image_url || screenshotAttachment?.file_url || ''

  return (
    <section className="relative h-[65vh] min-h-[450px] mb-8">
      <AnimatePresence mode="wait">
        <motion.div
          key={project.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
          className="absolute inset-0"
        >
          {bgImage ? (
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${bgImage})` }}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-[#141414]/60 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-r from-[#141414]/80 to-transparent" />
            </div>
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-[#1a1a2e] to-[#16213e]">
              <div className="absolute inset-0 bg-gradient-to-t from-[#141414] to-transparent" />
            </div>
          )}

          <div className="relative h-full flex flex-col justify-end p-8 max-w-2xl">
            <h1 className="text-5xl font-bold text-white mb-3">
              {project.name}
            </h1>
            <p className="text-lg text-gray-200 mb-2 line-clamp-2">
              {project.description}
            </p>
            {project.tech_stack && project.tech_stack.length > 0 && (
              <div className="flex gap-2 mb-4 flex-wrap">
                {project.tech_stack.slice(0, 4).map((tech) => (
                  <span
                    key={tech}
                    className="text-xs bg-white/15 text-white px-2 py-0.5 rounded"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            )}
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
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Dots */}
      {projects.length > 1 && (
        <div className="absolute bottom-4 right-8 flex gap-2 z-10">
          {projects.map((p, i) => (
            <button
              key={p.id}
              onClick={() => setCurrent(i)}
              className={`w-2.5 h-2.5 rounded-full transition-all ${
                i === current
                  ? 'bg-[#E50914] w-6'
                  : 'bg-white/40 hover:bg-white/70'
              }`}
            />
          ))}
        </div>
      )}
    </section>
  )
}
