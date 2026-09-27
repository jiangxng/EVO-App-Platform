import type {
  ContextMemoryEvidenceSourceProviderV010,
  ContextMemoryEvidenceSourceV010,
  ContextMemoryIntakePullResultV010,
  ContextMemoryIntakeSourceAdapterV010
} from "../../contracts/platform-services.js";
import {
  EXPERIENCE_COMPILER_EVIDENCE_PROVIDER_ID,
  EXPERIENCE_COMPILER_MEMORY_INTAKE_PROVIDER_ID
} from "./package.js";

export interface ExperienceCompilerMemoryIntakeConfigV010 {
  contractVersion: "0.1.0";
  endpoint: string;
  source: ContextMemoryEvidenceSourceV010;
  timeoutMs?: number;
}

export interface ExperienceCompilerMemoryIntakeRuntimeOptionsV010 {
  config: ExperienceCompilerMemoryIntakeConfigV010;
  bearerToken?: string;
  fetchImpl?: typeof fetch;
}

function validatedEndpoint(value: unknown): string {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error("EC_MEMORY_INTAKE_ENDPOINT_REQUIRED");
  }
  const parsed = new URL(value.trim());
  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw new Error("EC_MEMORY_INTAKE_ENDPOINT_INVALID");
  }
  return parsed.toString();
}

function validatedSource(value: unknown): ContextMemoryEvidenceSourceV010 {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("EC_MEMORY_INTAKE_SOURCE_INVALID");
  }
  const input = value as Record<string, unknown>;
  const sourceId = typeof input.sourceId === "string" ? input.sourceId.trim() : "";
  const trustLevel = input.trustLevel;
  if (
    !sourceId
    || !["UNVERIFIED", "DECLARED", "HOST_VERIFIED"].includes(String(trustLevel))
  ) {
    throw new Error("EC_MEMORY_INTAKE_SOURCE_INVALID");
  }
  return {
    contractVersion: "0.1.0",
    sourceId,
    sourceType: "EXPERIENCE_COMPILER",
    trustLevel: trustLevel as ContextMemoryEvidenceSourceV010["trustLevel"],
    ...(typeof input.displayName === "string" && input.displayName.trim()
      ? { displayName: input.displayName.trim() }
      : {}),
    ...(typeof input.trustPolicyId === "string" && input.trustPolicyId.trim()
      ? { trustPolicyId: input.trustPolicyId.trim() }
      : {}),
    ...(typeof input.verifiedAt === "string" && input.verifiedAt.trim()
      ? { verifiedAt: new Date(input.verifiedAt).toISOString() }
      : {})
  };
}

export function parseExperienceCompilerMemoryIntakeConfigV010(
  raw: string | undefined
): ExperienceCompilerMemoryIntakeConfigV010 | undefined {
  if (!raw?.trim()) return undefined;
  const parsed = JSON.parse(raw) as Record<string, unknown>;
  if (
    parsed === null
    || typeof parsed !== "object"
    || Array.isArray(parsed)
    || parsed.contractVersion !== "0.1.0"
  ) {
    throw new Error("EC_MEMORY_INTAKE_CONFIG_INVALID");
  }
  const timeoutMs = parsed.timeoutMs;
  if (
    timeoutMs !== undefined
    && (
      typeof timeoutMs !== "number"
      || !Number.isFinite(timeoutMs)
      || timeoutMs < 100
      || timeoutMs > 60000
    )
  ) {
    throw new Error("EC_MEMORY_INTAKE_TIMEOUT_INVALID");
  }
  return {
    contractVersion: "0.1.0",
    endpoint: validatedEndpoint(parsed.endpoint),
    source: validatedSource(parsed.source),
    ...(typeof timeoutMs === "number" ? { timeoutMs } : {})
  };
}

function validatePullResult(
  value: unknown,
  sourceId: string
): ContextMemoryIntakePullResultV010 {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("EC_MEMORY_INTAKE_RESPONSE_INVALID");
  }
  const body = value as Record<string, unknown>;
  if (body.contractVersion !== "0.1.0" || !Array.isArray(body.records)) {
    throw new Error("EC_MEMORY_INTAKE_RESPONSE_INVALID");
  }
  for (const [index, raw] of body.records.entries()) {
    if (raw === null || typeof raw !== "object" || Array.isArray(raw)) {
      throw new Error(`EC_MEMORY_INTAKE_RECORD_INVALID: ${index}`);
    }
    const record = raw as Record<string, unknown>;
    if (
      record.contractVersion !== "0.1.0"
      || record.sourceId !== sourceId
      || typeof record.sourceRecordId !== "string"
      || !record.sourceRecordId.trim()
    ) {
      throw new Error(`EC_MEMORY_INTAKE_RECORD_INVALID: ${index}`);
    }
  }
  if (body.nextCursor !== undefined && typeof body.nextCursor !== "string") {
    throw new Error("EC_MEMORY_INTAKE_CURSOR_INVALID");
  }
  return structuredClone(body) as unknown as ContextMemoryIntakePullResultV010;
}

export function createExperienceCompilerEvidenceSourceProviderV010(
  config: ExperienceCompilerMemoryIntakeConfigV010
): ContextMemoryEvidenceSourceProviderV010 {
  const source = structuredClone(config.source);
  return {
    providerId: EXPERIENCE_COMPILER_EVIDENCE_PROVIDER_ID,
    describe(sourceId) {
      return sourceId === source.sourceId ? structuredClone(source) : undefined;
    },
    list() {
      return [structuredClone(source)];
    }
  };
}

export function createExperienceCompilerMemoryIntakeSourceAdapterV010(
  options: ExperienceCompilerMemoryIntakeRuntimeOptionsV010
): ContextMemoryIntakeSourceAdapterV010 {
  const fetchImpl = options.fetchImpl ?? globalThis.fetch;
  if (!fetchImpl) throw new Error("EC_MEMORY_INTAKE_FETCH_UNAVAILABLE");
  const timeoutMs = options.config.timeoutMs ?? 10000;

  return {
    providerId: EXPERIENCE_COMPILER_MEMORY_INTAKE_PROVIDER_ID,
    sourceId: options.config.source.sourceId,
    async pull(input) {
      if (input.contractVersion !== "0.1.0") {
        throw new Error("EC_MEMORY_INTAKE_CONTRACT_UNSUPPORTED");
      }
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), timeoutMs);
      try {
        const response = await fetchImpl(options.config.endpoint, {
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
          throw new Error(`EC_MEMORY_INTAKE_HTTP_ERROR: ${response.status}`);
        }
        return validatePullResult(
          await response.json(),
          options.config.source.sourceId
        );
      } finally {
        clearTimeout(timeout);
      }
    }
  };
}

export function createExperienceCompilerMemoryIntakeHealthProbeV010(
  config: ExperienceCompilerMemoryIntakeConfigV010
) {
  return () => {
    const parsed = new URL(config.endpoint);
    return {
      state: parsed.protocol === "https:" ? "HEALTHY" as const : "DEGRADED" as const,
      message: parsed.protocol === "https:"
        ? "Experience Compiler Memory intake endpoint is configured over HTTPS."
        : "Experience Compiler Memory intake endpoint uses HTTP; HTTPS is recommended for production."
    };
  };
}
