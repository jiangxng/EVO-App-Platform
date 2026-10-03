import type {
  EvoRuntimeObservationAdapterV010,
  EvoRuntimeObservationQueryV010,
  EvoRuntimeObservationResultV010,
  EvoRuntimeObservationV010
} from "../contracts/evo-runtime-observation.js";

export interface EvoRuntimeObservationHttpAdapterOptionsV010 {
  baseUrl: string;
  fetchImpl?: typeof fetch;
}

function normalizeBaseUrl(value: string): string {
  const normalized = value.trim();
  if (!normalized) throw new Error("EVO_RUNTIME_OBSERVATION_BASE_URL_REQUIRED");
  return normalized.endsWith("/") ? normalized.slice(0, -1) : normalized;
}

function requiredText(value: unknown, field: string): string {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`EVO_RUNTIME_OBSERVATION_RESPONSE_INVALID:${field}`);
  }
  return value.trim();
}

function requiredNumber(value: unknown, field: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`EVO_RUNTIME_OBSERVATION_RESPONSE_INVALID:${field}`);
  }
  return value;
}

function parseObservation(value: unknown): EvoRuntimeObservationV010 {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("EVO_RUNTIME_OBSERVATION_RESPONSE_INVALID:observation");
  }
  const body = value as Record<string, unknown>;
  if (body.contractVersion !== "0.1.0") {
    throw new Error("EVO_RUNTIME_OBSERVATION_RESPONSE_INVALID:contractVersion");
  }
  if (body.target === null || typeof body.target !== "object" || Array.isArray(body.target)) {
    throw new Error("EVO_RUNTIME_OBSERVATION_RESPONSE_INVALID:target");
  }
  if (body.window === null || typeof body.window !== "object" || Array.isArray(body.window)) {
    throw new Error("EVO_RUNTIME_OBSERVATION_RESPONSE_INVALID:window");
  }
  if (body.source === null || typeof body.source !== "object" || Array.isArray(body.source)) {
    throw new Error("EVO_RUNTIME_OBSERVATION_RESPONSE_INVALID:source");
  }
  return body as unknown as EvoRuntimeObservationV010;
}

function responseBody(value: unknown): EvoRuntimeObservationResultV010 {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("EVO_RUNTIME_OBSERVATION_RESPONSE_INVALID");
  }
  const body = value as Record<string, unknown>;
  if (!Array.isArray(body.observations)) {
    throw new Error("EVO_RUNTIME_OBSERVATION_RESPONSE_INVALID:observations");
  }
  const observations = body.observations.map(parseObservation);
  for (const observation of observations) {
    requiredText(observation.enterpriseId, "enterpriseId");
    requiredText(observation.metricCode, "metricCode");
    requiredText(observation.kind, "kind");
    requiredText(observation.unit, "unit");
    requiredNumber(observation.value, "value");
    requiredText(observation.observedAt, "observedAt");
    requiredText(observation.window.startAt, "window.startAt");
    requiredText(observation.window.endAt, "window.endAt");
    requiredText(observation.source.kind, "source.kind");
    requiredText(observation.source.ref, "source.ref");
  }
  return { observations };
}

async function readError(response: Response): Promise<string> {
  try {
    const body = await response.json() as {
      error?: { code?: string; message?: string };
      code?: string;
      message?: string;
    };
    const code = body.error?.code ?? body.code ?? "EVO_RUNTIME_OBSERVATION_REQUEST_FAILED";
    const message = body.error?.message ?? body.message ?? response.statusText;
    return `${code}: ${message}`;
  } catch {
    return `EVO_RUNTIME_OBSERVATION_REQUEST_FAILED: ${response.status} ${response.statusText}`;
  }
}

export function createEvoRuntimeObservationHttpAdapterV010(
  options: EvoRuntimeObservationHttpAdapterOptionsV010
): EvoRuntimeObservationAdapterV010 {
  const baseUrl = normalizeBaseUrl(options.baseUrl);
  const fetchImpl = options.fetchImpl ?? globalThis.fetch;
  if (!fetchImpl) throw new Error("EVO_RUNTIME_OBSERVATION_FETCH_UNAVAILABLE");

  return {
    async query(input: EvoRuntimeObservationQueryV010): Promise<EvoRuntimeObservationResultV010> {
      if (input.contractVersion !== "0.1.0") {
        throw new Error("EVO_RUNTIME_OBSERVATION_VERSION_UNSUPPORTED");
      }
      const response = await fetchImpl(`${baseUrl}/api/v1/runtime-observations/query`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          accept: "application/json"
        },
        body: JSON.stringify(input)
      });
      if (!response.ok) throw new Error(await readError(response));
      return responseBody(await response.json());
    }
  };
}
