import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const { title, abstract } = await req.json();

  if (!abstract) return NextResponse.json({ summary: '', keyFindings: [] });

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ 
      summary: "AI Summarization is currently disabled. Please add a GROQ_API_KEY to your environment variables to enable this feature.", 
      keyFindings: ["Feature disabled (Missing API Key)"] 
    });
  }

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'llama3-8b-8192',
      max_tokens: 600,
      messages: [
        {
          role: 'system',
          content: 'You are a research assistant. Respond ONLY with a valid JSON object, no markdown, no backticks, no preamble, no explanation.',
        },
        {
          role: 'user',
          content: `Given this academic paper, return a JSON object with this exact shape:
{"summary": "2-3 sentence plain English explanation of what this paper does and why it matters to someone outside the field", "keyFindings": ["finding 1", "finding 2", "finding 3"]}

Title: ${title}
Abstract: ${abstract}`,
        },
      ],
    }),
  });

  const data = await response.json();
  const text = data.choices?.[0]?.message?.content || '{}';

  try {
    const parsed = JSON.parse(text);
    return NextResponse.json(parsed);
  } catch {
    return NextResponse.json({ summary: text, keyFindings: [] });
  }
}
