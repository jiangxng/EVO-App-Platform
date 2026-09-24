import type { CatalogBrowserV010 } from "./contracts.js";

function esc(value: unknown): string {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function assertCatalog(input: CatalogBrowserV010): CatalogBrowserV010 {
  if (input.contractVersion !== "0.1.0" || input.kind !== "catalog-browser") {
    throw new Error("EIDOS_CATALOG_VERSION_UNSUPPORTED");
  }
  if (!input.id || !input.title || !Array.isArray(input.items)) {
    throw new Error("EIDOS_CATALOG_INVALID");
  }
  const ids = new Set<string>();
  for (const item of input.items) {
    if (!item.id || !item.title) throw new Error("EIDOS_CATALOG_ITEM_INVALID");
    if (ids.has(item.id)) throw new Error(`EIDOS_CATALOG_ITEM_DUPLICATE: ${item.id}`);
    ids.add(item.id);
  }
  return input;
}

function actionButton(itemId: string, action: { id: string; label: string; requiresConfirmation?: boolean }, primary: boolean): string {
  return `<button type="button" data-eidos-catalog-action="${esc(action.id)}" data-eidos-item-id="${esc(itemId)}" data-eidos-confirm="${action.requiresConfirmation === true ? "true" : "false"}" data-eidos-primary="${primary ? "true" : "false"}">${esc(action.label)}</button>`;
}

export function renderCatalogBrowserToHtml(input: CatalogBrowserV010): string {
  const model = assertCatalog(input);
  const items = model.items.map(item => {
    const badges = (item.badges ?? []).map(x => `<span data-eidos-catalog-badge>${esc(x)}</span>`).join("");
    const metadata = Object.entries(item.metadata ?? {})
      .map(([key, value]) => `<span data-eidos-catalog-meta data-key="${esc(key)}">${esc(key)}: ${esc(value)}</span>`)
      .join("");
    const status = item.status
      ? `<span data-eidos-catalog-status data-tone="${esc(item.status.tone ?? "neutral")}">${esc(item.status.label)}</span>`
      : "";
    const actions = [
      ...(item.primaryAction ? [actionButton(item.id, item.primaryAction, true)] : []),
      ...(item.secondaryActions ?? []).map(a => actionButton(item.id, a, false))
    ].join("");

    return `<article data-eidos-catalog-item="${esc(item.id)}"><header><div><h2>${esc(item.title)}</h2>${item.version ? `<span data-eidos-catalog-version>${esc(item.version)}</span>` : ""}</div>${status}</header>${item.category ? `<div data-eidos-catalog-category>${esc(item.category)}</div>` : ""}${item.summary ? `<p>${esc(item.summary)}</p>` : ""}<div data-eidos-catalog-badges>${badges}</div><div data-eidos-catalog-metadata>${metadata}</div><footer>${actions}</footer></article>`;
  }).join("");

  return `<section data-eidos-capability="catalog-browser" data-eidos-id="${esc(model.id)}"><header><h1>${esc(model.title)}</h1>${model.description ? `<p>${esc(model.description)}</p>` : ""}</header><div data-eidos-catalog-items>${items || `<p data-eidos-empty>${esc(model.emptyMessage ?? "No items")}</p>`}</div></section>`;
}
