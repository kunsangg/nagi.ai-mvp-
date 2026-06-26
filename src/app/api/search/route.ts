import { NextResponse } from 'next/server';
import { searchPapers, SemanticAPIError } from '@/lib/semantic';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { query } = body;

    if (!query || typeof query !== 'string') {
      return NextResponse.json({ error: 'Valid query string is required' }, { status: 400 });
    }

    const data = await searchPapers(query.trim());
    return NextResponse.json(data);
  } catch (error: any) {
    if (error instanceof SemanticAPIError) {
      console.log(`[API Route] Semantic Scholar error (${error.status}):`, error.message);
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
