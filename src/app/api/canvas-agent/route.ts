import { NextResponse } from 'next/server';
import { callAI } from '@/lib/ai/providers';
import { AIProvider } from '@/lib/ai/types';

export async function POST(req: Request) {
  try {
    const { command, nodes, edges, selectedIds, provider = 'groq' } = await req.json();

    if (!command || typeof command !== 'string') {
      return NextResponse.json({ error: 'Valid command string is required' }, { status: 400 });
    }

    const selectedNodes = nodes.filter((n: any) => selectedIds.includes(n.id));
    const centerX = selectedNodes.length > 0 
      ? selectedNodes.reduce((sum: number, n: any) => sum + n.x, 0) / selectedNodes.length
      : 500;
    const centerY = selectedNodes.length > 0 
      ? selectedNodes.reduce((sum: number, n: any) => sum + n.y, 0) / selectedNodes.length
      : 500;

    const systemPrompt = `You are an AI Research Assistant integrated into an infinite canvas app.
Your job is to understand the user's request and output a JSON object containing:
1. "message": A conversational reply to the user.
2. "operations": An array of canvas mutation operations.

Allowed operation types:
- "add_nodes": { type: "add_nodes", nodes: [{ id, title, type, shape, priority, x, y }] }
  - Allowed node types: "paper", "timeline", "frame", "note", "question", "center", "comment"
  - priority MUST be "high", "medium", or "low"
- "add_edges": { type: "add_edges", edges: [{ id, source, target, type, label }] }
  - Allowed edge types: "solid", "dashed", "dotted"
- "update_nodes": { type: "update_nodes", updates: [{ id, changes: { x, y, title, type, width, height } }] }
- "remove_nodes": { type: "remove_nodes", nodeIds: ["id1", "id2"] }
- "remove_edges": { type: "remove_edges", edgeIds: ["id1", "id2"] }

Current canvas state:
- Nodes: ${JSON.stringify(nodes.map((n: any) => ({ id: n.id, title: n.title, type: n.type })))}
- Selected Node IDs: ${JSON.stringify(selectedIds)}
- Base Coordinate for new nodes: x=${centerX}, y=${centerY}

Example JSON Output:
{
  "message": "I have added 2 papers about quantum batteries.",
  "operations": [
    {
      "type": "add_nodes",
      "nodes": [
        { "id": "paper-1", "title": "Quantum Batteries: A Review", "type": "paper", "shape": "card", "priority": "high", "x": ${centerX}, "y": ${centerY - 150} }
      ]
    },
    {
      "type": "add_edges",
      "edges": [
        { "id": "edge-1", "source": "paper-1", "target": "existing-node-id", "type": "dashed", "label": "references" }
      ]
    }
  ]
}

Only return valid JSON matching this schema. Never return markdown blocks.`;

    const aiResponse = await callAI(provider as AIProvider, {
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: command }
      ],
      jsonMode: true,
    });

    // Robust JSON parsing to handle markdown blocks sometimes returned by LLMs
    let jsonText = aiResponse.content;
    jsonText = jsonText.replace(/```json/gi, '').replace(/```/g, '').trim();

    let parsed;
    try {
      parsed = JSON.parse(jsonText);
    } catch (e) {
      console.error("Failed to parse AI JSON:", jsonText);
      return NextResponse.json({ error: 'AI returned invalid JSON format' }, { status: 500 });
    }

    // Ensure generated nodes and edges have all required fields (like IDs)
    if (parsed.operations && Array.isArray(parsed.operations)) {
      parsed.operations.forEach((op: any) => {
        if (op.type === 'add_edges' && Array.isArray(op.edges)) {
          op.edges.forEach((edge: any) => {
            if (!edge.id) edge.id = 'edge-' + Math.random().toString(36).substr(2, 9);
            if (!edge.type) edge.type = 'solid';
          });
        }
        if (op.type === 'add_nodes' && Array.isArray(op.nodes)) {
          op.nodes.forEach((node: any) => {
            if (!node.id) node.id = 'node-' + Math.random().toString(36).substr(2, 9);
            if (!node.priority) node.priority = 'medium';
            if (!node.shape) node.shape = 'card';
            if (!node.type) node.type = 'note';
          });
        }
      });
    }

    return NextResponse.json({
      message: parsed.message || "Canvas updated.",
      operations: parsed.operations || []
    });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
