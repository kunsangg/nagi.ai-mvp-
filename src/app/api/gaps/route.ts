import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { paper } = await req.json() as { paper: { id: string; title: string; abstract?: string; authors?: string[]; year?: number } };

  if (!paper) {
    return NextResponse.json({ error: "Paper is required for gap analysis" }, { status: 400 });
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return NextResponse.json({
      gaps: {
        summary: "AI Gap Analysis is disabled. Please add a GROQ_API_KEY to your environment variables.",
        limitations: [],
        unexploredAreas: [],
        futureQuestions: []
      }
    });
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

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "llama-3.1-8b-instant",
      max_tokens: 2000,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: "You are an expert academic research assistant. Respond ONLY with a valid JSON object.",
        },
        { role: "user", content: prompt },
      ],
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    return NextResponse.json(
      { error: data.error?.message || "Groq API error" },
      { status: 500 }
    );
  }

  const text = data.choices?.[0]?.message?.content || "{}";

  try {
    const parsed = JSON.parse(text);
    return NextResponse.json({ gaps: parsed });
  } catch {
    return NextResponse.json({ error: "Failed to parse AI response" }, { status: 500 });
  }
}
