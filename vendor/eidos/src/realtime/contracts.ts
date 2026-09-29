export type RealtimeEventTypeV010 =
  | "HOST_TOPOLOGY_CHANGED"
  | "RESOURCE_INVALIDATED"
  | "RESOURCE_DELTA"
  | "RUN_STATE_CHANGED"
  | "OUTPUT_DELTA"
  | "TOOL_ACTIVITY"
  | "APPROVAL_REQUIRED"
  | "RESET_REQUIRED"
  | "NOTICE";

export interface RealtimeEventScopeV010 {
  principalSubjectId?: string;
  contextId?: string;
  enterpriseId?: string;
}

export interface RealtimeEventResourceV010 {
  kind: string;
  resourceId: string;
  previousVersion?: string | number;
  version?: string | number;
}

export interface RealtimeEventV010 {
  contractVersion: "0.1.0";
  eventId: string;
  sequence: number;
  topic: string;
  type: RealtimeEventTypeV010;
  occurredAt: string;
  scope?: RealtimeEventScopeV010;
  resource?: RealtimeEventResourceV010;
  correlationId?: string;
  causationId?: string;
  payload?: unknown;
}

export interface RealtimeConnectionStateV010 {
  state:
    | "IDLE"
    | "CONNECTING"
    | "CONNECTED"
    | "PAUSED_HIDDEN"
    | "RECONNECTING"
    | "DISPOSED";
  lastEventId?: string;
  retryCount: number;
}

export interface RealtimeEventSourceV010 {
  subscribe(handler: (event: RealtimeEventV010) => void): () => void;
  subscribeState?(
    handler: (state: RealtimeConnectionStateV010) => void
  ): () => void;
  connect(): void;
  disconnect(): void;
  dispose(): void;
  snapshot(): RealtimeConnectionStateV010;
}
