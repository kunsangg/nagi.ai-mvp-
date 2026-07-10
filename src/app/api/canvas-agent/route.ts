import { NextResponse } from 'next/server';
import { callAI } from '@/lib/ai/providers';
import { AIProvider } from '@/lib/ai/types';
import { ActionPlan, CanvasMutationOp } from '@/lib/ai/canvas-actions';
import { searchPapers, decodeAbstract, fetchCitations, fetchReferences } from '@/lib/providers/openalex';
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
- LITERATURE_SEARCH: Advanced search with filters (query, yearFrom, yearTo, limit, author, citationMin). Use to find specific papers.
- CITATION_SEARCH: Fetch papers citing or cited by target nodes. Set \`citationDirection\`="cites" (papers that cite the target) or "cited_by" (papers the target cites).
- GENERATE_TEXT_NODES: Create notes, summaries, hypotheses, tables, questions, task lists. Use \`generatedNodes\` array (title, content, type: note|hypothesis|question|task|table).
- PAPER_ANALYSIS: Deep analysis of selected papers. Server fetches abstracts and synthesizes them based on your \`analysisTask\` (e.g., "Summarize", "Compare methodologies", "Extract limitations", "Find gaps").
- CANVAS_LAYOUT: Layout algorithms. Set \`layoutType\` to 'theme', 'timeline', 'hierarchy', 'grid', or 'cleanup'.
- MANIPULATE_NODES: Hide, highlight, color, group, or remove specific nodes. Set \`nodeOperation\`. To delete ALL nodes, set \`nodeOperation\`="remove" and \`targetNodeIds\`=["all"].
- MANIPULATE_EDGES: Connect nodes or label relationships. Set \`edgeOperation\`="add"|"remove", \`edgeLabel\`, and \`edgeType\`.
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
      "filters": { "yearFrom": 2020 },
      "citationDirection": "cites",
      "generatedNodes": [{ "title": "Node title", "content": "Node content", "type": "note" }],
      "analysisTask": "Task description for secondary LLM",
      "layoutType": "theme",
      "nodeOperation": "highlight",
      "style": { "color": "#ff0000" },
      "edgeOperation": "add",
      "edgeLabel": "supports",
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
          if (action.type === 'LITERATURE_SEARCH') {
            sendEvent('status', { message: 'Searching literature...' });
            let query = action.query || '';
            if (query) {
              const { papers } = await searchPapers(query);
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
                const filteredNodes = newNodes.filter(n => !existingIds.has(n.id)).slice(0, action.filters?.limit || 6);
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
                }
              }
            }
          }
          else if (action.type === 'CITATION_SEARCH' && action.targetNodeIds) {
            sendEvent('status', { message: 'Searching citations...' });
            for (const id of action.targetNodeIds) {
              const srcNode = nodes.find((n:any) => n.id === id);
              if (srcNode) {
                const papers = action.citationDirection === 'cites' 
                  ? await fetchCitations(id, action.filters?.limit || 10) 
                  : await fetchReferences(id, action.filters?.limit || 10);
                
                if (papers.length > 0) {
                  const newNodes = papers.map((p: any) => ({
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
                  const filteredNodes = newNodes.filter(n => !existingIds.has(n.id)).slice(0, action.filters?.limit || 6);
                  
                  if (filteredNodes.length > 0) {
                    const laidOutNodes = radialExpansion({x: srcNode.x, y: srcNode.y}, filteredNodes);
                    mutations.push({ type: 'add_nodes', nodes: laidOutNodes });
                    
                    const edges = laidOutNodes.map(n => ({
                      id: `edge-${Date.now()}-${Math.random()}`,
                      source: action.citationDirection === 'cites' ? n.id : id,
                      target: action.citationDirection === 'cites' ? id : n.id,
                      type: 'references'
                    }));
                    mutations.push({ type: 'add_edges', edges });
                  }
                }
              }
            }
          }
          else if (action.type === 'GENERATE_TEXT_NODES' && action.generatedNodes) {
            sendEvent('status', { message: 'Generating nodes...' });
            let cx = 500, cy = 500;
            if (action.targetNodeIds && action.targetNodeIds.length > 0) {
              const src = nodes.find((n:any) => action.targetNodeIds!.includes(n.id));
              if (src) { cx = src.x; cy = src.y; }
            } else if (selectedIds.length > 0) {
              const src = nodes.find((n:any) => selectedIds.includes(n.id));
              if (src) { cx = src.x; cy = src.y; }
            }
            const newNodes = action.generatedNodes.map((n: any) => ({
              id: `node-${Date.now()}-${Math.random()}`,
              title: n.title,
              content: n.content,
              type: n.type || 'note',
              shape: 'card',
              x: cx + (Math.random() - 0.5) * 200,
              y: cy + (Math.random() - 0.5) * 200
            }));
            mutations.push({ type: 'add_nodes', nodes: newNodes });
          }
          else if (action.type === 'CANVAS_LAYOUT') {
            sendEvent('status', { message: 'Applying layout...' });
            const targetNodes = action.targetNodeIds?.length ? nodes.filter((n:any) => action.targetNodeIds!.includes(n.id)) : (selectedIds.length ? nodes.filter((n:any) => selectedIds.includes(n.id)) : nodes);
            if (targetNodes.length > 0) {
              if (action.layoutType === 'cleanup') {
                const cleanedNodes = cleanupLayout(targetNodes);
                const updates = cleanedNodes.map((n: any) => ({ id: n.id, changes: { x: n.x, y: n.y } }));
                mutations.push({ type: 'update_nodes', updates });
              } else if (action.layoutType === 'timeline') {
                const startX = Math.min(...targetNodes.map((n:any) => n.x));
                const startY = Math.min(...targetNodes.map((n:any) => n.y));
                const arranged = chronologicalTimeline({x: startX, y: startY}, targetNodes);
                const updates = arranged.map(n => ({ id: n.id, changes: { x: n.x, y: n.y } }));
                mutations.push({ type: 'update_nodes', updates });
              } else if (action.layoutType === 'theme') {
                const groups: Record<string, any[]> = {};
                targetNodes.forEach((n:any) => {
                  const theme = n.field || n.domain || 'General';
                  if (!groups[theme]) groups[theme] = [];
                  groups[theme].push(n);
                });
                const clusters = Object.keys(groups).map(theme => ({ theme, nodes: groups[theme] }));
                const startX = Math.min(...targetNodes.map((n:any) => n.x));
                const startY = Math.min(...targetNodes.map((n:any) => n.y));
                thematicClustering({x: startX, y: startY}, clusters);
                const updates = targetNodes.map((n:any) => ({ id: n.id, changes: { x: n.x, y: n.y } }));
                mutations.push({ type: 'update_nodes', updates });
              }
            }
          }
          else if (action.type === 'MANIPULATE_NODES') {
            sendEvent('status', { message: 'Updating nodes...' });
            let ids = action.targetNodeIds || [];
            if (ids.length === 0 && selectedIds.length > 0) {
               ids = selectedIds;
            }
            if (ids.length === 1 && ids[0] === 'all') {
               ids = nodes.map((n:any) => n.id);
            }
            if (ids && ids.length > 0) {
               if (action.nodeOperation === 'remove') {
                 mutations.push({ type: 'remove_nodes', nodeIds: ids });
               } else if (action.style) {
                 const updates = ids.map((id: string) => ({ id, changes: { style: action.style } }));
                 mutations.push({ type: 'update_nodes', updates });
               }
            }
          }
          else if (action.type === 'MANIPULATE_EDGES') {
            sendEvent('status', { message: 'Updating edges...' });
            if (action.edgeOperation === 'add' && action.sourceNodeIds && action.targetNodeIds) {
               const edges = [];
               for (const src of action.sourceNodeIds) {
                 for (const tgt of action.targetNodeIds) {
                    edges.push({
                      id: `edge-${Date.now()}-${Math.random()}`,
                      source: src,
                      target: tgt,
                      type: action.edgeType || 'custom',
                      label: action.edgeLabel
                    });
                 }
               }
               mutations.push({ type: 'add_edges', edges });
            }
          }
          else if (action.type === 'PAPER_ANALYSIS' && action.analysisTask) {
             sendEvent('status', { message: 'Analyzing papers...' });
             const targetNodes = action.targetNodeIds?.length ? nodes.filter((n:any) => action.targetNodeIds!.includes(n.id)) : (selectedIds.length ? nodes.filter((n:any) => selectedIds.includes(n.id)) : nodes);
             const abstracts = [];
             for (const n of targetNodes) {
               const work = await fetchWork(n.id);
               if (work && work.abstract_inverted_index) {
                 abstracts.push({ title: n.title, content: Object.keys(work.abstract_inverted_index).join(' ') }); 
               }
             }
             if (abstracts.length > 0) {
               const analysisPrompt = `You are a research assistant. Synthesize the following papers based on this task: "${action.analysisTask}". Return ONLY a JSON object: { "title": "Node title", "content": "Analysis content" }. Papers: ${JSON.stringify(abstracts)}`;
               const analysisRes = await callAI(provider as AIProvider, { messages: [{ role: "system", content: analysisPrompt }], model, jsonMode: true });
               try {
                 const parsed = JSON.parse(analysisRes.content.replace(/```json/gi, '').replace(/```/g, '').trim());
                 let cx = 500, cy = 500;
                 if (targetNodes.length > 0) { cx = targetNodes[0].x; cy = targetNodes[0].y; }
                 mutations.push({
                   type: 'add_nodes',
                   nodes: [{
                     id: `node-${Date.now()}-${Math.random()}`,
                     title: parsed.title || 'Analysis',
                     content: parsed.content || 'No content generated.',
                     type: 'note',
                     shape: 'card',
                     x: cx + 150,
                     y: cy + 150
                   }]
                 });
                 mutations.push({
                   type: 'add_edges',
                   edges: targetNodes.map((n:any) => ({
                     id: `edge-${Date.now()}-${Math.random()}`,
                     source: n.id,
                     target: mutations[mutations.length-1].nodes![0].id,
                     type: 'custom',
                     label: 'analyzed in'
                   }))
                 });
               } catch (e) {
                 console.error('Failed to parse paper analysis', e);
               }
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
