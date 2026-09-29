import type {
  EntityInspectorItemV010,
  EntityInspectorV010
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

function renderItem(item: EntityInspectorItemV010): string {
  const metrics = (item.metrics ?? []).map(metric =>
    "<div data-eidos-entity-metric"
      + attr("data-metric-id", metric.id)
      + attr("data-tone", metric.tone ?? "neutral")
      + "><span>" + esc(metric.label) + "</span>"
      + "<strong>" + esc(metric.value)
      + (metric.unit ? " " + esc(metric.unit) : "")
      + "</strong>"
      + (metric.detail ? "<small>" + esc(metric.detail) + "</small>" : "")
      + "</div>"
  ).join("");

  const evidence = (item.evidence ?? []).map(entry =>
    "<article data-eidos-entity-evidence"
      + attr("data-evidence-id", entry.id)
      + "><strong>" + esc(entry.title) + "</strong>"
      + "<span>" + esc(entry.source) + "</span>"
      + (entry.detail ? "<p>" + esc(entry.detail) + "</p>" : "")
      + (entry.observedAt
        ? "<time" + attr("datetime", entry.observedAt) + ">"
          + esc(entry.observedAt) + "</time>"
        : "")
      + "</article>"
  ).join("");

  return "<li data-eidos-entity-item"
    + attr("data-item-id", item.id)
    + (item.kind ? attr("data-kind", item.kind) : "")
    + (item.status ? attr("data-status", item.status) : "")
    + "><article>"
    + "<header><strong>" + esc(item.title) + "</strong>"
    + (item.kind ? "<span data-eidos-entity-kind>" + esc(item.kind) + "</span>" : "")
    + (item.status ? "<span data-eidos-entity-status>" + esc(item.status) + "</span>" : "")
    + "</header>"
    + (item.summary ? "<p data-eidos-entity-summary>" + esc(item.summary) + "</p>" : "")
    + (metrics ? "<section data-eidos-entity-metrics>" + metrics + "</section>" : "")
    + (evidence ? "<section data-eidos-entity-evidence-list>" + evidence + "</section>" : "")
    + "</article></li>";
}

export function isEntityInspectorV010(value: unknown): value is EntityInspectorV010 {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return false;
  const candidate = value as Partial<EntityInspectorV010>;
  return candidate.contractVersion === "0.1.0"
    && candidate.kind === "entity-inspector"
    && typeof candidate.id === "string"
    && typeof candidate.title === "string"
    && Array.isArray(candidate.items);
}

export function renderEntityInspectorToHtml(
  document: EntityInspectorV010
): string {
  const ids = new Set<string>();
  for (const item of document.items) {
    if (ids.has(item.id)) {
      throw new Error("EIDOS_ENTITY_INSPECTOR_ITEM_DUPLICATE: " + item.id);
    }
    ids.add(item.id);
  }

  const freshness = document.freshness
    ? "<div data-eidos-entity-freshness"
      + attr("data-stale", document.freshness.stale === true ? "true" : "false")
      + "><strong>" + esc(document.freshness.label) + "</strong>"
      + (document.freshness.windowStartAt && document.freshness.windowEndAt
        ? "<span>" + esc(document.freshness.windowStartAt)
          + " → " + esc(document.freshness.windowEndAt) + "</span>"
        : "")
      + (document.freshness.observedAt
        ? "<time" + attr("datetime", document.freshness.observedAt) + ">"
          + esc(document.freshness.observedAt) + "</time>"
        : "")
      + "</div>"
    : "";

  const items = document.items.map(renderItem).join("");
  const empty = document.items.length === 0
    ? "<div data-eidos-entity-empty>"
      + esc(document.emptyMessage ?? "No entities available.")
      + "</div>"
    : "";

  return "<section data-eidos-entity-inspector"
    + attr("data-entity-inspector-id", document.id)
    + "><header data-eidos-entity-inspector-header><h1>" + esc(document.title) + "</h1>"
    + (document.description ? "<p>" + esc(document.description) + "</p>" : "")
    + "</header>"
    + freshness
    + empty
    + (items ? "<ol data-eidos-entity-items>" + items + "</ol>" : "")
    + "</section>";
}
