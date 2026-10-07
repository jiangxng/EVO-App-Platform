import type { EidosContextNavigationV010 } from "../navigation/context-navigation.js";
export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };
export type UidlControl = "text" | "number" | "money" | "select" | "date" | "reference" | "file";
export type UidlOptionValue = string | number | boolean;
export interface UidlOption { value: UidlOptionValue; label: string }
export interface UidlFileValueV010 {
  name: string;
  mediaType: string;
  size: number;
  contentBase64: string;
}
export interface UidlField {
  key: string; label: string; semanticType: string; control: UidlControl; required: boolean;
  readOnly?: boolean; initialValue?: UidlOptionValue; unit?: string; options?: UidlOption[];
  accept?: string[];
  maxBytes?: number;
  validation?: { min?: number; max?: number; pattern?: string };
}
export interface UidlAction {
  id: string;
  label: string;
  type: "submit" | "cancel" | "agent";
  command?: string;
  requiresConfirmation?: boolean;
  /**
   * Human-visible instruction for a contextual Agent action.
   * The Host decides which installed Agent surface handles the requested
   * capability; Eidos does not depend on a concrete Agent implementation.
   */
  prompt?: string;
  agentCapability?: string;
  context?: Record<string, JsonValue>;
  refreshSourceOnComplete?: boolean;
}
export interface UidlFormV011 {
  contractVersion: "0.1.1"; kind: "form"; id: string; title: string; purpose: "execute-command";
  description?: string;
  contextNavigation?: EidosContextNavigationV010;
  command: { code: string; inputVersion: string };
  fields: UidlField[]; actions: UidlAction[]; metadata?: Record<string, JsonValue>;
}
export interface RenderFieldV010 extends UidlField { inputName: string }
export interface FormRenderModelV010 {
  modelVersion: "0.1.0"; sourceContractVersion: "0.1.1"; kind: "form";
  id: string; title: string; description?: string;
  contextNavigation?: EidosContextNavigationV010;
  command: { code: string; inputVersion: string };
  fields: RenderFieldV010[];
  submitAction: { id: string; label: string; requiresConfirmation: boolean };
  cancelActions: Array<{ id: string; label: string }>;
  agentActions: Array<{
    id: string;
    label: string;
    prompt: string;
    agentCapability?: string;
    context?: Record<string, JsonValue>;
    refreshSourceOnComplete?: boolean;
  }>;
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
