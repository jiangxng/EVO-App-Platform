import {
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  writeFileSync
} from "node:fs";
import { dirname } from "node:path";
import type { ActiveContextRefV010 } from "../contracts/platform-services.js";

export type ContextMemoryCanonicalizationProposalStateV010 =
  | "PENDING"
  | "ACCEPTED"
  | "REJECTED";

export interface ContextMemoryCanonicalizationProposalDecisionV010 {
  contractVersion: "0.1.0";
  decision: "ACCEPTED" | "REJECTED";
  decidedAt: string;
  decidedBySubjectId: string;
  canonicalizationId?: string;
  reason?: string;
}

export interface ContextMemoryCanonicalizationProposalV010 {
  contractVersion: "0.1.0";
  proposalId: string;
  context: ActiveContextRefV010;
  duplicateMemoryId: string;
  canonicalMemoryId: string;
  reason?: string;
  state: ContextMemoryCanonicalizationProposalStateV010;
  createdAt: string;
  createdBySubjectId: string;
  authoredBy: "PERSONAL_AGENT" | "HUMAN";
  decision?: ContextMemoryCanonicalizationProposalDecisionV010;
}

export type ContextMemoryCanonicalizationStateV010 =
  | "ACTIVE"
  | "REVOKED";

export interface ContextMemoryCanonicalizationEventV010 {
  contractVersion: "0.1.0";
  eventId: string;
  canonicalizationId: string;
  context: ActiveContextRefV010;
  duplicateMemoryId: string;
  canonicalMemoryId: string;
  state: ContextMemoryCanonicalizationStateV010;
  sourceProposalId?: string;
  reason?: string;
  occurredAt: string;
  actorSubjectId: string;
}

export interface ContextMemoryCanonicalizationDecisionV010 {
  contractVersion: "0.1.0";
  canonicalizationId: string;
  context: ActiveContextRefV010;
  duplicateMemoryId: string;
  canonicalMemoryId: string;
  state: ContextMemoryCanonicalizationStateV010;
  sourceProposalId?: string;
  reason?: string;
  occurredAt: string;
  actorSubjectId: string;
  effectiveEventId: string;
}

export interface ContextMemoryCanonicalizationSnapshotV010 {
  contractVersion: "0.1.0";
  proposals: ContextMemoryCanonicalizationProposalV010[];
  events: ContextMemoryCanonicalizationEventV010[];
}

export interface ContextMemoryCanonicalizationStoreV010 {
  snapshot(): ContextMemoryCanonicalizationSnapshotV010;
  save(snapshot: ContextMemoryCanonicalizationSnapshotV010): void;
  relation(canonicalizationId: string): ContextMemoryCanonicalizationDecisionV010 | undefined;
  activeForDuplicate(memoryId: string): ContextMemoryCanonicalizationDecisionV010 | undefined;
  listForContext(context: ActiveContextRefV010): ContextMemoryCanonicalizationDecisionV010[];
}

function empty(): ContextMemoryCanonicalizationSnapshotV010 {
  return { contractVersion: "0.1.0", proposals: [], events: [] };
}

function sameContext(a: ActiveContextRefV010, b: ActiveContextRefV010): boolean {
  return a.kind === b.kind
    && a.contextId === b.contextId
    && (
      a.kind !== "ENTERPRISE"
      || b.kind !== "ENTERPRISE"
      || a.enterpriseId === b.enterpriseId
    );
}

function validDate(value: string): boolean {
  return Number.isFinite(Date.parse(value));
}

function latestEvents(
  events: readonly ContextMemoryCanonicalizationEventV010[]
): Map<string, ContextMemoryCanonicalizationEventV010> {
  const result = new Map<string, ContextMemoryCanonicalizationEventV010>();
  for (const event of [...events].sort((a, b) =>
    a.occurredAt.localeCompare(b.occurredAt)
    || a.eventId.localeCompare(b.eventId)
  )) {
    result.set(event.canonicalizationId, event);
  }
  return result;
}

function materialize(
  event: ContextMemoryCanonicalizationEventV010
): ContextMemoryCanonicalizationDecisionV010 {
  const { eventId, ...rest } = event;
  return { ...structuredClone(rest), effectiveEventId: eventId };
}

function validate(
  snapshot: ContextMemoryCanonicalizationSnapshotV010
): ContextMemoryCanonicalizationSnapshotV010 {
  if (
    snapshot.contractVersion !== "0.1.0"
    || !Array.isArray(snapshot.proposals)
    || !Array.isArray(snapshot.events)
  ) {
    throw new Error("CONTEXT_MEMORY_CANONICALIZATION_STATE_INVALID");
  }

  const proposalIds = new Set<string>();
  for (const proposal of snapshot.proposals) {
    if (
      proposal.contractVersion !== "0.1.0"
      || !proposal.proposalId?.trim()
      || proposalIds.has(proposal.proposalId)
      || !proposal.context?.contextId?.trim()
      || !proposal.duplicateMemoryId?.trim()
      || !proposal.canonicalMemoryId?.trim()
      || proposal.duplicateMemoryId === proposal.canonicalMemoryId
      || !["PENDING", "ACCEPTED", "REJECTED"].includes(proposal.state)
      || !["PERSONAL_AGENT", "HUMAN"].includes(proposal.authoredBy)
      || !proposal.createdBySubjectId?.trim()
      || !validDate(proposal.createdAt)
    ) {
      throw new Error("CONTEXT_MEMORY_CANONICALIZATION_PROPOSAL_INVALID");
    }
    proposalIds.add(proposal.proposalId);
    if (proposal.state === "PENDING" && proposal.decision !== undefined) {
      throw new Error("CONTEXT_MEMORY_CANONICALIZATION_PENDING_DECISION_FORBIDDEN");
    }
    if (proposal.state !== "PENDING") {
      if (
        !proposal.decision
        || proposal.decision.decision !== proposal.state
        || !proposal.decision.decidedBySubjectId?.trim()
        || !validDate(proposal.decision.decidedAt)
      ) {
        throw new Error("CONTEXT_MEMORY_CANONICALIZATION_DECISION_INVALID");
      }
      if (
        proposal.state === "ACCEPTED"
        && !proposal.decision.canonicalizationId?.trim()
      ) {
        throw new Error("CONTEXT_MEMORY_CANONICALIZATION_ACCEPTED_RELATION_REQUIRED");
      }
    }
  }

  const eventIds = new Set<string>();
  const relationPairs = new Map<string, {
    context: ActiveContextRefV010;
    duplicateMemoryId: string;
    canonicalMemoryId: string;
  }>();
  for (const event of snapshot.events) {
    if (
      event.contractVersion !== "0.1.0"
      || !event.eventId?.trim()
      || eventIds.has(event.eventId)
      || !event.canonicalizationId?.trim()
      || !event.context?.contextId?.trim()
      || !event.duplicateMemoryId?.trim()
      || !event.canonicalMemoryId?.trim()
      || event.duplicateMemoryId === event.canonicalMemoryId
      || !["ACTIVE", "REVOKED"].includes(event.state)
      || !event.actorSubjectId?.trim()
      || !validDate(event.occurredAt)
    ) {
      throw new Error("CONTEXT_MEMORY_CANONICALIZATION_EVENT_INVALID");
    }
    eventIds.add(event.eventId);
    const existing = relationPairs.get(event.canonicalizationId);
    if (existing) {
      if (
        !sameContext(existing.context, event.context)
        || existing.duplicateMemoryId !== event.duplicateMemoryId
        || existing.canonicalMemoryId !== event.canonicalMemoryId
      ) {
        throw new Error("CONTEXT_MEMORY_CANONICALIZATION_RELATION_IMMUTABLE");
      }
    } else {
      relationPairs.set(event.canonicalizationId, {
        context: structuredClone(event.context),
        duplicateMemoryId: event.duplicateMemoryId,
        canonicalMemoryId: event.canonicalMemoryId
      });
    }
  }

  const active = [...latestEvents(snapshot.events).values()]
    .filter(event => event.state === "ACTIVE");
  const duplicateIds = new Set<string>();
  for (const relation of active) {
    if (duplicateIds.has(relation.duplicateMemoryId)) {
      throw new Error("CONTEXT_MEMORY_CANONICALIZATION_DUPLICATE_HAS_MULTIPLE_CANONICALS");
    }
    duplicateIds.add(relation.duplicateMemoryId);
  }
  for (const relation of active) {
    const visited = new Set<string>([relation.duplicateMemoryId]);
    let current = relation.canonicalMemoryId;
    while (duplicateIds.has(current)) {
      if (visited.has(current)) {
        throw new Error("CONTEXT_MEMORY_CANONICALIZATION_CYCLE");
      }
      visited.add(current);
      const next = active.find(item => item.duplicateMemoryId === current);
      if (!next) break;
      if (!sameContext(relation.context, next.context)) {
        throw new Error("CONTEXT_MEMORY_CANONICALIZATION_CONTEXT_MISMATCH");
      }
      current = next.canonicalMemoryId;
    }
  }

  return structuredClone(snapshot);
}

function validateTransition(
  previous: ContextMemoryCanonicalizationSnapshotV010,
  next: ContextMemoryCanonicalizationSnapshotV010
): void {
  const nextProposals = new Map(next.proposals.map(item => [item.proposalId, item]));
  for (const before of previous.proposals) {
    const after = nextProposals.get(before.proposalId);
    if (!after) {
      throw new Error("CONTEXT_MEMORY_CANONICALIZATION_PROPOSAL_DELETE_FORBIDDEN");
    }
    if (
      JSON.stringify(before.context) !== JSON.stringify(after.context)
      || before.duplicateMemoryId !== after.duplicateMemoryId
      || before.canonicalMemoryId !== after.canonicalMemoryId
      || before.createdAt !== after.createdAt
      || before.createdBySubjectId !== after.createdBySubjectId
      || before.authoredBy !== after.authoredBy
      || before.reason !== after.reason
    ) {
      throw new Error("CONTEXT_MEMORY_CANONICALIZATION_PROPOSAL_FACT_IMMUTABLE");
    }
    if (before.state !== "PENDING" && JSON.stringify(before) !== JSON.stringify(after)) {
      throw new Error("CONTEXT_MEMORY_CANONICALIZATION_PROPOSAL_TERMINAL_IMMUTABLE");
    }
  }

  if (next.events.length < previous.events.length) {
    throw new Error("CONTEXT_MEMORY_CANONICALIZATION_EVENT_DELETE_FORBIDDEN");
  }
  for (let index = 0; index < previous.events.length; index += 1) {
    if (JSON.stringify(previous.events[index]) !== JSON.stringify(next.events[index])) {
      throw new Error("CONTEXT_MEMORY_CANONICALIZATION_EVENT_IMMUTABLE");
    }
  }
}

function buildStore(
  load: () => ContextMemoryCanonicalizationSnapshotV010,
  persist: (snapshot: ContextMemoryCanonicalizationSnapshotV010) => void
): ContextMemoryCanonicalizationStoreV010 {
  return {
    snapshot() {
      return structuredClone(load());
    },
    save(next) {
      const previous = load();
      const valid = validate(next);
      validateTransition(previous, valid);
      persist(valid);
    },
    relation(canonicalizationId) {
      const event = latestEvents(load().events).get(canonicalizationId);
      return event ? materialize(event) : undefined;
    },
    activeForDuplicate(memoryId) {
      const event = [...latestEvents(load().events).values()].find(
        item => item.state === "ACTIVE" && item.duplicateMemoryId === memoryId
      );
      return event ? materialize(event) : undefined;
    },
    listForContext(context) {
      return [...latestEvents(load().events).values()]
        .filter(item => sameContext(item.context, context))
        .map(materialize)
        .sort((a, b) =>
          b.occurredAt.localeCompare(a.occurredAt)
          || a.canonicalizationId.localeCompare(b.canonicalizationId)
        );
    }
  };
}

export function createMemoryContextMemoryCanonicalizationStoreV010(
  seed: ContextMemoryCanonicalizationSnapshotV010 = empty()
): ContextMemoryCanonicalizationStoreV010 {
  let current = validate(seed);
  return buildStore(
    () => current,
    next => { current = structuredClone(next); }
  );
}

export function createFileContextMemoryCanonicalizationStoreV010(
  path: string
): ContextMemoryCanonicalizationStoreV010 {
  const load = () => {
    if (!existsSync(path)) return empty();
    return validate(
      JSON.parse(readFileSync(path, "utf8")) as ContextMemoryCanonicalizationSnapshotV010
    );
  };
  return buildStore(load, next => {
    mkdirSync(dirname(path), { recursive: true });
    const temporary = `${path}.tmp`;
    writeFileSync(temporary, JSON.stringify(next, null, 2) + "\n", "utf8");
    renameSync(temporary, path);
  });
}
