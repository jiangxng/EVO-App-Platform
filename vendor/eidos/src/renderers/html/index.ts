import type {
  RenderFieldV010
} from "../../runtime/contracts.js";
import { toRenderModel } from "../../runtime/render-model.js";
import {
  renderContextNavigationV010
} from "../../navigation/context-navigation.js";

function esc(value: unknown): string {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function input(field: RenderFieldV010): string {
  const common = [
    `name="${esc(field.inputName)}"`,
    `data-semantic-type="${esc(field.semanticType)}"`,
    field.required ? "required" : "",
    field.readOnly ? "disabled" : ""
  ].filter(Boolean).join(" ");

  if (field.control === "select") {
    return `<select ${common}>${(field.options ?? []).map(option =>
      `<option data-value-type="${typeof option.value}" value="${esc(option.value)}"${field.initialValue === option.value ? " selected" : ""}>${esc(option.label)}</option>`
    ).join("")}</select>`;
  }

  if (field.control === "file") {
    const accept = field.accept?.length
      ? ` accept="${esc(field.accept.join(","))}"`
      : "";
    const maxBytes = field.maxBytes !== undefined
      ? ` data-eidos-file-max-bytes="${esc(field.maxBytes)}"`
      : "";
    return `<input type="file" ${common} data-eidos-file-field${accept}${maxBytes}>`;
  }

  const type = field.control === "number" || field.control === "money"
    ? "number"
    : field.control === "date"
      ? "date"
      : "text";
  const min = field.validation?.min !== undefined
    ? ` min="${esc(field.validation.min)}"`
    : "";
  const max = field.validation?.max !== undefined
    ? ` max="${esc(field.validation.max)}"`
    : "";
  const pattern = field.validation?.pattern
    ? ` pattern="${esc(field.validation.pattern)}"`
    : "";
  const initial = field.initialValue !== undefined
    ? ` value="${esc(field.initialValue)}"`
    : "";

  return `<input type="${type}" ${common}${initial}${min}${max}${pattern}>${field.unit ? `<span data-unit>${esc(field.unit)}</span>` : ""}`;
}

export function renderToHtml(document: unknown): string {
  const model = toRenderModel(document);
  const fields = model.fields
    .map(field => `<label>${esc(field.label)}${input(field)}</label>`)
    .join("");
  const agentActions = model.agentActions
    .map(action =>
      `<button type="button" data-eidos-agent-action="${esc(action.id)}">${esc(action.label)}</button>`
    )
    .join("");
  const cancels = model.cancelActions
    .map(action =>
      `<button type="button" data-eidos-action="${esc(action.id)}">${esc(action.label)}</button>`
    )
    .join("");

  return `<form data-eidos-id="${esc(model.id)}" data-command="${esc(model.command.code)}" data-model-version="${model.modelVersion}">
<header data-eidos-page-header>
${renderContextNavigationV010(model.contextNavigation)}
<div data-eidos-page-heading>
<div data-eidos-page-heading-copy>
<h1>${esc(model.title)}</h1>
${model.description ? `<p data-eidos-page-description>${esc(model.description)}</p>` : ""}
</div>
</div>
</header>
<div data-eidos-form-fields>${fields}</div>
<footer data-eidos-form-actions>
<button type="submit" data-eidos-action="${esc(model.submitAction.id)}" data-eidos-primary="true">${esc(model.submitAction.label)}</button>
${agentActions}${cancels}
</footer>
</form>`;
}
