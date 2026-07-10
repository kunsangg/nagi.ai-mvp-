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

  const maxTokens = 3000;

  const initialMessages = [
    {
      role: "system" as const,
      content: "You are an expert empirical research assistant. Respond ONLY with a valid JSON object.",
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
    
    return NextResponse.json({ evidence: parsed });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Unknown error' }, { status: 500 });
  }
}
