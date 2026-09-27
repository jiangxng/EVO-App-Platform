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


function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function stringSet(value: unknown): Set<string> {
  return new Set(
    Array.isArray(value)
      ? value.filter((item): item is string => typeof item === "string")
      : []
  );
}

function makeOpenAiOptionalNullable(
  schema: Record<string, unknown>
): Record<string, unknown> {
  const normalized = structuredClone(schema);
  const type = normalized.type;

  if (typeof type === "string") {
    if (type !== "null") normalized.type = [type, "null"];
  } else if (Array.isArray(type)) {
    if (!type.includes("null")) normalized.type = [...type, "null"];
  } else if (Array.isArray(normalized.anyOf)) {
    normalized.anyOf = [
      ...normalized.anyOf,
      { type: "null" }
    ];
  } else {
    normalized.anyOf = [
      structuredClone(normalized),
      { type: "null" }
    ];
    for (const key of Object.keys(normalized)) {
      if (key !== "anyOf") delete normalized[key];
    }
  }

  if (
    Array.isArray(normalized.enum)
    && !normalized.enum.some(value => value === null)
  ) {
    normalized.enum = [...normalized.enum, null];
  }

  return normalized;
}

export function normalizeOpenAiStrictToolSchemaV010(
  schema: Record<string, unknown>
): Record<string, unknown> {
  const normalized = structuredClone(schema);

  if (isRecord(normalized.$defs)) {
    normalized.$defs = Object.fromEntries(
      Object.entries(normalized.$defs).map(([key, value]) => [
        key,
        isRecord(value)
          ? normalizeOpenAiStrictToolSchemaV010(value)
          : value
      ])
    );
  }

  for (const composition of ["anyOf", "oneOf"] as const) {
    const value = normalized[composition];
    if (Array.isArray(value)) {
      normalized[composition] = value.map(item =>
        isRecord(item)
          ? normalizeOpenAiStrictToolSchemaV010(item)
          : item
      );
    }
  }

  if (isRecord(normalized.items)) {
    normalized.items = normalizeOpenAiStrictToolSchemaV010(
      normalized.items
    );
  }

  if (isRecord(normalized.properties)) {
    const originallyRequired = stringSet(normalized.required);
    const properties: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(normalized.properties)) {
      if (!isRecord(value)) {
        throw new Error(
          `OPENAI_TOOL_SCHEMA_PROPERTY_INVALID: ${key}`
        );
      }
      const child = normalizeOpenAiStrictToolSchemaV010(value);
      properties[key] = originallyRequired.has(key)
        ? child
        : makeOpenAiOptionalNullable(child);
    }

    normalized.properties = properties;
    normalized.required = Object.keys(properties);
    normalized.additionalProperties = false;
  }

  return normalized;
}

function restoreGenericOptionalArguments(
  value: unknown,
  schema: Record<string, unknown>
): unknown {
  if (Array.isArray(value)) {
    const itemSchema = isRecord(schema.items)
      ? schema.items
      : undefined;
    return itemSchema
      ? value.map(item =>
          restoreGenericOptionalArguments(item, itemSchema)
        )
      : value;
  }

  if (!isRecord(value) || !isRecord(schema.properties)) {
    return value;
  }

  const originallyRequired = stringSet(schema.required);
  const restored: Record<string, unknown> = {};

  for (const [key, item] of Object.entries(value)) {
    const propertySchema = schema.properties[key];
    if (item === null && !originallyRequired.has(key)) {
      continue;
    }
    restored[key] = isRecord(propertySchema)
      ? restoreGenericOptionalArguments(item, propertySchema)
      : item;
  }

  return restored;
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
                  parameters: normalizeOpenAiStrictToolSchemaV010(
                    tool.inputSchema
                  ),
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

      const toolSchemas = new Map(
        (request.tools ?? []).map(tool => [
          tool.name,
          tool.inputSchema
        ])
      );
      const toolCalls = (body.output ?? [])
        .filter((item): item is ResponseFunctionCall => item.type === "function_call")
        .map(item => {
          const parsed = safeArguments(item.arguments);
          const originalSchema = toolSchemas.get(item.name);
          return {
            name: item.name,
            arguments: originalSchema
              ? restoreGenericOptionalArguments(parsed, originalSchema) as Record<string, unknown>
              : parsed
          };
        });

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
