import { NextResponse } from "next/server";
import { callAI } from "@/lib/ai/providers";
import { AIProvider } from "@/lib/ai/types";

export async function POST(req: Request) {
  const { paper, provider = 'fireworks' } = await req.json() as { 
    paper: { id: string; title: string; abstract?: string; authors?: string[]; year?: number };
    provider?: string;
  };

  if (!paper) {
    return NextResponse.json({ error: "Paper is required for gap analysis" }, { status: 400 });
  }

  const paperContext = `
Title: ${paper.title}
Year: ${paper.year || 'N/A'}
Authors: ${paper.authors ? paper.authors.slice(0,3).join(", ") : 'N/A'}
Abstract: ${paper.abstract || 'N/A'}
  `;

  const prompt = `You are an expert academic peer-reviewer and research strategist. Analyze the following academic paper and identify the primary research gaps, limitations, and future directions.

${paperContext}

Return a JSON object with this EXACT structure (no markdown, no preamble):
{
  "summary": "1-2 sentences summarizing the overall state of this research and its primary missing link.",
  "limitations": [
    {
      "title": "Short title (e.g., 'Sample Size Bias')",
      "description": "Detailed explanation of the limitation based on the abstract."
    }
  ],
  "unexploredAreas": [
    {
      "title": "Short title (e.g., 'Longitudinal Effects')",
      "description": "What contexts, populations, or methodologies were ignored?"
    }
  ],
  "futureQuestions": [
    "A specific, highly actionable research question that a future study could answer to address these gaps.",
    "Another specific research question."
  ]
}

Provide 2-3 items for limitations and unexplored areas, and exactly 3 future questions. Be highly analytical, precise, and academic. Do not invent facts, base the gaps entirely on what is logically missing from or constrained by the provided abstract.`;

  const maxTokens = 3000;

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
    
    return NextResponse.json({ gaps: parsed });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Unknown error' }, { status: 500 });
  }
}
