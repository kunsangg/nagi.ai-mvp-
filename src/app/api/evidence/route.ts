import { NextResponse } from "next/server";
import { callAI } from "@/lib/ai/providers";
import { AIProvider } from "@/lib/ai/types";

export async function POST(req: Request) {
  const { paper, provider = 'groq' } = await req.json() as { 
    paper: { id: string; title: string; abstract?: string; authors?: string[]; year?: number };
    provider?: string;
  };

  if (!paper) {
    return NextResponse.json({ error: "Paper is required for evidence analysis" }, { status: 400 });
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

  try {
    const aiResponse = await callAI(provider as AIProvider, {
      messages: [
        {
          role: "system",
          content: "You are an expert empirical research assistant. Respond ONLY with a valid JSON object.",
        },
        { role: "user", content: prompt },
      ],
      maxTokens: 2000,
      jsonMode: true,
    });

    try {
      const parsed = JSON.parse(aiResponse.content);
      return NextResponse.json({ evidence: parsed });
    } catch {
      return NextResponse.json({ error: "Failed to parse AI response" }, { status: 500 });
    }
  } catch (error: any) {
    return NextResponse.json({
      evidence: {
        verdict: `AI Evidence Analysis Error: ${error?.message || 'Unknown error'}`,
        dataSources: [],
        keyMetrics: [],
        claims: []
      }
    });
  }
}
