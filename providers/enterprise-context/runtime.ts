import type {
  EnterpriseContextProviderV010,
  EnterpriseContextV010
} from "../../contracts/platform-services.js";
import { HOST_ENTERPRISE_CONTEXT_PROVIDER_ID } from "./package.js";

interface HostEnterpriseContextsConfigV010 {
  contractVersion: "0.1.0";
  contexts: Array<{
    contextId: string;
    enterpriseId: string;
    displayName?: string;
    companyId?: string;
    workspaceId?: string;
    membershipId?: string;
    attributes?: Record<string, string | number | boolean | null>;
  }>;
}

function requiredString(value: unknown, field: string): string {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`ENTERPRISE_CONTEXT_FIELD_REQUIRED: ${field}`);
  }
  return value.trim();
}

function optionalString(value: unknown, field: string): string | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`ENTERPRISE_CONTEXT_FIELD_INVALID: ${field}`);
  }
  return value.trim();
}

function attributes(
  value: unknown,
  field: string
): Record<string, string | number | boolean | null> | undefined {
  if (value === undefined) return undefined;
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`ENTERPRISE_CONTEXT_FIELD_INVALID: ${field}`);
  }
  const result: Record<string, string | number | boolean | null> = {};
  for (const [key, item] of Object.entries(value)) {
    if (
      item !== null
      && typeof item !== "string"
      && typeof item !== "number"
      && typeof item !== "boolean"
    ) {
      throw new Error(`ENTERPRISE_CONTEXT_ATTRIBUTE_INVALID: ${field}.${key}`);
    }
    result[key] = item;
  }
  return result;
}

export function parseHostEnterpriseContextsV010(
  raw: string | undefined
): EnterpriseContextV010[] | undefined {
  if (!raw?.trim()) return undefined;

  const parsed = JSON.parse(raw) as Partial<HostEnterpriseContextsConfigV010>;
  if (
    parsed === null
    || typeof parsed !== "object"
    || Array.isArray(parsed)
    || parsed.contractVersion !== "0.1.0"
    || !Array.isArray(parsed.contexts)
  ) {
    throw new Error("ENTERPRISE_CONTEXT_CONFIG_INVALID");
  }

  const contexts = parsed.contexts.map((value, index): EnterpriseContextV010 => {
    if (value === null || typeof value !== "object" || Array.isArray(value)) {
      throw new Error(`ENTERPRISE_CONTEXT_CONFIG_ITEM_INVALID: ${index}`);
    }
    const item = value as Record<string, unknown>;
    const contextId = requiredString(item.contextId, `contexts[${index}].contextId`);
    const enterpriseId = requiredString(item.enterpriseId, `contexts[${index}].enterpriseId`);
    const displayName = optionalString(item.displayName, `contexts[${index}].displayName`);
    const companyId = optionalString(item.companyId, `contexts[${index}].companyId`);
    const workspaceId = optionalString(item.workspaceId, `contexts[${index}].workspaceId`);
    const membershipId = optionalString(item.membershipId, `contexts[${index}].membershipId`);
    const itemAttributes = attributes(item.attributes, `contexts[${index}].attributes`);

    return {
      contractVersion: "0.1.0",
      kind: "ENTERPRISE",
      contextId,
      enterpriseId,
      enterpriseProviderId: HOST_ENTERPRISE_CONTEXT_PROVIDER_ID,
      ...(displayName ? { displayName } : {}),
      ...(companyId ? { companyId } : {}),
      ...(workspaceId ? { workspaceId } : {}),
      ...(membershipId ? { membershipId } : {}),
      ...(itemAttributes ? { attributes: itemAttributes } : {})
    };
  });

  const ids = new Set<string>();
  for (const context of contexts) {
    if (ids.has(context.contextId!)) {
      throw new Error(`ENTERPRISE_CONTEXT_DUPLICATE: ${context.contextId}`);
    }
    ids.add(context.contextId!);
  }

  return contexts.sort((a, b) => a.contextId!.localeCompare(b.contextId!));
}

export function createHostEnterpriseContextProviderV010(
  contexts: readonly EnterpriseContextV010[]
): EnterpriseContextProviderV010 {
  const canonical = contexts.map(context => structuredClone(context));
  return {
    providerId: HOST_ENTERPRISE_CONTEXT_PROVIDER_ID,
    list() {
      return canonical.map(context => structuredClone(context));
    }
  };
}

export function createHostEnterpriseContextHealthProbeV010(
  contexts: readonly EnterpriseContextV010[]
) {
  return () => ({
    state: "HEALTHY" as const,
    message: `Host Enterprise Context directory loaded with ${contexts.length} context(s).`
  });
}
