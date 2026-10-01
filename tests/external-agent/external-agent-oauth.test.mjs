import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";

import { createPackageCatalog } from "../../dist/catalog/catalog.js";
import {
  EXTERNAL_AGENT_OAUTH_OFFLINE_SCOPE,
  EXTERNAL_AGENT_OAUTH_SCOPE
} from "../../dist/contracts/external-agent-oauth.js";
import {
  createMemoryExternalAgentGovernanceStoreV010
} from "../../dist/manager/external-agent-governance-store.js";
import {
  createMemoryExternalAgentOAuthStoreV010
} from "../../dist/manager/external-agent-oauth-store.js";
import {
  createExternalAgentOAuthServiceV010,
  redirectUriMatchesRegistrationV010
} from "../../dist/manager/external-agent-oauth-service.js";
import { createAppManagerService } from "../../dist/manager/service.js";
import { createMemoryLifecycleStore } from "../../dist/manager/store.js";

const resource = "https://evo.example/mcp";
const issuer = "https://evo.example";
const oauthClientId = "https://client.example/mcp-client.json";
const redirectUri = "https://client.example/callback";

function capabilityOperation() {
  return {
    kind: "platform.capability-operation",
    operation: {
      contractVersion: "0.1.0",
      operationId: "sample.read",
      capability: "sample",
      operationVersion: "1.0.0",
      title: "Sample read",
      description: "OAuth delegated authority fixture.",
      effect: "READ",
      dataScope: "ENTERPRISE",
      authorization: {
        action: "sample.read",
        resource: {
          type: "sample",
          idSource: "DATA_SCOPE"
        }
      },
      inputSchema: {
        type: "object",
        additionalProperties: false,
        properties: {}
      },
      outputSchema: { type: "object" },
      binding: {
        type: "ACTION_HOST",
        commandCode: "sample.read",
        inputVersion: "0.1.0"
      },
      exposure: ["HUMAN", "EXTERNAL_AGENT"]
    }
  };
}

function manager() {
  const pkg = {
    contractVersion: "0.1.0",
    packageId: "sample-plugin",
    displayName: "Sample Plugin",
    version: "0.1.0",
    type: "APPLICATION",
    features: [{
      contractVersion: "0.1.0",
      featureId: "sample-plugin.default",
      packageId: "sample-plugin",
      version: "0.1.0",
      activationScope: "INSTALLATION",
      defaultActivation: true,
      providesCapabilities: ["sample"],
      contributions: [capabilityOperation()]
    }]
  };
  const service = createAppManagerService(
    createPackageCatalog([pkg]),
    createMemoryLifecycleStore()
  );
  service.install(pkg.packageId);
  return service;
}

function governanceStore() {
  return createMemoryExternalAgentGovernanceStoreV010({
    contractVersion: "0.1.0",
    agents: [{
      contractVersion: "0.1.0",
      agentId: "agent-1",
      displayName: "Reference Agent",
      trustLevel: "REGISTERED",
      state: "ACTIVE",
      createdAt: "2026-09-30T09:00:00.000Z",
      createdBySubjectId: "human-1"
    }],
    clients: [{
      contractVersion: "0.1.0",
      clientId: "client-1",
      agentId: "agent-1",
      displayName: "Reference MCP Client",
      kind: "PUBLIC",
      protocols: ["MCP"],
      oauthClientId,
      state: "ACTIVE",
      createdAt: "2026-09-30T09:05:00.000Z",
      createdBySubjectId: "human-1"
    }],
    grants: [{
      contractVersion: "0.1.0",
      grantId: "grant-1",
      agentId: "agent-1",
      clientId: "client-1",
      authorizingPrincipalSubjectId: "human-1",
      contextId: "enterprise:ent-1",
      allowedOperationIds: ["sample.read"],
      effectConstraints: ["READ"],
      state: "ACTIVE",
      validFrom: "2026-09-30T10:00:00.000Z",
      validUntil: "2026-10-01T10:00:00.000Z",
      createdAt: "2026-09-30T10:00:00.000Z",
      createdBySubjectId: "human-1"
    }],
    events: []
  });
}

function mutableAuthorities() {
  const state = {
    humanState: "ACTIVE",
    membershipActive: true,
    policyAllowed: true
  };
  const principal = {
    contractVersion: "0.1.0",
    subjectId: "human-1",
    actorType: "HUMAN",
    identityProviderId: "generic.oidc",
    displayName: "Current Human"
  };
  return {
    state,
    principal,
    identityDirectory: {
      providerId: "test.identity-directory",
      get(subjectId) {
        if (subjectId !== "human-1") return undefined;
        return {
          contractVersion: "0.1.0",
          principal: structuredClone(principal),
          state: state.humanState,
          firstSeenAt: "2026-09-29T10:00:00.000Z",
          lastAuthenticatedAt: "2026-09-30T09:30:00.000Z",
          updatedAt: "2026-09-30T09:30:00.000Z",
          ...(state.humanState === "DISABLED"
            ? {
                disabledAt: "2026-09-30T11:10:00.000Z",
                disabledBySubjectId: "admin-1"
              }
            : {})
        };
      },
      list() {
        const item = this.get("human-1");
        return item ? [item] : [];
      }
    },
    enterpriseDirectory: {
      providerId: "test.enterprise-directory",
      list() {
        return [{
          contractVersion: "0.1.0",
          enterpriseId: "ent-1",
          enterpriseProviderId: "test.enterprise-directory",
          contextId: "enterprise:ent-1",
          kind: "ENTERPRISE",
          lifecycleState: "ACTIVE",
          displayName: "Enterprise 1"
        }];
      }
    },
    enterpriseGrants: {
      providerId: "test.enterprise-grants",
      listForPrincipal(currentPrincipal) {
        if (
          currentPrincipal.subjectId !== "human-1"
          || !state.membershipActive
        ) {
          return [];
        }
        return [{
          contractVersion: "0.1.0",
          grantId: "membership-1",
          subjectId: "human-1",
          contextId: "enterprise:ent-1",
          state: "ACTIVE"
        }];
      }
    },
    authorizationProvider: {
      providerId: "test.authorization",
      check() {
        return {
          contractVersion: "0.1.0",
          allowed: state.policyAllowed,
          policyProviderId: "test.authorization",
          reasonCodes: [state.policyAllowed ? "TEST_ALLOW" : "TEST_DENY"]
        };
      }
    }
  };
}

function clientMetadataDocument(overrides = {}) {
  return {
    client_id: oauthClientId,
    client_name: "Reference MCP Client",
    redirect_uris: [redirectUri],
    grant_types: ["authorization_code", "refresh_token"],
    response_types: ["code"],
    token_endpoint_auth_method: "none",
    ...overrides
  };
}

function requestContext(principal) {
  return {
    contractVersion: "0.1.0",
    principal: structuredClone(principal),
    scope: {
      contractVersion: "0.1.0",
      enterpriseId: "ent-1",
      userId: principal.subjectId
    },
    context: {
      contractVersion: "0.1.0",
      activeContext: {
        contractVersion: "0.1.0",
        contextId: "enterprise:ent-1",
        kind: "ENTERPRISE",
        enterpriseId: "ent-1"
      },
      enterpriseContext: {
        contractVersion: "0.1.0",
        contextId: "enterprise:ent-1",
        kind: "ENTERPRISE",
        enterpriseId: "ent-1",
        displayName: "Enterprise 1"
      }
    },
    correlationId: "human-corr"
  };
}

function pkceChallenge(verifier) {
  return createHash("sha256")
    .update(verifier, "ascii")
    .digest("base64url");
}

function fixture() {
  const governance = governanceStore();
  const authorities = mutableAuthorities();
  const oauthStore = createMemoryExternalAgentOAuthStoreV010();
  const appManager = manager();
  const time = {
    now: new Date("2026-09-30T11:00:00.000Z")
  };
  let randomSeed = 0;
  let idSeed = 0;
  let metadata = clientMetadataDocument();

  const delegatedAuthority = {
    store: governance,
    manager: appManager,
    identityDirectory: authorities.identityDirectory,
    enterpriseDirectory: authorities.enterpriseDirectory,
    enterpriseGrants: authorities.enterpriseGrants,
    authorizationProvider: authorities.authorizationProvider,
    now: () => new Date(time.now)
  };

  const service = createExternalAgentOAuthServiceV010({
    store: oauthStore,
    governanceStore: governance,
    delegatedAuthority,
    resourceIdentifier: resource,
    authorizationServerIssuer: issuer,
    resourceName: "EVO Test Agent Access",
    now: () => new Date(time.now),
    randomBytesImpl(size) {
      randomSeed += 1;
      return Buffer.alloc(size, randomSeed);
    },
    id() {
      idSeed += 1;
      return String(idSeed).padStart(4, "0");
    },
    fetchImpl: async url => {
      assert.equal(String(url), oauthClientId);
      return new Response(JSON.stringify(metadata), {
        status: 200,
        headers: { "content-type": "application/json" }
      });
    }
  });

  return {
    governance,
    authorities,
    oauthStore,
    appManager,
    time,
    service,
    setClientMetadata(next) {
      metadata = next;
    },
    delegatedAuthority
  };
}

async function issueCode(f, {
  scopes = [EXTERNAL_AGENT_OAUTH_SCOPE, EXTERNAL_AGENT_OAUTH_OFFLINE_SCOPE],
  verifier = "a".repeat(64)
} = {}) {
  return f.service.issueAuthorizationCode({
    requestContext: requestContext(f.authorities.principal),
    grantId: "grant-1",
    oauthClientId,
    redirectUri,
    resource,
    scopes,
    codeChallenge: pkceChallenge(verifier),
    codeChallengeMethod: "S256",
    correlationId: "issue-corr"
  });
}

test("native loopback redirect matching permits only the runtime port to vary", () => {
  assert.equal(
    redirectUriMatchesRegistrationV010(
      "http://127.0.0.1/callback",
      "http://127.0.0.1:53421/callback"
    ),
    true
  );
  assert.equal(
    redirectUriMatchesRegistrationV010(
      "http://127.0.0.1:43100/callback?channel=oauth",
      "http://127.0.0.1:53421/callback?channel=oauth"
    ),
    true
  );
  assert.equal(
    redirectUriMatchesRegistrationV010(
      "http://[::1]/callback",
      "http://[::1]:53421/callback"
    ),
    true
  );
  assert.equal(
    redirectUriMatchesRegistrationV010(
      "http://127.0.0.1/callback",
      "http://localhost:53421/callback"
    ),
    false
  );
  assert.equal(
    redirectUriMatchesRegistrationV010(
      "http://127.0.0.1/callback",
      "http://127.0.0.1:53421/other"
    ),
    false
  );
  assert.equal(
    redirectUriMatchesRegistrationV010(
      "http://127.0.0.1/callback?channel=oauth",
      "http://127.0.0.1:53421/callback?channel=other"
    ),
    false
  );
  assert.equal(
    redirectUriMatchesRegistrationV010(
      "http://localhost:43100/callback",
      "http://localhost:53421/callback"
    ),
    false
  );
  assert.equal(
    redirectUriMatchesRegistrationV010(
      "https://client.example:43100/callback",
      "https://client.example:53421/callback"
    ),
    false
  );
});

test("OAuth service accepts an RFC 8252 ephemeral port for registered loopback IP redirect", async () => {
  const f = fixture();
  const verifier = "n".repeat(64);
  const registered = "http://127.0.0.1/callback";
  const requested = "http://127.0.0.1:53421/callback";

  f.setClientMetadata(clientMetadataDocument({
    redirect_uris: [registered]
  }));

  const issued = await f.service.issueAuthorizationCode({
    requestContext: requestContext(f.authorities.principal),
    grantId: "grant-1",
    oauthClientId,
    redirectUri: requested,
    resource,
    scopes: [EXTERNAL_AGENT_OAUTH_SCOPE],
    codeChallenge: pkceChallenge(verifier),
    codeChallengeMethod: "S256",
    correlationId: "native-loopback"
  });

  assert.equal(issued.redirectUri, requested);
  assert.equal(
    f.oauthStore.snapshot().authorizationCodes[0].redirectUri,
    requested
  );

  await assert.rejects(
    () => f.service.issueAuthorizationCode({
      requestContext: requestContext(f.authorities.principal),
      grantId: "grant-1",
      oauthClientId,
      redirectUri: "http://127.0.0.1:53421/other",
      resource,
      scopes: [EXTERNAL_AGENT_OAUTH_SCOPE],
      codeChallenge: pkceChallenge(verifier),
      codeChallengeMethod: "S256",
      correlationId: "native-loopback-wrong-path"
    }),
    /EXTERNAL_AGENT_OAUTH_REDIRECT_URI_NOT_REGISTERED/
  );
});

test("OAuth metadata is resource-bound and CIMD-first", () => {
  const f = fixture();
  assert.deepEqual(f.service.protectedResourceMetadata(), {
    resource,
    authorization_servers: [issuer],
    scopes_supported: [
      EXTERNAL_AGENT_OAUTH_SCOPE,
      EXTERNAL_AGENT_OAUTH_OFFLINE_SCOPE
    ],
    bearer_methods_supported: ["header"],
    resource_name: "EVO Test Agent Access"
  });
  assert.equal(
    f.service.authorizationServerMetadata()
      .client_id_metadata_document_supported,
    true
  );
  assert.equal(
    f.service.authorizationServerMetadata()
      .authorization_response_iss_parameter_supported,
    true
  );
  assert.deepEqual(
    f.service.authorizationServerMetadata().protected_resources,
    [resource]
  );
  assert.deepEqual(
    f.service.authorizationServerMetadata().code_challenge_methods_supported,
    ["S256"]
  );
});

test("CIMD can be validated before an internal governance registration exists", async () => {
  const f = fixture();
  const metadata = await f.service.inspectClientMetadata(oauthClientId);
  assert.equal(metadata.client_id, oauthClientId);
  assert.equal(metadata.client_name, "Reference MCP Client");
  assert.deepEqual(metadata.redirect_uris, [redirectUri]);
});

test("CIMD document must match registered OAuth client identity and redirect URI", async () => {
  const f = fixture();
  const resolved = await f.service.resolveClientMetadata(oauthClientId);
  assert.equal(resolved.registration.clientId, "client-1");
  assert.equal(resolved.metadata.client_id, oauthClientId);

  f.setClientMetadata(clientMetadataDocument({
    client_id: "https://other.example/client.json"
  }));
  await assert.rejects(
    () => f.service.resolveClientMetadata(oauthClientId),
    /EXTERNAL_AGENT_OAUTH_CLIENT_METADATA_ID_MISMATCH/
  );
});

test("authorization code stores only hash and exchanges with PKCE S256 into bounded tokens", async () => {
  const f = fixture();
  const verifier = "b".repeat(64);
  const issued = await issueCode(f, { verifier });

  const afterIssue = f.oauthStore.snapshot();
  assert.equal(afterIssue.authorizationCodes.length, 1);
  assert.equal(
    JSON.stringify(afterIssue).includes(issued.code),
    false
  );
  assert.equal(
    afterIssue.authorizationCodes[0].codeChallenge,
    pkceChallenge(verifier)
  );

  const token = await f.service.exchangeAuthorizationCode({
    code: issued.code,
    oauthClientId,
    redirectUri,
    resource,
    codeVerifier: verifier,
    correlationId: "exchange-corr"
  });

  assert.match(token.access_token, /^evo_at_/);
  assert.match(token.refresh_token, /^evo_rt_/);
  assert.equal(token.token_type, "Bearer");
  assert.match(token.scope, /evo\.capabilities/);

  const snapshot = f.oauthStore.snapshot();
  assert.equal(snapshot.authorizationCodes[0].consumedAt !== undefined, true);
  assert.equal(snapshot.accessTokens.length, 1);
  assert.equal(snapshot.refreshTokens.length, 1);
  assert.equal(JSON.stringify(snapshot).includes(token.access_token), false);
  assert.equal(JSON.stringify(snapshot).includes(token.refresh_token), false);

  const access = await f.service.resolveAccessToken(
    token.access_token,
    resource,
    "resolve-corr"
  );
  assert.deepEqual(access.operationIds, ["sample.read"]);
  assert.equal(access.grantId, "grant-1");
  assert.equal(access.clientId, "client-1");
});

test("authorization code is one-time and wrong PKCE fails without consuming it", async () => {
  const f = fixture();
  const verifier = "c".repeat(64);
  const issued = await issueCode(f, { verifier });

  await assert.rejects(
    () => f.service.exchangeAuthorizationCode({
      code: issued.code,
      oauthClientId,
      redirectUri,
      resource,
      codeVerifier: "d".repeat(64),
      correlationId: "bad-pkce"
    }),
    /EXTERNAL_AGENT_OAUTH_PKCE_VERIFICATION_FAILED/
  );
  assert.equal(
    f.oauthStore.snapshot().authorizationCodes[0].consumedAt,
    undefined
  );

  await f.service.exchangeAuthorizationCode({
    code: issued.code,
    oauthClientId,
    redirectUri,
    resource,
    codeVerifier: verifier,
    correlationId: "good-pkce"
  });

  await assert.rejects(
    () => f.service.exchangeAuthorizationCode({
      code: issued.code,
      oauthClientId,
      redirectUri,
      resource,
      codeVerifier: verifier,
      correlationId: "replay"
    }),
    /EXTERNAL_AGENT_OAUTH_CODE_ALREADY_USED/
  );
});

test("resource indicator binds code, access token and refresh token", async () => {
  const f = fixture();
  const verifier = "e".repeat(64);
  const issued = await issueCode(f, { verifier });
  const token = await f.service.exchangeAuthorizationCode({
    code: issued.code,
    oauthClientId,
    redirectUri,
    resource,
    codeVerifier: verifier,
    correlationId: "resource-exchange"
  });

  await assert.rejects(
    () => f.service.resolveAccessToken(
      token.access_token,
      "https://other.example/mcp",
      "wrong-resource"
    ),
    /EXTERNAL_AGENT_OAUTH_RESOURCE_MISMATCH/
  );
  await assert.rejects(
    () => f.service.refreshAccessToken({
      refreshToken: token.refresh_token,
      oauthClientId,
      resource: "https://other.example/mcp",
      correlationId: "wrong-resource-refresh"
    }),
    /EXTERNAL_AGENT_OAUTH_RESOURCE_MISMATCH/
  );
});

test("refresh token rotates once and replay is rejected", async () => {
  const f = fixture();
  const verifier = "f".repeat(64);
  const issued = await issueCode(f, { verifier });
  const first = await f.service.exchangeAuthorizationCode({
    code: issued.code,
    oauthClientId,
    redirectUri,
    resource,
    codeVerifier: verifier,
    correlationId: "initial"
  });

  const second = await f.service.refreshAccessToken({
    refreshToken: first.refresh_token,
    oauthClientId,
    resource,
    correlationId: "refresh-1"
  });
  assert.match(second.access_token, /^evo_at_/);
  assert.match(second.refresh_token, /^evo_rt_/);
  assert.notEqual(second.refresh_token, first.refresh_token);

  await assert.rejects(
    () => f.service.refreshAccessToken({
      refreshToken: first.refresh_token,
      oauthClientId,
      resource,
      correlationId: "refresh-replay"
    }),
    /EXTERNAL_AGENT_OAUTH_REFRESH_TOKEN_REPLAY/
  );

  const old = f.oauthStore.snapshot().refreshTokens[0];
  assert.equal(old.consumedAt !== undefined, true);
  assert.equal(old.replacedByRefreshTokenId !== undefined, true);
});

test("existing access token loses authority immediately after policy or Human state changes", async () => {
  const f = fixture();
  const verifier = "g".repeat(64);
  const issued = await issueCode(f, { verifier });
  const token = await f.service.exchangeAuthorizationCode({
    code: issued.code,
    oauthClientId,
    redirectUri,
    resource,
    codeVerifier: verifier,
    correlationId: "dynamic"
  });

  f.authorities.state.policyAllowed = false;
  await assert.rejects(
    () => f.service.resolveAccessToken(
      token.access_token,
      resource,
      "policy-denied"
    ),
    /EXTERNAL_AGENT_OAUTH_NO_EFFECTIVE_OPERATIONS/
  );

  f.authorities.state.policyAllowed = true;
  f.authorities.state.humanState = "DISABLED";
  await assert.rejects(
    () => f.service.resolveAccessToken(
      token.access_token,
      resource,
      "human-disabled"
    ),
    /EXTERNAL_AGENT_OAUTH_DELEGATED_AUTHORITY_INACTIVE:AUTHORIZING_PRINCIPAL_NOT_ACTIVE/
  );
});

test("plugin deactivation invalidates an already-issued access token", async () => {
  const f = fixture();
  const verifier = "h".repeat(64);
  const issued = await issueCode(f, { verifier });
  const token = await f.service.exchangeAuthorizationCode({
    code: issued.code,
    oauthClientId,
    redirectUri,
    resource,
    codeVerifier: verifier,
    correlationId: "plugin"
  });

  f.appManager.disable("sample-plugin");
  await assert.rejects(
    () => f.service.resolveAccessToken(
      token.access_token,
      resource,
      "plugin-disabled"
    ),
    /EXTERNAL_AGENT_OAUTH_NO_EFFECTIVE_OPERATIONS/
  );
});

test("revocation stores no raw token and stops access immediately", async () => {
  const f = fixture();
  const verifier = "i".repeat(64);
  const issued = await issueCode(f, { verifier });
  const token = await f.service.exchangeAuthorizationCode({
    code: issued.code,
    oauthClientId,
    redirectUri,
    resource,
    codeVerifier: verifier,
    correlationId: "revoke"
  });

  f.service.revokeToken(token.access_token);
  await assert.rejects(
    () => f.service.resolveAccessToken(
      token.access_token,
      resource,
      "revoked"
    ),
    /EXTERNAL_AGENT_OAUTH_ACCESS_TOKEN_REVOKED/
  );
  assert.equal(
    JSON.stringify(f.oauthStore.snapshot()).includes(token.access_token),
    false
  );
});

test("authorization issue requires current authorizing Human and matching Context", async () => {
  const f = fixture();
  const verifier = "j".repeat(64);

  const wrongHuman = {
    ...requestContext(f.authorities.principal),
    principal: {
      ...f.authorities.principal,
      subjectId: "human-2"
    }
  };
  await assert.rejects(
    () => f.service.issueAuthorizationCode({
      requestContext: wrongHuman,
      grantId: "grant-1",
      oauthClientId,
      redirectUri,
      resource,
      scopes: [EXTERNAL_AGENT_OAUTH_SCOPE],
      codeChallenge: pkceChallenge(verifier),
      codeChallengeMethod: "S256",
      correlationId: "wrong-human"
    }),
    /EXTERNAL_AGENT_OAUTH_AUTHORIZING_HUMAN_MISMATCH/
  );

  const wrongContext = requestContext(f.authorities.principal);
  wrongContext.context.activeContext.contextId = "enterprise:other";
  await assert.rejects(
    () => f.service.issueAuthorizationCode({
      requestContext: wrongContext,
      grantId: "grant-1",
      oauthClientId,
      redirectUri,
      resource,
      scopes: [EXTERNAL_AGENT_OAUTH_SCOPE],
      codeChallenge: pkceChallenge(verifier),
      codeChallengeMethod: "S256",
      correlationId: "wrong-context"
    }),
    /EXTERNAL_AGENT_OAUTH_CONTEXT_MISMATCH/
  );
});
