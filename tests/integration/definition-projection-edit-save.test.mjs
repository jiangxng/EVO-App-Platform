import test from "node:test";
import assert from "node:assert/strict";

import {
  createMemoryBusinessDefinitionRepositoryV010
} from "../../dist/providers/enterprise-context/business-definitions.js";
import {
  createMemoryDefinitionProjectionStoreV010
} from "../../dist/providers/enterprise-context/definition-projection-store.js";
import {
  createEnterpriseDefinitionProjectionArtifactSourceV010
} from "../../dist/providers/enterprise-context/definition-projection.js";
import {
  createMemoryDefinitionProjectionSessionStoreV010,
  definition2dEditorRouteV010,
  definition2dPreviewRouteV010
} from "../../dist/contracts/definition-projection.js";
import {
  ledgerRuntimeBaselineBundleV010
} from "../../dist/apps/template-store/seed-records.js";
import {
  createEnterpriseDefinitionProjectionEditorActionHandlersV010,
  createEnterpriseDefinitionProjectionEditorPageV010
} from "../../dist/apps/eog-2d-designer/definition-projection-editor.js";
import {
  createEnterpriseDefinition2dPreviewPageV010
} from "../../dist/apps/eog-2d-viewer/definition-preview.js";
import {
  createLedgerManagerActionHandlersV010
} from "../../dist/apps/ledger-manager/actions.js";
import {
  EOG_2D_DESIGNER_DEFINITION_PROJECTION_GET_ACTION,
  EOG_2D_DESIGNER_DEFINITION_PROJECTION_SAVE_ACTION
} from "../../dist/apps/eog-2d-designer/package.js";
import {
  LEDGER_MANAGER_PREVIEW_PROJECTION_COMMAND
} from "../../dist/apps/ledger-manager/constants.js";
import {
  renderDiagramEditorPageShellToHtmlV010
} from "../../dist/vendor/eidos/src/diagram/surface.js";

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
  assert.equal(page.viewInteraction.localVisibilityReset, true);
  assert.equal(page.viewInteraction.localVisibilityResetLabel, "恢复全部");
  assert.equal(page.operationCommand.code, EOG_2D_DESIGNER_DEFINITION_PROJECTION_SAVE_ACTION);
  assert.equal(page.viewInteraction.localNodeDrag, true);
  assert.equal(page.viewInteraction.localSelectionHide, true);
  assert.equal(page.viewInteraction.localSelectionHideLabel, "从投影移除");
  assert.equal(page.toolbarActions, undefined);
  assert.equal(page.initialCamera.scale, 1.1);
});

test("EOG 2D uses the canvas-first professional diagram shell", () => {
  const page = createEnterpriseDefinitionProjectionEditorPageV010({
    enterpriseId: "ent-a",
    definitionId: "ledger:main",
    definitionRevision: 0,
    projectionId: "projection:main",
    title: "完整账本运行时",
    locale: "zh-CN"
  });
  const html = renderDiagramEditorPageShellToHtmlV010(page);

  assert.match(html, /data-eidos-diagram-canvas-wrap/);
  assert.match(html, /data-eidos-diagram-view-controls/);
  assert.match(html, /data-has-selection="false"/);
  assert.match(html, /height:calc\(100dvh - 112px\)/);
  assert.doesNotMatch(html, />Selection<\/strong>/);
});

test("EOG editor keeps unbounded drag, deselection and keyboard pruning from Eidos", async () => {
  const source = await import("node:fs/promises").then(fs =>
    fs.readFile(
      new URL("../../vendor/eidos/src/diagram/surface.ts", import.meta.url),
      "utf8"
    )
  );

  assert.match(
    source,
    /const nextX =\s*originalX \+ screenDeltaX \/ camera\.scale/
  );
  assert.match(
    source,
    /const nextY =\s*originalY \+ screenDeltaY \/ camera\.scale/
  );
  assert.doesNotMatch(source, /const nextX = Math\.max\(\s*0,/);
  assert.doesNotMatch(source, /const nextY = Math\.max\(\s*0,/);
  assert.match(source, /function clearSelection\(\): void/);
  assert.match(source, /canvas\.addEventListener\("click", clearSelectionOnCanvasClick\)/);
  assert.match(source, /event\.key === "Escape"/);
  assert.match(source, /event\.key === "Delete" \|\| event\.key === "Backspace"/);
  assert.match(source, /\["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"\]/);
  assert.match(source, /const step = event\.shiftKey \? 10 : 1/);
  assert.match(source, /event\.shiftKey && event\.code === "Digit1"/);
  assert.match(source, /event\.shiftKey && event\.code === "Digit2"/);
  assert.match(source, /commandOrControl && event\.code === "Digit0"/);
  assert.match(source, /fitSelectionToCanvas/);
});

test("Saving a projection overwrites presentation state without creating a definition revision", async () => {
  const { repository, revision, projectionId } = seeded();
  const projectionStore = createMemoryDefinitionProjectionStoreV010();
  const source = createEnterpriseDefinitionProjectionArtifactSourceV010(
    repository,
    projectionStore
  );
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
    projectionStore,
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
  assert.equal(
    readResult.result.actions.find(action => action.id === "projection.rename").label,
    "重命名投影"
  );
  assert.equal(
    readResult.result.actions.find(action => action.id === "projection.save").label,
    "保存投影"
  );

  const nodes = readResult.result.nodes;
  const hiddenNodeId = nodes[0].id;
  const hiddenEdgeId = readResult.result.edges.find(
    edge => edge.source !== hiddenNodeId && edge.target !== hiddenNodeId
  )?.id;
  const styledEdgeId = readResult.result.edges[0].id;
  const placements = nodes
    .filter(node => node.id !== hiddenNodeId)
    .map((node, index) => ({
      nodeId: node.id,
      x: index === 0 ? -180 : node.x + 20 + index,
      y: index === 0 ? -120 : node.y + 10
    }));
  const beforeDefinition = structuredClone(repository.getLatest({
    enterpriseId: "ent-a",
    definitionId: "ledger:main"
  }));

  const saveResult = await save.execute(
    actionRequest(
      EOG_2D_DESIGNER_DEFINITION_PROJECTION_SAVE_ACTION,
      {
        expectedRevision: 0,
        operation: { type: "SAVE_PROJECTION_VIEW" },
        viewState: {
          hiddenNodeIds: [hiddenNodeId],
          ...(hiddenEdgeId ? { hiddenEdgeIds: [hiddenEdgeId] } : {}),
          edgePaths: [{ edgeId: styledEdgeId, pathKind: "rounded-orthogonal",
            sourceAnchor: "right", targetAnchor: "left", waypoints: [{ x: -60, y: 120 }, { x: 90, y: 120 }] }],
          viewport: { width: 1180, height: 640 },
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
  assert.equal(saveResult.result.revision, 0);
  assert.match(saveResult.result.notice, /投影已保存/);
  assert.deepEqual(
    repository.getLatest({
      enterpriseId: "ent-a",
      definitionId: "ledger:main"
    }),
    beforeDefinition
  );
  assert.equal(
    repository.listHistory({
      enterpriseId: "ent-a",
      definitionId: "ledger:main"
    }).length,
    1
  );

  const gallery = projectionStore.get({
    enterpriseId: revision.enterpriseId,
    definitionId: revision.definitionId,
    definitionRevision: revision.revision
  });
  const projection = gallery.projections.find(
    item => item.projectionId === projectionId
  );
  assert.deepEqual(projection.view.camera, {
    scale: 1.25,
    translateX: 18,
    translateY: -12
  });
  assert.deepEqual(projection.view.hiddenNodeIds, [hiddenNodeId]);
  assert.deepEqual(projection.view.edgePaths, [
    { edgeId: styledEdgeId, pathKind: "rounded-orthogonal",
      sourceAnchor: "right", targetAnchor: "left",
      waypoints: [{ x: -60, y: 120 }, { x: 90, y: 120 }] }
  ]);
  assert.match(projection.thumbnail.src, /^data:image\/svg\+xml;charset=UTF-8,/);
  assert.match(projection.thumbnail.alt, /投影缩略图$/);
  if (hiddenEdgeId) {
    assert.deepEqual(projection.view.hiddenEdgeIds, [hiddenEdgeId]);
  }

  const projected = source.get({
    enterpriseId: "ent-a",
    definitionId: "ledger:main",
    definitionRevision: 0,
    projectionId
  });
  assert.ok(projected?.diagram2d);
  const fullProjection = source.get({
    enterpriseId: "ent-a", definitionId: "ledger:main",
    definitionRevision: 0, projectionId, includeHidden: true
  });
  assert.equal(
    fullProjection.diagram2d.edges.find(edge => edge.id === styledEdgeId).pathKind,
    "rounded-orthogonal"
  );
  assert.deepEqual(
    fullProjection.diagram2d.edges.find(edge => edge.id === styledEdgeId).waypoints,
    [{ x: -60, y: 120 }, { x: 90, y: 120 }]
  );
  assert.equal(fullProjection.diagram2d.edges.find(edge => edge.id === styledEdgeId).sourceAnchor, "right");
  assert.equal(fullProjection.diagram2d.edges.find(edge => edge.id === styledEdgeId).targetAnchor, "left");
  assert.equal(
    projected.diagram2d.nodes.some(node => node.id === hiddenNodeId),
    false
  );
  assert.equal(sessions.get("session-a").definitionRevision, 0);
});

test("Projection editor read/save survives without transient projection session state", async () => {
  const { repository, revision, projectionId } = seeded();
  const projectionStore = createMemoryDefinitionProjectionStoreV010();
  const source = createEnterpriseDefinitionProjectionArtifactSourceV010(
    repository,
    projectionStore
  );
  const sessions = createMemoryDefinitionProjectionSessionStoreV010();
  const handlers = createEnterpriseDefinitionProjectionEditorActionHandlersV010({
    repository,
    projectionStore,
    source,
    sessions,
    canManageEnterpriseContext: () => true,
    authorizeProjectionSave: async () => {},
    locale: () => "zh-CN",
    now: () => new Date("2026-10-06T00:04:00.000Z")
  });
  const read = handlers.find(
    item => item.commandCode === EOG_2D_DESIGNER_DEFINITION_PROJECTION_GET_ACTION
  );
  const save = handlers.find(
    item => item.commandCode === EOG_2D_DESIGNER_DEFINITION_PROJECTION_SAVE_ACTION
  );
  const identity = {
    enterpriseId: revision.enterpriseId,
    definitionId: revision.definitionId,
    definitionRevision: revision.revision,
    projectionId
  };
  const readResult = await read.execute(
    actionRequest(EOG_2D_DESIGNER_DEFINITION_PROJECTION_GET_ACTION, identity),
    context()
  );
  assert.equal(readResult.ok, true);

  const saveResult = await save.execute(
    actionRequest(
      EOG_2D_DESIGNER_DEFINITION_PROJECTION_SAVE_ACTION,
      {
        ...identity,
        expectedRevision: revision.revision,
        operation: { type: "SAVE_PROJECTION_VIEW" },
        viewState: {
          placements: readResult.result.nodes.map(node => ({
            nodeId: node.id,
            x: node.x,
            y: node.y
          })),
          camera: { scale: 1, translateX: 0, translateY: 0 }
        }
      }
    ),
    context()
  );
  assert.equal(saveResult.ok, true);
  assert.equal(saveResult.result.revision, revision.revision);
  assert.equal(
    saveResult.result.navigateTo,
    definition2dEditorRouteV010({
      definitionId: revision.definitionId,
      definitionRevision: revision.revision,
      projectionId
    })
  );
});

test("Restore all can reveal previously hidden projection items and persist that complete view", async () => {
  const { repository, revision, projectionId } = seeded();
  const projectionStore = createMemoryDefinitionProjectionStoreV010();
  const source = createEnterpriseDefinitionProjectionArtifactSourceV010(
    repository,
    projectionStore
  );
  const sessions = createMemoryDefinitionProjectionSessionStoreV010();
  const handlers = createEnterpriseDefinitionProjectionEditorActionHandlersV010({
    repository,
    projectionStore,
    source,
    sessions,
    canManageEnterpriseContext: () => true,
    authorizeProjectionSave: async () => {},
    locale: () => "zh-CN",
    now: () => new Date("2026-10-06T00:06:00.000Z")
  });
  const read = handlers.find(
    item => item.commandCode === EOG_2D_DESIGNER_DEFINITION_PROJECTION_GET_ACTION
  );
  const save = handlers.find(
    item => item.commandCode === EOG_2D_DESIGNER_DEFINITION_PROJECTION_SAVE_ACTION
  );
  const identity = {
    enterpriseId: revision.enterpriseId,
    definitionId: revision.definitionId,
    definitionRevision: revision.revision,
    projectionId
  };
  const initial = await read.execute(
    actionRequest(EOG_2D_DESIGNER_DEFINITION_PROJECTION_GET_ACTION, identity),
    context()
  );
  const hiddenNodeId = initial.result.nodes[0].id;

  const hidden = await save.execute(
    actionRequest(
      EOG_2D_DESIGNER_DEFINITION_PROJECTION_SAVE_ACTION,
      {
        ...identity,
        expectedRevision: revision.revision,
        operation: { type: "SAVE_PROJECTION_VIEW" },
        viewState: {
          hiddenNodeIds: [hiddenNodeId],
          hiddenEdgeIds: [],
          placements: initial.result.nodes
            .filter(node => node.id !== hiddenNodeId)
            .map(node => ({ nodeId: node.id, x: node.x, y: node.y })),
          camera: { scale: 1, translateX: 0, translateY: 0 }
        }
      }
    ),
    context()
  );
  assert.equal(hidden.ok, true);

  const afterHide = await read.execute(
    actionRequest(EOG_2D_DESIGNER_DEFINITION_PROJECTION_GET_ACTION, identity),
    context()
  );
  assert.deepEqual(afterHide.result.hiddenNodeIds, [hiddenNodeId]);

  const restored = await save.execute(
    actionRequest(
      EOG_2D_DESIGNER_DEFINITION_PROJECTION_SAVE_ACTION,
      {
        ...identity,
        expectedRevision: revision.revision,
        operation: { type: "SAVE_PROJECTION_VIEW" },
        viewState: {
          hiddenNodeIds: [],
          hiddenEdgeIds: [],
          placements: afterHide.result.nodes.map(node => ({
            nodeId: node.id,
            x: node.x,
            y: node.y
          })),
          camera: { scale: 1, translateX: 0, translateY: 0 }
        }
      }
    ),
    context()
  );
  assert.equal(restored.ok, true);

  const gallery = projectionStore.get({
    enterpriseId: revision.enterpriseId,
    definitionId: revision.definitionId,
    definitionRevision: revision.revision
  });
  const projection = gallery.projections.find(
    item => item.projectionId === projectionId
  );
  assert.equal(projection.view.hiddenNodeIds, undefined);
  assert.equal(projection.view.hiddenEdgeIds, undefined);
  assert.equal(
    repository.listHistory({
      enterpriseId: revision.enterpriseId,
      definitionId: revision.definitionId
    }).length,
    1
  );

  const visible = source.get({
    enterpriseId: revision.enterpriseId,
    definitionId: revision.definitionId,
    definitionRevision: revision.revision,
    projectionId
  });
  assert.equal(
    visible.diagram2d.nodes.some(node => node.id === hiddenNodeId),
    true
  );
});

test("Save as projection creates a new projection without creating a definition revision", async () => {
  const { repository, revision, projectionId } = seeded();
  const projectionStore = createMemoryDefinitionProjectionStoreV010();
  const source = createEnterpriseDefinitionProjectionArtifactSourceV010(
    repository,
    projectionStore
  );
  const sessions = createMemoryDefinitionProjectionSessionStoreV010();
  const handlers = createEnterpriseDefinitionProjectionEditorActionHandlersV010({
    repository,
    projectionStore,
    source,
    sessions,
    canManageEnterpriseContext: () => true,
    authorizeProjectionSave: async () => {},
    locale: () => "zh-CN",
    now: () => new Date("2026-10-06T00:08:00.000Z"),
    projectionIdFactory: () => "projection:copy-1"
  });
  const read = handlers.find(
    item => item.commandCode === EOG_2D_DESIGNER_DEFINITION_PROJECTION_GET_ACTION
  );
  const save = handlers.find(
    item => item.commandCode === EOG_2D_DESIGNER_DEFINITION_PROJECTION_SAVE_ACTION
  );
  const identity = {
    enterpriseId: revision.enterpriseId,
    definitionId: revision.definitionId,
    definitionRevision: revision.revision,
    projectionId
  };
  const state = await read.execute(
    actionRequest(EOG_2D_DESIGNER_DEFINITION_PROJECTION_GET_ACTION, identity),
    context()
  );
  const original = structuredClone(revision.projectionGallery.projections.find(
    item => item.projectionId === projectionId
  ));

  const result = await save.execute(
    actionRequest(
      EOG_2D_DESIGNER_DEFINITION_PROJECTION_SAVE_ACTION,
      {
        ...identity,
        expectedRevision: revision.revision,
        operation: { type: "SAVE_PROJECTION_AS_NEW" },
        viewState: {
          hiddenNodeIds: [state.result.nodes[0].id],
          hiddenEdgeIds: [],
          viewport: { width: 1024, height: 576 },
          placements: state.result.nodes.slice(1).map(node => ({
            nodeId: node.id,
            x: node.x + 12,
            y: node.y + 8
          })),
          camera: { scale: 0.8, translateX: 24, translateY: -16 }
        }
      }
    ),
    context()
  );

  assert.equal(result.ok, true);
  assert.match(result.result.notice, /另存为新投影/);
  assert.equal(
    result.result.navigateTo,
    definition2dEditorRouteV010({
      definitionId: revision.definitionId,
      definitionRevision: revision.revision,
      projectionId: "projection:copy-1"
    })
  );
  assert.equal(
    repository.listHistory({
      enterpriseId: revision.enterpriseId,
      definitionId: revision.definitionId
    }).length,
    1
  );

  const gallery = projectionStore.get({
    enterpriseId: revision.enterpriseId,
    definitionId: revision.definitionId,
    definitionRevision: revision.revision
  });
  assert.equal(
    gallery.projections.length,
    revision.projectionGallery.projections.length + 1
  );
  assert.deepEqual(
    gallery.projections.find(item => item.projectionId === projectionId),
    original
  );
  const copy = gallery.projections.find(
    item => item.projectionId === "projection:copy-1"
  );
  assert.ok(copy);
  assert.match(copy.title, /副本/);
  assert.match(copy.thumbnail.src, /^data:image\/svg\+xml;charset=UTF-8,/);
  assert.deepEqual(copy.view.hiddenNodeIds, [state.result.nodes[0].id]);
  assert.equal(sessions.get("session-a").projectionId, "projection:copy-1");
  assert.equal(sessions.get("session-a").definitionRevision, revision.revision);
});

test("A saved alternate projection can become the default in place", async () => {
  const { repository, revision, projectionId } = seeded();
  const projectionStore = createMemoryDefinitionProjectionStoreV010();
  const source = createEnterpriseDefinitionProjectionArtifactSourceV010(
    repository,
    projectionStore
  );
  const sessions = createMemoryDefinitionProjectionSessionStoreV010();
  const handlers = createEnterpriseDefinitionProjectionEditorActionHandlersV010({
    repository,
    projectionStore,
    source,
    sessions,
    canManageEnterpriseContext: () => true,
    authorizeProjectionSave: async () => {},
    locale: () => "zh-CN",
    now: () => new Date("2026-10-06T00:08:30.000Z"),
    projectionIdFactory: () => "projection:default-candidate"
  });
  const read = handlers.find(
    item => item.commandCode === EOG_2D_DESIGNER_DEFINITION_PROJECTION_GET_ACTION
  );
  const save = handlers.find(
    item => item.commandCode === EOG_2D_DESIGNER_DEFINITION_PROJECTION_SAVE_ACTION
  );
  const state = await read.execute(
    actionRequest(EOG_2D_DESIGNER_DEFINITION_PROJECTION_GET_ACTION, {
      enterpriseId: revision.enterpriseId,
      definitionId: revision.definitionId,
      definitionRevision: revision.revision,
      projectionId
    }),
    context()
  );
  const beforeDefinition = structuredClone(repository.getLatest({
    enterpriseId: revision.enterpriseId,
    definitionId: revision.definitionId
  }));

  const copied = await save.execute(
    actionRequest(
      EOG_2D_DESIGNER_DEFINITION_PROJECTION_SAVE_ACTION,
      {
        enterpriseId: revision.enterpriseId,
        definitionId: revision.definitionId,
        definitionRevision: revision.revision,
        projectionId,
        expectedRevision: revision.revision,
        operation: { type: "SAVE_PROJECTION_AS_NEW" },
        viewState: {
          hiddenNodeIds: [],
          hiddenEdgeIds: [],
          viewport: { width: 1024, height: 576 },
          placements: state.result.nodes.map(node => ({
            nodeId: node.id,
            x: node.x,
            y: node.y
          })),
          camera: { scale: 1, translateX: 0, translateY: 0 }
        }
      }
    ),
    context()
  );
  assert.equal(copied.ok, true);

  const result = await save.execute(
    actionRequest(
      EOG_2D_DESIGNER_DEFINITION_PROJECTION_SAVE_ACTION,
      {
        enterpriseId: revision.enterpriseId,
        definitionId: revision.definitionId,
        definitionRevision: revision.revision,
        projectionId: "projection:default-candidate",
        expectedRevision: revision.revision,
        operation: { type: "SET_PRIMARY_PROJECTION" }
      }
    ),
    context()
  );

  assert.equal(result.ok, true);
  assert.match(result.result.notice, /默认投影/);
  assert.equal(
    result.result.actions.some(action => action.id === "projection.set-primary"),
    false
  );
  assert.deepEqual(
    repository.getLatest({
      enterpriseId: revision.enterpriseId,
      definitionId: revision.definitionId
    }),
    beforeDefinition
  );
  const gallery = projectionStore.get({
    enterpriseId: revision.enterpriseId,
    definitionId: revision.definitionId,
    definitionRevision: revision.revision
  });
  assert.equal(gallery.primaryProjectionId, "projection:default-candidate");
  assert.equal(
    source.get({
      enterpriseId: revision.enterpriseId,
      definitionId: revision.definitionId,
      definitionRevision: revision.revision
    }).projectionId,
    "projection:default-candidate"
  );
});

test("Projection may be renamed in place without changing business payload or view", async () => {
  const { repository, revision, projectionId } = seeded();
  const projectionStore = createMemoryDefinitionProjectionStoreV010();
  const source = createEnterpriseDefinitionProjectionArtifactSourceV010(
    repository,
    projectionStore
  );
  const sessions = createMemoryDefinitionProjectionSessionStoreV010();
  const handlers = createEnterpriseDefinitionProjectionEditorActionHandlersV010({
    repository,
    projectionStore,
    source,
    sessions,
    canManageEnterpriseContext: () => true,
    authorizeProjectionSave: async () => {},
    locale: () => "zh-CN",
    now: () => new Date("2026-10-06T00:09:00.000Z")
  });
  const save = handlers.find(
    item => item.commandCode === EOG_2D_DESIGNER_DEFINITION_PROJECTION_SAVE_ACTION
  );
  const beforeDefinition = structuredClone(repository.getLatest({
    enterpriseId: revision.enterpriseId,
    definitionId: revision.definitionId
  }));
  const beforeProjection = structuredClone(
    revision.projectionGallery.projections.find(
      item => item.projectionId === projectionId
    )
  );

  const result = await save.execute(
    actionRequest(
      EOG_2D_DESIGNER_DEFINITION_PROJECTION_SAVE_ACTION,
      {
        enterpriseId: revision.enterpriseId,
        definitionId: revision.definitionId,
        definitionRevision: revision.revision,
        projectionId,
        expectedRevision: revision.revision,
        operation: {
          type: "RENAME_PROJECTION",
          title: "资金与库存关系"
        }
      }
    ),
    context()
  );

  assert.equal(result.ok, true);
  assert.match(result.result.notice, /已重命名/);
  assert.deepEqual(
    repository.getLatest({
      enterpriseId: revision.enterpriseId,
      definitionId: revision.definitionId
    }),
    beforeDefinition
  );
  const gallery = projectionStore.get({
    enterpriseId: revision.enterpriseId,
    definitionId: revision.definitionId,
    definitionRevision: revision.revision
  });
  const renamed = gallery.projections.find(
    item => item.projectionId === projectionId
  );
  assert.equal(renamed.title, "资金与库存关系");
  assert.deepEqual(renamed.view, beforeProjection.view);
  assert.equal(renamed.thumbnail.src, beforeProjection.thumbnail.src);
  assert.equal(renamed.thumbnail.alt, "资金与库存关系 投影缩略图");
});

test("Projection save refuses to write against a stale business-definition revision", async () => {
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

  const projectionStore = createMemoryDefinitionProjectionStoreV010();
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
    projectionStore,
    source: createEnterpriseDefinitionProjectionArtifactSourceV010(
      repository,
      projectionStore
    ),
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

test("Ledger Manager projection flow edits presentation in place", async () => {
  const { repository, revision, projectionId } = seeded();
  const projectionStore = createMemoryDefinitionProjectionStoreV010();
  const sessions = createMemoryDefinitionProjectionSessionStoreV010();
  const ctx = context();

  const ledgerHandlers = createLedgerManagerActionHandlersV010({
    repository,
    projectionSessions: sessions,
    resolveAuthorizationProvider: () => ({
      providerId: "test.authorization",
      check() {
        return {
          contractVersion: "0.1.0",
          allowed: true,
          policyProviderId: "test.authorization",
          reasonCodes: ["TEST_ALLOW"]
        };
      }
    }),
    canManageEnterpriseContext: () => true,
    viewerAvailable: () => true,
    async publishToLedgerRuntime() {
      throw new Error("runtime publish is not part of projection editing");
    }
  });
  const preview = ledgerHandlers.find(
    item => item.commandCode === LEDGER_MANAGER_PREVIEW_PROJECTION_COMMAND
  );
  const previewResult = await preview.execute(
    actionRequest(
      LEDGER_MANAGER_PREVIEW_PROJECTION_COMMAND,
      {
        definitionId: revision.definitionId,
        definitionRevision: revision.revision,
        projectionId
      }
    ),
    ctx
  );
  assert.equal(previewResult.ok, true);
  assert.equal(
    previewResult.result.navigateTo,
    definition2dPreviewRouteV010({
      definitionId: revision.definitionId,
      definitionRevision: revision.revision,
      projectionId
    })
  );

  const source = createEnterpriseDefinitionProjectionArtifactSourceV010(
    repository,
    projectionStore
  );
  const before = source.get({
    enterpriseId: revision.enterpriseId,
    definitionId: revision.definitionId,
    definitionRevision: revision.revision,
    projectionId
  });
  const editorHandlers = createEnterpriseDefinitionProjectionEditorActionHandlersV010({
    repository,
    projectionStore,
    source,
    sessions,
    canManageEnterpriseContext: () => true,
    authorizeProjectionSave: async () => {},
    locale: () => "zh-CN",
    now: () => new Date("2026-10-06T00:05:00.000Z")
  });
  const read = editorHandlers.find(
    item => item.commandCode === EOG_2D_DESIGNER_DEFINITION_PROJECTION_GET_ACTION
  );
  const save = editorHandlers.find(
    item => item.commandCode === EOG_2D_DESIGNER_DEFINITION_PROJECTION_SAVE_ACTION
  );

  const editorState = await read.execute(
    actionRequest(EOG_2D_DESIGNER_DEFINITION_PROJECTION_GET_ACTION, {}),
    ctx
  );
  const placements = editorState.result.nodes.map((node, index) => ({
    nodeId: node.id,
    x: node.x + 40 + index,
    y: node.y + 24
  }));

  const saveResult = await save.execute(
    actionRequest(
      EOG_2D_DESIGNER_DEFINITION_PROJECTION_SAVE_ACTION,
      {
        expectedRevision: revision.revision,
        operation: { type: "SAVE_PROJECTION_VIEW" },
        viewState: {
          placements,
          camera: {
            scale: 1.15,
            translateX: 32,
            translateY: -18
          }
        }
      }
    ),
    ctx
  );
  assert.equal(saveResult.ok, true);
  assert.equal(saveResult.result.revision, revision.revision);
  assert.equal(
    saveResult.result.navigateTo,
    definition2dEditorRouteV010({
      definitionId: revision.definitionId,
      definitionRevision: revision.revision,
      projectionId
    })
  );
  const nextSelection = sessions.get("session-a");
  assert.equal(nextSelection.definitionRevision, revision.revision);

  const after = source.get({
    enterpriseId: revision.enterpriseId,
    definitionId: revision.definitionId,
    definitionRevision: revision.revision,
    projectionId
  });
  assert.ok(before);
  assert.deepEqual(after.camera, {
    scale: 1.15,
    translateX: 32,
    translateY: -18
  });
  for (const placement of placements) {
    const node = after.diagram2d.nodes.find(item => item.id === placement.nodeId);
    assert.equal(node.x, placement.x);
    assert.equal(node.y, placement.y);
  }
  assert.equal(
    repository.listHistory({
      enterpriseId: revision.enterpriseId,
      definitionId: revision.definitionId
    }).length,
    1
  );
  assert.deepEqual(
    repository.getLatest({
      enterpriseId: revision.enterpriseId,
      definitionId: revision.definitionId
    }).payload,
    revision.payload
  );
});



test("two editor windows saving the same projection detect stale presentation write token", async () => {
  const { repository, revision, projectionId } = seeded();
  const projectionStore = createMemoryDefinitionProjectionStoreV010();
  const source = createEnterpriseDefinitionProjectionArtifactSourceV010(repository, projectionStore);
  const sessions = createMemoryDefinitionProjectionSessionStoreV010();
  const handlers = createEnterpriseDefinitionProjectionEditorActionHandlersV010({
    repository, projectionStore, source, sessions,
    canManageEnterpriseContext: () => true,
    authorizeProjectionSave: async () => {},
    now: () => new Date("2026-10-10T00:00:00.000Z")
  });
  const read = handlers.find(x => x.commandCode === EOG_2D_DESIGNER_DEFINITION_PROJECTION_GET_ACTION);
  const save = handlers.find(x => x.commandCode === EOG_2D_DESIGNER_DEFINITION_PROJECTION_SAVE_ACTION);
  const identity = {
    enterpriseId: revision.enterpriseId,
    definitionId: revision.definitionId,
    definitionRevision: revision.revision,
    projectionId
  };
  const firstRead = await read.execute(actionRequest(
    EOG_2D_DESIGNER_DEFINITION_PROJECTION_GET_ACTION, identity), context());
  const secondRead = await read.execute(actionRequest(
    EOG_2D_DESIGNER_DEFINITION_PROJECTION_GET_ACTION, identity), context());
  assert.equal(firstRead.ok, true);
  assert.equal(firstRead.result.writeToken, "0");
  assert.equal(secondRead.result.writeToken, "0");
  const values = (base, dx) => ({
    ...identity,
    expectedRevision: revision.revision,
    expectedWriteToken: base.result.writeToken,
    operation: { type: "SAVE_PROJECTION_VIEW" },
    viewState: {
      hiddenNodeIds: [],
      hiddenEdgeIds: [],
      placements: base.result.nodes.map(node => ({
        nodeId: node.id, x: node.x + dx, y: node.y
      })),
      camera: { scale: 1, translateX: dx, translateY: 0 }
    }
  });
  const firstSave = await save.execute(actionRequest(
    EOG_2D_DESIGNER_DEFINITION_PROJECTION_SAVE_ACTION,
    values(firstRead, 25)), context());
  assert.equal(firstSave.ok, true);
  assert.equal(firstSave.result.writeToken, "1");
  const afterFirst = projectionStore.snapshot();
  const stale = await save.execute(actionRequest(
    EOG_2D_DESIGNER_DEFINITION_PROJECTION_SAVE_ACTION,
    values(secondRead, 40)), context());
  assert.equal(stale.ok, false);
  assert.equal(stale.error.code, "DEFINITION_PROJECTION_WRITE_CONFLICT");
  assert.deepEqual(projectionStore.snapshot(), afterFirst);
  const freshRead = await read.execute(actionRequest(
    EOG_2D_DESIGNER_DEFINITION_PROJECTION_GET_ACTION, identity), context());
  assert.equal(freshRead.result.writeToken, "1");
  const retry = await save.execute(actionRequest(
    EOG_2D_DESIGNER_DEFINITION_PROJECTION_SAVE_ACTION,
    values(freshRead, 5)), context());
  assert.equal(retry.ok, true);
  assert.equal(retry.result.writeToken, "2");
  assert.equal(repository.listHistory({
    enterpriseId: revision.enterpriseId, definitionId: revision.definitionId
  }).length, 1);
});

test("write-token validation blocks malformed presentation version without mutation", async () => {
  const { repository, revision, projectionId } = seeded();
  const projectionStore = createMemoryDefinitionProjectionStoreV010();
  const handlers = createEnterpriseDefinitionProjectionEditorActionHandlersV010({
    repository, projectionStore,
    source: createEnterpriseDefinitionProjectionArtifactSourceV010(repository, projectionStore),
    sessions: createMemoryDefinitionProjectionSessionStoreV010(),
    canManageEnterpriseContext: () => true,
    authorizeProjectionSave: async () => {}
  });
  const save = handlers.find(x => x.commandCode === EOG_2D_DESIGNER_DEFINITION_PROJECTION_SAVE_ACTION);
  const result = await save.execute(actionRequest(
    EOG_2D_DESIGNER_DEFINITION_PROJECTION_SAVE_ACTION, {
      enterpriseId: revision.enterpriseId,
      definitionId: revision.definitionId,
      definitionRevision: revision.revision, projectionId,
      expectedRevision: revision.revision, expectedWriteToken: "NaN",
      operation: { type: "RENAME_PROJECTION", title: "should not save" }
    }), context());
  assert.equal(result.ok, false);
  assert.equal(result.error.code, "DEFINITION_PROJECTION_WRITE_TOKEN_INVALID");
  assert.equal(projectionStore.getVersion({
    enterpriseId: revision.enterpriseId, definitionId: revision.definitionId,
    definitionRevision: revision.revision
  }), 0);
});
