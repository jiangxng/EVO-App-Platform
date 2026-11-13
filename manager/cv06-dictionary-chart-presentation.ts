import type { AppActionRouter } from "../actions/router.js";
import type { AppActionRequestV010 } from "../actions/contracts.js";
import type { PlatformRequestContextV010 } from "../contracts/platform-services.js";
import type { CatalogBrowserV010 } from "../vendor/eidos/src/catalog-browser/contracts.js";
import {
  assertAuthorizedAggregateBarsV010,
  type CatalogAuthorizedAggregateBarsV010
} from "../vendor/eidos/src/catalog-browser/authorized-bars.js";
import type { BusinessDictionaryDirectorySelectionV010 } from "../apps/business-dictionary/directory-query.js";
import {
  BUSINESS_DICTIONARY_COLLECTION_STATE_AGGREGATE_COMMAND_V010 as AGGREGATE
} from "../apps/business-dictionary/constants.js";
import {
  BUSINESS_DICTIONARY_COLLECTION_ID_V010 as COLLECTION_ID,
  BUSINESS_DICTIONARY_COLLECTION_SCHEMA_V010 as SCHEMA
} from "../apps/business-dictionary/collection-query.js";
import {
  BUSINESS_DICTIONARY_STATE_COUNT_METRIC_V010 as METRIC,
  BUSINESS_DICTIONARY_AGGREGATE_PRIVACY_THRESHOLD_V010 as THRESHOLD
} from "../apps/business-dictionary/collection-aggregate.js";

/**
 * Chart is an optional presentation decoration after a separate Host-governed
 * aggregate READ. Never compute aggregate counts from page.table.rows.
 * Chart failure leaves the original authorized Catalog Browser unaffected.
 */
export async function withCv06AuthorizedDictionaryChartV010(input: {
  page: CatalogBrowserV010;
  actionRouter: AppActionRouter;
  context?: PlatformRequestContextV010;
  directorySelection: BusinessDictionaryDirectorySelectionV010;
  locale?: string;
}): Promise<CatalogBrowserV010> {
  const ctx = input.context;
  const active = ctx?.context?.activeContext;
  const principal = ctx?.principal;
  if (!input.page.table || !ctx || !active || active.kind !== "ENTERPRISE"
    || !active.contextId || !active.enterpriseId
    || ctx.scope.enterpriseId !== active.enterpriseId
    || !principal?.subjectId || principal.actorType !== "HUMAN"
    || ctx.delegatedActor
    || (ctx.scope.userId && ctx.scope.userId !== principal.subjectId)
    || input.directorySelection.personalViewId) {
    return input.page;
  }
  const selection = input.directorySelection;
  const search = selection.query.search?.trim() ?? "";
  const values: AppActionRequestV010["values"] = {
    view: selection.view,
    ...(search ? {search} : {}),
    ...(selection.query.sort ? {sort: selection.query.sort} : {}),
    ...(selection.query.direction ? {direction: selection.query.direction} : {}),
    ...(selection.query.page !== undefined ? {page: selection.query.page} : {}),
    ...(selection.query.pageSize !== undefined ? {pageSize: selection.query.pageSize} : {})
  };
  let result: Awaited<ReturnType<AppActionRouter["execute"]>>;
  try {
    result = await input.actionRouter.execute({
      contractVersion: "0.1.0",
      type: "command",command: {code: AGGREGATE,inputVersion: "0.1.0"},
      actionId: AGGREGATE,
      sourceInteractionId: "cv06.dictionary.page:" + ctx.correlationId,
      requiresConfirmation: false, values
    }, ctx);
  } catch {
    return input.page;
  }
  if (!result.ok || !result.result || typeof result.result !== "object"
    || Array.isArray(result.result)) return input.page;
  const raw = (result.result as Record<string,unknown>).data;
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return input.page;
  const a = raw as Record<string,unknown>;
  const query = a.query;
  const privacy = a.privacy;
  if (a.contractVersion !== "0.1.0"
    || a.kind !== "business-dictionary.collection.aggregate.state"
    || a.collectionId !== COLLECTION_ID || a.schemaRef !== SCHEMA
    || a.metricId !== METRIC || a.dimensionFieldId !== "state"
    || a.unit !== "dictionary" || a.scope !== "AUTHORIZED_ALL_MATCHING_ROWS"
    || !query || typeof query !== "object" || Array.isArray(query)
    || (query as Record<string,unknown>).view !== selection.view
    || (query as Record<string,unknown>).search !== search
    || !privacy || typeof privacy !== "object" || Array.isArray(privacy)
    || (privacy as Record<string,unknown>).minimumVisibleBucketCount !== THRESHOLD
    || !Array.isArray(a.buckets) || a.buckets.length !== 2) return input.page;
  const buckets = a.buckets as unknown[];
  if (!buckets.every((item,idx) => item && typeof item === "object"
    && !Array.isArray(item)
    && (item as Record<string,unknown>).key === (idx === 0 ? "DRAFT" : "PUBLISHED"))) {
    return input.page;
  }
  const zh = (input.locale ?? "").toLowerCase().startsWith("zh");
  const chart: CatalogAuthorizedAggregateBarsV010 = {
    contractVersion: "0.1.0",kind: "authorized-aggregate-bars",
    title: zh ? "字典状态统计" : "Dictionary state counts",
    metricId: METRIC,dimensionFieldId: "state",schemaRef: SCHEMA,
    unit: "dictionary",
    asOf: a.asOf as string,
    scope: "AUTHORIZED_ALL_MATCHING_ROWS",
    total: a.total as number | null,
    countKind: a.countKind as "EXACT" | "SUPPRESSED",
    buckets: buckets.map((value,idx) => {
      const v=value as Record<string,unknown>;
      return {
        key: idx === 0 ? "DRAFT" : "PUBLISHED",
        label: idx === 0 ? (zh ? "草稿" : "Draft")
          : (zh ? "已发布" : "Published"),
        count: v.count as number | null,
        countKind: v.countKind as "EXACT" | "SUPPRESSED"
      };
    }),
    suppressedLabel: zh ? "少于 3 条（已隐藏）" : "Fewer than 3 (suppressed)",
    totalLabel: zh ? "授权总数" : "Authorized total",
    asOfLabel: zh ? "读取时间" : "Read at"
  };
  try {
    assertAuthorizedAggregateBarsV010(chart);
    // The two reads can race; omit a contradictory exact chart rather than
    // representing a stale result. Suppressed totals remain null.
    if (chart.countKind === "EXACT"
      && chart.total !== input.page.table.pageInfo?.total) return input.page;
  } catch {
    return input.page;
  }
  return {...input.page, authorizedChart: chart};
}
