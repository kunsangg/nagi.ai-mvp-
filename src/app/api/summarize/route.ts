import { NextResponse } from 'next/server';
import { callAI } from '@/lib/ai/providers';
import { AIProvider } from '@/lib/ai/types';

export async function POST(req: Request) {
  const { title, abstract, provider = 'groq' } = await req.json();

  if (!abstract) return NextResponse.json({ summary: '', keyFindings: [] });

  const prompt = `Given this academic paper, return a JSON object with this exact shape:
{"summary": "2-3 sentence plain English explanation of what this paper does and why it matters to someone outside the field", "keyFindings": ["finding 1", "finding 2", "finding 3"]}

Title: ${title}
Abstract: ${abstract}`;

  try {
    const aiResponse = await callAI(provider as AIProvider, {
      messages: [
        {
          role: 'system',
          content: 'You are a research assistant. Respond ONLY with a valid JSON object, no markdown, no backticks, no preamble, no explanation.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      maxTokens: 600,
      jsonMode: true,
    });

    try {
      const parsed = JSON.parse(aiResponse.content);
      return NextResponse.json(parsed);
    } catch {
      return NextResponse.json({ summary: aiResponse.content, keyFindings: [] });
    }
  } catch (error: any) {
    return NextResponse.json({
      summary: `AI Summarization Error: ${error?.message || 'Unknown error'}`,
      keyFindings: ["Please check your API key or usage limits."]
    });
  }
}
