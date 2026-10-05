import type {
  CatalogBrowserActionV010
} from "../catalog-browser/contracts.js";
import type {
  CatalogDetailGalleryItemV010,
  CatalogDetailV010
} from "./contracts.js";

function esc(value: unknown): string {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function encodedValues(
  action: CatalogBrowserActionV010
): string {
  if (!action.values) return "";
  return ` data-eidos-action-values="${esc(JSON.stringify(action.values))}"`;
}

function actionAttributes(
  itemId: string,
  action: CatalogBrowserActionV010,
  primary: boolean
): string {
  const command = action.command
    ? ` data-eidos-command="${esc(action.command)}"`
    : "";
  const inputVersion = action.inputVersion
    ? ` data-eidos-input-version="${esc(action.inputVersion)}"`
    : "";
  const route = action.route
    ? ` data-eidos-route="${esc(action.route)}"`
    : "";
  const enabled = action.enabled !== false;
  const disabled = enabled ? "" : " disabled";
  const reason = action.disabledReason
    ? ` data-eidos-disabled-reason="${esc(action.disabledReason)}" title="${esc(action.disabledReason)}"`
    : "";
  return [
    `data-eidos-catalog-action="${esc(action.id)}"`,
    `data-eidos-action-type="${esc(action.type)}"`,
    `data-eidos-item-id="${esc(itemId)}"`,
    `data-eidos-confirm="${action.requiresConfirmation === true ? "true" : "false"}"`,
    `data-eidos-primary="${primary ? "true" : "false"}"`,
    command,
    inputVersion,
    route,
    encodedValues(action),
    reason,
    disabled
  ].join(" ");
}

function actionButton(
  itemId: string,
  action: CatalogBrowserActionV010,
  primary: boolean
): string {
  const help = action.helpText
    ? `<span data-eidos-action-help data-action-id="${esc(action.id)}">${esc(action.helpText)}</span>`
    : "";
  if (action.type === "download") {
    if (!action.href?.startsWith("/")) {
      throw new Error("EIDOS_CATALOG_DOWNLOAD_HREF_INVALID");
    }
    const downloadName = action.downloadFileName
      ? ` download="${esc(action.downloadFileName)}"`
      : " download";
    return `<span data-eidos-action-wrap><a data-eidos-catalog-download="${esc(action.id)}" data-eidos-item-id="${esc(itemId)}" data-eidos-primary="${primary ? "true" : "false"}" href="${esc(action.href)}"${downloadName}>${esc(action.label)}</a>${help}</span>`;
  }
  return `<span data-eidos-action-wrap><button type="button" ${actionAttributes(itemId, action, primary)}>${esc(action.label)}</button>${help}</span>`;
}

function mediaButton(
  itemId: string,
  media: CatalogDetailGalleryItemV010,
  role: "primary" | "thumbnail"
): string {
  const content =
    `<img src="${esc(media.thumbnail.src)}" alt="${esc(media.thumbnail.alt)}" loading="lazy" decoding="async">`;
  const mediaContent = media.action
    ? `<button type="button" data-eidos-catalog-detail-media="${esc(role)}" data-eidos-media-id="${esc(media.id)}" aria-label="${esc(media.action.label)}" ${actionAttributes(itemId, media.action, false)}>${content}<span data-eidos-catalog-detail-media-label>${esc(media.title)}</span></button>`
    : `<div data-eidos-catalog-detail-media="${esc(role)}" data-eidos-media-id="${esc(media.id)}">${content}<span data-eidos-catalog-detail-media-label>${esc(media.title)}</span></div>`;
  const actions = (media.secondaryActions ?? [])
    .map(action => actionButton(itemId, action, false))
    .join("");
  return actions
    ? `<div data-eidos-catalog-detail-media-wrap data-eidos-media-id="${esc(media.id)}">${mediaContent}<div data-eidos-catalog-detail-media-actions>${actions}</div></div>`
    : mediaContent;
}

export function assertCatalogDetailV010(
  input: CatalogDetailV010
): CatalogDetailV010 {
  if (
    input?.contractVersion !== "0.1.0"
    || input.kind !== "catalog-detail"
    || !input.id?.trim()
    || !input.itemId?.trim()
    || !input.title?.trim()
    || !Array.isArray(input.gallery?.items)
    || input.gallery.items.length < 1
  ) {
    throw new Error("EIDOS_CATALOG_DETAIL_INVALID");
  }

  const ids = new Set<string>();
  for (const item of input.gallery.items) {
    if (
      !item.id?.trim()
      || !item.title?.trim()
      || !item.thumbnail?.src?.trim()
      || !item.thumbnail?.alt?.trim()
    ) {
      throw new Error("EIDOS_CATALOG_DETAIL_GALLERY_ITEM_INVALID");
    }
    if (ids.has(item.id)) {
      throw new Error("EIDOS_CATALOG_DETAIL_GALLERY_ITEM_DUPLICATE");
    }
    ids.add(item.id);
  }
  if (!ids.has(input.gallery.primaryItemId)) {
    throw new Error("EIDOS_CATALOG_DETAIL_PRIMARY_MEDIA_NOT_FOUND");
  }
  return input;
}

export function renderCatalogDetailToHtml(
  input: CatalogDetailV010
): string {
  const model = assertCatalogDetailV010(input);
  const primary = model.gallery.items.find(
    item => item.id === model.gallery.primaryItemId
  )!;
  const thumbnails = model.gallery.items
    .map(item => mediaButton(model.itemId, item, "thumbnail"))
    .join("");
  const badges = (model.badges ?? [])
    .map(value => `<span data-eidos-catalog-badge>${esc(value)}</span>`)
    .join("");
  const metadata = Object.entries(model.metadata ?? {})
    .map(([key, value]) =>
      `<span data-eidos-catalog-meta data-key="${esc(key)}">${esc(key)}: ${esc(value)}</span>`
    )
    .join("");
  const actions = [
    ...(model.secondaryActions ?? []).map(action =>
      actionButton(model.itemId, action, false)
    ),
    ...(model.primaryAction
      ? [actionButton(model.itemId, model.primaryAction, true)]
      : [])
  ].join("");

  return `<article data-eidos-capability="catalog-detail" data-eidos-id="${esc(model.id)}" data-eidos-item-id="${esc(model.itemId)}"><section data-eidos-catalog-detail-gallery>${mediaButton(model.itemId, primary, "primary")}<div data-eidos-catalog-detail-thumbnails>${thumbnails}</div></section><section data-eidos-catalog-detail-info><header><div><h1>${esc(model.title)}</h1>${model.version ? `<span data-eidos-catalog-version>${esc(model.version)}</span>` : ""}</div></header>${model.category ? `<div data-eidos-catalog-category>${esc(model.category)}</div>` : ""}${model.description ? `<p>${esc(model.description)}</p>` : ""}<div data-eidos-catalog-badges>${badges}</div><div data-eidos-catalog-metadata>${metadata}</div><footer>${actions}</footer></section></article>`;
}
