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
  /** Render as a non-interactive hidden form value while retaining Host submission identity. */
  hidden?: boolean;
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
  /** Opt-in compact Human decision rows; default remains standard. */
  presentation?: "standard" | "compact";
  /** Optional section context preceding the original decision table. */
  heading?: { title: string; description?: string };
  /** Optional factual guidance near the live filter count and source-integrity footer. */
  toolbarHint?: string;
  footnote?: string;
  /** Optional reference to an existing Agent action, rendered beside the mapping filter. */
  agentActionId?: string;
  columnLabels: { subject: string; evidence: string; decision: string; status: string };
  filter?: {
    label: string;
    selectedId: string;
    noMatchesMessage: string;
    options: { id: string; label: string; statusKeys: string[] }[];
  };
}

/** Read-only, locally recomputed proposal plan. No Host approval or mutation.
 * Category keys must be statuses from actual reviewGroups / statusByChoice. */
export interface UidlFormReviewPlanV010 {
  title: string;
  description?: string;
  warning: string;
  categories: { id: string; label: string; statusKeys: string[] }[];
  /** Optional Human-facing proposed field name and type, both real Form keys. */
  proposedFields?: { groupId: string; labelFieldKey: string; typeFieldKey: string }[];
}
/** Reusable task context; all facts and issue semantics are Host/app supplied. */
export interface UidlFormReviewTaskV010 {
  /** Opt-in native disclosure retaining the complete task evidence. */
  presentation?: "full" | "decision-first" | "workbench";
  subject: {
    title: string;
    subtitle?: string;
    statusLabel?: string;
    /** Decorative source-format label, explicitly supplied by the app. */
    iconLabel?: string;
    facts?: { id: string; label: string; value: string }[];
  };
  steps?: { id: string; label: string; state: "complete" | "current" | "upcoming" }[];
  metrics?: {
    id: string; label: string; value: string;
    tone?: "neutral" | "positive" | "warning" | "danger";
  }[];
  issuesTitle?: string;
  issuesDescription?: string;
  /** Short app-owned suffix; Eidos derives the issue count from the list. */
  issuesCountSuffix?: string;
  issues?: {
    id: string;
    title: string;
    description?: string;
    /** Focus an already defined group; never acts upon Host data. */
    focusGroupId?: string;
    actionLabel?: string;
    /** Verified internal routes to real row correction pages, not client mutations. */
    relatedRoutes?: { label: string; route: string }[];
  }[];
  /** Presentation-only guidance; not a claim of a successful save. */
  helpText?: string;
  /** Optional local-only form reset and safe internal navigation, never Host mutation. */
  footer?: { back?: { label: string; route: string }; resetLabel?: string; saveHint?: string };
}
export interface UidlFormV011 {
  reviewGroups?: UidlFormReviewGroupV010[];
  reviewTable?: UidlFormReviewTableV010;
  reviewTask?: UidlFormReviewTaskV010;
  reviewPlan?: UidlFormReviewPlanV010;
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
  reviewPlan?: UidlFormReviewPlanV010;
  modelVersion: "0.1.0"; sourceContractVersion: "0.1.1"; kind: "form";
  id: string; title: string; description?: string;
  contextNavigation?: EidosContextNavigationV010;
  command: { code: string; inputVersion: string };
  fields: RenderFieldV010[];
  submitAction: { id: string; label: string; requiresConfirmation: boolean };
  submitActions: Array<{ id: string; label: string; command: string; requiresConfirmation: boolean }>;
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
