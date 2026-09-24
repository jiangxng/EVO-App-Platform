import type { SettingsEditorV010, SettingsFieldV010 } from "./contracts.js";

function esc(value: unknown): string {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function fieldControl(field: SettingsFieldV010): string {
  const disabled = field.readOnly ? " disabled" : "";
  if (field.type === "boolean") {
    return `<input type="checkbox" name="${esc(field.key)}" data-setting-type="boolean"${field.value === true ? " checked" : ""}${disabled}>`;
  }
  if (field.type === "select") {
    const options = (field.options ?? []).map(option =>
      `<option value="${esc(option.value)}" data-value-type="${typeof option.value}"${option.value === field.value ? " selected" : ""}>${esc(option.label)}</option>`
    ).join("");
    return `<select name="${esc(field.key)}" data-setting-type="select"${disabled}>${options}</select>`;
  }
  const type = field.type === "number" ? "number" : "text";
  return `<input type="${type}" name="${esc(field.key)}" data-setting-type="${esc(field.type)}" value="${esc(field.value)}"${disabled}>`;
}

export function renderSettingsEditorToHtml(document: SettingsEditorV010): string {
  const settings = document.settings.length === 0
    ? `<p data-eidos-settings-empty>${esc(document.emptyMessage ?? "No configurable settings.")}</p>`
    : document.settings.map(field => `
      <label data-eidos-setting="${esc(field.key)}">
        <span data-eidos-setting-label>${esc(field.label)}</span>
        ${field.description ? `<small data-eidos-setting-description>${esc(field.description)}</small>` : ""}
        ${fieldControl(field)}
      </label>
    `).join("");

  return `<section data-eidos-settings-editor="${esc(document.id)}" data-namespace="${esc(document.namespace)}">
    <header><h1>${esc(document.title)}</h1>${document.description ? `<p>${esc(document.description)}</p>` : ""}</header>
    <form data-eidos-settings-form>
      ${settings}
      ${document.settings.length ? `<button type="submit">${esc(document.saveLabel)}</button>` : ""}
    </form>
  </section>`;
}
