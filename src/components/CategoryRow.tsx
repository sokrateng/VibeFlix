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
