export type AIProvider = "groq" | "fireworks";

export interface AIRequestMessage {
  role: string;
  content: string;
}

export interface AIRequest {
  messages: AIRequestMessage[];
  maxTokens?: number;
  jsonMode?: boolean;
  model?: string;
}

export interface AIResponse {
  content: string;
  provider: AIProvider;
  model: string;
}
