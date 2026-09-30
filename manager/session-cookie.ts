import type { IncomingHttpHeaders } from "node:http";

export const EVO_SESSION_COOKIE_NAME = "__Host-evo_session";

export function sessionTokenFromCookieHeaderV010(
  headers: IncomingHttpHeaders,
  cookieName = EVO_SESSION_COOKIE_NAME
): string | undefined {
  const raw = headers.cookie;
  if (!raw) return undefined;
  const values = raw.split(";")
    .map(item => item.trim())
    .filter(Boolean)
    .map(item => {
      const separator = item.indexOf("=");
      return separator < 0
        ? [item, ""] as const
        : [item.slice(0, separator).trim(), item.slice(separator + 1).trim()] as const;
    })
    .filter(([name]) => name === cookieName)
    .map(([, value]) => value)
    .filter(Boolean);
  if (values.length > 1) {
    throw new Error("IDENTITY_SESSION_COOKIE_AMBIGUOUS");
  }
  return values[0];
}

export function serializeIdentitySessionCookieV010(
  token: string,
  input: {
    maxAgeSeconds: number;
    secure?: boolean;
    cookieName?: string;
  }
): string {
  if (!token.trim()) throw new Error("IDENTITY_SESSION_COOKIE_TOKEN_REQUIRED");
  if (!Number.isFinite(input.maxAgeSeconds) || input.maxAgeSeconds <= 0) {
    throw new Error("IDENTITY_SESSION_COOKIE_MAX_AGE_INVALID");
  }
  const cookieName = input.cookieName ?? EVO_SESSION_COOKIE_NAME;
  const secure = input.secure ?? true;
  return [
    `${cookieName}=${token.trim()}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    ...(secure ? ["Secure"] : []),
    `Max-Age=${Math.trunc(input.maxAgeSeconds)}`
  ].join("; ");
}

export function clearIdentitySessionCookieV010(input?: {
  secure?: boolean;
  cookieName?: string;
}): string {
  const cookieName = input?.cookieName ?? EVO_SESSION_COOKIE_NAME;
  const secure = input?.secure ?? true;
  return [
    `${cookieName}=`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    ...(secure ? ["Secure"] : []),
    "Max-Age=0"
  ].join("; ");
}
