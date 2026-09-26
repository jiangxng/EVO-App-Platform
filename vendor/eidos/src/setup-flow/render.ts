import type {
  SetupFlowActionV010,
  SetupFlowStepV010,
  SetupFlowV010
} from "./contracts.js";

function esc(value: unknown): string {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function attr(name: string, value: unknown): string {
  return " " + name + "=\"" + esc(value) + "\"";
}

function actionButton(action: SetupFlowActionV010): string {
  const enabled = action.enabled !== false;
  return "<button type=\"button\""
    + attr("data-eidos-setup-action", action.id)
    + attr("data-eidos-action-type", action.type)
    + attr("data-eidos-primary", action.primary === true ? "true" : "false")
    + attr("data-eidos-confirm", action.requiresConfirmation === true ? "true" : "false")
    + (action.command ? attr("data-eidos-command", action.command) : "")
    + (action.inputVersion ? attr("data-eidos-input-version", action.inputVersion) : "")
    + (action.route ? attr("data-eidos-route", action.route) : "")
    + (action.disabledReason ? attr("title", action.disabledReason) + attr("data-eidos-disabled-reason", action.disabledReason) : "")
    + (enabled ? "" : " disabled")
    + ">" + esc(action.label) + "</button>";
}

function stepMarker(step: SetupFlowStepV010, index: number): string {
  if (step.state === "complete") return "✓";
  if (step.state === "error") return "!";
  if (step.state === "blocked") return "×";
  return String(index + 1);
}

function renderStep(step: SetupFlowStepV010, index: number): string {
  const actions = [
    ...(step.primaryAction ? [actionButton({ ...step.primaryAction, primary: true })] : []),
    ...(step.secondaryActions ?? []).map(actionButton)
  ].join("");
  return "<li data-eidos-setup-step"
    + attr("data-step-id", step.id)
    + attr("data-state", step.state)
    + (step.state === "current" ? " aria-current=\"step\"" : "")
    + "><div data-eidos-setup-step-marker aria-hidden=\"true\">" + esc(stepMarker(step, index)) + "</div>"
    + "<div data-eidos-setup-step-body><header><strong>" + esc(step.title) + "</strong>"
    + (step.statusDetail ? "<span data-eidos-setup-step-status>" + esc(step.statusDetail) + "</span>" : "")
    + "</header>"
    + (step.description ? "<p>" + esc(step.description) + "</p>" : "")
    + (actions ? "<div data-eidos-setup-step-actions>" + actions + "</div>" : "")
    + "</div></li>";
}

export function renderSetupFlowToHtml(document: SetupFlowV010): string {
  const ids = new Set<string>();
  for (const step of document.steps) {
    if (ids.has(step.id)) throw new Error("EIDOS_SETUP_STEP_DUPLICATE: " + step.id);
    ids.add(step.id);
  }
  const steps = document.steps.map(renderStep).join("");
  return "<section data-eidos-setup-flow"
    + attr("data-setup-id", document.id)
    + "><header data-eidos-setup-header><h1>" + esc(document.title) + "</h1>"
    + (document.description ? "<p>" + esc(document.description) + "</p>" : "")
    + "</header><ol data-eidos-setup-steps>" + steps + "</ol>"
    + (document.completionAction
      ? "<footer data-eidos-setup-footer>" + actionButton({ ...document.completionAction, primary: true }) + "</footer>"
      : "")
    + "</section>";
}
