import test from "node:test";
import assert from "node:assert/strict";

import { createPluginRuntimeObservabilityV010 } from "../../dist/manager/plugin-runtime-observability.js";

test("runtime observability keeps bounded structured events and aggregate diagnostics", () => {
  const store = createPluginRuntimeObservabilityV010(10);
  const at = "2026-09-25T00:00:00.000Z";
  store.record({ packageId: "p", type: "PROCESS_STARTING", occurredAt: at });
  store.record({ packageId: "p", type: "PROCESS_READY", occurredAt: at });
  store.record({ packageId: "p", type: "INVOCATION_STARTED", occurredAt: at, invocationId: "1", method: "run" });
  store.record({ packageId: "p", type: "INVOCATION_SUCCEEDED", occurredAt: at, invocationId: "1" });
  store.record({ packageId: "p", type: "PROCESS_STOPPED", occurredAt: at });

  const d = store.diagnostics("p");
  assert.equal(d.starts, 1);
  assert.equal(d.invocations, 1);
  assert.equal(d.successes, 1);
  assert.equal(d.health, "stopped");

  for (let i = 0; i < 20; i += 1) {
    store.record({ packageId: "p", type: "PROCESS_READY", occurredAt: at });
  }
  assert.equal(store.listEvents("p").length, 10);
});
