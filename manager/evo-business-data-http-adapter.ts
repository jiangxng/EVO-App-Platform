import type {
  EvoBusinessDataAdapterV010,
  EvoBusinessDataSubmissionResultV010,
  EvoBusinessDataSubmissionV010
} from "../contracts/evo-business-data.js";

export interface EvoBusinessDataHttpAdapterOptionsV010 {
  baseUrl: string;
  fetchImpl?: typeof fetch;
}

function normalizeBaseUrl(value: string): string {
  const normalized = value.trim();
  if (!normalized) throw new Error("EVO_BUSINESS_DATA_BASE_URL_REQUIRED");
  return normalized.endsWith("/") ? normalized.slice(0, -1) : normalized;
}

function requiredText(value: unknown, field: string): string {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`EVO_BUSINESS_DATA_RESPONSE_INVALID:${field}`);
  }
  return value.trim();
}

function requiredBoolean(value: unknown, field: string): boolean {
  if (typeof value !== "boolean") {
    throw new Error(`EVO_BUSINESS_DATA_RESPONSE_INVALID:${field}`);
  }
  return value;
}

function responseBody(
  value: unknown
): EvoBusinessDataSubmissionResultV010 {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("EVO_BUSINESS_DATA_RESPONSE_INVALID");
  }
  const body = value as Record<string, unknown>;
  const postingStatus = requiredText(body.postingStatus, "postingStatus");
  if (
    postingStatus !== "QUEUED"
    && postingStatus !== "BLOCKED_REPLAY_REQUIRED"
  ) {
    throw new Error("EVO_BUSINESS_DATA_RESPONSE_INVALID:postingStatus");
  }
  if (body.contractVersion !== "0.1.0") {
    throw new Error("EVO_BUSINESS_DATA_RESPONSE_INVALID:contractVersion");
  }
  return {
    contractVersion: "0.1.0",
    businessDataId: requiredText(body.businessDataId, "businessDataId"),
    businessObjectVersion: requiredText(
      body.businessObjectVersion,
      "businessObjectVersion"
    ),
    postingInputId: requiredText(body.postingInputId, "postingInputId"),
    postingSequence: requiredText(body.postingSequence, "postingSequence"),
    postingStatus,
    retroactive: requiredBoolean(body.retroactive, "retroactive"),
    replayRequired: requiredBoolean(body.replayRequired, "replayRequired"),
    idempotentReplay: requiredBoolean(
      body.idempotentReplay,
      "idempotentReplay"
    )
  };
}

async function readError(response: Response): Promise<string> {
  try {
    const body = await response.json() as {
      error?: { code?: string; message?: string };
      code?: string;
      message?: string;
    };
    const code = body.error?.code ?? body.code ?? "EVO_BUSINESS_DATA_REQUEST_FAILED";
    const message = body.error?.message ?? body.message ?? response.statusText;
    return `${code}: ${message}`;
  } catch {
    return `EVO_BUSINESS_DATA_REQUEST_FAILED: ${response.status} ${response.statusText}`;
  }
}

export function createEvoBusinessDataHttpAdapterV010(
  options: EvoBusinessDataHttpAdapterOptionsV010
): EvoBusinessDataAdapterV010 {
  const baseUrl = normalizeBaseUrl(options.baseUrl);
  const fetchImpl = options.fetchImpl ?? globalThis.fetch;
  if (!fetchImpl) throw new Error("EVO_BUSINESS_DATA_FETCH_UNAVAILABLE");

  return {
    async submit(
      input: EvoBusinessDataSubmissionV010
    ): Promise<EvoBusinessDataSubmissionResultV010> {
      if (input.contractVersion !== "0.1.0") {
        throw new Error("EVO_BUSINESS_DATA_VERSION_UNSUPPORTED");
      }
      if (!input.applicationId.trim()) {
        throw new Error("EVO_APPLICATION_ID_REQUIRED");
      }

      const response = await fetchImpl(
        `${baseUrl}/api/v1/business-data`,
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
            accept: "application/json"
          },
          body: JSON.stringify(input)
        }
      );

      if (!response.ok) {
        throw new Error(await readError(response));
      }

      return responseBody(await response.json());
    }
  };
}
