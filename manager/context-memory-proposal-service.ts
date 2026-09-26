import { randomUUID } from "node:crypto";
import type {
  ActiveContextRefV010,
  ContextMemoryEvidenceSourceV010,
  ContextMemoryItemV010,
  ContextMemoryKindV010,
  ContextMemoryReaderV010,
  ContextMemoryWriterV010,
  PlatformPrincipalV010
} from "../contracts/platform-services.js";
import type {
  ContextMemoryProposalRevisionV010,
  ContextMemoryProposalStoreV010,
  ContextMemoryProposalV010,
  ContextMemoryReviewSignalV010
} from "./context-memory-proposal-store.js";
import { sameContextRefV010 } from "./context-memory-authority.js";

export interface ContextMemoryProposalDraftV010 {
  kind: ContextMemoryKindV010;
  summary: string;
  evidenceRefs?: string[];
  evidenceSources?: ContextMemoryEvidenceSourceV010[];
  proposedConfidence?: number;
  observedAt?: string;
  supersedesMemoryId?: string;
  potentialContradictionMemoryIds?: string[];
}

export interface ContextMemoryProposalServiceV010 {
  create(input: {
    principal: PlatformPrincipalV010;
    context: ActiveContextRefV010;
    draft: ContextMemoryProposalDraftV010;
    authoredBy?: "PERSONAL_AGENT" | "SOURCE_ADAPTER";
  }): Promise<ContextMemoryProposalV010>;
  list(contextIds?: readonly string[]): ContextMemoryProposalV010[];
  get(proposalId: string): ContextMemoryProposalV010 | undefined;
  edit(input: {
    proposalId: string;
    principal: PlatformPrincipalV010;
    kind?: ContextMemoryKindV010;
    summary?: string;
  }): Promise<ContextMemoryProposalV010>;
  reject(input: {
    proposalId: string;
    principal: PlatformPrincipalV010;
    reason?: string;
  }): ContextMemoryProposalV010;
  accept(input: {
    proposalId: string;
    principal: PlatformPrincipalV010;
    kind?: ContextMemoryKindV010;
    summary?: string;
  }): Promise<{ proposal: ContextMemoryProposalV010; memory: ContextMemoryItemV010 }>;
}

function normalizedSummary(value: string): string {
  return value.trim().replace(/\s+/g, " ").toLocaleLowerCase();
}

function canonicalStrings(values: readonly string[] | undefined): string[] {
  return [...new Set((values ?? []).map(value => value.trim()).filter(Boolean))].sort();
}

function canonicalEvidenceSources(
  values: readonly ContextMemoryEvidenceSourceV010[] | undefined
): ContextMemoryEvidenceSourceV010[] {
  const byId = new Map<string, ContextMemoryEvidenceSourceV010>();
  for (const source of values ?? []) {
    if (!source.sourceId?.trim()) {
      throw new Error("CONTEXT_MEMORY_PROPOSAL_EVIDENCE_SOURCE_INVALID");
    }
    byId.set(source.sourceId.trim(), structuredClone(source));
  }
  return [...byId.values()].sort((a, b) => a.sourceId.localeCompare(b.sourceId));
}

function validKind(value: ContextMemoryKindV010): ContextMemoryKindV010 {
  if (!["FACT", "CLAIM", "EXPERIENCE", "PRACTICE"].includes(value)) {
    throw new Error("CONTEXT_MEMORY_PROPOSAL_KIND_INVALID");
  }
  return value;
}

function validSummary(value: string): string {
  const result = value.trim();
  if (!result) throw new Error("CONTEXT_MEMORY_PROPOSAL_SUMMARY_REQUIRED");
  return result;
}

function validConfidence(value: number | undefined): number | undefined {
  if (value === undefined) return undefined;
  if (!Number.isFinite(value) || value < 0 || value > 1) {
    throw new Error("CONTEXT_MEMORY_PROPOSAL_CONFIDENCE_INVALID");
  }
  return value;
}

function validObservedAt(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const time = Date.parse(value);
  if (!Number.isFinite(time)) {
    throw new Error("CONTEXT_MEMORY_PROPOSAL_OBSERVED_AT_INVALID");
  }
  return new Date(time).toISOString();
}

async function readExact(
  reader: ContextMemoryReaderV010,
  context: ActiveContextRefV010,
  ids: readonly string[]
): Promise<Map<string, ContextMemoryItemV010>> {
  const canonical = canonicalStrings(ids);
  if (canonical.length === 0) return new Map();
  const result = await reader.read({
    contractVersion: "0.1.0",
    context,
    memoryIds: canonical,
    limit: Math.min(100, canonical.length)
  });
  return new Map(result.items.map(item => [item.memoryId, item]));
}

async function reviewSignals(
  reader: ContextMemoryReaderV010,
  context: ActiveContextRefV010,
  draft: ContextMemoryProposalDraftV010
): Promise<ContextMemoryReviewSignalV010[]> {
  const signals: ContextMemoryReviewSignalV010[] = [];
  const supersedes = draft.supersedesMemoryId?.trim();
  const contradictionIds = canonicalStrings(draft.potentialContradictionMemoryIds);
  const explicitIds = [
    ...(supersedes ? [supersedes] : []),
    ...contradictionIds
  ];
  const exact = await readExact(reader, context, explicitIds);

  if (supersedes) {
    const memory = exact.get(supersedes);
    if (!memory) {
      throw new Error(`CONTEXT_MEMORY_SUPERSEDES_NOT_FOUND: ${supersedes}`);
    }
    signals.push({
      contractVersion: "0.1.0",
      kind: "SUPERSESSION_CANDIDATE",
      memoryId: memory.memoryId,
      summary: memory.summary
    });
  }

  for (const memoryId of contradictionIds) {
    const memory = exact.get(memoryId);
    if (!memory) {
      throw new Error(`CONTEXT_MEMORY_CONTRADICTION_REF_NOT_FOUND: ${memoryId}`);
    }
    signals.push({
      contractVersion: "0.1.0",
      kind: "POTENTIAL_CONTRADICTION",
      memoryId: memory.memoryId,
      summary: memory.summary
    });
  }

  const all = await reader.read({
    contractVersion: "0.1.0",
    context,
    limit: 100
  });
  const wanted = normalizedSummary(draft.summary);
  for (const memory of all.items) {
    if (
      normalizedSummary(memory.summary) === wanted
      && memory.memoryId !== supersedes
      && !contradictionIds.includes(memory.memoryId)
    ) {
      signals.push({
        contractVersion: "0.1.0",
        kind: "POTENTIAL_DUPLICATE",
        memoryId: memory.memoryId,
        summary: memory.summary
      });
    }
  }

  const byKey = new Map<string, ContextMemoryReviewSignalV010>();
  for (const signal of signals) {
    byKey.set(`${signal.kind}\u0000${signal.memoryId}`, signal);
  }
  return [...byKey.values()].sort((a, b) =>
    a.kind.localeCompare(b.kind) || a.memoryId.localeCompare(b.memoryId)
  );
}

function latest(proposal: ContextMemoryProposalV010): ContextMemoryProposalRevisionV010 {
  const revision = proposal.revisions.at(-1);
  if (!revision) {
    throw new Error(`CONTEXT_MEMORY_PROPOSAL_REVISION_REQUIRED: ${proposal.proposalId}`);
  }
  return revision;
}

function sameMaterializedMemory(
  memory: ContextMemoryItemV010,
  proposal: ContextMemoryProposalV010,
  revision: ContextMemoryProposalRevisionV010
): boolean {
  return sameContextRefV010(memory.context, proposal.context)
    && memory.kind === revision.kind
    && memory.summary === revision.summary
    && memory.supersedesMemoryId === revision.supersedesMemoryId
    && JSON.stringify(memory.provenance.evidenceRefs)
      === JSON.stringify(revision.evidenceRefs);
}

export function createContextMemoryProposalServiceV010(input: {
  store: ContextMemoryProposalStoreV010;
  resolveReader(): ContextMemoryReaderV010 | undefined;
  resolveWriter(): ContextMemoryWriterV010 | undefined;
  now?: () => Date;
  id?: () => string;
}): ContextMemoryProposalServiceV010 {
  const now = input.now ?? (() => new Date());
  const id = input.id ?? randomUUID;
  const reader = (): ContextMemoryReaderV010 => {
    const value = input.resolveReader();
    if (!value) throw new Error("CONTEXT_MEMORY_READER_REQUIRED");
    return value;
  };
  const writer = (): ContextMemoryWriterV010 => {
    const value = input.resolveWriter();
    if (!value) throw new Error("CONTEXT_MEMORY_WRITER_REQUIRED");
    return value;
  };

  async function revisionFor(
    context: ActiveContextRefV010,
    principal: PlatformPrincipalV010,
    draft: ContextMemoryProposalDraftV010,
    authoredBy: "PERSONAL_AGENT" | "SOURCE_ADAPTER" | "HUMAN"
  ): Promise<ContextMemoryProposalRevisionV010> {
    const kind = validKind(draft.kind);
    const summary = validSummary(draft.summary);
    const evidenceRefs = canonicalStrings(draft.evidenceRefs);
    const evidenceSources = canonicalEvidenceSources(draft.evidenceSources);
    const proposedConfidence = validConfidence(draft.proposedConfidence);
    const observedAt = validObservedAt(draft.observedAt);
    const supersedesMemoryId = draft.supersedesMemoryId?.trim() || undefined;
    const signals = await reviewSignals(reader(), context, {
      ...draft,
      kind,
      summary,
      evidenceRefs,
      ...(supersedesMemoryId ? { supersedesMemoryId } : {})
    });

    return {
      contractVersion: "0.1.0",
      revisionId: `memory-proposal-revision:${id()}`,
      kind,
      summary,
      evidenceRefs,
      ...(evidenceSources.length > 0 ? { evidenceSources } : {}),
      evidenceQuality: evidenceRefs.length > 0 || evidenceSources.length > 0
        ? "REFERENCED"
        : "UNVERIFIED",
      ...(proposedConfidence !== undefined ? { proposedConfidence } : {}),
      ...(observedAt ? { observedAt } : {}),
      ...(supersedesMemoryId ? { supersedesMemoryId } : {}),
      reviewSignals: signals,
      authoredBy,
      authorSubjectId: principal.subjectId,
      createdAt: now().toISOString()
    };
  }

  async function editProposal(inputEdit: {
    proposalId: string;
    principal: PlatformPrincipalV010;
    kind?: ContextMemoryKindV010;
    summary?: string;
  }): Promise<ContextMemoryProposalV010> {
    const { proposalId, principal, kind, summary } = inputEdit;
    const snapshot = input.store.snapshot();
    const proposal = snapshot.proposals.find(item => item.proposalId === proposalId);
    if (!proposal) throw new Error("CONTEXT_MEMORY_PROPOSAL_NOT_FOUND");
    if (proposal.state !== "PENDING") {
      throw new Error(`CONTEXT_MEMORY_PROPOSAL_NOT_PENDING: ${proposal.state}`);
    }
    const previous = latest(proposal);
    const nextKind = kind ?? previous.kind;
    const nextSummary = summary === undefined ? previous.summary : validSummary(summary);
    if (nextKind === previous.kind && nextSummary === previous.summary) {
      return structuredClone(proposal);
    }
    const contradictionIds = previous.reviewSignals
      .filter(signal => signal.kind === "POTENTIAL_CONTRADICTION")
      .map(signal => signal.memoryId);
    const revision = await revisionFor(
      proposal.context,
      principal,
      {
        kind: nextKind,
        summary: nextSummary,
        evidenceRefs: previous.evidenceRefs,
        ...(previous.evidenceSources ? { evidenceSources: previous.evidenceSources } : {}),
        ...(previous.proposedConfidence !== undefined
          ? { proposedConfidence: previous.proposedConfidence }
          : {}),
        ...(previous.observedAt ? { observedAt: previous.observedAt } : {}),
        ...(previous.supersedesMemoryId
          ? { supersedesMemoryId: previous.supersedesMemoryId }
          : {}),
        potentialContradictionMemoryIds: contradictionIds
      },
      "HUMAN"
    );
    const updated: ContextMemoryProposalV010 = {
      ...proposal,
      revisions: [...proposal.revisions, revision]
    };
    input.store.save({
      contractVersion: "0.1.0",
      proposals: snapshot.proposals.map(item =>
        item.proposalId === proposalId ? updated : item
      )
    });
    return structuredClone(updated);
  }

  return {
    async create({ principal, context, draft, authoredBy = "PERSONAL_AGENT" }) {
      const revision = await revisionFor(
        context,
        principal,
        draft,
        authoredBy
      );
      const proposal: ContextMemoryProposalV010 = {
        contractVersion: "0.1.0",
        proposalId: `memory-proposal:${id()}`,
        context: structuredClone(context),
        state: "PENDING",
        createdAt: revision.createdAt,
        createdBySubjectId: principal.subjectId,
        revisions: [revision]
      };
      const snapshot = input.store.snapshot();
      input.store.save({
        contractVersion: "0.1.0",
        proposals: [...snapshot.proposals, proposal]
      });
      return structuredClone(proposal);
    },

    list(contextIds) {
      const allowed = contextIds ? new Set(contextIds) : undefined;
      return input.store.snapshot().proposals
        .filter(item => !allowed || allowed.has(item.context.contextId))
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .map(item => structuredClone(item));
    },

    get(proposalId) {
      const proposal = input.store.snapshot().proposals.find(
        item => item.proposalId === proposalId
      );
      return proposal ? structuredClone(proposal) : undefined;
    },

    async edit({ proposalId, principal, kind, summary }) {
      return editProposal({ proposalId, principal, kind, summary });
    },

    reject({ proposalId, principal, reason }) {
      const snapshot = input.store.snapshot();
      const proposal = snapshot.proposals.find(item => item.proposalId === proposalId);
      if (!proposal) throw new Error("CONTEXT_MEMORY_PROPOSAL_NOT_FOUND");
      if (proposal.state !== "PENDING") {
        throw new Error(`CONTEXT_MEMORY_PROPOSAL_NOT_PENDING: ${proposal.state}`);
      }
      const rejected: ContextMemoryProposalV010 = {
        ...proposal,
        state: "REJECTED",
        decision: {
          contractVersion: "0.1.0",
          decision: "REJECTED",
          decidedAt: now().toISOString(),
          decidedBySubjectId: principal.subjectId,
          ...(reason?.trim() ? { reason: reason.trim() } : {})
        }
      };
      input.store.save({
        contractVersion: "0.1.0",
        proposals: snapshot.proposals.map(item =>
          item.proposalId === proposalId ? rejected : item
        )
      });
      return structuredClone(rejected);
    },

    async accept({ proposalId, principal, kind, summary }) {
      let proposal = input.store.snapshot().proposals.find(
        item => item.proposalId === proposalId
      );
      if (!proposal) throw new Error("CONTEXT_MEMORY_PROPOSAL_NOT_FOUND");

      if (proposal.state === "ACCEPTED") {
        const memoryId = proposal.decision?.acceptedMemoryId;
        if (!memoryId) throw new Error("CONTEXT_MEMORY_PROPOSAL_ACCEPTED_MEMORY_REQUIRED");
        const existing = await readExact(reader(), proposal.context, [memoryId]);
        const memory = existing.get(memoryId);
        if (!memory) throw new Error("CONTEXT_MEMORY_PROPOSAL_ACCEPTED_MEMORY_NOT_FOUND");
        return { proposal: structuredClone(proposal), memory: structuredClone(memory) };
      }
      if (proposal.state !== "PENDING") {
        throw new Error(`CONTEXT_MEMORY_PROPOSAL_NOT_PENDING: ${proposal.state}`);
      }

      const previous = latest(proposal);
      if (
        (kind !== undefined && kind !== previous.kind)
        || (summary !== undefined && validSummary(summary) !== previous.summary)
      ) {
        proposal = await editProposal({
          proposalId,
          principal,
          ...(kind !== undefined ? { kind } : {}),
          ...(summary !== undefined ? { summary } : {})
        });
      }

      const revision = latest(proposal);
      const memoryId = `memory:proposal:${proposal.proposalId}`;
      const existing = await readExact(reader(), proposal.context, [memoryId]);
      let memory = existing.get(memoryId);

      if (memory) {
        if (!sameMaterializedMemory(memory, proposal, revision)) {
          throw new Error("CONTEXT_MEMORY_PROPOSAL_MATERIALIZATION_CONFLICT");
        }
      } else {
        memory = await writer().write({
          contractVersion: "0.1.0",
          item: {
            contractVersion: "0.1.0",
            memoryId,
            context: structuredClone(proposal.context),
            kind: revision.kind,
            summary: revision.summary,
            provenance: {
              contractVersion: "0.1.0",
              origin: "DIRECT",
              sourceContext: structuredClone(proposal.context),
              evidenceRefs: [...revision.evidenceRefs],
              ...(revision.evidenceSources
                ? { evidenceSources: structuredClone(revision.evidenceSources) }
                : {})
            },
            attribution: {
              contractVersion: "0.1.0",
              recordedBySubjectId: principal.subjectId,
              recordedByActorType: principal.actorType,
              recordedAt: now().toISOString()
            },
            ...(revision.observedAt ? { observedAt: revision.observedAt } : {}),
            ...(revision.supersedesMemoryId
              ? { supersedesMemoryId: revision.supersedesMemoryId }
              : {}),
            ...(revision.evidenceRefs.length > 0
              ? { provenanceRefs: [...revision.evidenceRefs] }
              : {})
          }
        });
      }

      const refreshed = input.store.snapshot();
      const current = refreshed.proposals.find(item => item.proposalId === proposalId);
      if (!current) throw new Error("CONTEXT_MEMORY_PROPOSAL_NOT_FOUND");
      if (current.state === "ACCEPTED") {
        return { proposal: structuredClone(current), memory: structuredClone(memory) };
      }
      if (current.state !== "PENDING") {
        throw new Error(`CONTEXT_MEMORY_PROPOSAL_NOT_PENDING: ${current.state}`);
      }

      const accepted: ContextMemoryProposalV010 = {
        ...current,
        state: "ACCEPTED",
        decision: {
          contractVersion: "0.1.0",
          decision: "ACCEPTED",
          decidedAt: memory.attribution.recordedAt,
          decidedBySubjectId: principal.subjectId,
          acceptedMemoryId: memory.memoryId
        }
      };
      input.store.save({
        contractVersion: "0.1.0",
        proposals: refreshed.proposals.map(item =>
          item.proposalId === proposalId ? accepted : item
        )
      });
      return { proposal: structuredClone(accepted), memory: structuredClone(memory) };
    }
  };
}
