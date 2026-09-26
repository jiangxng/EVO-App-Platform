import { timingSafeEqual } from "node:crypto";
import type {
  IdentitySessionRequestV010,
  IdentitySessionV010,
  PlatformActorType,
  RequestIdentitySessionProviderV010
} from "../../contracts/platform-services.js";
import { HOST_BEARER_SESSION_PROVIDER_ID } from "./package.js";

export interface HostBearerSessionEntryV010 {
  token: string;
  session: IdentitySessionV010;
}

function requiredString(value: unknown, field: string): string {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`REQUEST_SESSION_FIELD_REQUIRED: ${field}`);
  }
  return value.trim();
}

function optionalString(value: unknown, field: string): string | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`REQUEST_SESSION_FIELD_INVALID: ${field}`);
  }
  return value.trim();
}

function actorType(value: unknown): PlatformActorType {
  const normalized = value ?? "HUMAN";
  if (!["HUMAN", "AI", "AUTOMATION", "SERVICE"].includes(String(normalized))) {
    throw new Error("REQUEST_SESSION_ACTOR_TYPE_INVALID");
  }
  return normalized as PlatformActorType;
}

function parseSession(value: unknown, index: number): IdentitySessionV010 {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`REQUEST_SESSION_INVALID: sessions[${index}].session`);
  }
  const session = value as Record<string, unknown>;
  const principal = session.principal;
  if (principal === null || typeof principal !== "object" || Array.isArray(principal)) {
    throw new Error(`REQUEST_SESSION_PRINCIPAL_INVALID: sessions[${index}]`);
  }
  const p = principal as Record<string, unknown>;
  const claims = p.claims;
  if (
    claims !== undefined
    && (claims === null || typeof claims !== "object" || Array.isArray(claims))
  ) {
    throw new Error(`REQUEST_SESSION_CLAIMS_INVALID: sessions[${index}]`);
  }

  return {
    contractVersion: "0.1.0",
    sessionId: requiredString(session.sessionId, `sessions[${index}].sessionId`),
    principal: {
      contractVersion: "0.1.0",
      subjectId: requiredString(p.subjectId, `sessions[${index}].principal.subjectId`),
      actorType: actorType(p.actorType),
      identityProviderId: requiredString(
        p.identityProviderId ?? HOST_BEARER_SESSION_PROVIDER_ID,
        `sessions[${index}].principal.identityProviderId`
      ),
      ...(optionalString(p.displayName, `sessions[${index}].principal.displayName`)
        ? { displayName: optionalString(p.displayName, `sessions[${index}].principal.displayName`) }
        : {}),
      ...(claims
        ? { claims: structuredClone(claims) as Record<string, string | number | boolean | null> }
        : {})
    },
    issuedAt: requiredString(session.issuedAt, `sessions[${index}].issuedAt`),
    ...(optionalString(session.expiresAt, `sessions[${index}].expiresAt`)
      ? { expiresAt: optionalString(session.expiresAt, `sessions[${index}].expiresAt`) }
      : {}),
    ...(Array.isArray(session.assurance)
      ? {
          assurance: session.assurance.map((item, assuranceIndex) =>
            requiredString(item, `sessions[${index}].assurance[${assuranceIndex}]`)
          )
        }
      : {})
  };
}

export function parseHostBearerSessionsV010(
  raw: string | undefined
): HostBearerSessionEntryV010[] | undefined {
  if (!raw?.trim()) return undefined;
  const parsed = JSON.parse(raw) as Record<string, unknown>;
  if (
    parsed === null
    || typeof parsed !== "object"
    || Array.isArray(parsed)
    || parsed.contractVersion !== "0.1.0"
    || !Array.isArray(parsed.sessions)
  ) {
    throw new Error("REQUEST_SESSION_CONFIG_INVALID");
  }

  const entries = parsed.sessions.map((value, index): HostBearerSessionEntryV010 => {
    if (value === null || typeof value !== "object" || Array.isArray(value)) {
      throw new Error(`REQUEST_SESSION_ENTRY_INVALID: ${index}`);
    }
    const item = value as Record<string, unknown>;
    return {
      token: requiredString(item.token, `sessions[${index}].token`),
      session: parseSession(item.session, index)
    };
  });

  const sessionIds = new Set<string>();
  for (const entry of entries) {
    if (sessionIds.has(entry.session.sessionId)) {
      throw new Error(`REQUEST_SESSION_DUPLICATE: ${entry.session.sessionId}`);
    }
    sessionIds.add(entry.session.sessionId);
  }
  return entries;
}

function tokenEquals(expected: string, supplied: string): boolean {
  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(supplied, "utf8");
  return a.length === b.length && timingSafeEqual(a, b);
}

export function createHostBearerSessionProviderV010(
  entries: readonly HostBearerSessionEntryV010[],
  now: () => Date = () => new Date()
): RequestIdentitySessionProviderV010 {
  const canonical = entries.map(entry => structuredClone(entry));
  return {
    providerId: HOST_BEARER_SESSION_PROVIDER_ID,
    resolve(input: IdentitySessionRequestV010) {
      const token = input.bearerToken?.trim();
      const sessionId = input.sessionId?.trim();
      const entry = canonical.find(candidate =>
        (token ? tokenEquals(candidate.token, token) : false)
        || (sessionId ? candidate.session.sessionId === sessionId : false)
      );
      if (!entry) return undefined;
      if (entry.session.expiresAt) {
        const expiresAt = Date.parse(entry.session.expiresAt);
        if (!Number.isFinite(expiresAt)) throw new Error("REQUEST_SESSION_EXPIRES_AT_INVALID");
        if (now().getTime() >= expiresAt) return undefined;
      }
      return structuredClone(entry.session);
    }
  };
}

export function createHostBearerSessionHealthProbeV010(
  entries: readonly HostBearerSessionEntryV010[]
) {
  return () => ({
    state: entries.length > 0 ? "HEALTHY" as const : "DEGRADED" as const,
    message: `Request-bound bearer Session directory loaded with ${entries.length} session(s).`
  });
}
