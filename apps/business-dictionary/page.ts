import type { BusinessDictionarySnapshotV010 } from "../../contracts/reference-data/dictionary.js";
import { queryBusinessDictionaryCollectionV010 } from "./collection-query.js";
import {
  businessDictionaryDirectoryQueryRouteV010,
  type BusinessDictionaryDirectorySelectionV010
} from "./directory-query.js";
import type { CatalogBrowserV010 } from "../../vendor/eidos/src/catalog-browser/contracts.js";
import type { UidlFormV011 } from "../../vendor/eidos/src/runtime/contracts.js";
import {
  BUSINESS_DICTIONARY_DETAIL_ROUTE_V010 as DETAIL,
  BUSINESS_DICTIONARY_DIRECTORY_ROUTE_V010 as DIRECTORY,
  BUSINESS_DICTIONARY_OPTION_ROUTE_V010 as OPTION,
  BUSINESS_DICTIONARY_OPTION_SAVE_COMMAND_V010 as SAVE,
  BUSINESS_DICTIONARY_PUBLISH_COMMAND_V010 as PUBLISH
} from "./constants.js";

function labels(locale?: string) {
  return locale?.toLowerCase().startsWith("zh") ? {
    list: "业务字典", listHelp: "维护当前企业可复用的业务选项。保存草稿后，仍需发布才能供业务字段引用。",
    empty: "当前企业还没有业务字典。", create: "新建字典", detail: "字典项",
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
    add: "Add option", edit: "Edit option", save: "Save draft", publish: "Publish dictionary",
    name: "Dictionary name", id: "Dictionary code", code: "Option code", label: "Option name",
    labelZh: "Simplified Chinese name (optional)", aliases: "Source aliases (comma-separated)", status: "Status", active: "Active", inactive: "Inactive",
    draft: "Draft", published: "Published", version: "Version", effective: "Effective version",
    noEnterprise: "Select an enterprise", noEnterpriseHelp: "Business dictionaries are stored in the selected enterprise's content library.",
    selectEnterprise: "Select enterprise", optionHelp: "Option codes remain stable when names change. Aliases only match explicit source values.",
    publishHelp: "Only a published version can be referenced by business fields."
  };
}

export function businessDictionaryDetailRouteV010(dictionaryId: string): string {
  return DETAIL + "?dictionaryId=" + encodeURIComponent(dictionaryId);
}

export function businessDictionaryOptionRouteV010(dictionaryId?: string, code?: string): string {
  const params = new URLSearchParams();
  if (dictionaryId) params.set("dictionaryId", dictionaryId);
  if (code) params.set("code", code);
  return OPTION + (params.size ? "?" + params.toString() : "");
}

export function parseBusinessDictionaryRouteV010(route: string | undefined,
  kind: "detail" | "option"): { dictionaryId?: string; code?: string } | undefined {
  if (!route || route.length > 700 || !route.startsWith("/")) return undefined;
  const url = new URL(route, "https://evo.invalid");
  if (url.pathname !== (kind === "detail" ? DETAIL : OPTION)) return undefined;
  if ([...url.searchParams.keys()].some(key => key !== "dictionaryId" && key !== "code")) return undefined;
  if (url.searchParams.getAll("dictionaryId").length > 1 || url.searchParams.getAll("code").length > 1) return undefined;
  const dictionaryId = url.searchParams.get("dictionaryId")?.trim();
  const code = url.searchParams.get("code")?.trim();
  if (kind === "detail" && (!dictionaryId || code)) return undefined;
  if (code && !dictionaryId) return undefined;
  if ((dictionaryId?.length ?? 0) > 200 || (code?.length ?? 0) > 100) return undefined;
  return { ...(dictionaryId ? { dictionaryId } : {}), ...(code ? { code } : {}) };
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
}): CatalogBrowserV010 {
  const t = labels(input.locale);
  const selection = input.directorySelection;
  const scoped = selection
    ? input.dictionaries.filter(dictionary =>
        selection.view === "all"
        || (selection.view === "draft" && dictionary.state === "DRAFT")
        || (selection.view === "published" && dictionary.state === "PUBLISHED"))
    : input.dictionaries;
  const result = selection ? queryBusinessDictionaryCollectionV010({
    dictionaries: scoped, query: {...selection.query}
  }) : undefined;
  const byId = new Map(scoped.map(dictionary => [dictionary.dictionaryId, dictionary]));
  const visible = result ? result.rows.map(row => {
    const dictionary = byId.get(row.rowId);
    if (!dictionary) throw new Error("BUSINESS_DICTIONARY_COLLECTION_ROW_INVALID");
    return dictionary;
  }) : scoped;
  const query = selection?.query ?? {};
  const pageInfo = result?.pageInfo;
  const start = pageInfo ? pageInfo.page * pageInfo.pageSize : 0;
  const viewSelection = (view: "all" | "draft" | "published") =>
    ({view, query: {...query}});
  const table: CatalogBrowserV010["table"] | undefined = pageInfo && result && selection ? {
    columns: [
      {id:"displayName",label:t.name,sortRoute:businessDictionaryDirectoryQueryRouteV010(
        {view:selection.view,query:{...query,sort:"displayName",
          direction:query.sort === "displayName" && query.direction !== "desc"
            ? "desc" : "asc"}})},
      {id:"dictionaryId",label:t.id,sortRoute:businessDictionaryDirectoryQueryRouteV010(
        {view:selection.view,query:{...query,sort:"dictionaryId",
          direction:query.sort === "dictionaryId" && query.direction !== "desc"
            ? "desc" : "asc"}})},
      {id:"state",label:t.status,sortRoute:businessDictionaryDirectoryQueryRouteV010(
        {view:selection.view,query:{...query,sort:"state",
          direction:query.sort === "state" && query.direction !== "desc"
            ? "desc" : "asc"}})},
      {id:"version",label:t.version,sortRoute:businessDictionaryDirectoryQueryRouteV010(
        {view:selection.view,query:{...query,sort:"version",
          direction:query.sort === "version" && query.direction !== "desc"
            ? "desc" : "asc"}})},
      {id:"optionCount",label:t.detail}
    ],
    views: [
      {id:"all",label:(input.locale ?? "").startsWith("zh") ? "全部" : "All",
        route:businessDictionaryDirectoryQueryRouteV010(viewSelection("all")),
        selected:selection.view === "all"},
      {id:"draft",label:t.draft,
        route:businessDictionaryDirectoryQueryRouteV010(viewSelection("draft")),
        selected:selection.view === "draft"},
      {id:"published",label:t.published,
        route:businessDictionaryDirectoryQueryRouteV010(viewSelection("published")),
        selected:selection.view === "published"}
    ],
    search: {
      route:businessDictionaryDirectoryQueryRouteV010(viewSelection(selection.view)),
      label:t.list, placeholder:t.list, value:query.search ?? "",
      submitLabel:(input.locale ?? "").startsWith("zh") ? "搜索" : "Search"
    },
    rows: result.rows.map(row => ({
      itemId:row.rowId,
      cells:{
        displayName:row.cells.displayName,
        dictionaryId:row.cells.dictionaryId,
        state:row.cells.state === "DRAFT" ? t.draft : t.published,
        version:row.cells.version,
        optionCount:row.cells.optionCount
      }
    })),
    pageInfo:{
      page:pageInfo.page,pageSize:pageInfo.pageSize,total:pageInfo.total,
      summary:`${pageInfo.total === 0 ? 0 : start + 1}–${Math.min(
        start + visible.length,pageInfo.total)} / ${pageInfo.total}`,
      previousLabel:(input.locale ?? "").startsWith("zh") ? "上一页" : "Previous",
      nextLabel:(input.locale ?? "").startsWith("zh") ? "下一页" : "Next",
      ...(pageInfo.page > 0 ? {previousRoute:businessDictionaryDirectoryQueryRouteV010(
        selection,pageInfo.page - 1)} : {}),
      ...(pageInfo.hasMore ? {nextRoute:businessDictionaryDirectoryQueryRouteV010(
        selection,pageInfo.page + 1)} : {})
    }
  } : undefined;
  return { contractVersion: "0.1.0", kind: "catalog-browser", layout: "list", density: "compact",
    itemActivation: "primary-action", id: "evo-business-dictionary.directory",
    title: t.list, description: t.listHelp,
    actions: input.canManage ? [{ id: "create", label: t.create, type: "navigate",
      route: OPTION, requiresConfirmation: false, primary: true }] : [],
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
        route: businessDictionaryDetailRouteV010(dictionary.dictionaryId),
        requiresConfirmation: false }
    })) };
}

export function createBusinessDictionaryDetailPageV010(input: {
  dictionary: BusinessDictionarySnapshotV010;
  effectiveVersion?: number; canManage: boolean; locale?: string;
}): CatalogBrowserV010 {
  const t = labels(input.locale);
  const dictionary = input.dictionary;
  return { contractVersion: "0.1.0", kind: "catalog-browser", layout: "list", density: "compact",
    itemActivation: input.canManage ? "primary-action" : undefined,
    id: "evo-business-dictionary.detail", title: dictionary.displayName || dictionary.dictionaryId,
    description: dictionary.state === "DRAFT" ? t.publishHelp : t.optionHelp,
    contextNavigation: { items: [{ id: "dictionaries", label: t.list, route: DIRECTORY },
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
