import type { JsonValue } from "../runtime/contracts.js";

export type TaskInboxItemStateV010 =
  | "READY"
  | "ASSIGNED"
  | "IN_PROGRESS"
  | "BLOCKED"
  | "EXCEPTION";

export interface TaskInboxActionV010 {
  id: string;
  label: string;
  type: "command" | "navigate";
  command?: string;
  inputVersion?: string;
  route?: string;
  primary?: boolean;
  requiresConfirmation?: boolean;
  enabled?: boolean;
  disabledReason?: string;
}

export interface TaskInboxMetricV010 {
  id: string;
  label: string;
  value: string;
  tone?: "neutral" | "positive" | "warning" | "danger";
}

export interface TaskInboxEvidenceV010 {
  id: string;
  title: string;
  source?: string;
  detail?: string;
  route?: string;
}

export interface TaskInboxItemV010 {
  id: string;
  title: string;
  summary?: string;
  state: TaskInboxItemStateV010;
  statusLabel: string;
  priority: number;
  workType?: string;
  assignee?: {
    actorType: string;
    actorId: string;
  };
  metrics?: TaskInboxMetricV010[];
  evidence?: TaskInboxEvidenceV010[];
  primaryAction?: TaskInboxActionV010;
  secondaryActions?: TaskInboxActionV010[];
  metadata?: Record<string, JsonValue>;
}

export interface TaskInboxV010 {
  contractVersion: "0.1.0";
  kind: "task-inbox";
  id: string;
  title: string;
  description?: string;
  emptyMessage?: string;
  items: TaskInboxItemV010[];
  metadata?: Record<string, JsonValue>;
}

export function isTaskInboxV010(value: unknown): value is TaskInboxV010 {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }
  const item = value as Record<string, unknown>;
  return item.contractVersion === "0.1.0"
    && item.kind === "task-inbox"
    && typeof item.id === "string"
    && item.id.length > 0
    && typeof item.title === "string"
    && item.title.length > 0
    && Array.isArray(item.items);
}
