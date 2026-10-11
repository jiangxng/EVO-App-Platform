/** Client task coordinates only. Host identity and authorization stay separate. */
export interface AgentAssistanceSourceV010 {
  pageId: string;
  actionId: string;
  route?: string;
  resourceRef?: string;
  resourceRevision?: string;
}

export type AgentAssistanceJsonV010 =
  | null | boolean | number | string
  | AgentAssistanceJsonV010[]
  | { [key: string]: AgentAssistanceJsonV010 };

/** Additive thread.send values.assistanceRequest opt-in. */
export interface AgentAssistanceRequestV010 {
  contractVersion: "0.1.0";
  requestId: string;
  taskKind: string;
  userIntent: string;
  source: AgentAssistanceSourceV010;
  context?: { [key: string]: AgentAssistanceJsonV010 };
}

/** Run completion is not proof of a business write or permission to refresh. */
export interface AgentAssistanceResultV010 {
  contractVersion: "0.1.0";
  requestId: string;
  taskKind: string;
  source: AgentAssistanceSourceV010;
  runId: string;
  runState: "READY" | "RUNNING" | "PAUSED" | "BLOCKED"
    | "SUCCEEDED" | "FAILED" | "CANCELLED";
  actionReceiptIds: string[];
}
