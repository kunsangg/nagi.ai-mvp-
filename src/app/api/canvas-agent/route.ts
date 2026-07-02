import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { command, nodes, edges, selectedIds } = await req.json();

    if (!command || typeof command !== 'string') {
      return NextResponse.json({ error: 'Valid command string is required' }, { status: 400 });
    }

    const groqKey = process.env.GROQ_API_KEY;
    if (!groqKey) {
      return NextResponse.json({ 
        error: 'GROQ_API_KEY is not configured in .env.local. Please add it to your environment variables.'
      }, { status: 500 });
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
- "add_nodes": { type: "add_nodes", nodes: [{ id, title, type, shape, x, y }] }
  - Allowed node types: "paper", "timeline", "frame", "note", "question"
- "add_edges": { type: "add_edges", edges: [{ source, target, type, label }] }
- "update_nodes": { type: "update_nodes", updates: [{ id, changes: { x, y } }] }

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
        { "id": "paper-1", "title": "Quantum Batteries: A Review", "type": "paper", "shape": "card", "x": ${centerX}, "y": ${centerY - 150} }
      ]
    }
  ]
}

Only return valid JSON matching this schema. Never return markdown blocks.`;

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${groqKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: command }
        ],
        response_format: { type: "json_object" },
        temperature: 0.2
      })
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("Groq API Error:", text);
      return NextResponse.json({ error: "Failed to communicate with Groq API" }, { status: 500 });
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    const parsed = JSON.parse(content);

    return NextResponse.json({
      message: parsed.message || "Canvas updated.",
      operations: parsed.operations || []
    });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
