import {
  appendFileSync,
  existsSync,
  mkdirSync,
  readFileSync
} from "node:fs";
import { dirname } from "node:path";
import type {
  AgentActionReceiptBeginInputV010,
  AgentActionReceiptEventV010,
  AgentActionReceiptServiceV010,
  AgentActionReceiptTerminalInputV010,
  AgentActionReceiptV010
} from "../contracts/agent-action-receipt.js";
import type { ActiveContextRefV010 } from "../contracts/platform-services.js";

export interface AgentActionReceiptEventStoreV010 {
  append(event: AgentActionReceiptEventV010): void;
  listEvents(): AgentActionReceiptEventV010[];
}

function sameContext(
  a: ActiveContextRefV010,
  b: ActiveContextRefV010
): boolean {
  return a.kind === b.kind
    && a.contextId === b.contextId
    && (
      a.kind !== "ENTERPRISE"
      || b.kind !== "ENTERPRISE"
      || a.enterpriseId === b.enterpriseId
    );
}

function validEvent(event: AgentActionReceiptEventV010): void {
  if (
    event.contractVersion !== "0.1.0"
    || !event.eventId?.trim()
    || !event.receiptId?.trim()
    || !event.invocationId?.trim()
    || !event.idempotencyKey?.trim()
    || !event.sourceInteractionId?.trim()
    || !event.sourceActionId?.trim()
    || !event.principalSubjectId?.trim()
    || !event.context?.contextId?.trim()
    || !event.toolId?.trim()
    || !event.ownerPackageId?.trim()
    || event.effect !== "WRITE"
    || !/^[a-f0-9]{64}$/.test(event.inputDigest)
    || !["REQUESTED", "SUCCEEDED", "FAILED", "DENIED"].includes(event.status)
    || !Number.isFinite(Date.parse(event.requestedAt))
    || !Number.isFinite(Date.parse(event.occurredAt))
  ) {
    throw new Error("AGENT_ACTION_RECEIPT_EVENT_INVALID");
  }
  if (
    event.status === "REQUESTED"
    && (
      event.completedAt !== undefined
      || event.resultDigest !== undefined
      || event.resultEntityRefs !== undefined
      || event.resultSummary !== undefined
      || event.error !== undefined
    )
  ) {
    throw new Error("AGENT_ACTION_RECEIPT_REQUESTED_TERMINAL_FIELDS_FORBIDDEN");
  }
  if (event.status !== "REQUESTED") {
    if (!event.completedAt || !Number.isFinite(Date.parse(event.completedAt))) {
      throw new Error("AGENT_ACTION_RECEIPT_COMPLETED_AT_REQUIRED");
    }
    if (event.status === "SUCCEEDED" && event.error) {
      throw new Error("AGENT_ACTION_RECEIPT_SUCCESS_ERROR_FORBIDDEN");
    }
    if (
      (event.status === "FAILED" || event.status === "DENIED")
      && (!event.error?.code?.trim() || !event.error?.message?.trim())
    ) {
      throw new Error("AGENT_ACTION_RECEIPT_ERROR_REQUIRED");
    }
  }
  if (
    event.resultDigest !== undefined
    && !/^[a-f0-9]{64}$/.test(event.resultDigest)
  ) {
    throw new Error("AGENT_ACTION_RECEIPT_RESULT_DIGEST_INVALID");
  }
  if (
    event.resultEntityRefs !== undefined
    && (
      !Array.isArray(event.resultEntityRefs)
      || event.resultEntityRefs.some(item => typeof item !== "string" || !item.trim())
      || event.resultEntityRefs.length > 100
    )
  ) {
    throw new Error("AGENT_ACTION_RECEIPT_RESULT_REFS_INVALID");
  }
}

function eventFactsEqual(
  a: AgentActionReceiptEventV010,
  b: AgentActionReceiptEventV010
): boolean {
  return (
    a.receiptId === b.receiptId
    && a.invocationId === b.invocationId
    && a.idempotencyKey === b.idempotencyKey
    && a.sourceInteractionId === b.sourceInteractionId
    && a.sourceActionId === b.sourceActionId
    && a.principalSubjectId === b.principalSubjectId
    && a.principalActorType === b.principalActorType
    && sameContext(a.context, b.context)
    && a.toolId === b.toolId
    && a.ownerPackageId === b.ownerPackageId
    && a.capability === b.capability
    && a.effect === b.effect
    && a.inputDigest === b.inputDigest
    && a.requestedAt === b.requestedAt
  );
}

function materialize(
  events: readonly AgentActionReceiptEventV010[]
): AgentActionReceiptV010[] {
  const byReceipt = new Map<string, AgentActionReceiptEventV010[]>();
  for (const event of events) {
    validEvent(event);
    const current = byReceipt.get(event.receiptId) ?? [];
    current.push(event);
    byReceipt.set(event.receiptId, current);
  }

  const result: AgentActionReceiptV010[] = [];
  for (const receiptEvents of byReceipt.values()) {
    const ordered = [...receiptEvents].sort((a, b) =>
      a.occurredAt.localeCompare(b.occurredAt)
      || a.eventId.localeCompare(b.eventId)
    );
    const requested = ordered.filter(event => event.status === "REQUESTED");
    if (requested.length !== 1) {
      throw new Error("AGENT_ACTION_RECEIPT_REQUEST_EVENT_REQUIRED");
    }
    const base = requested[0];
    if (ordered.some(event => !eventFactsEqual(base, event))) {
      throw new Error("AGENT_ACTION_RECEIPT_FACTS_IMMUTABLE");
    }
    const terminals = ordered.filter(event => event.status !== "REQUESTED");
    if (terminals.length > 1) {
      throw new Error("AGENT_ACTION_RECEIPT_MULTIPLE_TERMINAL_EVENTS");
    }
    const latest = terminals[0] ?? base;
    result.push({
      contractVersion: "0.1.0",
      receiptId: base.receiptId,
      invocationId: base.invocationId,
      idempotencyKey: base.idempotencyKey,
      sourceInteractionId: base.sourceInteractionId,
      sourceActionId: base.sourceActionId,
      principalSubjectId: base.principalSubjectId,
      principalActorType: base.principalActorType,
      context: structuredClone(base.context),
      toolId: base.toolId,
      ownerPackageId: base.ownerPackageId,
      ...(base.capability ? { capability: base.capability } : {}),
      effect: "WRITE",
      inputDigest: base.inputDigest,
      status: latest.status,
      requestedAt: base.requestedAt,
      ...(latest.completedAt ? { completedAt: latest.completedAt } : {}),
      ...(latest.resultDigest ? { resultDigest: latest.resultDigest } : {}),
      resultEntityRefs: [...(latest.resultEntityRefs ?? [])],
      ...(latest.resultSummary ? { resultSummary: latest.resultSummary } : {}),
      ...(latest.error ? { error: structuredClone(latest.error) } : {}),
      latestEventId: latest.eventId
    });
  }

  const idempotency = new Map<string, string>();
  for (const receipt of result) {
    const existing = idempotency.get(receipt.idempotencyKey);
    if (existing && existing !== receipt.receiptId) {
      throw new Error("AGENT_ACTION_RECEIPT_IDEMPOTENCY_COLLISION");
    }
    idempotency.set(receipt.idempotencyKey, receipt.receiptId);
  }

  return result;
}

export function createMemoryAgentActionReceiptEventStoreV010(
  seed: AgentActionReceiptEventV010[] = []
): AgentActionReceiptEventStoreV010 {
  const events = structuredClone(seed);
  materialize(events);
  return {
    append(event) {
      validEvent(event);
      materialize([...events, event]);
      events.push(structuredClone(event));
    },
    listEvents() {
      return structuredClone(events);
    }
  };
}

export function createJsonlAgentActionReceiptEventStoreV010(
  path: string
): AgentActionReceiptEventStoreV010 {
  const read = (): AgentActionReceiptEventV010[] => {
    if (!existsSync(path)) return [];
    const lines = readFileSync(path, "utf8")
      .split(/\r?\n/u)
      .map(line => line.trim())
      .filter(Boolean);
    const events = lines.map(line =>
      JSON.parse(line) as AgentActionReceiptEventV010
    );
    materialize(events);
    return events;
  };

  return {
    append(event) {
      validEvent(event);
      const current = read();
      materialize([...current, event]);
      mkdirSync(dirname(path), { recursive: true });
      appendFileSync(path, JSON.stringify(event) + "\n", "utf8");
    },
    listEvents() {
      return structuredClone(read());
    }
  };
}

export function createAgentActionReceiptServiceV010(input: {
  store: AgentActionReceiptEventStoreV010;
  eventId: () => string;
}): AgentActionReceiptServiceV010 {
  const receipts = () => materialize(input.store.listEvents());
  const get = (receiptId: string) =>
    receipts().find(item => item.receiptId === receiptId);

  return {
    begin(request: AgentActionReceiptBeginInputV010) {
      const existing = receipts().find(
        item => item.idempotencyKey === request.idempotencyKey
      );
      if (existing) return structuredClone(existing);

      const event: AgentActionReceiptEventV010 = {
        contractVersion: "0.1.0",
        eventId: "agent-action-receipt-event:" + input.eventId(),
        receiptId: request.receiptId,
        invocationId: request.invocationId,
        idempotencyKey: request.idempotencyKey,
        sourceInteractionId: request.sourceInteractionId,
        sourceActionId: request.sourceActionId,
        principalSubjectId: request.principalSubjectId,
        principalActorType: request.principalActorType,
        context: structuredClone(request.context),
        toolId: request.toolId,
        ownerPackageId: request.ownerPackageId,
        ...(request.capability ? { capability: request.capability } : {}),
        effect: "WRITE",
        inputDigest: request.inputDigest,
        status: "REQUESTED",
        requestedAt: request.requestedAt,
        occurredAt: request.requestedAt
      };
      input.store.append(event);
      return structuredClone(get(request.receiptId)!);
    },

    complete(request: AgentActionReceiptTerminalInputV010) {
      const current = get(request.receiptId);
      if (!current) {
        throw new Error("AGENT_ACTION_RECEIPT_NOT_FOUND");
      }
      if (current.status !== "REQUESTED") {
        return structuredClone(current);
      }
      const event: AgentActionReceiptEventV010 = {
        contractVersion: "0.1.0",
        eventId: "agent-action-receipt-event:" + input.eventId(),
        receiptId: current.receiptId,
        invocationId: current.invocationId,
        idempotencyKey: current.idempotencyKey,
        sourceInteractionId: current.sourceInteractionId,
        sourceActionId: current.sourceActionId,
        principalSubjectId: current.principalSubjectId,
        principalActorType: current.principalActorType,
        context: structuredClone(current.context),
        toolId: current.toolId,
        ownerPackageId: current.ownerPackageId,
        ...(current.capability ? { capability: current.capability } : {}),
        effect: "WRITE",
        inputDigest: current.inputDigest,
        status: request.status,
        requestedAt: current.requestedAt,
        occurredAt: request.completedAt,
        completedAt: request.completedAt,
        ...(request.resultDigest ? { resultDigest: request.resultDigest } : {}),
        ...(request.resultEntityRefs
          ? { resultEntityRefs: [...new Set(request.resultEntityRefs)].slice(0, 100) }
          : {}),
        ...(request.resultSummary ? { resultSummary: request.resultSummary } : {}),
        ...(request.error ? { error: structuredClone(request.error) } : {})
      };
      input.store.append(event);
      return structuredClone(get(request.receiptId)!);
    },

    get(receiptId) {
      const value = get(receiptId);
      return value ? structuredClone(value) : undefined;
    },

    getByIdempotencyKey(idempotencyKey) {
      const value = receipts().find(item => item.idempotencyKey === idempotencyKey);
      return value ? structuredClone(value) : undefined;
    },

    list(request) {
      const limit = request.limit ?? 20;
      if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
        throw new Error("AGENT_ACTION_RECEIPT_LIMIT_INVALID");
      }
      return receipts()
        .filter(item =>
          item.principalSubjectId === request.principalSubjectId
          && sameContext(item.context, request.context)
        )
        .sort((a, b) =>
          b.requestedAt.localeCompare(a.requestedAt)
          || b.receiptId.localeCompare(a.receiptId)
        )
        .slice(0, limit)
        .map(item => structuredClone(item));
    }
  };
}
