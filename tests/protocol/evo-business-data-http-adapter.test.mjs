import test from "node:test";
import assert from "node:assert/strict";

import {
  createEvoBusinessDataHttpAdapterV010
} from "../../dist/manager/evo-business-data-http-adapter.js";
import {
  toEvoLedgerRuntimeApplicationIdBindingV010
} from "../../dist/contracts/evo-ledger-runtime-application-id.js";

const binding = {
  contractVersion: "0.1.0",
  bindingId: "binding:sales",
  enterpriseId: "enterprise:demo",
  applicationRef: "application:sales",
  runtimeKind: "EVO_APPLICATION_ANCHOR",
  runtimeProviderId: "evo-ledger-runtime",
  runtimeApplicationId: "sales-order-runtime"
};

function submission(applicationId) {
  return {
    contractVersion: "0.1.0",
    scopeKey: "EVO_DEMO",
    applicationId,
    businessDataType: "SALES_ORDER",
    businessObjectKey: "SO-1001",
    effectiveAt: "2026-10-03T00:00:00.000Z",
    payload: {
      orderNo: "SO-1001",
      quantity: 3,
      amount: "300.00"
    },
    correlationId: "corr-1001",
    idempotencyKey: "idem-1001"
  };
}

function successBody(overrides = {}) {
  return {
    contractVersion: "0.1.0",
    businessDataId: "bd-1",
    businessObjectVersion: "1",
    postingInputId: "pi-1",
    postingSequence: "42",
    postingStatus: "QUEUED",
    retroactive: false,
    replayRequired: false,
    idempotentReplay: false,
    ...overrides
  };
}

test("App Platform sends resolved runtimeApplicationId unchanged as EVO applicationId", async () => {
  const bridge = toEvoLedgerRuntimeApplicationIdBindingV010(binding);
  const calls = [];
  const adapter = createEvoBusinessDataHttpAdapterV010({
    baseUrl: "http://evo.test/",
    fetchImpl: async (url, init) => {
      calls.push({ url: String(url), init });
      return new Response(JSON.stringify(successBody()), {
        status: 202,
        headers: { "content-type": "application/json" }
      });
    }
  });

  const result = await adapter.submit(submission(bridge.applicationId));

  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, "http://evo.test/api/v1/business-data");
  const body = JSON.parse(calls[0].init.body);
  assert.equal(body.applicationId, binding.runtimeApplicationId);
  assert.equal(body.applicationId, bridge.applicationId);
  assert.equal(result.businessDataId, "bd-1");
  assert.equal(result.postingStatus, "QUEUED");
});

test("Host adapter preserves idempotency identity across retry", async () => {
  const bodies = [];
  let count = 0;
  const adapter = createEvoBusinessDataHttpAdapterV010({
    baseUrl: "http://evo.test",
    fetchImpl: async (_url, init) => {
      bodies.push(JSON.parse(init.body));
      count += 1;
      return new Response(JSON.stringify(successBody({
        idempotentReplay: count > 1
      })), {
        status: 202,
        headers: { "content-type": "application/json" }
      });
    }
  });

  const input = submission("sales-order-runtime");
  const first = await adapter.submit(input);
  const second = await adapter.submit(input);

  assert.equal(bodies[0].idempotencyKey, "idem-1001");
  assert.equal(bodies[1].idempotencyKey, "idem-1001");
  assert.deepEqual(bodies[0], bodies[1]);
  assert.equal(first.idempotentReplay, false);
  assert.equal(second.idempotentReplay, true);
});

test("Host adapter fails closed on malformed EVO response", async () => {
  const adapter = createEvoBusinessDataHttpAdapterV010({
    baseUrl: "http://evo.test",
    fetchImpl: async () => new Response(JSON.stringify({
      contractVersion: "0.1.0",
      businessDataId: "bd-1"
    }), {
      status: 202,
      headers: { "content-type": "application/json" }
    })
  });

  await assert.rejects(
    () => adapter.submit(submission("sales-order-runtime")),
    /EVO_BUSINESS_DATA_RESPONSE_INVALID/
  );
});

test("Host adapter surfaces EVO public error without private coupling", async () => {
  const adapter = createEvoBusinessDataHttpAdapterV010({
    baseUrl: "http://evo.test",
    fetchImpl: async () => new Response(JSON.stringify({
      error: {
        code: "APPLICATION_ANCHOR_NOT_FOUND",
        message: "Unknown applicationId."
      }
    }), {
      status: 400,
      headers: { "content-type": "application/json" }
    })
  });

  await assert.rejects(
    () => adapter.submit(submission("missing")),
    /APPLICATION_ANCHOR_NOT_FOUND: Unknown applicationId/
  );
});

// A02: lifecycle declarations must never substitute for the actual runtime result.
test("activated foundation capabilities do not make an unavailable external runtime executable", async () => {
  const { createPackageCatalog } = await import("../../dist/catalog/catalog.js");
  const { evoFoundationPackage, ledgerRuntimeConfiguratorPackage } = await import("../../dist/catalog/seed.js");
  const { createAppManagerService } = await import("../../dist/manager/service.js");
  const { createMemoryLifecycleStore } = await import("../../dist/manager/store.js");
  const { inspectPluginRuntimeV010 } = await import("../../dist/manager/plugin-runtime-host.js");
  const manager = createAppManagerService(
    createPackageCatalog([evoFoundationPackage, ledgerRuntimeConfiguratorPackage]),
    createMemoryLifecycleStore()
  );
  manager.install("evo-ledger-runtime-configurator");
  const snapshot = manager.getSnapshot();
  assert.ok(snapshot.effectiveCapabilities.includes("evo.ledger"));
  assert.ok(snapshot.installedPackages.some(pkg => pkg.packageId === "evo.core"));
  assert.equal(inspectPluginRuntimeV010(evoFoundationPackage).status, "READY");
  assert.deepEqual(manager.listEffectiveServiceProviders("evo.ledger"), []);

  for (const scenario of ["offline", "unavailable", "invalid-success"]) {
    let calls = 0;
    const adapter = createEvoBusinessDataHttpAdapterV010({
      baseUrl: "http://evo.test",
      fetchImpl: async () => {
        calls += 1;
        if (scenario === "offline") throw new Error("TEST_RUNTIME_OFFLINE");
        if (scenario === "unavailable") return new Response(JSON.stringify({
          error: { code: "RUNTIME_UNAVAILABLE", message: "Service unavailable" }
        }), { status: 503 });
        return new Response(JSON.stringify({ ready: true }), { status: 200 });
      }
    });
    await assert.rejects(() => adapter.submit(submission("sales-order-runtime")),
      scenario === "offline" ? /TEST_RUNTIME_OFFLINE/ :
        scenario === "unavailable" ? /RUNTIME_UNAVAILABLE/ : /EVO_BUSINESS_DATA_RESPONSE_INVALID/);
    assert.equal(calls, 1, "do not silently retry business writes");
    assert.deepEqual(manager.getSnapshot(), snapshot, "remote failure does not uninstall declared capabilities");
  }
});
