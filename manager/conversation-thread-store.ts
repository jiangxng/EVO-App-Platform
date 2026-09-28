import {
  appendFileSync,
  existsSync,
  mkdirSync,
  readFileSync
} from "node:fs";
import { dirname } from "node:path";
import type {
  ConversationMessageAppendedEventV010,
  ConversationMessageRoleV010,
  ConversationThreadEventStoreV010,
  ConversationThreadEventV010,
  ConversationThreadStoreV010,
  ConversationThreadV010
} from "../contracts/conversation-thread.js";
import type { ActiveContextRefV010 } from "../contracts/platform-services.js";

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

function jsonSafe(value: unknown): boolean {
  try {
    JSON.stringify(value);
    return true;
  } catch {
    return false;
  }
}

function validateEvent(event: ConversationThreadEventV010): void {
  if (
    event.contractVersion !== "0.1.0"
    || !event.eventId?.trim()
    || !event.threadId?.trim()
    || !Number.isFinite(Date.parse(event.occurredAt))
  ) {
    throw new Error("CONVERSATION_THREAD_EVENT_INVALID");
  }

  if (event.type === "THREAD_CREATED") {
    const payload = event.payload;
    if (
      !payload.principalSubjectId?.trim()
      || !payload.context?.contextId?.trim()
      || !Number.isFinite(Date.parse(payload.createdAt))
      || (payload.title !== undefined && !payload.title.trim())
    ) {
      throw new Error("CONVERSATION_THREAD_CREATED_EVENT_INVALID");
    }
    return;
  }

  const payload = event.payload;
  if (
    !payload.messageId?.trim()
    || !["USER", "ASSISTANT", "SYSTEM"].includes(payload.role)
    || !payload.content?.trim()
    || !Number.isFinite(Date.parse(payload.createdAt))
    || (payload.runId !== undefined && !payload.runId.trim())
    || (payload.replyToMessageId !== undefined && !payload.replyToMessageId.trim())
    || (payload.presentation !== undefined && !jsonSafe(payload.presentation))
  ) {
    throw new Error("CONVERSATION_MESSAGE_EVENT_INVALID");
  }
}

function materialize(
  events: readonly ConversationThreadEventV010[]
): ConversationThreadV010[] {
  const byThread = new Map<string, ConversationThreadEventV010[]>();
  const eventIds = new Set<string>();
  for (const event of events) {
    validateEvent(event);
    if (eventIds.has(event.eventId)) {
      throw new Error("CONVERSATION_THREAD_EVENT_ID_DUPLICATE");
    }
    eventIds.add(event.eventId);
    const current = byThread.get(event.threadId) ?? [];
    current.push(event);
    byThread.set(event.threadId, current);
  }

  const result: ConversationThreadV010[] = [];
  for (const [threadId, threadEvents] of byThread) {
    const ordered = [...threadEvents].sort((a, b) =>
      a.occurredAt.localeCompare(b.occurredAt)
      || a.eventId.localeCompare(b.eventId)
    );
    const created = ordered.filter(event => event.type === "THREAD_CREATED");
    if (created.length !== 1) {
      throw new Error("CONVERSATION_THREAD_CREATED_EVENT_REQUIRED");
    }
    const root = created[0];
    if (root.type !== "THREAD_CREATED") {
      throw new Error("CONVERSATION_THREAD_CREATED_EVENT_REQUIRED");
    }
    if (ordered[0].eventId !== root.eventId) {
      throw new Error("CONVERSATION_THREAD_CREATED_EVENT_MUST_BE_FIRST");
    }

    const messages = [];
    const messageIds = new Set<string>();
    for (const event of ordered) {
      if (event.type !== "MESSAGE_APPENDED") continue;
      if (messageIds.has(event.payload.messageId)) {
        throw new Error("CONVERSATION_MESSAGE_ID_DUPLICATE");
      }
      if (
        event.payload.replyToMessageId
        && !messageIds.has(event.payload.replyToMessageId)
      ) {
        throw new Error("CONVERSATION_MESSAGE_REPLY_TARGET_NOT_FOUND");
      }
      messageIds.add(event.payload.messageId);
      messages.push({
        contractVersion: "0.1.0" as const,
        messageId: event.payload.messageId,
        threadId,
        role: event.payload.role,
        content: event.payload.content,
        createdAt: event.payload.createdAt,
        ...(event.payload.runId ? { runId: event.payload.runId } : {}),
        ...(event.payload.replyToMessageId
          ? { replyToMessageId: event.payload.replyToMessageId }
          : {}),
        ...(event.payload.presentation
          ? { presentation: structuredClone(event.payload.presentation) }
          : {}),
        eventId: event.eventId
      });
    }

    const latest = ordered.at(-1)!;
    result.push({
      contractVersion: "0.1.0",
      threadId,
      principalSubjectId: root.payload.principalSubjectId,
      principalActorType: root.payload.principalActorType,
      context: structuredClone(root.payload.context),
      createdAt: root.payload.createdAt,
      updatedAt: latest.occurredAt,
      ...(root.payload.title ? { title: root.payload.title } : {}),
      messages,
      lastEventId: latest.eventId
    });
  }
  return result;
}

export function createMemoryConversationThreadEventStoreV010(
  seed: ConversationThreadEventV010[] = []
): ConversationThreadEventStoreV010 {
  const events = structuredClone(seed);
  materialize(events);
  return {
    append(event) {
      validateEvent(event);
      materialize([...events, event]);
      events.push(structuredClone(event));
    },
    listEvents() {
      return structuredClone(events);
    }
  };
}

export function createJsonlConversationThreadEventStoreV010(
  path: string
): ConversationThreadEventStoreV010 {
  const read = (): ConversationThreadEventV010[] => {
    if (!existsSync(path)) return [];
    const events = readFileSync(path, "utf8")
      .split(/\r?\n/u)
      .map(line => line.trim())
      .filter(Boolean)
      .map(line => JSON.parse(line) as ConversationThreadEventV010);
    materialize(events);
    return events;
  };

  return {
    append(event) {
      validateEvent(event);
      materialize([...read(), event]);
      mkdirSync(dirname(path), { recursive: true });
      appendFileSync(path, JSON.stringify(event) + "\n", "utf8");
    },
    listEvents() {
      return structuredClone(read());
    }
  };
}

export function createConversationThreadStoreV010(input: {
  eventStore: ConversationThreadEventStoreV010;
  eventId: () => string;
}): ConversationThreadStoreV010 {
  const threads = () => materialize(input.eventStore.listEvents());

  return {
    create(request) {
      if (threads().some(thread => thread.threadId === request.threadId)) {
        throw new Error("CONVERSATION_THREAD_ALREADY_EXISTS");
      }
      input.eventStore.append({
        contractVersion: "0.1.0",
        eventId: "conversation-thread-event:" + input.eventId(),
        threadId: request.threadId,
        type: "THREAD_CREATED",
        occurredAt: request.createdAt,
        payload: {
          principalSubjectId: request.principalSubjectId,
          principalActorType: request.principalActorType,
          context: structuredClone(request.context),
          createdAt: request.createdAt,
          ...(request.title ? { title: request.title.trim() } : {})
        }
      });
      return structuredClone(
        threads().find(thread => thread.threadId === request.threadId)!
      );
    },

    appendMessage(request) {
      const thread = threads().find(item => item.threadId === request.threadId);
      if (!thread) throw new Error("CONVERSATION_THREAD_NOT_FOUND");
      if (thread.messages.some(message => message.messageId === request.messageId)) {
        throw new Error("CONVERSATION_MESSAGE_ID_DUPLICATE");
      }
      const event: ConversationMessageAppendedEventV010 = {
        contractVersion: "0.1.0",
        eventId: "conversation-thread-event:" + input.eventId(),
        threadId: request.threadId,
        type: "MESSAGE_APPENDED",
        occurredAt: request.createdAt,
        payload: {
          messageId: request.messageId,
          role: request.role,
          content: request.content.trim(),
          createdAt: request.createdAt,
          ...(request.runId ? { runId: request.runId } : {}),
          ...(request.replyToMessageId
            ? { replyToMessageId: request.replyToMessageId }
            : {}),
          ...(request.presentation
            ? { presentation: structuredClone(request.presentation) }
            : {})
        }
      };
      input.eventStore.append(event);
      return structuredClone(
        threads().find(item => item.threadId === request.threadId)!
      );
    },

    get(threadId) {
      const value = threads().find(thread => thread.threadId === threadId);
      return value ? structuredClone(value) : undefined;
    },

    list(request) {
      const limit = request.limit ?? 20;
      if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
        throw new Error("CONVERSATION_THREAD_LIMIT_INVALID");
      }
      return threads()
        .filter(thread =>
          thread.principalSubjectId === request.principalSubjectId
          && sameContext(thread.context, request.context)
        )
        .sort((a, b) =>
          b.updatedAt.localeCompare(a.updatedAt)
          || b.threadId.localeCompare(a.threadId)
        )
        .slice(0, limit)
        .map(thread => structuredClone(thread));
    },

    events(threadId) {
      return input.eventStore.listEvents()
        .filter(event => event.threadId === threadId)
        .map(event => structuredClone(event));
    },

    conversationHistory(request) {
      const thread = threads().find(item => item.threadId === request.threadId);
      if (!thread) throw new Error("CONVERSATION_THREAD_NOT_FOUND");
      const maxMessages = request.maxMessages ?? 16;
      const maxTotalCharacters = request.maxTotalCharacters ?? 24_000;
      const maxCharactersPerMessage = request.maxCharactersPerMessage ?? 8_000;
      if (
        !Number.isInteger(maxMessages) || maxMessages < 1 || maxMessages > 100
        || !Number.isInteger(maxTotalCharacters) || maxTotalCharacters < 1
        || !Number.isInteger(maxCharactersPerMessage) || maxCharactersPerMessage < 1
      ) {
        throw new Error("CONVERSATION_HISTORY_LIMIT_INVALID");
      }

      const candidates = thread.messages
        .filter(message =>
          message.messageId !== request.excludeMessageId
          && (message.role === "USER" || message.role === "ASSISTANT")
        )
        .map(message => ({
          role: message.role === "USER"
            ? "user" as const
            : "assistant" as const,
          content: message.content.slice(0, maxCharactersPerMessage)
        }))
        .filter(message => message.content.length > 0)
        .slice(-maxMessages);

      const selected = [];
      let total = 0;
      for (let index = candidates.length - 1; index >= 0; index -= 1) {
        const item = candidates[index];
        if (total + item.content.length > maxTotalCharacters) break;
        selected.push(item);
        total += item.content.length;
      }
      return selected.reverse();
    }
  };
}
