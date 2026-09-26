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
  ContextMemoryEvidenceSourceV010,
  ContextMemoryKindV010
} from "../contracts/platform-services.js";

export type ContextMemoryProposalStateV010 =
  | "PENDING"
  | "ACCEPTED"
  | "REJECTED";

export type ContextMemoryEvidenceQualityV010 =
  | "UNVERIFIED"
  | "REFERENCED";

export type ContextMemoryReviewSignalKindV010 =
  | "POTENTIAL_DUPLICATE"
  | "POTENTIAL_CONTRADICTION"
  | "SUPERSESSION_CANDIDATE";

export interface ContextMemoryReviewSignalV010 {
  contractVersion: "0.1.0";
  kind: ContextMemoryReviewSignalKindV010;
  memoryId: string;
  summary: string;
}

export interface ContextMemoryProposalRevisionV010 {
  contractVersion: "0.1.0";
  revisionId: string;
  kind: ContextMemoryKindV010;
  summary: string;
  evidenceRefs: string[];
  evidenceSources?: ContextMemoryEvidenceSourceV010[];
  evidenceQuality: ContextMemoryEvidenceQualityV010;
  proposedConfidence?: number;
  observedAt?: string;
  supersedesMemoryId?: string;
  reviewSignals: ContextMemoryReviewSignalV010[];
  authoredBy: "PERSONAL_AGENT" | "SOURCE_ADAPTER" | "HUMAN";
  authorSubjectId: string;
  createdAt: string;
}

export interface ContextMemoryProposalDecisionV010 {
  contractVersion: "0.1.0";
  decision: "ACCEPTED" | "REJECTED";
  decidedAt: string;
  decidedBySubjectId: string;
  acceptedMemoryId?: string;
  reason?: string;
}

export interface ContextMemoryProposalV010 {
  contractVersion: "0.1.0";
  proposalId: string;
  context: ActiveContextRefV010;
  state: ContextMemoryProposalStateV010;
  createdAt: string;
  createdBySubjectId: string;
  revisions: ContextMemoryProposalRevisionV010[];
  decision?: ContextMemoryProposalDecisionV010;
}

export interface ContextMemoryProposalSnapshotV010 {
  contractVersion: "0.1.0";
  proposals: ContextMemoryProposalV010[];
}

export interface ContextMemoryProposalStoreV010 {
  snapshot(): ContextMemoryProposalSnapshotV010;
  save(snapshot: ContextMemoryProposalSnapshotV010): void;
}

function empty(): ContextMemoryProposalSnapshotV010 {
  return { contractVersion: "0.1.0", proposals: [] };
}

function clone(
  value: ContextMemoryProposalSnapshotV010
): ContextMemoryProposalSnapshotV010 {
  return structuredClone(value);
}

function validDate(value: string): boolean {
  return Number.isFinite(Date.parse(value));
}

function validateRevision(
  proposalId: string,
  revision: ContextMemoryProposalRevisionV010
): void {
  if (!revision.revisionId?.trim()) {
    throw new Error(`CONTEXT_MEMORY_PROPOSAL_REVISION_ID_REQUIRED: ${proposalId}`);
  }
  if (!["FACT", "CLAIM", "EXPERIENCE", "PRACTICE"].includes(revision.kind)) {
    throw new Error(`CONTEXT_MEMORY_PROPOSAL_KIND_INVALID: ${proposalId}`);
  }
  if (!revision.summary?.trim()) {
    throw new Error(`CONTEXT_MEMORY_PROPOSAL_SUMMARY_REQUIRED: ${proposalId}`);
  }
  if (!Array.isArray(revision.evidenceRefs)) {
    throw new Error(`CONTEXT_MEMORY_PROPOSAL_EVIDENCE_INVALID: ${proposalId}`);
  }
  if (!["UNVERIFIED", "REFERENCED"].includes(revision.evidenceQuality)) {
    throw new Error(`CONTEXT_MEMORY_PROPOSAL_EVIDENCE_QUALITY_INVALID: ${proposalId}`);
  }
  if (revision.evidenceSources !== undefined) {
    if (!Array.isArray(revision.evidenceSources)) {
      throw new Error(`CONTEXT_MEMORY_PROPOSAL_EVIDENCE_SOURCES_INVALID: ${proposalId}`);
    }
    for (const source of revision.evidenceSources) {
      if (
        source.contractVersion !== "0.1.0"
        || !source.sourceId?.trim()
        || !["HUMAN", "APPLICATION", "DOCUMENT", "EXTERNAL_SYSTEM", "EXPERIENCE_COMPILER"]
          .includes(source.sourceType)
        || !["UNVERIFIED", "DECLARED", "HOST_VERIFIED"].includes(source.trustLevel)
        || (source.verifiedAt !== undefined && !validDate(source.verifiedAt))
      ) {
        throw new Error(`CONTEXT_MEMORY_PROPOSAL_EVIDENCE_SOURCE_INVALID: ${proposalId}`);
      }
    }
  }
  if (
    revision.proposedConfidence !== undefined
    && (
      !Number.isFinite(revision.proposedConfidence)
      || revision.proposedConfidence < 0
      || revision.proposedConfidence > 1
    )
  ) {
    throw new Error(`CONTEXT_MEMORY_PROPOSAL_CONFIDENCE_INVALID: ${proposalId}`);
  }
  if (revision.observedAt && !validDate(revision.observedAt)) {
    throw new Error(`CONTEXT_MEMORY_PROPOSAL_OBSERVED_AT_INVALID: ${proposalId}`);
  }
  if (!["PERSONAL_AGENT", "SOURCE_ADAPTER", "HUMAN"].includes(revision.authoredBy)) {
    throw new Error(`CONTEXT_MEMORY_PROPOSAL_AUTHOR_INVALID: ${proposalId}`);
  }
  if (!revision.authorSubjectId?.trim() || !validDate(revision.createdAt)) {
    throw new Error(`CONTEXT_MEMORY_PROPOSAL_REVISION_ATTRIBUTION_INVALID: ${proposalId}`);
  }
  if (!Array.isArray(revision.reviewSignals)) {
    throw new Error(`CONTEXT_MEMORY_PROPOSAL_SIGNALS_INVALID: ${proposalId}`);
  }
  for (const signal of revision.reviewSignals) {
    if (
      !["POTENTIAL_DUPLICATE", "POTENTIAL_CONTRADICTION", "SUPERSESSION_CANDIDATE"]
        .includes(signal.kind)
      || !signal.memoryId?.trim()
      || !signal.summary?.trim()
    ) {
      throw new Error(`CONTEXT_MEMORY_PROPOSAL_SIGNAL_INVALID: ${proposalId}`);
    }
  }
}

function validate(
  snapshot: ContextMemoryProposalSnapshotV010
): ContextMemoryProposalSnapshotV010 {
  if (
    snapshot.contractVersion !== "0.1.0"
    || !Array.isArray(snapshot.proposals)
  ) {
    throw new Error("CONTEXT_MEMORY_PROPOSAL_STATE_INVALID");
  }

  const proposalIds = new Set<string>();
  const revisionIds = new Set<string>();
  for (const proposal of snapshot.proposals) {
    if (!proposal.proposalId?.trim()) {
      throw new Error("CONTEXT_MEMORY_PROPOSAL_ID_REQUIRED");
    }
    if (proposalIds.has(proposal.proposalId)) {
      throw new Error(`CONTEXT_MEMORY_PROPOSAL_DUPLICATE: ${proposal.proposalId}`);
    }
    proposalIds.add(proposal.proposalId);

    if (!proposal.context?.contextId?.trim()) {
      throw new Error(`CONTEXT_MEMORY_PROPOSAL_CONTEXT_REQUIRED: ${proposal.proposalId}`);
    }
    if (!["PENDING", "ACCEPTED", "REJECTED"].includes(proposal.state)) {
      throw new Error(`CONTEXT_MEMORY_PROPOSAL_STATE_INVALID: ${proposal.proposalId}`);
    }
    if (!proposal.createdBySubjectId?.trim() || !validDate(proposal.createdAt)) {
      throw new Error(`CONTEXT_MEMORY_PROPOSAL_CREATION_INVALID: ${proposal.proposalId}`);
    }
    if (!Array.isArray(proposal.revisions) || proposal.revisions.length === 0) {
      throw new Error(`CONTEXT_MEMORY_PROPOSAL_REVISION_REQUIRED: ${proposal.proposalId}`);
    }
    for (const revision of proposal.revisions) {
      validateRevision(proposal.proposalId, revision);
      if (revisionIds.has(revision.revisionId)) {
        throw new Error(`CONTEXT_MEMORY_PROPOSAL_REVISION_DUPLICATE: ${revision.revisionId}`);
      }
      revisionIds.add(revision.revisionId);
    }

    if (proposal.state === "PENDING" && proposal.decision) {
      throw new Error(`CONTEXT_MEMORY_PROPOSAL_PENDING_DECISION_FORBIDDEN: ${proposal.proposalId}`);
    }
    if (proposal.state !== "PENDING") {
      if (!proposal.decision || proposal.decision.decision !== proposal.state) {
        throw new Error(`CONTEXT_MEMORY_PROPOSAL_DECISION_REQUIRED: ${proposal.proposalId}`);
      }
      if (
        !proposal.decision.decidedBySubjectId?.trim()
        || !validDate(proposal.decision.decidedAt)
      ) {
        throw new Error(`CONTEXT_MEMORY_PROPOSAL_DECISION_INVALID: ${proposal.proposalId}`);
      }
      if (
        proposal.state === "ACCEPTED"
        && !proposal.decision.acceptedMemoryId?.trim()
      ) {
        throw new Error(`CONTEXT_MEMORY_PROPOSAL_ACCEPTED_MEMORY_REQUIRED: ${proposal.proposalId}`);
      }
    }
  }

  return clone(snapshot);
}

function validateTransition(
  previous: ContextMemoryProposalSnapshotV010,
  next: ContextMemoryProposalSnapshotV010
): void {
  const after = new Map(next.proposals.map(item => [item.proposalId, item]));
  for (const before of previous.proposals) {
    const current = after.get(before.proposalId);
    if (!current) {
      throw new Error(`CONTEXT_MEMORY_PROPOSAL_DELETE_FORBIDDEN: ${before.proposalId}`);
    }
    if (
      JSON.stringify(before.context) !== JSON.stringify(current.context)
      || before.createdAt !== current.createdAt
      || before.createdBySubjectId !== current.createdBySubjectId
    ) {
      throw new Error(`CONTEXT_MEMORY_PROPOSAL_CREATION_FACT_IMMUTABLE: ${before.proposalId}`);
    }

    if (before.state !== "PENDING") {
      if (JSON.stringify(before) !== JSON.stringify(current)) {
        throw new Error(`CONTEXT_MEMORY_PROPOSAL_TERMINAL_IMMUTABLE: ${before.proposalId}`);
      }
      continue;
    }

    if (current.revisions.length < before.revisions.length) {
      throw new Error(`CONTEXT_MEMORY_PROPOSAL_REVISION_DELETE_FORBIDDEN: ${before.proposalId}`);
    }
    for (let index = 0; index < before.revisions.length; index += 1) {
      if (JSON.stringify(before.revisions[index]) !== JSON.stringify(current.revisions[index])) {
        throw new Error(`CONTEXT_MEMORY_PROPOSAL_REVISION_IMMUTABLE: ${before.proposalId}`);
      }
    }
    if (!["PENDING", "ACCEPTED", "REJECTED"].includes(current.state)) {
      throw new Error(`CONTEXT_MEMORY_PROPOSAL_TRANSITION_INVALID: ${before.proposalId}`);
    }
  }
}

export function createMemoryContextMemoryProposalStoreV010(
  seed: ContextMemoryProposalSnapshotV010 = empty()
): ContextMemoryProposalStoreV010 {
  let current = validate(seed);
  return {
    snapshot() {
      return clone(current);
    },
    save(next) {
      const valid = validate(next);
      validateTransition(current, valid);
      current = valid;
    }
  };
}

export function createFileContextMemoryProposalStoreV010(
  path: string
): ContextMemoryProposalStoreV010 {
  const load = (): ContextMemoryProposalSnapshotV010 => {
    if (!existsSync(path)) return empty();
    return validate(
      JSON.parse(readFileSync(path, "utf8")) as ContextMemoryProposalSnapshotV010
    );
  };

  return {
    snapshot: load,
    save(next) {
      const previous = load();
      const valid = validate(next);
      validateTransition(previous, valid);
      mkdirSync(dirname(path), { recursive: true });
      const temporary = `${path}.tmp`;
      writeFileSync(temporary, JSON.stringify(valid, null, 2) + "\n", "utf8");
      renameSync(temporary, path);
    }
  };
}
