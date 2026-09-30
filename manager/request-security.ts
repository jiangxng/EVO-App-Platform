import type { IncomingHttpHeaders } from "node:http";
import { EVO_SESSION_COOKIE_NAME } from "./session-cookie.js";

const MUTATING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

function hasSessionCookie(headers: IncomingHttpHeaders): boolean {
  const raw = headers.cookie;
  if (!raw) return false;
  return raw.split(";").some(part =>
    part.trim().startsWith(EVO_SESSION_COOKIE_NAME + "=")
  );
}

export function requireSameOriginForCookieMutationV010(input: {
  method: string | undefined;
  headers: IncomingHttpHeaders;
  publicBaseUrl: string;
}): void {
  const method = input.method?.toUpperCase() ?? "GET";
  if (!MUTATING_METHODS.has(method)) return;
  if (!hasSessionCookie(input.headers)) return;

  const expected = new URL(input.publicBaseUrl).origin;
  const rawOrigin = input.headers.origin;
  const origin = Array.isArray(rawOrigin) ? rawOrigin[0] : rawOrigin;
  if (!origin) throw new Error("CSRF_ORIGIN_REQUIRED");

  let actual: string;
  try {
    actual = new URL(origin).origin;
  } catch {
    throw new Error("CSRF_ORIGIN_INVALID");
  }
  if (actual !== expected) {
    throw new Error("CSRF_ORIGIN_MISMATCH");
  }
}

export function requestSecurityHttpFailureV010(error: unknown):
  | { status: 403; code: "CSRF_REJECTED"; message: string }
  | undefined {
  const message = error instanceof Error ? error.message : String(error);
  if (
    message === "CSRF_ORIGIN_REQUIRED"
    || message === "CSRF_ORIGIN_INVALID"
    || message === "CSRF_ORIGIN_MISMATCH"
  ) {
    return {
      status: 403,
      code: "CSRF_REJECTED",
      message: "Cookie-authenticated state changes require the configured same-origin browser origin."
    };
  }
  return undefined;
}
