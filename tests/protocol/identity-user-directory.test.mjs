import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  createFileIdentityUserDirectoryStoreV010,
  createMemoryIdentityUserDirectoryStoreV010
} from "../../dist/manager/identity-user-directory-store.js";
import {
  createHostIdentityUserDirectoryServiceV010
} from "../../dist/providers/identity-directory/runtime.js";

function principal(overrides = {}) {
  return {
    contractVersion: "0.1.0",
    subjectId: "alice",
    actorType: "HUMAN",
    identityProviderId: "generic.oidc",
    displayName: "Alice",
    claims: {
      email: "alice@example.com",
      emailVerified: true
    },
    ...overrides
  };
}

test("identity user directory records and refreshes bounded current Human Principal", () => {
  let now = new Date("2026-09-30T10:00:00.000Z");
  const service = createHostIdentityUserDirectoryServiceV010({
    store: createMemoryIdentityUserDirectoryStoreV010(),
    now: () => now
  });

  const first = service.recordAuthenticatedPrincipal(
    principal({ sessionId: "browser-session-1" })
  );
  assert.equal(first.state, "ACTIVE");
  assert.equal(first.firstAuthenticatedAt, "2026-09-30T10:00:00.000Z");
  assert.equal(first.lastAuthenticatedAt, "2026-09-30T10:00:00.000Z");
  assert.equal("sessionId" in first.principal && first.principal.sessionId, undefined);

  now = new Date("2026-09-30T11:00:00.000Z");
  const refreshed = service.recordAuthenticatedPrincipal(
    principal({ displayName: "Alice Updated", sessionId: "browser-session-2" })
  );
  assert.equal(refreshed.firstAuthenticatedAt, first.firstAuthenticatedAt);
  assert.equal(refreshed.lastAuthenticatedAt, "2026-09-30T11:00:00.000Z");
  assert.equal(refreshed.principal.displayName, "Alice Updated");
  assert.equal(service.provider.get("alice")?.principal.displayName, "Alice Updated");
  assert.equal(service.provider.list().length, 1);
});

test("identity user directory does not allow another IdP to seize an existing subject", () => {
  const service = createHostIdentityUserDirectoryServiceV010({
    store: createMemoryIdentityUserDirectoryStoreV010()
  });
  service.recordAuthenticatedPrincipal(principal());

  assert.throws(
    () => service.recordAuthenticatedPrincipal(
      principal({ identityProviderId: "other.oidc" })
    ),
    /IDENTITY_USER_DIRECTORY_PROVIDER_MISMATCH/
  );
});

test("revocation is terminal and successful re-authentication cannot self-reactivate", () => {
  let now = new Date("2026-09-30T10:00:00.000Z");
  const service = createHostIdentityUserDirectoryServiceV010({
    store: createMemoryIdentityUserDirectoryStoreV010(),
    now: () => now
  });
  service.recordAuthenticatedPrincipal(principal());

  now = new Date("2026-09-30T10:30:00.000Z");
  const revoked = service.revoke("alice", "admin-1");
  assert.equal(revoked.state, "REVOKED");
  assert.equal(revoked.revokedAt, "2026-09-30T10:30:00.000Z");
  assert.equal(revoked.revokedBySubjectId, "admin-1");

  now = new Date("2026-09-30T11:00:00.000Z");
  assert.throws(
    () => service.recordAuthenticatedPrincipal(principal()),
    /IDENTITY_USER_DIRECTORY_PRINCIPAL_REVOKED/
  );
  assert.equal(service.provider.get("alice")?.state, "REVOKED");
});

test("file identity directory survives restart without persisting browser Session credentials", () => {
  const dir = mkdtempSync(join(tmpdir(), "evo-user-directory-"));
  const path = join(dir, "identity-user-directory.json");
  const first = createHostIdentityUserDirectoryServiceV010({
    store: createFileIdentityUserDirectoryStoreV010(path),
    now: () => new Date("2026-09-30T10:00:00.000Z")
  });
  first.recordAuthenticatedPrincipal(
    principal({ sessionId: "must-not-persist" })
  );

  const restarted = createHostIdentityUserDirectoryServiceV010({
    store: createFileIdentityUserDirectoryStoreV010(path)
  });
  const current = restarted.provider.get("alice");
  assert.equal(current?.state, "ACTIVE");
  assert.equal(current?.principal.identityProviderId, "generic.oidc");
  assert.equal(current?.principal.sessionId, undefined);
});

test("directory rejects non-Human current principals", () => {
  const service = createHostIdentityUserDirectoryServiceV010({
    store: createMemoryIdentityUserDirectoryStoreV010()
  });
  assert.throws(
    () => service.recordAuthenticatedPrincipal(
      principal({ actorType: "SERVICE" })
    ),
    /IDENTITY_USER_DIRECTORY_PRINCIPAL_INVALID/
  );
});
