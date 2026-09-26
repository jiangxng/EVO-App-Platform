import type {
  SettingsEditorV010,
  SettingsEditorV020,
  SettingsFieldV010,
  SettingsGroupV020
} from "./contracts.js";

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
    return "<input type=\"checkbox\" name=\"" + esc(field.key) + "\" data-setting-type=\"boolean\""
      + (field.value === true ? " checked" : "") + disabled + ">";
  }
  if (field.type === "select") {
    const options = (field.options ?? []).map(option =>
      "<option value=\"" + esc(option.value) + "\" data-value-type=\"" + typeof option.value + "\""
      + (option.value === field.value ? " selected" : "") + ">" + esc(option.label) + "</option>"
    ).join("");
    return "<select name=\"" + esc(field.key) + "\" data-setting-type=\"select\"" + disabled + ">" + options + "</select>";
  }
  const type = field.type === "number" ? "number" : field.type === "secret" ? "password" : "text";
  return "<input type=\"" + type + "\" name=\"" + esc(field.key) + "\" data-setting-type=\"" + esc(field.type)
    + "\" value=\"" + esc(field.value) + "\"" + disabled + ">";
}

function renderField(field: SettingsFieldV010): string {
  const status = field.status
    ? "<span data-eidos-setting-status data-tone=\"" + esc(field.status.tone ?? "neutral") + "\">" + esc(field.status.label) + "</span>"
    : "";
  return "<label data-eidos-setting=\"" + esc(field.key) + "\">"
    + "<span data-eidos-setting-label-row><span data-eidos-setting-label>" + esc(field.label) + "</span>" + status + "</span>"
    + (field.description ? "<small data-eidos-setting-description>" + esc(field.description) + "</small>" : "")
    + fieldControl(field)
    + "</label>";
}

function renderGroup(group: SettingsGroupV020): string {
  const body = "<div data-eidos-settings-group-body>" + group.settings.map(renderField).join("") + "</div>";
  const header = "<div data-eidos-settings-group-header><h2>" + esc(group.title) + "</h2>"
    + (group.description ? "<p>" + esc(group.description) + "</p>" : "") + "</div>";
  if (group.advanced) {
    return "<details data-eidos-settings-group data-advanced=\"true\"><summary>" + esc(group.title) + "</summary>"
      + (group.description ? "<p data-eidos-settings-group-description>" + esc(group.description) + "</p>" : "")
      + body + "</details>";
  }
  return "<section data-eidos-settings-group data-advanced=\"false\">" + header + body + "</section>";
}

export function renderSettingsEditorToHtml(document: SettingsEditorV010 | SettingsEditorV020): string {
  if (document.contractVersion === "0.1.0") {
    const settings = document.settings.length === 0
      ? "<p data-eidos-settings-empty>" + esc(document.emptyMessage ?? "No configurable settings.") + "</p>"
      : document.settings.map(renderField).join("");

    return "<section data-eidos-settings-editor=\"" + esc(document.id) + "\" data-settings-version=\"0.1.0\" data-namespace=\"" + esc(document.namespace) + "\">"
      + "<header><h1>" + esc(document.title) + "</h1>" + (document.description ? "<p>" + esc(document.description) + "</p>" : "") + "</header>"
      + "<form data-eidos-settings-form>" + settings
      + (document.settings.length ? "<button type=\"submit\">" + esc(document.saveLabel) + "</button>" : "")
      + "</form></section>";
  }

  const count = document.groups.reduce((sum, group) => sum + group.settings.length, 0);
  const groups = count === 0
    ? "<p data-eidos-settings-empty>" + esc(document.emptyMessage ?? "No configurable settings.") + "</p>"
    : document.groups.map(renderGroup).join("");

  const notice = document.notice
    ? "<section data-eidos-settings-notice data-tone=\"" + esc(document.notice.tone) + "\">"
      + (document.notice.title ? "<strong>" + esc(document.notice.title) + "</strong>" : "")
      + "<p>" + esc(document.notice.message) + "</p></section>"
    : "";

  return "<section data-eidos-settings-editor=\"" + esc(document.id) + "\" data-settings-version=\"0.2.0\" data-namespace=\"" + esc(document.namespace) + "\">"
    + "<header><h1>" + esc(document.title) + "</h1>" + (document.description ? "<p>" + esc(document.description) + "</p>" : "") + "</header>"
    + notice
    + "<form data-eidos-settings-form>" + groups
    + (count ? "<footer data-eidos-settings-footer><button type=\"submit\">" + esc(document.saveLabel) + "</button></footer>" : "")
    + "</form></section>";
}
