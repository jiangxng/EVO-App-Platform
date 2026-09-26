import type {
  ActiveContextRefV010,
  ContextMemoryEvidenceSourceProviderV010,
  ContextMemoryEvidenceSourceV010,
  ContextMemoryIntakeRecordV010,
  ContextMemoryIntakeSourceAdapterV010
} from "../../contracts/platform-services.js";
import {
  HOST_MEMORY_EVIDENCE_SOURCE_PROVIDER_ID,
  HOST_MEMORY_INTAKE_SOURCE_PROVIDER_ID
} from "./package.js";

export interface HostMemoryIntakeConfigV010 {
  contractVersion: "0.1.0";
  source: ContextMemoryEvidenceSourceV010;
  records: ContextMemoryIntakeRecordV010[];
}

function sameContext(
  left: ActiveContextRefV010,
  right: ActiveContextRefV010
): boolean {
  return left.kind === right.kind
    && left.contextId === right.contextId
    && (
      left.kind !== "ENTERPRISE"
      || right.kind !== "ENTERPRISE"
      || left.enterpriseId === right.enterpriseId
    );
}

function validContext(value: unknown, field: string): ActiveContextRefV010 {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`MEMORY_INTAKE_CONTEXT_INVALID: ${field}`);
  }
  const input = value as Record<string, unknown>;
  const kind = input.kind;
  const contextId = typeof input.contextId === "string" ? input.contextId.trim() : "";
  if (!contextId || (kind !== "PERSONAL" && kind !== "ENTERPRISE")) {
    throw new Error(`MEMORY_INTAKE_CONTEXT_INVALID: ${field}`);
  }
  if (kind === "PERSONAL") {
    return {
      contractVersion: "0.1.0",
      kind: "PERSONAL",
      contextId
    };
  }
  const enterpriseId = typeof input.enterpriseId === "string"
    ? input.enterpriseId.trim()
    : "";
  if (!enterpriseId) {
    throw new Error(`MEMORY_INTAKE_CONTEXT_INVALID: ${field}.enterpriseId`);
  }
  return {
    contractVersion: "0.1.0",
    kind: "ENTERPRISE",
    contextId,
    enterpriseId
  };
}

function stringArray(value: unknown, field: string): string[] {
  if (value === undefined) return [];
  if (!Array.isArray(value)) {
    throw new Error(`MEMORY_INTAKE_FIELD_INVALID: ${field}`);
  }
  const result = value.map((item, index) => {
    if (typeof item !== "string" || !item.trim()) {
      throw new Error(`MEMORY_INTAKE_FIELD_INVALID: ${field}[${index}]`);
    }
    return item.trim();
  });
  return [...new Set(result)].sort();
}

function primitiveAttributes(
  value: unknown,
  field: string
): Record<string, string | number | boolean | null> | undefined {
  if (value === undefined) return undefined;
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`MEMORY_INTAKE_FIELD_INVALID: ${field}`);
  }
  const result: Record<string, string | number | boolean | null> = {};
  for (const [key, item] of Object.entries(value)) {
    if (
      item !== null
      && typeof item !== "string"
      && typeof item !== "number"
      && typeof item !== "boolean"
    ) {
      throw new Error(`MEMORY_INTAKE_FIELD_INVALID: ${field}.${key}`);
    }
    result[key] = item;
  }
  return result;
}

function validSource(value: unknown): ContextMemoryEvidenceSourceV010 {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("MEMORY_INTAKE_SOURCE_INVALID");
  }
  const input = value as Record<string, unknown>;
  const sourceId = typeof input.sourceId === "string" ? input.sourceId.trim() : "";
  const sourceType = input.sourceType;
  const trustLevel = input.trustLevel;
  if (
    !sourceId
    || !["HUMAN", "APPLICATION", "DOCUMENT", "EXTERNAL_SYSTEM", "EXPERIENCE_COMPILER"]
      .includes(String(sourceType))
    || !["UNVERIFIED", "DECLARED", "HOST_VERIFIED"].includes(String(trustLevel))
  ) {
    throw new Error("MEMORY_INTAKE_SOURCE_INVALID");
  }
  const verifiedAt = typeof input.verifiedAt === "string" && input.verifiedAt.trim()
    ? new Date(input.verifiedAt).toISOString()
    : undefined;
  return {
    contractVersion: "0.1.0",
    sourceId,
    sourceType: sourceType as ContextMemoryEvidenceSourceV010["sourceType"],
    trustLevel: trustLevel as ContextMemoryEvidenceSourceV010["trustLevel"],
    ...(typeof input.displayName === "string" && input.displayName.trim()
      ? { displayName: input.displayName.trim() }
      : {}),
    ...(typeof input.trustPolicyId === "string" && input.trustPolicyId.trim()
      ? { trustPolicyId: input.trustPolicyId.trim() }
      : {}),
    ...(verifiedAt ? { verifiedAt } : {}),
    ...(primitiveAttributes(input.attributes, "source.attributes")
      ? { attributes: primitiveAttributes(input.attributes, "source.attributes") }
      : {})
  };
}

function validRecord(
  value: unknown,
  index: number,
  sourceId: string
): ContextMemoryIntakeRecordV010 {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`MEMORY_INTAKE_RECORD_INVALID: ${index}`);
  }
  const input = value as Record<string, unknown>;
  const recordSourceId = typeof input.sourceId === "string"
    ? input.sourceId.trim()
    : sourceId;
  const sourceRecordId = typeof input.sourceRecordId === "string"
    ? input.sourceRecordId.trim()
    : "";
  const kind = input.kind;
  const summary = typeof input.summary === "string" ? input.summary.trim() : "";
  if (
    recordSourceId !== sourceId
    || !sourceRecordId
    || !["FACT", "CLAIM", "EXPERIENCE", "PRACTICE"].includes(String(kind))
    || !summary
  ) {
    throw new Error(`MEMORY_INTAKE_RECORD_INVALID: ${index}`);
  }
  const proposedConfidence = input.proposedConfidence;
  if (
    proposedConfidence !== undefined
    && (
      typeof proposedConfidence !== "number"
      || !Number.isFinite(proposedConfidence)
      || proposedConfidence < 0
      || proposedConfidence > 1
    )
  ) {
    throw new Error(`MEMORY_INTAKE_CONFIDENCE_INVALID: ${index}`);
  }
  const observedAt = typeof input.observedAt === "string" && input.observedAt.trim()
    ? new Date(input.observedAt).toISOString()
    : undefined;

  return {
    contractVersion: "0.1.0",
    sourceId,
    sourceRecordId,
    context: validContext(input.context, `records[${index}].context`),
    kind: kind as ContextMemoryIntakeRecordV010["kind"],
    summary,
    evidenceRefs: stringArray(input.evidenceRefs, `records[${index}].evidenceRefs`),
    ...(observedAt ? { observedAt } : {}),
    ...(proposedConfidence !== undefined ? { proposedConfidence } : {}),
    ...(typeof input.supersedesMemoryId === "string" && input.supersedesMemoryId.trim()
      ? { supersedesMemoryId: input.supersedesMemoryId.trim() }
      : {}),
    ...(input.potentialContradictionMemoryIds !== undefined
      ? {
          potentialContradictionMemoryIds: stringArray(
            input.potentialContradictionMemoryIds,
            `records[${index}].potentialContradictionMemoryIds`
          )
        }
      : {}),
    ...(primitiveAttributes(input.attributes, `records[${index}].attributes`)
      ? {
          attributes: primitiveAttributes(
            input.attributes,
            `records[${index}].attributes`
          )
        }
      : {})
  };
}

export function parseHostMemoryIntakeConfigV010(
  raw: string | undefined
): HostMemoryIntakeConfigV010 | undefined {
  if (!raw?.trim()) return undefined;
  const parsed = JSON.parse(raw) as Record<string, unknown>;
  if (
    parsed === null
    || typeof parsed !== "object"
    || Array.isArray(parsed)
    || parsed.contractVersion !== "0.1.0"
    || !Array.isArray(parsed.records)
  ) {
    throw new Error("MEMORY_INTAKE_CONFIG_INVALID");
  }
  const source = validSource(parsed.source);
  const records = parsed.records.map((item, index) =>
    validRecord(item, index, source.sourceId)
  );
  const ids = new Set<string>();
  for (const record of records) {
    if (ids.has(record.sourceRecordId)) {
      throw new Error(`MEMORY_INTAKE_SOURCE_RECORD_DUPLICATE: ${record.sourceRecordId}`);
    }
    ids.add(record.sourceRecordId);
  }
  return {
    contractVersion: "0.1.0",
    source,
    records
  };
}

export function createHostMemoryEvidenceSourceProviderV010(
  source: ContextMemoryEvidenceSourceV010
): ContextMemoryEvidenceSourceProviderV010 {
  const canonical = structuredClone(source);
  return {
    providerId: HOST_MEMORY_EVIDENCE_SOURCE_PROVIDER_ID,
    describe(sourceId) {
      return sourceId === canonical.sourceId
        ? structuredClone(canonical)
        : undefined;
    },
    list() {
      return [structuredClone(canonical)];
    }
  };
}

function limit(value: number | undefined): number {
  if (value === undefined) return 50;
  if (!Number.isInteger(value) || value < 1 || value > 500) {
    throw new Error("MEMORY_INTAKE_LIMIT_INVALID");
  }
  return value;
}

function offset(cursor: string | undefined): number {
  if (!cursor) return 0;
  if (!/^offset:\d+$/.test(cursor)) {
    throw new Error("MEMORY_INTAKE_CURSOR_INVALID");
  }
  return Number(cursor.slice("offset:".length));
}

export function createHostMemoryIntakeSourceAdapterV010(
  config: HostMemoryIntakeConfigV010
): ContextMemoryIntakeSourceAdapterV010 {
  const records = config.records.map(item => structuredClone(item));
  return {
    providerId: HOST_MEMORY_INTAKE_SOURCE_PROVIDER_ID,
    sourceId: config.source.sourceId,
    pull(input) {
      if (input.contractVersion !== "0.1.0") {
        throw new Error("MEMORY_INTAKE_PULL_CONTRACT_UNSUPPORTED");
      }
      const filtered = records.filter(item => sameContext(item.context, input.context));
      const start = offset(input.cursor);
      const max = limit(input.limit);
      const page = filtered.slice(start, start + max);
      const next = start + page.length;
      return {
        contractVersion: "0.1.0",
        records: page.map(item => structuredClone(item)),
        ...(next < filtered.length ? { nextCursor: `offset:${next}` } : {})
      };
    }
  };
}

export function createHostMemoryIntakeHealthProbeV010(
  config: HostMemoryIntakeConfigV010
) {
  return () => ({
    state: "HEALTHY" as const,
    message: `Memory intake source '${config.source.sourceId}' loaded with ${config.records.length} record(s); trust=${config.source.trustLevel}.`
  });
}
