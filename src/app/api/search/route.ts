import { NextResponse } from 'next/server';
import { searchPapers, OpenAlexAPIError } from '@/lib/providers';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { query } = body;
    console.log(`[API Route] Received search request for query: "${query}"`);

    if (!query || typeof query !== 'string') {
      return NextResponse.json({ error: 'Valid query string is required' }, { status: 400 });
    }

    const papers = await searchPapers(query.trim());
    return NextResponse.json({ papers });
  } catch (error: any) {
    if (error instanceof OpenAlexAPIError) {
      console.log(`[API Route] OpenAlex error (${error.status}):`, error.message);
      return NextResponse.json(
        { error: error.message, details: error.details },
        { status: error.status }
      );
    }
    
    console.log('[API Route] Unexpected search API error:', error.message);
    return NextResponse.json(
      { error: 'Failed to search papers', details: error.message },
      { status: 500 }
    );
  }
}
