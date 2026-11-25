import type { CatalogBrowserV010 } from "./contracts.js";
import { assertAuthorizedAggregateBarsV010, renderAuthorizedAggregateBarsToHtmlV010 } from "./authorized-bars.js";
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

/** Domain-owned catalog navigation must stay on this origin. It is not an ACL check. */
function isLocalCatalogRoute(route: unknown): route is string {
  return typeof route === "string"
    && route.startsWith("/")
    && !route.startsWith("//")
    && !route.includes("\\")
    && !/[\u0000-\u001f\u007f]/.test(route);
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
  if (input.authorizedChart) assertAuthorizedAggregateBarsV010(input.authorizedChart);
  if (input.presentation !== undefined && !["table","chart","board"].includes(input.presentation)) {
    throw new Error("EIDOS_CATALOG_PRESENTATION_INVALID");
  }
  if (input.presentation === "chart" && (!input.table || !input.authorizedChart)) {
    throw new Error("EIDOS_CATALOG_CHART_NOT_AUTHORIZED");
  }
  if (input.presentation === "board" && (!input.table || !input.readOnlyKanban)) {
    throw new Error("EIDOS_CATALOG_BOARD_NOT_AUTHORIZED");
  }
  if (input.table?.presentationViews) {
    const modes=input.table.presentationViews;
    if (!Array.isArray(modes) || modes.length < 2 || modes.length > 3
      || new Set(modes.map(m=>m.id)).size !== modes.length
      || modes.some(m=>!m || !["table","chart","board"].includes(m.id)
        || !m.label?.trim() || !isLocalCatalogRoute(m.route)
        || (m.selected !== undefined && typeof m.selected !== "boolean"))
      || modes.filter(m=>m.selected).length !== 1
      || (input.presentation && !modes.some(m=>m.id===input.presentation && m.selected))) {
      throw new Error("EIDOS_CATALOG_PRESENTATION_VIEWS_INVALID");
    }
  }
  if (input.readOnlyKanban) {
    const board=input.readOnlyKanban;
    if (board.contractVersion!=="0.1.0" || board.kind!=="read-only-kanban"
      || board.scope!=="AUTHORIZED_CURRENT_PAGE"
      || !board.title?.trim() || board.title.length>100
      || !board.scopeLabel?.trim() || board.scopeLabel.length>160
      || !board.emptyLabel?.trim() || board.emptyLabel.length>100
      || !/^[a-zA-Z0-9._:-]{1,80}$/.test(board.groupFieldId??"")
      || !Array.isArray(board.groups) || board.groups.length<1 || board.groups.length>8
      || !input.table || input.table.rows.length!==input.items.length
      || input.items.length>100) throw new Error("EIDOS_CATALOG_BOARD_INVALID");
    const ids=new Set(input.items.map(item=>item.id));
    const seen=new Set<string>();
    const groups=new Set<string>();
    for(const group of board.groups) {
      if(!group || !/^[a-zA-Z0-9._:-]{1,80}$/.test(group.id??"")
        || groups.has(group.id) || !group.label?.trim()
        || group.label.length>100 || !Array.isArray(group.itemIds)) {
        throw new Error("EIDOS_CATALOG_BOARD_GROUP_INVALID");
      }
      groups.add(group.id);
      for(const id of group.itemIds) {
        if(typeof id!=="string" || !ids.has(id) || seen.has(id)) {
          throw new Error("EIDOS_CATALOG_BOARD_ITEM_INVALID");
        }
        seen.add(id);
      }
    }
    if(seen.size!==ids.size) throw new Error("EIDOS_CATALOG_BOARD_PARTITION_INVALID");
  }
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
  if (input.table) {
    // Eidos PR #209: views are navigation only; Host/domain owns authorization.
    if (input.table.views) {
      const views = input.table.views;
      if (!Array.isArray(views) || views.length > 12) {
        throw new Error("EIDOS_CATALOG_TABLE_VIEWS_INVALID");
      }
      const ids = new Set<string>();
      let selectedCount = 0;
      for (const view of views) {
        if (!view.id?.trim() || !view.label?.trim() || ids.has(view.id)
          || !isLocalCatalogRoute(view.route) || typeof view.selected !== "undefined"
          && typeof view.selected !== "boolean") {
          throw new Error("EIDOS_CATALOG_TABLE_VIEW_INVALID");
        }
        ids.add(view.id);
        if (view.selected === true) selectedCount++;
      }
      if (selectedCount > 1) throw new Error("EIDOS_CATALOG_TABLE_VIEW_SELECTION_INVALID");
    }
    if (input.table.quickFilters !== undefined) {
      const filters = input.table.quickFilters;
      if (!filters || !filters.label?.trim()
        || !Array.isArray(filters.options) || filters.options.length < 2
        || filters.options.length > 8) {
        throw new Error("EIDOS_CATALOG_QUICK_FILTER_INVALID");
      }
      const seen = new Set<string>();
      let selected = 0;
      for (const choice of filters.options) {
        if (!choice || !choice.id?.trim() || !choice.label?.trim()
          || seen.has(choice.id) || !isLocalCatalogRoute(choice.route)
          || (choice.selected !== undefined && typeof choice.selected !== "boolean")) {
          throw new Error("EIDOS_CATALOG_QUICK_FILTER_INVALID");
        }
        seen.add(choice.id);
        if (choice.selected) selected++;
      }
      if (selected !== 1) throw new Error("EIDOS_CATALOG_QUICK_FILTER_SELECTION_INVALID");
    }
    if (input.table.quickFilterGroups !== undefined) {
      const groups = input.table.quickFilterGroups;
      if (input.table.quickFilters !== undefined || !Array.isArray(groups)
        || groups.length < 2 || groups.length > 4) {
        throw new Error("EIDOS_CATALOG_QUICK_FILTER_GROUPS_INVALID");
      }
      const groupIds = new Set<string>();
      for (const group of groups) {
        if (!group || typeof group.id !== "string" || !/^[a-zA-Z0-9_-]{1,40}$/.test(group.id)
          || groupIds.has(group.id) || typeof group.label !== "string"
          || !group.label.trim() || !Array.isArray(group.options)
          || group.options.length < 2 || group.options.length > 8) {
          throw new Error("EIDOS_CATALOG_QUICK_FILTER_GROUP_INVALID");
        }
        groupIds.add(group.id);
        const optionIds = new Set<string>();
        let selected = 0;
        for (const choice of group.options) {
          if (!choice || typeof choice.id !== "string" || !/^[a-zA-Z0-9_-]{1,40}$/.test(choice.id)
            || optionIds.has(choice.id) || typeof choice.label !== "string"
            || !choice.label.trim() || !isLocalCatalogRoute(choice.route)
            || (choice.selected !== undefined && typeof choice.selected !== "boolean")) {
            throw new Error("EIDOS_CATALOG_QUICK_FILTER_GROUP_OPTION_INVALID");
          }
          optionIds.add(choice.id);
          if (choice.selected === true) selected++;
        }
        if (selected !== 1) {
          throw new Error("EIDOS_CATALOG_QUICK_FILTER_GROUP_SELECTION_INVALID");
        }
      }
    }
    if (input.table.search && (!isLocalCatalogRoute(input.table.search.route)
      || !input.table.search.label || !input.table.search.submitLabel)) {
      throw new Error("EIDOS_CATALOG_TABLE_SEARCH_INVALID");
    }
    const columns = input.table.columns;
    const rows = input.table.rows;
    if (!Array.isArray(columns) || !Array.isArray(rows)
      || !columns.length || columns.length > 12) {
      throw new Error("EIDOS_CATALOG_TABLE_INVALID");
    }
    const columnIds = new Set<string>();
    let sortedColumnCount = 0;
    for (const column of columns) {
      if (!column.id?.trim() || !column.label?.trim() || columnIds.has(column.id)
        || (column.sortRoute !== undefined && !isLocalCatalogRoute(column.sortRoute))) {
        throw new Error("EIDOS_CATALOG_TABLE_COLUMN_INVALID");
      }
      if (column.sortDirection !== undefined) {
        if (!column.sortRoute
          || !["ascending", "descending"].includes(column.sortDirection)) {
          throw new Error("EIDOS_CATALOG_TABLE_COLUMN_SORT_INVALID");
        }
        sortedColumnCount++;
      }
      columnIds.add(column.id);
    }
    if (sortedColumnCount > 1) {
      throw new Error("EIDOS_CATALOG_TABLE_SORT_SELECTION_INVALID");
    }
    if (input.table.columnControls !== undefined) {
      const controls = input.table.columnControls;
      if (!controls || !controls.label?.trim()
        || !Array.isArray(controls.options)
        || controls.options.length < columns.length
        || controls.options.length > 12) {
        throw new Error("EIDOS_CATALOG_COLUMN_CONTROLS_INVALID");
      }
      const seen = new Set<string>();
      const visibleIds: string[] = [];
      const validAction = (action: {label:string;route:string} | undefined) =>
        action === undefined || (typeof action.label === "string"
          && action.label.trim().length > 0 && isLocalCatalogRoute(action.route));
      for (const option of controls.options) {
        if (!option || !option.id?.trim() || !option.label?.trim()
          || seen.has(option.id) || typeof option.visible !== "boolean"
          || !validAction(option.toggle) || !validAction(option.moveUp)
          || !validAction(option.moveDown)
          || (!option.visible && (option.moveUp || option.moveDown))) {
          throw new Error("EIDOS_CATALOG_COLUMN_CONTROLS_INVALID");
        }
        seen.add(option.id);
        if (option.visible) visibleIds.push(option.id);
      }
      if (!validAction(controls.reset)
        || visibleIds.length !== columns.length
        || visibleIds.some((id,index) => id !== columns[index].id)) {
        throw new Error("EIDOS_CATALOG_COLUMN_CONTROLS_INVALID");
      }
    }
    const itemIds = new Set(input.items.map(item => item.id));
    const rowIds = new Set<string>();
    for (const row of rows) {
      if (!itemIds.has(row.itemId) || rowIds.has(row.itemId)
        || Object.keys(row.cells).some(key => !columnIds.has(key))) {
        throw new Error("EIDOS_CATALOG_TABLE_ROW_INVALID");
      }
      rowIds.add(row.itemId);
    }
    if (input.table.pageInfo) {
      const page = input.table.pageInfo;
      if (!Number.isSafeInteger(page.page) || page.page < 0
        || !Number.isSafeInteger(page.pageSize) || page.pageSize < 1
        || !Number.isSafeInteger(page.total) || page.total < rows.length
        || [page.previousRoute,page.nextRoute].some(route =>
          route !== undefined && !isLocalCatalogRoute(route))) {
        throw new Error("EIDOS_CATALOG_TABLE_PAGE_INVALID");
      }
    }
  }
  return input;
}

function actionButton(itemId: string | undefined, action: import("./contracts.js").CatalogBrowserActionV010, primary: boolean, isCurrentView = false): string {
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
  return `<span data-eidos-action-wrap><button type="button" data-eidos-catalog-action="${esc(action.id)}" data-eidos-action-type="${esc(action.type)}"${itemId ? ` data-eidos-item-id="${esc(itemId)}"` : ""} data-eidos-confirm="${action.requiresConfirmation === true ? "true" : "false"}" data-eidos-primary="${primary ? "true" : "false"}"${isCurrentView ? ' aria-current="page"' : ""}${command}${inputVersion}${route}${values}${reason}${disabled}>${esc(action.label)}</button>${help}</span>`;
}

export function renderCatalogBrowserToHtml(input: CatalogBrowserV010): string {
  const model = assertCatalog(input);
  const renderedItems = model.items.map(item => {
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
  });
  const items=renderedItems.join("");
  // Each board card reuses the identical, already escaped authorized item.
  // There is no drag target, mutation event, browser grouping or extra READ.
  const itemHtml=new Map(model.items.map((item,i)=>[item.id,renderedItems[i]]));
  const boardHtml=model.presentation==="board" && model.readOnlyKanban
    ? '<section data-eidos-read-only-kanban aria-label="'+esc(model.readOnlyKanban.title)+'">'
      + '<header><h2>'+esc(model.readOnlyKanban.title)+'</h2><p data-eidos-board-scope>'
      + esc(model.readOnlyKanban.scopeLabel)+'</p></header>'
      + '<div data-eidos-board-columns>'+model.readOnlyKanban.groups.map(group=>
        '<section data-eidos-board-column="'+esc(group.id)+'"><h3>'
        +esc(group.label)+'</h3><div data-eidos-board-cards>'
        +(group.itemIds.length
          ? group.itemIds.map(id=>itemHtml.get(id)!).join("")
          : '<p data-eidos-board-empty>'+esc(model.readOnlyKanban!.emptyLabel)+'</p>')
        +'</div></section>').join("")+'</div></section>' : "";

  // The semantic table and narrow-screen cards share the same authorized page.
  const table = model.table ? (() => {
    const records = new Map(model.items.map(item => [item.id, item]));
    const heads = model.table!.columns.map(column =>
      `<th scope="col"${column.sortDirection ? ` aria-sort="${column.sortDirection}"` : ""}>${column.sortRoute
        ? actionButton(undefined as never, {
            id: "sort-" + column.id, label: column.label,
            type: "navigate", route: column.sortRoute
          }, false) + (column.sortDirection
            ? `<span data-eidos-sort-indicator aria-hidden="true">${column.sortDirection === "ascending" ? "↑" : "↓"}</span>`
            : "")
        : esc(column.label)}</th>`
    ).join("");
    const rows = model.table!.rows.map(row => {
      const item = records.get(row.itemId);
      if (!item) throw new Error("EIDOS_CATALOG_TABLE_ROW_INVALID");
      const cells = model.table!.columns.map((column, i) => {
        const value = row.cells[column.id];
        const visible = value === undefined || value === null ? "—" : String(value);
        const detail = i === 0 && item.primaryAction?.type === "navigate"
          ? actionButton(item.id, {
              ...item.primaryAction, label: visible
            }, true)
          : esc(visible);
        return `<td data-eidos-col="${esc(column.id)}">${detail}</td>`;
      }).join("");
      return `<tr data-eidos-table-row="${esc(row.itemId)}">${cells}</tr>`;
    }).join("");
    return `<div data-eidos-catalog-table-wrap><table data-eidos-catalog-table><thead><tr>${heads}</tr></thead><tbody>${rows}</tbody></table></div>`;
  })() : "";
  // At <=700px the semantic table header is hidden in favor of Item cards.
  // Keep those same Owner-authorized sort routes keyboard/touch accessible.
  // No browser-side sort, secondary data source or business-specific UI.
  const mobileSort = model.table?.columns.some(column => column.sortRoute)
    ? `<nav data-eidos-catalog-mobile-sort aria-label="Sort">${model.table.columns
        .filter(column => column.sortRoute)
        .map(column => actionButton(undefined, {
          id: "mobile-sort-" + column.id,
          label: column.label + (column.sortDirection
            ? (column.sortDirection === "ascending" ? " ↑" : " ↓")
            : " ↕"),
          type: "navigate", route: column.sortRoute!
        }, false, !!column.sortDirection)).join("")}</nav>`
    : "";
  const pagination = model.table?.pageInfo ? (() => {
    const page = model.table!.pageInfo!;
    const previous = page.previousRoute
      ? actionButton(undefined as never, { id: "previous-page", label: page.previousLabel,
          type: "navigate", route: page.previousRoute }, false)
      : "";
    const next = page.nextRoute
      ? actionButton(undefined as never, { id: "next-page", label: page.nextLabel,
          type: "navigate", route: page.nextRoute }, false)
      : "";
    return `<nav data-eidos-catalog-pagination aria-label="Pagination"><span data-eidos-page-summary>${esc(page.summary)}</span><div>${previous}${next}</div></nav>`;
  })() : "";

  const viewNavigation = model.table?.views?.length
    ? `<nav data-eidos-catalog-view-navigation aria-label="Views">${model.table.views.map(view =>
        `<span data-eidos-catalog-view-id="${esc(view.id)}" data-eidos-catalog-view-selected="${view.selected === true ? "true" : "false"}">${actionButton(undefined, {
          id: "select-view-" + view.id,
          label: view.label,
          type: "navigate",
          route: view.route
        }, false, view.selected === true)}</span>`
      ).join("")}</nav>`
    : "";

  const presentationNavigation = model.table?.presentationViews?.length
    ? `<nav data-eidos-catalog-presentation-navigation aria-label="Display modes">${model.table.presentationViews.map(view =>
        `<span data-eidos-catalog-presentation-id="${esc(view.id)}" data-eidos-catalog-presentation-selected="${view.selected===true?"true":"false"}">${actionButton(undefined,{
          id:"presentation-"+view.id,label:view.label,
          type:"navigate",route:view.route
        },false,view.selected===true)}</span>`
      ).join("")}</nav>` : "";

  // Current Domain Owner supplies all routes; Eidos does not persist layout.
  const columnControls = model.table?.columnControls ? (() => {
    const controls = model.table!.columnControls!;
    const controlAction = (id: string, verb: string, action?: {label:string;route:string}) =>
      action ? actionButton(undefined, {
        id: "column-" + verb + "-" + id, label: action.label,
        type: "navigate", route: action.route
      }, false) : "";
    const options = controls.options.map(option =>
      `<div data-eidos-column-choice="${esc(option.id)}" data-eidos-column-visible="${option.visible ? "true" : "false"}"><span>${esc(option.label)}</span><span>${controlAction(option.id, "toggle", option.toggle)}${controlAction(option.id, "up", option.moveUp)}${controlAction(option.id, "down", option.moveDown)}</span></div>`
    ).join("");
    return `<details data-eidos-catalog-column-controls><summary>${esc(controls.label)}</summary><div data-eidos-catalog-column-options>${options}</div>${controlAction("reset", "reset", controls.reset)}</details>`;
  })() : "";

  // Eidos renders only navigation to Owner re-queries, never filters local rows.
  const quickFilters = model.table?.quickFilters ? (() => {
    const filters = model.table!.quickFilters!;
    return `<nav data-eidos-catalog-quick-filters aria-label="${esc(filters.label)}"><span>${esc(filters.label)}</span>${filters.options.map(choice =>
      `<span data-eidos-quick-filter-id="${esc(choice.id)}" data-eidos-quick-filter-selected="${choice.selected === true ? "true" : "false"}">${actionButton(undefined,{
        id:"quick-filter-" + choice.id,label:choice.label,type:"navigate",
        route:choice.route
      },false,choice.selected === true)}</span>`
    ).join("")}</nav>`;
  })() : "";

  const quickFilterGroups = model.table?.quickFilterGroups?.map(group =>
    `<nav data-eidos-catalog-quick-filters data-eidos-quick-filter-group="${esc(group.id)}" aria-label="${esc(group.label)}"><span>${esc(group.label)}</span>${group.options.map(choice =>
      `<span data-eidos-quick-filter-id="${esc(choice.id)}" data-eidos-quick-filter-selected="${choice.selected === true ? "true" : "false"}">${actionButton(undefined, {
        id:"quick-filter-" + group.id + "-" + choice.id,
        label:choice.label,type:"navigate",route:choice.route
      },false,choice.selected === true)}</span>`
    ).join("")}</nav>`
  ).join("") ?? "";

  const serverSearch = model.table?.search ? `<form data-eidos-catalog-server-search data-eidos-search-route="${esc(model.table.search.route)}" role="search"><label><span data-eidos-catalog-search-label>${esc(model.table.search.label)}</span> <input type="search" name="search" value="${esc(model.table.search.value ?? "")}" maxlength="120" placeholder="${esc(model.table.search.placeholder)}"></label><button type="submit">${esc(model.table.search.submitLabel)}</button></form>` : "";
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

  return `<section data-eidos-capability="catalog-browser" data-eidos-id="${esc(model.id)}" data-eidos-catalog-layout="${esc(model.layout ?? "grid")}" data-eidos-catalog-density="${esc(model.density ?? "comfortable")}" data-eidos-catalog-has-table="${model.table ? "true" : "false"}">
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
${viewNavigation}
${presentationNavigation}
${model.presentation==="chart" && model.authorizedChart
  ? renderAuthorizedAggregateBarsToHtmlV010(model.authorizedChart)
  : (!model.presentation && model.authorizedChart
    ? renderAuthorizedAggregateBarsToHtmlV010(model.authorizedChart) : "")}
${serverSearch || (columnControls && (model.presentation==="table" || !model.presentation))
  ? `<div data-eidos-catalog-table-toolbar>${serverSearch}${model.presentation==="table"||!model.presentation ? columnControls : ""}</div>`
  : ""}
${quickFilters}
${quickFilterGroups}
${mobileSort}
${model.presentation==="table"||!model.presentation ? table : ""}
${boardHtml}
${model.collectionTitle
  ? `<div data-eidos-collection-heading><div><h2>${esc(model.collectionTitle)}</h2>${model.collectionDescription ? `<p>${esc(model.collectionDescription)}</p>` : ""}</div></div>`
  : ""}
${model.presentation==="board"||model.presentation==="chart" ? ""
  : `<div data-eidos-catalog-items>${items || `<p data-eidos-empty>${esc(model.emptyMessage ?? "No items")}</p>`}</div>`}
${noResults}
${model.presentation==="chart"?"":pagination}
</section>`;
}
