import type { JsonValue } from "../runtime/contracts.js";

export type ReviewQueueItemStateV010 =
  | "pending"
  | "attention"
  | "accepted"
  | "rejected";

export interface ReviewQueueActionV010 {
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

export interface ReviewQueueFieldOptionV010 {
  label: string;
  value: JsonValue;
}

export interface ReviewQueueFieldV010 {
  key: string;
  label: string;
  control: "text" | "textarea" | "select";
  value?: JsonValue;
  readOnly?: boolean;
  options?: ReviewQueueFieldOptionV010[];
}

export interface ReviewQueueEvidenceV010 {
  id: string;
  title: string;
  source?: string;
  detail?: string;
  route?: string;
}

export interface ReviewQueueMetricV010 {
  id: string;
  label: string;
  value: string;
  tone?: "neutral" | "positive" | "warning" | "danger";
}

export interface ReviewQueueItemV010 {
  id: string;
  title: string;
  summary?: string;
  state: ReviewQueueItemStateV010;
  statusLabel: string;
  fields?: ReviewQueueFieldV010[];
  evidence?: ReviewQueueEvidenceV010[];
  metrics?: ReviewQueueMetricV010[];
  primaryAction?: ReviewQueueActionV010;
  secondaryActions?: ReviewQueueActionV010[];
  metadata?: Record<string, JsonValue>;
}

export interface ReviewQueueV010 {
  contractVersion: "0.1.0";
  kind: "review-queue";
  id: string;
  title: string;
  description?: string;
  emptyMessage?: string;
  items: ReviewQueueItemV010[];
  metadata?: Record<string, JsonValue>;
}

export function isReviewQueueV010(value: unknown): value is ReviewQueueV010 {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return false;
  const item = value as Record<string, unknown>;
  return item.contractVersion === "0.1.0"
    && item.kind === "review-queue"
    && typeof item.id === "string"
    && item.id.length > 0
    && typeof item.title === "string"
    && item.title.length > 0
    && Array.isArray(item.items);
}
