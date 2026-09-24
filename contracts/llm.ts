export interface LlmMessageV010 {
  role: "system" | "developer" | "user" | "assistant";
  content: string;
}

export interface LlmToolV010 {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
}

export interface LlmInferenceRequestV010 {
  contractVersion: "0.1.0";
  messages: LlmMessageV010[];
  tools?: LlmToolV010[];
  maxOutputTokens?: number;
}

export interface LlmToolCallV010 {
  name: string;
  arguments: Record<string, unknown>;
}

export interface LlmInferenceResponseV010 {
  contractVersion: "0.1.0";
  providerId: string;
  modelId: string;
  text: string;
  toolCalls: LlmToolCallV010[];
  usage: {
    inputTokens: number;
    outputTokens: number;
  };
  finishReason: string;
}

export interface LlmInferenceProvider {
  readonly providerId: string;
  readonly modelId: string;
  infer(request: LlmInferenceRequestV010): Promise<LlmInferenceResponseV010>;
}
