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

function actionButton(itemId: string, action: import("./contracts.js").CatalogBrowserActionV010, primary: boolean): string {
  const command = action.command ? ` data-eidos-command="${esc(action.command)}"` : "";
  const inputVersion = action.inputVersion ? ` data-eidos-input-version="${esc(action.inputVersion)}"` : "";
  const route = action.route ? ` data-eidos-route="${esc(action.route)}"` : "";
  const enabled = action.enabled !== false;
  const disabled = enabled ? "" : " disabled";
  const reason = action.disabledReason ? ` data-eidos-disabled-reason="${esc(action.disabledReason)}" title="${esc(action.disabledReason)}"` : "";
  const help = action.helpText ? `<span data-eidos-action-help data-action-id="${esc(action.id)}">${esc(action.helpText)}</span>` : "";
  return `<span data-eidos-action-wrap><button type="button" data-eidos-catalog-action="${esc(action.id)}" data-eidos-action-type="${esc(action.type)}" data-eidos-item-id="${esc(itemId)}" data-eidos-confirm="${action.requiresConfirmation === true ? "true" : "false"}" data-eidos-primary="${primary ? "true" : "false"}"${command}${inputVersion}${route}${reason}${disabled}>${esc(action.label)}</button>${help}</span>`;
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

    const searchText = [
      item.title,
      item.summary ?? "",
      item.version ?? "",
      item.category ?? "",
      ...(item.badges ?? []),
      ...Object.entries(item.metadata ?? {}).flatMap(([key, value]) => [key, String(value ?? "")])
    ].join(" ").toLocaleLowerCase();

    return `<article data-eidos-catalog-item="${esc(item.id)}" data-eidos-catalog-search-text="${esc(searchText)}"><header><div><h2>${esc(item.title)}</h2>${item.version ? `<span data-eidos-catalog-version>${esc(item.version)}</span>` : ""}</div>${status}</header>${item.category ? `<div data-eidos-catalog-category>${esc(item.category)}</div>` : ""}${item.summary ? `<p>${esc(item.summary)}</p>` : ""}<div data-eidos-catalog-badges>${badges}</div><div data-eidos-catalog-metadata>${metadata}</div><footer>${actions}</footer></article>`;
  }).join("");

  const search = model.search
    ? `<div data-eidos-catalog-search><input type="search" data-eidos-catalog-search-input placeholder="${esc(model.search.placeholder ?? "Search")}" aria-label="${esc(model.search.ariaLabel ?? model.search.placeholder ?? "Search catalog")}"></div>`
    : "";
  const noResults = model.search
    ? `<p data-eidos-catalog-search-empty hidden>${esc(model.search.noResultsMessage ?? "No matching items.")}</p>`
    : "";

  return `<section data-eidos-capability="catalog-browser" data-eidos-id="${esc(model.id)}"><header><h1>${esc(model.title)}</h1>${model.description ? `<p>${esc(model.description)}</p>` : ""}</header>${search}<div data-eidos-catalog-items>${items || `<p data-eidos-empty>${esc(model.emptyMessage ?? "No items")}</p>`}</div>${noResults}</section>`;
}
