import type {
  EnterpriseContextGrantProviderV010,
  EnterpriseContextGrantV010,
  PlatformPrincipalV010
} from "../../contracts/platform-services.js";
import { HOST_ENTERPRISE_CONTEXT_GRANT_PROVIDER_ID } from "./package.js";

function requiredString(value: unknown, field: string): string {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`ENTERPRISE_CONTEXT_GRANT_FIELD_REQUIRED: ${field}`);
  }
  return value.trim();
}

function optionalString(value: unknown, field: string): string | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`ENTERPRISE_CONTEXT_GRANT_FIELD_INVALID: ${field}`);
  }
  return value.trim();
}

function attributes(
  value: unknown,
  field: string
): Record<string, string | number | boolean | null> | undefined {
  if (value === undefined) return undefined;
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`ENTERPRISE_CONTEXT_GRANT_FIELD_INVALID: ${field}`);
  }
  const result: Record<string, string | number | boolean | null> = {};
  for (const [key, item] of Object.entries(value)) {
    if (
      item !== null
      && typeof item !== "string"
      && typeof item !== "number"
      && typeof item !== "boolean"
    ) {
      throw new Error(`ENTERPRISE_CONTEXT_GRANT_ATTRIBUTE_INVALID: ${field}.${key}`);
    }
    result[key] = item;
  }
  return result;
}

export function parseHostEnterpriseContextGrantsV010(
  raw: string | undefined
): EnterpriseContextGrantV010[] | undefined {
  if (!raw?.trim()) return undefined;
  const parsed = JSON.parse(raw) as Record<string, unknown>;
  if (
    parsed === null
    || typeof parsed !== "object"
    || Array.isArray(parsed)
    || parsed.contractVersion !== "0.1.0"
    || !Array.isArray(parsed.grants)
  ) {
    throw new Error("ENTERPRISE_CONTEXT_GRANT_CONFIG_INVALID");
  }

  const grants = parsed.grants.map((value, index): EnterpriseContextGrantV010 => {
    if (value === null || typeof value !== "object" || Array.isArray(value)) {
      throw new Error(`ENTERPRISE_CONTEXT_GRANT_ITEM_INVALID: ${index}`);
    }
    const item = value as Record<string, unknown>;
    const relationship = optionalString(item.relationship, `grants[${index}].relationship`);
    const itemAttributes = attributes(item.attributes, `grants[${index}].attributes`);
    return {
      contractVersion: "0.1.0",
      grantId: requiredString(item.grantId, `grants[${index}].grantId`),
      subjectId: requiredString(item.subjectId, `grants[${index}].subjectId`),
      contextId: requiredString(item.contextId, `grants[${index}].contextId`),
      ...(relationship ? { relationship } : {}),
      ...(itemAttributes ? { attributes: itemAttributes } : {})
    };
  });

  const ids = new Set<string>();
  for (const grant of grants) {
    if (ids.has(grant.grantId)) {
      throw new Error(`ENTERPRISE_CONTEXT_GRANT_DUPLICATE: ${grant.grantId}`);
    }
    ids.add(grant.grantId);
  }
  return grants.sort((a, b) =>
    a.subjectId.localeCompare(b.subjectId)
    || a.contextId.localeCompare(b.contextId)
    || a.grantId.localeCompare(b.grantId)
  );
}

export function createHostEnterpriseContextGrantProviderV010(
  grants: readonly EnterpriseContextGrantV010[],
  dynamicSource: () => readonly EnterpriseContextGrantV010[] = () => []
): EnterpriseContextGrantProviderV010 {
  const canonical = grants.map(grant => structuredClone(grant));
  return {
    providerId: HOST_ENTERPRISE_CONTEXT_GRANT_PROVIDER_ID,
    listForPrincipal(principal: PlatformPrincipalV010) {
      const byId = new Map<string, EnterpriseContextGrantV010>();
      for (const grant of [...canonical, ...dynamicSource()]) {
        if (byId.has(grant.grantId)) {
          throw new Error(`ENTERPRISE_CONTEXT_GRANT_DUPLICATE: ${grant.grantId}`);
        }
        byId.set(grant.grantId, structuredClone(grant));
      }
      return [...byId.values()]
        .filter(grant => grant.subjectId === principal.subjectId)
        .sort((a, b) =>
          a.contextId.localeCompare(b.contextId)
          || a.grantId.localeCompare(b.grantId)
        );
    }
  };
}

export function createHostEnterpriseContextGrantHealthProbeV010(
  grants: readonly EnterpriseContextGrantV010[]
) {
  return () => ({
    state: "HEALTHY" as const,
    message: `Host Enterprise Context Grant directory loaded with ${grants.length} grant(s).`
  });
}
