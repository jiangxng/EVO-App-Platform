import type { JsonValue } from "../runtime/contracts.js";

export interface ContextualAssistanceSourceV010 {
  pageId: string; route: string; actionId: string;
}
export interface ContextualAssistanceRequestV010 {
  contractVersion: "0.1.0";
  requestId: string;
  taskKind: string;
  userIntent: string;
  source: ContextualAssistanceSourceV010;
  context: Record<string, JsonValue>;
}

/** Presentation transport only; no identity/authorization is derived here. */
export function contextualAssistanceRequestV010(
  prompt: string, requestId: string,
  interaction: Record<string, JsonValue> | undefined
): ContextualAssistanceRequestV010 | undefined {
  if (!interaction) return undefined;
  const source = record(interaction.source);
  const context = record(interaction.context);
  if (!source || !context || typeof context.taskKind !== "string") return undefined;
  for (const key of ["pageId", "route", "actionId"]) {
    if (typeof source[key] !== "string" || !(source[key] as string).trim()) return undefined;
  }
  return {
    contractVersion: "0.1.0", requestId, taskKind: context.taskKind,
    userIntent: prompt,
    source: { pageId: source.pageId as string, route: source.route as string, actionId: source.actionId as string },
    context: structuredClone(context) as Record<string, JsonValue>
  };
}
function record(value: unknown): Record<string, unknown> | undefined {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown> : undefined;
}

export type ContextualRefreshDecisionV010 = "REFRESH" | "PRESERVE_DRAFT" | "IGNORE";

/** No automatic navigation. Only a correlated successful result can refresh a clean same mount. */
export function contextualRefreshDecisionV010(input: {
  result: unknown;
  requestId: string;
  source: ContextualAssistanceSourceV010;
  taskKind: string;
  sameMount: boolean;
  dirty: boolean;
}): ContextualRefreshDecisionV010 {
  if (!input.sameMount) return "IGNORE";
  const outer = record(input.result);
  const payload = record(outer?.result);
  const result = record(payload?.assistanceResult);
  const run = record(payload?.run);
  const source = record(result?.source);
  if (outer?.ok !== true || result?.contractVersion !== "0.1.0"
    || result.requestId !== input.requestId || result.taskKind !== input.taskKind
    || result.runState !== "SUCCEEDED" || run?.state !== "SUCCEEDED"
    || typeof result.runId !== "string" || result.runId !== run.runId
    || !source || source.pageId !== input.source.pageId
    || source.route !== input.source.route || source.actionId !== input.source.actionId) return "IGNORE";
  return input.dirty ? "PRESERVE_DRAFT" : "REFRESH";
}

/** Track both existing and in-flight native form edits, including edits later reverted. */
export function trackContextualFormDraftV010(container: HTMLElement): {
  isDirty(): boolean; dispose(): void;
} {
  let edited = false;
  const snapshot = () => JSON.stringify(Array.from(
    container.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>("input,textarea,select")
  ).filter(control => !control.closest("[data-eidos-chat-composer]"))
    .map(control => ({
      name: control.name, value: control.value,
      checked: "checked" in control ? control.checked : undefined,
      selected: "selectedOptions" in control
        ? Array.from(control.selectedOptions).map(option => option.value) : undefined
    })));
  const initial = snapshot();
  const onEdit = (event: Event) => {
    const target = event.target;
    if (target instanceof Element && target.closest("input,textarea,select")
      && !target.closest("[data-eidos-chat-composer]")) edited = true;
  };
  container.addEventListener("input", onEdit);
  container.addEventListener("change", onEdit);
  return {
    isDirty: () => edited || snapshot() !== initial,
    dispose() {
      container.removeEventListener("input", onEdit);
      container.removeEventListener("change", onEdit);
    }
  };
}

