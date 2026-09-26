import { appendFileSync, existsSync, mkdirSync, readFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { dirname } from "node:path";
import type { SecretReferenceV010 } from "../contracts/platform-services.js";

export interface SecretAuditEventV010 {
  contractVersion: "0.1.0";
  eventId: string;
  occurredAt: string;
  action: "PUT_SECRET" | "REMOVE_SECRET";
  outcome: "ALLOWED" | "DENIED" | "FAILED";
  actorId: string;
  policyProviderId?: string;
  correlationId?: string;
  reference: SecretReferenceV010;
  reason: string;
}

export interface SecretAuditStoreV010 {
  append(event: SecretAuditEventV010): void;
  list(limit?: number): SecretAuditEventV010[];
}

export const SECRET_VALUE_MANAGE_ACTION = "secret.value.manage";

export function secretAuditEventV010(
  input: Omit<SecretAuditEventV010, "contractVersion" | "eventId" | "occurredAt">,
  now: () => Date = () => new Date()
): SecretAuditEventV010 {
  return {
    contractVersion: "0.1.0",
    eventId: randomUUID(),
    occurredAt: now().toISOString(),
    ...input
  };
}

export function createMemorySecretAuditStoreV010(
  maxEvents = 1000
): SecretAuditStoreV010 {
  const events: SecretAuditEventV010[] = [];
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

export function createJsonlSecretAuditStoreV010(
  filePath: string,
  maxReadEvents = 5000
): SecretAuditStoreV010 {
  return {
    append(event) {
      mkdirSync(dirname(filePath), { recursive: true });
      appendFileSync(filePath, JSON.stringify(event) + "\n", {
        encoding: "utf8",
        mode: 0o600
      });
    },
    list(limit = 100) {
      if (!existsSync(filePath)) return [];
      const normalized = Math.max(1, Math.min(limit, maxReadEvents));
      const lines = readFileSync(filePath, "utf8")
        .split(/\r?\n/)
        .filter(Boolean)
        .slice(-maxReadEvents);
      const parsed: SecretAuditEventV010[] = [];
      for (const line of lines) {
        try {
          const event = JSON.parse(line) as SecretAuditEventV010;
          if (event?.contractVersion === "0.1.0") parsed.push(event);
        } catch {
          // Preserve operator access even when an old audit line is malformed.
        }
      }
      return parsed.slice(-normalized).reverse();
    }
  };
}
