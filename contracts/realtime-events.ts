export type HostRealtimeEventTypeV010 =
  | "HOST_TOPOLOGY_CHANGED"
  | "RESOURCE_INVALIDATED"
  | "RESOURCE_DELTA"
  | "RUN_STATE_CHANGED"
  | "OUTPUT_DELTA"
  | "TOOL_ACTIVITY"
  | "APPROVAL_REQUIRED"
  | "RESET_REQUIRED"
  | "NOTICE";

export interface HostRealtimeEventScopeV010 {
  principalSubjectId?: string;
  contextId?: string;
  enterpriseId?: string;
}

export interface HostRealtimeEventResourceV010 {
  kind: string;
  resourceId: string;
  previousVersion?: string | number;
  version?: string | number;
}

export interface HostRealtimeEventV010 {
  contractVersion: "0.1.0";
  eventId: string;
  sequence: number;
  topic: string;
  type: HostRealtimeEventTypeV010;
  occurredAt: string;
  scope?: HostRealtimeEventScopeV010;
  resource?: HostRealtimeEventResourceV010;
  correlationId?: string;
  causationId?: string;
  payload?: unknown;
}

export interface HostRealtimeEventInputV010 {
  topic: string;
  type: HostRealtimeEventTypeV010;
  scope?: HostRealtimeEventScopeV010;
  resource?: HostRealtimeEventResourceV010;
  correlationId?: string;
  causationId?: string;
  payload?: unknown;
}
