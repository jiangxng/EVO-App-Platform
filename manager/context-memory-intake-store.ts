import {
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  writeFileSync
} from "node:fs";
import { dirname } from "node:path";
import type {
  ActiveContextRefV010,
  ContextMemoryEvidenceSourceV010
} from "../contracts/platform-services.js";

export type ContextMemoryIntakeOutcomeV010 =
  | "PROPOSED"
  | "DUPLICATE_SOURCE_RECORD"
  | "DUPLICATE_FINGERPRINT";

export interface ContextMemoryIntakeReceiptV010 {
  contractVersion: "0.1.0";
  receiptId: string;
  sourceId: string;
  sourceRecordId: string;
  context: ActiveContextRefV010;
  fingerprint: string;
  outcome: ContextMemoryIntakeOutcomeV010;
  proposalId?: string;
  duplicateOfReceiptId?: string;
  evidenceSource: ContextMemoryEvidenceSourceV010;
  ingestedAt: string;
  ingestedBySubjectId: string;
}

export interface ContextMemoryIntakeSnapshotV010 {
  contractVersion: "0.1.0";
  receipts: ContextMemoryIntakeReceiptV010[];
}

export interface ContextMemoryIntakeStoreV010 {
  snapshot(): ContextMemoryIntakeSnapshotV010;
  save(snapshot: ContextMemoryIntakeSnapshotV010): void;
}

function empty(): ContextMemoryIntakeSnapshotV010 {
  return { contractVersion: "0.1.0", receipts: [] };
}

function clone(
  value: ContextMemoryIntakeSnapshotV010
): ContextMemoryIntakeSnapshotV010 {
  return structuredClone(value);
}

function validate(
  snapshot: ContextMemoryIntakeSnapshotV010
): ContextMemoryIntakeSnapshotV010 {
  if (
    snapshot.contractVersion !== "0.1.0"
    || !Array.isArray(snapshot.receipts)
  ) {
    throw new Error("CONTEXT_MEMORY_INTAKE_STATE_INVALID");
  }

  const receiptIds = new Set<string>();
  const sourceRecordKeys = new Set<string>();
  for (const receipt of snapshot.receipts) {
    if (!receipt.receiptId?.trim()) {
      throw new Error("CONTEXT_MEMORY_INTAKE_RECEIPT_ID_REQUIRED");
    }
    if (receiptIds.has(receipt.receiptId)) {
      throw new Error(
        `CONTEXT_MEMORY_INTAKE_RECEIPT_DUPLICATE: ${receipt.receiptId}`
      );
    }
    receiptIds.add(receipt.receiptId);

    if (
      !receipt.sourceId?.trim()
      || !receipt.sourceRecordId?.trim()
      || !receipt.context?.contextId?.trim()
      || !receipt.fingerprint?.trim()
      || !["PROPOSED", "DUPLICATE_SOURCE_RECORD", "DUPLICATE_FINGERPRINT"]
        .includes(receipt.outcome)
      || !receipt.evidenceSource?.sourceId?.trim()
      || receipt.evidenceSource.sourceId !== receipt.sourceId
      || !receipt.ingestedBySubjectId?.trim()
      || !Number.isFinite(Date.parse(receipt.ingestedAt))
    ) {
      throw new Error(
        `CONTEXT_MEMORY_INTAKE_RECEIPT_INVALID: ${receipt.receiptId}`
      );
    }

    const key = `${receipt.sourceId}\u0000${receipt.sourceRecordId}`;
    if (sourceRecordKeys.has(key)) {
      throw new Error(
        `CONTEXT_MEMORY_INTAKE_SOURCE_RECORD_RECEIPT_DUPLICATE: ${receipt.sourceId}/${receipt.sourceRecordId}`
      );
    }
    sourceRecordKeys.add(key);

    if (
      receipt.outcome === "PROPOSED"
      && !receipt.proposalId?.trim()
    ) {
      throw new Error(
        `CONTEXT_MEMORY_INTAKE_PROPOSAL_REQUIRED: ${receipt.receiptId}`
      );
    }
    if (
      receipt.outcome === "DUPLICATE_FINGERPRINT"
      && !receipt.duplicateOfReceiptId?.trim()
    ) {
      throw new Error(
        `CONTEXT_MEMORY_INTAKE_DUPLICATE_REFERENCE_REQUIRED: ${receipt.receiptId}`
      );
    }
  }

  return clone(snapshot);
}

function validateAppendOnly(
  before: ContextMemoryIntakeSnapshotV010,
  after: ContextMemoryIntakeSnapshotV010
): void {
  const current = new Map(after.receipts.map(item => [item.receiptId, item]));
  for (const receipt of before.receipts) {
    const next = current.get(receipt.receiptId);
    if (!next) {
      throw new Error(
        `CONTEXT_MEMORY_INTAKE_RECEIPT_DELETE_FORBIDDEN: ${receipt.receiptId}`
      );
    }
    if (JSON.stringify(next) !== JSON.stringify(receipt)) {
      throw new Error(
        `CONTEXT_MEMORY_INTAKE_RECEIPT_MUTATION_FORBIDDEN: ${receipt.receiptId}`
      );
    }
  }
}

export function createMemoryContextMemoryIntakeStoreV010(
  seed: ContextMemoryIntakeSnapshotV010 = empty()
): ContextMemoryIntakeStoreV010 {
  let current = validate(seed);
  return {
    snapshot() {
      return clone(current);
    },
    save(next) {
      const valid = validate(next);
      validateAppendOnly(current, valid);
      current = valid;
    }
  };
}

export function createFileContextMemoryIntakeStoreV010(
  path: string
): ContextMemoryIntakeStoreV010 {
  const load = (): ContextMemoryIntakeSnapshotV010 => {
    if (!existsSync(path)) return empty();
    return validate(
      JSON.parse(readFileSync(path, "utf8")) as ContextMemoryIntakeSnapshotV010
    );
  };

  return {
    snapshot: load,
    save(next) {
      const previous = load();
      const valid = validate(next);
      validateAppendOnly(previous, valid);
      mkdirSync(dirname(path), { recursive: true });
      const temporary = `${path}.tmp`;
      writeFileSync(temporary, JSON.stringify(valid, null, 2) + "\n", "utf8");
      renameSync(temporary, path);
    }
  };
}
