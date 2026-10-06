import test from "node:test";
import assert from "node:assert/strict";

import {
  createMemoryDefinitionProjectionStoreV010
} from "../../dist/providers/enterprise-context/definition-projection-store.js";
import {
  createMemoryDefinitionProjectionSessionStoreV010
} from "../../dist/contracts/definition-projection.js";
import {
  createEnterpriseDefinitionProjectionEditorActionHandlersV010
} from "../../dist/apps/eog-2d-designer/definition-projection-editor.js";
import {
  createDefinitionProjectionAgentToolRegistrationsV010
} from "../../dist/apps/eog-2d-designer/definition-projection-agent-tools.js";
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
    correlationId: "projection-agent-test"
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

function actionRequest(values) {
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

function toolCatalog(registrations) {
  return {
    list() {
      return registrations.map(item => structuredClone(item.descriptor));
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

test("opening a qualified 2D Projection Editor establishes the current Projection for Personal Agent", async () => {
  const repository = fakeRepository();
  const projectionStore = createMemoryDefinitionProjectionStoreV010();
  const sessions = createMemoryDefinitionProjectionSessionStoreV010();
  const handlers = createEnterpriseDefinitionProjectionEditorActionHandlersV010({
    repository,
    projectionStore,
    source: artifactSource(),
    sessions,
    canManageEnterpriseContext: () => true,
    authorizeProjectionSave: async () => {},
    locale: () => "zh-CN",
    now: () => new Date("2026-10-06T12:00:00.000Z")
  });
  const read = handlers.find(
    item => item.commandCode === EOG_2D_DESIGNER_DEFINITION_PROJECTION_GET_ACTION
  );
  assert.ok(read);
  assert.equal(sessions.get("session-a"), undefined);

  const result = await read.execute(
    actionRequest({
      enterpriseId,
      definitionId,
      definitionRevision,
      projectionId
    }),
    requestContext()
  );

  assert.equal(result.ok, true);
  assert.deepEqual(
    {
      enterpriseId: sessions.get("session-a").enterpriseId,
      definitionId: sessions.get("session-a").definitionId,
      definitionRevision: sessions.get("session-a").definitionRevision,
      projectionId: sessions.get("session-a").projectionId
    },
    {
      enterpriseId,
      definitionId,
      definitionRevision,
      projectionId
    }
  );
});

test("Personal Agent can crop the current editor from sales to cash without mouse interaction", async () => {
  const repository = fakeRepository();
  const projectionStore = createMemoryDefinitionProjectionStoreV010();
  const sessions = createMemoryDefinitionProjectionSessionStoreV010();
  sessions.set("session-a", {
    contractVersion: "0.1.0",
    enterpriseId,
    definitionId,
    definitionRevision,
    projectionId,
    selectedAt: "2026-10-06T12:00:00.000Z"
  });

  const invalidations = [];
  const registrations = createDefinitionProjectionAgentToolRegistrationsV010({
    repository,
    projectionStore,
    source: artifactSource(),
    sessions,
    principal: principal(),
    context: resolvedContext(),
    locale: "zh-CN",
    canManageEnterpriseContext: () => true,
    onProjectionUpdated(update) {
      invalidations.push(structuredClone(update));
    },
    now: () => new Date("2026-10-06T12:01:00.000Z")
  });

  let modelStep = 0;
  const model = {
    async decide(input) {
      modelStep += 1;
      if (modelStep === 1) {
        assert.equal(input.userMessage, "帮我裁剪出从销售到收款的投影");
        assert.ok(
          input.tools.some(tool =>
            tool.id === "enterprise.definition_projection.current.get"
          )
        );
        return {
          type: "tool",
          call: {
            tool: "enterprise.definition_projection.current.get",
            arguments: {}
          }
        };
      }
      if (modelStep === 2) {
        const material = input.observations.find(
          item =>
            item.tool === "enterprise.definition_projection.current.get"
            && item.ok
        )?.result;
        assert.ok(material);
        const byLabel = new Map(
          material.nodes.map(node => [node.label, node.id])
        );
        const edgeByLabel = new Map(
          material.edges.map(edge => [edge.label, edge.id])
        );
        return {
          type: "tool",
          call: {
            tool: "enterprise.definition_projection.current.crop",
            arguments: {
              visibleNodeIds: [
                byLabel.get("销售订单"),
                byLabel.get("应收账款"),
                byLabel.get("销售收款")
              ],
              visibleEdgeIds: [
                edgeByLabel.get("形成应收"),
                edgeByLabel.get("收款核销")
              ],
              rationale: "保留销售订单形成应收并完成销售收款的连续业务链。"
            }
          }
        };
      }
      return {
        type: "final",
        message: "已按当前素材裁剪为销售到收款的投影，并直接更新当前编辑器。"
      };
    }
  };

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
  assert.equal(modelStep, 3);

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
  assert.notEqual(
    projection.thumbnail.src,
    initialGallery().projections[0].thumbnail.src
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
  assert.deepEqual(
    invalidations[0].visibleNodeIds,
    ["app:sales-order", "ledger:receivable", "app:cash-receipt"]
  );
});
