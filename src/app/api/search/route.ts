import { NextResponse } from 'next/server';
import { searchPapers, CrossrefAPIError } from '@/lib/providers/crossref';
import { SearchFilters } from '@/types/paper';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { query, filters } = body as { query: string; filters?: SearchFilters };

    if (!query || typeof query !== 'string') {
      return NextResponse.json({ error: 'Valid query string is required' }, { status: 400 });
    }

    const { papers, totalResults } = await searchPapers(query.trim(), filters);
    return NextResponse.json({ papers, totalResults });
  } catch (error: any) {
    if (error instanceof CrossrefAPIError) {
      return NextResponse.json(
        { error: error.message, details: error.details },
        { status: error.status }
      );
    }
    return NextResponse.json(
      { error: 'Failed to search papers', details: error.message },
      { status: 500 }
    );
  }
}
