import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { command, nodes, edges, selectedIds } = await req.json();

    if (!command || typeof command !== 'string') {
      return NextResponse.json({ error: 'Valid command string is required' }, { status: 400 });
    }

    const cmd = command.toLowerCase();
    const ops: any[] = [];
    
    // Calculate a good spawn point (center of selected nodes, or just somewhere near the center)
    const selectedNodes = nodes.filter((n: any) => selectedIds.includes(n.id));
    const centerX = selectedNodes.length > 0 
      ? selectedNodes.reduce((sum: number, n: any) => sum + n.x, 0) / selectedNodes.length
      : 500;
    const centerY = selectedNodes.length > 0 
      ? selectedNodes.reduce((sum: number, n: any) => sum + n.y, 0) / selectedNodes.length
      : 500;

    // Simulate AI thinking time
    await new Promise(resolve => setTimeout(resolve, 1500));

    // 1. "Find papers about quantum batteries"
    if (cmd.includes('find papers') || cmd.includes('quantum batteries')) {
      const p1Id = `paper-${Date.now()}-1`;
      const p2Id = `paper-${Date.now()}-2`;
      const p3Id = `paper-${Date.now()}-3`;
      
      ops.push({
        type: 'add_nodes',
        nodes: [
          { id: p1Id, title: "Quantum Batteries: A Review", type: "paper", shape: "card", priority: "normal", x: centerX, y: centerY - 150, author: "Smith et al.", year: 2023 },
          { id: p2Id, title: "Fast Charging in Quantum Batteries", type: "paper", shape: "card", priority: "normal", x: centerX - 160, y: centerY + 50, author: "Chen et al.", year: 2024 },
          { id: p3Id, title: "Decoherence in Quantum Storage", type: "paper", shape: "card", priority: "normal", x: centerX + 160, y: centerY + 50, author: "Doe et al.", year: 2022 }
        ]
      });
      ops.push({
        type: 'add_edges',
        edges: [
          { source: p1Id, target: p2Id, type: "reference", label: "References" },
          { source: p1Id, target: p3Id, type: "reference", label: "References" }
        ]
      });
    }

    // 2. "Generate a timeline"
    else if (cmd.includes('timeline')) {
      const timelineId = `timeline-${Date.now()}`;
      ops.push({
        type: 'add_nodes',
        nodes: [{ id: timelineId, title: "Evolution of Topic", type: "timeline", shape: "card", priority: "normal", x: centerX, y: centerY - 200, customColor: "#6366f1" }]
      });
      
      // Update selected nodes to align horizontally
      const updates = selectedNodes.map((n: any, i: number) => ({
        id: n.id,
        changes: { x: centerX + (i - (selectedNodes.length-1)/2) * 300, y: centerY }
      }));
      ops.push({ type: 'update_nodes', updates });
      
      // Connect timeline to papers
      const edgesToAdd = selectedNodes.map((n: any) => ({
        source: timelineId, target: n.id, type: "custom", label: "Event"
      }));
      ops.push({ type: 'add_edges', edges: edgesToAdd });
    }

    // 3. "Cluster these papers"
    else if (cmd.includes('cluster')) {
      const updates = selectedNodes.map((n: any, i: number) => {
        const angle = (i / selectedNodes.length) * Math.PI * 2;
        const radius = 250;
        return {
          id: n.id,
          changes: { x: centerX + Math.cos(angle) * radius, y: centerY + Math.sin(angle) * radius }
        };
      });
      ops.push({ type: 'update_nodes', updates });
      
      // Spawn a frame behind them
      ops.push({
        type: 'add_nodes',
        nodes: [{ id: `frame-${Date.now()}`, title: "Cluster 1", type: "frame", shape: "card", priority: "normal", x: centerX, y: centerY }]
      });
    }

    // 4. "Find contradictions"
    else if (cmd.includes('contradict')) {
      if (selectedNodes.length >= 2) {
        ops.push({
          type: 'add_edges',
          edges: [
            { source: selectedNodes[0].id, target: selectedNodes[1].id, type: "custom", label: "Contradicts" }
          ]
        });
      }
    }

    // 5. "Generate literature review"
    else if (cmd.includes('review')) {
      const reviewText = selectedNodes.length > 0 
        ? `### Literature Review\n\nReviewed ${selectedNodes.length} papers. The consensus is that quantum advantage in batteries is theoretically sound but faces decoherence challenges...`
        : `### Literature Review\n\nPlease select some papers first.`;
        
      ops.push({
        type: 'add_nodes',
        nodes: [
          { id: `note-${Date.now()}`, title: "Literature Review", note: reviewText, type: "note", shape: "card", priority: "high", x: centerX + 300, y: centerY }
        ]
      });
    }

    // Default response if no match
    else {
      ops.push({
        type: 'add_nodes',
        nodes: [
          { id: `note-${Date.now()}`, title: "AI Response", note: `I'm not sure how to "${command}". Try asking me to find papers, generate a timeline, or cluster selected items.`, type: "note", shape: "card", priority: "normal", x: centerX, y: centerY }
        ]
      });
    }

    return NextResponse.json({ operations: ops });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to process AI command', details: error.message }, { status: 500 });
  }
}
