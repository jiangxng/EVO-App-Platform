import test from "node:test";
import assert from "node:assert/strict";
import {
  createMemoryEnterpriseOperatingGraphStoreV010
} from "../../dist/manager/enterprise-operating-graph-store.js";
import {
  createEnterpriseOperatingGraphHostServiceV010
} from "../../dist/manager/enterprise-operating-graph-service.js";
import {
  createMemoryEogExpectedSopStoreV010
} from "../../dist/manager/enterprise-operating-graph-sop-store.js";
import {
  createEogExpectedSopServiceV010
} from "../../dist/manager/enterprise-operating-graph-sop-service.js";
import {
  createEogBottleneckAnalysisProviderV020
} from "../../dist/providers/eog-bottleneck-analysis/runtime.js";

function graphService() {
  let id = 0;
  const service = createEnterpriseOperatingGraphHostServiceV010({
    store: createMemoryEnterpriseOperatingGraphStoreV010(),
    id: () => String(++id),
    now: () => new Date("2026-09-29T00:00:00.000Z")
  });
  let graph = service.create({
    enterpriseId: "enterprise:demo",
    graphId: "eog:primary"
  });
  for (const [nodeId, refId] of [
    ["app:sales", "application:sales"],
    ["app:approval", "application:approval"],
    ["app:shipping", "application:shipping"]
  ]) {
    graph = service.apply({
      enterpriseId: graph.enterpriseId,
      graphId: graph.graphId,
      expectedRevision: graph.revision,
      actor: { type: "AGENT", subjectId: "agent:1" },
      mutation: {
        type: "NODE_BIND",
        node: {
          nodeId,
          kind: "APPLICATION",
          semanticRef: {
            kind: "APPLICATION",
            authority: "HOST",
            refId
          }
        }
      }
    });
  }
  return service;
}

function transitionFact(id, fromNodeId, toNodeId, value = 1) {
  const window = {
    startAt: "2026-09-29T00:00:00.000Z",
    endAt: "2026-09-29T04:00:00.000Z"
  };
  return {
    contractVersion: "0.2.0",
    factId: id,
    enterpriseId: "enterprise:demo",
    graphId: "eog:primary",
    target: { kind: "NODE", nodeId: fromNodeId },
    metric: {
      code: "sop.transition.count",
      kind: "COUNT",
      unit: "transitions"
    },
    window,
    value,
    sampleCount: value,
    dimensions: {
      toApplicationNodeId: toNodeId,
      fromStepCode: "from",
      toStepCode: "to"
    },
    observedAt: window.endAt,
    source: {
      providerId: "evo.runtime-observatory",
      sourceKind: "EVO_RUNTIME",
      sourceRef: "runtime-traces"
    }
  };
}

test("Draft expected SOP does not become analysis truth", async () => {
  const graphs = graphService();
  const sops = createEogExpectedSopServiceV010({
    store: createMemoryEogExpectedSopStoreV010(),
    graphService: graphs,
    now: () => new Date("2026-09-29T01:00:00.000Z")
  });
  sops.create({
    enterpriseId: "enterprise:demo",
    graphId: "eog:primary",
    sopId: "sop:o2c",
    title: "Order to cash",
    applicationNodeIds: [
      "app:sales",
      "app:approval",
      "app:shipping"
    ]
  });

  const provider = createEogBottleneckAnalysisProviderV020({
    expectedSopService: sops
  });
  const overlays = await provider.analyze({
    contractVersion: "0.2.0",
    enterpriseId: "enterprise:demo",
    graphId: "eog:primary",
    timeLens: {
      contractVersion: "0.2.0",
      primary: {
        startAt: "2026-09-29T00:00:00.000Z",
        endAt: "2026-09-29T04:00:00.000Z"
      }
    },
    primaryFacts: [
      transitionFact("t1", "app:sales", "app:approval")
    ],
    comparisonFacts: []
  });

  assert.equal(
    overlays.some(item =>
      item.analysisKind === "SOP_CONFORMANCE"
      || item.analysisKind === "SOP_DEVIATION"
    ),
    false
  );
});

test("Human-published SOP emits evidence-backed conformance and deviation", async () => {
  const graphs = graphService();
  let tick = 0;
  const sops = createEogExpectedSopServiceV010({
    store: createMemoryEogExpectedSopStoreV010(),
    graphService: graphs,
    now: () => new Date(
      tick++ === 0
        ? "2026-09-29T01:00:00.000Z"
        : "2026-09-29T02:00:00.000Z"
    )
  });
  const draft = sops.create({
    enterpriseId: "enterprise:demo",
    graphId: "eog:primary",
    sopId: "sop:o2c",
    title: "Order to cash",
    applicationNodeIds: [
      "app:sales",
      "app:approval",
      "app:shipping"
    ]
  });
  sops.publish({
    enterpriseId: "enterprise:demo",
    graphId: "eog:primary",
    sopId: draft.sopId,
    expectedRevision: draft.revision,
    subjectId: "human:owner"
  });

  const expected = transitionFact(
    "t:expected",
    "app:sales",
    "app:approval",
    8
  );
  const deviation = transitionFact(
    "t:deviation",
    "app:sales",
    "app:shipping",
    2
  );

  const provider = createEogBottleneckAnalysisProviderV020({
    expectedSopService: sops
  });
  const overlays = await provider.analyze({
    contractVersion: "0.2.0",
    enterpriseId: "enterprise:demo",
    graphId: "eog:primary",
    timeLens: {
      contractVersion: "0.2.0",
      primary: expected.window
    },
    primaryFacts: [expected, deviation],
    comparisonFacts: []
  });

  const conformance = overlays.find(
    item => item.analysisKind === "SOP_CONFORMANCE"
  );
  const detectedDeviation = overlays.find(
    item => item.analysisKind === "SOP_DEVIATION"
  );

  assert.ok(conformance);
  assert.equal(conformance.status, "OBSERVED");
  assert.equal(conformance.score, 0.8);
  assert.deepEqual(
    new Set(conformance.evidenceFactIds),
    new Set(["t:expected", "t:deviation"])
  );

  assert.ok(detectedDeviation);
  assert.equal(detectedDeviation.status, "OBSERVED");
  assert.deepEqual(
    detectedDeviation.evidenceFactIds,
    ["t:deviation"]
  );
  assert.equal(
    detectedDeviation.details.toApplicationNodeId,
    "app:shipping"
  );
});

test("Published SOP returns insufficient evidence when the Time Lens has no transitions", async () => {
  const graphs = graphService();
  const sops = createEogExpectedSopServiceV010({
    store: createMemoryEogExpectedSopStoreV010(),
    graphService: graphs,
    now: () => new Date("2026-09-29T01:00:00.000Z")
  });
  const draft = sops.create({
    enterpriseId: "enterprise:demo",
    graphId: "eog:primary",
    sopId: "sop:o2c",
    title: "Order to cash",
    applicationNodeIds: ["app:sales", "app:approval"]
  });
  sops.publish({
    enterpriseId: "enterprise:demo",
    graphId: "eog:primary",
    sopId: draft.sopId,
    expectedRevision: 0,
    subjectId: "human:owner"
  });

  const provider = createEogBottleneckAnalysisProviderV020({
    expectedSopService: sops
  });
  const overlays = await provider.analyze({
    contractVersion: "0.2.0",
    enterpriseId: "enterprise:demo",
    graphId: "eog:primary",
    timeLens: {
      contractVersion: "0.2.0",
      primary: {
        startAt: "2026-09-29T00:00:00.000Z",
        endAt: "2026-09-29T04:00:00.000Z"
      }
    },
    primaryFacts: [],
    comparisonFacts: []
  });

  const conformance = overlays.find(
    item => item.analysisKind === "SOP_CONFORMANCE"
  );
  assert.equal(conformance.status, "INSUFFICIENT_EVIDENCE");
  assert.deepEqual(conformance.evidenceFactIds, []);
});
