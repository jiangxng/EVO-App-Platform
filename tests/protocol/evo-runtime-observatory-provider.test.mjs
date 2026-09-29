import test from "node:test";
import assert from "node:assert/strict";
import {
  createEvoRuntimeObservatoryProviderV020
} from "../../dist/providers/evo-runtime-observatory/runtime.js";

function response(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" }
  });
}

test("EVO Runtime Observatory maps canonical Ledger targets into EOG Runtime Facts", async () => {
  const calls = [];
  const provider = createEvoRuntimeObservatoryProviderV020({
    baseUrl: "http://evo.test",
    resolveEnterpriseCode: id =>
      id === "enterprise:demo" ? "EVO_DEMO" : undefined,
    async fetchImpl(url, init) {
      calls.push({ url: String(url), init });
      if (String(url).includes("/api/v1/enterprises/")) {
        return response(200, { id: "uuid-enterprise" });
      }
      return response(200, {
        contractVersion: "0.1.0",
        observations: [
          {
            contractVersion: "0.1.0",
            enterpriseId: "uuid-enterprise",
            target: {
              kind: "LEDGER_DEFINITION",
              code: "pending-production"
            },
            metricCode: "event.frequency",
            kind: "RATE",
            unit: "events/hour",
            value: 12.5,
            sampleCount: 50,
            window: {
              startAt: "2026-09-28T08:00:00.000Z",
              endAt: "2026-09-28T12:00:00.000Z"
            },
            observedAt: "2026-09-28T12:00:01.000Z",
            source: {
              kind: "EVO_LEDGER_RUNTIME",
              ref: "ledger:pending-production"
            }
          },
          {
            contractVersion: "0.1.0",
            enterpriseId: "uuid-enterprise",
            target: {
              kind: "LEDGER_DEFINITION",
              code: "pending-production"
            },
            metricCode: "balance.quantity",
            kind: "QUANTITY",
            unit: "ledger-unit",
            value: 180,
            window: {
              startAt: "2026-09-28T08:00:00.000Z",
              endAt: "2026-09-28T12:00:00.000Z"
            },
            observedAt: "2026-09-28T12:00:01.000Z",
            source: {
              kind: "EVO_LEDGER_RUNTIME",
              ref: "ledger:pending-production"
            }
          }
        ]
      });
    }
  });

  const facts = await provider.query({
    contractVersion: "0.2.0",
    enterpriseId: "enterprise:demo",
    graphId: "eog:primary",
    window: {
      startAt: "2026-09-28T08:00:00.000Z",
      endAt: "2026-09-28T12:00:00.000Z"
    },
    semanticTargets: [
      {
        target: {
          kind: "NODE",
          nodeId: "ledger:wip"
        },
        node: {
          nodeId: "ledger:wip",
          kind: "LEDGER",
          semanticRef: {
            kind: "LEDGER_DEFINITION",
            authority: "EVO",
            refId: "ledger:pending-production"
          }
        }
      }
    ],
    metricCodes: ["event.frequency", "balance.quantity"]
  });

  assert.equal(calls.length, 2);
  assert.equal(facts.length, 2);
  assert.equal(facts[0].target.nodeId, "ledger:wip");
  assert.equal(facts[0].source.sourceKind, "EVO_RUNTIME");
  assert.deepEqual(
    facts.map(item => [item.metric.code, item.value]),
    [
      ["event.frequency", 12.5],
      ["balance.quantity", 180]
    ]
  );
});

test("EVO Runtime Observatory does not guess non-EVO or non-Ledger semantic bindings", async () => {
  let calls = 0;
  const provider = createEvoRuntimeObservatoryProviderV020({
    baseUrl: "http://evo.test",
    resolveEnterpriseCode: () => "EVO_DEMO",
    async fetchImpl(url) {
      calls += 1;
      if (String(url).includes("/api/v1/enterprises/")) {
        return response(200, { id: "uuid-enterprise" });
      }
      throw new Error("unexpected runtime observation call");
    }
  });

  const facts = await provider.query({
    contractVersion: "0.2.0",
    enterpriseId: "enterprise:demo",
    graphId: "eog:primary",
    window: {
      startAt: "2026-09-28T08:00:00.000Z",
      endAt: "2026-09-28T12:00:00.000Z"
    },
    semanticTargets: [
      {
        target: { kind: "NODE", nodeId: "app:sales" },
        node: {
          nodeId: "app:sales",
          kind: "APPLICATION",
          semanticRef: {
            kind: "APPLICATION",
            authority: "HOST",
            refId: "application:sales"
          }
        }
      }
    ],
    metricCodes: ["event.count"]
  });

  assert.equal(calls, 1);
  assert.deepEqual(facts, []);
});
