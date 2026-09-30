import test from "node:test";
import assert from "node:assert/strict";

import {
  configureGenericOidcProviderRuntimeV010,
  genericOidcClientSecretReferenceV010
} from "../../dist/providers/oidc/host-runtime.js";
import {
  GENERIC_OIDC_PROVIDER_ID
} from "../../dist/providers/oidc/package.js";
import {
  createProviderRuntimeRegistry
} from "../../dist/providers/runtime-registry.js";
import {
  createMemorySecretStoreV010
} from "../../dist/manager/secret-store.js";
import {
  createHostEncryptedSecretsProviderV010
} from "../../dist/providers/secrets/runtime.js";

function secrets() {
  return createHostEncryptedSecretsProviderV010(
    createMemorySecretStoreV010(
      () => new Date("2026-09-30T10:00:00.000Z")
    )
  );
}

test("OIDC Host runtime stays absent until issuer and clientId are both configured", async () => {
  const registry = createProviderRuntimeRegistry();

  const noIssuer = await configureGenericOidcProviderRuntimeV010({
    settings: {},
    registry
  });
  assert.equal(noIssuer.configured, false);
  assert.equal(noIssuer.reason, "ISSUER_REQUIRED");
  assert.equal(registry.has(GENERIC_OIDC_PROVIDER_ID), false);

  const noClient = await configureGenericOidcProviderRuntimeV010({
    settings: {
      issuer: "https://idp.example"
    },
    registry
  });
  assert.equal(noClient.configured, false);
  assert.equal(noClient.reason, "CLIENT_ID_REQUIRED");
  assert.equal(registry.has(GENERIC_OIDC_PROVIDER_ID), false);
});

test("OIDC Host runtime registers only from complete ordinary Settings", async () => {
  const registry = createProviderRuntimeRegistry();
  const result = await configureGenericOidcProviderRuntimeV010({
    settings: {
      issuer: "https://idp.example",
      clientId: "evo-client",
      scopes: "openid profile email"
    },
    registry
  });

  assert.deepEqual(result, {
    configured: true,
    providerId: GENERIC_OIDC_PROVIDER_ID,
    reason: "READY"
  });
  assert.equal(registry.has(GENERIC_OIDC_PROVIDER_ID), true);
  assert.equal(
    registry.get(GENERIC_OIDC_PROVIDER_ID)?.providerId,
    GENERIC_OIDC_PROVIDER_ID
  );
  assert.equal(registry.getHealth(GENERIC_OIDC_PROVIDER_ID).state, "UNKNOWN");
});

test("OIDC client secret is resolved only through Host Secrets metadata/value boundary", async () => {
  const registry = createProviderRuntimeRegistry();
  const secretProvider = secrets();
  const reference = genericOidcClientSecretReferenceV010();

  assert.equal((await secretProvider.describe(reference)).configured, false);
  await secretProvider.put(reference, "confidential-secret");
  assert.equal((await secretProvider.describe(reference)).configured, true);

  const result = await configureGenericOidcProviderRuntimeV010({
    settings: {
      issuer: "https://idp.example",
      clientId: "evo-client"
    },
    secrets: secretProvider,
    registry
  });

  assert.equal(result.configured, true);
  assert.equal(registry.has(GENERIC_OIDC_PROVIDER_ID), true);

  const health = registry.getHealth(GENERIC_OIDC_PROVIDER_ID);
  assert.equal(JSON.stringify(health).includes("confidential-secret"), false);
  assert.equal(JSON.stringify(result).includes("confidential-secret"), false);
});

test("OIDC runtime is removed immediately when required configuration becomes incomplete", async () => {
  const registry = createProviderRuntimeRegistry();

  await configureGenericOidcProviderRuntimeV010({
    settings: {
      issuer: "https://idp.example",
      clientId: "evo-client"
    },
    registry
  });
  assert.equal(registry.has(GENERIC_OIDC_PROVIDER_ID), true);

  const result = await configureGenericOidcProviderRuntimeV010({
    settings: {
      issuer: "https://idp.example"
    },
    registry
  });

  assert.equal(result.configured, false);
  assert.equal(result.reason, "CLIENT_ID_REQUIRED");
  assert.equal(registry.has(GENERIC_OIDC_PROVIDER_ID), false);
});

test("OIDC runtime registers an active health probe without probing during configuration", async () => {
  const registry = createProviderRuntimeRegistry();
  let requests = 0;
  const fetchImpl = async () => {
    requests += 1;
    return new Response(JSON.stringify({
      issuer: "https://idp.example",
      authorization_endpoint: "https://idp.example/authorize",
      token_endpoint: "https://idp.example/token",
      jwks_uri: "https://idp.example/jwks",
      response_types_supported: ["code"]
    }), {
      status: 200,
      headers: { "content-type": "application/json" }
    });
  };

  await configureGenericOidcProviderRuntimeV010({
    settings: {
      issuer: "https://idp.example",
      clientId: "evo-client"
    },
    registry,
    fetchImpl
  });

  assert.equal(requests, 0);
  const health = await registry.runHealthProbe(GENERIC_OIDC_PROVIDER_ID);
  assert.equal(requests, 1);
  assert.equal(health.state, "HEALTHY");
});
