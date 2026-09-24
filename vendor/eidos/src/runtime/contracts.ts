export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };
export type UidlControl = "text" | "number" | "money" | "select" | "date" | "reference";
export type UidlOptionValue = string | number | boolean;
export interface UidlOption { value: UidlOptionValue; label: string }
export interface UidlField {
  key: string; label: string; semanticType: string; control: UidlControl; required: boolean;
  readOnly?: boolean; unit?: string; options?: UidlOption[];
  validation?: { min?: number; max?: number; pattern?: string };
}
export interface UidlAction { id: string; label: string; type: "submit" | "cancel"; command?: string; requiresConfirmation?: boolean }
export interface UidlFormV011 {
  contractVersion: "0.1.1"; kind: "form"; id: string; title: string; purpose: "execute-command";
  command: { code: string; inputVersion: string };
  fields: UidlField[]; actions: UidlAction[]; metadata?: Record<string, JsonValue>;
}
export interface RenderFieldV010 extends UidlField { inputName: string }
export interface FormRenderModelV010 {
  modelVersion: "0.1.0"; sourceContractVersion: "0.1.1"; kind: "form";
  id: string; title: string; command: { code: string; inputVersion: string };
  fields: RenderFieldV010[];
  submitAction: { id: string; label: string; requiresConfirmation: boolean };
  cancelActions: Array<{ id: string; label: string }>;
}
export interface ActionRequestV010 {
  contractVersion: "0.1.0"; type: "command";
  command: { code: string; inputVersion: string };
  values: Record<string, JsonValue>;
  sourceInteractionId: string; actionId: string;
  runtimeInstanceId?: string; requiresConfirmation: boolean;
}
export interface Diagnostic { code: string; path: string; message: string; fix?: string }
export interface ValidationResult<T> { ok: boolean; value?: T; diagnostics: Diagnostic[] }
