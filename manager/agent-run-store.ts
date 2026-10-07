import {
  appendFileSync,
  existsSync,
  mkdirSync,
  readFileSync
} from "node:fs";
import { dirname } from "node:path";
import type {
  AgentRunCreateInputV010,
  AgentRunEventStoreV010,
  AgentRunEventV010,
  AgentRunStoreV010,
  AgentRunV010
} from "../contracts/agent-run.js";
import type { ActiveContextRefV010 } from "../contracts/platform-services.js";

function sameContext(
  left: ActiveContextRefV010,
  right: ActiveContextRefV010
): boolean {
  return left.kind === right.kind
    && left.contextId === right.contextId
    && (
      left.kind !== "ENTERPRISE"
      || right.kind !== "ENTERPRISE"
      || left.enterpriseId === right.enterpriseId
    );
}

function validDate(value: string): boolean {
  return Number.isFinite(Date.parse(value));
}

function validateEvent(event: AgentRunEventV010): void {
  if (
    event.contractVersion !== "0.1.0"
    || !event.eventId?.trim()
    || !event.runId?.trim()
    || !event.type?.trim()
    || !validDate(event.occurredAt)
  ) {
    throw new Error("AGENT_RUN_EVENT_INVALID");
  }
  if (
    [
      "SLICE_STARTED",
      "MODEL_DECISION_RECORDED",
      "TOOL_OBSERVATION_RECORDED",
      "SLICE_PAUSED"
    ].includes(event.type)
    && !event.sliceId?.trim()
  ) {
    throw new Error("AGENT_RUN_SLICE_ID_REQUIRED");
  }
}

function orderedEvents(
  events: readonly AgentRunEventV010[]
): AgentRunEventV010[] {
  // Append order is the causal authority. occurredAt is audit metadata only:
  // wall clocks may move backwards and must never reorder durable run facts.
  return [...events];
}

export function materializeAgentRunsV010(
  events: readonly AgentRunEventV010[]
): AgentRunV010[] {
  const byRun = new Map<string, AgentRunEventV010[]>();
  for (const event of events) {
    validateEvent(event);
    const current = byRun.get(event.runId) ?? [];
    current.push(event);
    byRun.set(event.runId, current);
  }

  const result: AgentRunV010[] = [];

  for (const [runId, rawEvents] of byRun.entries()) {
    const ordered = orderedEvents(rawEvents);
    const createdEvents = ordered.filter(event => event.type === "RUN_CREATED");
    if (createdEvents.length !== 1) {
      throw new Error("AGENT_RUN_CREATED_EVENT_REQUIRED");
    }
    if (ordered[0].type !== "RUN_CREATED") {
      throw new Error("AGENT_RUN_CREATED_EVENT_MUST_BE_FIRST");
    }

    const created = createdEvents[0];
    const payload = created.payload as {
      principalSubjectId?: unknown;
      principalActorType?: unknown;
      context?: unknown;
      sourceInteractionId?: unknown;
      sourceActionId?: unknown;
      input?: unknown;
    };

    if (
      typeof payload.principalSubjectId !== "string"
      || !payload.principalSubjectId.trim()
      || !["HUMAN", "AI", "AUTOMATION", "SERVICE"].includes(
        String(payload.principalActorType)
      )
      || payload.context === null
      || typeof payload.context !== "object"
      || typeof (payload.context as { contextId?: unknown }).contextId !== "string"
      || typeof payload.sourceInteractionId !== "string"
      || !payload.sourceInteractionId.trim()
      || typeof payload.sourceActionId !== "string"
      || !payload.sourceActionId.trim()
      || payload.input === null
      || typeof payload.input !== "object"
    ) {
      throw new Error("AGENT_RUN_CREATED_PAYLOAD_INVALID");
    }

    const input = payload.input as {
      message?: unknown;
      conversationHistory?: unknown;
      interactionContext?: unknown;
      locale?: unknown;
      providerId?: unknown;
      modelId?: unknown;
    };
    if (
      typeof input.message !== "string"
      || !input.message.trim()
      || !Array.isArray(input.conversationHistory)
      || (
        input.interactionContext !== undefined
        && (
          input.interactionContext === null
          || typeof input.interactionContext !== "object"
          || Array.isArray(input.interactionContext)
        )
      )
      || typeof input.locale !== "string"
      || !input.locale.trim()
      || typeof input.providerId !== "string"
      || !input.providerId.trim()
      || typeof input.modelId !== "string"
      || !input.modelId.trim()
    ) {
      throw new Error("AGENT_RUN_INPUT_INVALID");
    }

    let state: AgentRunV010["state"] = "READY";
    let updatedAt = created.occurredAt;
    let lastEventId = created.eventId;
    let sliceCount = 0;
    let activeSliceId: string | undefined;
    const decisions: AgentRunV010["decisions"] = [];
    const observations: AgentRunV010["observations"] = [];
    const actionReceiptIds = new Set<string>();
    let finalMessage: string | undefined;
    let blocker: AgentRunV010["blocker"];
    let error: AgentRunV010["error"];
    let terminal = false;

    for (const event of ordered.slice(1)) {
      if (terminal) {
        throw new Error("AGENT_RUN_TERMINAL_STATE_IMMUTABLE");
      }
      updatedAt = event.occurredAt;
      lastEventId = event.eventId;

      if (event.type === "SLICE_STARTED") {
        if (!event.sliceId) throw new Error("AGENT_RUN_SLICE_ID_REQUIRED");
        activeSliceId = event.sliceId;
        sliceCount += 1;
        state = "RUNNING";
        continue;
      }

      if (event.type === "MODEL_DECISION_RECORDED") {
        if (!event.sliceId || event.sliceId !== activeSliceId) {
          throw new Error("AGENT_RUN_DECISION_SLICE_MISMATCH");
        }
        const decision = (event.payload as { decision?: unknown }).decision;
        if (
          decision === null
          || typeof decision !== "object"
          || !["tool", "final"].includes(
            String((decision as { type?: unknown }).type)
          )
        ) {
          throw new Error("AGENT_RUN_MODEL_DECISION_INVALID");
        }
        decisions.push({
          decisionEventId: event.eventId,
          sliceId: event.sliceId,
          occurredAt: event.occurredAt,
          decision: structuredClone(decision) as AgentRunV010["decisions"][number]["decision"]
        });
        state = "RUNNING";
        continue;
      }

      if (event.type === "TOOL_OBSERVATION_RECORDED") {
        if (!event.sliceId || event.sliceId !== activeSliceId) {
          throw new Error("AGENT_RUN_OBSERVATION_SLICE_MISMATCH");
        }
        const eventPayload = event.payload as {
          observation?: unknown;
          decisionEventId?: unknown;
        };
        const decisionRecord = decisions.find(
          item => item.decisionEventId === eventPayload.decisionEventId
        );
        if (!decisionRecord) {
          throw new Error("AGENT_RUN_OBSERVATION_DECISION_REQUIRED");
        }
        if (decisionRecord.observation) {
          throw new Error("AGENT_RUN_DECISION_OBSERVATION_DUPLICATE");
        }
        if (
          eventPayload.observation === null
          || typeof eventPayload.observation !== "object"
          || typeof (eventPayload.observation as { tool?: unknown }).tool !== "string"
          || typeof (eventPayload.observation as { ok?: unknown }).ok !== "boolean"
        ) {
          throw new Error("AGENT_RUN_TOOL_OBSERVATION_INVALID");
        }
        const observation = structuredClone(
          eventPayload.observation
        ) as AgentRunV010["observations"][number];
        decisionRecord.observation = observation;
        observations.push(observation);
        if (observation.receipt?.receiptId) {
          actionReceiptIds.add(observation.receipt.receiptId);
        }
        state = "PAUSED";
        continue;
      }

      if (event.type === "SLICE_PAUSED") {
        if (!event.sliceId || event.sliceId !== activeSliceId) {
          throw new Error("AGENT_RUN_PAUSE_SLICE_MISMATCH");
        }
        state = "PAUSED";
        activeSliceId = undefined;
        continue;
      }

      if (event.type === "RUN_SUCCEEDED") {
        const message = (event.payload as { message?: unknown }).message;
        if (typeof message !== "string") {
          throw new Error("AGENT_RUN_FINAL_MESSAGE_REQUIRED");
        }
        finalMessage = message;
        state = "SUCCEEDED";
        terminal = true;
        activeSliceId = undefined;
        continue;
      }

      if (event.type === "RUN_BLOCKED") {
        const reason = (event.payload as { reason?: unknown }).reason;
        const code = (event.payload as { code?: unknown }).code;
        if (typeof reason !== "string" || !reason.trim()) {
          throw new Error("AGENT_RUN_BLOCK_REASON_REQUIRED");
        }
        blocker = {
          reason,
          ...(typeof code === "string" && code.trim() ? { code } : {})
        };
        state = "BLOCKED";
        terminal = true;
        activeSliceId = undefined;
        continue;
      }

      if (event.type === "RUN_FAILED") {
        const reason = (event.payload as { reason?: unknown }).reason;
        const code = (event.payload as { code?: unknown }).code;
        if (typeof reason !== "string" || !reason.trim()) {
          throw new Error("AGENT_RUN_FAILURE_REASON_REQUIRED");
        }
        error = {
          reason,
          ...(typeof code === "string" && code.trim() ? { code } : {})
        };
        state = "FAILED";
        terminal = true;
        activeSliceId = undefined;
        continue;
      }

      if (event.type === "RUN_CANCELLED") {
        state = "CANCELLED";
        terminal = true;
        activeSliceId = undefined;
        continue;
      }

      throw new Error("AGENT_RUN_EVENT_TYPE_UNSUPPORTED");
    }

    result.push({
      contractVersion: "0.1.0",
      runId,
      state,
      principalSubjectId: payload.principalSubjectId,
      principalActorType: payload.principalActorType as AgentRunV010["principalActorType"],
      context: structuredClone(payload.context) as AgentRunV010["context"],
      sourceInteractionId: payload.sourceInteractionId,
      sourceActionId: payload.sourceActionId,
      input: structuredClone(input) as AgentRunV010["input"],
      createdAt: created.occurredAt,
      updatedAt,
      sliceCount,
      ...(activeSliceId ? { activeSliceId } : {}),
      lastEventId,
      decisions,
      observations,
      actionReceiptIds: [...actionReceiptIds],
      ...(finalMessage !== undefined ? { finalMessage } : {}),
      ...(blocker ? { blocker } : {}),
      ...(error ? { error } : {})
    });
  }

  return result;
}

export function createMemoryAgentRunEventStoreV010(
  seed: AgentRunEventV010[] = []
): AgentRunEventStoreV010 {
  const events = structuredClone(seed);
  materializeAgentRunsV010(events);
  return {
    append(event) {
      validateEvent(event);
      materializeAgentRunsV010([...events, event]);
      events.push(structuredClone(event));
    },
    listEvents() {
      return structuredClone(events);
    }
  };
}

export function createJsonlAgentRunEventStoreV010(
  path: string
): AgentRunEventStoreV010 {
  const read = (): AgentRunEventV010[] => {
    if (!existsSync(path)) return [];
    const lines = readFileSync(path, "utf8")
      .split(/\r?\n/u)
      .map(line => line.trim())
      .filter(Boolean);
    const events = lines.map(line => JSON.parse(line) as AgentRunEventV010);
    materializeAgentRunsV010(events);
    return events;
  };

  return {
    append(event) {
      validateEvent(event);
      const current = read();
      materializeAgentRunsV010([...current, event]);
      mkdirSync(dirname(path), { recursive: true });
      appendFileSync(path, JSON.stringify(event) + "\n", "utf8");
    },
    listEvents() {
      return structuredClone(read());
    }
  };
}

export function createAgentRunStoreV010(input: {
  eventStore: AgentRunEventStoreV010;
  eventId: () => string;
}): AgentRunStoreV010 {
  const runs = () => materializeAgentRunsV010(input.eventStore.listEvents());
  const get = (runId: string) => runs().find(run => run.runId === runId);

  return {
    create(request: AgentRunCreateInputV010) {
      if (get(request.runId)) {
        throw new Error("AGENT_RUN_ALREADY_EXISTS");
      }
      const event: AgentRunEventV010 = {
        contractVersion: "0.1.0",
        eventId: "agent-run-event:" + input.eventId(),
        runId: request.runId,
        type: "RUN_CREATED",
        occurredAt: request.createdAt,
        payload: {
          principalSubjectId: request.principalSubjectId,
          principalActorType: request.principalActorType,
          context: structuredClone(request.context),
          sourceInteractionId: request.sourceInteractionId,
          sourceActionId: request.sourceActionId,
          input: structuredClone(request.input)
        }
      };
      input.eventStore.append(event);
      return structuredClone(get(request.runId)!);
    },

    append(event) {
      if (!get(event.runId)) {
        throw new Error("AGENT_RUN_NOT_FOUND");
      }
      input.eventStore.append(event);
      return structuredClone(get(event.runId)!);
    },

    get(runId) {
      const run = get(runId);
      return run ? structuredClone(run) : undefined;
    },

    list(request) {
      const limit = request.limit ?? 20;
      if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
        throw new Error("AGENT_RUN_LIMIT_INVALID");
      }
      return runs()
        .filter(run =>
          run.principalSubjectId === request.principalSubjectId
          && sameContext(run.context, request.context)
        )
        .sort((a, b) =>
          b.createdAt.localeCompare(a.createdAt)
          || b.runId.localeCompare(a.runId)
        )
        .slice(0, limit)
        .map(run => structuredClone(run));
    },

    events(runId) {
      return orderedEvents(
        input.eventStore.listEvents().filter(event => event.runId === runId)
      ).map(event => structuredClone(event));
    }
  };
}
