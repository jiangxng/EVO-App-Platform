import { createHash, randomUUID } from "node:crypto";
import type {
  ActiveContextRefV010,
  ContextMemoryEvidenceSourceProviderV010,
  ContextMemoryEvidenceSourceV010,
  ContextMemoryIntakeRecordV010,
  ContextMemoryIntakeSourceAdapterV010,
  PlatformPrincipalV010
} from "../contracts/platform-services.js";
import type {
  ContextMemoryProposalServiceV010
} from "./context-memory-proposal-service.js";
import type {
  ContextMemoryIntakeReceiptV010,
  ContextMemoryIntakeStoreV010
} from "./context-memory-intake-store.js";
import { sameContextRefV010 } from "./context-memory-authority.js";

export interface ContextMemoryIntakeRunResultV010 {
  contractVersion: "0.1.0";
  source: ContextMemoryEvidenceSourceV010;
  receipts: ContextMemoryIntakeReceiptV010[];
  reusedSourceRecordReceiptIds: string[];
  nextCursor?: string;
}

export interface ContextMemoryIntakeServiceV010 {
  run(input: {
    principal: PlatformPrincipalV010;
    context: ActiveContextRefV010;
    cursor?: string;
    limit?: number;
  }): Promise<ContextMemoryIntakeRunResultV010>;
  listReceipts(contextIds?: readonly string[]): ContextMemoryIntakeReceiptV010[];
}

function normalizedSummary(value: string): string {
  return value.trim().replace(/\s+/g, " ").toLocaleLowerCase();
}

function canonicalStrings(values: readonly string[] | undefined): string[] {
  return [...new Set((values ?? []).map(value => value.trim()).filter(Boolean))].sort();
}

function fingerprint(record: ContextMemoryIntakeRecordV010): string {
  const material = JSON.stringify({
    context: record.context,
    kind: record.kind,
    summary: normalizedSummary(record.summary),
    evidenceRefs: canonicalStrings(record.evidenceRefs),
    observedAt: record.observedAt ?? null,
    supersedesMemoryId: record.supersedesMemoryId ?? null,
    potentialContradictionMemoryIds: canonicalStrings(
      record.potentialContradictionMemoryIds
    )
  });
  return createHash("sha256").update(material).digest("hex");
}

function deterministicProposalId(
  sourceId: string,
  sourceRecordId: string
): string {
  const digest = createHash("sha256")
    .update(sourceId)
    .update("\0")
    .update(sourceRecordId)
    .digest("hex")
    .slice(0, 32);
  return `memory-proposal:intake:${digest}`;
}

function deterministicRevisionId(proposalId: string): string {
  return `${proposalId}:revision:1`;
}

function validateRecord(
  adapter: ContextMemoryIntakeSourceAdapterV010,
  requestedContext: ActiveContextRefV010,
  record: ContextMemoryIntakeRecordV010
): void {
  if (
    record.contractVersion !== "0.1.0"
    || record.sourceId !== adapter.sourceId
    || !record.sourceRecordId?.trim()
    || !sameContextRefV010(record.context, requestedContext)
    || !["FACT", "CLAIM", "EXPERIENCE", "PRACTICE"].includes(record.kind)
    || !record.summary?.trim()
    || !Array.isArray(record.evidenceRefs)
  ) {
    throw new Error(
      `CONTEXT_MEMORY_INTAKE_RECORD_INVALID: ${record.sourceId}/${record.sourceRecordId}`
    );
  }
}

export function createContextMemoryIntakeServiceV010(input: {
  store: ContextMemoryIntakeStoreV010;
  proposalService: ContextMemoryProposalServiceV010;
  resolveSourceAdapter(): ContextMemoryIntakeSourceAdapterV010 | undefined;
  resolveEvidenceSourceProvider(): ContextMemoryEvidenceSourceProviderV010 | undefined;
  now?: () => Date;
  id?: () => string;
}): ContextMemoryIntakeServiceV010 {
  const now = input.now ?? (() => new Date());
  const nextId = input.id ?? randomUUID;

  return {
    async run({ principal, context, cursor, limit }) {
      const adapter = input.resolveSourceAdapter();
      if (!adapter) throw new Error("CONTEXT_MEMORY_INTAKE_SOURCE_REQUIRED");
      const evidenceProvider = input.resolveEvidenceSourceProvider();
      if (!evidenceProvider) {
        throw new Error("CONTEXT_MEMORY_EVIDENCE_SOURCE_PROVIDER_REQUIRED");
      }

      const source = evidenceProvider.describe(adapter.sourceId);
      if (!source) {
        throw new Error(
          `CONTEXT_MEMORY_EVIDENCE_SOURCE_NOT_FOUND: ${adapter.sourceId}`
        );
      }
      if (source.sourceId !== adapter.sourceId) {
        throw new Error("CONTEXT_MEMORY_EVIDENCE_SOURCE_MISMATCH");
      }

      const pulled = await adapter.pull({
        contractVersion: "0.1.0",
        context,
        ...(cursor ? { cursor } : {}),
        ...(limit !== undefined ? { limit } : {})
      });

      const createdReceipts: ContextMemoryIntakeReceiptV010[] = [];
      const reusedSourceRecordReceiptIds: string[] = [];

      for (const record of pulled.records) {
        validateRecord(adapter, context, record);
        const snapshot = input.store.snapshot();
        const existingSourceReceipt = snapshot.receipts.find(item =>
          item.sourceId === record.sourceId
          && item.sourceRecordId === record.sourceRecordId
        );
        if (existingSourceReceipt) {
          reusedSourceRecordReceiptIds.push(existingSourceReceipt.receiptId);
          continue;
        }

        const recordFingerprint = fingerprint(record);
        const duplicate = snapshot.receipts.find(item =>
          item.fingerprint === recordFingerprint
          && sameContextRefV010(item.context, record.context)
          && item.outcome === "PROPOSED"
        );

        if (duplicate) {
          const receipt: ContextMemoryIntakeReceiptV010 = {
            contractVersion: "0.1.0",
            receiptId: `memory-intake-receipt:${nextId()}`,
            sourceId: record.sourceId,
            sourceRecordId: record.sourceRecordId,
            context: structuredClone(record.context),
            fingerprint: recordFingerprint,
            outcome: "DUPLICATE_FINGERPRINT",
            ...(duplicate.proposalId ? { proposalId: duplicate.proposalId } : {}),
            duplicateOfReceiptId: duplicate.receiptId,
            evidenceSource: structuredClone(source),
            ingestedAt: now().toISOString(),
            ingestedBySubjectId: principal.subjectId
          };
          input.store.save({
            contractVersion: "0.1.0",
            receipts: [...snapshot.receipts, receipt]
          });
          createdReceipts.push(structuredClone(receipt));
          continue;
        }

        const proposalId = deterministicProposalId(
          record.sourceId,
          record.sourceRecordId
        );
        const canonicalEvidenceRef =
          `source-record:${record.sourceId}:${record.sourceRecordId}`;
        const proposal = await input.proposalService.create({
          principal,
          context: record.context,
          authoredBy: "SOURCE_ADAPTER",
          proposalId,
          revisionId: deterministicRevisionId(proposalId),
          draft: {
            kind: record.kind,
            summary: record.summary,
            evidenceRefs: canonicalStrings([
              ...record.evidenceRefs,
              canonicalEvidenceRef
            ]),
            evidenceSources: [structuredClone(source)],
            ...(record.observedAt ? { observedAt: record.observedAt } : {}),
            ...(record.proposedConfidence !== undefined
              ? { proposedConfidence: record.proposedConfidence }
              : {}),
            ...(record.supersedesMemoryId
              ? { supersedesMemoryId: record.supersedesMemoryId }
              : {}),
            potentialContradictionMemoryIds:
              canonicalStrings(record.potentialContradictionMemoryIds)
          }
        });

        const refreshed = input.store.snapshot();
        const concurrent = refreshed.receipts.find(item =>
          item.sourceId === record.sourceId
          && item.sourceRecordId === record.sourceRecordId
        );
        if (concurrent) {
          if (concurrent.proposalId !== proposal.proposalId) {
            throw new Error(
              `CONTEXT_MEMORY_INTAKE_RECEIPT_CONFLICT: ${record.sourceId}/${record.sourceRecordId}`
            );
          }
          reusedSourceRecordReceiptIds.push(concurrent.receiptId);
          continue;
        }

        const receipt: ContextMemoryIntakeReceiptV010 = {
          contractVersion: "0.1.0",
          receiptId: `memory-intake-receipt:${nextId()}`,
          sourceId: record.sourceId,
          sourceRecordId: record.sourceRecordId,
          context: structuredClone(record.context),
          fingerprint: recordFingerprint,
          outcome: "PROPOSED",
          proposalId: proposal.proposalId,
          evidenceSource: structuredClone(source),
          ingestedAt: now().toISOString(),
          ingestedBySubjectId: principal.subjectId
        };
        input.store.save({
          contractVersion: "0.1.0",
          receipts: [...refreshed.receipts, receipt]
        });
        createdReceipts.push(structuredClone(receipt));
      }

      return {
        contractVersion: "0.1.0",
        source: structuredClone(source),
        receipts: createdReceipts,
        reusedSourceRecordReceiptIds,
        ...(pulled.nextCursor ? { nextCursor: pulled.nextCursor } : {})
      };
    },

    listReceipts(contextIds) {
      const allowed = contextIds ? new Set(contextIds) : undefined;
      return input.store.snapshot().receipts
        .filter(item => !allowed || allowed.has(item.context.contextId))
        .sort((a, b) =>
          b.ingestedAt.localeCompare(a.ingestedAt)
          || b.receiptId.localeCompare(a.receiptId)
        )
        .map(item => structuredClone(item));
    }
  };
}
