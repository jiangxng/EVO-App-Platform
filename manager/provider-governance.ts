import { appendFileSync, existsSync, mkdirSync, readFileSync } from "node:fs";
import { dirname } from "node:path";
import { randomUUID, timingSafeEqual } from "node:crypto";
import type {
  AuthorizationProviderV010,
  PlatformPrincipalV010,
  PlatformScopeV010
} from "../contracts/platform-services.js";

export const PROVIDER_BINDING_UPDATE_ACTION = "provider.binding.update";
export const PROVIDER_HEALTH_PROBE_ACTION = "provider.health.probe";
export const PROVIDER_GOVERNANCE_AUDIT_READ_ACTION = "provider.governance.audit.read";

export interface ProviderGovernanceAuthenticationV010 {
  authenticated: boolean;
  principal?: PlatformPrincipalV010;
  reason: string;
}

export interface ProviderGovernanceDecisionV010 {
  allowed: boolean;
  actorId: string;
  reason: string;
  policyProviderId?: string;
}

export interface ProviderBindingAuditEventV010 {
  contractVersion: "0.1.0";
  eventId: string;
  occurredAt: string;
  action:
    | "UPDATE_PROVIDER_BINDING"
    | "PROBE_PROVIDER_HEALTH"
    | "READ_PROVIDER_GOVERNANCE_AUDIT";
  outcome: "ALLOWED" | "DENIED";
  actorId: string;
  policyProviderId?: string;
  correlationId?: string;
  capability?: string;
  providerId?: string;
  scope?: string;
  scopeId?: string;
  reason: string;
}

export interface ProviderBindingAuditStoreV010 {
  append(event: ProviderBindingAuditEventV010): void;
  list(limit?: number): ProviderBindingAuditEventV010[];
}

export function authenticateBootstrapAdministratorV010(
  suppliedToken: string | undefined,
  configuredToken: string | undefined
): ProviderGovernanceAuthenticationV010 {
  const expected = configuredToken?.trim();
  if (!expected) {
    return {
      authenticated: false,
      reason: "PROVIDER_ADMIN_AUTH_NOT_CONFIGURED"
    };
  }

  const supplied = suppliedToken?.trim();
  if (!supplied) {
    return {
      authenticated: false,
      reason: "PROVIDER_ADMIN_AUTH_REQUIRED"
    };
  }

  const expectedBytes = Buffer.from(expected, "utf8");
  const suppliedBytes = Buffer.from(supplied, "utf8");
  const matches = expectedBytes.length === suppliedBytes.length
    && timingSafeEqual(expectedBytes, suppliedBytes);

  if (!matches) {
    return {
      authenticated: false,
      reason: "PROVIDER_ADMIN_AUTH_INVALID"
    };
  }

  return {
    authenticated: true,
    principal: {
      contractVersion: "0.1.0",
      subjectId: "bootstrap-admin",
      actorType: "HUMAN",
      identityProviderId: "host.bootstrap"
    },
    reason: "BOOTSTRAP_ADMIN_AUTHENTICATED"
  };
}

export async function authorizeProviderAdministrationV010(
  authentication: ProviderGovernanceAuthenticationV010,
  authorizationProvider: AuthorizationProviderV010 | undefined,
  input: {
    action: string;
    resource: {
      type: string;
      id?: string;
      attributes?: Record<string, string | number | boolean | null>;
    };
    scope?: Omit<PlatformScopeV010, "contractVersion">;
    context?: Record<string, string | number | boolean | null>;
  }
): Promise<ProviderGovernanceDecisionV010> {
  if (!authentication.authenticated || !authentication.principal) {
    return {
      allowed: false,
      actorId: "anonymous",
      reason: authentication.reason
    };
  }

  const actorId = authentication.principal.subjectId;
  if (!authorizationProvider) {
    return {
      allowed: false,
      actorId,
      reason: "AUTHORIZATION_PROVIDER_UNAVAILABLE"
    };
  }

  try {
    const decision = await authorizationProvider.check({
      contractVersion: "0.1.0",
      principal: authentication.principal,
      scope: {
        contractVersion: "0.1.0",
        ...(input.scope ?? {})
      },
      action: input.action,
      resource: input.resource,
      ...(input.context ? { context: input.context } : {})
    });

    return {
      allowed: decision.allowed,
      actorId,
      reason: decision.reasonCodes.join(",") || (decision.allowed
        ? "AUTHORIZATION_ALLOWED"
        : "AUTHORIZATION_DENIED"),
      policyProviderId: decision.policyProviderId
    };
  } catch {
    return {
      allowed: false,
      actorId,
      reason: "AUTHORIZATION_PROVIDER_ERROR",
      policyProviderId: authorizationProvider.providerId
    };
  }
}

export function createMemoryProviderBindingAuditStoreV010(
  maxEvents = 1000
): ProviderBindingAuditStoreV010 {
  const events: ProviderBindingAuditEventV010[] = [];
  return {
    append(event) {
      events.push(structuredClone(event));
      while (events.length > maxEvents) events.shift();
    },
    list(limit = 100) {
      const normalized = Math.max(1, Math.min(limit, maxEvents));
      return events.slice(-normalized).reverse().map(event => structuredClone(event));
    }
  };
}

export function createJsonlProviderBindingAuditStoreV010(
  filePath: string,
  maxReadEvents = 5000
): ProviderBindingAuditStoreV010 {
  return {
    append(event) {
      mkdirSync(dirname(filePath), { recursive: true });
      appendFileSync(filePath, JSON.stringify(event) + "\n", "utf8");
    },
    list(limit = 100) {
      if (!existsSync(filePath)) return [];
      const normalized = Math.max(1, Math.min(limit, maxReadEvents));
      const lines = readFileSync(filePath, "utf8")
        .split(/\r?\n/)
        .filter(Boolean)
        .slice(-maxReadEvents);
      const parsed: ProviderBindingAuditEventV010[] = [];
      for (const line of lines) {
        try {
          const event = JSON.parse(line) as ProviderBindingAuditEventV010;
          if (event?.contractVersion === "0.1.0") parsed.push(event);
        } catch {
          // Ignore malformed historical lines rather than breaking operator read access.
        }
      }
      return parsed.slice(-normalized).reverse();
    }
  };
}

export function providerAuditEventV010(
  input: Omit<ProviderBindingAuditEventV010, "contractVersion" | "eventId" | "occurredAt">,
  now: () => Date = () => new Date()
): ProviderBindingAuditEventV010 {
  return {
    contractVersion: "0.1.0",
    eventId: randomUUID(),
    occurredAt: now().toISOString(),
    ...input
  };
}
