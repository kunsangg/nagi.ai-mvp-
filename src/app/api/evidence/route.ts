import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { paper } = await req.json() as { paper: { id: string; title: string; abstract?: string; authors?: string[]; year?: number } };

  if (!paper) {
    return NextResponse.json({ error: "Paper is required for evidence analysis" }, { status: 400 });
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return NextResponse.json({
      evidence: {
        verdict: "AI Evidence Analysis is disabled. Please add a GROQ_API_KEY to your environment variables.",
        dataSources: [],
        keyMetrics: [],
        claims: []
      }
    });
  }

  const paperContext = `
Title: ${paper.title}
Year: ${paper.year || 'N/A'}
Authors: ${paper.authors ? paper.authors.slice(0,3).join(", ") : 'N/A'}
Abstract: ${paper.abstract || 'N/A'}
  `;

  const prompt = `You are an expert data scientist and empirical researcher. Extract the hard evidence, data sources, metrics, and empirical claims from the following academic paper abstract.

${paperContext}

Return a JSON object with this EXACT structure (no markdown, no preamble):
{
  "verdict": "1-2 sentences summarizing how empirically strong the evidence appears based on the abstract (e.g., 'This paper relies on a large-scale RCT, providing strong empirical backing...' or 'This appears to be a theoretical paper with limited direct empirical evidence.').",
  "dataSources": [
    {
      "source": "Short name of data source (e.g., 'NHANES 2018-2020' or 'N=120 Patients')",
      "description": "Details about the sample, population, or dataset used."
    }
  ],
  "keyMetrics": [
    {
      "metric": "Short name of metric (e.g., 'Mortality Rate', 'P-Value', 'Accuracy')",
      "description": "How it was measured or what the specific reported value was."
    }
  ],
  "claims": [
    {
      "claim": "A specific empirical claim made by the authors.",
      "support": "The data or finding that directly supports this claim (if mentioned)."
    }
  ]
}

If any category is not mentioned in the abstract, return an empty array for it. Be highly precise, extracting exactly what is written rather than inventing plausible data. Keep the descriptions concise and focused on the evidence.`;

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
          content: "You are an expert empirical research assistant. Respond ONLY with a valid JSON object.",
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
    return NextResponse.json({ evidence: parsed });
  } catch {
    return NextResponse.json({ error: "Failed to parse AI response" }, { status: 500 });
  }
}
