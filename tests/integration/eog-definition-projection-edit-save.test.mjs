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
  createEnterpriseDefinition2dPreviewPageV010
} from "../../dist/apps/eog-2d-viewer/definition-preview.js";
import {
  createEnterpriseDefinitionProjectionEditorPageV010,
  createEnterpriseDefinitionProjectionEditorReadActionV010,
  createEnterpriseDefinitionProjectionSaveActionV010
} from "../../dist/apps/eog-2d-designer/definition-projection-editor.js";
import {
  EOG_2D_DESIGNER_DEFINITION_PROJECTION_ROUTE
} from "../../dist/apps/eog-2d/package.js";

function seededRepository() {
  const repository = createMemoryBusinessDefinitionRepositoryV010();
  const bundle = ledgerRuntimeBaselineBundleV010;
  repository.createDraft({
    enterpriseId: "ent-a",
    definitionId: "ledger:main",
    kind: bundle.definition.kind,
    title: bundle.definition.title,
    payload: structuredClone(bundle.definition.payload),
    projectionGallery: structuredClone(bundle.definition.projectionGallery),
    actor: {
      actorType: "HUMAN",
      subjectId: "owner-a"
    },
    recordedAt: "2026-10-06T00:00:00.000Z",
    origin: {
      type: "TEMPLATE_COPY",
      sourceRef: "template-store:evo-ledger-runtime-baseline@3"
    }
  });
  return repository;
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
      enterpriseId: "ent-a",
      userId: "owner-a"
    },
    context: {
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
        enterpriseId: "ent-a"
      },
      enterpriseContext: {
        contractVersion: "0.1.0",
        kind: "ENTERPRISE",
        contextId: "enterprise:ent-a",
        enterpriseId: "ent-a",
        enterpriseProviderId: "test.enterprise",
        lifecycleState: "ACTIVE"
      }
    },
    correlationId: "projection-edit-test",
    locale: "zh-CN"
  };
}

function request(values) {
  return {
    contractVersion: "0.1.0",
    type: "command",
    command: {
      code: "evo-eog-2d.designer.definition-projection.save",
      inputVersion: "0.1.0"
    },
    values,
    sourceInteractionId: "projection-editor-test",
    actionId: "projection.save",
    requiresConfirmation: false
  };
}

function allowingAuthorization() {
  return {
    providerId: "test.authorization",
    check() {
      return {
        contractVersion: "0.1.0",
        allowed: true,
        policyProviderId: "test.authorization",
        reasonCodes: ["TEST_ALLOW"]
      };
    }
  };
}

function saveHandler(repository, sessions, options = {}) {
  const source = createEnterpriseDefinitionProjectionArtifactSourceV010(repository);
  return createEnterpriseDefinitionProjectionSaveActionV010({
    repository,
    source,
    projectionSessions: sessions,
    resolveAuthorizationProvider: () => allowingAuthorization(),
    canManageEnterpriseContext: options.canManage ?? (() => true),
    now: () => new Date(options.now ?? "2026-10-06T01:00:00.000Z")
  });
}

function capturedViewFor(repository, revision) {
  const source = createEnterpriseDefinitionProjectionArtifactSourceV010(repository);
  const artifact = source.get({
    enterpriseId: "ent-a",
    definitionId: "ledger:main",
    definitionRevision: revision,
    projectionId: "projection:main"
  });
  assert.ok(artifact?.diagram2d);
  const first = artifact.diagram2d.nodes[0];
  return {
    nodeId: first.id,
    beforeX: first.x,
    beforeY: first.y,
    viewState: {
      placements: [{
        nodeId: first.id,
        x: first.x + 135,
        y: first.y + 70
      }],
      camera: {
        scale: 1.2,
        translateX: 24,
        translateY: -18
      }
    }
  };
}

test("definition Viewer offers explicit projection edit handoff only when product allows it", () => {
  const editable = createEnterpriseDefinition2dPreviewPageV010({
    enterpriseId: "ent-a",
    definitionId: "ledger:main",
    definitionRevision: 0,
    projectionId: "projection:main",
    title: "完整账本运行时",
    locale: "zh-CN",
    editRoute: EOG_2D_DESIGNER_DEFINITION_PROJECTION_ROUTE
  });
  assert.equal(editable.title, "关系图 · 完整账本运行时");
  assert.deepEqual(editable.toolbarActions, [{
    id: "edit-projection",
    label: "编辑投影",
    route: "/definition-preview/2d/edit",
    primary: true
  }]);

  const viewOnly = createEnterpriseDefinition2dPreviewPageV010({
    enterpriseId: "ent-a",
    definitionId: "ledger:main",
    definitionRevision: 0,
    projectionId: "projection:main",
    title: "完整账本运行时",
    locale: "zh-CN"
  });
  assert.equal(viewOnly.toolbarActions, undefined);
});

test("Projection Editor is direct manipulation with one explicit captured-state save", async () => {
  const repository = seededRepository();
  const source = createEnterpriseDefinitionProjectionArtifactSourceV010(repository);
  const page = createEnterpriseDefinitionProjectionEditorPageV010({
    enterpriseId: "ent-a",
    definitionId: "ledger:main",
    definitionRevision: 0,
    projectionId: "projection:main",
    title: "完整账本运行时",
    locale: "zh-CN"
  });

  assert.equal(page.title, "编辑关系图 · 完整账本运行时");
  assert.equal(page.viewInteraction.localNodeDrag, true);
  assert.equal(page.operationCommand.code, "evo-eog-2d.designer.definition-projection.save");
  assert.equal(page.toolbarActions[0].label, "返回查看");

  const reader = createEnterpriseDefinitionProjectionEditorReadActionV010({ source });
  const read = await reader.execute({
    contractVersion: "0.1.0",
    type: "command",
    command: { ...page.readCommand },
    values: { ...page.requestValues, resourceId: page.resourceId },
    sourceInteractionId: page.id,
    actionId: "diagram.read",
    requiresConfirmation: false
  }, context());

  assert.equal(read.ok, true);
  assert.equal(read.result.lifecycleState, "PROJECTION_EDIT");
  assert.equal(read.result.actions.length, 1);
  assert.equal(read.result.actions[0].label, "保存投影");
  assert.equal(read.result.actions[0].captureViewState, true);
  assert.equal(read.result.nodes.every(node => node.readOnly === true), true);
});

test("saving a Draft projection appends one definition revision and preserves business payload", async () => {
  const repository = seededRepository();
  const sessions = createMemoryDefinitionProjectionSessionStoreV010();
  const before = repository.getLatest({
    enterpriseId: "ent-a",
    definitionId: "ledger:main"
  });
  assert.ok(before);
  const captured = capturedViewFor(repository, 0);

  const result = await saveHandler(repository, sessions).execute(
    request({
      enterpriseId: "ent-a",
      definitionId: "ledger:main",
      definitionRevision: 0,
      projectionId: "projection:main",
      expectedRevision: 0,
      operation: { type: "SAVE_PROJECTION_VIEW" },
      viewState: captured.viewState,
      resourceId: "enterprise-definition:ent-a:ledger:main#projection:main:edit"
    }),
    context()
  );

  assert.equal(result.ok, true);
  assert.equal(result.result.revision, 1);

  const latest = repository.getLatest({
    enterpriseId: "ent-a",
    definitionId: "ledger:main"
  });
  assert.ok(latest);
  assert.equal(latest.revision, 1);
  assert.equal(latest.state, "DRAFT");
  assert.deepEqual(latest.payload, before.payload);
  assert.deepEqual(
    repository.listHistory({
      enterpriseId: "ent-a",
      definitionId: "ledger:main"
    }).map(item => [item.revision, item.state]),
    [[0, "DRAFT"], [1, "DRAFT"]]
  );

  const original = repository.listHistory({
    enterpriseId: "ent-a",
    definitionId: "ledger:main"
  })[0];
  const originalPlacement = original.projectionGallery.projections[0].view
    .placements?.find(item => item.nodeId === captured.nodeId);
  assert.notDeepEqual(
    originalPlacement,
    captured.viewState.placements[0]
  );

  const savedProjection = latest.projectionGallery.projections.find(
    item => item.projectionId === "projection:main"
  );
  assert.deepEqual(
    savedProjection.view.placements.find(item => item.nodeId === captured.nodeId),
    captured.viewState.placements[0]
  );
  assert.deepEqual(savedProjection.view.camera, captured.viewState.camera);

  const projected = createEnterpriseDefinitionProjectionArtifactSourceV010(
    repository
  ).get({
    enterpriseId: "ent-a",
    definitionId: "ledger:main",
    definitionRevision: 1,
    projectionId: "projection:main"
  });
  const moved = projected.diagram2d.nodes.find(node => node.id === captured.nodeId);
  assert.equal(moved.x, captured.viewState.placements[0].x);
  assert.equal(moved.y, captured.viewState.placements[0].y);

  assert.equal(sessions.get("session-a").definitionRevision, 1);
  assert.equal(sessions.get("owner-a").definitionRevision, 1);
});

test("saving a Published projection begins a new Draft without mutating the effective revision", async () => {
  const repository = seededRepository();
  repository.publish({
    enterpriseId: "ent-a",
    definitionId: "ledger:main",
    expectedRevision: 0,
    actor: {
      actorType: "HUMAN",
      subjectId: "owner-a"
    },
    recordedAt: "2026-10-06T00:30:00.000Z"
  });
  const effectiveBefore = repository.getEffective({
    enterpriseId: "ent-a",
    definitionId: "ledger:main"
  });
  assert.equal(effectiveBefore.revision, 1);
  const captured = capturedViewFor(repository, 1);
  const sessions = createMemoryDefinitionProjectionSessionStoreV010();

  const result = await saveHandler(
    repository,
    sessions,
    { now: "2026-10-06T02:00:00.000Z" }
  ).execute(
    request({
      enterpriseId: "ent-a",
      definitionId: "ledger:main",
      definitionRevision: 1,
      projectionId: "projection:main",
      expectedRevision: 1,
      operation: { type: "SAVE_PROJECTION_VIEW" },
      viewState: captured.viewState,
      resourceId: "enterprise-definition:ent-a:ledger:main#projection:main:edit"
    }),
    context()
  );

  assert.equal(result.ok, true);
  const latest = repository.getLatest({
    enterpriseId: "ent-a",
    definitionId: "ledger:main"
  });
  const effectiveAfter = repository.getEffective({
    enterpriseId: "ent-a",
    definitionId: "ledger:main"
  });
  assert.equal(latest.revision, 2);
  assert.equal(latest.state, "DRAFT");
  assert.equal(effectiveAfter.revision, 1);
  assert.equal(effectiveAfter.state, "PUBLISHED");
  assert.deepEqual(effectiveAfter, effectiveBefore);
});

test("projection save fails closed for stale revision or missing management role", async () => {
  const repository = seededRepository();
  const sessions = createMemoryDefinitionProjectionSessionStoreV010();
  const captured = capturedViewFor(repository, 0);

  repository.reviseDraft({
    enterpriseId: "ent-a",
    definitionId: "ledger:main",
    expectedRevision: 0,
    title: repository.getLatest({
      enterpriseId: "ent-a",
      definitionId: "ledger:main"
    }).title,
    payload: repository.getLatest({
      enterpriseId: "ent-a",
      definitionId: "ledger:main"
    }).payload,
    actor: {
      actorType: "HUMAN",
      subjectId: "owner-a"
    },
    recordedAt: "2026-10-06T00:45:00.000Z"
  });

  const stale = await saveHandler(repository, sessions).execute(
    request({
      enterpriseId: "ent-a",
      definitionId: "ledger:main",
      definitionRevision: 0,
      projectionId: "projection:main",
      expectedRevision: 0,
      operation: { type: "SAVE_PROJECTION_VIEW" },
      viewState: captured.viewState,
      resourceId: "enterprise-definition:ent-a:ledger:main#projection:main:edit"
    }),
    context()
  );
  assert.equal(stale.ok, false);
  assert.equal(stale.error.code, "DEFINITION_PROJECTION_REVISION_CONFLICT");

  const unauthorized = await saveHandler(
    repository,
    sessions,
    { canManage: () => false }
  ).execute(
    request({
      enterpriseId: "ent-a",
      definitionId: "ledger:main",
      definitionRevision: 1,
      projectionId: "projection:main",
      expectedRevision: 1,
      operation: { type: "SAVE_PROJECTION_VIEW" },
      viewState: captured.viewState,
      resourceId: "enterprise-definition:ent-a:ledger:main#projection:main:edit"
    }),
    context()
  );
  assert.equal(unauthorized.ok, false);
  assert.equal(unauthorized.error.code, "DEFINITION_PROJECTION_MANAGE_ROLE_REQUIRED");
});
