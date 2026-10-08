import type {
  ActiveContextRefV010,
  PlatformActorType
} from "./platform-services.js";
import type {
  AgentConversationMessageV010
} from "../agents/enterprise-agent/contracts.js";

export type ConversationMessageRoleV010 =
  | "USER"
  | "ASSISTANT"
  | "SYSTEM";

export interface ConversationThreadCreatedEventV010 {
  contractVersion: "0.1.0";
  eventId: string;
  threadId: string;
  type: "THREAD_CREATED";
  occurredAt: string;
  payload: {
    principalSubjectId: string;
    principalActorType: PlatformActorType;
    context: ActiveContextRefV010;
    createdAt: string;
    sourceInteractionId?: string;
    title?: string;
  };
}

export interface ConversationThreadArchivedEventV010 {
  contractVersion: "0.1.0";
  eventId: string;
  threadId: string;
  type: "THREAD_ARCHIVED";
  occurredAt: string;
  payload: {
    archivedAt: string;
    archivedBySubjectId: string;
  };
}

export interface ConversationMessageAppendedEventV010 {
  contractVersion: "0.1.0";
  eventId: string;
  threadId: string;
  type: "MESSAGE_APPENDED";
  occurredAt: string;
  payload: {
    messageId: string;
    role: ConversationMessageRoleV010;
    content: string;
    createdAt: string;
    runId?: string;
    replyToMessageId?: string;
    presentation?: Record<string, unknown>;
  };
}

export type ConversationThreadEventV010 =
  | ConversationThreadCreatedEventV010
  | ConversationThreadArchivedEventV010
  | ConversationMessageAppendedEventV010;

export interface ConversationMessageV010 {
  contractVersion: "0.1.0";
  messageId: string;
  threadId: string;
  role: ConversationMessageRoleV010;
  content: string;
  createdAt: string;
  runId?: string;
  replyToMessageId?: string;
  presentation?: Record<string, unknown>;
  eventId: string;
}

export type ConversationThreadStateV010 = "ACTIVE" | "ARCHIVED";

export interface ConversationThreadV010 {
  contractVersion: "0.1.0";
  threadId: string;
  state: ConversationThreadStateV010;
  principalSubjectId: string;
  principalActorType: PlatformActorType;
  context: ActiveContextRefV010;
  createdAt: string;
  updatedAt: string;
  sourceInteractionId?: string;
  title?: string;
  archivedAt?: string;
  archivedBySubjectId?: string;
  messages: ConversationMessageV010[];
  lastEventId: string;
}

export type ConversationStoreResultV010<T> = T | Promise<T>;

export interface ConversationThreadEventStoreV010 {
  append(event: ConversationThreadEventV010): void;
  listEvents(): ConversationThreadEventV010[];
}

export interface ConversationThreadStoreV010 {
  create(input: {
    threadId: string;
    principalSubjectId: string;
    principalActorType: PlatformActorType;
    context: ActiveContextRefV010;
    createdAt: string;
    sourceInteractionId?: string;
    title?: string;
  }): ConversationStoreResultV010<ConversationThreadV010>;
  archive(input: {
    threadId: string;
    archivedAt: string;
    archivedBySubjectId: string;
  }): ConversationStoreResultV010<ConversationThreadV010>;
  appendMessage(input: {
    threadId: string;
    messageId: string;
    role: ConversationMessageRoleV010;
    content: string;
    createdAt: string;
    runId?: string;
    replyToMessageId?: string;
    presentation?: Record<string, unknown>;
  }): ConversationStoreResultV010<ConversationThreadV010>;
  get(threadId: string): ConversationStoreResultV010<ConversationThreadV010 | undefined>;
  list(input: {
    principalSubjectId: string;
    context: ActiveContextRefV010;
    limit?: number;
    includeArchived?: boolean;
  }): ConversationStoreResultV010<ConversationThreadV010[]>;
  events(threadId: string): ConversationStoreResultV010<ConversationThreadEventV010[]>;
  conversationHistory(input: {
    threadId: string;
    maxMessages?: number;
    maxTotalCharacters?: number;
    maxCharactersPerMessage?: number;
    excludeMessageId?: string;
  }): ConversationStoreResultV010<AgentConversationMessageV010[]>;
}
