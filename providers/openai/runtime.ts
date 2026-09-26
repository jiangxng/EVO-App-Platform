import type {
  LlmInferenceProvider,
  LlmInferenceRequestV010,
  LlmInferenceResponseV010
} from "../../contracts/llm.js";
import { OPENAI_LLM_PROVIDER_ID } from "./package.js";

export interface OpenAiResponsesLlmProviderOptions {
  apiKey: string;
  model?: string;
  baseUrl?: string;
  fetchImpl?: typeof fetch;
}

interface ResponseFunctionCall {
  type: "function_call";
  name: string;
  arguments: string;
}

interface ResponseMessage {
  type: "message";
  content?: Array<{ type?: string; text?: string }>;
}

interface ResponseBody {
  model?: string;
  output?: Array<ResponseFunctionCall | ResponseMessage | Record<string, unknown>>;
  usage?: { input_tokens?: number; output_tokens?: number };
  incomplete_details?: { reason?: string } | null;
  error?: { message?: string };
}

function safeArguments(value: string): Record<string, unknown> {
  try {
    const parsed = JSON.parse(value);
    return parsed !== null && typeof parsed === "object" && !Array.isArray(parsed)
      ? parsed as Record<string, unknown>
      : {};
  } catch {
    return {};
  }
}

export function createOpenAiResponsesLlmProvider(
  options: OpenAiResponsesLlmProviderOptions
): LlmInferenceProvider {
  const fetchImpl = options.fetchImpl ?? globalThis.fetch;
  if (!fetchImpl) throw new Error("OPENAI_PROVIDER_FETCH_UNAVAILABLE");
  if (!options.apiKey.trim()) throw new Error("OPENAI_PROVIDER_API_KEY_REQUIRED");

  const baseUrl = (options.baseUrl ?? "https://api.openai.com/v1").replace(/\/$/, "");
  const modelId = options.model?.trim() || "gpt-5.6-luna";

  return {
    providerId: OPENAI_LLM_PROVIDER_ID,
    modelId,

    async infer(request: LlmInferenceRequestV010): Promise<LlmInferenceResponseV010> {
      if (request.contractVersion !== "0.1.0") {
        throw new Error("LLM_INFERENCE_CONTRACT_UNSUPPORTED");
      }

      const instructionMessages = request.messages.filter(
        message => message.role === "system" || message.role === "developer"
      );
      const inputMessages = request.messages.filter(
        message => message.role === "user" || message.role === "assistant"
      );

      const response = await fetchImpl(`${baseUrl}/responses`, {
        method: "POST",
        headers: {
          authorization: `Bearer ${options.apiKey}`,
          "content-type": "application/json"
        },
        body: JSON.stringify({
          model: modelId,
          instructions: instructionMessages.map(message => message.content).join("\n\n"),
          input: inputMessages.map(message => ({
            role: message.role,
            content: message.content
          })),
          ...(request.maxOutputTokens ? { max_output_tokens: request.maxOutputTokens } : {}),
          ...(request.tools?.length
            ? {
                tools: request.tools.map(tool => ({
                  type: "function",
                  name: tool.name,
                  description: tool.description,
                  parameters: tool.inputSchema,
                  strict: true
                })),
                tool_choice: "auto"
              }
            : {})
        })
      });

      const body = await response.json() as ResponseBody;
      if (!response.ok) {
        throw new Error(body.error?.message ?? `OpenAI Responses API HTTP ${response.status}`);
      }

      const toolCalls = (body.output ?? [])
        .filter((item): item is ResponseFunctionCall => item.type === "function_call")
        .map(item => ({
          name: item.name,
          arguments: safeArguments(item.arguments)
        }));

      let text = "";
      for (const item of body.output ?? []) {
        if (item.type !== "message") continue;
        for (const content of (item as ResponseMessage).content ?? []) {
          if (content.type === "output_text" && typeof content.text === "string") {
            text += content.text;
          }
        }
      }

      return {
        contractVersion: "0.1.0",
        providerId: OPENAI_LLM_PROVIDER_ID,
        modelId: body.model ?? modelId,
        text: text.trim(),
        toolCalls,
        usage: {
          inputTokens: body.usage?.input_tokens ?? 0,
          outputTokens: body.usage?.output_tokens ?? 0
        },
        finishReason: body.incomplete_details?.reason ?? "stop"
      };
    }
  };
}


export function createOpenAiResponsesHealthProbe(
  options: OpenAiResponsesLlmProviderOptions
) {
  const fetchImpl = options.fetchImpl ?? globalThis.fetch;
  if (!fetchImpl) throw new Error("OPENAI_PROVIDER_FETCH_UNAVAILABLE");
  const baseUrl = (options.baseUrl ?? "https://api.openai.com/v1").replace(/\/$/, "");
  const modelId = options.model?.trim() || "gpt-5.6-luna";
  return async () => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    try {
      const response = await fetchImpl(`${baseUrl}/models/${encodeURIComponent(modelId)}`, {
        method: "GET",
        headers: {
          authorization: `Bearer ${options.apiKey}`,
          accept: "application/json"
        },
        redirect: "error",
        signal: controller.signal
      });
      if (response.ok) {
        return {
          state: "HEALTHY" as const,
          message: `OpenAI model '${modelId}' is reachable.`
        };
      }
      if (response.status === 429 || response.status >= 500) {
        return {
          state: "DEGRADED" as const,
          message: `OpenAI health probe returned HTTP ${response.status}.`
        };
      }
      return {
        state: "UNAVAILABLE" as const,
        message: `OpenAI health probe returned HTTP ${response.status}.`
      };
    } finally {
      clearTimeout(timeout);
    }
  };
}
