import test from "node:test";
import assert from "node:assert/strict";
import {
  createMemoryEnterpriseOperatingGraphStoreV010
} from "../../dist/manager/enterprise-operating-graph-store.js";
import {
  createEnterpriseOperatingGraphHostServiceV010
} from "../../dist/manager/enterprise-operating-graph-service.js";
import {
  createEnterpriseOperatingGraphObservatoryServiceV020,
  resolveEogTimeLensV020
} from "../../dist/manager/enterprise-operating-graph-observatory.js";

function graphService() {
  let id = 0;
  const service = createEnterpriseOperatingGraphHostServiceV010({
    store: createMemoryEnterpriseOperatingGraphStoreV010(),
    id: () => String(++id),
    now: () => new Date("2026-09-28T16:00:00.000Z")
  });
  let graph = service.create({
    enterpriseId: "enterprise:demo",
    graphId: "eog:primary"
  });
  graph = service.apply({
    enterpriseId: graph.enterpriseId,
    graphId: graph.graphId,
    expectedRevision: graph.revision,
    actor: { type: "AGENT", subjectId: "agent:personal" },
    mutation: {
      type: "NODE_BIND",
      node: {
        nodeId: "app:production",
        kind: "APPLICATION",
        semanticRef: {
          kind: "APPLICATION",
          authority: "HOST",
          refId: "application:production"
        }
      }
    }
  });
  graph = service.apply({
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
  graph = service.apply({
    enterpriseId: graph.enterpriseId,
    graphId: graph.graphId,
    expectedRevision: graph.revision,
    actor: { type: "AGENT", subjectId: "agent:personal" },
    mutation: {
      type: "GUIDANCE_RELATION_PUT",
      relation: {
        relationId: "guidance:production-wip",
        kind: "APPLICATION_LEDGER",
        applicationNodeId: "app:production",
        ledgerNodeId: "ledger:wip",
        source: {
          kind: "INDUSTRY_TEMPLATE",
          sourceRef: "manufacturing:reference"
        }
      }
    }
  });
  return service;
}

const lens = {
  contractVersion: "0.2.0",
  primary: {
    startAt: "2026-09-28T08:00:00.000Z",
    endAt: "2026-09-28T12:00:00.000Z"
  },
  comparison: {
    kind: "PREVIOUS_PERIOD"
  }
};

function runtimeFact(request, overrides = {}) {
  return {
    contractVersion: "0.2.0",
    factId: "fact:" + request.window.startAt,
    enterpriseId: request.enterpriseId,
    graphId: request.graphId,
    target: {
      kind: "NODE",
      nodeId: "ledger:wip"
    },
    metric: {
      code: "flow.wip",
      kind: "COUNT",
      unit: "items"
    },
    window: request.window,
    value: request.window.startAt === lens.primary.startAt ? 180 : 120,
    sampleCount: 24,
    observedAt: "2026-09-28T12:00:01.000Z",
    source: {
      providerId: "test.runtime",
      sourceKind: "EVO_RUNTIME",
      sourceRef: "ledger-balance-projection"
    },
    ...overrides
  };
}

test("Time Lens resolves previous period deterministically", () => {
  assert.deepEqual(resolveEogTimeLensV020(lens), {
    contractVersion: "0.2.0",
    primary: {
      startAt: "2026-09-28T08:00:00.000Z",
      endAt: "2026-09-28T12:00:00.000Z"
    },
    comparison: {
      startAt: "2026-09-28T04:00:00.000Z",
      endAt: "2026-09-28T08:00:00.000Z"
    }
  });
});

test("Runtime Facts observe one semantic graph without mutating semantic revision", async () => {
  const service = graphService();
  const before = service.get({
    enterpriseId: "enterprise:demo",
    graphId: "eog:primary"
  });
  const runtimeProvider = {
    contractVersion: "0.2.0",
    providerId: "test.runtime",
    async query(request) {
      return [runtimeFact(request)];
    }
  };
  const observatory = createEnterpriseOperatingGraphObservatoryServiceV020({
    graphService: service,
    runtimeProvider
  });

  const snapshot = await observatory.observe({
    enterpriseId: before.enterpriseId,
    graphId: before.graphId,
    timeLens: lens,
    targets: [{ kind: "NODE", nodeId: "ledger:wip" }],
    metricCodes: ["flow.wip"]
  });

  assert.equal(snapshot.semanticRevision, before.revision);
  assert.equal(snapshot.primaryFacts.length, 1);
  assert.equal(snapshot.comparisonFacts.length, 1);
  assert.equal(snapshot.primaryFacts[0].value, 180);
  assert.equal(snapshot.comparisonFacts[0].value, 120);
  assert.equal(snapshot.primaryFacts[0].source.sourceKind, "EVO_RUNTIME");

  const after = service.get({
    enterpriseId: before.enterpriseId,
    graphId: before.graphId
  });
  assert.deepEqual(after, before);
});

test("Runtime provider cannot attach facts to unknown EOG targets", async () => {
  const service = graphService();
  const runtimeProvider = {
    contractVersion: "0.2.0",
    providerId: "test.runtime",
    async query(request) {
      return [runtimeFact(request, {
        target: { kind: "NODE", nodeId: "missing" }
      })];
    }
  };
  const observatory = createEnterpriseOperatingGraphObservatoryServiceV020({
    graphService: service,
    runtimeProvider
  });

  await assert.rejects(
    observatory.observe({
      enterpriseId: "enterprise:demo",
      graphId: "eog:primary",
      timeLens: {
        contractVersion: "0.2.0",
        primary: lens.primary
      }
    }),
    /EOG_OBSERVATORY_TARGET_NOT_FOUND/
  );
});

test("Runtime provider provenance is fail-closed", async () => {
  const service = graphService();
  const runtimeProvider = {
    contractVersion: "0.2.0",
    providerId: "test.runtime",
    async query(request) {
      return [runtimeFact(request, {
        source: {
          providerId: "spoofed.provider",
          sourceKind: "EVO_RUNTIME"
        }
      })];
    }
  };
  const observatory = createEnterpriseOperatingGraphObservatoryServiceV020({
    graphService: service,
    runtimeProvider
  });

  await assert.rejects(
    observatory.observe({
      enterpriseId: "enterprise:demo",
      graphId: "eog:primary",
      timeLens: {
        contractVersion: "0.2.0",
        primary: lens.primary
      }
    }),
    /EOG_RUNTIME_FACT_INVALID/
  );
});

test("Analysis Overlay remains derived and must cite Runtime Fact evidence", async () => {
  const service = graphService();
  const runtimeProvider = {
    contractVersion: "0.2.0",
    providerId: "test.runtime",
    async query(request) {
      return [runtimeFact(request)];
    }
  };
  const analysisProvider = {
    contractVersion: "0.2.0",
    providerId: "test.analysis",
    async analyze(request) {
      const fact = request.primaryFacts[0];
      return [{
        contractVersion: "0.2.0",
        overlayId: "analysis:bottleneck:wip",
        enterpriseId: request.enterpriseId,
        graphId: request.graphId,
        target: fact.target,
        analysisKind: "BOTTLENECK",
        status: "OBSERVED",
        severity: "WARNING",
        confidence: 0.91,
        score: 0.78,
        window: request.timeLens.primary,
        evidenceFactIds: [fact.factId],
        derivedAt: "2026-09-28T12:00:02.000Z",
        source: {
          providerId: "test.analysis",
          analyzerRef: "bottleneck:v1"
        },
        details: {
          reason: "wip-growth"
        }
      }];
    }
  };
  const observatory = createEnterpriseOperatingGraphObservatoryServiceV020({
    graphService: service,
    runtimeProvider,
    analysisProvider
  });

  const snapshot = await observatory.analyze({
    enterpriseId: "enterprise:demo",
    graphId: "eog:primary",
    timeLens: lens
  });

  assert.equal(snapshot.overlays.length, 1);
  assert.equal(snapshot.overlays[0].analysisKind, "BOTTLENECK");
  assert.equal(snapshot.overlays[0].evidenceFactIds[0], snapshot.primaryFacts[0].factId);
  assert.equal(snapshot.overlays[0].source.providerId, "test.analysis");
});

test("Analysis Overlay cannot invent evidence references", async () => {
  const service = graphService();
  const runtimeProvider = {
    contractVersion: "0.2.0",
    providerId: "test.runtime",
    async query(request) {
      return [runtimeFact(request)];
    }
  };
  const analysisProvider = {
    contractVersion: "0.2.0",
    providerId: "test.analysis",
    async analyze(request) {
      return [{
        contractVersion: "0.2.0",
        overlayId: "analysis:bad",
        enterpriseId: request.enterpriseId,
        graphId: request.graphId,
        target: { kind: "NODE", nodeId: "ledger:wip" },
        analysisKind: "ANOMALY",
        status: "OBSERVED",
        severity: "WATCH",
        confidence: 0.5,
        window: request.timeLens.primary,
        evidenceFactIds: ["fact:does-not-exist"],
        derivedAt: "2026-09-28T12:00:02.000Z",
        source: {
          providerId: "test.analysis"
        }
      }];
    }
  };
  const observatory = createEnterpriseOperatingGraphObservatoryServiceV020({
    graphService: service,
    runtimeProvider,
    analysisProvider
  });

  await assert.rejects(
    observatory.analyze({
      enterpriseId: "enterprise:demo",
      graphId: "eog:primary",
      timeLens: {
        contractVersion: "0.2.0",
        primary: lens.primary
      }
    }),
    /EOG_ANALYSIS_EVIDENCE_NOT_FOUND/
  );
});
