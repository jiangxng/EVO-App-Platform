import type { BusinessDictionarySnapshotV010 } from "../../contracts/reference-data/dictionary.js";
import { queryBusinessDictionaryCollectionV010 } from "./collection-query.js";
import {
  businessDictionaryDirectoryQueryRouteV010,
  parseBusinessDictionaryDirectoryRouteV010,
  type BusinessDictionaryDirectorySelectionV010
} from "./directory-query.js";
import type { CatalogBrowserV010 } from "../../vendor/eidos/src/catalog-browser/contracts.js";
export { parseBusinessDictionaryDirectoryRouteV010 } from "./directory-query.js";
import type { UidlFormV011 } from "../../vendor/eidos/src/runtime/contracts.js";
import {
  BUSINESS_DICTIONARY_DETAIL_ROUTE_V010 as DETAIL,
  BUSINESS_DICTIONARY_DIRECTORY_ROUTE_V010 as DIRECTORY,
  BUSINESS_DICTIONARY_OPTION_ROUTE_V010 as OPTION,
  BUSINESS_DICTIONARY_OPTION_SAVE_COMMAND_V010 as SAVE,
  BUSINESS_DICTIONARY_PAGE_CSV_EXPORT_COMMAND_V010 as PAGE_CSV_EXPORT,
  BUSINESS_DICTIONARY_PUBLISH_COMMAND_V010 as PUBLISH
} from "./constants.js";

function labels(locale?: string) {
  return locale?.toLowerCase().startsWith("zh") ? {
    list: "业务字典", listHelp: "维护当前企业可复用的业务选项。保存草稿后，仍需发布才能供业务字段引用。",
    empty: "当前企业还没有业务字典。", create: "新建字典", detail: "字典项",
    exportCurrentPage: "导出当前页 CSV",
    add: "新增字典项", edit: "编辑字典项", save: "保存草稿", publish: "发布字典",
    name: "字典名称", id: "字典编码", code: "选项编码", label: "选项名称",
    labelZh: "简体中文名称（可选）", aliases: "来源别名（用逗号分隔）", status: "状态", active: "启用", inactive: "停用",
    draft: "草稿", published: "已发布", version: "版本", effective: "生效版本",
    noEnterprise: "请先选择企业", noEnterpriseHelp: "业务字典保存在所选企业的内容库中。",
    selectEnterprise: "选择企业", optionHelp: "选项编码用于业务引用，保存后不随名称改变。别名只用于明确匹配源数据。",
    publishHelp: "发布后，当前版本才能供基础对象字段引用。"
  } : {
    list: "Business dictionaries", listHelp: "Maintain business options for this enterprise. Publish a saved draft before fields can reference it.",
    empty: "No business dictionaries in this enterprise.", create: "New dictionary", detail: "Options",
    exportCurrentPage: "Export current page CSV",
    add: "Add option", edit: "Edit option", save: "Save draft", publish: "Publish dictionary",
    name: "Dictionary name", id: "Dictionary code", code: "Option code", label: "Option name",
    labelZh: "Simplified Chinese name (optional)", aliases: "Source aliases (comma-separated)", status: "Status", active: "Active", inactive: "Inactive",
    draft: "Draft", published: "Published", version: "Version", effective: "Effective version",
    noEnterprise: "Select an enterprise", noEnterpriseHelp: "Business dictionaries are stored in the selected enterprise's content library.",
    selectEnterprise: "Select enterprise", optionHelp: "Option codes remain stable when names change. Aliases only match explicit source values.",
    publishHelp: "Only a published version can be referenced by business fields."
  };
}

export function businessDictionaryDetailRouteV010(
  dictionaryId: string, returnTo?: string
): string {
  const params = new URLSearchParams({dictionaryId});
  if (returnTo) {
    parseBusinessDictionaryDirectoryRouteV010(returnTo);
    params.set("returnTo", returnTo);
  }
  return DETAIL + "?" + params.toString();
}

export function businessDictionaryOptionRouteV010(dictionaryId?: string, code?: string): string {
  const params = new URLSearchParams();
  if (dictionaryId) params.set("dictionaryId", dictionaryId);
  if (code) params.set("code", code);
  return OPTION + (params.size ? "?" + params.toString() : "");
}

export function parseBusinessDictionaryRouteV010(route: string | undefined,
  kind: "detail" | "option"): { dictionaryId?: string; code?: string; returnTo?: string } | undefined {
  if (!route || route.length > (kind === "detail" && route.includes("returnTo=") ? 2400 : 700)
      || !route.startsWith("/") || route.startsWith("//")
      || route.includes("#") || route.includes("\\")) return undefined;
  const url = new URL(route, "https://evo.invalid");
  if (url.pathname !== (kind === "detail" ? DETAIL : OPTION)) return undefined;
  if ([...url.searchParams.keys()].some(key =>
    key !== "dictionaryId" && key !== "code"
    && !(kind === "detail" && key === "returnTo"))) return undefined;
  if (url.searchParams.getAll("dictionaryId").length > 1
      || url.searchParams.getAll("code").length > 1
      || url.searchParams.getAll("returnTo").length > 1) return undefined;
  const dictionaryId = url.searchParams.get("dictionaryId")?.trim();
  const code = url.searchParams.get("code")?.trim();
  const returnTo = url.searchParams.get("returnTo") ?? undefined;
  if (kind === "detail" && (!dictionaryId || code)) return undefined;
  if (code && !dictionaryId) return undefined;
  if ((dictionaryId?.length ?? 0) > 200 || (code?.length ?? 0) > 100) return undefined;
  if (returnTo !== undefined) {
    if (!returnTo.trim()) return undefined;
    try { parseBusinessDictionaryDirectoryRouteV010(returnTo); }
    catch { return undefined; }
  }
  return {
    ...(dictionaryId ? { dictionaryId } : {}),
    ...(code ? { code } : {}),
    ...(returnTo ? { returnTo } : {})
  };
}

export function createBusinessDictionaryContextRequiredPageV010(locale?: string): CatalogBrowserV010 {
  const t = labels(locale);
  return { contractVersion: "0.1.0", kind: "catalog-browser", layout: "list",
    id: "evo-business-dictionary.context-required", title: t.noEnterprise,
    description: t.noEnterpriseHelp, items: [], actions: [{ id: "select-enterprise",
      label: t.selectEnterprise, type: "navigate", route: "/enterprise-contexts",
      requiresConfirmation: false, primary: true }] };
}

export function createBusinessDictionaryDirectoryPageV010(input: {
  dictionaries: readonly BusinessDictionarySnapshotV010[];
  effectiveVersions?: Readonly<Record<string, number>>;
  canManage: boolean; locale?: string;
  /** Provided only after the Host has checked the active enterprise membership. */
  directorySelection?: BusinessDictionaryDirectorySelectionV010;
  /**
   * Optional PERSONAL views already filtered by the trusted Host Saved View
   * READ capability for this principal, active enterprise and live owner
   * Collection. Never read this array from request/URL/model input.
   */
  authorizedPersonalViews?: readonly {
    viewId: string;
    title: string;
    collectionId: string;
    schemaRef: string;
    query: {
      view?: string;
      search?: string;
      sort?: string;
      direction?: "asc" | "desc";
    };
    columns: readonly string[];
  }[];
  /** Optional Host cross-check. Selection hint from URL is NOT authorization. */
  selectedPersonalViewId?: string;
}): CatalogBrowserV010 {
  const t = labels(input.locale);
  const selection = input.directorySelection;
  const result = selection ? queryBusinessDictionaryCollectionV010({
    dictionaries: input.dictionaries,
    query: {...selection.query, view: selection.view}
  }) : undefined;
  const byId = new Map(input.dictionaries.map(dictionary =>
    [dictionary.dictionaryId, dictionary]));
  const visible = result ? result.rows.map(row => {
    const dictionary = byId.get(row.rowId);
    if (!dictionary) throw new Error("BUSINESS_DICTIONARY_COLLECTION_ROW_INVALID");
    return dictionary;
  }) : input.dictionaries;
  const query = selection?.query ?? {};
  const pageInfo = result?.pageInfo;
  const start = pageInfo ? pageInfo.page * pageInfo.pageSize : 0;
  const viewSelection = (view: "all" | "draft" | "published") =>
    ({view, query: {...query}});
  const savedViews = pageInfo && result && selection
    ? (input.authorizedPersonalViews ?? []).flatMap(saved => {
        // Presentation is never an authorization step. These exact checks
        // defend the owner result from stale schema, hidden columns, invalid
        // query routes and accidental untrusted Host wiring.
        if(!saved || !saved.query || typeof saved.query!=="object" ||
           Object.keys(saved.query).some(k=>!["view","search","sort","direction"].includes(k)) ||
           saved.collectionId !== result.collectionId ||
           saved.schemaRef !== result.schemaRef ||
           !/^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,79}$/.test(saved.viewId) ||
           !saved.title?.trim() || saved.title.length > 120 ||
           !Array.isArray(saved.columns) || saved.columns.length === 0 ||
           saved.columns.length > 20 ||
           saved.columns.some(c=>!result.readableFieldIds.includes(c) ||
             !["displayName","dictionaryId","state","version","optionCount"].includes(c)) ||
           new Set(saved.columns).size !== saved.columns.length)
          return [];
        try {
          const v = saved.query.view ?? "all";
          if(v !== "all" && v !== "draft" && v !== "published")
            return [];
          const selected: BusinessDictionaryDirectorySelectionV010 = {view: v,
            personalViewId: saved.viewId, query: {
            ...(saved.query.search ? {search:saved.query.search} : {}),
            ...(saved.query.sort ? {sort:saved.query.sort} : {}),
            ...(saved.query.direction ? {direction:saved.query.direction} : {}),
            pageSize:selection.query.pageSize
          }};
          const route = businessDictionaryDirectoryQueryRouteV010(selected,0);
          // Owner's allowlisted route parser, never construct arbitrary links.
          if(route.length > 650) return [];
          const parsed = parseBusinessDictionaryDirectoryRouteV010(route);
          if(parsed.view !== v) return [];
          return [{id:"personal:"+saved.viewId,label:saved.title.trim(),route,
            columns:[...saved.columns],
            selected:selection.personalViewId===saved.viewId &&
              (input.selectedPersonalViewId===undefined ||
                input.selectedPersonalViewId===saved.viewId) &&
              selection.view===parsed.view}];
        } catch {return [];}
      })
    : [];
  // A forged/stale personalViewId is never carried into new links when the
  // Host did not return that authorized view. The only effect of the URL hint
  // is selection after current Authorization + Domain Owner validation.
  const personalSelected = savedViews.some(view=>view.selected);
  // Only a currently Host-authorized and owner/schema-validated personal
  // selection may change the visible column set or order. System and legacy
  // views always retain their original table shape.
  const personalColumns = savedViews.find(view=>view.selected)?.columns;
  const effectiveSelection: BusinessDictionaryDirectorySelectionV010 = personalSelected
    ? selection!
    : {view: selection?.view ?? "all",query: selection?.query ?? {}};
  const baseColumns: NonNullable<CatalogBrowserV010["table"]>["columns"] = [
      {id:"displayName",label:t.name,sortRoute:businessDictionaryDirectoryQueryRouteV010(
        {...effectiveSelection,query:{...query,sort:"displayName",
          direction:query.sort === "displayName" && query.direction !== "desc"
            ? "desc" : "asc"}})},
      {id:"dictionaryId",label:t.id,sortRoute:businessDictionaryDirectoryQueryRouteV010(
        {...effectiveSelection,query:{...query,sort:"dictionaryId",
          direction:query.sort === "dictionaryId" && query.direction !== "desc"
            ? "desc" : "asc"}})},
      {id:"state",label:t.status,sortRoute:businessDictionaryDirectoryQueryRouteV010(
        {...effectiveSelection,query:{...query,sort:"state",
          direction:query.sort === "state" && query.direction !== "desc"
            ? "desc" : "asc"}})},
      {id:"version",label:t.version,sortRoute:businessDictionaryDirectoryQueryRouteV010(
        {...effectiveSelection,query:{...query,sort:"version",
          direction:query.sort === "version" && query.direction !== "desc"
            ? "desc" : "asc"}})},
      {id:"optionCount",label:t.detail}
    ];
  const table: CatalogBrowserV010["table"] | undefined = pageInfo && result && selection ? {
    columns: personalColumns
      ? personalColumns.flatMap(id => baseColumns.filter(column=>column.id===id))
      : baseColumns,
    views: [
      {id:"all",label:(input.locale ?? "").startsWith("zh") ? "全部" : "All",
        route:businessDictionaryDirectoryQueryRouteV010(viewSelection("all")),
        selected:selection.view === "all" && !personalSelected},
      {id:"draft",label:t.draft,
        route:businessDictionaryDirectoryQueryRouteV010(viewSelection("draft")),
        selected:selection.view === "draft" && !personalSelected},
      {id:"published",label:t.published,
        route:businessDictionaryDirectoryQueryRouteV010(viewSelection("published")),
        selected:selection.view === "published" && !personalSelected},
      ...savedViews.map(({columns: _columns,...navigation})=>navigation)
    ],
    search: {
      route:businessDictionaryDirectoryQueryRouteV010(effectiveSelection),
      label:t.list, placeholder:t.list, value:query.search ?? "",
      submitLabel:(input.locale ?? "").startsWith("zh") ? "搜索" : "Search"
    },
    rows: result.rows.map(row => {
      const cells = {
        displayName:row.cells.displayName,
        dictionaryId:row.cells.dictionaryId,
        state:row.cells.state === "DRAFT" ? t.draft : t.published,
        version:row.cells.version,
        optionCount:row.cells.optionCount
      };
      return {itemId:row.rowId,
        cells:personalColumns
          ? Object.fromEntries(personalColumns.map(id =>
              [id,cells[id as keyof typeof cells]]))
          : cells};
    }),
    pageInfo:{
      page:pageInfo.page,pageSize:pageInfo.pageSize,total:pageInfo.total,
      summary:`${pageInfo.total === 0 ? 0 : start + 1}–${Math.min(
        start + visible.length,pageInfo.total)} / ${pageInfo.total}`,
      previousLabel:(input.locale ?? "").startsWith("zh") ? "上一页" : "Previous",
      nextLabel:(input.locale ?? "").startsWith("zh") ? "下一页" : "Next",
      ...(pageInfo.page > 0 ? {previousRoute:businessDictionaryDirectoryQueryRouteV010(
        effectiveSelection,pageInfo.page - 1)} : {}),
      ...(pageInfo.hasMore ? {nextRoute:businessDictionaryDirectoryQueryRouteV010(
        effectiveSelection,pageInfo.page + 1)} : {})
    }
  } : undefined;
  // Use the same server-owner page and visible column selection as the table.
  // Never infer an export permission from the URL or export unseen pages.
  const pageExportValues = table && pageInfo && selection ? {
    view: effectiveSelection.view,
    ...(query.search ? { search: query.search } : {}),
    ...(query.sort ? { sort: query.sort } : {}),
    ...(query.direction ? { direction: query.direction } : {}),
    page: pageInfo.page, pageSize: pageInfo.pageSize,
    fieldIds: table.columns.map(column => column.id)
  } : undefined;
  return { contractVersion: "0.1.0", kind: "catalog-browser", layout: "list", density: "compact",
    itemActivation: "primary-action", id: "evo-business-dictionary.directory",
    title: t.list, description: t.listHelp,
    actions: [
      ...(pageExportValues ? [{
        id: "export-current-page", label: t.exportCurrentPage,
        type: "command" as const, command: PAGE_CSV_EXPORT,
        inputVersion: "0.1.0", requiresConfirmation: false,
        values: pageExportValues
      }] : []),
      ...(input.canManage ? [{ id: "create", label: t.create, type: "navigate" as const,
        route: OPTION, requiresConfirmation: false, primary: true }] : [])
    ],
    ...(table ? {table} : {}),
    ...(table ? {} : {search: { placeholder: t.list, ariaLabel: t.list,
      noResultsMessage: t.empty }}),
    emptyMessage: t.empty,
    items: visible.map(dictionary => ({
      id: dictionary.dictionaryId,
      title: dictionary.displayName || dictionary.dictionaryId,
      summary: `${t.detail}: ${dictionary.options.length}`,
      status: { label: dictionary.state === "DRAFT" ? t.draft : t.published,
        tone: dictionary.state === "DRAFT" ? "warning" as const : "positive" as const },
      metadata: { [t.id]: dictionary.dictionaryId, [t.version]: dictionary.version,
        ...(input.effectiveVersions?.[dictionary.dictionaryId]
          ? { [t.effective]: input.effectiveVersions[dictionary.dictionaryId] } : {}) },
      primaryAction: { id: "view", label: t.detail, type: "navigate" as const,
        route: businessDictionaryDetailRouteV010(
          dictionary.dictionaryId,
          selection && pageInfo
            ? businessDictionaryDirectoryQueryRouteV010(effectiveSelection, pageInfo.page)
            : undefined),
        requiresConfirmation: false }
    })) };
}

export function createBusinessDictionaryDetailPageV010(input: {
  dictionary: BusinessDictionarySnapshotV010;
  effectiveVersion?: number; canManage: boolean; locale?: string; returnTo?: string;
}): CatalogBrowserV010 {
  const t = labels(input.locale);
  const dictionary = input.dictionary;
  return { contractVersion: "0.1.0", kind: "catalog-browser", layout: "list", density: "compact",
    itemActivation: input.canManage ? "primary-action" : undefined,
    id: "evo-business-dictionary.detail", title: dictionary.displayName || dictionary.dictionaryId,
    description: dictionary.state === "DRAFT" ? t.publishHelp : t.optionHelp,
    contextNavigation: { items: [{ id: "dictionaries", label: t.list,
      route: input.returnTo ?? DIRECTORY },
      { id: "dictionary", label: dictionary.displayName || dictionary.dictionaryId }] },
    actions: input.canManage ? [{ id: "add-option", label: t.add, type: "navigate",
      route: businessDictionaryOptionRouteV010(dictionary.dictionaryId), requiresConfirmation: false,
      primary: dictionary.state !== "DRAFT" },
      ...(dictionary.state === "DRAFT" ? [{ id: "publish", label: t.publish,
        type: "command" as const, command: PUBLISH, inputVersion: "0.1.0",
        requiresConfirmation: true, primary: true,
        values: { dictionaryId: dictionary.dictionaryId, expectedVersion: dictionary.version } }] : [])] : [],
    collectionTitle: t.detail,
    items: dictionary.options.map(option => ({
      id: option.code, title: option.label.translations?.[input.locale || ""] || option.label.default,
      summary: option.aliases?.length ? `${t.aliases}: ${option.aliases.join("、")}` : undefined,
      status: { label: option.status === "ACTIVE" ? t.active : t.inactive,
        tone: option.status === "ACTIVE" ? "positive" as const : "neutral" as const },
      metadata: { [t.code]: option.code, [t.version]: dictionary.version,
        ...(input.effectiveVersion ? { [t.effective]: input.effectiveVersion } : {}) },
      ...(input.canManage ? { primaryAction: { id: "edit", label: t.edit,
        type: "navigate" as const, route: businessDictionaryOptionRouteV010(dictionary.dictionaryId, option.code),
        requiresConfirmation: false } } : {})
    })) };
}

export function createBusinessDictionaryOptionPageV010(input: {
  dictionary?: BusinessDictionarySnapshotV010;
  code?: string; locale?: string;
}): UidlFormV011 {
  const t = labels(input.locale);
  const dictionary = input.dictionary;
  const option = input.code ? dictionary?.options.find(item => item.code === input.code) : undefined;
  const title = option ? `${t.edit} · ${option.code}` : dictionary ? t.add : t.create;
  return { contractVersion: "0.1.1", kind: "form", id: "evo-business-dictionary.option",
    title, description: t.optionHelp, purpose: "execute-command",
    contextNavigation: { items: [{ id: "dictionaries", label: t.list, route: DIRECTORY },
      ...(dictionary ? [{ id: "dictionary", label: dictionary.displayName || dictionary.dictionaryId,
        route: businessDictionaryDetailRouteV010(dictionary.dictionaryId) }] : []),
      { id: "option", label: title }] },
    command: { code: SAVE, inputVersion: "0.1.0" },
    fields: [{ key: "displayName", label: t.name, semanticType: "business-dictionary.name",
      control: "text", required: true, ...(dictionary?.displayName ? { initialValue: dictionary.displayName } : {}) },
    { key: "dictionaryId", label: t.id, semanticType: "business-dictionary.code",
      control: "text", required: true, ...(dictionary ? { initialValue: dictionary.dictionaryId, hidden: true } : {}) },
    { key: "expectedVersion", label: t.version, semanticType: "business-dictionary.version",
      control: "number", required: true, hidden: true, initialValue: dictionary?.version ?? 0 },
    ...(option ? [{ key: "originalCode", label: t.code, semanticType: "business-dictionary.option-code",
      control: "text" as const, required: false, hidden: true, initialValue: option.code }] : []),
    { key: "optionCode", label: t.code, semanticType: "business-dictionary.option-code",
      control: "text", required: true, ...(option ? { initialValue: option.code, hidden: true } : {}) },
    { key: "optionLabel", label: t.label, semanticType: "business-dictionary.option-label",
      control: "text", required: true, ...(option ? { initialValue: option.label.default } : {}) },
    { key: "optionLabelZh", label: t.labelZh, semanticType: "business-dictionary.option-label-zh",
      control: "text", required: false,
      ...(option?.label.translations?.["zh-CN"]
        ? { initialValue: option.label.translations["zh-CN"] } : {}) },
    { key: "optionAliases", label: t.aliases, semanticType: "business-dictionary.option-aliases",
      control: "text", required: false, ...(option?.aliases?.length ? { initialValue: option.aliases.join("，") } : {}) },
    { key: "optionStatus", label: t.status, semanticType: "business-dictionary.option-status",
      control: "select", required: true, initialValue: option?.status ?? "ACTIVE",
      options: [{ value: "ACTIVE", label: t.active }, { value: "INACTIVE", label: t.inactive }] }],
    actions: [{ id: "save-option", label: t.save, type: "submit", command: SAVE,
      requiresConfirmation: false }],
    metadata: { packageId: "evo-business-dictionary", description: t.optionHelp } };
}
