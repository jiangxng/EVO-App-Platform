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
