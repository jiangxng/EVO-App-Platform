import test from "node:test";
import assert from "node:assert/strict";

import {
  createMemoryCurrent2dEditorSessionStoreV010
} from "../../dist/contracts/current-2d-editor.js";
import {
  createMemoryDefinitionProjectionSessionStoreV010
} from "../../dist/contracts/definition-projection.js";
import {
  createMemoryDefinitionProjectionStoreV010
} from "../../dist/providers/enterprise-context/definition-projection-store.js";
import {
  createMemoryEogViewStateStoreV010
} from "../../dist/providers/eog-view-state/store.js";
import {
  createEogViewStateProviderV010
} from "../../dist/providers/eog-view-state/runtime.js";
import {
  createEnterpriseDefinitionProjectionEditorActionHandlersV010
} from "../../dist/apps/eog-2d-designer/definition-projection-editor.js";
import {
  createCurrent2dEditorAgentToolRegistrationsV010
} from "../../dist/apps/eog-2d-designer/current-2d-editor-agent-tools.js";
import {
  createEnterpriseOperatingGraphViewActionHandlersV010,
  EOG_VIEW_GET_ACTION
} from "../../dist/apps/eog-2d-designer/enterprise-operating-graph-page.js";
import {
  EOG_2D_DESIGNER_DEFINITION_PROJECTION_GET_ACTION
} from "../../dist/apps/eog-2d-designer/package.js";
import {
  createEnterpriseAgentRuntime
} from "../../dist/agents/enterprise-agent/runtime.js";

const enterpriseId = "ent-a";
const definitionId = "ledger:main";
const definitionRevision = 0;
const projectionId = "projection:main";
const graphId = "eog:primary";

function principal() {
  return {
    contractVersion: "0.1.0",
    subjectId: "owner-a",
    actorType: "HUMAN",
    identityProviderId: "test.identity",
    sessionId: "session-a"
  };
}

function resolvedContext() {
  return {
    contractVersion: "0.1.0",
    personalContext: {
      contractVersion: "0.1.0",
      kind: "PERSONAL",
      contextId: "personal:owner-a",
      ownerSubjectId: "owner-a"
    },
    activeContext: {
      contractVersion: "0.1.0",
      kind: "ENTERPRISE",
      contextId: "enterprise:ent-a",
      enterpriseId
    }
  };
}

function personalResolvedContext() {
  return {
    contractVersion: "0.1.0",
    personalContext: {
      contractVersion: "0.1.0",
      kind: "PERSONAL",
      contextId: "personal:owner-a",
      ownerSubjectId: "owner-a"
    },
    activeContext: {
      contractVersion: "0.1.0",
      kind: "PERSONAL",
      contextId: "personal:owner-a"
    }
  };
}

function requestContext() {
  return {
    contractVersion: "0.1.0",
    principal: principal(),
    scope: {
      contractVersion: "0.1.0",
      enterpriseId
    },
    context: resolvedContext(),
    locale: "zh-CN",
    correlationId: "current-2d-editor-agent-test"
  };
}

const fullDiagram = {
  contractVersion: "0.1.0",
  kind: "DIAGRAM_2D",
  nodes: [
    {
      id: "app:sales-order",
      kind: "application",
      label: "销售订单",
      typeLabel: "应用",
      x: 40,
      y: 80,
      width: 140,
      height: 64
    },
    {
      id: "ledger:receivable",
      kind: "ledger",
      label: "应收账款",
      typeLabel: "账本",
      x: 240,
      y: 80,
      width: 140,
      height: 64
    },
    {
      id: "app:cash-receipt",
      kind: "application",
      label: "销售收款",
      typeLabel: "应用",
      x: 440,
      y: 80,
      width: 140,
      height: 64
    },
    {
      id: "ledger:inventory",
      kind: "ledger",
      label: "库存",
      typeLabel: "账本",
      x: 240,
      y: 220,
      width: 140,
      height: 64
    },
    {
      id: "app:purchase",
      kind: "application",
      label: "采购入库",
      typeLabel: "应用",
      x: 40,
      y: 220,
      width: 140,
      height: 64
    }
  ],
  edges: [
    {
      id: "edge:sales-receivable",
      source: "app:sales-order",
      target: "ledger:receivable",
      kind: "posting",
      label: "形成应收"
    },
    {
      id: "edge:receivable-cash",
      source: "ledger:receivable",
      target: "app:cash-receipt",
      kind: "settlement",
      label: "收款核销"
    },
    {
      id: "edge:purchase-inventory",
      source: "app:purchase",
      target: "ledger:inventory",
      kind: "posting",
      label: "增加库存"
    }
  ]
};

function initialGallery() {
  return {
    contractVersion: "0.1.0",
    primaryProjectionId: projectionId,
    projections: [{
      projectionId,
      title: "完整关系",
      thumbnail: {
        src: "data:image/svg+xml;charset=UTF-8,seed",
        alt: "完整关系 投影缩略图"
      },
      view: {
        contractVersion: "0.1.0",
        kind: "DIAGRAM_2D",
        placements: fullDiagram.nodes.map(node => ({
          nodeId: node.id,
          x: node.x,
          y: node.y
        })),
        camera: {
          scale: 1,
          translateX: 0,
          translateY: 0
        }
      }
    }]
  };
}

function fakeRepository() {
  const revision = {
    enterpriseId,
    definitionId,
    revision: definitionRevision,
    kind: "LEDGER_RUNTIME_TEMPLATE",
    title: "测试账本",
    state: "DRAFT",
    payload: {
      contractVersion: "0.1.0",
      kind: "test"
    },
    projectionGallery: initialGallery()
  };
  return {
    getLatest(input) {
      return input.enterpriseId === enterpriseId
        && input.definitionId === definitionId
        ? structuredClone(revision)
        : undefined;
    },
    listHistory(input) {
      return input.enterpriseId === enterpriseId
        && input.definitionId === definitionId
        ? [structuredClone(revision)]
        : [];
    }
  };
}

function artifactSource() {
  return {
    get(input) {
      if (
        input.enterpriseId !== enterpriseId
        || input.definitionId !== definitionId
        || input.definitionRevision !== definitionRevision
        || input.projectionId !== projectionId
      ) {
        return undefined;
      }
      return {
        contractVersion: "0.1.0",
        enterpriseId,
        definitionId,
        definitionRevision,
        projectionId,
        title: "完整关系",
        definitionKind: "LEDGER_RUNTIME_TEMPLATE",
        diagram2d: structuredClone(fullDiagram)
      };
    }
  };
}

function operatingGraph() {
  return {
    contractVersion: "0.1.0",
    graphId,
    enterpriseId,
    revision: 7,
    state: "DRAFT",
    nodes: [{
      nodeId: "app:sales-order",
      kind: "APPLICATION",
      semanticRef: {
        kind: "APPLICATION",
        authority: "HOST",
        refId: "application:sales-order"
      }
    }, {
      nodeId: "ledger:receivable",
      kind: "LEDGER",
      semanticRef: {
        kind: "LEDGER_DEFINITION",
        authority: "EVO",
        refId: "ledger:receivable"
      }
    }, {
      nodeId: "app:cash-receipt",
      kind: "APPLICATION",
      semanticRef: {
        kind: "APPLICATION",
        authority: "HOST",
        refId: "application:cash-receipt"
      }
    }, {
      nodeId: "app:purchase",
      kind: "APPLICATION",
      semanticRef: {
        kind: "APPLICATION",
        authority: "HOST",
        refId: "application:purchase-receipt"
      }
    }, {
      nodeId: "ledger:inventory",
      kind: "LEDGER",
      semanticRef: {
        kind: "LEDGER_DEFINITION",
        authority: "EVO",
        refId: "ledger:inventory"
      }
    }],
    guidanceRelations: [{
      relationId: "sales-receivable",
      kind: "APPLICATION_LEDGER",
      applicationNodeId: "app:sales-order",
      ledgerNodeId: "ledger:receivable",
      source: {
        kind: "BUSINESS_RULE",
        sourceRef: "sales-order-to-receivable"
      }
    }, {
      relationId: "cash-receivable",
      kind: "APPLICATION_LEDGER",
      applicationNodeId: "app:cash-receipt",
      ledgerNodeId: "ledger:receivable",
      source: {
        kind: "BUSINESS_RULE",
        sourceRef: "cash-receipt-settles-receivable"
      }
    }, {
      relationId: "purchase-inventory",
      kind: "APPLICATION_LEDGER",
      applicationNodeId: "app:purchase",
      ledgerNodeId: "ledger:inventory",
      source: {
        kind: "BUSINESS_RULE",
        sourceRef: "purchase-receipt-to-inventory"
      }
    }],
    enterpriseRelations: [],
    createdAt: "2026-10-06T12:00:00.000Z",
    updatedAt: "2026-10-06T12:00:00.000Z"
  };
}

function fakeGraphService(graph) {
  return {
    get(input) {
      if (
        input.enterpriseId !== graph.enterpriseId
        || input.graphId !== graph.graphId
      ) {
        throw new Error("EOG_GRAPH_NOT_FOUND");
      }
      return structuredClone(graph);
    }
  };
}

function definitionActionRequest(values) {
  return {
    contractVersion: "0.1.0",
    type: "command",
    command: {
      code: EOG_2D_DESIGNER_DEFINITION_PROJECTION_GET_ACTION,
      inputVersion: "0.1.0"
    },
    values,
    sourceInteractionId: "projection-agent-editor-open",
    actionId: "projection.read",
    requiresConfirmation: false
  };
}

function operatingGraphReadRequest() {
  return {
    contractVersion: "0.1.0",
    type: "command",
    command: {
      code: EOG_VIEW_GET_ACTION,
      inputVersion: "0.1.0"
    },
    values: { resourceId: graphId },
    sourceInteractionId: "operating-graph-editor-open",
    actionId: "graph.read",
    requiresConfirmation: false
  };
}

function toolCatalog(registrations) {
  return {
    list() {
      return registrations
        .filter(item => item.available?.() ?? true)
        .map(item => structuredClone(item.descriptor));
    },
    async invoke(call, observations) {
      const registration = registrations.find(
        item => item.descriptor.id === call.tool
      );
      if (!registration || !(registration.available?.() ?? true)) {
        return {
          tool: call.tool,
          ok: false,
          error: {
            code: "AGENT_TOOL_UNAVAILABLE",
            message: "Tool unavailable"
          }
        };
      }
      try {
        return {
          tool: call.tool,
          ok: true,
          result: await registration.execute(call.arguments, observations)
        };
      } catch (error) {
        return {
          tool: call.tool,
          ok: false,
          error: {
            code: "TEST_TOOL_FAILED",
            message: error instanceof Error ? error.message : String(error)
          }
        };
      }
    }
  };
}

function salesToCashModel(expectedKind) {
  let modelStep = 0;
  return {
    get modelStep() {
      return modelStep;
    },
    async decide(input) {
      modelStep += 1;
      if (modelStep === 1) {
        assert.equal(input.userMessage, "帮我裁剪出从销售到收款的投影");
        assert.ok(
          input.tools.some(tool =>
            tool.id === "enterprise.current_2d_editor.get"
          )
        );
        assert.ok(
          input.tools.some(tool =>
            tool.id === "enterprise.current_2d_editor.crop"
          )
        );
        return {
          type: "tool",
          call: {
            tool: "enterprise.current_2d_editor.get",
            arguments: {}
          }
        };
      }
      if (modelStep === 2) {
        const material = input.observations.find(
          item =>
            item.tool === "enterprise.current_2d_editor.get"
            && item.ok
        )?.result;
        assert.ok(material);
        assert.equal(material.currentEditor.kind, expectedKind);
        assert.match(material.writeToken, /^(0|[1-9][0-9]*)$/);
        const ids = new Set(material.nodes.map(node => node.id));
        for (const id of [
          "app:sales-order",
          "ledger:receivable",
          "app:cash-receipt"
        ]) {
          assert.equal(ids.has(id), true);
        }
        const wantedEdges = material.edges
          .filter(edge =>
            [
              "app:sales-order",
              "ledger:receivable",
              "app:cash-receipt"
            ].includes(edge.source)
            && [
              "app:sales-order",
              "ledger:receivable",
              "app:cash-receipt"
            ].includes(edge.target)
          )
          .map(edge => edge.id);
        return {
          type: "tool",
          call: {
            tool: "enterprise.current_2d_editor.crop",
            arguments: {
              visibleNodeIds: [
                "app:sales-order",
                "ledger:receivable",
                "app:cash-receipt"
              ],
              visibleEdgeIds: wantedEdges,
              expectedWriteToken: material.writeToken,
              rationale: "根据当前素材保留销售、应收与收款相关节点及关系。"
            }
          }
        };
      }
      return {
        type: "final",
        message: "已根据当前 2D 编辑器素材裁剪销售到收款视图。"
      };
    }
  };
}

test("opening a qualified Definition Projection Editor establishes the unified current 2D editor", async () => {
  const repository = fakeRepository();
  const projectionStore = createMemoryDefinitionProjectionStoreV010();
  const projectionSessions = createMemoryDefinitionProjectionSessionStoreV010();
  const currentEditors = createMemoryCurrent2dEditorSessionStoreV010();

  const handlers = createEnterpriseDefinitionProjectionEditorActionHandlersV010({
    repository,
    projectionStore,
    source: artifactSource(),
    sessions: projectionSessions,
    canAccessEnterprise: () => true,
    canManageEnterprise: () => true,
    authorizeProjectionSave: async () => {},
    locale: () => "zh-CN",
    onEditorRead(context, target) {
      currentEditors.set(context.principal.sessionId, {
        contractVersion: "0.1.0",
        kind: "DEFINITION_PROJECTION",
        enterpriseId: target.enterpriseId,
        definitionId: target.definitionId,
        definitionRevision: target.definitionRevision,
        projectionId: target.projectionId,
        resourceId: target.resourceId,
        selectedAt: "2026-10-06T12:00:00.000Z"
      });
    }
  });

  const read = handlers.find(
    item => item.commandCode === EOG_2D_DESIGNER_DEFINITION_PROJECTION_GET_ACTION
  );
  assert.ok(read);

  const result = await read.execute(
    definitionActionRequest({
      enterpriseId,
      definitionId,
      definitionRevision,
      projectionId
    }),
    requestContext()
  );

  assert.equal(result.ok, true);
  assert.equal(
    currentEditors.get("session-a").kind,
    "DEFINITION_PROJECTION"
  );
  assert.equal(
    currentEditors.get("session-a").resourceId,
    "enterprise-definition:ent-a:ledger:main@0#projection:main"
  );
});

test("the same Personal Agent current-2D tools crop a Definition Projection without mouse interaction", async () => {
  const repository = fakeRepository();
  const projectionStore = createMemoryDefinitionProjectionStoreV010();
  const currentEditors = createMemoryCurrent2dEditorSessionStoreV010();
  currentEditors.set("session-a", {
    contractVersion: "0.1.0",
    kind: "DEFINITION_PROJECTION",
    enterpriseId,
    definitionId,
    definitionRevision,
    projectionId,
    resourceId:
      "enterprise-definition:ent-a:ledger:main@0#projection:main",
    selectedAt: "2026-10-06T12:00:00.000Z"
  });

  const viewService = createEogViewStateProviderV010({
    store: createMemoryEogViewStateStoreV010()
  });
  const invalidations = [];
  const registrations = createCurrent2dEditorAgentToolRegistrationsV010({
    currentEditors,
    graphService: fakeGraphService(operatingGraph()),
    graphViewService: viewService,
    definitionRepository: repository,
    definitionProjectionStore: projectionStore,
    definitionProjectionSource: artifactSource(),
    principal: principal(),
    context: resolvedContext(),
    locale: "zh-CN",
    canAccessEnterprise: () => true,
    canManageEnterprise: () => true,
    onEditorUpdated(update) {
      invalidations.push(structuredClone(update));
    },
    now: () => new Date("2026-10-06T12:01:00.000Z")
  });

  const model = salesToCashModel("DEFINITION_PROJECTION");
  const runtime = createEnterpriseAgentRuntime(
    model,
    toolCatalog(registrations),
    4
  );
  const before = structuredClone(repository.getLatest({
    enterpriseId,
    definitionId
  }));

  const reply = await runtime.chat(
    "帮我裁剪出从销售到收款的投影",
    resolvedContext(),
    principal()
  );

  assert.match(reply.message, /销售到收款/);
  assert.equal(model.modelStep, 3);

  const gallery = projectionStore.get({
    enterpriseId,
    definitionId,
    definitionRevision
  });
  const projection = gallery.projections.find(
    item => item.projectionId === projectionId
  );
  assert.deepEqual(
    new Set(projection.view.hiddenNodeIds),
    new Set(["ledger:inventory", "app:purchase"])
  );
  assert.deepEqual(
    new Set(projection.view.hiddenEdgeIds),
    new Set(["edge:purchase-inventory"])
  );
  assert.match(
    projection.thumbnail.src,
    /^data:image\/svg\+xml;charset=UTF-8,/
  );
  assert.deepEqual(
    repository.getLatest({ enterpriseId, definitionId }),
    before
  );
  assert.equal(invalidations.length, 1);
  assert.equal(
    invalidations[0].resourceId,
    "enterprise-definition:ent-a:ledger:main@0#projection:main"
  );
});

test("opening /operating-graph establishes the Operating Graph as the same unified current 2D editor", async () => {
  const graph = operatingGraph();
  const graphService = fakeGraphService(graph);
  const viewService = createEogViewStateProviderV010({
    store: createMemoryEogViewStateStoreV010()
  });
  const currentEditors = createMemoryCurrent2dEditorSessionStoreV010();

  const handlers = createEnterpriseOperatingGraphViewActionHandlersV010({
    service: graphService,
    viewService,
    resolveAuthorizationProvider: () => undefined,
    inspectorResolver: {},
    locale: () => "zh-CN",
    onEditorRead(context, target) {
      currentEditors.set(context.principal.sessionId, {
        contractVersion: "0.1.0",
        kind: "OPERATING_GRAPH",
        enterpriseId: target.enterpriseId,
        graphId: target.graphId,
        resourceId: target.resourceId,
        selectedAt: "2026-10-06T12:02:00.000Z"
      });
    }
  });
  const read = handlers.find(item => item.commandCode === EOG_VIEW_GET_ACTION);
  assert.ok(read);

  const result = await read.execute(
    operatingGraphReadRequest(),
    requestContext()
  );

  assert.equal(result.ok, true);
  assert.equal(currentEditors.get("session-a").kind, "OPERATING_GRAPH");
  assert.equal(currentEditors.get("session-a").resourceId, graphId);
});

test("the same Personal Agent request directly crops the current /operating-graph view without semantic mutation", async () => {
  const graph = operatingGraph();
  const graphService = fakeGraphService(graph);
  const viewService = createEogViewStateProviderV010({
    store: createMemoryEogViewStateStoreV010(),
    now: () => new Date("2026-10-06T12:03:00.000Z")
  });
  viewService.ensure({
    enterpriseId,
    graphId,
    kind: "DIAGRAM_2D"
  });

  const currentEditors = createMemoryCurrent2dEditorSessionStoreV010();
  currentEditors.set("session-a", {
    contractVersion: "0.1.0",
    kind: "OPERATING_GRAPH",
    enterpriseId,
    graphId,
    resourceId: graphId,
    selectedAt: "2026-10-06T12:03:00.000Z"
  });

  const invalidations = [];
  const registrations = createCurrent2dEditorAgentToolRegistrationsV010({
    currentEditors,
    graphService,
    graphViewService: viewService,
    definitionRepository: fakeRepository(),
    definitionProjectionStore: createMemoryDefinitionProjectionStoreV010(),
    definitionProjectionSource: artifactSource(),
    principal: principal(),
    context: resolvedContext(),
    locale: "zh-CN",
    canAccessEnterprise: () => true,
    canManageEnterprise: () => true,
    onEditorUpdated(update) {
      invalidations.push(structuredClone(update));
    },
    now: () => new Date("2026-10-06T12:04:00.000Z")
  });

  const model = salesToCashModel("OPERATING_GRAPH");
  const runtime = createEnterpriseAgentRuntime(
    model,
    toolCatalog(registrations),
    4
  );

  const reply = await runtime.chat(
    "帮我裁剪出从销售到收款的投影",
    resolvedContext(),
    principal()
  );

  assert.match(reply.message, /销售到收款/);
  assert.equal(model.modelStep, 3);

  const view = viewService.list({
    enterpriseId,
    graphId
  })[0];
  assert.equal(view.revision, 1);
  assert.deepEqual(
    new Set(view.hiddenNodeIds),
    new Set(["app:purchase", "ledger:inventory"])
  );
  assert.deepEqual(
    new Set(view.hiddenEdgeIds),
    new Set(["guidance-edge:purchase-inventory"])
  );

  assert.equal(
    graphService.get({ enterpriseId, graphId }).revision,
    7
  );
  assert.equal(invalidations.length, 1);
  assert.equal(invalidations[0].resourceId, graphId);
  assert.equal(invalidations[0].target.kind, "OPERATING_GRAPH");
});


test("Personal context does not hide current enterprise 2D editor tools", async () => {
  const graph = operatingGraph();
  const graphService = fakeGraphService(graph);
  const viewService = createEogViewStateProviderV010({
    store: createMemoryEogViewStateStoreV010(),
    now: () => new Date("2026-10-06T13:20:00.000Z")
  });
  viewService.ensure({
    enterpriseId,
    graphId,
    kind: "DIAGRAM_2D"
  });

  const currentEditors = createMemoryCurrent2dEditorSessionStoreV010();
  currentEditors.set("session-a", {
    contractVersion: "0.1.0",
    kind: "OPERATING_GRAPH",
    enterpriseId,
    graphId,
    resourceId: graphId,
    selectedAt: "2026-10-06T13:20:00.000Z"
  });

  const registrations = createCurrent2dEditorAgentToolRegistrationsV010({
    currentEditors,
    graphService,
    graphViewService: viewService,
    definitionRepository: fakeRepository(),
    definitionProjectionStore: createMemoryDefinitionProjectionStoreV010(),
    definitionProjectionSource: artifactSource(),
    principal: principal(),
    context: personalResolvedContext(),
    locale: "zh-CN",
    canAccessEnterprise: (_principal, candidateEnterpriseId) =>
      candidateEnterpriseId === enterpriseId,
    canManageEnterprise: (_principal, candidateEnterpriseId) =>
      candidateEnterpriseId === enterpriseId,
    now: () => new Date("2026-10-06T13:21:00.000Z")
  });

  const listed = toolCatalog(registrations).list();
  assert.equal(
    listed.some(tool => tool.id === "enterprise.current_2d_editor.get"),
    true
  );
  assert.equal(
    listed.some(tool => tool.id === "enterprise.current_2d_editor.crop"),
    true
  );

  const model = salesToCashModel("OPERATING_GRAPH");
  const runtime = createEnterpriseAgentRuntime(
    model,
    toolCatalog(registrations),
    4
  );

  const reply = await runtime.chat(
    "帮我裁剪出从销售到收款的投影",
    personalResolvedContext(),
    principal()
  );

  assert.match(reply.message, /销售到收款/);
  assert.equal(model.modelStep, 3);

  const view = viewService.list({
    enterpriseId,
    graphId
  })[0];
  assert.deepEqual(
    new Set(view.hiddenNodeIds),
    new Set(["app:purchase", "ledger:inventory"])
  );
  assert.deepEqual(
    new Set(view.hiddenEdgeIds),
    new Set(["guidance-edge:purchase-inventory"])
  );
});

test("current enterprise 2D editor tools stay hidden when principal lacks editor-enterprise access", () => {
  const currentEditors = createMemoryCurrent2dEditorSessionStoreV010();
  currentEditors.set("session-a", {
    contractVersion: "0.1.0",
    kind: "OPERATING_GRAPH",
    enterpriseId,
    graphId,
    resourceId: graphId,
    selectedAt: "2026-10-06T13:22:00.000Z"
  });
  const registrations = createCurrent2dEditorAgentToolRegistrationsV010({
    currentEditors,
    graphService: fakeGraphService(operatingGraph()),
    graphViewService: createEogViewStateProviderV010({
      store: createMemoryEogViewStateStoreV010()
    }),
    definitionRepository: fakeRepository(),
    definitionProjectionStore: createMemoryDefinitionProjectionStoreV010(),
    definitionProjectionSource: artifactSource(),
    principal: principal(),
    context: personalResolvedContext(),
    canAccessEnterprise: () => false,
    canManageEnterprise: () => false
  });

  assert.equal(toolCatalog(registrations).list().length, 0);
});
