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

const templateId = "evo.ledger-runtime.baseline.v0.1";

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
  const artifact = source.get({ templateId, templateVersion: 1 });

  assert.ok(artifact);
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
      edge => edge.kind === "posting-rule"
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
    templateVersion: 1,
    title: "EVO 账本运行时基线"
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
      templateVersion: 1,
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
      templateVersion: 1,
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
    values: { itemId: templateId },
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
  assert.equal(sessions.get("session:preview").templateVersion, 1);
});
