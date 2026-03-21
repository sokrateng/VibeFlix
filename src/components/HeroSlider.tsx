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
  const screenshotAttachment = project.attachments?.find(
    (a) => a.file_type === 'screenshot'
  )
  const bgImage =
    project.screenshots?.[0]?.image_url ||
    screenshotAttachment?.file_url ||
    ''

  return (
    <section className="relative h-[65vh] min-h-[450px] mb-8 overflow-hidden">
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
              {/* Gradient overlays using surface token */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#0e0e13] via-[#0e0e13]/60 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-r from-[#0e0e13]/85 to-transparent" />
            </div>
          ) : (
            /* Fallback: gradient mesh with glow orbs */
            <div className="absolute inset-0 bg-gradient-to-br from-[#0e0e13] to-[#19191f]">
              <div
                className="absolute top-0 right-1/4 w-[400px] h-[400px] rounded-full opacity-25"
                style={{
                  background:
                    'radial-gradient(ellipse at center, var(--primary-dim) 0%, transparent 70%)',
                }}
              />
              <div
                className="absolute bottom-0 left-1/3 w-[300px] h-[300px] rounded-full opacity-20"
                style={{
                  background:
                    'radial-gradient(ellipse at center, var(--secondary) 0%, transparent 70%)',
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0e0e13] to-transparent" />
            </div>
          )}

          {/* Content */}
          <div className="relative h-full flex flex-col justify-end p-8 max-w-2xl">
            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="font-heading text-4xl md:text-5xl lg:text-6xl font-bold text-on-surface mb-3 tracking-tight"
            >
              {project.name}
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="font-sans text-base text-on-surface-variant italic mb-3 line-clamp-2"
            >
              {project.description}
            </motion.p>

            {project.tech_stack && project.tech_stack.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="flex gap-2 mb-5 flex-wrap"
              >
                {project.tech_stack.slice(0, 4).map((tech) => (
                  <span key={tech} className="tech-pill">
                    {tech}
                  </span>
                ))}
              </motion.div>
            )}

            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="flex gap-3"
            >
              <Link
                href={`/project/${project.slug}`}
                className="btn-gradient font-sans font-semibold px-6 py-2.5 rounded-lg text-sm"
              >
                Detayları Gör
              </Link>
              {project.demo_url && (
                <a
                  href={project.demo_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="glass ghost-border font-sans font-semibold text-on-surface px-6 py-2.5 rounded-lg text-sm hover:bg-[rgba(255,255,255,0.1)] transition-colors duration-200"
                >
                  Demo
                </a>
              )}
            </motion.div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Pagination dots */}
      {projects.length > 1 && (
        <div className="absolute bottom-6 right-8 flex gap-2 z-10">
          {projects.map((p, i) => (
            <button
              key={p.id}
              onClick={() => setCurrent(i)}
              aria-label={`Go to slide ${i + 1}`}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === current
                  ? 'w-6 bg-primary glow-primary'
                  : 'w-2.5 glass ghost-border hover:bg-[rgba(255,255,255,0.2)]'
              }`}
              style={
                i === current
                  ? { backgroundColor: 'var(--primary)' }
                  : undefined
              }
            />
          ))}
        </div>
      )}
    </section>
  )
}
