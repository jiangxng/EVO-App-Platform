import test from "node:test";
import assert from "node:assert/strict";

import {
  createMemoryBusinessDefinitionRepositoryV010
} from "../../dist/providers/enterprise-context/business-definitions.js";
import {
  createEnterpriseDefinitionProjectionArtifactSourceV010
} from "../../dist/providers/enterprise-context/definition-projection.js";
import {
  createMemoryDefinitionProjectionSessionStoreV010
} from "../../dist/contracts/definition-projection.js";
import {
  ledgerRuntimeBaselineBundleV010
} from "../../dist/apps/template-store/seed-records.js";
import {
  createEnterpriseDefinitionProjectionEditorActionHandlersV010,
  createEnterpriseDefinitionProjectionEditorPageV010
} from "../../dist/apps/eog-2d-designer/definition-projection-editor.js";
import {
  EOG_2D_DESIGNER_DEFINITION_PROJECTION_GET_ACTION,
  EOG_2D_DESIGNER_DEFINITION_PROJECTION_SAVE_ACTION
} from "../../dist/apps/eog-2d-designer/package.js";

function seeded() {
  const repository = createMemoryBusinessDefinitionRepositoryV010();
  const bundle = ledgerRuntimeBaselineBundleV010;
  const revision = repository.createDraft({
    enterpriseId: "ent-a",
    definitionId: "ledger:main",
    kind: bundle.definition.kind,
    title: bundle.definition.title,
    payload: structuredClone(bundle.definition.payload),
    projectionGallery: structuredClone(bundle.definition.projectionGallery),
    actor: { actorType: "HUMAN", subjectId: "owner-a" },
    recordedAt: "2026-10-06T00:00:00.000Z",
    origin: {
      type: "TEMPLATE_COPY",
      sourceRef: "template-store:evo-ledger-runtime-baseline@3"
    }
  });
  const projectionId = revision.projectionGallery.primaryProjectionId;
  return { repository, revision, projectionId };
}

function context() {
  return {
    contractVersion: "0.1.0",
    principal: {
      contractVersion: "0.1.0",
      subjectId: "owner-a",
      actorType: "HUMAN",
      identityProviderId: "test.identity",
      sessionId: "session-a"
    },
    scope: {
      contractVersion: "0.1.0",
      enterpriseId: "ent-a"
    },
    context: {
      contractVersion: "0.1.0",
      personalContext: {
        contractVersion: "0.1.0",
        kind: "PERSONAL",
        contextId: "personal:owner-a"
      },
      activeContext: {
        contractVersion: "0.1.0",
        kind: "ENTERPRISE",
        contextId: "enterprise:ent-a",
        enterpriseId: "ent-a"
      }
    },
    locale: "zh-CN",
    correlationId: "projection-editor-test"
  };
}

function actionRequest(command, values) {
  return {
    contractVersion: "0.1.0",
    type: "command",
    command: { code: command, inputVersion: "0.1.0" },
    values,
    sourceInteractionId: "projection-editor-test",
    actionId: command,
    requiresConfirmation: false
  };
}

test("Definition Projection Viewer-to-Editor page exposes direct edit workflow", () => {
  const page = createEnterpriseDefinitionProjectionEditorPageV010({
    enterpriseId: "ent-a",
    definitionId: "ledger:main",
    definitionRevision: 0,
    projectionId: "projection:main",
    title: "完整账本运行时",
    camera: {
      scale: 1.1,
      translateX: 12,
      translateY: -8
    },
    locale: "zh-CN"
  });

  assert.equal(page.kind, "diagram-workspace");
  assert.equal(page.operationCommand.code, EOG_2D_DESIGNER_DEFINITION_PROJECTION_SAVE_ACTION);
  assert.equal(page.viewInteraction.localNodeDrag, true);
  assert.equal(page.toolbarActions[0].label, "返回查看");
  assert.equal(page.initialCamera.scale, 1.1);
});

test("Saving a projection appends a new definition revision without changing business payload", async () => {
  const { repository, revision, projectionId } = seeded();
  const source = createEnterpriseDefinitionProjectionArtifactSourceV010(repository);
  const sessions = createMemoryDefinitionProjectionSessionStoreV010();
  sessions.set("session-a", {
    contractVersion: "0.1.0",
    enterpriseId: "ent-a",
    definitionId: "ledger:main",
    definitionRevision: 0,
    projectionId,
    selectedAt: "2026-10-06T00:01:00.000Z"
  });

  const handlers = createEnterpriseDefinitionProjectionEditorActionHandlersV010({
    repository,
    source,
    sessions,
    canManageEnterpriseContext: () => true,
    authorizeProjectionSave: async () => {},
    locale: () => "zh-CN",
    now: () => new Date("2026-10-06T00:02:00.000Z")
  });

  const read = handlers.find(
    item => item.commandCode === EOG_2D_DESIGNER_DEFINITION_PROJECTION_GET_ACTION
  );
  const save = handlers.find(
    item => item.commandCode === EOG_2D_DESIGNER_DEFINITION_PROJECTION_SAVE_ACTION
  );
  assert.ok(read);
  assert.ok(save);

  const readResult = await read.execute(
    actionRequest(EOG_2D_DESIGNER_DEFINITION_PROJECTION_GET_ACTION, {}),
    context()
  );
  assert.equal(readResult.ok, true);
  assert.equal(readResult.result.revision, 0);
  assert.equal(
    readResult.result.actions.some(action => action.id === "projection.save"),
    true
  );

  const nodes = readResult.result.nodes;
  const placements = nodes.map((node, index) => ({
    nodeId: node.id,
    x: node.x + 20 + index,
    y: node.y + 10
  }));
  const beforePayload = structuredClone(revision.payload);
  const beforeGallery = structuredClone(revision.projectionGallery);

  const saveResult = await save.execute(
    actionRequest(
      EOG_2D_DESIGNER_DEFINITION_PROJECTION_SAVE_ACTION,
      {
        expectedRevision: 0,
        operation: { type: "SAVE_PROJECTION_VIEW" },
        viewState: {
          placements,
          camera: {
            scale: 1.25,
            translateX: 18,
            translateY: -12
          }
        }
      }
    ),
    context()
  );

  assert.equal(saveResult.ok, true);
  assert.equal(saveResult.result.revision, 1);
  assert.match(saveResult.result.notice, /投影已保存/);

  const latest = repository.getLatest({
    enterpriseId: "ent-a",
    definitionId: "ledger:main"
  });
  assert.equal(latest.revision, 1);
  assert.equal(latest.state, "DRAFT");
  assert.deepEqual(latest.payload, beforePayload);
  assert.deepEqual(
    repository.listHistory({
      enterpriseId: "ent-a",
      definitionId: "ledger:main"
    })[0].projectionGallery,
    beforeGallery
  );

  const projection = latest.projectionGallery.projections.find(
    item => item.projectionId === projectionId
  );
  assert.deepEqual(projection.view.camera, {
    scale: 1.25,
    translateX: 18,
    translateY: -12
  });
  for (const placement of placements) {
    assert.deepEqual(
      projection.view.placements.find(item => item.nodeId === placement.nodeId),
      placement
    );
  }

  assert.equal(sessions.get("session-a").definitionRevision, 1);
});

test("Projection save refuses to branch silently from a stale historical revision", async () => {
  const { repository, projectionId } = seeded();
  repository.reviseDraft({
    enterpriseId: "ent-a",
    definitionId: "ledger:main",
    expectedRevision: 0,
    title: "new revision",
    payload: structuredClone(repository.getLatest({
      enterpriseId: "ent-a",
      definitionId: "ledger:main"
    }).payload),
    actor: { actorType: "HUMAN", subjectId: "owner-a" },
    recordedAt: "2026-10-06T00:03:00.000Z"
  });

  const sessions = createMemoryDefinitionProjectionSessionStoreV010();
  sessions.set("session-a", {
    contractVersion: "0.1.0",
    enterpriseId: "ent-a",
    definitionId: "ledger:main",
    definitionRevision: 0,
    projectionId,
    selectedAt: "2026-10-06T00:01:00.000Z"
  });
  const handlers = createEnterpriseDefinitionProjectionEditorActionHandlersV010({
    repository,
    source: createEnterpriseDefinitionProjectionArtifactSourceV010(repository),
    sessions,
    canManageEnterpriseContext: () => true,
    authorizeProjectionSave: async () => {}
  });
  const save = handlers.find(
    item => item.commandCode === EOG_2D_DESIGNER_DEFINITION_PROJECTION_SAVE_ACTION
  );

  const result = await save.execute(
    actionRequest(
      EOG_2D_DESIGNER_DEFINITION_PROJECTION_SAVE_ACTION,
      {
        expectedRevision: 0,
        operation: { type: "SAVE_PROJECTION_VIEW" },
        viewState: {
          placements: [],
          camera: { scale: 1, translateX: 0, translateY: 0 }
        }
      }
    ),
    context()
  );

  assert.equal(result.ok, false);
  assert.equal(result.error.code, "DEFINITION_PROJECTION_REVISION_CONFLICT");
});
