import test from "node:test";
import assert from "node:assert/strict";
import {
  createProviderRuntimeRegistry
} from "../../dist/providers/runtime-registry.js";
import {
  createMemoryProviderBindingStoreV010
} from "../../dist/manager/provider-resolution.js";
import {
  createMemoryEnterpriseOperatingGraphStoreV010
} from "../../dist/manager/enterprise-operating-graph-store.js";
import {
  createEnterpriseOperatingGraphHostServiceV010
} from "../../dist/manager/enterprise-operating-graph-service.js";
import {
  createEnterpriseOperatingGraphObservatoryProviderResolverV020,
  EOG_ANALYSIS_PROVIDER_CAPABILITY_V020,
  EOG_RUNTIME_FACT_PROVIDER_CAPABILITY_V020
} from "../../dist/manager/enterprise-operating-graph-observatory-provider.js";
import {
  createEnterpriseOperatingGraphObservatoryActionHandlersV020,
  EOG_OBSERVE_ACTION
} from "../../dist/manager/enterprise-operating-graph-observatory-actions.js";
import {
  createEnterpriseOperatingGraphObservatoryAgentToolRegistrationsV020
} from "../../dist/manager/enterprise-operating-graph-observatory-agent-tools.js";

function graphService() {
  let id = 0;
  const service = createEnterpriseOperatingGraphHostServiceV010({
    store: createMemoryEnterpriseOperatingGraphStoreV010(),
    id: () => String(++id),
    now: () => new Date("2026-09-28T16:30:00.000Z")
  });
  let graph = service.create({
    enterpriseId: "enterprise:a",
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
  return service;
}

function runtimeProvider(providerId, value) {
  return {
    contractVersion: "0.2.0",
    providerId,
    async query(request) {
      return [{
        contractVersion: "0.2.0",
        factId: providerId + ":" + request.window.startAt,
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
        value,
        observedAt: request.window.endAt,
        source: {
          providerId,
          sourceKind: "EVO_RUNTIME",
          sourceRef: "test"
        }
      }];
    }
  };
}

function analysisProvider(providerId) {
  return {
    contractVersion: "0.2.0",
    providerId,
    async analyze(request) {
      const fact = request.primaryFacts[0];
      return [{
        contractVersion: "0.2.0",
        overlayId: providerId + ":bottleneck",
        enterpriseId: request.enterpriseId,
        graphId: request.graphId,
        target: fact.target,
        analysisKind: "BOTTLENECK",
        status: "OBSERVED",
        severity: "WARNING",
        confidence: 0.9,
        window: request.timeLens.primary,
        evidenceFactIds: [fact.factId],
        derivedAt: request.timeLens.primary.endAt,
        source: {
          providerId,
          analyzerRef: "test:bottleneck"
        }
      }];
    }
  };
}

function descriptor(providerId, capability) {
  return { providerId, capability };
}

function managerWith(descriptors) {
  return {
    listEffectiveServiceProviders(capability) {
      return descriptors.filter(item => item.capability === capability);
    }
  };
}

function requestContext() {
  return {
    contractVersion: "0.1.0",
    correlationId: "corr:1",
    principal: {
      contractVersion: "0.1.0",
      subjectId: "human:a",
      actorType: "HUMAN",
      identityProviderId: "test"
    },
    scope: {
      contractVersion: "0.1.0",
      enterpriseId: "enterprise:a",
      userId: "human:a"
    },
    context: {
      contractVersion: "0.1.0",
      personalContext: {
        contractVersion: "0.1.0",
        kind: "PERSONAL",
        contextId: "personal:a",
        ownerSubjectId: "human:a"
      },
      activeContext: {
        contractVersion: "0.1.0",
        kind: "ENTERPRISE",
        contextId: "enterprise-context:a",
        enterpriseId: "enterprise:a"
      },
      enterpriseContext: {
        contractVersion: "0.1.0",
        contextId: "enterprise-context:a",
        enterpriseId: "enterprise:a",
        displayName: "A"
      }
    }
  };
}

const queryValues = {
  graphId: "eog:primary",
  timeLens: {
    contractVersion: "0.2.0",
    primary: {
      startAt: "2026-09-28T08:00:00.000Z",
      endAt: "2026-09-28T12:00:00.000Z"
    }
  },
  targets: [{
    kind: "NODE",
    nodeId: "ledger:wip"
  }],
  metricCodes: ["flow.wip"]
};

test("Observatory Provider resolution honors enterprise-scoped binding", async () => {
  const registry = createProviderRuntimeRegistry();
  registry.register("runtime.a", runtimeProvider("runtime.a", 111));
  registry.register("runtime.b", runtimeProvider("runtime.b", 222));

  const bindings = createMemoryProviderBindingStoreV010([{
    contractVersion: "0.1.0",
    capability: EOG_RUNTIME_FACT_PROVIDER_CAPABILITY_V020,
    providerId: "runtime.b",
    scope: "ENTERPRISE",
    scopeId: "enterprise:a"
  }]);

  const resolver =
    createEnterpriseOperatingGraphObservatoryProviderResolverV020({
      manager: managerWith([
        descriptor("runtime.a", EOG_RUNTIME_FACT_PROVIDER_CAPABILITY_V020),
        descriptor("runtime.b", EOG_RUNTIME_FACT_PROVIDER_CAPABILITY_V020)
      ]),
      registry,
      bindings
    });

  assert.equal(resolver.hasRuntimeCandidate(), true);
  assert.equal(
    resolver.resolveRuntime("enterprise:a").providerId,
    "runtime.b"
  );

  const snapshot = await resolver.createService({
    graphService: graphService(),
    enterpriseId: "enterprise:a"
  }).observe({
    enterpriseId: "enterprise:a",
    ...queryValues
  });

  assert.equal(snapshot.primaryFacts[0].value, 222);
  assert.equal(
    snapshot.primaryFacts[0].source.providerId,
    "runtime.b"
  );
});

test("Provider runtime identity must match the selected Provider descriptor", () => {
  const registry = createProviderRuntimeRegistry();
  registry.register(
    "runtime.descriptor",
    runtimeProvider("runtime.spoofed", 1)
  );
  const resolver =
    createEnterpriseOperatingGraphObservatoryProviderResolverV020({
      manager: managerWith([
        descriptor(
          "runtime.descriptor",
          EOG_RUNTIME_FACT_PROVIDER_CAPABILITY_V020
        )
      ]),
      registry,
      bindings: createMemoryProviderBindingStoreV010()
    });

  assert.throws(
    () => resolver.resolveRuntime("enterprise:a"),
    /EOG_RUNTIME_PROVIDER_CONTRACT_MISMATCH/
  );
});

test("Human Observatory READ action fails closed without a Runtime Fact Provider", async () => {
  const service = graphService();
  const resolver =
    createEnterpriseOperatingGraphObservatoryProviderResolverV020({
      manager: managerWith([]),
      registry: createProviderRuntimeRegistry(),
      bindings: createMemoryProviderBindingStoreV010()
    });
  const handler =
    createEnterpriseOperatingGraphObservatoryActionHandlersV020({
      graphService: service,
      providers: resolver
    }).find(item => item.commandCode === EOG_OBSERVE_ACTION);

  const result = await handler.execute({
    contractVersion: "0.1.0",
    type: "command",
    command: {
      code: EOG_OBSERVE_ACTION,
      inputVersion: "0.2.0"
    },
    values: queryValues,
    sourceInteractionId: "observatory",
    actionId: "observe",
    requiresConfirmation: false
  }, requestContext());

  assert.equal(result.ok, false);
  assert.equal(result.error.code, "EOG_RUNTIME_PROVIDER_REQUIRED");
});

test("Human Observatory READ action returns only Provider-backed validated Runtime Facts", async () => {
  const registry = createProviderRuntimeRegistry();
  registry.register("runtime.a", runtimeProvider("runtime.a", 321));
  const resolver =
    createEnterpriseOperatingGraphObservatoryProviderResolverV020({
      manager: managerWith([
        descriptor("runtime.a", EOG_RUNTIME_FACT_PROVIDER_CAPABILITY_V020)
      ]),
      registry,
      bindings: createMemoryProviderBindingStoreV010()
    });
  const handler =
    createEnterpriseOperatingGraphObservatoryActionHandlersV020({
      graphService: graphService(),
      providers: resolver
    }).find(item => item.commandCode === EOG_OBSERVE_ACTION);

  const result = await handler.execute({
    contractVersion: "0.1.0",
    type: "command",
    command: {
      code: EOG_OBSERVE_ACTION,
      inputVersion: "0.2.0"
    },
    values: queryValues,
    sourceInteractionId: "observatory",
    actionId: "observe",
    requiresConfirmation: false
  }, requestContext());

  assert.equal(result.ok, true);
  assert.equal(result.result.primaryFacts[0].value, 321);
});

test("Personal Agent Observatory tools appear only when real Provider runtimes are available", async () => {
  const service = graphService();
  const emptyResolver =
    createEnterpriseOperatingGraphObservatoryProviderResolverV020({
      manager: managerWith([]),
      registry: createProviderRuntimeRegistry(),
      bindings: createMemoryProviderBindingStoreV010()
    });
  const context = requestContext().context;
  const principal = requestContext().principal;

  const hidden =
    createEnterpriseOperatingGraphObservatoryAgentToolRegistrationsV020({
      graphService: service,
      providers: emptyResolver,
      principal,
      context
    });
  assert.equal(hidden.every(item => item.available() === false), true);

  const registry = createProviderRuntimeRegistry();
  registry.register("runtime.a", runtimeProvider("runtime.a", 10));
  registry.register("analysis.a", analysisProvider("analysis.a"));
  const resolver =
    createEnterpriseOperatingGraphObservatoryProviderResolverV020({
      manager: managerWith([
        descriptor("runtime.a", EOG_RUNTIME_FACT_PROVIDER_CAPABILITY_V020),
        descriptor("analysis.a", EOG_ANALYSIS_PROVIDER_CAPABILITY_V020)
      ]),
      registry,
      bindings: createMemoryProviderBindingStoreV010()
    });

  const tools =
    createEnterpriseOperatingGraphObservatoryAgentToolRegistrationsV020({
      graphService: service,
      providers: resolver,
      principal,
      context
    });
  assert.equal(tools.every(item => item.available() === true), true);

  const analyze = tools.find(
    item => item.descriptor.id === "enterprise.operating_graph.analyze"
  );
  const snapshot = await analyze.execute(queryValues, []);
  assert.equal(snapshot.overlays[0].analysisKind, "BOTTLENECK");
  assert.equal(
    snapshot.overlays[0].evidenceFactIds[0],
    snapshot.primaryFacts[0].factId
  );
});
