import { NextResponse } from "next/server";
import { callAI } from "@/lib/ai/providers";
import { AIProvider } from "@/lib/ai/types";

export async function POST(req: Request) {
  const { papers, provider = 'fireworks' } = await req.json() as { 
    papers: { id: string; title: string; abstract?: string; authors?: string[]; year?: number }[];
    provider?: string;
  };

  if (!papers || papers.length < 2) {
    return NextResponse.json({ error: "At least two papers are required for comparison" }, { status: 400 });
  }

  const papersContext = papers.map((p, i) => `
Paper [${i + 1}]:
ID: ${p.id}
Title: ${p.title}
Year: ${p.year || 'N/A'}
Authors: ${p.authors ? p.authors.slice(0,3).join(", ") : 'N/A'}
Abstract: ${p.abstract || 'N/A'}
  `).join("\n");

  const prompt = `You are an expert research scientist and literature review specialist. Compare the following ${papers.length} academic papers across several key dimensions.

${papersContext}

Return a JSON object with this EXACT structure (no markdown, no preamble):
{
  "summary": "1-2 paragraphs summarizing the overall similarities, conflicts, and relationship between the papers.",
  "matrix": {
    "dimensions": ["Methodology / Study Design", "Sample / Dataset", "Key Setting / Context"],
    "papers": {
      "paperId1": ["Value for Method", "Value for Sample", "Value for Context"],
      "paperId2": ["Value for Method", "Value for Sample", "Value for Context"]
    }
  },
  "dimensions": [
    {
      "name": "Methodological Approach",
      "synthesis": "A 2-3 sentence synthesis comparing their approaches (e.g., paper A used X while paper B used Y, making A more robust but B more scalable).",
      "paperDetails": {
        "paperId1": ["Bullet point 1 detailing the method", "Bullet point 2"],
        "paperId2": ["Bullet point 1 detailing the method", "Bullet point 2"]
        // EXACT paper IDs as keys
      }
    },
    {
      "name": "Key Findings & Results",
      "synthesis": "Do the findings align, contradict, or complement each other?",
      "paperDetails": {}
    },
    {
      "name": "Limitations & Biases",
      "synthesis": "What are the common or contrasting weaknesses?",
      "paperDetails": {}
    }
  ],
  "practicalImplications": [
    "Practical takeaway or future research direction 1 based on synthesizing these papers",
    "Practical takeaway 2"
  ]
}

Ensure that the keys inside 'papers' in the matrix and 'paperDetails' in the dimensions EXACTLY match the IDs provided: ${papers.map(p => `"${p.id}"`).join(", ")}.
If a paper doesn't explicitly state something, say "Not explicitly stated" or infer reasonably from the abstract. Be highly analytical, precise, and academic.`;

  const maxTokens = Math.min(6000, 3000 + Math.max(0, papers.length - 2) * 500);

  const initialMessages = [
    {
      role: "system" as const,
      content: "You are an expert academic research assistant. Respond ONLY with a valid JSON object.",
    },
    { role: "user" as const, content: prompt },
  ];

  try {
    const aiResponse = await callAI(provider as AIProvider, {
      messages: initialMessages,
      maxTokens,
      jsonMode: true,
    });

    let jsonText = aiResponse.content.replace(/```json/gi, '').replace(/```/g, '').trim();
    let parsed: any;
    try {
      parsed = JSON.parse(jsonText);
    } catch (e: any) {
      const brokenOutput = aiResponse.content.substring(0, 2000);
      const repairPrompt = `Your previous output was invalid JSON: ${e.message}. Here is the broken output:\n\n${brokenOutput}\n\nReturn ONLY a valid JSON object matching the original schema, no markdown, no prose.`;
      const repairResponse = await callAI(provider as AIProvider, {
        messages: [
          ...initialMessages,
          { role: "system" as const, content: repairPrompt }
        ],
        maxTokens,
        jsonMode: true,
      });
      jsonText = repairResponse.content.replace(/```json/gi, '').replace(/```/g, '').trim();
      parsed = JSON.parse(jsonText);
    }
    
    return NextResponse.json({ comparison: parsed });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Unknown error' }, { status: 500 });
  }
}
