import type { DataCollectionQueryV010 } from "../../contracts/data-collection/query.js";
import { parseDataCollectionQueryV010 } from "../../foundation/collection-query/index.js";
import { BUSINESS_DICTIONARY_DIRECTORY_ROUTE_V010 as DIRECTORY } from "./constants.js";

/** Domain-owned, read-only system views over the existing authorized dictionary collection. */
export type BusinessDictionaryDirectoryViewV010 = "all" | "draft" | "published";
export interface BusinessDictionaryDirectorySelectionV010 {
  view: BusinessDictionaryDirectoryViewV010;
  query: DataCollectionQueryV010;
  /**
   * UI selection hint only. Neither this ID nor the URL authorizes access
   * to an owner-saved view or its underlying business Collection.
   */
  personalViewId?: string;
}
const SORTABLE_FIELDS = ["dictionaryId", "displayName", "state", "version"];
const PERSONAL_VIEW_ID = /^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,79}$/;

/** A route is presentation intent only; the Host must independently authorize every read. */
export function parseBusinessDictionaryDirectoryRouteV010(
  route: string | null | undefined
): BusinessDictionaryDirectorySelectionV010 {
  if (!route) return { view: "all", query: {} };
  if (!route.startsWith("/") || route.startsWith("//")
    || route.includes("#") || route.includes("\\") || route.length > 650) {
    throw new Error("BUSINESS_DICTIONARY_DIRECTORY_ROUTE_INVALID");
  }
  const url = new URL(route, "https://evo.invalid");
  if (url.pathname !== DIRECTORY) {
    throw new Error("BUSINESS_DICTIONARY_DIRECTORY_ROUTE_INVALID");
  }
  const raw: Record<string, unknown> = {};
  for (const [key, value] of url.searchParams) {
    if (Object.prototype.hasOwnProperty.call(raw, key)) {
      throw new Error("BUSINESS_DICTIONARY_DIRECTORY_PARAMETER_DUPLICATE");
    }
    if (!["view", "search", "sort", "direction", "page", "pageSize", "personalViewId"].includes(key)) {
      throw new Error("BUSINESS_DICTIONARY_DIRECTORY_PARAMETER_UNSUPPORTED");
    }
    raw[key] = key === "page" || key === "pageSize" ? Number(value) : value;
  }
  const view = raw.view ?? "all";
  if (view !== "all" && view !== "draft" && view !== "published") {
    throw new Error("BUSINESS_DICTIONARY_DIRECTORY_VIEW_INVALID");
  }
  const personalViewId = raw.personalViewId;
  if (personalViewId !== undefined &&
    (typeof personalViewId !== "string" || !PERSONAL_VIEW_ID.test(personalViewId))) {
    throw new Error("BUSINESS_DICTIONARY_PERSONAL_VIEW_ID_INVALID");
  }
  const { view: _ignored, personalViewId: _hint, ...queryValues } = raw;
  const query = parseDataCollectionQueryV010(queryValues, {
    sortableFields: SORTABLE_FIELDS
  });
  return { view, query, ...(personalViewId ? {personalViewId} : {}) };
}

export function businessDictionaryDirectoryQueryRouteV010(
  selection: BusinessDictionaryDirectorySelectionV010,
  page = 0
): string {
  const params = new URLSearchParams();
  params.set("view", selection.view);
  if (selection.personalViewId) {
    if (!PERSONAL_VIEW_ID.test(selection.personalViewId)) {
      throw new Error("BUSINESS_DICTIONARY_PERSONAL_VIEW_ID_INVALID");
    }
    params.set("personalViewId", selection.personalViewId);
  }
  if (selection.query.search) params.set("search", selection.query.search);
  if (selection.query.sort) params.set("sort", selection.query.sort);
  if (selection.query.direction) params.set("direction", selection.query.direction);
  params.set("page", String(page));
  params.set("pageSize", String(selection.query.pageSize ?? 25));
  return DIRECTORY + "?" + params.toString();
}
