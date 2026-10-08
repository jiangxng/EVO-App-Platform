import type {
  FoundationObjectImportTargetParametersV010
} from "../../contracts/foundation-object/import.js";

export interface DataImportExperienceRecommendationV010 {
  sourceColumn: string;
  targetFieldId: string;
  confidence: number;
  supportCount: number;
  conflictCount: number;
  supportingRecordIds: string[];
  rationale: string;
  advisoryOnly: true;
}

export interface DataImportExperienceAdvisorV010 {
  recommend(input: {
    tenantId: string;
    targetId: string;
    targetParameters?: FoundationObjectImportTargetParametersV010;
    sourceColumns: string[];
    availableTargetFieldIds: string[];
    targetSchemaDigest: string;
  }): Promise<DataImportExperienceRecommendationV010[]>;
  recordSuccessful(input: {
    tenantId: string;
    targetId: string;
    targetParameters?: FoundationObjectImportTargetParametersV010;
    sourceColumn: string;
    targetFieldId: string;
    sourceHeaders: string[];
    importJobId: string;
    targetSchemaDigest: string;
    observedAt: string;
  }): Promise<{
    observationRecordId: string;
    patternRecordId: string;
  }>;
}

export function createNoopDataImportExperienceAdvisorV010():
DataImportExperienceAdvisorV010 {
  return {
    async recommend() {
      return [];
    },
    async recordSuccessful() {
      throw new Error("DATA_IMPORT_EC_ADVISOR_DISABLED");
    }
  };
}

function requiredString(value: unknown, code: string): string {
  if (typeof value !== "string" || !value.trim()) throw new Error(code);
  return value.trim();
}

function numberValue(value: unknown, code: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(code);
  }
  return value;
}

function stringArray(value: unknown, code: string): string[] {
  if (!Array.isArray(value) || !value.every(item =>
    typeof item === "string" && Boolean(item.trim())
  )) {
    throw new Error(code);
  }
  return value.map(item => item.trim());
}

export function createHttpDataImportExperienceAdvisorV010(input: {
  baseUrl: string;
  token?: string;
  timeoutMs?: number;
  fetchImpl?: typeof fetch;
}): DataImportExperienceAdvisorV010 {
  const baseUrl = requiredString(
    input.baseUrl,
    "DATA_IMPORT_EC_BASE_URL_REQUIRED"
  ).replace(/\/$/u, "");
  const timeoutMs = input.timeoutMs ?? 2500;
  const fetchImpl = input.fetchImpl ?? fetch;

  async function post(path: string, body: unknown): Promise<unknown> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetchImpl(baseUrl + path, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "accept": "application/json",
          ...(input.token
            ? { "authorization": "Bearer " + input.token }
            : {})
        },
        body: JSON.stringify(body),
        signal: controller.signal
      });
      if (!response.ok) {
        throw new Error(
          "DATA_IMPORT_EC_HTTP_" + response.status
        );
      }
      return await response.json() as unknown;
    } finally {
      clearTimeout(timeout);
    }
  }

  return {
    async recommend(advisorInput) {
      const value = await post(
        "/v1/data-import/mapping-recommendations",
        {
          contractVersion: "0.1.0",
          tenantId: advisorInput.tenantId,
          targetId: advisorInput.targetId,
          ...(advisorInput.targetParameters
            ? { targetParameters: advisorInput.targetParameters }
            : {}),
          sourceColumns: advisorInput.sourceColumns,
          availableTargetFieldIds: advisorInput.availableTargetFieldIds,
          targetSchemaDigest: advisorInput.targetSchemaDigest
        }
      );
      if (
        value === null
        || typeof value !== "object"
        || Array.isArray(value)
        || !("recommendations" in value)
        || !Array.isArray(value.recommendations)
      ) {
        throw new Error("DATA_IMPORT_EC_RECOMMENDATION_INVALID");
      }
      return value.recommendations.map(item => {
        if (item === null || typeof item !== "object" || Array.isArray(item)) {
          throw new Error("DATA_IMPORT_EC_RECOMMENDATION_INVALID");
        }
        const confidence = numberValue(
          item.confidence,
          "DATA_IMPORT_EC_RECOMMENDATION_CONFIDENCE_INVALID"
        );
        if (confidence < 0 || confidence > 1) {
          throw new Error("DATA_IMPORT_EC_RECOMMENDATION_CONFIDENCE_INVALID");
        }
        return {
          sourceColumn: requiredString(
            item.sourceColumn,
            "DATA_IMPORT_EC_RECOMMENDATION_SOURCE_INVALID"
          ),
          targetFieldId: requiredString(
            item.targetFieldId,
            "DATA_IMPORT_EC_RECOMMENDATION_TARGET_INVALID"
          ),
          confidence,
          supportCount: numberValue(
            item.supportCount,
            "DATA_IMPORT_EC_RECOMMENDATION_SUPPORT_INVALID"
          ),
          conflictCount: numberValue(
            item.conflictCount,
            "DATA_IMPORT_EC_RECOMMENDATION_CONFLICT_INVALID"
          ),
          supportingRecordIds: stringArray(
            item.supportingRecordIds,
            "DATA_IMPORT_EC_RECOMMENDATION_EVIDENCE_INVALID"
          ),
          rationale: requiredString(
            item.rationale,
            "DATA_IMPORT_EC_RECOMMENDATION_RATIONALE_INVALID"
          ),
          advisoryOnly: true as const
        };
      });
    },

    async recordSuccessful(advisorInput) {
      const value = await post(
        "/v1/data-import/mapping-experiences",
        {
          contractVersion: "0.1.0",
          tenantId: advisorInput.tenantId,
          targetId: advisorInput.targetId,
          ...(advisorInput.targetParameters
            ? { targetParameters: advisorInput.targetParameters }
            : {}),
          sourceColumn: advisorInput.sourceColumn,
          targetFieldId: advisorInput.targetFieldId,
          sourceHeaders: advisorInput.sourceHeaders,
          importJobId: advisorInput.importJobId,
          targetSchemaDigest: advisorInput.targetSchemaDigest,
          humanConfirmed: true,
          dryRunPassed: true,
          commitSucceeded: true,
          observedAt: advisorInput.observedAt
        }
      );
      if (value === null || typeof value !== "object" || Array.isArray(value)) {
        throw new Error("DATA_IMPORT_EC_EXPERIENCE_RESPONSE_INVALID");
      }
      const response = value as Record<string, unknown>;
      return {
        observationRecordId: requiredString(
          response.observationRecordId,
          "DATA_IMPORT_EC_OBSERVATION_ID_INVALID"
        ),
        patternRecordId: requiredString(
          response.patternRecordId,
          "DATA_IMPORT_EC_PATTERN_ID_INVALID"
        )
      };
    }
  };
}
