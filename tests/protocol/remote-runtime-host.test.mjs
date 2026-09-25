import test from "node:test";
import assert from "node:assert/strict";
import { generateKeyPairSync } from "node:crypto";
import { createServer } from "node:http";

import {
  createMemoryPluginIntegrityTrustStoreV010,
  createPluginIntegrityV010
} from "../../dist/manager/package-integrity.js";
import { createRemotePluginRuntimeHostV010 } from "../../dist/manager/plugin-runtime-remote.js";
import { createPluginRuntimeObservabilityV010 } from "../../dist/manager/plugin-runtime-observability.js";
import { validatePluginManifestV010 } from "../../dist/contracts/plugin-protocol.js";

const { publicKey, privateKey } = generateKeyPairSync("ed25519");
const publicKeyPem = publicKey.export({ type: "spki", format: "pem" });
const trustStore = createMemoryPluginIntegrityTrustStoreV010([{
  publisherId: "evo",
  keyId: "remote-release-1",
  algorithm: "Ed25519",
  publicKeyPem,
  status: "TRUSTED"
}]);

function remotePackage(endpoint, overrides = {}) {
  const pkg = {
    contractVersion: "0.1.0",
    packageId: "remote-plugin",
    displayName: "Remote Plugin",
    version: "0.1.0",
    type: "RUNTIME_EXTENSION",
    publisher: {
      id: "evo",
      displayName: "EVO",
      trust: "VERIFIED"
    },
    runtime: {
      kind: "REMOTE",
      isolation: "REMOTE",
      remote: {
        protocol: "EVO-REMOTE-RUNTIME-v0.1",
        endpoint,
        hostAccess: "NONE",
        auth: {
          scheme: "HOST_BEARER",
          audience: "evo.remote-plugin"
        }
      },
      limits: {
        invocationTimeoutMs: 120
      }
    },
    features: [{
      contractVersion: "0.1.0",
      featureId: "remote-plugin.default",
      packageId: "remote-plugin",
      version: "0.1.0",
      activationScope: "INSTALLATION",
      defaultActivation: true
    }],
    ...overrides
  };
  if (!Object.prototype.hasOwnProperty.call(overrides, "integrity")) {
    pkg.integrity = createPluginIntegrityV010(pkg, privateKey, {
      keyId: "remote-release-1",
      provenance: {
        type: "INTERNAL_CI",
        reference: "test://remote-runtime"
      }
    });
  }
  return pkg;
}

async function withServer(handler, run) {
  const server = createServer(handler);
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("TEST_SERVER_ADDRESS_MISSING");
  try {
    return await run(`http://127.0.0.1:${address.port}/invoke`);
  } finally {
    await new Promise(resolve => server.close(resolve));
  }
}

async function readJson(request) {
  const chunks = [];
  for await (const chunk of request) chunks.push(Buffer.from(chunk));
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

test("REMOTE adapter sends only explicit input with Host-injected bearer credentials", async () => {
  let observedAuthorization;
  let observedBody;

  await withServer(async (request, response) => {
    observedAuthorization = request.headers.authorization;
    observedBody = await readJson(request);
    response.writeHead(200, { "content-type": "application/json" });
    response.end(JSON.stringify({
      contractVersion: "0.1.0",
      protocol: "EVO-REMOTE-RUNTIME-v0.1",
      invocationId: observedBody.invocationId,
      packageId: "remote-plugin",
      ok: true,
      result: { echoed: observedBody.input }
    }));
  }, async endpoint => {
    const observability = createPluginRuntimeObservabilityV010();
    const host = createRemotePluginRuntimeHostV010({
      integrityTrustStore: trustStore,
      credentialProvider: {
        async getBearerToken(input) {
          assert.equal(input.audience, "evo.remote-plugin");
          assert.equal(input.packageId, "remote-plugin");
          return "short-lived-test-token";
        }
      },
      allowInsecureLoopback: true,
      onRuntimeEvent: event => observability.record(event)
    });

    const result = await host.invoke(remotePackage(endpoint), {
      method: "echo",
      input: { value: 9 }
    });

    assert.deepEqual(result, { echoed: { value: 9 } });
    assert.equal(observedAuthorization, "Bearer short-lived-test-token");
    assert.equal(observedBody.method, "echo");
    assert.deepEqual(observedBody.input, { value: 9 });
    assert.equal("storage" in observedBody, false);
    assert.equal("events" in observedBody, false);

    const diagnostics = observability.diagnostics("remote-plugin");
    assert.equal(diagnostics.invocations, 1);
    assert.equal(diagnostics.successes, 1);
    assert.equal(diagnostics.health, "healthy");
  });
});

test("REMOTE adapter rejects response correlation mismatch", async () => {
  await withServer(async (request, response) => {
    const body = await readJson(request);
    response.writeHead(200, { "content-type": "application/json" });
    response.end(JSON.stringify({
      contractVersion: "0.1.0",
      protocol: "EVO-REMOTE-RUNTIME-v0.1",
      invocationId: body.invocationId,
      packageId: "different-plugin",
      ok: true,
      result: {}
    }));
  }, async endpoint => {
    const host = createRemotePluginRuntimeHostV010({
      integrityTrustStore: trustStore,
      credentialProvider: { async getBearerToken() { return "token"; } },
      allowInsecureLoopback: true
    });

    await assert.rejects(
      host.invoke(remotePackage(endpoint), { method: "run", input: null }),
      /PLUGIN_REMOTE_RESPONSE_INVALID/
    );
  });
});

test("REMOTE adapter times out and records timeout diagnostics", async () => {
  await withServer(async (request, response) => {
    await readJson(request);
    await new Promise(resolve => setTimeout(resolve, 250));
    if (!response.destroyed) {
      response.writeHead(200, { "content-type": "application/json" });
      response.end("{}");
    }
  }, async endpoint => {
    const observability = createPluginRuntimeObservabilityV010();
    const host = createRemotePluginRuntimeHostV010({
      integrityTrustStore: trustStore,
      credentialProvider: { async getBearerToken() { return "token"; } },
      allowInsecureLoopback: true,
      defaultInvocationTimeoutMs: 50,
      onRuntimeEvent: event => observability.record(event)
    });
    const pkg = remotePackage(endpoint);
    pkg.runtime.limits.invocationTimeoutMs = 50;
    pkg.integrity = createPluginIntegrityV010(pkg, privateKey, {
      keyId: "remote-release-1"
    });

    await assert.rejects(
      host.invoke(pkg, { method: "slow", input: null }),
      /PLUGIN_REMOTE_TIMEOUT/
    );
    assert.equal(observability.diagnostics("remote-plugin").timeouts, 1);
  });
});

test("REMOTE adapter fails closed for untrusted publisher keys and empty credentials", async () => {
  await withServer(async (_request, response) => {
    response.writeHead(200, { "content-type": "application/json" });
    response.end("{}");
  }, async endpoint => {
    const untrustedHost = createRemotePluginRuntimeHostV010({
      integrityTrustStore: createMemoryPluginIntegrityTrustStoreV010(),
      credentialProvider: { async getBearerToken() { return "token"; } },
      allowInsecureLoopback: true
    });
    await assert.rejects(
      untrustedHost.invoke(remotePackage(endpoint), { method: "run", input: null }),
      /PLUGIN_REMOTE_INTEGRITY_REQUIRED/
    );

    const emptyCredentialHost = createRemotePluginRuntimeHostV010({
      integrityTrustStore: trustStore,
      credentialProvider: { async getBearerToken() { return " "; } },
      allowInsecureLoopback: true
    });
    await assert.rejects(
      emptyCredentialHost.invoke(remotePackage(endpoint), { method: "run", input: null }),
      /PLUGIN_REMOTE_CREDENTIAL_EMPTY/
    );
  });
});

test("Plugin Protocol requires HTTPS, signed REMOTE metadata and no direct Host storage/events", () => {
  const pkg = remotePackage("https://runtime.example.com/v1/invoke");
  assert.equal(validatePluginManifestV010(pkg).ok, true);

  const invalid = remotePackage("http://runtime.example.com/v1/invoke", {
    integrity: undefined,
    storage: { scope: "PACKAGE", quotaBytes: 1024 }
  });
  const result = validatePluginManifestV010(invalid);
  assert.equal(result.ok, false);
  assert.ok(result.issues.some(x => x.code === "PLUGIN_PROCESS_INTEGRITY_REQUIRED"));
  assert.ok(result.issues.some(x => x.code === "PLUGIN_REMOTE_HTTPS_REQUIRED"));
  assert.ok(result.issues.some(x => x.code === "PLUGIN_REMOTE_HOST_CAPABILITY_UNSUPPORTED"));
});
