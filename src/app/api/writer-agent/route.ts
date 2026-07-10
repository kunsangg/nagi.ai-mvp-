import { NextResponse } from 'next/server';
import { callAI } from '@/lib/ai/providers';
import { AIProvider } from '@/lib/ai/types';

export async function POST(req: Request) {
  try {
    const { command, currentText, provider = 'fireworks' } = await req.json();

    if (!command || typeof command !== 'string') {
      return NextResponse.json({ error: 'Valid command string is required' }, { status: 400 });
    }

    const systemPrompt = `You are Nagi Research Assistant, an advanced AI integrated into a document writer.
Your job is to understand the user's request and edit, rewrite, or append to the provided text document.

The user will provide:
1. The Current Text (can be empty).
2. Their Command/Request (e.g. "write a conclusion", "write the paper on my behalf", "make it more formal").

You MUST return a JSON object containing:
1. "updatedText": The complete new text for the document.
2. "message": A brief conversational reply summarizing what you did (e.g., "I've drafted the paper for you.").

Example Output:
{
  "updatedText": "# Quantum Physics\\n\\nQuantum physics is the study of matter and energy at its most fundamental level.",
  "message": "I have written the introductory paragraph."
}

Only return valid JSON matching this schema. Never return markdown blocks enclosing the JSON.`;

    const userMessage = `Current Text:\n"""\n${currentText || "(empty)"}\n"""\n\nCommand:\n${command}`;

    const maxTokens = 2000;

    const initialMessages = [
      { role: "system" as const, content: systemPrompt },
      { role: "user" as const, content: userMessage }
    ];

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

    return NextResponse.json({
      updatedText: parsed.updatedText || currentText,
      message: parsed.message || "I've updated the text."
    });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
