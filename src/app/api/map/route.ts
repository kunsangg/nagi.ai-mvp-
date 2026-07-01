import { NextResponse } from 'next/server';

function getOpenAlexUrl(basePath: string, queryParams: Record<string, string> = {}) {
  const url = new URL(`https://api.openalex.org${basePath}`);
  for (const [key, value] of Object.entries(queryParams)) {
    url.searchParams.append(key, value);
  }
  const apiKey = process.env.OPENALEX_API_KEY;
  if (apiKey) {
    url.searchParams.append('api_key', apiKey);
  } else {
    url.searchParams.append('mailto', 'nagi@research.ai');
  }
  return url.toString();
}

async function fetchWork(id: string) {
  const cleanId = id.replace('https://openalex.org/', '');
  const url = getOpenAlexUrl(`/works/https://openalex.org/${cleanId}`, {
    select: 'id,title,cited_by_count,publication_year,topics,referenced_works,related_works,authorships,open_access'
  });
  
  const res = await fetch(url, { headers: { 'User-Agent': 'Nagi/1.0' } });
  if (!res.ok) return null;
  return res.json();
}

async function fetchMultipleWorks(ids: string[]) {
  if (!ids.length) return [];
  const cleanIds = ids.slice(0, 8).map(id => id.replace('https://openalex.org/', ''));
  const filterStr = cleanIds.map(id => `openalex:${id}`).join('|');
  
  const url = getOpenAlexUrl(`/works`, {
    filter: `openalex_id:${filterStr}`,
    'per-page': '8',
    select: 'id,title,cited_by_count,publication_year,topics,authorships'
  });

  const res = await fetch(url, { headers: { 'User-Agent': 'Nagi/1.0' } });
  if (!res.ok) return [];
  const data = await res.json();
  return data.results || [];
}

async function fetchCitingWorks(openAlexId: string) {
  const fullId = `https://openalex.org/${openAlexId}`;
  
  const url = getOpenAlexUrl(`/works`, {
    filter: `cites:${fullId}`,
    'per-page': '8',
    sort: 'cited_by_count:desc',
    select: 'id,title,cited_by_count,publication_year,topics,authorships'
  });

  const res = await fetch(url, { headers: { 'User-Agent': 'Nagi/1.0' } });
  if (!res.ok) return [];
  const data = await res.json();
  return data.results || [];
}

function workToNode(work: any, type: string) {
  const primaryTopic = work.topics?.[0];
  return {
    id: work.id.replace('https://openalex.org/', ''),
    title: work.title || 'Untitled',
    year: work.publication_year,
    citations: work.cited_by_count || 0,
    author: work.authorships?.[0]?.author?.display_name || '',
    domain: primaryTopic?.domain?.display_name || '',
    field: primaryTopic?.field?.display_name || '',
    isOpenAccess: work.open_access?.is_oa || false,
    type, // 'center' | 'reference' | 'citing' | 'related'
  };
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  try {
    // Fetch the center paper
    const centerWork = await fetchWork(id);
    if (!centerWork) return NextResponse.json({ error: 'Paper not found' }, { status: 404 });

    // Fetch all three relation types in parallel
    const [referencedWorks, citingWorks, relatedWorks] = await Promise.all([
      fetchMultipleWorks(centerWork.referenced_works || []),
      fetchCitingWorks(id),
      fetchMultipleWorks(centerWork.related_works || []),
    ]);

    const centerNode = workToNode(centerWork, 'center');

    const referenceNodes = referencedWorks
      .filter((w: any) => w.id !== centerWork.id)
      .map((w: any) => workToNode(w, 'reference'));

    const citingNodes = citingWorks
      .filter((w: any) => w.id !== centerWork.id)
      .map((w: any) => workToNode(w, 'citing'));

    const relatedNodes = relatedWorks
      .filter((w: any) => w.id !== centerWork.id && !referenceNodes.find((n: any) => n.id === w.id.replace('https://openalex.org/', '')) && !citingNodes.find((n: any) => n.id === w.id.replace('https://openalex.org/', '')))
      .slice(0, 6)
      .map((w: any) => workToNode(w, 'related'));

    const nodes = [centerNode, ...referenceNodes, ...citingNodes, ...relatedNodes];

    // Build edges
    const edges = [
      ...referenceNodes.map((n: any) => ({ source: centerNode.id, target: n.id, type: 'reference' })),
      ...citingNodes.map((n: any) => ({ source: n.id, target: centerNode.id, type: 'citing' })),
      ...relatedNodes.map((n: any) => ({ source: centerNode.id, target: n.id, type: 'related' })),
    ];

    return NextResponse.json({ nodes, edges, center: centerNode.id });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
