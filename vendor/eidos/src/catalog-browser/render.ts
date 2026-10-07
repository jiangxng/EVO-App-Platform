import type { CatalogBrowserV010 } from "./contracts.js";
import {
  assertContextNavigationV010,
  renderContextNavigationV010
} from "../navigation/context-navigation.js";

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
  if (
    input.density !== undefined
    && input.density !== "comfortable"
    && input.density !== "compact"
  ) {
    throw new Error("EIDOS_CATALOG_DENSITY_INVALID");
  }
  if (
    input.itemActivation !== undefined
    && input.itemActivation !== "primary-action"
  ) {
    throw new Error("EIDOS_CATALOG_ITEM_ACTIVATION_INVALID");
  }
  if (
    input.collectionTitle !== undefined
    && !input.collectionTitle.trim()
  ) {
    throw new Error("EIDOS_CATALOG_COLLECTION_TITLE_INVALID");
  }
  if (
    input.collectionDescription !== undefined
    && (
      !input.collectionDescription.trim()
      || !input.collectionTitle?.trim()
    )
  ) {
    throw new Error("EIDOS_CATALOG_COLLECTION_DESCRIPTION_INVALID");
  }
  assertContextNavigationV010(input.contextNavigation);
  if (input.actions !== undefined) {
    if (!Array.isArray(input.actions)) {
      throw new Error("EIDOS_CATALOG_PAGE_ACTIONS_INVALID");
    }
    const actionIds = new Set<string>();
    for (const action of input.actions) {
      if (!action?.id?.trim() || !action.label?.trim()) {
        throw new Error("EIDOS_CATALOG_PAGE_ACTION_INVALID");
      }
      if (actionIds.has(action.id)) {
        throw new Error("EIDOS_CATALOG_PAGE_ACTION_DUPLICATE");
      }
      actionIds.add(action.id);
    }
  }
  const ids = new Set<string>();
  for (const item of input.items) {
    if (!item.id || !item.title) throw new Error("EIDOS_CATALOG_ITEM_INVALID");
    if (item.thumbnail && (!item.thumbnail.src || !item.thumbnail.alt)) {
      throw new Error("EIDOS_CATALOG_ITEM_THUMBNAIL_INVALID");
    }
    if (ids.has(item.id)) throw new Error(`EIDOS_CATALOG_ITEM_DUPLICATE: ${item.id}`);
    ids.add(item.id);
  }
  return input;
}

function actionButton(itemId: string | undefined, action: import("./contracts.js").CatalogBrowserActionV010, primary: boolean): string {
  if (action.type === "download") {
    if (!action.href?.startsWith("/")) {
      throw new Error("EIDOS_CATALOG_DOWNLOAD_HREF_INVALID");
    }
    const downloadName = action.downloadFileName
      ? ` download="${esc(action.downloadFileName)}"`
      : " download";
    const help = action.helpText
      ? `<span data-eidos-action-help data-action-id="${esc(action.id)}">${esc(action.helpText)}</span>`
      : "";
    return `<span data-eidos-action-wrap><a data-eidos-catalog-download="${esc(action.id)}"${itemId ? ` data-eidos-item-id="${esc(itemId)}"` : ""} data-eidos-primary="${primary ? "true" : "false"}" href="${esc(action.href)}"${downloadName}>${esc(action.label)}</a>${help}</span>`;
  }
  const command = action.command ? ` data-eidos-command="${esc(action.command)}"` : "";
  const values = action.values
    ? ` data-eidos-action-values="${esc(JSON.stringify(action.values))}"`
    : "";
  const inputVersion = action.inputVersion ? ` data-eidos-input-version="${esc(action.inputVersion)}"` : "";
  const route = action.route ? ` data-eidos-route="${esc(action.route)}"` : "";
  const enabled = action.enabled !== false;
  const disabled = enabled ? "" : " disabled";
  const reason = action.disabledReason ? ` data-eidos-disabled-reason="${esc(action.disabledReason)}" title="${esc(action.disabledReason)}"` : "";
  const help = action.helpText ? `<span data-eidos-action-help data-action-id="${esc(action.id)}">${esc(action.helpText)}</span>` : "";
  return `<span data-eidos-action-wrap><button type="button" data-eidos-catalog-action="${esc(action.id)}" data-eidos-action-type="${esc(action.type)}"${itemId ? ` data-eidos-item-id="${esc(itemId)}"` : ""} data-eidos-confirm="${action.requiresConfirmation === true ? "true" : "false"}" data-eidos-primary="${primary ? "true" : "false"}"${command}${inputVersion}${route}${values}${reason}${disabled}>${esc(action.label)}</button>${help}</span>`;
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
    const thumbnail = item.thumbnail
      ? `<div data-eidos-catalog-thumbnail><img src="${esc(item.thumbnail.src)}" alt="${esc(item.thumbnail.alt)}" loading="lazy" decoding="async"></div>`
      : "";
    const rowPrimary =
      model.itemActivation === "primary-action"
      && item.primaryAction?.type === "navigate"
      && item.primaryAction.enabled !== false
      && Boolean(item.primaryAction.route);
    const actions = [
      ...(item.secondaryActions ?? []).map(a => actionButton(item.id, a, false)),
      ...(!rowPrimary && item.primaryAction
        ? [actionButton(item.id, item.primaryAction, true)]
        : [])
    ].join("");
    const rowAttributes = rowPrimary
      ? ` data-eidos-catalog-row-route="${esc(item.primaryAction!.route)}" role="link" tabindex="0" aria-label="${esc(item.primaryAction!.label + ": " + item.title)}"`
      : "";

    const searchText = [
      item.title,
      item.summary ?? "",
      item.version ?? "",
      item.category ?? "",
      item.thumbnail?.alt ?? "",
      ...(item.badges ?? []),
      ...Object.entries(item.metadata ?? {}).flatMap(([key, value]) => [key, String(value ?? "")])
    ].join(" ").toLocaleLowerCase();

    return `<article data-eidos-catalog-item="${esc(item.id)}" data-eidos-catalog-search-text="${esc(searchText)}"${rowAttributes}>${thumbnail}<header><div><h2>${esc(item.title)}</h2>${item.version ? `<span data-eidos-catalog-version>${esc(item.version)}</span>` : ""}</div>${status}</header>${item.category ? `<div data-eidos-catalog-category>${esc(item.category)}</div>` : ""}${item.summary ? `<p>${esc(item.summary)}</p>` : ""}<div data-eidos-catalog-badges>${badges}</div><div data-eidos-catalog-metadata>${metadata}</div><footer>${actions}</footer>${rowPrimary ? '<span data-eidos-catalog-row-disclosure aria-hidden="true">›</span>' : ""}</article>`;
  }).join("");

  const search = model.search
    ? `<div data-eidos-catalog-search><input type="search" data-eidos-catalog-search-input placeholder="${esc(model.search.placeholder ?? "Search")}" aria-label="${esc(model.search.ariaLabel ?? model.search.placeholder ?? "Search catalog")}"></div>`
    : "";
  const noResults = model.search
    ? `<p data-eidos-catalog-search-empty hidden>${esc(model.search.noResultsMessage ?? "No matching items.")}</p>`
    : "";

  const pageActions = (model.actions ?? [])
    .map(action =>
      actionButton(undefined, action, action.primary === true)
    )
    .join("");

  return `<section data-eidos-capability="catalog-browser" data-eidos-id="${esc(model.id)}" data-eidos-catalog-layout="${esc(model.layout ?? "grid")}" data-eidos-catalog-density="${esc(model.density ?? "comfortable")}">
<header data-eidos-page-header>
${renderContextNavigationV010(model.contextNavigation)}
<div data-eidos-page-heading>
<div data-eidos-page-heading-copy>
<h1>${esc(model.title)}</h1>
${model.description ? `<p data-eidos-page-description>${esc(model.description)}</p>` : ""}
</div>
${pageActions ? `<div data-eidos-page-actions>${pageActions}</div>` : ""}
</div>
</header>
${search}
${model.collectionTitle
  ? `<div data-eidos-collection-heading><div><h2>${esc(model.collectionTitle)}</h2>${model.collectionDescription ? `<p>${esc(model.collectionDescription)}</p>` : ""}</div></div>`
  : ""}
<div data-eidos-catalog-items>${items || `<p data-eidos-empty>${esc(model.emptyMessage ?? "No items")}</p>`}</div>
${noResults}
</section>`;
}
