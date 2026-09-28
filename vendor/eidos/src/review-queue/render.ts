import type {
  ReviewQueueActionV010,
  ReviewQueueFieldV010,
  ReviewQueueItemV010,
  ReviewQueueV010
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
  return ` ${name}="${esc(value)}"`;
}

function encodedValue(value: unknown): string {
  if (value === undefined || value === null) return "";
  if (typeof value === "string") return value;
  return JSON.stringify(value);
}

function renderAction(action: ReviewQueueActionV010, itemId: string): string {
  const enabled = action.enabled !== false;
  return `<button type="button"`
    + attr("data-eidos-review-action", action.id)
    + attr("data-eidos-item-id", itemId)
    + attr("data-eidos-action-type", action.type)
    + attr("data-eidos-primary", action.primary === true ? "true" : "false")
    + attr("data-eidos-confirm", action.requiresConfirmation === true ? "true" : "false")
    + (action.command ? attr("data-eidos-command", action.command) : "")
    + (action.inputVersion ? attr("data-eidos-input-version", action.inputVersion) : "")
    + (action.route ? attr("data-eidos-route", action.route) : "")
    + (action.disabledReason
      ? attr("title", action.disabledReason) + attr("data-eidos-disabled-reason", action.disabledReason)
      : "")
    + (enabled ? "" : " disabled")
    + ">" + esc(action.label) + "</button>";
}

function renderField(field: ReviewQueueFieldV010): string {
  const common = attr("name", field.key)
    + attr("data-eidos-review-field", field.key)
    + (field.readOnly ? " disabled" : "");

  if (field.control === "textarea") {
    return `<label data-eidos-review-field-wrap><span>${esc(field.label)}</span>`
      + `<textarea rows="3"${common}>`
      + esc(encodedValue(field.value)) + "</textarea></label>";
  }

  if (field.control === "select") {
    const current = encodedValue(field.value);
    const options = (field.options ?? []).map(option => {
      const value = encodedValue(option.value);
      return "<option"
        + attr("value", value)
        + attr("data-value-json", JSON.stringify(option.value))
        + (value === current ? " selected" : "")
        + ">" + esc(option.label) + "</option>";
    }).join("");
    return `<label data-eidos-review-field-wrap><span>${esc(field.label)}</span>`
      + "<select" + common + ">" + options + "</select></label>";
  }

  return `<label data-eidos-review-field-wrap><span>${esc(field.label)}</span>`
    + `<input type="text"${common}${attr("value", encodedValue(field.value))}></label>`;
}

function renderItem(item: ReviewQueueItemV010, technicalDetailsLabel: string): string {
  const metrics = (item.metrics ?? []).map(metric =>
    "<span data-eidos-review-metric"
      + attr("data-metric-id", metric.id)
      + attr("data-tone", metric.tone ?? "neutral")
      + "><span>" + esc(metric.label) + "</span><strong>" + esc(metric.value) + "</strong></span>"
  ).join("");

  const evidence = (item.evidence ?? []).map(entry =>
    "<article data-eidos-review-evidence" + attr("data-evidence-id", entry.id) + ">"
      + "<strong>" + esc(entry.title) + "</strong>"
      + (entry.source ? "<span>" + esc(entry.source) + "</span>" : "")
      + (entry.detail ? "<p>" + esc(entry.detail) + "</p>" : "")
      + (entry.route ? "<a" + attr("href", entry.route) + attr("data-eidos-route", entry.route) + ">Open</a>" : "")
      + "</article>"
  ).join("");

  const fields = (item.fields ?? []).map(renderField).join("");
  const technical = (item.technicalDetails ?? []).length
    ? "<details data-eidos-review-technical><summary>" + esc(technicalDetailsLabel) + "</summary><dl>"
      + (item.technicalDetails ?? []).map(detail =>
        "<div data-eidos-review-technical-row"
          + attr("data-detail-key", detail.key)
          + "><dt>" + esc(detail.label) + "</dt><dd>" + esc(detail.value) + "</dd></div>"
      ).join("")
      + "</dl></details>"
    : "";
  const actions = [
    ...(item.secondaryActions ?? []).map(action => renderAction(action, item.id)),
    ...(item.primaryAction ? [renderAction({ ...item.primaryAction, primary: true }, item.id)] : [])
  ].join("");

  return "<li data-eidos-review-item"
    + attr("data-item-id", item.id)
    + attr("data-state", item.state)
    + "><form data-eidos-review-form" + attr("data-item-id", item.id) + ">"
    + "<header data-eidos-review-item-header><div><strong>" + esc(item.title) + "</strong>"
    + (item.summary ? "<p>" + esc(item.summary) + "</p>" : "")
    + "</div><span data-eidos-review-status>" + esc(item.statusLabel) + "</span></header>"
    + (metrics ? "<div data-eidos-review-metrics>" + metrics + "</div>" : "")
    + (fields ? "<div data-eidos-review-fields>" + fields + "</div>" : "")
    + (evidence ? "<section data-eidos-review-evidence-list>" + evidence + "</section>" : "")
    + technical
    + (actions ? "<footer data-eidos-review-actions>" + actions + "</footer>" : "")
    + "</form></li>";
}

export function renderReviewQueueToHtml(document: ReviewQueueV010): string {
  const ids = new Set<string>();
  for (const item of document.items) {
    if (ids.has(item.id)) throw new Error("EIDOS_REVIEW_ITEM_DUPLICATE: " + item.id);
    ids.add(item.id);
  }

  const technicalDetailsLabel = document.technicalDetailsLabel ?? "Technical details";
  const items = document.items.map(item => renderItem(item, technicalDetailsLabel)).join("");
  const empty = document.items.length === 0
    ? "<div data-eidos-review-empty>" + esc(document.emptyMessage ?? "Nothing to review.") + "</div>"
    : "";

  return "<section data-eidos-review-queue" + attr("data-review-id", document.id) + ">"
    + "<header data-eidos-review-header><h1>" + esc(document.title) + "</h1>"
    + (document.description ? "<p>" + esc(document.description) + "</p>" : "")
    + "</header>"
    + empty
    + (items ? "<ol data-eidos-review-items>" + items + "</ol>" : "")
    + "</section>";
}
