import test from "node:test";
import assert from "node:assert/strict";
import {
  createMemoryEnterpriseOperatingGraphStoreV010
} from "../../dist/manager/enterprise-operating-graph-store.js";
import {
  createEnterpriseOperatingGraphHostServiceV010
} from "../../dist/manager/enterprise-operating-graph-service.js";
import {
  createMemoryEnterpriseOperatingGraphViewStoreV010
} from "../../dist/manager/enterprise-operating-graph-view-store.js";
import {
  createEnterpriseOperatingGraphViewHostServiceV010
} from "../../dist/manager/enterprise-operating-graph-view-service.js";
import {
  createEnterpriseOperatingGraphSpatialObservatoryPageV020,
  projectEnterpriseOperatingGraphSpatialObservatoryStateV020
} from "../../dist/manager/enterprise-operating-graph-spatial-observatory-page.js";

function createModel() {
  let serial = 0;
  const graphService = createEnterpriseOperatingGraphHostServiceV010({
    store: createMemoryEnterpriseOperatingGraphStoreV010(),
    id: () => String(++serial),
    now: () => new Date("2026-09-29T00:00:00.000Z")
  });
  const viewService = createEnterpriseOperatingGraphViewHostServiceV010({
    store: createMemoryEnterpriseOperatingGraphViewStoreV010(),
    now: () => new Date("2026-09-29T00:00:00.000Z")
  });

  let graph = graphService.create({
    enterpriseId: "enterprise:demo",
    graphId: "eog:primary"
  });

  for (const mutation of [
    {
      type: "NODE_BIND",
      node: {
        nodeId: "app:sales",
        kind: "APPLICATION",
        semanticRef: {
          kind: "APPLICATION",
          authority: "HOST",
          refId: "application:sales"
        }
      }
    },
    {
      type: "NODE_BIND",
      node: {
        nodeId: "ledger:wip",
        kind: "LEDGER",
        semanticRef: {
          kind: "LEDGER_DEFINITION",
          authority: "EVO",
          refId: "ledger:pending-production"
        }
      }
    },
    {
      type: "GUIDANCE_RELATION_PUT",
      relation: {
        relationId: "guidance:wip",
        kind: "APPLICATION_LEDGER",
        applicationNodeId: "app:sales",
        ledgerNodeId: "ledger:wip",
        source: {
          kind: "ENTERPRISE_TEMPLATE",
          sourceRef: "template:demo"
        }
      }
    }
  ]) {
    graph = graphService.apply({
      enterpriseId: graph.enterpriseId,
      graphId: graph.graphId,
      expectedRevision: graph.revision,
      actor: { type: "AGENT", subjectId: "agent:personal" },
      mutation
    });
  }

  const view = viewService.ensure({
    enterpriseId: graph.enterpriseId,
    graphId: graph.graphId,
    kind: "SPATIAL_3D"
  });

  return { graphService, viewService, graph, view };
}

test("SPATIAL_3D Observatory reuses the same Time Lens presets as the 2D Observatory", () => {
  const page = createEnterpriseOperatingGraphSpatialObservatoryPageV020({
    activeContext: {
      contractVersion: "0.1.0",
      kind: "ENTERPRISE",
      contextId: "enterprise-context:demo",
      enterpriseId: "enterprise:demo"
    },
    locale: "en",
    now: new Date("2026-09-29T00:00:00.000Z")
  });

  assert.equal(page.kind, "spatial-observatory");
  assert.deepEqual(page.readPresets.map(item => item.id), [
    "4h",
    "24h",
    "7d",
    "1h"
  ]);
  assert.deepEqual(page.readPresets[0].values.timeLens, {
    contractVersion: "0.2.0",
    primary: {
      startAt: "2026-09-28T20:00:00.000Z",
      endAt: "2026-09-29T00:00:00.000Z"
    },
    comparison: {
      kind: "PREVIOUS_PERIOD"
    }
  });
});

test("SPATIAL_3D defaults to stable semantic layers, not runtime-driven positions", () => {
  const { graph, view } = createModel();

  const projected = projectEnterpriseOperatingGraphSpatialObservatoryStateV020({
    graph,
    view,
    providerAvailable: false,
    locale: "en"
  });

  const application = projected.objects.find(item => item.id === "app:sales");
  const ledger = projected.objects.find(item => item.id === "ledger:wip");
  assert.ok(application);
  assert.ok(ledger);
  assert.equal(application.position.z, 190);
  assert.equal(ledger.position.z, -190);
  assert.equal(projected.revision, view.revision);
  assert.equal(application.observations, undefined);
  assert.equal(ledger.observations, undefined);
});

test("persisted SPATIAL_3D placement and camera override deterministic defaults", () => {
  const { graph, viewService, graph: current } = createModel();
  let view = viewService.get({
    enterpriseId: current.enterpriseId,
    graphId: current.graphId,
    viewId: "eog:primary:view:spatial-3d"
  });

  view = viewService.apply({
    enterpriseId: current.enterpriseId,
    graphId: current.graphId,
    viewId: view.viewId,
    expectedRevision: view.revision,
    mutation: {
      type: "NODE_POSITION_SET",
      placement: {
        nodeId: "ledger:wip",
        x: 222,
        y: -88,
        z: 460
      }
    }
  });
  view = viewService.apply({
    enterpriseId: current.enterpriseId,
    graphId: current.graphId,
    viewId: view.viewId,
    expectedRevision: view.revision,
    mutation: {
      type: "CAMERA_SET",
      camera: {
        position: { x: 900, y: 600, z: 1200 },
        target: { x: 10, y: 20, z: 30 }
      }
    }
  });

  const projected = projectEnterpriseOperatingGraphSpatialObservatoryStateV020({
    graph,
    view,
    providerAvailable: false
  });

  assert.deepEqual(
    projected.objects.find(item => item.id === "ledger:wip").position,
    { x: 222, y: -88, z: 460 }
  );
  assert.deepEqual(projected.camera, {
    position: { x: 900, y: 600, z: 1200 },
    target: { x: 10, y: 20, z: 30 }
  });
  assert.equal(projected.revision, 2);
});

test("SPATIAL_3D overlays the same Runtime Fact target identity as 2D", () => {
  const { graph, view } = createModel();

  const projected = projectEnterpriseOperatingGraphSpatialObservatoryStateV020({
    graph,
    view,
    providerAvailable: true,
    locale: "en",
    snapshot: {
      contractVersion: "0.2.0",
      enterpriseId: graph.enterpriseId,
      graphId: graph.graphId,
      semanticRevision: graph.revision,
      timeLens: {
        contractVersion: "0.2.0",
        primary: {
          startAt: "2026-09-28T20:00:00.000Z",
          endAt: "2026-09-29T00:00:00.000Z"
        },
        comparison: {
          startAt: "2026-09-28T16:00:00.000Z",
          endAt: "2026-09-28T20:00:00.000Z"
        }
      },
      primaryFacts: [
        {
          contractVersion: "0.2.0",
          factId: "fact:freq",
          enterpriseId: graph.enterpriseId,
          graphId: graph.graphId,
          target: { kind: "NODE", nodeId: "ledger:wip" },
          metric: {
            code: "event.frequency",
            kind: "RATE",
            unit: "events/hour"
          },
          window: {
            startAt: "2026-09-28T20:00:00.000Z",
            endAt: "2026-09-29T00:00:00.000Z"
          },
          value: 12.5,
          observedAt: "2026-09-29T00:00:01.000Z",
          source: {
            providerId: "evo.runtime-observatory",
            sourceKind: "EVO_RUNTIME",
            sourceRef: "ledger:pending-production"
          }
        },
        {
          contractVersion: "0.2.0",
          factId: "fact:balance",
          enterpriseId: graph.enterpriseId,
          graphId: graph.graphId,
          target: { kind: "NODE", nodeId: "ledger:wip" },
          metric: {
            code: "balance.quantity",
            kind: "QUANTITY",
            unit: "pcs"
          },
          window: {
            startAt: "2026-09-28T20:00:00.000Z",
            endAt: "2026-09-29T00:00:00.000Z"
          },
          value: 180,
          observedAt: "2026-09-29T00:00:01.000Z",
          source: {
            providerId: "evo.runtime-observatory",
            sourceKind: "EVO_RUNTIME",
            sourceRef: "ledger:pending-production"
          }
        }
      ],
      comparisonFacts: []
    }
  });

  const ledger = projected.objects.find(item => item.id === "ledger:wip");
  assert.ok(ledger);
  assert.deepEqual(
    ledger.observations.map(item => [item.label, item.value]),
    [
      ["Frequency", "12.5/h"],
      ["Balance qty", "180 pcs"]
    ]
  );
  assert.equal(
    projected.objects.find(item => item.id === "app:sales").observations,
    undefined
  );
});
