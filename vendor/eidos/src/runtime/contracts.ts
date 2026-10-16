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
  /** Optional local navigation beside a form input; never submits. */
  contextLink?: { label: string; route: string };
  /** Opt-in select-only choice exclusivity within the mounted form. */
  exclusiveSelect?: { group: string; exemptValues: string[] };
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
/** Generic grouped decision surface: a primary field stays operable, while
 * secondary form inputs remain in an accessible native disclosure.
 * The Host/application provides business data and owns action execution. */
export interface UidlFormReviewGroupV010 {
  id: string;
  title: string;
  summary?: string;
  primaryFieldKey: string;
  detailFieldKeys: string[];
  detailsLabel?: string;
  defaultExpanded?: boolean;
  reviewStatus?: { key: string; label: string; tone?: "neutral" | "warning" | "positive" };
  /** Optional local feedback when the existing select changes. No save/commit.
   * Keys MUST be actual option values from primaryFieldKey. */
  statusByChoice?: Record<string, {key: string; label: string;
    tone?: "neutral" | "warning" | "positive"}>;
}
/** Optional table realization of existing reviewGroups, preserving form field identity. */
export interface UidlFormReviewTableV010 {
  columnLabels: { subject: string; evidence: string; decision: string; status: string };
  filter?: {
    label: string;
    selectedId: string;
    noMatchesMessage: string;
    options: { id: string; label: string; statusKeys: string[] }[];
  };
}

/** Reusable task context; all facts and issue semantics are Host/app supplied. */
export interface UidlFormReviewTaskV010 {
  subject: {
    title: string;
    subtitle?: string;
    statusLabel?: string;
    facts?: { id: string; label: string; value: string }[];
  };
  steps?: { id: string; label: string; state: "complete" | "current" | "upcoming" }[];
  metrics?: {
    id: string; label: string; value: string;
    tone?: "neutral" | "positive" | "warning" | "danger";
  }[];
  issuesTitle?: string;
  issuesDescription?: string;
  issues?: {
    id: string;
    title: string;
    description?: string;
    /** Focus an already defined group; never acts upon Host data. */
    focusGroupId?: string;
    actionLabel?: string;
  }[];
  /** Presentation-only guidance; not a claim of a successful save. */
  helpText?: string;
}
export interface UidlFormV011 {
  reviewGroups?: UidlFormReviewGroupV010[];
  reviewTable?: UidlFormReviewTableV010;
  reviewTask?: UidlFormReviewTaskV010;
  contractVersion: "0.1.1"; kind: "form"; id: string; title: string; purpose: "execute-command";
  description?: string;
  contextNavigation?: EidosContextNavigationV010;
  command: { code: string; inputVersion: string };
  fields: UidlField[]; actions: UidlAction[]; metadata?: Record<string, JsonValue>;
}
export interface RenderFieldV010 extends UidlField { inputName: string }
export interface FormRenderModelV010 {
  reviewGroups?: UidlFormReviewGroupV010[];
  reviewTable?: UidlFormReviewTableV010;
  reviewTask?: UidlFormReviewTaskV010;
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
