import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { papers } = await req.json() as { papers: { title: string; abstract?: string; authors?: string[]; year?: number; journal?: string; citationCount?: number }[] };

  if (!papers?.length) {
    return NextResponse.json({ error: "No papers provided" }, { status: 400 });
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return NextResponse.json({
      review: {
        introduction: "AI Literature Review is disabled. Please add a GROQ_API_KEY to your environment variables.",
        themes: [],
        keyFindings: [],
        researchGaps: [],
        conclusion: "",
      },
    });
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

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "llama-3.1-8b-instant",
      max_tokens: 2500,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: "You are an expert academic research assistant. Respond ONLY with a valid JSON object, no markdown, no backticks, no preamble.",
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
    return NextResponse.json({ review: parsed });
  } catch {
    return NextResponse.json({ error: "Failed to parse AI response" }, { status: 500 });
  }
}
