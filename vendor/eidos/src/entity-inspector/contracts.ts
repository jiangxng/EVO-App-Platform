export type EntityInspectorToneV010 =
  | "neutral"
  | "positive"
  | "warning"
  | "danger"
  | "info";

export interface EntityInspectorMetricV010 {
  id: string;
  label: string;
  value: string;
  unit?: string;
  tone?: EntityInspectorToneV010;
  detail?: string;
}

export interface EntityInspectorEvidenceV010 {
  id: string;
  title: string;
  source: string;
  detail?: string;
  observedAt?: string;
}

export interface EntityInspectorItemV010 {
  id: string;
  title: string;
  kind?: string;
  status?: string;
  summary?: string;
  metrics?: EntityInspectorMetricV010[];
  evidence?: EntityInspectorEvidenceV010[];
}

export interface EntityInspectorFreshnessV010 {
  label: string;
  observedAt?: string;
  windowStartAt?: string;
  windowEndAt?: string;
  stale?: boolean;
}

export interface EntityInspectorV010 {
  contractVersion: "0.1.0";
  kind: "entity-inspector";
  id: string;
  title: string;
  description?: string;
  freshness?: EntityInspectorFreshnessV010;
  items: EntityInspectorItemV010[];
  emptyMessage?: string;
}
