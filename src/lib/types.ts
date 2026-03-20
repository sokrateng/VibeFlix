export type ProjectStatus = 'NEW' | 'ANALYZING' | 'PENDING' | 'APPROVED' | 'REJECTED'
export type ActivityStatus = 'aktif' | 'arsiv' | 'bakimda'

export interface Project {
  id: string
  github_repo: string
  name: string
  slug: string
  description: string
  category: string
  status: ProjectStatus
  tech_stack: string[]
  demo_url: string | null
  github_url: string
  last_updated: string | null
  activity: ActivityStatus
  ai_trailer: string
  sort_order: number
  created_at: string
  updated_at: string
  screenshots?: Screenshot[]
}

export interface Screenshot {
  id: string
  project_id: string
  image_url: string
  caption: string
  sort_order: number
  created_at: string
}

export interface Category {
  id: string
  name: string
  display_name: string
  icon: string
  sort_order: number
}

export interface AiAnalysisResult {
  description: string
  category: string
  ai_trailer: string
  activity: ActivityStatus
  tech_stack: string[]
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}
