import type { IncomingHttpHeaders } from "node:http";
import type { AppActionRequestV010 } from "../actions/contracts.js";
import type {
  ActiveContextRefV010,
  IdentitySessionRequestV010,
  IdentitySessionV010,
  PlatformRequestContextV010
} from "../contracts/platform-services.js";
import type { HostContextRegistryV010 } from "./context-registry.js";
import { legacyScopeFromRequestContextV010 } from "./material-write-authorization.js";
import { sessionTokenFromCookieHeaderV010 } from "./session-cookie.js";

export function identitySessionRequestFromHeadersV010(
  headers: IncomingHttpHeaders
): IdentitySessionRequestV010 {
  const authorization = headers.authorization;
  const bearerToken = typeof authorization === "string"
    && authorization.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length).trim()
    : undefined;
  const sessionToken = sessionTokenFromCookieHeaderV010(headers);
  const sessionIdHeader = headers["x-evo-session-id"];
  const sessionId = typeof sessionIdHeader === "string"
    ? sessionIdHeader.trim()
    : Array.isArray(sessionIdHeader)
      ? sessionIdHeader[0]?.trim()
      : undefined;

  return {
    contractVersion: "0.1.0",
    ...(bearerToken ? { bearerToken } : {}),
    ...(sessionToken ? { sessionToken } : {}),
    ...(sessionId ? { sessionId } : {})
  };
}

function activeContextFromValue(value: unknown): ActiveContextRefV010 | undefined {
  if (value === undefined) return undefined;
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("ACTIVE_CONTEXT_INVALID");
  }
  const raw = value as Record<string, unknown>;
  const kind = raw.kind;
  const contextId = raw.contextId;
  if (typeof contextId !== "string" || !contextId.trim()) {
    throw new Error("ACTIVE_CONTEXT_INVALID");
  }
  if (kind === "PERSONAL") {
    return {
      contractVersion: "0.1.0",
      kind,
      contextId: contextId.trim()
    };
  }
  if (kind === "ENTERPRISE") {
    const enterpriseId = raw.enterpriseId;
    if (typeof enterpriseId !== "string" || !enterpriseId.trim()) {
      throw new Error("ACTIVE_CONTEXT_INVALID");
    }
    return {
      contractVersion: "0.1.0",
      kind,
      contextId: contextId.trim(),
      enterpriseId: enterpriseId.trim()
    };
  }
  throw new Error("ACTIVE_CONTEXT_INVALID");
}

export function contextFromHeaderV010(
  headers: IncomingHttpHeaders,
  registry: HostContextRegistryV010
): ActiveContextRefV010 | undefined {
  const raw = headers["x-evo-context-id"];
  const contextId = typeof raw === "string"
    ? raw.trim()
    : Array.isArray(raw)
      ? raw[0]?.trim()
      : undefined;
  if (!contextId) return undefined;
  const context = registry.list().find(item => item.contextId === contextId);
  if (!context) throw new Error(`CONTEXT_NOT_AVAILABLE: ${contextId}`);
  return context;
}

export function createPlatformRequestContextV010(
  session: IdentitySessionV010,
  registry: HostContextRegistryV010,
  action: AppActionRequestV010,
  headers: IncomingHttpHeaders,
  locale?: string
): PlatformRequestContextV010 {
  const selection = activeContextFromValue(action.values.activeContext)
    ?? contextFromHeaderV010(headers, registry);
  const context = registry.resolve(selection);
  const principal = {
    ...structuredClone(session.principal),
    sessionId: session.sessionId
  };
  const partial: PlatformRequestContextV010 = {
    contractVersion: "0.1.0",
    principal,
    scope: {
      contractVersion: "0.1.0",
      userId: principal.subjectId
    },
    context,
    correlationId: action.sourceInteractionId,
    ...(locale ? { locale } : {})
  };
  return {
    ...partial,
    scope: legacyScopeFromRequestContextV010(partial)
  };
}
