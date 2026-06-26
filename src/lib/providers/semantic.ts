export class SemanticAPIError extends Error {
  public status: number;
  public details: any;
  
  constructor(message: string, status: number, details?: any) {
    super(message);
    this.name = 'SemanticAPIError';
    this.status = status;
    this.details = details;
  }
}

export async function searchPapers(query: string) {
  if (!query) {
    throw new SemanticAPIError('Query is required to search papers.', 400);
  }

  const apiKey = process.env.SEMANTIC_SCHOLAR_API_KEY;
  console.log('[Semantic Scholar API] API key exists:', !!apiKey);

  if (!apiKey) {
    throw new SemanticAPIError('Missing SEMANTIC_SCHOLAR_API_KEY in environment variables.', 500);
  }

  const endpoint = 'https://api.semanticscholar.org/graph/v1/paper/search';
  const fields = 'paperId,title,abstract,authors,year,citationCount,url,publicationVenue,publicationDate';
  
  const url = new URL(endpoint);
  url.searchParams.set('query', query);
  url.searchParams.set('fields', fields);
  url.searchParams.set('limit', '10');

  const headers: Record<string, string> = {
    'x-api-key': apiKey,
  };

  console.log(`[Semantic Scholar API] Request URL: ${url.toString()}`);
  console.log(`[Semantic Scholar API] Request headers:`, {
    ...headers,
    'x-api-key': apiKey ? '***' + apiKey.slice(-4) : 'none',
  });

  try {
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers,
    });

    console.log(`[Semantic Scholar API] Response status: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.log(`[Semantic Scholar API] Error response body:`, errorText);
      
      if (response.status === 429) {
        console.log(`[Semantic Scholar API] Rate limit headers:`, {
          'x-ratelimit-limit': response.headers.get('x-ratelimit-limit'),
          'x-ratelimit-remaining': response.headers.get('x-ratelimit-remaining'),
          'x-ratelimit-reset': response.headers.get('x-ratelimit-reset'),
        });
        throw new SemanticAPIError('Semantic Scholar rate limit exceeded (HTTP 429). This happens when the API key is rate-limited.', 429, errorText);
      }
      
      if (response.status === 403) {
        throw new SemanticAPIError('Invalid Semantic Scholar API key or forbidden access (HTTP 403).', 403, errorText);
      }

      throw new SemanticAPIError(`Semantic Scholar API returned status ${response.status}.`, response.status, errorText);
    }

    return await response.json();
  } catch (error: any) {
    if (error instanceof SemanticAPIError) {
      throw error;
    }
    console.log(`[Semantic Scholar API] Network or unexpected error:`, error);
    throw new SemanticAPIError(`Failed to reach Semantic Scholar API: ${error.message}`, 502);
  }
}
