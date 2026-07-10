import { NextResponse } from 'next/server';
import { callAI } from '@/lib/ai/providers';
import { AIProvider } from '@/lib/ai/types';

export async function POST(req: Request) {
  const { title, abstract, provider = 'fireworks' } = await req.json();

  if (!abstract) return NextResponse.json({ summary: '', keyFindings: [] });

  const prompt = `Given this academic paper, return a JSON object with this exact shape:
{"summary": "2-3 sentence plain English explanation of what this paper does and why it matters to someone outside the field", "keyFindings": ["finding 1", "finding 2", "finding 3"]}

Title: ${title}
Abstract: ${abstract}`;

  const maxTokens = 600;

  const initialMessages = [
    {
      role: 'system' as const,
      content: 'You are a research assistant. Respond ONLY with a valid JSON object, no markdown, no backticks, no preamble, no explanation.',
    },
    {
      role: 'user' as const,
      content: prompt,
    },
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
    
    return NextResponse.json(parsed);
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Unknown error' }, { status: 500 });
  }
}
