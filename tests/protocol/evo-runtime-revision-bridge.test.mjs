import test from "node:test";
import assert from "node:assert/strict";

import {
  createEvoRuntimeRevisionBridgeV010
} from "../../dist/manager/evo-runtime-revision-bridge.js";

test("EVO runtime revision bridge shares one conditional read per runtime enterprise", async () => {
  const requests = [];
  const changed = [];
  let revision = 1;

  const bridge = createEvoRuntimeRevisionBridgeV010({
    baseUrl: "https://evo.test",
    intervalMs: 60_000,
    fetchImpl: async (url, init = {}) => {
      const ifNoneMatch = new Headers(init.headers).get("if-none-match");
      requests.push({ url: String(url), ifNoneMatch });
      const etag = `"rev-${revision}"`;
      if (ifNoneMatch === etag) {
        return new Response(null, { status: 304, headers: { etag } });
      }
      return new Response(JSON.stringify({
        contractVersion: "0.1.0",
        enterpriseId: "runtime-enterprise",
        enterpriseCode: "EVO_CONFIG_MVP"
      }), {
        status: 200,
        headers: { "content-type": "application/json", etag }
      });
    },
    onChanged(event) {
      changed.push(event);
    }
  });

  const closeA = bridge.register([{
    connectionId: "a",
    contextId: "enterprise:a",
    enterpriseId: "a",
    evoEnterpriseCode: "EVO_CONFIG_MVP",
    resourceId: "eog:primary"
  }]);
  const closeB = bridge.register([{
    connectionId: "b",
    contextId: "enterprise:b",
    enterpriseId: "b",
    evoEnterpriseCode: "EVO_CONFIG_MVP",
    resourceId: "eog:primary"
  }]);

  // Let the initial registration poll settle, then reset evidence.
  await new Promise(resolve => setTimeout(resolve, 0));
  requests.length = 0;
  changed.length = 0;

  await bridge.pollNow();
  assert.equal(requests.length, 1);
  assert.equal(requests[0].ifNoneMatch, '"rev-1"');
  assert.equal(changed.length, 0);

  revision = 2;
  requests.length = 0;
  await bridge.pollNow();

  assert.equal(requests.length, 1);
  assert.equal(requests[0].ifNoneMatch, '"rev-1"');
  assert.deepEqual(
    changed.map(item => item.enterpriseId).sort(),
    ["a", "b"]
  );
  assert.ok(changed.every(item => item.etag === '"rev-2"'));

  closeA();
  closeB();
  requests.length = 0;
  await bridge.pollNow();
  assert.equal(requests.length, 0);

  bridge.dispose();
});

test("EVO runtime revision bridge fails closed on invalid revision responses", async () => {
  const errors = [];
  const changed = [];
  const bridge = createEvoRuntimeRevisionBridgeV010({
    baseUrl: "https://evo.test",
    intervalMs: 60_000,
    fetchImpl: async () => new Response(JSON.stringify({
      contractVersion: "0.1.0",
      enterpriseId: "runtime-enterprise",
      enterpriseCode: "WRONG"
    }), {
      status: 200,
      headers: { etag: '"bad"' }
    }),
    onChanged(event) {
      changed.push(event);
    },
    onError(input) {
      errors.push(String(input.error));
    }
  });

  const close = bridge.register([{
    connectionId: "a",
    contextId: "enterprise:a",
    enterpriseId: "a",
    evoEnterpriseCode: "EVO_CONFIG_MVP",
    resourceId: "eog:primary"
  }]);
  await new Promise(resolve => setTimeout(resolve, 0));

  assert.equal(changed.length, 0);
  assert.ok(errors.some(item => item.includes("EVO_RUNTIME_REVISION_RESPONSE_INVALID")));

  close();
  bridge.dispose();
});
