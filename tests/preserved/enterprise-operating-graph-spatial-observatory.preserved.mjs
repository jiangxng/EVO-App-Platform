import test from "node:test";
import assert from "node:assert/strict";
import {
  createEogBottleneckAnalysisProviderV020
} from "../../dist/providers/eog-bottleneck-analysis/runtime.js";
import {
  projectEnterpriseOperatingGraphSpatialObservatoryStateV020
} from "../../dist/manager/enterprise-operating-graph-spatial-observatory-page.js";

function fact(id, window, code, value, unit) {
  return {
    contractVersion: "0.2.0",
    factId: id,
    enterpriseId: "enterprise:demo",
    graphId: "eog:primary",
    target: { kind: "NODE", nodeId: "ledger:wip" },
    metric: {
      code,
      kind: code === "event.frequency" ? "RATE" : "QUANTITY",
      unit
    },
    window,
    value,
    observedAt: window.endAt,
    source: {
      providerId: "runtime:test",
      sourceKind: "REFERENCE"
    }
  };
}

test("evidence-backed bottleneck provider observes rising pressure only when activity does not keep pace", async () => {
  const previous = {
    startAt: "2026-09-28T00:00:00.000Z",
    endAt: "2026-09-28T04:00:00.000Z"
  };
  const primary = {
    startAt: "2026-09-28T04:00:00.000Z",
    endAt: "2026-09-28T08:00:00.000Z"
  };
  const provider = createEogBottleneckAnalysisProviderV020();
  const overlays = await provider.analyze({
    contractVersion: "0.2.0",
    enterpriseId: "enterprise:demo",
    graphId: "eog:primary",
    timeLens: {
      contractVersion: "0.2.0",
      primary,
      comparison: previous
    },
    primaryFacts: [
      fact("p-pressure", primary, "balance.quantity", 180, "units"),
      fact("p-activity", primary, "event.frequency", 10, "events/hour")
    ],
    comparisonFacts: [
      fact("c-pressure", previous, "balance.quantity", 100, "units"),
      fact("c-activity", previous, "event.frequency", 9, "events/hour")
    ]
  });

  assert.equal(overlays.length, 1);
  assert.equal(overlays[0].analysisKind, "BOTTLENECK");
  assert.equal(overlays[0].status, "OBSERVED");
  assert.equal(overlays[0].severity, "WARNING");
  assert.equal(overlays[0].evidenceFactIds.length, 4);
  assert.equal(overlays[0].source.analyzerRef, "evidence-backed-pressure-trend-v0.1");
});

test("bottleneck provider says insufficient evidence instead of inventing a result", async () => {
  const primary = {
    startAt: "2026-09-28T04:00:00.000Z",
    endAt: "2026-09-28T08:00:00.000Z"
  };
  const provider = createEogBottleneckAnalysisProviderV020();
  const overlays = await provider.analyze({
    contractVersion: "0.2.0",
    enterpriseId: "enterprise:demo",
    graphId: "eog:primary",
    timeLens: {
      contractVersion: "0.2.0",
      primary
    },
    primaryFacts: [
      fact("p-pressure", primary, "balance.quantity", 180, "units")
    ],
    comparisonFacts: []
  });

  assert.equal(overlays[0].status, "INSUFFICIENT_EVIDENCE");
  assert.match(String(overlays[0].details.reason), /Requires comparable pressure and activity/);
});

test("SPATIAL_3D projection uses stable semantic layers and overlays analysis without mutating graph truth", () => {
  const graph = {
    contractVersion: "0.1.0",
    graphId: "eog:primary",
    enterpriseId: "enterprise:demo",
    state: "DRAFT",
    revision: 3,
    nodes: [
      {
        nodeId: "app:sales",
        kind: "APPLICATION",
        semanticRef: {
          kind: "APPLICATION",
          authority: "HOST",
          refId: "application:sales-order"
        }
      },
      {
        nodeId: "ledger:wip",
        kind: "LEDGER",
        semanticRef: {
          kind: "LEDGER_DEFINITION",
          authority: "EVO",
          refId: "ledger:pending-production"
        }
      }
    ],
    guidanceRelations: [],
    enterpriseRelations: [
      {
        relationId: "rel:1",
        kind: "APPLICATION_LEDGER",
        applicationNodeId: "app:sales",
        ledgerNodeId: "ledger:wip",
        confirmedBySubjectId: "human:owner",
        confirmedAt: "2026-09-28T00:00:00.000Z"
      }
    ],
    createdAt: "2026-09-28T00:00:00.000Z",
    updatedAt: "2026-09-28T00:00:00.000Z"
  };
  const view = {
    contractVersion: "0.1.0",
    viewId: "eog-view:primary:spatial-3d",
    graphId: "eog:primary",
    enterpriseId: "enterprise:demo",
    kind: "SPATIAL_3D",
    revision: 0,
    placements: [],
    createdAt: "2026-09-28T00:00:00.000Z",
    updatedAt: "2026-09-28T00:00:00.000Z"
  };
  const window = {
    startAt: "2026-09-28T04:00:00.000Z",
    endAt: "2026-09-28T08:00:00.000Z"
  };
  const snapshot = {
    contractVersion: "0.2.0",
    enterpriseId: "enterprise:demo",
    graphId: "eog:primary",
    semanticRevision: 3,
    timeLens: { contractVersion: "0.2.0", primary: window },
    primaryFacts: [
      fact("pressure", window, "balance.quantity", 180, "units")
    ],
    comparisonFacts: [],
    overlays: [{
      contractVersion: "0.2.0",
      overlayId: "bottleneck:test",
      enterpriseId: "enterprise:demo",
      graphId: "eog:primary",
      target: { kind: "NODE", nodeId: "ledger:wip" },
      analysisKind: "BOTTLENECK",
      status: "OBSERVED",
      severity: "WARNING",
      confidence: 0.8,
      score: 0.69,
      window,
      evidenceFactIds: ["pressure"],
      derivedAt: window.endAt,
      source: {
        providerId: "eog.bottleneck-analysis",
        analyzerRef: "evidence-backed-pressure-trend-v0.1"
      }
    }]
  };

  const spatial = projectEnterpriseOperatingGraphSpatialObservatoryStateV020({
    graph,
    view,
    snapshot
  });

  const app = spatial.objects.find(o => o.id === "app:sales");
  const ledger = spatial.objects.find(o => o.id === "ledger:wip");
  assert.equal(app.position.z, 180);
  assert.equal(ledger.position.z, -180);
  assert.equal(
    ledger.observations.some(item => item.label === "Bottleneck" && item.value === "WARNING"),
    true
  );
  assert.equal(graph.nodes[0].semanticRef.refId, "application:sales-order");
  assert.equal("position" in graph.nodes[0], false);
});
