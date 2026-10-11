import type { AgentRunEventV010 } from "./agent-run.js";
import type {
  AgentActionReceiptBeginInputV010,
  AgentActionReceiptStatusV010
} from "./agent-action-receipt.js";

/**
 * PA-02A experimental, separate from existing synchronous V010 contracts.
 * Host identity/context must be resolved and authorized BEFORE constructing this scope.
 */
export interface HostResolvedAgentDurabilityScopeV020 {
  principalSubjectId: string;
  principalActorType: "HUMAN" | "AI";
  contextKind: "PERSONAL" | "ENTERPRISE";
  contextId: string;
  enterpriseId?: string;
}

export interface AgentTurnClaimInputV020 {
  scope: HostResolvedAgentDurabilityScopeV020;
  threadId: string;
  clientTurnId: string;
  taskDigest: string;
  taskPayload: Record<string, unknown>;
  created: AgentRunEventV010;
}

export interface AgentTurnClaimResultV020 {
  created: boolean;
  runId: string;
  taskDigest: string;
  revision: number;
}

export interface AgentReceiptBeginInputV020 {
  scope: HostResolvedAgentDurabilityScopeV020;
  receipt: AgentActionReceiptBeginInputV010;
}

export interface AgentReceiptRecordV020 {
  receiptId: string;
  status: AgentActionReceiptStatusV010;
  inputDigest: string;
  revision: number;
}

export interface AsyncAgentRunReceiptRepositoryV020 {
  claimTurn(input: AgentTurnClaimInputV020): Promise<AgentTurnClaimResultV020>;
  getByTurn(input: {
    scope: HostResolvedAgentDurabilityScopeV020;
    threadId: string;
    clientTurnId: string;
  }): Promise<AgentTurnClaimResultV020 | undefined>;
  appendRunEvent(input: {
    scope: HostResolvedAgentDurabilityScopeV020;
    runId: string;
    expectedRevision: number;
    event: AgentRunEventV010;
  }): Promise<{ revision: number }>;
  listRunEvents(input: {
    scope: HostResolvedAgentDurabilityScopeV020;
    runId: string;
  }): Promise<AgentRunEventV010[]>;
  beginReceipt(input: AgentReceiptBeginInputV020):
    Promise<AgentReceiptRecordV020 & { created: boolean }>;
  completeReceipt(input: {
    scope: HostResolvedAgentDurabilityScopeV020;
    receiptId: string;
    status: "SUCCEEDED" | "FAILED" | "DENIED";
  }): Promise<AgentReceiptRecordV020 & { transitioned: boolean }>;
  getReceipt(input: {
    scope: HostResolvedAgentDurabilityScopeV020;
    receiptId: string;
  }): Promise<AgentReceiptRecordV020 | undefined>;
  close(): Promise<void>;
}
