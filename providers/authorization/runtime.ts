import type {
  AuthorizationCheckV010,
  AuthorizationDecisionV010,
  AuthorizationProviderV010,
  PlatformActorType,
  PlatformScopeV010
} from "../../contracts/platform-services.js";
import { HOST_STATIC_AUTHORIZATION_PROVIDER_ID } from "./package.js";

export interface HostStaticAuthorizationRuleV010 {
  id: string;
  effect: "ALLOW" | "DENY";
  actions: string[];
  subjectIds?: string[];
  actorTypes?: PlatformActorType[];
  resourceTypes?: string[];
  resourceIds?: string[];
  scope?: Omit<PlatformScopeV010, "contractVersion">;
}

export interface HostStaticAuthorizationPolicyV010 {
  contractVersion: "0.1.0";
  rules: HostStaticAuthorizationRuleV010[];
}

function cleanStrings(values: unknown, field: string): string[] | undefined {
  if (values === undefined) return undefined;
  if (!Array.isArray(values)) throw new Error(`AUTHORIZATION_POLICY_${field}_INVALID`);
  const result = values
    .filter((value): value is string => typeof value === "string")
    .map(value => value.trim())
    .filter(Boolean);
  if (result.length !== values.length) throw new Error(`AUTHORIZATION_POLICY_${field}_INVALID`);
  return [...new Set(result)].sort();
}

function cleanScope(value: unknown): HostStaticAuthorizationRuleV010["scope"] {
  if (value === undefined) return undefined;
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("AUTHORIZATION_POLICY_SCOPE_INVALID");
  }
  const input = value as Record<string, unknown>;
  const result: HostStaticAuthorizationRuleV010["scope"] = {};
  for (const key of ["enterpriseId", "companyId", "workspaceId", "userId"] as const) {
    const raw = input[key];
    if (raw === undefined) continue;
    if (typeof raw !== "string" || !raw.trim()) {
      throw new Error(`AUTHORIZATION_POLICY_SCOPE_${key.toUpperCase()}_INVALID`);
    }
    result[key] = raw.trim();
  }
  return result;
}

export function parseHostStaticAuthorizationPolicyV010(
  raw: string | undefined
): HostStaticAuthorizationPolicyV010 | undefined {
  if (!raw?.trim()) return undefined;
  const parsed = JSON.parse(raw) as Record<string, unknown>;
  if (
    parsed === null
    || typeof parsed !== "object"
    || Array.isArray(parsed)
    || parsed.contractVersion !== "0.1.0"
    || !Array.isArray(parsed.rules)
  ) {
    throw new Error("AUTHORIZATION_POLICY_INVALID");
  }

  const rules = parsed.rules.map((value, index) => {
    if (value === null || typeof value !== "object" || Array.isArray(value)) {
      throw new Error(`AUTHORIZATION_POLICY_RULE_INVALID: ${index}`);
    }
    const rule = value as Record<string, unknown>;
    const id = typeof rule.id === "string" ? rule.id.trim() : "";
    const effect = rule.effect;
    const actions = cleanStrings(rule.actions, "ACTIONS");
    if (!id || (effect !== "ALLOW" && effect !== "DENY") || !actions?.length) {
      throw new Error(`AUTHORIZATION_POLICY_RULE_INVALID: ${index}`);
    }
    const actorTypes = cleanStrings(rule.actorTypes, "ACTOR_TYPES") as PlatformActorType[] | undefined;
    if (actorTypes?.some(value => !["HUMAN", "AI", "AUTOMATION", "SERVICE"].includes(value))) {
      throw new Error(`AUTHORIZATION_POLICY_ACTOR_TYPES_INVALID: ${id}`);
    }
    return {
      id,
      effect,
      actions,
      ...(cleanStrings(rule.subjectIds, "SUBJECT_IDS") ? { subjectIds: cleanStrings(rule.subjectIds, "SUBJECT_IDS") } : {}),
      ...(actorTypes ? { actorTypes } : {}),
      ...(cleanStrings(rule.resourceTypes, "RESOURCE_TYPES") ? { resourceTypes: cleanStrings(rule.resourceTypes, "RESOURCE_TYPES") } : {}),
      ...(cleanStrings(rule.resourceIds, "RESOURCE_IDS") ? { resourceIds: cleanStrings(rule.resourceIds, "RESOURCE_IDS") } : {}),
      ...(cleanScope(rule.scope) ? { scope: cleanScope(rule.scope) } : {})
    } satisfies HostStaticAuthorizationRuleV010;
  });

  const ids = new Set<string>();
  for (const rule of rules) {
    if (ids.has(rule.id)) throw new Error(`AUTHORIZATION_POLICY_RULE_DUPLICATE: ${rule.id}`);
    ids.add(rule.id);
  }

  return {
    contractVersion: "0.1.0",
    rules
  };
}

function matchList(values: string[] | undefined, value: string): boolean {
  return !values || values.includes("*") || values.includes(value);
}

function matchesScope(
  expected: HostStaticAuthorizationRuleV010["scope"],
  actual: PlatformScopeV010
): boolean {
  if (!expected) return true;
  for (const key of ["enterpriseId", "companyId", "workspaceId", "userId"] as const) {
    if (expected[key] !== undefined && expected[key] !== actual[key]) return false;
  }
  return true;
}

function matchesRule(
  rule: HostStaticAuthorizationRuleV010,
  input: AuthorizationCheckV010
): boolean {
  return matchList(rule.actions, input.action)
    && matchList(rule.subjectIds, input.principal.subjectId)
    && matchList(rule.actorTypes, input.principal.actorType)
    && matchList(rule.resourceTypes, input.resource.type)
    && matchList(rule.resourceIds, input.resource.id ?? "")
    && matchesScope(rule.scope, input.scope);
}

export function mergeHostStaticAuthorizationPoliciesV010(
  ...policies: Array<HostStaticAuthorizationPolicyV010 | undefined>
): HostStaticAuthorizationPolicyV010 | undefined {
  const active = policies.filter(
    (policy): policy is HostStaticAuthorizationPolicyV010 => policy !== undefined
  );
  if (active.length === 0) return undefined;

  const ids = new Set<string>();
  const rules: HostStaticAuthorizationRuleV010[] = [];
  for (const policy of active) {
    for (const rule of policy.rules) {
      if (ids.has(rule.id)) {
        throw new Error(`AUTHORIZATION_POLICY_RULE_DUPLICATE: ${rule.id}`);
      }
      ids.add(rule.id);
      rules.push(structuredClone(rule));
    }
  }

  return {
    contractVersion: "0.1.0",
    rules
  };
}

export function createHostStaticAuthorizationProviderV010(
  policy: HostStaticAuthorizationPolicyV010
): AuthorizationProviderV010 {
  return {
    providerId: HOST_STATIC_AUTHORIZATION_PROVIDER_ID,
    check(input): AuthorizationDecisionV010 {
      if (input.contractVersion !== "0.1.0") {
        return {
          contractVersion: "0.1.0",
          allowed: false,
          policyProviderId: HOST_STATIC_AUTHORIZATION_PROVIDER_ID,
          reasonCodes: ["AUTHORIZATION_CHECK_CONTRACT_UNSUPPORTED"]
        };
      }

      const matching = policy.rules.filter(rule => matchesRule(rule, input));
      const denied = matching.find(rule => rule.effect === "DENY");
      if (denied) {
        return {
          contractVersion: "0.1.0",
          allowed: false,
          policyProviderId: HOST_STATIC_AUTHORIZATION_PROVIDER_ID,
          reasonCodes: ["STATIC_POLICY_EXPLICIT_DENY", denied.id]
        };
      }

      const allowed = matching.find(rule => rule.effect === "ALLOW");
      if (allowed) {
        return {
          contractVersion: "0.1.0",
          allowed: true,
          policyProviderId: HOST_STATIC_AUTHORIZATION_PROVIDER_ID,
          reasonCodes: ["STATIC_POLICY_ALLOW", allowed.id]
        };
      }

      return {
        contractVersion: "0.1.0",
        allowed: false,
        policyProviderId: HOST_STATIC_AUTHORIZATION_PROVIDER_ID,
        reasonCodes: ["STATIC_POLICY_NO_MATCH"]
      };
    }
  };
}

export function createHostStaticAuthorizationHealthProbeV010(
  policy: HostStaticAuthorizationPolicyV010
) {
  return () => ({
    state: "HEALTHY" as const,
    message: `Static authorization policy loaded with ${policy.rules.length} rule(s).`
  });
}
