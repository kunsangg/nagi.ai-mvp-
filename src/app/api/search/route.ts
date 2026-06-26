import { NextResponse } from 'next/server';
import { searchPapers } from '@/lib/semantic';

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
    console.log('Search API error:', error.message);
    return NextResponse.json(
      { error: 'Failed to search papers', details: error.message },
      { status: 500 }
    );
  }
}
