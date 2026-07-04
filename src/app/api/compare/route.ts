import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { papers } = await req.json() as { papers: { id: string; title: string; abstract?: string; authors?: string[]; year?: number }[] };

  if (!papers || papers.length < 2) {
    return NextResponse.json({ error: "At least two papers are required for comparison" }, { status: 400 });
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return NextResponse.json({
      comparison: {
        summary: "AI Comparison is disabled. Please add a GROQ_API_KEY to your environment variables.",
        dimensions: []
      }
    });
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

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "llama-3.1-8b-instant",
      max_tokens: 3000,
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
    return NextResponse.json({ comparison: parsed });
  } catch {
    return NextResponse.json({ error: "Failed to parse AI response" }, { status: 500 });
  }
}
