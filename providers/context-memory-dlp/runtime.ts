import type {
  ContextMemoryDlpClassificationRequestV010,
  ContextMemoryDlpClassificationResultV010,
  ContextMemoryDlpClassifierV010
} from "../../contracts/platform-services.js";
import { REMOTE_CONTEXT_MEMORY_DLP_PROVIDER_ID } from "./package.js";

export interface RemoteContextMemoryDlpProviderOptionsV010 {
  endpoint: string;
  bearerToken?: string;
  timeoutMs?: number;
  fetchImpl?: typeof fetch;
}

function endpoint(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) throw new Error("CONTEXT_MEMORY_DLP_ENDPOINT_REQUIRED");
  const parsed = new URL(trimmed);
  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw new Error("CONTEXT_MEMORY_DLP_ENDPOINT_INVALID");
  }
  return parsed.toString();
}

function validateResult(value: unknown): ContextMemoryDlpClassificationResultV010 {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("CONTEXT_MEMORY_DLP_RESPONSE_INVALID");
  }
  const body = value as Record<string, unknown>;
  if (
    body.contractVersion !== "0.1.0"
    || !["STANDARD", "SENSITIVE", "RESTRICTED"].includes(String(body.privacyClass))
    || !Array.isArray(body.labels)
    || body.labels.some(value => typeof value !== "string" || !value.trim())
    || !Array.isArray(body.reasonCodes)
    || body.reasonCodes.some(value => typeof value !== "string" || !value.trim())
  ) {
    throw new Error("CONTEXT_MEMORY_DLP_RESPONSE_INVALID");
  }
  const confidence = body.confidence;
  if (
    confidence !== undefined
    && (
      typeof confidence !== "number"
      || !Number.isFinite(confidence)
      || confidence < 0
      || confidence > 1
    )
  ) throw new Error("CONTEXT_MEMORY_DLP_RESPONSE_INVALID");

  return {
    contractVersion: "0.1.0",
    privacyClass: body.privacyClass as ContextMemoryDlpClassificationResultV010["privacyClass"],
    labels: [...new Set((body.labels as string[]).map(value => value.trim()))],
    ...(typeof confidence === "number" ? { confidence } : {}),
    reasonCodes: [...new Set((body.reasonCodes as string[]).map(value => value.trim()))]
  };
}

export function createRemoteContextMemoryDlpClassifierV010(
  options: RemoteContextMemoryDlpProviderOptionsV010
): ContextMemoryDlpClassifierV010 {
  const url = endpoint(options.endpoint);
  const fetchImpl = options.fetchImpl ?? globalThis.fetch;
  if (!fetchImpl) throw new Error("CONTEXT_MEMORY_DLP_FETCH_UNAVAILABLE");
  const timeoutMs = options.timeoutMs ?? 8000;
  if (!Number.isFinite(timeoutMs) || timeoutMs < 100 || timeoutMs > 60000) {
    throw new Error("CONTEXT_MEMORY_DLP_TIMEOUT_INVALID");
  }
  return {
    providerId: REMOTE_CONTEXT_MEMORY_DLP_PROVIDER_ID,
    async classify(input: ContextMemoryDlpClassificationRequestV010) {
      if (input.contractVersion !== "0.1.0") {
        throw new Error("CONTEXT_MEMORY_DLP_CONTRACT_UNSUPPORTED");
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
          throw new Error(`CONTEXT_MEMORY_DLP_HTTP_ERROR: ${response.status}`);
        }
        return validateResult(await response.json());
      } finally {
        clearTimeout(timeout);
      }
    }
  };
}

export function createRemoteContextMemoryDlpHealthProbeV010(
  options: RemoteContextMemoryDlpProviderOptionsV010
) {
  const url = endpoint(options.endpoint);
  return () => {
    const parsed = new URL(url);
    return {
      state: parsed.protocol === "https:" ? "HEALTHY" as const : "DEGRADED" as const,
      message: parsed.protocol === "https:"
        ? "Remote Memory DLP endpoint is configured over HTTPS."
        : "Remote Memory DLP endpoint uses HTTP; HTTPS is recommended for production."
    };
  };
}
