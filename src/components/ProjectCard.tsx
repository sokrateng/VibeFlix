'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import type { Project } from '@/lib/types'

interface ProjectCardProps {
  project: Project
}

function getStatusClass(activity: string | undefined): string {
  if (activity === 'aktif') return 'status-aktif'
  if (activity === 'bakimda') return 'status-bakimda'
  return 'status-arsiv'
}

export function ProjectCard({ project }: ProjectCardProps) {
  const screenshotAttachment = project.attachments?.find(
    (a) => a.file_type === 'screenshot'
  )
  const thumbnail =
    project.screenshots?.[0]?.image_url ||
    screenshotAttachment?.file_url ||
    '/placeholder.png'

  return (
    <Link href={`/project/${project.slug}`}>
      <motion.div
        className="relative min-w-[280px] h-[160px] rounded-xl overflow-hidden cursor-pointer group ghost-border"
        whileHover={{
          scale: 1.05,
          zIndex: 10,
        }}
        transition={{ duration: 0.2 }}
        style={{
          boxShadow: undefined,
        }}
        whileFocus={{ scale: 1.03 }}
      >
        {/* Thumbnail */}
        <img
          src={thumbnail}
          alt={project.name}
          className="w-full h-full object-cover"
        />

        {/* Always-visible subtle bottom gradient */}
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#0e0e13]/90 to-transparent" />

        {/* Hover overlay — full glass panel */}
        <div className="absolute inset-0 bg-[rgba(14,14,19,0.75)] backdrop-blur-[8px] opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="absolute inset-0 border border-[rgba(182,160,255,0.15)] rounded-xl" />
          <div className="absolute bottom-0 left-0 right-0 p-3">
            <h3 className="font-heading text-sm font-semibold text-on-surface truncate mb-0.5">
              {project.name}
            </h3>
            <p className="font-sans text-xs text-on-surface-variant truncate mb-2">
              {project.description}
            </p>
            <div className="flex gap-1.5 flex-wrap">
              {project.tech_stack.slice(0, 3).map((tech) => (
                <span key={tech} className="tech-pill text-[10px] px-2 py-0.5">
                  {tech}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Status dot */}
        <span
          className={`status-dot absolute top-2.5 right-2.5 ${getStatusClass(project.activity)}`}
        />
      </motion.div>
    </Link>
  )
}
