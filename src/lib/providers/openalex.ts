import { Paper, SearchFilters } from '@/types/paper';

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

function decodeAbstract(abstractInvertedIndex: any): string {
  if (!abstractInvertedIndex) return '';
  try {
    const entries = Object.entries(abstractInvertedIndex) as [string, number[]][];
    const maxIndex = Math.max(...entries.flatMap(([, positions]) => positions));
    const words = new Array(maxIndex + 1).fill('');
    for (const [word, positions] of entries) {
      for (const pos of positions) {
        words[pos] = word;
      }
    }
    return words.join(' ').trim();
  } catch {
    return '';
  }
}

function computeRelevanceScore(work: any, queryTerms: string[]): number {
  let score = 0;
  const title = (work.title || '').toLowerCase();
  const abstract = decodeAbstract(work.abstract_inverted_index).toLowerCase();

  for (const term of queryTerms) {
    const t = term.toLowerCase();
    // Title matches are worth 3x
    if (title.includes(t)) score += 30;
    // Exact title match is worth even more
    if (title === t) score += 50;
    // Title starts with term
    if (title.startsWith(t)) score += 20;
    // Abstract matches
    if (abstract.includes(t)) score += 10;
  }

  // All query terms in title = strong signal
  const allTermsInTitle = queryTerms.every(t => title.includes(t.toLowerCase()));
  if (allTermsInTitle) score += 40;

  // Citation boost — log scale so high citation papers don't dominate
  const citationBoost = Math.log10((work.cited_by_count || 0) + 1) * 5;
  score += citationBoost;

  // Recency boost — last 5 years get a small bump
  const year = work.publication_year || 0;
  const currentYear = new Date().getFullYear();
  if (year >= currentYear - 5) score += 10;
  if (year >= currentYear - 2) score += 5;

  // Open access slight boost
  if (work.open_access?.is_oa) score += 3;

  return score;
}

export async function searchPapers(
  query: string,
  filters?: SearchFilters
): Promise<{ papers: Paper[]; totalResults: number }> {
  if (!query) throw new OpenAlexAPIError('Query is required.', 400);

  const queryTerms = query.trim().split(/\s+/).filter(t => t.length > 2);

  // Fetch more than we need so we can re-rank client-side
  const fetchCount = 25;

  const url = new URL('https://api.openalex.org/works');
  url.searchParams.set('search', query);
  url.searchParams.set('per-page', String(fetchCount));
  url.searchParams.set('sort', 'relevance_score:desc');
  url.searchParams.set(
    'select',
    'id,title,abstract_inverted_index,authorships,publication_year,cited_by_count,doi,primary_location,open_access,best_oa_location,type,language,referenced_works_count,related_works,topics,relevance_score'
  );

  // Build filters
  const filterParts: string[] = [];
  if (filters?.yearFrom || filters?.yearTo) {
    const from = filters.yearFrom || 1900;
    const to = filters.yearTo || new Date().getFullYear();
    filterParts.push(`publication_year:${from}-${to}`);
  }
  if (filters?.type) filterParts.push(`type:${filters.type}`);
  if (filters?.openAccessOnly) filterParts.push('open_access.is_oa:true');
  if (filterParts.length > 0) {
    url.searchParams.set('filter', filterParts.join(','));
  }

  const apiKey = process.env.OPENALEX_API_KEY;
  if (apiKey) {
    url.searchParams.set('api_key', apiKey);
  } else {
    // Add polite pool email if available and no API key is used
    url.searchParams.set('mailto', 'nagi@research.ai');
  }

  const response = await fetch(url.toString(), {
    headers: { 'User-Agent': 'Nagi/1.0 (https://nagi.ai; mailto:nagi@research.ai)' },
  });

  if (!response.ok) {
    const errorText = await response.text();
    if (response.status === 429) throw new OpenAlexAPIError('Rate limit exceeded.', 429, errorText);
    throw new OpenAlexAPIError(`OpenAlex error ${response.status}`, response.status, errorText);
  }

  const data = await response.json();
  const totalResults: number = data.meta?.count || 0;

  // Map raw works to Paper objects with relevance scores
  const scoredWorks = (data.results || []).map((work: any) => {
    const abstract = decodeAbstract(work.abstract_inverted_index);
    const primaryTopic = work.topics?.[0];
    const nagiScore = computeRelevanceScore(work, queryTerms);

    const paper: Paper & { _score: number } = {
      id: work.id.replace('https://openalex.org/', ''),
      title: work.title || 'Untitled',
      abstract,
      authors: (work.authorships || [])
        .map((a: any) => a.author?.display_name)
        .filter(Boolean),
      publicationYear: work.publication_year,
      citationCount: work.cited_by_count || 0,
      doi: work.doi?.replace('https://doi.org/', ''),
      journal: work.primary_location?.source?.display_name,
      openAlexId: work.id,
      pdfUrl: work.open_access?.oa_url || work.best_oa_location?.pdf_url,
      type: work.type,
      language: work.language,
      isOpenAccess: work.open_access?.is_oa || false,
      referencesCount: work.referenced_works_count || 0,
      relatedWorks: (work.related_works || []).slice(0, 5),
      topics: (work.topics || []).map((t: any) => ({
        id: t.id,
        displayName: t.display_name,
        score: t.score,
        subfield: t.subfield
          ? { id: t.subfield.id, displayName: t.subfield.display_name }
          : undefined,
        field: t.field
          ? { id: t.field.id, displayName: t.field.display_name }
          : undefined,
        domain: t.domain
          ? { id: t.domain.id, displayName: t.domain.display_name }
          : undefined,
      })),
      field: primaryTopic?.field?.display_name,
      subfield: primaryTopic?.subfield?.display_name,
      domain: primaryTopic?.domain?.display_name,
      relevanceScore: nagiScore,
      _score: nagiScore,
    };

    return paper;
  });

  // Re-rank by our composite score
  scoredWorks.sort((a: any, b: any) => b._score - a._score);

  // Return top 10 after re-ranking
  const papers = scoredWorks.slice(0, 10).map(({ _score, ...paper }: any) => paper);

  return { papers, totalResults };
}
