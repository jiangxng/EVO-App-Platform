import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  createMemoryBusinessDefinitionRepositoryV010
} from "../../dist/providers/enterprise-context/business-definitions.js";
import {
  createEnterpriseTemplateTransferProviderV010
} from "../../dist/providers/enterprise-context/template-transfer.js";
import {
  createMemoryTemplateStoreRepositoryV010
} from "../../dist/apps/template-store/repository.js";
import {
  ENTERPRISE_TEMPLATE_TRANSFER_CAPABILITY_V010
} from "../../dist/contracts/template-transfer.js";
import {
  HOST_ENTERPRISE_TEMPLATE_TRANSFER_PROVIDER_ID,
  hostEnterpriseContextProviderPackage
} from "../../dist/providers/enterprise-context/package.js";

const human = {
  actorType: "HUMAN",
  subjectId: "human:owner"
};

test("Enterprise Context can share an exact Draft revision without collapsing Share into Publish", () => {
  const definitions = createMemoryBusinessDefinitionRepositoryV010();
  const transfer = createEnterpriseTemplateTransferProviderV010(definitions);

  definitions.createDraft({
    enterpriseId: "enterprise:source",
    definitionId: "graph:ledger-runtime",
    kind: "ENTERPRISE_OPERATING_GRAPH",
    title: "Ledger runtime",
    payload: { version: "submitted-v1", nodes: ["business-data", "posting"] },
    actor: human,
    recordedAt: "2026-10-04T01:00:00.000Z"
  });

  const bundle = transfer.prepareShare({
    enterpriseId: "enterprise:source",
    definitionId: "graph:ledger-runtime",
    definitionRevision: 0,
    transferId: "share:ledger-runtime:1",
    listing: {
      name: "EVO 账本运行时基线",
      description: "Ledger runtime baseline",
      thumbnail: {
        src: "data:image/svg+xml,%3Csvg%2F%3E",
        alt: "Ledger runtime preview"
      }
    },
    actor: human,
    sharedAt: "2026-10-04T02:00:00.000Z"
  });

  assert.equal(bundle.source.definitionState, "DRAFT");
  assert.equal(bundle.source.definitionRevision, 0);
  assert.equal(bundle.listing.name, "EVO 账本运行时基线");
  assert.match(bundle.contentDigest, /^sha256:[0-9a-f]{64}$/);
  assert.equal(
    definitions.getLatest({
      enterpriseId: "enterprise:source",
      definitionId: "graph:ledger-runtime"
    }).state,
    "DRAFT"
  );
});

test("Template Store snapshot and enterprise copy remain independent from later source changes", () => {
  const definitions = createMemoryBusinessDefinitionRepositoryV010();
  const transfer = createEnterpriseTemplateTransferProviderV010(definitions);
  const store = createMemoryTemplateStoreRepositoryV010();

  definitions.createDraft({
    enterpriseId: "enterprise:source",
    definitionId: "process:o2c",
    kind: "PROCESS",
    title: "Order to cash",
    payload: { stage: "source-v0", nested: { value: 1 } },
    actor: human,
    recordedAt: "2026-10-04T01:00:00.000Z"
  });

  const bundle = transfer.prepareShare({
    enterpriseId: "enterprise:source",
    definitionId: "process:o2c",
    definitionRevision: 0,
    transferId: "share:o2c:1",
    listing: {
      name: "Order to Cash",
      description: "Reusable O2C baseline",
      thumbnail: {
        src: "data:image/svg+xml,%3Csvg%2F%3E",
        alt: "O2C preview"
      }
    },
    actor: human,
    sharedAt: "2026-10-04T02:00:00.000Z"
  });

  const record = store.publish({
    templateId: "template:o2c",
    bundle,
    publishedAt: "2026-10-04T02:05:00.000Z"
  });

  definitions.reviseDraft({
    enterpriseId: "enterprise:source",
    definitionId: "process:o2c",
    expectedRevision: 0,
    title: "Order to cash source changed",
    payload: { stage: "source-v1", nested: { value: 2 } },
    actor: human,
    recordedAt: "2026-10-04T03:00:00.000Z"
  });

  assert.equal(
    store.getVersion("template:o2c", 1).bundle.definition.payload.stage,
    "source-v0"
  );

  const copied = transfer.copyIntoEnterprise({
    bundle: record.bundle,
    targetEnterpriseId: "enterprise:target",
    targetDefinitionId: "process:o2c-local",
    sourceRef: "template-store:template:o2c@1",
    actor: {
      actorType: "HUMAN",
      subjectId: "human:target-owner"
    },
    recordedAt: "2026-10-04T04:00:00.000Z"
  });

  assert.equal(copied.state, "DRAFT");
  assert.equal(copied.revision, 0);
  assert.equal(copied.enterpriseId, "enterprise:target");
  assert.equal(copied.origin.type, "TEMPLATE_COPY");
  assert.equal(copied.origin.sourceRef, "template-store:template:o2c@1");
  assert.equal(copied.payload.stage, "source-v0");

  definitions.reviseDraft({
    enterpriseId: "enterprise:target",
    definitionId: "process:o2c-local",
    expectedRevision: 0,
    title: "Target customized O2C",
    payload: { stage: "target-v1", nested: { value: 99 } },
    actor: {
      actorType: "HUMAN",
      subjectId: "human:target-owner"
    },
    recordedAt: "2026-10-04T05:00:00.000Z"
  });

  assert.equal(
    store.getVersion("template:o2c", 1).bundle.definition.payload.stage,
    "source-v0"
  );
  assert.equal(
    definitions.getLatest({
      enterpriseId: "enterprise:source",
      definitionId: "process:o2c"
    }).payload.stage,
    "source-v1"
  );
  assert.equal(
    definitions.getLatest({
      enterpriseId: "enterprise:target",
      definitionId: "process:o2c-local"
    }).payload.stage,
    "target-v1"
  );
});

test("Template Store rejects a transfer bundle whose content changed after signing", () => {
  const definitions = createMemoryBusinessDefinitionRepositoryV010();
  const transfer = createEnterpriseTemplateTransferProviderV010(definitions);
  const store = createMemoryTemplateStoreRepositoryV010();

  definitions.createDraft({
    enterpriseId: "enterprise:source",
    definitionId: "definition:a",
    kind: "PROCESS",
    title: "A",
    payload: { value: 1 },
    actor: human
  });

  const bundle = transfer.prepareShare({
    enterpriseId: "enterprise:source",
    definitionId: "definition:a",
    definitionRevision: 0,
    transferId: "share:a:1",
    listing: {
      name: "A",
      description: "A template",
      thumbnail: { src: "data:image/svg+xml,a", alt: "A preview" }
    },
    actor: human
  });
  const tampered = structuredClone(bundle);
  tampered.definition.payload.value = 2;

  assert.throws(
    () => store.publish({
      templateId: "template:a",
      bundle: tampered
    }),
    /TEMPLATE_TRANSFER_DIGEST_MISMATCH/
  );
});

test("Enterprise Context exposes template transfer as a public provider capability", () => {
  const feature = hostEnterpriseContextProviderPackage.features[0];
  assert.ok(
    feature.providesCapabilities.includes(
      ENTERPRISE_TEMPLATE_TRANSFER_CAPABILITY_V010
    )
  );
  const provider = feature.contributions
    .filter(item => item.kind === "platform.service-provider")
    .map(item => item.provider)
    .find(item =>
      item.providerId === HOST_ENTERPRISE_TEMPLATE_TRANSFER_PROVIDER_ID
    );

  assert.equal(provider.capability, ENTERPRISE_TEMPLATE_TRANSFER_CAPABILITY_V010);
  assert.equal(provider.providerContract, "evo.enterprise.template-transfer");
});


test("Template Store and Enterprise Context transfer implementations depend only on the neutral contract", async () => {
  const [storeSource, enterpriseSource] = await Promise.all([
    readFile("apps/template-store/repository.ts", "utf8"),
    readFile("providers/enterprise-context/template-transfer.ts", "utf8")
  ]);

  assert.equal(
    storeSource.includes("providers/enterprise-context"),
    false
  );
  assert.equal(
    enterpriseSource.includes("apps/template-store"),
    false
  );
  assert.match(storeSource, /contracts\/template-transfer/);
  assert.match(enterpriseSource, /contracts\/template-transfer/);
});


test("Projection Gallery is versioned, shared and copied with the definition", () => {
  const definitions = createMemoryBusinessDefinitionRepositoryV010();
  const transfer = createEnterpriseTemplateTransferProviderV010(definitions);
  const gallery = {
    contractVersion: "0.1.0",
    primaryProjectionId: "projection:main",
    projections: [{
      projectionId: "projection:main",
      title: "Main",
      thumbnail: {
        src: "data:image/svg+xml,main",
        alt: "Main projection"
      },
      view: {
        contractVersion: "0.1.0",
        kind: "DIAGRAM_2D",
        hiddenNodeIds: ["node:hidden"],
        placements: [{ nodeId: "node:a", x: 120, y: 80 }]
      }
    }]
  };

  const draft = definitions.createDraft({
    enterpriseId: "enterprise:source",
    definitionId: "definition:gallery",
    kind: "ENTERPRISE_OPERATING_GRAPH",
    title: "Gallery definition",
    payload: { graphContractVersion: "0.1.0" },
    projectionGallery: gallery,
    actor: human,
    recordedAt: "2026-10-05T00:00:00.000Z"
  });
  assert.deepEqual(draft.projectionGallery, gallery);

  const bundle = transfer.prepareShare({
    enterpriseId: "enterprise:source",
    definitionId: "definition:gallery",
    definitionRevision: draft.revision,
    transferId: "share:gallery:1",
    listing: {
      name: "Gallery definition",
      description: "Projection Gallery transfer",
      thumbnail: gallery.projections[0].thumbnail
    },
    actor: human,
    sharedAt: "2026-10-05T00:10:00.000Z"
  });
  assert.deepEqual(bundle.definition.projectionGallery, gallery);

  const copied = transfer.copyIntoEnterprise({
    bundle,
    targetEnterpriseId: "enterprise:target",
    targetDefinitionId: "definition:gallery-copy",
    sourceRef: "template-store:gallery@1",
    actor: human,
    recordedAt: "2026-10-05T00:20:00.000Z"
  });
  assert.deepEqual(copied.projectionGallery, gallery);
  assert.equal(copied.state, "DRAFT");
});
