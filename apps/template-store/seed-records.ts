import {
  templateTransferDigestV010,
  type TemplateTransferBundleV010
} from "../../contracts/template-transfer.js";
import type {
  TemplateStoreRecordV010
} from "./repository.js";
import {
  ledgerRuntimeBaselineTemplateV010
} from "./templates.js";
import {
  ledgerRuntimeProductionTemplateV010
} from "./seeds/evo-ledger-runtime-production.snapshot.js";

const sharedAtV2 = "2026-10-04T00:00:00.000Z";
const sharedAtV3 = "2026-10-05T00:00:00.000Z";

const unsignedLedgerRuntimeBundleV2 = {
  contractVersion: "0.1.0" as const,
  transferId: "built-in:evo.ledger-runtime.baseline.v0.2",
  source: {
    enterpriseId: "enterprise:evo-reference",
    definitionId: "evo.ledger-runtime.baseline.v0.1",
    definitionRevision: 1,
    definitionKind: "LEDGER_RUNTIME_TEMPLATE",
    definitionState: "PUBLISHED" as const
  },
  listing: {
    name: ledgerRuntimeBaselineTemplateV010.name,
    description: ledgerRuntimeBaselineTemplateV010.description,
    thumbnail: {
      ...ledgerRuntimeBaselineTemplateV010.thumbnail
    }
  },
  definition: {
    kind: "LEDGER_RUNTIME_TEMPLATE",
    title: ledgerRuntimeBaselineTemplateV010.name,
    payload: structuredClone(ledgerRuntimeProductionTemplateV010)
  },
  sharedAt: sharedAtV2,
  sharedBy: {
    actorType: "SERVICE" as const,
    subjectId: "service:evo-built-in-reference"
  }
};

export const ledgerRuntimeBaselineBundleV2V010: TemplateTransferBundleV010 = {
  ...unsignedLedgerRuntimeBundleV2,
  contentDigest: templateTransferDigestV010(unsignedLedgerRuntimeBundleV2)
};


const unsignedLedgerRuntimeBundleV3 = {
  ...unsignedLedgerRuntimeBundleV2,
  transferId: "built-in:evo.ledger-runtime.baseline.v0.3",
  definition: {
    ...unsignedLedgerRuntimeBundleV2.definition,
    projectionGallery: structuredClone(
      ledgerRuntimeBaselineTemplateV010.projectionGallery!
    )
  },
  sharedAt: sharedAtV3
};

export const ledgerRuntimeBaselineBundleV010: TemplateTransferBundleV010 = {
  ...unsignedLedgerRuntimeBundleV3,
  contentDigest: templateTransferDigestV010(unsignedLedgerRuntimeBundleV3)
};

export const templateStoreSeedRecordsV010: TemplateStoreRecordV010[] = [{
  contractVersion: "0.1.0",
  templateId: ledgerRuntimeBaselineTemplateV010.templateId,
  version: 2,
  bundle: ledgerRuntimeBaselineBundleV2V010,
  publishedAt: sharedAtV2
}, {
  contractVersion: "0.1.0",
  templateId: ledgerRuntimeBaselineTemplateV010.templateId,
  version: 3,
  bundle: ledgerRuntimeBaselineBundleV010,
  publishedAt: sharedAtV3
}];
