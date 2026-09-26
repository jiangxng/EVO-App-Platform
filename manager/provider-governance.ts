import { appendFileSync, existsSync, mkdirSync, readFileSync } from "node:fs";
import { dirname } from "node:path";
import { randomUUID, timingSafeEqual } from "node:crypto";

export interface ProviderGovernanceDecisionV010 {
  allowed: boolean;
  actorId: string;
  reason: string;
}

export interface ProviderBindingAuditEventV010 {
  contractVersion: "0.1.0";
  eventId: string;
  occurredAt: string;
  action: "UPDATE_PROVIDER_BINDING" | "PROBE_PROVIDER_HEALTH";
  outcome: "ALLOWED" | "DENIED";
  actorId: string;
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

export function authorizeProviderAdministrationV010(
  suppliedToken: string | undefined,
  configuredToken: string | undefined
): ProviderGovernanceDecisionV010 {
  const expected = configuredToken?.trim();
  if (!expected) {
    return {
      allowed: false,
      actorId: "anonymous",
      reason: "PROVIDER_ADMIN_AUTH_NOT_CONFIGURED"
    };
  }

  const supplied = suppliedToken?.trim();
  if (!supplied) {
    return {
      allowed: false,
      actorId: "anonymous",
      reason: "PROVIDER_ADMIN_AUTH_REQUIRED"
    };
  }

  const expectedBytes = Buffer.from(expected, "utf8");
  const suppliedBytes = Buffer.from(supplied, "utf8");
  const matches = expectedBytes.length === suppliedBytes.length
    && timingSafeEqual(expectedBytes, suppliedBytes);

  return matches
    ? {
        allowed: true,
        actorId: "bootstrap-admin",
        reason: "BOOTSTRAP_ADMIN_TOKEN_ACCEPTED"
      }
    : {
        allowed: false,
        actorId: "anonymous",
        reason: "PROVIDER_ADMIN_AUTH_INVALID"
      };
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
  const occurredAt = now().toISOString();
  const eventId = randomUUID();
  return {
    contractVersion: "0.1.0",
    eventId,
    occurredAt,
    ...input
  };
}
