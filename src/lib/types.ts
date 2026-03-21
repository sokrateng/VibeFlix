export type ProjectStatus = 'NEW' | 'ANALYZING' | 'PENDING' | 'APPROVED' | 'REJECTED'
export type ActivityStatus = 'aktif' | 'arsiv' | 'bakimda'
export type ComplexityLevel = 'basit' | 'orta' | 'karmasik'

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
  features: string
  use_case: string
  complexity: ComplexityLevel
  sort_order: number
  created_at: string
  updated_at: string
  screenshots?: Screenshot[]
  attachments?: Attachment[]
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
  features: string
  use_case: string
  complexity: ComplexityLevel
}

export type AttachmentType = 'screenshot' | 'presentation' | 'html' | 'other'

export interface Attachment {
  id: string
  project_id: string
  file_url: string
  file_name: string
  file_type: AttachmentType
  mime_type: string
  sort_order: number
  created_at: string
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}
