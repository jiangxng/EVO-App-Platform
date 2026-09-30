import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  createJsonlManagedIdentitySessionEventStoreV010,
  createManagedIdentitySessionServiceV010,
  createMemoryManagedIdentitySessionEventStoreV010,
  hashIdentitySessionTokenV010
} from "../../dist/manager/identity-session-store.js";
import {
  clearIdentitySessionCookieV010,
  serializeIdentitySessionCookieV010,
  sessionTokenFromCookieHeaderV010
} from "../../dist/manager/session-cookie.js";
import {
  identitySessionRequestFromHeadersV010
} from "../../dist/manager/request-context.js";
import {
  createHostManagedSessionProviderV010
} from "../../dist/providers/managed-session/runtime.js";

const principal = {
  contractVersion: "0.1.0",
  subjectId: "alice",
  actorType: "HUMAN",
  identityProviderId: "test.oidc",
  displayName: "Alice"
};

test("managed Session issues opaque credential and persists only its hash", () => {
  const dir = mkdtempSync(join(tmpdir(), "evo-session-"));
  const path = join(dir, "sessions.jsonl");
  let id = 0;
  const service = createManagedIdentitySessionServiceV010({
    store: createJsonlManagedIdentitySessionEventStoreV010(path),
    now: () => new Date("2026-09-30T08:00:00.000Z"),
    token: () => "super-secret-session-token",
    id: () => String(++id)
  });

  const issued = service.issue({
    principal,
    ttlSeconds: 3600,
    assurance: ["OIDC", "PKCE"]
  });

  assert.equal(issued.token, "super-secret-session-token");
  assert.equal(issued.session.sessionId, "session:1");
  assert.equal(issued.session.principal.subjectId, "alice");
  assert.equal(issued.session.expiresAt, "2026-09-30T09:00:00.000Z");
  assert.equal(service.resolveToken(issued.token)?.sessionId, "session:1");

  const disk = readFileSync(path, "utf8");
  assert.equal(disk.includes("super-secret-session-token"), false);
  assert.equal(disk.includes(hashIdentitySessionTokenV010(issued.token)), true);
});

test("managed Session expiry and revocation fail closed", () => {
  let current = new Date("2026-09-30T08:00:00.000Z");
  let id = 0;
  const service = createManagedIdentitySessionServiceV010({
    store: createMemoryManagedIdentitySessionEventStoreV010(),
    now: () => current,
    token: () => "token-one",
    id: () => String(++id)
  });
  const issued = service.issue({ principal, ttlSeconds: 60 });

  assert.equal(service.resolveToken(issued.token)?.principal.subjectId, "alice");
  assert.equal(service.revoke(issued.session.sessionId, "LOGOUT"), true);
  assert.equal(service.resolveToken(issued.token), undefined);
  assert.equal(service.revoke(issued.session.sessionId, "REPEAT"), false);

  const expiring = createManagedIdentitySessionServiceV010({
    store: createMemoryManagedIdentitySessionEventStoreV010(),
    now: () => current,
    token: () => "token-expiring",
    id: () => "expiry"
  });
  const credential = expiring.issue({ principal, ttlSeconds: 10 });
  current = new Date("2026-09-30T08:00:11.000Z");
  assert.equal(expiring.resolveToken(credential.token), undefined);
});

test("managed Session rotation invalidates old credential before issuing replacement", () => {
  let tokenIndex = 0;
  let id = 0;
  const service = createManagedIdentitySessionServiceV010({
    store: createMemoryManagedIdentitySessionEventStoreV010(),
    now: () => new Date("2026-09-30T08:00:00.000Z"),
    token: () => ["old-token", "new-token"][tokenIndex++] ?? "unexpected-token",
    id: () => String(++id)
  });
  const oldCredential = service.issue({
    principal,
    ttlSeconds: 3600,
    assurance: ["OIDC"]
  });
  const replacement = service.rotate(oldCredential.token, 7200);

  assert.equal(replacement?.token, "new-token");
  assert.equal(service.resolveToken(oldCredential.token), undefined);
  assert.equal(service.resolveToken("new-token")?.principal.subjectId, "alice");
  assert.equal(
    service.get(oldCredential.session.sessionId)?.revokeReason,
    "ROTATED"
  );
});

test("managed Session reconstructs from append-only JSONL state", () => {
  const dir = mkdtempSync(join(tmpdir(), "evo-session-restart-"));
  const path = join(dir, "sessions.jsonl");
  let id = 0;
  const first = createManagedIdentitySessionServiceV010({
    store: createJsonlManagedIdentitySessionEventStoreV010(path),
    now: () => new Date("2026-09-30T08:00:00.000Z"),
    token: () => "restart-token",
    id: () => String(++id)
  });
  const credential = first.issue({ principal, ttlSeconds: 3600 });

  const restarted = createManagedIdentitySessionServiceV010({
    store: createJsonlManagedIdentitySessionEventStoreV010(path),
    now: () => new Date("2026-09-30T08:30:00.000Z")
  });
  assert.equal(
    restarted.resolveToken(credential.token)?.sessionId,
    credential.session.sessionId
  );
});

test("Host managed provider accepts opaque Cookie credential and ordinary bearer credential", () => {
  let id = 0;
  const service = createManagedIdentitySessionServiceV010({
    store: createMemoryManagedIdentitySessionEventStoreV010(),
    now: () => new Date("2026-09-30T08:00:00.000Z"),
    token: () => "browser-token",
    id: () => String(++id)
  });
  service.issue({ principal, ttlSeconds: 3600 });
  const provider = createHostManagedSessionProviderV010(service);

  assert.equal(provider.resolve({
    contractVersion: "0.1.0",
    sessionToken: "browser-token"
  })?.principal.subjectId, "alice");

  assert.equal(provider.resolve({
    contractVersion: "0.1.0",
    bearerToken: "browser-token"
  })?.principal.subjectId, "alice");

  assert.equal(provider.resolve({
    contractVersion: "0.1.0",
    sessionToken: "wrong"
  }), undefined);
});

test("request context extracts __Host cookie without exposing it as public sessionId", () => {
  const input = identitySessionRequestFromHeadersV010({
    cookie: "__Host-evo_session=browser-token; theme=dark",
    "x-evo-session-id": "display-session-id"
  });
  assert.equal(input.sessionToken, "browser-token");
  assert.equal(input.sessionId, "display-session-id");
  assert.equal(input.bearerToken, undefined);

  assert.throws(
    () => sessionTokenFromCookieHeaderV010({
      cookie: "__Host-evo_session=a; __Host-evo_session=b"
    }),
    /IDENTITY_SESSION_COOKIE_AMBIGUOUS/
  );
});

test("Session cookie is HttpOnly, host-scoped and SameSite=Lax", () => {
  const setCookie = serializeIdentitySessionCookieV010("opaque", {
    maxAgeSeconds: 3600
  });
  assert.match(setCookie, /^__Host-evo_session=opaque;/);
  assert.match(setCookie, /Path=\//);
  assert.match(setCookie, /HttpOnly/);
  assert.match(setCookie, /SameSite=Lax/);
  assert.match(setCookie, /Secure/);
  assert.match(setCookie, /Max-Age=3600/);
  assert.equal(/Domain=/i.test(setCookie), false);

  const clear = clearIdentitySessionCookieV010();
  assert.match(clear, /Max-Age=0/);
});
