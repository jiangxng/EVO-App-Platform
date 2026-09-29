import type {
  TaskInboxActionV010,
  TaskInboxItemV010,
  TaskInboxV010
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

function renderAction(action: TaskInboxActionV010, itemId: string): string {
  const enabled = action.enabled !== false;
  return "<button type=\"button\""
    + attr("data-eidos-task-action", action.id)
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

function renderItem(item: TaskInboxItemV010): string {
  const metrics = (item.metrics ?? []).map(metric =>
    "<span data-eidos-task-metric"
      + attr("data-metric-id", metric.id)
      + attr("data-tone", metric.tone ?? "neutral")
      + "><span>" + esc(metric.label) + "</span><strong>" + esc(metric.value) + "</strong></span>"
  ).join("");

  const evidence = (item.evidence ?? []).map(entry =>
    "<article data-eidos-task-evidence" + attr("data-evidence-id", entry.id) + ">"
      + "<strong>" + esc(entry.title) + "</strong>"
      + (entry.source ? "<span>" + esc(entry.source) + "</span>" : "")
      + (entry.detail ? "<p>" + esc(entry.detail) + "</p>" : "")
      + (entry.route ? "<a" + attr("href", entry.route) + attr("data-eidos-route", entry.route) + ">Open</a>" : "")
      + "</article>"
  ).join("");

  const actions = [
    ...(item.secondaryActions ?? []).map(action => renderAction(action, item.id)),
    ...(item.primaryAction ? [renderAction({ ...item.primaryAction, primary: true }, item.id)] : [])
  ].join("");

  const assignee = item.assignee
    ? "<span data-eidos-task-assignee>"
      + esc(item.assignee.actorType) + " · " + esc(item.assignee.actorId)
      + "</span>"
    : "";

  return "<li data-eidos-task-item"
    + attr("data-item-id", item.id)
    + attr("data-state", item.state)
    + attr("data-priority", item.priority)
    + (item.workType ? attr("data-work-type", item.workType) : "")
    + "><article>"
    + "<header data-eidos-task-item-header><div><strong>" + esc(item.title) + "</strong>"
    + (item.summary ? "<p>" + esc(item.summary) + "</p>" : "")
    + "</div><span data-eidos-task-status>" + esc(item.statusLabel) + "</span></header>"
    + assignee
    + (metrics ? "<div data-eidos-task-metrics>" + metrics + "</div>" : "")
    + (evidence ? "<section data-eidos-task-evidence-list>" + evidence + "</section>" : "")
    + (actions ? "<footer data-eidos-task-actions>" + actions + "</footer>" : "")
    + "</article></li>";
}

export function renderTaskInboxToHtml(document: TaskInboxV010): string {
  const ids = new Set<string>();
  for (const item of document.items) {
    if (ids.has(item.id)) throw new Error("EIDOS_TASK_INBOX_ITEM_DUPLICATE: " + item.id);
    ids.add(item.id);
  }

  const items = [...document.items]
    .sort((a, b) => b.priority - a.priority || a.id.localeCompare(b.id))
    .map(renderItem)
    .join("");

  const empty = document.items.length === 0
    ? "<div data-eidos-task-empty>" + esc(document.emptyMessage ?? "No work waiting.") + "</div>"
    : "";

  return "<section data-eidos-task-inbox" + attr("data-task-inbox-id", document.id) + ">"
    + "<header data-eidos-task-header><h1>" + esc(document.title) + "</h1>"
    + (document.description ? "<p>" + esc(document.description) + "</p>" : "")
    + "</header>"
    + empty
    + (items ? "<ol data-eidos-task-items>" + items + "</ol>" : "")
    + "</section>";
}
