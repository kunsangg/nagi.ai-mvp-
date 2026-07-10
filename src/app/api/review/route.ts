import { NextResponse } from "next/server";
import { callAI } from "@/lib/ai/providers";
import { AIProvider } from "@/lib/ai/types";

export async function POST(req: Request) {
  const { papers, provider = 'groq' } = await req.json() as { 
    papers: { title: string; abstract?: string; authors?: string[]; year?: number; journal?: string; citationCount?: number }[];
    provider?: string;
  };

  if (!papers?.length) {
    return NextResponse.json({ error: "No papers provided" }, { status: 400 });
  }

  const papersList = papers
    .map((p, i) => {
      const authors = p.authors?.slice(0, 3).join(", ") + (p.authors && p.authors.length > 3 ? " et al." : "");
      return `[${i + 1}] ${p.title}${p.year ? ` (${p.year})` : ""}${authors ? ` — ${authors}` : ""}${p.journal ? ` — ${p.journal}` : ""}${p.abstract ? `\nAbstract: ${p.abstract.slice(0, 400)}` : ""}`;
    })
    .join("\n\n");

  const prompt = `You are an expert academic research assistant. Given the following ${papers.length} academic papers, write a structured literature review.

PAPERS:
${papersList}

Return a JSON object with this EXACT shape (no markdown, no backticks, just valid JSON):
{
  "introduction": "2-3 paragraph introduction synthesising the research area, historical context, and why these papers matter (200-250 words)",
  "themes": [
    { "title": "Theme title", "content": "2-3 paragraphs discussing papers related to this theme with in-text citations like [1][3] (150-200 words)" }
  ],
  "keyFindings": ["Finding 1 with citation [1]", "Finding 2 with citation [2]", "Finding 3"],
  "researchGaps": ["Gap 1", "Gap 2", "Gap 3"],
  "conclusion": "2-3 paragraph conclusion synthesising the field and future directions (150-200 words)"
}

Use 2-4 themes. Always cite papers by number in square brackets. Write in formal academic prose.`;

  const maxTokens = Math.min(6000, 2500 + Math.max(0, papers.length - 3) * 400);

  const initialMessages = [
    {
      role: "system" as const,
      content: "You are an expert academic research assistant. Respond ONLY with a valid JSON object, no markdown, no backticks, no preamble.",
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
    
    return NextResponse.json({ review: parsed });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Unknown error' }, { status: 500 });
  }
}
