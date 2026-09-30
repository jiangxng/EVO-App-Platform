import type {
  IdentityAuthenticationProviderV010,
  IdentitySessionV010
} from "../contracts/platform-services.js";
import type {
  ManagedIdentitySessionServiceV010
} from "./identity-session-store.js";
import {
  clearIdentitySessionCookieV010,
  serializeIdentitySessionCookieV010
} from "./session-cookie.js";

export interface AuthenticationFlowStartResultV010 {
  redirectUrl: string;
}

export interface AuthenticationFlowCompleteResultV010 {
  session: IdentitySessionV010;
  setCookie: string;
  returnTo: string;
}

export interface AuthenticationFlowLogoutResultV010 {
  revoked: boolean;
  setCookie: string;
  returnTo: string;
}

export function normalizeAuthenticationReturnToV010(
  value: string | undefined
): string {
  const candidate = value?.trim() || "/";
  if (!candidate.startsWith("/") || candidate.startsWith("//") || candidate.includes("\\")) {
    return "/";
  }
  try {
    const parsed = new URL(candidate, "https://evo.invalid");
    if (parsed.origin !== "https://evo.invalid") return "/";
    return parsed.pathname + parsed.search + parsed.hash;
  } catch {
    return "/";
  }
}

export function normalizePublicBaseUrlV010(value: string): string {
  const parsed = new URL(value);
  if (parsed.protocol !== "https:" && parsed.hostname !== "localhost") {
    throw new Error("AUTHENTICATION_PUBLIC_BASE_URL_HTTPS_REQUIRED");
  }
  parsed.pathname = "/";
  parsed.search = "";
  parsed.hash = "";
  return parsed.toString().replace(/\/$/, "");
}

export function createAuthenticationFlowV010(input: {
  provider: IdentityAuthenticationProviderV010;
  sessions: ManagedIdentitySessionServiceV010;
  publicBaseUrl: string;
  sessionTtlSeconds: number;
  secureCookie?: boolean;
  onAuthenticatedPrincipal?: (
    principal: import("../contracts/platform-services.js").PlatformPrincipalV010
  ) => Promise<void> | void;
}) {
  const publicBaseUrl = normalizePublicBaseUrlV010(input.publicBaseUrl);
  if (!Number.isFinite(input.sessionTtlSeconds) || input.sessionTtlSeconds <= 0) {
    throw new Error("AUTHENTICATION_SESSION_TTL_INVALID");
  }
  const callbackUrl = publicBaseUrl + "/auth/callback";

  return {
    async start(request: {
      returnTo?: string;
      locale?: string;
    }): Promise<AuthenticationFlowStartResultV010> {
      const returnTo = normalizeAuthenticationReturnToV010(request.returnTo);
      const result = await input.provider.begin({
        contractVersion: "0.1.0",
        callbackUrl,
        returnTo,
        ...(request.locale ? { locale: request.locale } : {})
      });
      const redirect = new URL(result.redirectUrl);
      if (redirect.protocol !== "https:" && redirect.hostname !== "localhost") {
        throw new Error("AUTHENTICATION_REDIRECT_HTTPS_REQUIRED");
      }
      return { redirectUrl: redirect.toString() };
    },

    async complete(
      requestCallbackUrl: string
    ): Promise<AuthenticationFlowCompleteResultV010> {
      const callback = new URL(requestCallbackUrl);
      if (
        callback.origin !== new URL(publicBaseUrl).origin
        || callback.pathname !== "/auth/callback"
      ) {
        throw new Error("AUTHENTICATION_CALLBACK_URL_INVALID");
      }
      const authenticated = await input.provider.complete({
        contractVersion: "0.1.0",
        callbackUrl: callback.toString()
      });
      if (authenticated.principal.actorType !== "HUMAN") {
        throw new Error("AUTHENTICATION_HUMAN_PRINCIPAL_REQUIRED");
      }
      await input.onAuthenticatedPrincipal?.(authenticated.principal);
      const issued = input.sessions.issue({
        principal: authenticated.principal,
        ttlSeconds: input.sessionTtlSeconds,
        assurance: authenticated.assurance
      });
      return {
        session: issued.session,
        setCookie: serializeIdentitySessionCookieV010(issued.token, {
          maxAgeSeconds: input.sessionTtlSeconds,
          secure: input.secureCookie ?? true
        }),
        returnTo: normalizeAuthenticationReturnToV010(authenticated.returnTo)
      };
    },

    logout(
      sessionToken: string | undefined,
      returnTo?: string
    ): AuthenticationFlowLogoutResultV010 {
      let revoked = false;
      if (sessionToken?.trim()) {
        const current = input.sessions.resolveToken(sessionToken.trim());
        if (current) {
          revoked = input.sessions.revoke(current.sessionId, "LOGOUT");
        }
      }
      return {
        revoked,
        setCookie: clearIdentitySessionCookieV010({
          secure: input.secureCookie ?? true
        }),
        returnTo: normalizeAuthenticationReturnToV010(returnTo)
      };
    }
  };
}
