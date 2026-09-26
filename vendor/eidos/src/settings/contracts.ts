export type SettingsValueV010 = string | number | boolean;

export interface SettingsOptionV010 {
  label: string;
  value: SettingsValueV010;
}

export interface SettingsFieldV010 {
  key: string;
  label: string;
  description?: string;
  type: "string" | "secret" | "number" | "boolean" | "select";
  value: SettingsValueV010;
  defaultValue?: SettingsValueV010;
  options?: SettingsOptionV010[];
  readOnly?: boolean;
  status?: {
    label: string;
    tone?: "neutral" | "positive" | "warning" | "danger";
  };
}

export interface SettingsEditorV010 {
  contractVersion: "0.1.0";
  kind: "settings-editor";
  id: string;
  namespace: string;
  title: string;
  description?: string;
  command: {
    code: string;
    inputVersion: string;
  };
  settings: SettingsFieldV010[];
  saveLabel: string;
  emptyMessage?: string;
}

export interface SettingsGroupV020 {
  id: string;
  title: string;
  description?: string;
  advanced?: boolean;
  settings: SettingsFieldV010[];
}

export interface SettingsEditorV020 {
  contractVersion: "0.2.0";
  kind: "settings-editor";
  id: string;
  namespace: string;
  title: string;
  description?: string;
  notice?: {
    tone: "info" | "success" | "warning" | "danger";
    title?: string;
    message: string;
  };
  command: {
    code: string;
    inputVersion: string;
  };
  groups: SettingsGroupV020[];
  saveLabel: string;
  emptyMessage?: string;
}

export function isSettingsEditorV010(value: unknown): value is SettingsEditorV010 {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return false;
  const item = value as Record<string, unknown>;
  return item.contractVersion === "0.1.0"
    && item.kind === "settings-editor"
    && typeof item.id === "string"
    && typeof item.namespace === "string"
    && typeof item.title === "string"
    && Array.isArray(item.settings)
    && item.command !== null
    && typeof item.command === "object";
}

export function isSettingsEditorV020(value: unknown): value is SettingsEditorV020 {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return false;
  const item = value as Record<string, unknown>;
  return item.contractVersion === "0.2.0"
    && item.kind === "settings-editor"
    && typeof item.id === "string"
    && typeof item.namespace === "string"
    && typeof item.title === "string"
    && Array.isArray(item.groups)
    && item.command !== null
    && typeof item.command === "object";
}
