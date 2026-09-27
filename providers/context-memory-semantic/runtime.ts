import type {
  ContextMemorySemanticRetrieverV010,
  ContextMemorySemanticSearchRequestV010,
  ContextMemorySemanticSearchResultV010
} from "../../contracts/platform-services.js";
import { REMOTE_CONTEXT_MEMORY_SEMANTIC_PROVIDER_ID } from "./package.js";

export interface RemoteContextMemorySemanticProviderOptionsV010 {
  endpoint: string;
  bearerToken?: string;
  timeoutMs?: number;
  fetchImpl?: typeof fetch;
}

function endpoint(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) throw new Error("CONTEXT_MEMORY_SEMANTIC_ENDPOINT_REQUIRED");
  const parsed = new URL(trimmed);
  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw new Error("CONTEXT_MEMORY_SEMANTIC_ENDPOINT_INVALID");
  }
  return parsed.toString();
}

function validateResult(
  value: unknown,
  input: ContextMemorySemanticSearchRequestV010
): ContextMemorySemanticSearchResultV010 {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("CONTEXT_MEMORY_SEMANTIC_RESPONSE_INVALID");
  }
  const body = value as Record<string, unknown>;
  if (body.contractVersion !== "0.1.0" || !Array.isArray(body.ranking)) {
    throw new Error("CONTEXT_MEMORY_SEMANTIC_RESPONSE_INVALID");
  }
  const candidateIds = new Set(input.candidates.map(item => item.memoryId));
  const seen = new Set<string>();
  const ranking = body.ranking.map((raw, index) => {
    if (raw === null || typeof raw !== "object" || Array.isArray(raw)) {
      throw new Error(`CONTEXT_MEMORY_SEMANTIC_RANKING_INVALID: ${index}`);
    }
    const item = raw as Record<string, unknown>;
    const memoryId = typeof item.memoryId === "string" ? item.memoryId.trim() : "";
    const score = item.score;
    const signals = item.signals;
    if (
      !memoryId
      || !candidateIds.has(memoryId)
      || seen.has(memoryId)
      || typeof score !== "number"
      || !Number.isFinite(score)
      || score < 0
      || score > 1
      || !Array.isArray(signals)
      || signals.some(signal => typeof signal !== "string" || !signal.trim())
    ) {
      throw new Error(`CONTEXT_MEMORY_SEMANTIC_RANKING_INVALID: ${index}`);
    }
    seen.add(memoryId);
    return {
      contractVersion: "0.1.0" as const,
      memoryId,
      score,
      signals: [...new Set(signals.map(signal => String(signal).trim()))]
    };
  });
  return {
    contractVersion: "0.1.0",
    ranking
  };
}

export function createRemoteContextMemorySemanticRetrieverV010(
  options: RemoteContextMemorySemanticProviderOptionsV010
): ContextMemorySemanticRetrieverV010 {
  const url = endpoint(options.endpoint);
  const fetchImpl = options.fetchImpl ?? globalThis.fetch;
  if (!fetchImpl) throw new Error("CONTEXT_MEMORY_SEMANTIC_FETCH_UNAVAILABLE");
  const timeoutMs = options.timeoutMs ?? 8000;
  if (!Number.isFinite(timeoutMs) || timeoutMs < 100 || timeoutMs > 60000) {
    throw new Error("CONTEXT_MEMORY_SEMANTIC_TIMEOUT_INVALID");
  }

  return {
    providerId: REMOTE_CONTEXT_MEMORY_SEMANTIC_PROVIDER_ID,
    async search(input) {
      if (input.contractVersion !== "0.1.0") {
        throw new Error("CONTEXT_MEMORY_SEMANTIC_CONTRACT_UNSUPPORTED");
      }
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), timeoutMs);
      try {
        const response = await fetchImpl(url, {
          method: "POST",
          headers: {
            "content-type": "application/json",
            accept: "application/json",
            ...(options.bearerToken?.trim()
              ? { authorization: `Bearer ${options.bearerToken.trim()}` }
              : {})
          },
          body: JSON.stringify(input),
          redirect: "error",
          signal: controller.signal
        });
        if (!response.ok) {
          throw new Error(
            `CONTEXT_MEMORY_SEMANTIC_HTTP_ERROR: ${response.status}`
          );
        }
        return validateResult(await response.json(), input);
      } finally {
        clearTimeout(timeout);
      }
    }
  };
}

export function createRemoteContextMemorySemanticHealthProbeV010(
  options: RemoteContextMemorySemanticProviderOptionsV010
) {
  const fetchImpl = options.fetchImpl ?? globalThis.fetch;
  const url = endpoint(options.endpoint);
  if (!fetchImpl) throw new Error("CONTEXT_MEMORY_SEMANTIC_FETCH_UNAVAILABLE");
  return async () => {
    try {
      const parsed = new URL(url);
      return {
        state: parsed.protocol === "https:" ? "HEALTHY" as const : "DEGRADED" as const,
        message: parsed.protocol === "https:"
          ? "Remote semantic retrieval endpoint is configured over HTTPS."
          : "Remote semantic retrieval endpoint is configured over HTTP; HTTPS is recommended for production."
      };
    } catch (error) {
      return {
        state: "UNAVAILABLE" as const,
        message: error instanceof Error ? error.message : String(error)
      };
    }
  };
}
