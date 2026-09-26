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
