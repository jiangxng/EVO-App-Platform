import test from "node:test";
import assert from "node:assert/strict";

import {
  createTemplateStoreDownloadActionHandlerV010
} from "../../dist/apps/template-store/download-action.js";
import {
  createMemoryTemplateStoreRepositoryV010
} from "../../dist/apps/template-store/repository.js";
import {
  templateStoreSeedRecordsV010
} from "../../dist/apps/template-store/seed-records.js";
import {
  assertTemplateDownloadPackageV010
} from "../../dist/contracts/template-package.js";
import {
  assertTemplateTransferBundleV010
} from "../../dist/contracts/template-transfer.js";

function context() {
  return {
    contractVersion: "0.1.0",
    principal: {
      contractVersion: "0.1.0",
      subjectId: "human:download",
      actorType: "HUMAN",
      identityProviderId: "test.identity"
    },
    scope: { contractVersion: "0.1.0" },
    context: {
      contractVersion: "0.1.0",
      personalContext: {
        contractVersion: "0.1.0",
        kind: "PERSONAL",
        contextId: "personal:download"
      },
      activeContext: {
        contractVersion: "0.1.0",
        kind: "PERSONAL",
        contextId: "personal:download"
      }
    },
    correlationId: "correlation:download"
  };
}

test("Template Store downloads an exact immutable version as a portable package", async () => {
  const store = createMemoryTemplateStoreRepositoryV010(
    structuredClone(templateStoreSeedRecordsV010)
  );
  const handler = createTemplateStoreDownloadActionHandlerV010({ store });
  const result = await handler.execute({
    contractVersion: "0.1.0",
    type: "command",
    command: {
      code: "evo-template-store.download",
      inputVersion: "0.1.0"
    },
    values: {
      itemId: "evo.ledger-runtime.baseline.v0.1",
      templateVersion: 3
    },
    sourceInteractionId: "evo-template-store.detail",
    actionId: "download",
    requiresConfirmation: false
  }, context());

  assert.equal(result.ok, true);
  assert.equal(
    result.result.download.mediaType,
    "application/vnd.evo.template+json"
  );
  assert.match(
    result.result.download.fileName,
    /evo\.ledger-runtime\.baseline\.v0\.1\.v3\.evo-template\.json$/
  );

  const downloaded = assertTemplateDownloadPackageV010(
    JSON.parse(result.result.download.content)
  );
  assert.equal(downloaded.templateId, "evo.ledger-runtime.baseline.v0.1");
  assert.equal(downloaded.storeVersion, 3);

  const bundle = assertTemplateTransferBundleV010(downloaded.bundle);
  assert.equal(bundle.definition.projectionGallery.projections.length, 1);
  assert.equal(
    bundle.definition.projectionGallery.primaryProjectionId,
    "projection:main"
  );
  assert.equal(
    bundle.contentDigest,
    store.getVersion(downloaded.templateId, 3).bundle.contentDigest
  );
});

test("Template Store download defaults to latest version but can pin history", async () => {
  const store = createMemoryTemplateStoreRepositoryV010(
    structuredClone(templateStoreSeedRecordsV010)
  );
  const handler = createTemplateStoreDownloadActionHandlerV010({ store });
  const base = {
    contractVersion: "0.1.0",
    type: "command",
    command: {
      code: "evo-template-store.download",
      inputVersion: "0.1.0"
    },
    sourceInteractionId: "evo-template-store.detail",
    actionId: "download",
    requiresConfirmation: false
  };

  const latest = await handler.execute({
    ...base,
    values: { itemId: "evo.ledger-runtime.baseline.v0.1" }
  }, context());
  const v2 = await handler.execute({
    ...base,
    values: {
      itemId: "evo.ledger-runtime.baseline.v0.1",
      templateVersion: 2
    }
  }, context());

  assert.equal(
    JSON.parse(latest.result.download.content).storeVersion,
    3
  );
  assert.equal(
    JSON.parse(v2.result.download.content).storeVersion,
    2
  );
});
