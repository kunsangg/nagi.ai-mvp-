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
}
