import test from "node:test";
import assert from "node:assert/strict";

import {
  createMemoryTemplateStoreRepositoryV010
} from "../../dist/apps/template-store/repository.js";
import {
  templateStoreSeedRecordsV010
} from "../../dist/apps/template-store/seed-records.js";
import {
  createTemplateStorePreviewArtifactSourceV010
} from "../../dist/apps/template-store/preview-source.js";
import {
  createTemplateStorePreview2dActionHandlerV010
} from "../../dist/apps/template-store/preview-action.js";
import {
  createTemplateStoreOpenDetailActionHandlerV010
} from "../../dist/apps/template-store/detail-action.js";
import {
  createTemplate2dPreviewPageV010,
  createTemplate2dPreviewReadActionV010,
  createTemplate2dPreviewSelectionReadActionV010
} from "../../dist/apps/eog-2d-viewer/template-preview.js";
import {
  createMemoryTemplatePreviewSessionStoreV010
} from "../../dist/manager/template-preview-session.js";
import {
  TEMPLATE_2D_PREVIEW_ROUTE_V010
} from "../../dist/contracts/template-preview.js";
import {
  TEMPLATE_STORE_DETAIL_ROUTE
} from "../../dist/apps/template-store/package.js";

const templateId = "evo.ledger-runtime.baseline.v0.1";
const templateVersion = 3;
const projectionId = "projection:main";

function context() {
  return {
    contractVersion: "0.1.0",
    principal: {
      contractVersion: "0.1.0",
      subjectId: "human:preview",
      actorType: "HUMAN",
      identityProviderId: "test",
      sessionId: "session:preview"
    },
    scope: {
      contractVersion: "0.1.0"
    },
    correlationId: "correlation:preview"
  };
}

test("Ledger Runtime seed exposes the complete application-ledger-rule 2D preview", () => {
  const repository = createMemoryTemplateStoreRepositoryV010(
    templateStoreSeedRecordsV010
  );
  const source = createTemplateStorePreviewArtifactSourceV010(repository);
  const artifact = source.get({ templateId, templateVersion, projectionId });

  assert.ok(artifact);
  assert.equal(artifact.projectionId, projectionId);
  assert.equal(artifact.title, "完整账本运行时");
  assert.equal(artifact.diagram2d.nodes.length, 284);
  assert.equal(
    artifact.diagram2d.nodes.filter(
      node => node.kind === "ledger-runtime-application"
    ).length,
    143
  );
  assert.equal(
    artifact.diagram2d.nodes.filter(
      node => node.kind === "ledger-runtime-ledger"
    ).length,
    141
  );
  assert.equal(artifact.diagram2d.edges.length, 912);
  assert.equal(
    artifact.diagram2d.edges.every(
      edge => edge.kind === "posting-rule" && edge.arrow === "end"
    ),
    true
  );
  assert.equal(
    artifact.diagram2d.nodes.filter(
      node => node.typeLabel === "应用"
        && node.shape === "rounded-rectangle"
    ).length,
    143
  );
  assert.equal(
    artifact.diagram2d.nodes.filter(
      node => node.typeLabel === "账本"
        && node.shape === "rectangle"
    ).length,
    141
  );
  assert.equal(
    artifact.diagram2d.edges.filter(
      edge => edge.target.startsWith("ledger:")
    ).length,
    496
  );
  assert.equal(
    artifact.diagram2d.edges.filter(
      edge => edge.source.startsWith("ledger:")
    ).length,
    416
  );
  assert.equal(
    artifact.diagram2d.edges.every(
      edge => edge.properties.some(property =>
        property.key === "flowType"
        && ["数量", "资金", "数量 + 资金", "发生数"].includes(property.value)
      )
    ),
    true
  );
});

test("2D Viewer renders Template Store artifact read-only and supports inspection", async () => {
  const repository = createMemoryTemplateStoreRepositoryV010(
    templateStoreSeedRecordsV010
  );
  const source = createTemplateStorePreviewArtifactSourceV010(repository);
  const page = createTemplate2dPreviewPageV010({
    templateId,
    templateVersion,
    title: "完整账本运行时",
    projectionId
  });

  const read = createTemplate2dPreviewReadActionV010({ source });
  const result = await read.execute({
    contractVersion: "0.1.0",
    type: "command",
    command: {
      code: page.readCommand.code,
      inputVersion: "0.1.0"
    },
    values: {
      templateId,
      templateVersion,
      projectionId,
      resourceId: page.resourceId
    },
    sourceInteractionId: page.id,
    actionId: "diagram.read",
    requiresConfirmation: false
  }, context());

  assert.equal(result.ok, true);
  assert.equal(result.result.lifecycleState, "TEMPLATE_PREVIEW");
  assert.equal(result.result.actions.length, 0);
  assert.equal(result.result.nodes.every(node => node.readOnly === true), true);
  assert.deepEqual(page.viewInteraction, {
    zoom: true,
    pan: true,
    localNodeDrag: true
  });
  assert.equal(
    result.result.nodes.some(node =>
      node.typeLabel === "应用" && node.shape === "rounded-rectangle"
    ),
    true
  );
  assert.equal(
    result.result.nodes.some(node =>
      node.typeLabel === "账本" && node.shape === "rectangle"
    ),
    true
  );
  assert.equal(
    result.result.edges.every(edge => edge.arrow === "end"),
    true
  );

  const inspect = createTemplate2dPreviewSelectionReadActionV010({ source });
  const selection = await inspect.execute({
    contractVersion: "0.1.0",
    type: "command",
    command: {
      code: page.selectionReadCommand.code,
      inputVersion: "0.1.0"
    },
    values: {
      templateId,
      templateVersion,
      projectionId,
      resourceId: page.resourceId,
      target: {
        kind: "node",
        id: "application:418bd0e9-1dce-4e01-aa5a-3d4cd80e87d4"
      }
    },
    sourceInteractionId: page.id,
    actionId: "diagram.selection.read",
    requiresConfirmation: false
  }, context());

  assert.equal(selection.ok, true);
  assert.equal(
    selection.result.target.id,
    "application:418bd0e9-1dce-4e01-aa5a-3d4cd80e87d4"
  );
  assert.equal(
    selection.result.properties.some(
      property => property.value
        === "418bd0e9-1dce-4e01-aa5a-3d4cd80e87d4"
    ),
    true
  );
});

test("Template Store preview action refuses missing Viewer and navigates when available", async () => {
  const repository = createMemoryTemplateStoreRepositoryV010(
    templateStoreSeedRecordsV010
  );
  const sessions = createMemoryTemplatePreviewSessionStoreV010({
    now: () => Date.parse("2026-10-04T12:00:00.000Z")
  });

  const unavailable = createTemplateStorePreview2dActionHandlerV010({
    store: repository,
    sessions,
    viewerAvailable: () => false
  });
  const request = {
    contractVersion: "0.1.0",
    type: "command",
    command: {
      code: "evo-template-store.preview-2d",
      inputVersion: "0.1.0"
    },
    values: { itemId: templateId, templateVersion, projectionId },
    sourceInteractionId: "evo-template-store",
    actionId: "preview-2d",
    requiresConfirmation: false
  };

  const blocked = await unavailable.execute(request, context());
  assert.equal(blocked.ok, false);
  assert.equal(blocked.error.code, "TEMPLATE_2D_VIEWER_NOT_INSTALLED");
  assert.equal(sessions.get("session:preview"), undefined);

  const available = createTemplateStorePreview2dActionHandlerV010({
    store: repository,
    sessions,
    viewerAvailable: () => true,
    now: () => new Date("2026-10-04T12:00:00.000Z")
  });
  const opened = await available.execute(request, context());

  assert.equal(opened.ok, true);
  assert.equal(opened.result.navigateTo, TEMPLATE_2D_PREVIEW_ROUTE_V010);
  assert.equal(sessions.get("session:preview").templateId, templateId);
  assert.equal(sessions.get("session:preview").templateVersion, 3);
  assert.equal(sessions.get("session:preview").projectionId, projectionId);
  assert.equal(sessions.get("human:preview").templateId, templateId);
  assert.equal(sessions.get("human:preview").templateVersion, 3);
  assert.equal(sessions.get("human:preview").projectionId, projectionId);
});


test("Template Store detail action locks an immutable version before navigation", async () => {
  const repository = createMemoryTemplateStoreRepositoryV010(
    templateStoreSeedRecordsV010
  );
  const sessions = createMemoryTemplatePreviewSessionStoreV010({
    now: () => Date.parse("2026-10-05T00:00:30.000Z")
  });
  const detail = createTemplateStoreOpenDetailActionHandlerV010({
    store: repository,
    sessions,
    now: () => new Date("2026-10-05T00:00:00.000Z")
  });

  const opened = await detail.execute({
    contractVersion: "0.1.0",
    type: "command",
    command: {
      code: "evo-template-store.open-detail",
      inputVersion: "0.1.0"
    },
    values: {
      itemId: templateId,
      templateVersion: 3
    },
    sourceInteractionId: "evo-template-store",
    actionId: "detail",
    requiresConfirmation: false
  }, context());

  assert.equal(opened.ok, true);
  assert.equal(opened.result.navigateTo, TEMPLATE_STORE_DETAIL_ROUTE);
  assert.equal(sessions.get("session:preview").templateVersion, 3);
  assert.equal(sessions.get("session:preview").projectionId, undefined);
});

test("2D preview honors an exact older immutable template version", async () => {
  const repository = createMemoryTemplateStoreRepositoryV010(
    templateStoreSeedRecordsV010
  );
  const sessions = createMemoryTemplatePreviewSessionStoreV010();
  const available = createTemplateStorePreview2dActionHandlerV010({
    store: repository,
    sessions,
    viewerAvailable: () => true
  });

  const opened = await available.execute({
    contractVersion: "0.1.0",
    type: "command",
    command: {
      code: "evo-template-store.preview-2d",
      inputVersion: "0.1.0"
    },
    values: {
      itemId: templateId,
      templateVersion: 2
    },
    sourceInteractionId: "evo-template-store",
    actionId: "preview-2d",
    requiresConfirmation: false
  }, context());

  assert.equal(opened.ok, true);
  assert.equal(sessions.get("session:preview").templateVersion, 2);
  assert.equal(sessions.get("session:preview").projectionId, undefined);
});
