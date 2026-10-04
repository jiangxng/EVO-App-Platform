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

const sharedAt = "2026-10-04T00:00:00.000Z";

const unsignedLedgerRuntimeBundle = {
  contractVersion: "0.1.0" as const,
  transferId: "built-in:evo.ledger-runtime.baseline.v0.1",
  source: {
    enterpriseId: "enterprise:evo-reference",
    definitionId: "evo.ledger-runtime.baseline.v0.1",
    definitionRevision: 0,
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
    payload: {
      contractVersion: "0.1.0",
      source: {
        project: ledgerRuntimeBaselineTemplateV010.source.ownerProject,
        artifact: ledgerRuntimeBaselineTemplateV010.source.artifact,
        version: ledgerRuntimeBaselineTemplateV010.source.version
      },
      runtimeFlow: [
        "BusinessData",
        "Posting",
        "LedgerEntry",
        "LedgerBalance"
      ],
      copyMode: "COPY"
    }
  },
  sharedAt,
  sharedBy: {
    actorType: "SERVICE" as const,
    subjectId: "service:evo-built-in-reference"
  }
};

export const ledgerRuntimeBaselineBundleV010: TemplateTransferBundleV010 = {
  ...unsignedLedgerRuntimeBundle,
  contentDigest: templateTransferDigestV010(unsignedLedgerRuntimeBundle)
};

export const templateStoreSeedRecordsV010: TemplateStoreRecordV010[] = [{
  contractVersion: "0.1.0",
  templateId: ledgerRuntimeBaselineTemplateV010.templateId,
  version: 1,
  bundle: ledgerRuntimeBaselineBundleV010,
  publishedAt: sharedAt
}];
