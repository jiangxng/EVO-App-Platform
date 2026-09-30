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
  createEnterpriseOperatingGraphObservatoryPageV020,
  createEnterpriseOperatingGraphObservatoryViewActionHandlerV020,
  EOG_OBSERVATORY_VIEW_GET_ACTION,
  projectEnterpriseOperatingGraphObservatoryStateV020
} from "../../dist/manager/enterprise-operating-graph-observatory-page.js";
import {
  projectEnterpriseOperatingGraphEditorStateV010
} from "../../dist/manager/enterprise-operating-graph-page.js";

function context() {
  return {
    contractVersion: "0.1.0",
    correlationId: "corr:observe",
    principal: {
      contractVersion: "0.1.0",
      subjectId: "human:owner",
      actorType: "HUMAN",
      identityProviderId: "test"
    },
    scope: {
      contractVersion: "0.1.0",
      enterpriseId: "enterprise:demo",
      userId: "human:owner"
    },
    context: {
      contractVersion: "0.1.0",
      personalContext: {
        contractVersion: "0.1.0",
        kind: "PERSONAL",
        contextId: "personal:owner",
        ownerSubjectId: "human:owner"
      },
      activeContext: {
        contractVersion: "0.1.0",
        kind: "ENTERPRISE",
        contextId: "enterprise-context:demo",
        enterpriseId: "enterprise:demo"
      },
      enterpriseContext: {
        contractVersion: "0.1.0",
        contextId: "enterprise-context:demo",
        enterpriseId: "enterprise:demo",
        displayName: "Demo"
      }
    }
  };
}

function createServices() {
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
  graph = graphService.apply({
    enterpriseId: graph.enterpriseId,
    graphId: graph.graphId,
    expectedRevision: graph.revision,
    actor: { type: "AGENT", subjectId: "agent:personal" },
    mutation: {
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
    }
  });
  graph = graphService.apply({
    enterpriseId: graph.enterpriseId,
    graphId: graph.graphId,
    expectedRevision: graph.revision,
    actor: { type: "AGENT", subjectId: "agent:personal" },
    mutation: {
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
    }
  });
  const view = viewService.ensure({
    enterpriseId: graph.enterpriseId,
    graphId: graph.graphId,
    kind: "DIAGRAM_2D"
  });
  return { graphService, viewService, graph, view };
}

test("Observatory page declares deterministic Time Lens presets", () => {
  const page = createEnterpriseOperatingGraphObservatoryPageV020({
    activeContext: context().context.activeContext,
    locale: "zh-CN",
    now: new Date("2026-09-29T00:00:00.000Z")
  });

  assert.equal(page.kind, "diagram-editor");
  assert.equal(page.readPresets.length, 4);
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

test("Observatory projection keeps semantic layout read-only and overlays real facts with comparison delta", () => {
  const { graph, view } = createServices();
  const base = projectEnterpriseOperatingGraphEditorStateV010(
    graph,
    view,
    "en"
  );
  const projected = projectEnterpriseOperatingGraphObservatoryStateV020({
    base,
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
          factId: "fact:frequency:primary",
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
          factId: "fact:balance:primary",
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
      comparisonFacts: [
        {
          contractVersion: "0.2.0",
          factId: "fact:frequency:comparison",
          enterpriseId: graph.enterpriseId,
          graphId: graph.graphId,
          target: { kind: "NODE", nodeId: "ledger:wip" },
          metric: {
            code: "event.frequency",
            kind: "RATE",
            unit: "events/hour"
          },
          window: {
            startAt: "2026-09-28T16:00:00.000Z",
            endAt: "2026-09-28T20:00:00.000Z"
          },
          value: 10,
          observedAt: "2026-09-28T20:00:01.000Z",
          source: {
            providerId: "evo.runtime-observatory",
            sourceKind: "EVO_RUNTIME"
          }
        }
      ]
    }
  });

  assert.equal(projected.actions.length, 0);
  assert.ok(projected.nodes.every(node => node.readOnly === true));
  const ledger = projected.nodes.find(node => node.id === "ledger:wip");
  assert.ok(ledger);
  assert.deepEqual(
    ledger.observations.map(item => [item.label, item.value]),
    [
      ["Frequency", "12.5/h"],
      ["Balance qty", "180 pcs"]
    ]
  );
  assert.match(ledger.observations[0].detail, /vs previous: \+2.5\/h/);
  assert.ok(ledger.height > 68);
});

test("Observatory view renders the graph without inventing facts when no Runtime Provider is configured", async () => {
  const { graphService, viewService } = createServices();
  const providers = {
    hasRuntimeCandidate: () => false,
    hasAnalysisCandidate: () => false,
    resolveRuntime: () => undefined,
    resolveAnalysis: () => undefined,
    createService() {
      throw new Error("should not create service");
    }
  };
  const handler = createEnterpriseOperatingGraphObservatoryViewActionHandlerV020({
    graphService,
    viewService,
    providers,
    locale: () => "en"
  });

  const result = await handler.execute(
    {
      contractVersion: "0.1.0",
      type: "command",
      command: {
        code: EOG_OBSERVATORY_VIEW_GET_ACTION,
        inputVersion: "0.2.0"
      },
      values: {
        resourceId: "eog:primary",
        timeLens: {
          contractVersion: "0.2.0",
          primary: {
            startAt: "2026-09-28T20:00:00.000Z",
            endAt: "2026-09-29T00:00:00.000Z"
          }
        }
      },
      sourceInteractionId: "observatory",
      actionId: "diagram.read",
      requiresConfirmation: false
    },
    context()
  );

  assert.equal(result.ok, true);
  assert.equal(result.result.nodes.length, 2);
  assert.ok(result.result.nodes.every(node => node.observations === undefined));
  assert.match(result.result.notice, /no Runtime Fact Provider/i);
});
