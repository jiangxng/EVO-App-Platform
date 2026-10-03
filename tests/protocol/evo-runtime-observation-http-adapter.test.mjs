import assert from "node:assert/strict";
import test from "node:test";

import {
  createEvoRuntimeObservationHttpAdapterV010
} from "../../dist/manager/evo-runtime-observation-http-adapter.js";

test("queries EVO runtime observations through the public Host adapter", async () => {
  let requestedUrl = "";
  let requestedBody = null;
  const adapter = createEvoRuntimeObservationHttpAdapterV010({
    baseUrl: "http://evo.test/",
    fetchImpl: async (url, init) => {
      requestedUrl = String(url);
      requestedBody = JSON.parse(String(init?.body));
      return new Response(JSON.stringify({
        observations: [{
          contractVersion: "0.1.0",
          enterpriseId: "enterprise-1",
          target: { kind: "APPLICATION_ANCHOR", applicationId: "sales_order" },
          metricCode: "event.count",
          kind: "COUNT",
          unit: "event",
          value: 1,
          window: {
            startAt: "2026-10-03T01:59:00.000Z",
            endAt: "2026-10-03T02:01:00.000Z"
          },
          observedAt: "2026-10-03T02:01:00.000Z",
          source: { kind: "EVO_APPLICATION_RUNTIME", ref: "sales_order" }
        }]
      }), { status: 200, headers: { "content-type": "application/json" } });
    }
  });

  const result = await adapter.query({
    contractVersion: "0.1.0",
    enterpriseId: "enterprise-1",
    target: { kind: "APPLICATION_ANCHOR", applicationId: "sales_order" },
    window: {
      startAt: "2026-10-03T01:59:00.000Z",
      endAt: "2026-10-03T02:01:00.000Z"
    },
    metricCodes: ["event.count"]
  });

  assert.equal(requestedUrl, "http://evo.test/api/v1/runtime-observations/query");
  assert.equal(requestedBody.target.applicationId, "sales_order");
  assert.equal(result.observations[0].metricCode, "event.count");
  assert.equal(result.observations[0].value, 1);
});

test("fails closed on malformed EVO observation response", async () => {
  const adapter = createEvoRuntimeObservationHttpAdapterV010({
    baseUrl: "http://evo.test",
    fetchImpl: async () => new Response(JSON.stringify({ observations: [{}] }), {
      status: 200,
      headers: { "content-type": "application/json" }
    })
  });

  await assert.rejects(
    () => adapter.query({
      contractVersion: "0.1.0",
      enterpriseId: "enterprise-1",
      target: { kind: "APPLICATION_ANCHOR", applicationId: "sales_order" },
      window: {
        startAt: "2026-10-03T01:59:00.000Z",
        endAt: "2026-10-03T02:01:00.000Z"
      },
      metricCodes: ["event.count"]
    }),
    /EVO_RUNTIME_OBSERVATION_RESPONSE_INVALID/
  );
});
