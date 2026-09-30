import test from "node:test";
import assert from "node:assert/strict";

import {
  createMemoryManagedIdentitySessionEventStoreV010,
  createManagedIdentitySessionServiceV010
} from "../../dist/manager/identity-session-store.js";
import {
  createAuthenticationFlowV010,
  normalizeAuthenticationReturnToV010,
  normalizePublicBaseUrlV010
} from "../../dist/manager/authentication-flow.js";
import {
  requireSameOriginForCookieMutationV010,
  requestSecurityHttpFailureV010
} from "../../dist/manager/request-security.js";
import {
  requestAuthenticationHttpFailureV010
} from "../../dist/manager/request-authentication.js";

function sessionService() {
  let tokenIndex = 0;
  let id = 0;
  return createManagedIdentitySessionServiceV010({
    store: createMemoryManagedIdentitySessionEventStoreV010(),
    now: () => new Date("2026-09-30T09:00:00.000Z"),
    token: () => `session-token-${++tokenIndex}`,
    id: () => String(++id)
  });
}

function humanProvider(overrides = {}) {
  return {
    providerId: "test.identity",
    begin(input) {
      return {
        contractVersion: "0.1.0",
        redirectUrl:
          "https://idp.example/authorize?redirect_uri="
          + encodeURIComponent(input.callbackUrl)
      };
    },
    complete() {
      return {
        contractVersion: "0.1.0",
        principal: {
          contractVersion: "0.1.0",
          subjectId: "alice",
          actorType: "HUMAN",
          identityProviderId: "test.identity",
          displayName: "Alice"
        },
        assurance: ["OIDC", "PKCE"],
        returnTo: "/enterprise/context"
      };
    },
    ...overrides
  };
}

test("authentication flow delegates identity proof to Provider then Host issues managed Session", async () => {
  const sessions = sessionService();
  const flow = createAuthenticationFlowV010({
    provider: humanProvider(),
    sessions,
    publicBaseUrl: "https://evo.example/",
    sessionTtlSeconds: 3600
  });

  const start = await flow.start({
    returnTo: "/ledger?tab=runtime",
    locale: "zh-CN"
  });
  assert.match(start.redirectUrl, /^https:\/\/idp\.example\/authorize/);
  assert.match(
    start.redirectUrl,
    /redirect_uri=https%3A%2F%2Fevo\.example%2Fauth%2Fcallback/
  );

  const complete = await flow.complete(
    "https://evo.example/auth/callback?code=abc&state=xyz"
  );
  assert.equal(complete.session.principal.subjectId, "alice");
  assert.equal(complete.session.principal.actorType, "HUMAN");
  assert.deepEqual(complete.session.assurance, ["OIDC", "PKCE"]);
  assert.equal(complete.returnTo, "/enterprise/context");
  assert.match(complete.setCookie, /^__Host-evo_session=session-token-1;/);
  assert.match(complete.setCookie, /HttpOnly/);
  assert.match(complete.setCookie, /Secure/);
  assert.equal(
    sessions.resolveToken("session-token-1")?.principal.subjectId,
    "alice"
  );
});

test("authentication flow prevents external returnTo redirects", async () => {
  const sessions = sessionService();
  const provider = humanProvider({
    complete() {
      return {
        contractVersion: "0.1.0",
        principal: {
          contractVersion: "0.1.0",
          subjectId: "alice",
          actorType: "HUMAN",
          identityProviderId: "test.identity"
        },
        returnTo: "https://evil.example/steal"
      };
    }
  });
  const flow = createAuthenticationFlowV010({
    provider,
    sessions,
    publicBaseUrl: "https://evo.example",
    sessionTtlSeconds: 3600
  });
  const complete = await flow.complete(
    "https://evo.example/auth/callback?code=abc"
  );
  assert.equal(complete.returnTo, "/");
  assert.equal(normalizeAuthenticationReturnToV010("//evil.example"), "/");
  assert.equal(normalizeAuthenticationReturnToV010("/ok?a=1#b"), "/ok?a=1#b");
});

test("authentication callback is bound to configured public origin and callback path", async () => {
  const flow = createAuthenticationFlowV010({
    provider: humanProvider(),
    sessions: sessionService(),
    publicBaseUrl: "https://evo.example",
    sessionTtlSeconds: 3600
  });
  await assert.rejects(
    () => flow.complete("https://evil.example/auth/callback?code=abc"),
    /AUTHENTICATION_CALLBACK_URL_INVALID/
  );
  await assert.rejects(
    () => flow.complete("https://evo.example/not-callback?code=abc"),
    /AUTHENTICATION_CALLBACK_URL_INVALID/
  );
  assert.throws(
    () => normalizePublicBaseUrlV010("http://evo.example"),
    /AUTHENTICATION_PUBLIC_BASE_URL_HTTPS_REQUIRED/
  );
  assert.equal(
    normalizePublicBaseUrlV010("http://localhost:4100/app"),
    "http://localhost:4100"
  );
});

test("authentication flow refuses non-Human Principal for browser Human login", async () => {
  const provider = humanProvider({
    complete() {
      return {
        contractVersion: "0.1.0",
        principal: {
          contractVersion: "0.1.0",
          subjectId: "service-1",
          actorType: "SERVICE",
          identityProviderId: "test.identity"
        }
      };
    }
  });
  const flow = createAuthenticationFlowV010({
    provider,
    sessions: sessionService(),
    publicBaseUrl: "https://evo.example",
    sessionTtlSeconds: 3600
  });
  await assert.rejects(
    () => flow.complete("https://evo.example/auth/callback?code=abc"),
    /AUTHENTICATION_HUMAN_PRINCIPAL_REQUIRED/
  );
});

test("logout revokes current managed Session and clears cookie", async () => {
  const sessions = sessionService();
  const flow = createAuthenticationFlowV010({
    provider: humanProvider(),
    sessions,
    publicBaseUrl: "https://evo.example",
    sessionTtlSeconds: 3600
  });
  await flow.complete("https://evo.example/auth/callback?code=abc");
  assert.ok(sessions.resolveToken("session-token-1"));

  const logout = flow.logout("session-token-1", "/signed-out");
  assert.equal(logout.revoked, true);
  assert.equal(logout.returnTo, "/signed-out");
  assert.match(logout.setCookie, /Max-Age=0/);
  assert.equal(sessions.resolveToken("session-token-1"), undefined);
});

test("cookie-authenticated mutations require configured same-origin Origin", () => {
  const base = "https://evo.example";
  assert.doesNotThrow(() => requireSameOriginForCookieMutationV010({
    method: "POST",
    headers: {
      cookie: "__Host-evo_session=opaque",
      origin: "https://evo.example"
    },
    publicBaseUrl: base
  }));

  assert.throws(() => requireSameOriginForCookieMutationV010({
    method: "POST",
    headers: {
      cookie: "__Host-evo_session=opaque"
    },
    publicBaseUrl: base
  }), /CSRF_ORIGIN_REQUIRED/);

  assert.throws(() => requireSameOriginForCookieMutationV010({
    method: "DELETE",
    headers: {
      cookie: "__Host-evo_session=opaque",
      origin: "https://evil.example"
    },
    publicBaseUrl: base
  }), /CSRF_ORIGIN_MISMATCH/);

  assert.doesNotThrow(() => requireSameOriginForCookieMutationV010({
    method: "POST",
    headers: {
      authorization: "Bearer external-agent-token",
      origin: "https://evil.example"
    },
    publicBaseUrl: base
  }));
});

test("authentication and CSRF failures expose stable HTTP semantics", () => {
  assert.deepEqual(
    requestAuthenticationHttpFailureV010(
      new Error("IDENTITY_AUTHENTICATION_PROVIDER_UNAVAILABLE")
    ),
    {
      status: 503,
      code: "AUTHENTICATION_UNAVAILABLE",
      message: "The configured authentication service is unavailable."
    }
  );
  assert.deepEqual(
    requestSecurityHttpFailureV010(new Error("CSRF_ORIGIN_MISMATCH")),
    {
      status: 403,
      code: "CSRF_REJECTED",
      message: "Cookie-authenticated state changes require the configured same-origin browser origin."
    }
  );
});
