import { AIProvider, AIRequest, AIResponse } from "./types";

interface ProviderConfig {
  baseUrl: string;
  envKey: string;
  defaultModel: string;
}

export const PROVIDER_CONFIG: Record<AIProvider, ProviderConfig> = {
  groq: {
    baseUrl: "https://api.groq.com/openai/v1/chat/completions",
    envKey: "GROQ_API_KEY",
    defaultModel: "llama-3.1-8b-instant",
  },
  fireworks: {
    baseUrl: "https://api.fireworks.ai/inference/v1/chat/completions",
    envKey: "FIREWORKS_API_KEY",
    defaultModel: "accounts/fireworks/models/gemma2-9b-it",
  },
};

export async function callAI(
  provider: AIProvider,
  request: AIRequest
): Promise<AIResponse> {
  const config = PROVIDER_CONFIG[provider];
  const apiKey = process.env[config.envKey];

  if (!apiKey) {
    throw new Error(
      `${provider} is not configured. Add ${config.envKey} to your environment variables.`
    );
  }

  const modelToUse = request.model ?? config.defaultModel;

  const body: Record<string, unknown> = {
    model: modelToUse,
    messages: request.messages,
  };

  if (request.maxTokens !== undefined) {
    body.max_tokens = request.maxTokens;
  }

  if (request.jsonMode) {
    body.response_format = { type: "json_object" };
  }

  const response = await fetch(config.baseUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    let errorMessage = `HTTP Error ${response.status}: ${response.statusText}`;
    try {
      const errorData = (await response.json()) as { error?: { message?: string } };
      if (errorData.error?.message) {
        errorMessage = errorData.error.message;
      }
    } catch {
      // If parsing fails, fall back to the text
      try {
         const text = await response.text();
         if (text) {
             errorMessage = text;
         }
      } catch {
          // Ignore
      }
    }
    throw new Error(errorMessage);
  }

  const data = (await response.json()) as {
    choices: Array<{ message: { content: string } }>;
  };

  const content = data.choices[0]?.message?.content || "";

  return {
    content,
    provider,
    model: modelToUse,
  };
}
