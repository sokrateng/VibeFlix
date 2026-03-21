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
      className="mb-12 px-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Category header */}
      <div className="mb-4">
        <p className="font-mono text-xs text-secondary tracking-widest uppercase mb-1">
          Kategori
        </p>
        <h2 className="font-heading text-xl font-semibold text-on-surface">
          {icon} {title}
        </h2>
      </div>

      {/* Scrollable row with glass background */}
      <div className="relative group/row rounded-xl overflow-visible">
        {/* Left scroll button */}
        <button
          onClick={() => scroll('left')}
          aria-label="Scroll left"
          className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 z-20 w-9 h-9 glass ghost-border rounded-full text-on-surface opacity-0 group-hover/row:opacity-100 transition-all duration-200 flex items-center justify-center hover:bg-[rgba(255,255,255,0.12)] shadow-[0_4px_16px_rgba(0,0,0,0.4)]"
        >
          <span className="text-xs leading-none">◀</span>
        </button>

        <div
          ref={rowRef}
          className="flex gap-3 overflow-x-auto scrollbar-hide py-3"
        >
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>

        {/* Right scroll button */}
        <button
          onClick={() => scroll('right')}
          aria-label="Scroll right"
          className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 z-20 w-9 h-9 glass ghost-border rounded-full text-on-surface opacity-0 group-hover/row:opacity-100 transition-all duration-200 flex items-center justify-center hover:bg-[rgba(255,255,255,0.12)] shadow-[0_4px_16px_rgba(0,0,0,0.4)]"
        >
          <span className="text-xs leading-none">▶</span>
        </button>
      </div>
    </motion.section>
  )
}
