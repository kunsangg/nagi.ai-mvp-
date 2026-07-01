import { Paper, SearchFilters } from '@/types/paper';

export class CrossrefAPIError extends Error {
  public status: number;
  public details: any;

  constructor(message: string, status: number, details?: any) {
    super(message);
    this.name = 'CrossrefAPIError';
    this.status = status;
    this.details = details;
  }
}

export async function searchPapers(
  query: string,
  filters?: SearchFilters
): Promise<{ papers: Paper[]; totalResults: number }> {
  if (!query) throw new CrossrefAPIError('Query is required.', 400);

  const fetchCount = 25;
  const url = new URL('https://api.crossref.org/works');
  
  url.searchParams.set('query', query);
  url.searchParams.set('mailto', 'kunsangdorjay6@gmail.com');
  url.searchParams.set('rows', String(fetchCount));
  url.searchParams.set('select', 'DOI,title,abstract,author,published,is-referenced-by-count,URL,container-title,type,subject');

  // Note: Crossref filters are quite different, but we can do our best or ignore them for now since basic search is paramount.

  try {
    const response = await fetch(url.toString());

    if (!response.ok) {
      const errorText = await response.text();
      if (response.status === 503) {
        throw new CrossrefAPIError('Crossref API temporarily unavailable.', 503, errorText);
      }
      throw new CrossrefAPIError(`Crossref API error: ${response.status}`, response.status, errorText);
    }

    const data = await response.json();
    const items = data.message?.items || [];
    const totalResults = data.message?.['total-results'] || 0;

    const papers: Paper[] = items.map((item: any) => {
      // Extract abstract: it's sometimes wrapped in <jats:p> or <p> tags
      let abstract = item.abstract || '';
      abstract = abstract.replace(/<[^>]+>/g, '').trim();
      
      let year = new Date().getFullYear();
      if (item.published?.['date-parts']?.[0]?.[0]) {
        year = item.published['date-parts'][0][0];
      }

      const authors = (item.author || []).map((a: any) => {
        return [a.given, a.family].filter(Boolean).join(' ');
      });

      // Attempt to extract domain/field from subjects if available
      let domain = 'RESEARCH';
      let field = 'SCIENCE';
      if (item.subject && item.subject.length > 0) {
        field = item.subject[0];
        domain = item.subject[0];
      }

      return {
        id: item.DOI || Math.random().toString(36).substr(2, 9),
        title: item.title?.[0] || 'Untitled',
        abstract: abstract,
        authors: authors.length > 0 ? authors : ['Unknown Author'],
        publicationYear: year,
        citationCount: item['is-referenced-by-count'] || 0,
        doi: item.DOI,
        journal: item['container-title']?.[0],
        openAlexId: item.DOI,
        pdfUrl: item.URL,
        type: item.type,
        domain: domain,
        field: field,
        relevanceScore: item.score || 0
      };
    });

    return { papers, totalResults };
  } catch (error: any) {
    if (error instanceof CrossrefAPIError) throw error;
    throw new CrossrefAPIError(`Failed to fetch from Crossref: ${error.message}`, 500);
  }
}
