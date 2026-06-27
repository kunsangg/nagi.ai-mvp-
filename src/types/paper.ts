export interface PaperTopic {
  id: string
  displayName: string
  score: number
  subfield?: { id: string; displayName: string }
  field?: { id: string; displayName: string }
  domain?: { id: string; displayName: string }
}

export interface Paper {
  id: string
  title: string
  abstract: string
  authors: string[]
  publicationYear: number
  citationCount: number
  doi?: string
  journal?: string
  openAlexId: string
  pdfUrl?: string
  // New fields
  type?: string
  language?: string
  isOpenAccess?: boolean
  referencesCount?: number
  relatedWorks?: string[]
  topics?: PaperTopic[]
  field?: string
  subfield?: string
  domain?: string
  totalResults?: number
  relevanceScore?: number
}

export interface SearchFilters {
  yearFrom?: number
  yearTo?: number
  type?: string
  openAccessOnly?: boolean
}
