import type {
  PlatformActorType,
  ActiveContextRefV010
} from "./platform-services.js";
import type {
  AgentConversationMessageV010,
  AgentInteractionContextV010,
  AgentModelDecision,
  AgentToolObservation
} from "../agents/enterprise-agent/contracts.js";

export type AgentRunStateV010 =
  | "READY"
  | "RUNNING"
  | "PAUSED"
  | "BLOCKED"
  | "SUCCEEDED"
  | "FAILED"
  | "CANCELLED";

export type AgentRunEventTypeV010 =
  | "RUN_CREATED"
  | "SLICE_STARTED"
  | "MODEL_DECISION_RECORDED"
  | "TOOL_OBSERVATION_RECORDED"
  | "SLICE_PAUSED"
  | "RUN_SUCCEEDED"
  | "RUN_BLOCKED"
  | "RUN_FAILED"
  | "RUN_CANCELLED";

export interface AgentRunInputV010 {
  message: string;
  conversationHistory: AgentConversationMessageV010[];
  /**
   * Host-provided task/navigation coordinates captured when the Human
   * launched a contextual Agent action. This is durable task context only
   * and never authorization evidence.
   */
  interactionContext?: AgentInteractionContextV010;
  locale: string;
  providerId: string;
  modelId: string;
}

export interface AgentRunCreatedPayloadV010 {
  principalSubjectId: string;
  principalActorType: PlatformActorType;
  context: ActiveContextRefV010;
  sourceInteractionId: string;
  sourceActionId: string;
  input: AgentRunInputV010;
}

export interface AgentRunEventV010 {
  contractVersion: "0.1.0";
  eventId: string;
  runId: string;
  type: AgentRunEventTypeV010;
  occurredAt: string;
  sliceId?: string;
  payload:
    | AgentRunCreatedPayloadV010
    | { decision: AgentModelDecision }
    | { observation: AgentToolObservation; decisionEventId: string }
    | { reason: string; code?: string }
    | { message: string }
    | Record<string, unknown>;
}

export interface AgentRunDecisionRecordV010 {
  decisionEventId: string;
  sliceId: string;
  occurredAt: string;
  decision: AgentModelDecision;
  observation?: AgentToolObservation;
}

export interface AgentRunV010 {
  contractVersion: "0.1.0";
  runId: string;
  state: AgentRunStateV010;
  principalSubjectId: string;
  principalActorType: PlatformActorType;
  context: ActiveContextRefV010;
  sourceInteractionId: string;
  sourceActionId: string;
  input: AgentRunInputV010;
  createdAt: string;
  updatedAt: string;
  sliceCount: number;
  activeSliceId?: string;
  lastEventId: string;
  decisions: AgentRunDecisionRecordV010[];
  observations: AgentToolObservation[];
  actionReceiptIds: string[];
  finalMessage?: string;
  blocker?: { code?: string; reason: string };
  error?: { code?: string; reason: string };
}

export interface AgentRunCreateInputV010 {
  runId: string;
  principalSubjectId: string;
  principalActorType: PlatformActorType;
  context: ActiveContextRefV010;
  sourceInteractionId: string;
  sourceActionId: string;
  input: AgentRunInputV010;
  createdAt: string;
}

export interface AgentRunEventStoreV010 {
  append(event: AgentRunEventV010): void;
  listEvents(): AgentRunEventV010[];
}

export interface AgentRunStoreV010 {
  create(input: AgentRunCreateInputV010): AgentRunV010;
  append(event: AgentRunEventV010): AgentRunV010;
  get(runId: string): AgentRunV010 | undefined;
  list(input: {
    principalSubjectId: string;
    context: ActiveContextRefV010;
    limit?: number;
  }): AgentRunV010[];
  events(runId: string): AgentRunEventV010[];
}

export interface AgentRunResumeResultV010 {
  contractVersion: "0.1.0";
  run: AgentRunV010;
  advanced: boolean;
}
