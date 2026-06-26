import { Paper } from '@/types/paper';

export class OpenAlexAPIError extends Error {
  public status: number;
  public details: any;
  
  constructor(message: string, status: number, details?: any) {
    super(message);
    this.name = 'OpenAlexAPIError';
    this.status = status;
    this.details = details;
  }
}

export async function searchPapers(query: string): Promise<Paper[]> {
  if (!query) {
    throw new OpenAlexAPIError('Query is required to search papers.', 400);
  }

  const apiKey = process.env.OPENALEX_API_KEY;
  console.log('[OpenAlex API] API key exists:', !!apiKey);

  const endpoint = 'https://api.openalex.org/works';
  const url = new URL(endpoint);
  
  url.searchParams.set('search', query);
  url.searchParams.set('per-page', '10');
  
  if (apiKey) {
    url.searchParams.set('api_key', apiKey);
    console.log(`[OpenAlex API] Request URL: ${url.toString().replace(apiKey, '***' + apiKey.slice(-4))}`);
  } else {
    console.log(`[OpenAlex API] Request URL: ${url.toString()}`);
  }

  try {
    const response = await fetch(url.toString(), {
      method: 'GET',
    });

    console.log(`[OpenAlex API] Response status: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.log(`[OpenAlex API] Error response body:`, errorText);
      
      if (response.status === 429) {
        throw new OpenAlexAPIError('OpenAlex rate limit exceeded (HTTP 429).', 429, errorText);
      }
      
      if (response.status === 403 || response.status === 401) {
        throw new OpenAlexAPIError('Invalid OpenAlex API key or forbidden access.', 403, errorText);
      }

      throw new OpenAlexAPIError(`OpenAlex API returned status ${response.status}.`, response.status, errorText);
    }

    const data = await response.json();
    
    const papers: Paper[] = (data.results || []).map((work: any) => {
      let abstract = '';
      if (work.abstract_inverted_index) {
        const inverted = work.abstract_inverted_index;
        const maxIndex = Math.max(...(Object.values(inverted).flat() as number[]));
        const words = new Array(maxIndex + 1).fill('');
        for (const [word, positions] of Object.entries(inverted)) {
          for (const pos of positions as number[]) {
            words[pos] = word;
          }
        }
        abstract = words.join(' ').trim();
      }

      return {
        id: work.id.replace('https://openalex.org/', ''),
        title: work.title || 'Untitled',
        abstract: abstract,
        authors: (work.authorships || []).map((a: any) => a.author?.display_name).filter(Boolean),
        publicationYear: work.publication_year,
        citationCount: work.cited_by_count || 0,
        doi: work.doi,
        journal: work.primary_location?.source?.display_name,
        openAlexId: work.id,
        pdfUrl: work.open_access?.oa_url || work.best_oa_location?.pdf_url,
      };
    });

    return papers;
  } catch (error: any) {
    if (error instanceof OpenAlexAPIError) {
      throw error;
    }
    console.log(`[OpenAlex API] Network or unexpected error:`, error);
    throw new OpenAlexAPIError(`Failed to reach OpenAlex API: ${error.message}`, 502);
  }
}
