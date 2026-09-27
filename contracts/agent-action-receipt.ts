import type {
  ActiveContextRefV010,
  PlatformActorType
} from "./platform-services.js";

export type AgentActionReceiptStatusV010 =
  | "REQUESTED"
  | "SUCCEEDED"
  | "FAILED"
  | "DENIED";

export interface AgentActionReceiptErrorV010 {
  code: string;
  message: string;
}

export interface AgentActionReceiptEventV010 {
  contractVersion: "0.1.0";
  eventId: string;
  receiptId: string;
  invocationId: string;
  idempotencyKey: string;
  sourceInteractionId: string;
  sourceActionId: string;
  principalSubjectId: string;
  principalActorType: PlatformActorType;
  context: ActiveContextRefV010;
  toolId: string;
  ownerPackageId: string;
  capability?: string;
  effect: "WRITE";
  inputDigest: string;
  status: AgentActionReceiptStatusV010;
  requestedAt: string;
  occurredAt: string;
  completedAt?: string;
  resultDigest?: string;
  resultEntityRefs?: string[];
  resultSummary?: string;
  error?: AgentActionReceiptErrorV010;
}

export interface AgentActionReceiptV010 {
  contractVersion: "0.1.0";
  receiptId: string;
  invocationId: string;
  idempotencyKey: string;
  sourceInteractionId: string;
  sourceActionId: string;
  principalSubjectId: string;
  principalActorType: PlatformActorType;
  context: ActiveContextRefV010;
  toolId: string;
  ownerPackageId: string;
  capability?: string;
  effect: "WRITE";
  inputDigest: string;
  status: AgentActionReceiptStatusV010;
  requestedAt: string;
  completedAt?: string;
  resultDigest?: string;
  resultEntityRefs: string[];
  resultSummary?: string;
  error?: AgentActionReceiptErrorV010;
  latestEventId: string;
}

export interface AgentActionReceiptBeginInputV010 {
  receiptId: string;
  invocationId: string;
  idempotencyKey: string;
  sourceInteractionId: string;
  sourceActionId: string;
  principalSubjectId: string;
  principalActorType: PlatformActorType;
  context: ActiveContextRefV010;
  toolId: string;
  ownerPackageId: string;
  capability?: string;
  inputDigest: string;
  requestedAt: string;
}

export interface AgentActionReceiptTerminalInputV010 {
  receiptId: string;
  status: Exclude<AgentActionReceiptStatusV010, "REQUESTED">;
  completedAt: string;
  resultDigest?: string;
  resultEntityRefs?: string[];
  resultSummary?: string;
  error?: AgentActionReceiptErrorV010;
}

export interface AgentActionReceiptServiceV010 {
  begin(input: AgentActionReceiptBeginInputV010): AgentActionReceiptV010;
  complete(input: AgentActionReceiptTerminalInputV010): AgentActionReceiptV010;
  get(receiptId: string): AgentActionReceiptV010 | undefined;
  getByIdempotencyKey(idempotencyKey: string): AgentActionReceiptV010 | undefined;
  list(input: {
    principalSubjectId: string;
    context: ActiveContextRefV010;
    limit?: number;
  }): AgentActionReceiptV010[];
}
