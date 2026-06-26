export async function searchPapers(query: string) {
  if (!query) {
    throw new Error('Query is required to search papers.');
  }

  const endpoint = 'https://api.semanticscholar.org/graph/v1/paper/search';
  const fields = 'paperId,title,abstract,authors,year,citationCount,url,publicationVenue,publicationDate';
  
  const url = new URL(endpoint);
  url.searchParams.set('query', query);
  url.searchParams.set('fields', fields);
  url.searchParams.set('limit', '10');

  const headers: Record<string, string> = {};
  
  if (process.env.SEMANTIC_SCHOLAR_API_KEY) {
    headers['x-api-key'] = process.env.SEMANTIC_SCHOLAR_API_KEY;
  }

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Semantic Scholar API returned status ${response.status}: ${errorText}`);
  }

  return response.json();
}
