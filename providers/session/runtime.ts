import type {
  IdentitySessionProviderV010,
  IdentitySessionV010,
  PlatformActorType
} from "../../contracts/platform-services.js";
import { HOST_STATIC_SESSION_PROVIDER_ID } from "./package.js";

function requiredString(value: unknown, field: string): string {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`IDENTITY_SESSION_FIELD_REQUIRED: ${field}`);
  }
  return value.trim();
}

function optionalString(value: unknown, field: string): string | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`IDENTITY_SESSION_FIELD_INVALID: ${field}`);
  }
  return value.trim();
}

function actorType(value: unknown): PlatformActorType {
  const normalized = value ?? "HUMAN";
  if (!["HUMAN", "AI", "AUTOMATION", "SERVICE"].includes(String(normalized))) {
    throw new Error("IDENTITY_SESSION_ACTOR_TYPE_INVALID");
  }
  return normalized as PlatformActorType;
}

export function parseHostStaticSessionV010(
  raw: string | undefined
): IdentitySessionV010 | undefined {
  if (!raw?.trim()) return undefined;
  const parsed = JSON.parse(raw) as Record<string, unknown>;
  if (
    parsed === null
    || typeof parsed !== "object"
    || Array.isArray(parsed)
    || parsed.contractVersion !== "0.1.0"
  ) {
    throw new Error("IDENTITY_SESSION_CONFIG_INVALID");
  }

  const principal = parsed.principal;
  if (principal === null || typeof principal !== "object" || Array.isArray(principal)) {
    throw new Error("IDENTITY_SESSION_PRINCIPAL_INVALID");
  }
  const p = principal as Record<string, unknown>;
  const claims = p.claims;
  if (
    claims !== undefined
    && (claims === null || typeof claims !== "object" || Array.isArray(claims))
  ) {
    throw new Error("IDENTITY_SESSION_CLAIMS_INVALID");
  }

  return {
    contractVersion: "0.1.0",
    sessionId: requiredString(parsed.sessionId, "sessionId"),
    principal: {
      contractVersion: "0.1.0",
      subjectId: requiredString(p.subjectId, "principal.subjectId"),
      actorType: actorType(p.actorType),
      identityProviderId: requiredString(
        p.identityProviderId ?? HOST_STATIC_SESSION_PROVIDER_ID,
        "principal.identityProviderId"
      ),
      ...(optionalString(p.displayName, "principal.displayName")
        ? { displayName: optionalString(p.displayName, "principal.displayName") }
        : {}),
      ...(claims ? { claims: structuredClone(claims) as Record<string, string | number | boolean | null> } : {})
    },
    issuedAt: requiredString(parsed.issuedAt, "issuedAt"),
    ...(optionalString(parsed.expiresAt, "expiresAt")
      ? { expiresAt: optionalString(parsed.expiresAt, "expiresAt") }
      : {}),
    ...(Array.isArray(parsed.assurance)
      ? {
          assurance: parsed.assurance.map((value, index) =>
            requiredString(value, `assurance[${index}]`)
          )
        }
      : {})
  };
}

export function createHostStaticSessionProviderV010(
  session: IdentitySessionV010,
  now: () => Date = () => new Date()
): IdentitySessionProviderV010 {
  const canonical = structuredClone(session);
  return {
    providerId: HOST_STATIC_SESSION_PROVIDER_ID,
    current() {
      if (canonical.expiresAt) {
        const expiresAt = Date.parse(canonical.expiresAt);
        if (!Number.isFinite(expiresAt)) {
          throw new Error("IDENTITY_SESSION_EXPIRES_AT_INVALID");
        }
        if (now().getTime() >= expiresAt) return undefined;
      }
      return structuredClone(canonical);
    }
  };
}

export function createHostStaticSessionHealthProbeV010(
  provider: IdentitySessionProviderV010
) {
  return () => {
    const session = provider.current();
    return session
      ? {
          state: "HEALTHY" as const,
          message: `Static session is active for subject '${session.principal.subjectId}'.`
        }
      : {
          state: "UNAVAILABLE" as const,
          message: "Static session is expired or unavailable."
        };
  };
}
