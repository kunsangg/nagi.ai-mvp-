import { NextResponse } from 'next/server';
import { callAI } from '@/lib/ai/providers';
import { AIProvider } from '@/lib/ai/types';
import { ActionPlan, CanvasMutationOp } from '@/lib/ai/canvas-actions';
import { searchPapers } from '@/lib/providers/openalex';
import { radialExpansion, chronologicalTimeline, cleanupLayout, thematicClustering } from '@/lib/utils/layout';

// Helper for OpenAlex URLs
function getOpenAlexUrl(basePath: string, queryParams: Record<string, string> = {}) {
  const url = new URL(`https://api.openalex.org${basePath}`);
  for (const [key, value] of Object.entries(queryParams)) {
    url.searchParams.append(key, value);
  }
  const apiKey = process.env.OPENALEX_API_KEY;
  if (apiKey) url.searchParams.append('api_key', apiKey);
  else url.searchParams.append('mailto', 'nagi@research.ai');
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

function workToNode(work: any, type: string) {
  const primaryTopic = work.topics?.[0];
  const cleanTitle = work.title ? String(work.title).replace(/<[^>]*>?/gm, '') : 'Untitled';
  const authorName = work.authorships?.[0]?.author?.display_name || 'Unknown';
  const lastName = authorName.split(',')[0].trim().split(' ').pop() || 'Unknown';
  const shortTitle = cleanTitle.split(' ').slice(0, 5).join(' ');
  const shortName = `${lastName} (${work.publication_year || 'n.d.'}) - ${shortTitle}${cleanTitle.split(' ').length > 5 ? '...' : ''}`;

  return {
    id: work.id.replace('https://openalex.org/', ''),
    title: shortName,
    year: work.publication_year,
    citations: work.cited_by_count || 0,
    author: authorName,
    domain: primaryTopic?.domain?.display_name || '',
    field: primaryTopic?.field?.display_name || '',
    isOpenAccess: work.open_access?.is_oa || false,
    note: cleanTitle,
    type,
    shape: 'card',
    priority: 'normal',
    x: 0,
    y: 0
  };
}

export async function POST(req: Request) {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      function sendEvent(type: string, data: any) {
        controller.enqueue(encoder.encode(`event: ${type}\ndata: ${JSON.stringify(data)}\n\n`));
      }

      try {
        const { command, nodes, edges, selectedIds, provider = 'groq', model, chatHistory = [] } = await req.clone().json();
        
        sendEvent('status', { message: 'Understanding request...' });

        // Build context
        const contextNodes = nodes.map((n: any) => ({
          id: n.id,
          openAlexId: n.id.startsWith('W') ? n.id : undefined,
          title: n.title,
          authors: [n.author].filter(Boolean),
          year: n.year,
          type: n.type,
          citations: n.citations,
          field: n.field,
          x: Math.round(n.x),
          y: Math.round(n.y),
          width: n.width,
          height: n.height
        }));
        
        const systemPrompt = `You are Nagi Canvas Agent, an AI operator inside a visual academic research workspace. Your job is not to chat. Your job is to understand the user's research intent, inspect the supplied canvas state, and produce the smallest high-value structured plan that transforms the workspace toward the user's goal. Note that node context includes their physical x,y position and width/height dimensions, use these to understand spatial relationships and plan layouts.

CRITICAL RULES:
- Never make a mutation merely to appear active.
- If the command requires no change, return NO_OP.
- Never move unrelated nodes.
- Never rename papers.
- Never fabricate research content.
- Never duplicate an existing paper.
- Make the smallest set of changes that fully satisfies the request.

Available Action Types:
- FIND_RELATED: Find papers related to source nodes.
- SEARCH_AND_ADD: Search by query and add. Use the 'query' field.
- ORGANIZE_BY_THEME: Cluster existing nodes.
- ORGANIZE_BY_YEAR: Timeline layout.
- CLEANUP_LAYOUT: Run deterministic layout cleanup.
- REMOVE_NODES: Delete specific nodes by putting their IDs in targetNodeIds. To delete ALL nodes, you MUST set "targetNodeIds": ["all"].
- NO_OP: Do nothing.

Current Canvas State:
${JSON.stringify({ nodes: contextNodes, selectedIds }, null, 2)}

Respond ONLY with a JSON object matching this schema:
{
  "intent": "Short description of what you plan to do",
  "reasoning_summary": "Why this action is needed",
  "requiresRetrieval": true,
  "actions": [
    {
      "type": "ActionType",
      "sourceNodeIds": ["id1"],
      "targetNodeIds": ["id2"],
      "query": "query string",
      "reason": "Why this specific action",
      "confidence": 0.95
    }
  ]
}`;

        let aiResponse = await callAI(provider as AIProvider, {
          messages: [
            { role: "system", content: systemPrompt },
            ...chatHistory,
            { role: "user", content: command }
          ],
          model,
          jsonMode: true,
        });

        let jsonText = aiResponse.content.replace(/```json/gi, '').replace(/```/g, '').trim();
        let plan: ActionPlan;
        try {
          plan = JSON.parse(jsonText);
        } catch (e: any) {
          // Retry with repair
          const repairPrompt = `Your previous output was invalid JSON: ${e.message}. Return ONLY a valid JSON object matching the schema, no markdown, no prose.`;
          const repairResponse = await callAI(provider as AIProvider, {
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: command },
              { role: "assistant", content: aiResponse.content },
              { role: "system", content: repairPrompt }
            ],
            model,
            jsonMode: true,
          });
          jsonText = repairResponse.content.replace(/```json/gi, '').replace(/```/g, '').trim();
          plan = JSON.parse(jsonText); // if this fails, we throw to the outer catch
        }

        sendEvent('status', { message: plan.intent || 'Executing plan...' });

        const mutations: CanvasMutationOp[] = [];
        let summaryMessage = plan.reasoning_summary;

        // Execute plan deterministically
        for (const action of plan.actions) {
          if (action.type === 'SEARCH_AND_ADD' && action.query) {
            sendEvent('status', { message: 'Searching literature...' });
            const { papers } = await searchPapers(action.query);
            if (papers.length > 0) {
              const newNodes = papers.map(p => ({
                id: p.id,
                title: p.title,
                year: p.publicationYear,
                citations: p.citationCount,
                author: p.authors?.[0] || '',
                domain: p.domain || '',
                field: p.field || '',
                isOpenAccess: p.isOpenAccess || false,
                type: 'paper',
                shape: 'card',
                priority: 'normal',
                x: 0,
                y: 0
              }));
              
              const existingIds = new Set(nodes.map((n:any) => n.id));
              const filteredNodes = newNodes.filter(n => !existingIds.has(n.id)).slice(0, 6);
              
              if (filteredNodes.length > 0) {
                let cx = 500, cy = 500;
                if (action.sourceNodeIds && action.sourceNodeIds.length > 0) {
                  const src = nodes.find((n:any) => action.sourceNodeIds!.includes(n.id));
                  if (src) { cx = src.x; cy = src.y; }
                } else if (selectedIds.length > 0) {
                  const src = nodes.find((n:any) => selectedIds.includes(n.id));
                  if (src) { cx = src.x; cy = src.y; }
                }
                
                const laidOutNodes = radialExpansion({x: cx, y: cy}, filteredNodes);
                mutations.push({ type: 'add_nodes', nodes: laidOutNodes });
                
                if (action.sourceNodeIds && action.sourceNodeIds.length > 0) {
                  const edges = laidOutNodes.map(n => ({
                    id: `edge-${Date.now()}-${Math.random()}`,
                    source: action.sourceNodeIds![0],
                    target: n.id,
                    type: 'custom'
                  }));
                  mutations.push({ type: 'add_edges', edges });
                }
              }
            }
          }
          else if (action.type === 'CLEANUP_LAYOUT') {
            sendEvent('status', { message: 'Cleaning up layout...' });
            const targetNodes = action.targetNodeIds?.length ? nodes.filter((n:any) => action.targetNodeIds!.includes(n.id)) : nodes;
            const cleanedNodes = cleanupLayout(targetNodes);
            const updates = cleanedNodes.map(n => ({ id: n.id, changes: { x: n.x, y: n.y } }));
            mutations.push({ type: 'update_nodes', updates });
          }
          else if (action.type === 'ORGANIZE_BY_YEAR') {
            sendEvent('status', { message: 'Organizing into timeline...' });
            const targetNodes = action.targetNodeIds?.length ? nodes.filter((n:any) => action.targetNodeIds!.includes(n.id)) : (selectedIds.length ? nodes.filter((n:any) => selectedIds.includes(n.id)) : nodes);
            if (targetNodes.length > 0) {
              const startX = Math.min(...targetNodes.map((n:any) => n.x));
              const startY = Math.min(...targetNodes.map((n:any) => n.y));
              const arranged = chronologicalTimeline({x: startX, y: startY}, targetNodes);
              const updates = arranged.map(n => ({ id: n.id, changes: { x: n.x, y: n.y } }));
              mutations.push({ type: 'update_nodes', updates });
            }
          }
          else if (action.type === 'ORGANIZE_BY_THEME') {
            sendEvent('status', { message: 'Organizing by theme...' });
            const targetNodes = action.targetNodeIds?.length ? nodes.filter((n:any) => action.targetNodeIds!.includes(n.id)) : (selectedIds.length ? nodes.filter((n:any) => selectedIds.includes(n.id)) : nodes);
            if (targetNodes.length > 0) {
              const groups: Record<string, any[]> = {};
              targetNodes.forEach((n:any) => {
                const theme = n.field || n.domain || 'General';
                if (!groups[theme]) groups[theme] = [];
                groups[theme].push(n);
              });
              
              const clusters = Object.keys(groups).map(theme => ({
                theme,
                nodes: groups[theme]
              }));
              
              const startX = Math.min(...targetNodes.map((n:any) => n.x));
              const startY = Math.min(...targetNodes.map((n:any) => n.y));
              
              thematicClustering({x: startX, y: startY}, clusters);
              
              const updates = targetNodes.map((n:any) => ({ id: n.id, changes: { x: n.x, y: n.y } }));
              mutations.push({ type: 'update_nodes', updates });
            }
          }
          else if (action.type === 'FIND_RELATED') {
            sendEvent('status', { message: 'Finding related papers...' });
            const sourceId = action.sourceNodeIds?.[0] || selectedIds[0];
            if (sourceId) {
              const centerWork = await fetchWork(sourceId);
              if (centerWork) {
                const relatedWorks = await fetchMultipleWorks(centerWork.related_works || []);
                const existingIds = new Set(nodes.map((n:any) => n.id));
                const newNodes = relatedWorks
                  .filter((w: any) => !existingIds.has(w.id.replace('https://openalex.org/', '')))
                  .slice(0, 6)
                  .map((w: any) => workToNode(w, 'related'));

                if (newNodes.length > 0) {
                  const src = nodes.find((n:any) => n.id === sourceId);
                  const cx = src ? src.x : 500;
                  const cy = src ? src.y : 500;
                  
                  const laidOutNodes = radialExpansion({x: cx, y: cy}, newNodes);
                  mutations.push({ type: 'add_nodes', nodes: laidOutNodes });
                  
                  const edges = laidOutNodes.map(n => ({
                    id: `edge-${Date.now()}-${Math.random()}`,
                    source: sourceId,
                    target: n.id,
                    type: 'references'
                  }));
                  mutations.push({ type: 'add_edges', edges });
                }
              }
            }
          }
          else if (action.type === 'REMOVE_NODES') {
             sendEvent('status', { message: 'Removing nodes...' });
             let ids = action.targetNodeIds || [];
             if (ids.length === 0 && selectedIds.length > 0) {
               ids = selectedIds;
             }
             if (ids.length === 1 && ids[0] === 'all') {
               ids = nodes.map((n:any) => n.id);
             } else if (ids.length === 0 && command.toLowerCase().includes('all')) {
               // Fallback: if LLM missed ["all"] but command asked for all nodes
               ids = nodes.map((n:any) => n.id);
             }
             if (ids && ids.length > 0) {
               mutations.push({ type: 'remove_nodes', nodeIds: ids });
             }
          }
        }

        // --- Post-Process: Server-side auto-layout & Edge validation ---
        const existingNodePositions = nodes.map((n:any) => ({ x: n.x, y: n.y }));
        mutations.forEach(op => {
          if (op.type === 'add_nodes' && op.nodes) {
            op.nodes.forEach(n => {
              // Only distinct or non-colliding
              let collides = existingNodePositions.some((p: any) => Math.hypot(p.x - n.x, p.y - n.y) < 180) || (n.x === 0 && n.y === 0);
              let angle = 0;
              let radius = 220;
              let cx = 500, cy = 500;
              
              if (selectedIds.length > 0) {
                const src = nodes.find((node:any) => selectedIds.includes(node.id));
                if (src) { cx = src.x; cy = src.y; }
              }

              while (collides) {
                n.x = cx + Math.cos(angle) * radius;
                n.y = cy + Math.sin(angle) * radius;
                angle += Math.PI / 4;
                if (angle >= Math.PI * 2) {
                  angle = 0;
                  radius += 220;
                }
                collides = existingNodePositions.some((p: any) => Math.hypot(p.x - n.x, p.y - n.y) < 180);
              }
              existingNodePositions.push({ x: n.x, y: n.y });
            });
          }
        });

        const allValidNodeIds = new Set(nodes.map((n:any) => n.id));
        mutations.forEach(op => {
          if (op.type === 'add_nodes' && op.nodes) {
            op.nodes.forEach(n => allValidNodeIds.add(n.id));
          }
        });
        mutations.forEach(op => {
          if (op.type === 'add_edges' && op.edges) {
            op.edges = op.edges.filter(e => allValidNodeIds.has(e.source) && allValidNodeIds.has(e.target));
          }
        });
        // --- End Post-Process ---

        sendEvent('complete', { operations: mutations, message: summaryMessage });
        controller.close();
      } catch (err: any) {
        console.error(err);
        sendEvent('error', { message: err.message });
        controller.close();
      }
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
