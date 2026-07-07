import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { command, currentText } = await req.json();

    if (!command || typeof command !== 'string') {
      return NextResponse.json({ error: 'Valid command string is required' }, { status: 400 });
    }

    const groqKey = process.env.GROQ_API_KEY;
    if (!groqKey) {
      return NextResponse.json({ 
        error: 'GROQ_API_KEY is not configured in .env.local. Please add it to your environment variables.'
      }, { status: 500 });
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

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${groqKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage }
        ],
        response_format: { type: "json_object" },
        temperature: 0.5
      })
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("Groq API Error:", text);
      return NextResponse.json({ error: "Failed to communicate with Groq API" }, { status: 500 });
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    const parsed = JSON.parse(content);

    return NextResponse.json({
      updatedText: parsed.updatedText || currentText,
      message: parsed.message || "I've updated the text."
    });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
