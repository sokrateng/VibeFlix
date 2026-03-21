'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import type { Project } from '@/lib/types'

interface ProjectCardProps {
  project: Project
}

export function ProjectCard({ project }: ProjectCardProps) {
  const screenshotAttachment = project.attachments?.find(a => a.file_type === 'screenshot')
  const thumbnail =
    project.screenshots?.[0]?.image_url || screenshotAttachment?.file_url || '/placeholder.png'

  return (
    <Link href={`/project/${project.slug}`}>
      <motion.div
        className="relative min-w-[250px] h-[140px] rounded-md overflow-hidden cursor-pointer group"
        whileHover={{ scale: 1.05, zIndex: 10 }}
        transition={{ duration: 0.2 }}
      >
        <img
          src={thumbnail}
          alt={project.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="absolute bottom-0 left-0 right-0 p-3">
            <h3 className="text-white text-sm font-bold truncate">
              {project.name}
            </h3>
            <p className="text-gray-300 text-xs truncate">
              {project.description}
            </p>
            <div className="flex gap-1 mt-1 flex-wrap">
              {project.tech_stack.slice(0, 3).map((tech) => (
                <span
                  key={tech}
                  className="text-[10px] bg-white/20 text-white px-1.5 py-0.5 rounded"
                >
                  {tech}
                </span>
              ))}
            </div>
          </div>
        </div>
        {project.activity === 'aktif' && (
          <span className="absolute top-2 right-2 w-2 h-2 bg-green-500 rounded-full" />
        )}
      </motion.div>
    </Link>
  )
}
