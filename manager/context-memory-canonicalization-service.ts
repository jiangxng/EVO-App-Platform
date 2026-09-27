import { randomUUID } from "node:crypto";
import type {
  ActiveContextRefV010,
  PlatformPrincipalV010
} from "../contracts/platform-services.js";
import type { ContextMemoryStoreV010 } from "./context-memory-store.js";
import type {
  ContextMemoryCanonicalizationDecisionV010,
  ContextMemoryCanonicalizationProposalV010,
  ContextMemoryCanonicalizationStoreV010
} from "./context-memory-canonicalization-store.js";

function sameContext(a: ActiveContextRefV010, b: ActiveContextRefV010): boolean {
  return a.kind === b.kind
    && a.contextId === b.contextId
    && (
      a.kind !== "ENTERPRISE"
      || b.kind !== "ENTERPRISE"
      || a.enterpriseId === b.enterpriseId
    );
}

export interface ContextMemoryCanonicalizationServiceV010 {
  create(input: {
    principal: PlatformPrincipalV010;
    context: ActiveContextRefV010;
    duplicateMemoryId: string;
    canonicalMemoryId: string;
    reason?: string;
    authoredBy?: "PERSONAL_AGENT" | "HUMAN";
  }): ContextMemoryCanonicalizationProposalV010;
  get(proposalId: string): ContextMemoryCanonicalizationProposalV010 | undefined;
  list(contextIds?: readonly string[]): ContextMemoryCanonicalizationProposalV010[];
  accept(input: {
    proposalId: string;
    principal: PlatformPrincipalV010;
    reason?: string;
  }): ContextMemoryCanonicalizationProposalV010;
  reject(input: {
    proposalId: string;
    principal: PlatformPrincipalV010;
    reason?: string;
  }): ContextMemoryCanonicalizationProposalV010;
  listActiveForContext(context: ActiveContextRefV010): ContextMemoryCanonicalizationDecisionV010[];
}

export function createContextMemoryCanonicalizationServiceV010(input: {
  store: ContextMemoryCanonicalizationStoreV010;
  memoryStore: ContextMemoryStoreV010;
  now?: () => Date;
  id?: () => string;
}): ContextMemoryCanonicalizationServiceV010 {
  const now = input.now ?? (() => new Date());
  const id = input.id ?? randomUUID;

  const requireMemory = (memoryId: string, context: ActiveContextRefV010) => {
    const memory = input.memoryStore.snapshot().items.find(item => item.memoryId === memoryId);
    if (!memory) {
      throw new Error(`CONTEXT_MEMORY_CANONICALIZATION_MEMORY_NOT_FOUND: ${memoryId}`);
    }
    if (!sameContext(memory.context, context)) {
      throw new Error("CONTEXT_MEMORY_CANONICALIZATION_CONTEXT_MISMATCH");
    }
    return memory;
  };

  const resolveCanonical = (
    memoryId: string,
    context: ActiveContextRefV010,
    stopAt?: string
  ): string => {
    const visited = new Set<string>();
    let current = memoryId;
    while (true) {
      if (current === stopAt) {
        throw new Error("CONTEXT_MEMORY_CANONICALIZATION_CYCLE");
      }
      if (visited.has(current)) {
        throw new Error("CONTEXT_MEMORY_CANONICALIZATION_CYCLE");
      }
      visited.add(current);
      const relation = input.store.activeForDuplicate(current);
      if (!relation) return current;
      if (!sameContext(relation.context, context)) {
        throw new Error("CONTEXT_MEMORY_CANONICALIZATION_CONTEXT_MISMATCH");
      }
      current = relation.canonicalMemoryId;
    }
  };

  return {
    create(request) {
      const duplicateMemoryId = request.duplicateMemoryId.trim();
      const requestedCanonicalMemoryId = request.canonicalMemoryId.trim();
      if (
        !duplicateMemoryId
        || !requestedCanonicalMemoryId
        || duplicateMemoryId === requestedCanonicalMemoryId
      ) {
        throw new Error("CONTEXT_MEMORY_CANONICALIZATION_PAIR_INVALID");
      }
      requireMemory(duplicateMemoryId, request.context);
      requireMemory(requestedCanonicalMemoryId, request.context);
      if (input.store.activeForDuplicate(duplicateMemoryId)) {
        throw new Error("CONTEXT_MEMORY_ALREADY_CANONICALIZED");
      }
      const canonicalMemoryId = resolveCanonical(
        requestedCanonicalMemoryId,
        request.context,
        duplicateMemoryId
      );
      requireMemory(canonicalMemoryId, request.context);

      const existing = input.store.snapshot().proposals.find(proposal =>
        proposal.state === "PENDING"
        && sameContext(proposal.context, request.context)
        && proposal.duplicateMemoryId === duplicateMemoryId
        && proposal.canonicalMemoryId === canonicalMemoryId
      );
      if (existing) return structuredClone(existing);

      const proposal: ContextMemoryCanonicalizationProposalV010 = {
        contractVersion: "0.1.0",
        proposalId: `memory-canonicalization-proposal:${id()}`,
        context: structuredClone(request.context),
        duplicateMemoryId,
        canonicalMemoryId,
        ...(request.reason?.trim() ? { reason: request.reason.trim() } : {}),
        state: "PENDING",
        createdAt: now().toISOString(),
        createdBySubjectId: request.principal.subjectId,
        authoredBy: request.authoredBy ?? "PERSONAL_AGENT"
      };
      const snapshot = input.store.snapshot();
      input.store.save({
        ...snapshot,
        proposals: [...snapshot.proposals, proposal]
      });
      return structuredClone(proposal);
    },

    get(proposalId) {
      const proposal = input.store.snapshot().proposals.find(
        item => item.proposalId === proposalId
      );
      return proposal ? structuredClone(proposal) : undefined;
    },

    list(contextIds) {
      const allowed = contextIds ? new Set(contextIds) : undefined;
      return input.store.snapshot().proposals
        .filter(item => !allowed || allowed.has(item.context.contextId))
        .sort((a, b) =>
          b.createdAt.localeCompare(a.createdAt)
          || a.proposalId.localeCompare(b.proposalId)
        )
        .map(item => structuredClone(item));
    },

    accept(request) {
      const snapshot = input.store.snapshot();
      const index = snapshot.proposals.findIndex(
        item => item.proposalId === request.proposalId
      );
      if (index < 0) {
        throw new Error("CONTEXT_MEMORY_CANONICALIZATION_PROPOSAL_NOT_FOUND");
      }
      const proposal = snapshot.proposals[index];
      if (proposal.state !== "PENDING") {
        throw new Error("CONTEXT_MEMORY_CANONICALIZATION_PROPOSAL_NOT_PENDING");
      }
      requireMemory(proposal.duplicateMemoryId, proposal.context);
      requireMemory(proposal.canonicalMemoryId, proposal.context);
      if (input.store.activeForDuplicate(proposal.duplicateMemoryId)) {
        throw new Error("CONTEXT_MEMORY_ALREADY_CANONICALIZED");
      }
      const canonicalMemoryId = resolveCanonical(
        proposal.canonicalMemoryId,
        proposal.context,
        proposal.duplicateMemoryId
      );
      if (canonicalMemoryId !== proposal.canonicalMemoryId) {
        throw new Error("CONTEXT_MEMORY_CANONICALIZATION_TARGET_CHANGED");
      }

      const canonicalizationId = `memory-canonicalization:${id()}`;
      const occurredAt = now().toISOString();
      const event = {
        contractVersion: "0.1.0" as const,
        eventId: `memory-canonicalization-event:${id()}`,
        canonicalizationId,
        context: structuredClone(proposal.context),
        duplicateMemoryId: proposal.duplicateMemoryId,
        canonicalMemoryId: proposal.canonicalMemoryId,
        state: "ACTIVE" as const,
        sourceProposalId: proposal.proposalId,
        ...(request.reason?.trim()
          ? { reason: request.reason.trim() }
          : proposal.reason
            ? { reason: proposal.reason }
            : {}),
        occurredAt,
        actorSubjectId: request.principal.subjectId
      };
      const accepted: ContextMemoryCanonicalizationProposalV010 = {
        ...proposal,
        state: "ACCEPTED",
        decision: {
          contractVersion: "0.1.0",
          decision: "ACCEPTED",
          decidedAt: occurredAt,
          decidedBySubjectId: request.principal.subjectId,
          canonicalizationId,
          ...(request.reason?.trim() ? { reason: request.reason.trim() } : {})
        }
      };
      const proposals = [...snapshot.proposals];
      proposals[index] = accepted;
      input.store.save({
        ...snapshot,
        proposals,
        events: [...snapshot.events, event]
      });
      return structuredClone(accepted);
    },

    reject(request) {
      const snapshot = input.store.snapshot();
      const index = snapshot.proposals.findIndex(
        item => item.proposalId === request.proposalId
      );
      if (index < 0) {
        throw new Error("CONTEXT_MEMORY_CANONICALIZATION_PROPOSAL_NOT_FOUND");
      }
      const proposal = snapshot.proposals[index];
      if (proposal.state !== "PENDING") {
        throw new Error("CONTEXT_MEMORY_CANONICALIZATION_PROPOSAL_NOT_PENDING");
      }
      const rejected: ContextMemoryCanonicalizationProposalV010 = {
        ...proposal,
        state: "REJECTED",
        decision: {
          contractVersion: "0.1.0",
          decision: "REJECTED",
          decidedAt: now().toISOString(),
          decidedBySubjectId: request.principal.subjectId,
          ...(request.reason?.trim() ? { reason: request.reason.trim() } : {})
        }
      };
      const proposals = [...snapshot.proposals];
      proposals[index] = rejected;
      input.store.save({ ...snapshot, proposals });
      return structuredClone(rejected);
    },

    listActiveForContext(context) {
      return input.store.listForContext(context)
        .filter(item => item.state === "ACTIVE");
    }
  };
}
