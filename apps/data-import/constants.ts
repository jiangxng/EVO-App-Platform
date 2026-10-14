export const DATA_IMPORT_PACKAGE_ID =
  "evo-data-import" as const;
export const DATA_IMPORT_FEATURE_ID =
  "evo-data-import.default" as const;
export const DATA_IMPORT_CAPABILITY_V010 =
  "enterprise.data-import" as const;

export const DATA_IMPORT_STAGE_CSV_OPERATION_V010 =
  "enterprise.data-import.stage-csv" as const;
export const DATA_IMPORT_DRY_RUN_OPERATION_V010 =
  "enterprise.data-import.dry-run" as const;
export const DATA_IMPORT_COMMIT_OPERATION_V010 =
  "enterprise.data-import.commit" as const;
export const DATA_IMPORT_GET_OPERATION_V010 =
  "enterprise.data-import.get" as const;
export const DATA_IMPORT_ERROR_CSV_OPERATION_V010 =
  "enterprise.data-import.error-csv" as const;
export const DATA_IMPORT_MAPPING_INSPECT_OPERATION_V010 =
  "enterprise.data-import.mapping.inspect" as const;
export const DATA_IMPORT_MAPPING_APPLY_OPERATION_V010 =
  "enterprise.data-import.mapping.apply" as const;

export const DATA_IMPORT_STAGE_CSV_COMMAND_V010 =
  "data-import.stage-csv" as const;
export const DATA_IMPORT_DRY_RUN_COMMAND_V010 =
  "data-import.dry-run" as const;
export const DATA_IMPORT_COMMIT_COMMAND_V010 =
  "data-import.commit" as const;
export const DATA_IMPORT_GET_COMMAND_V010 =
  "data-import.get" as const;
export const DATA_IMPORT_ERROR_CSV_COMMAND_V010 =
  "data-import.error-csv" as const;
export const DATA_IMPORT_MAPPING_INSPECT_COMMAND_V010 =
  "data-import.mapping.inspect" as const;
export const DATA_IMPORT_MAPPING_APPLY_COMMAND_V010 =
  "data-import.mapping.apply" as const;

export const DATA_IMPORT_READ_ACTION_V010 =
  "data-import.read" as const;
export const DATA_IMPORT_WRITE_ACTION_V010 =
  "data-import.write" as const;
export const DATA_IMPORT_AUTH_RESOURCE_V010 =
  "enterprise.data-import.job" as const;


export const DATA_IMPORT_STAGE_FILE_OPERATION_V010 =
  "enterprise.data-import.stage-file" as const;
export const DATA_IMPORT_STAGE_FILE_COMMAND_V010 =
  "data-import.stage-file" as const;
export const DATA_IMPORT_REVIEW_COMMAND_V010 =
  "data-import.review" as const;

export const DATA_IMPORT_DIRECTORY_PAGE_ID =
  "evo-data-import.directory" as const;
export const DATA_IMPORT_DIRECTORY_PAGE_SOURCE =
  "app://evo-data-import/page/directory" as const;
export const DATA_IMPORT_DIRECTORY_ROUTE =
  "/data-import" as const;

export const DATA_IMPORT_UPLOAD_PAGE_ID =
  "evo-data-import.upload" as const;
export const DATA_IMPORT_UPLOAD_PAGE_SOURCE =
  "app://evo-data-import/page/upload" as const;
export const DATA_IMPORT_UPLOAD_ROUTE =
  "/data-import/new/:targetId" as const;

export const DATA_IMPORT_MAPPING_PAGE_ID =
  "evo-data-import.mapping" as const;
export const DATA_IMPORT_MAPPING_PAGE_SOURCE =
  "app://evo-data-import/page/mapping" as const;
export const DATA_IMPORT_MAPPING_ROUTE =
  "/data-import/jobs/:importJobId/map" as const;

export const DATA_IMPORT_REVIEW_PAGE_ID =
  "evo-data-import.review" as const;
export const DATA_IMPORT_REVIEW_PAGE_SOURCE =
  "app://evo-data-import/page/review" as const;
export const DATA_IMPORT_REVIEW_ROUTE =
  "/data-import/jobs/:importJobId/review" as const;

export function dataImportUploadRouteV010(
  targetId: string,
  initialParameters?: Readonly<Record<string, string>>
): string {
  const route = "/data-import/new/" + encodeURIComponent(targetId);
  if (!initialParameters || Object.keys(initialParameters).length === 0) return route;
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(initialParameters)) {
    if (!/^[a-zA-Z][a-zA-Z0-9_-]{0,63}$/.test(key)
      || !value.trim() || value.length > 120) {
      throw new Error("DATA_IMPORT_ROUTE_PARAMETER_INVALID");
    }
    query.set("parameter__" + key, value);
  }
  return route + "?" + query.toString();
}
export function dataImportMappingRouteV010(importJobId: string): string {
  return "/data-import/jobs/" + encodeURIComponent(importJobId) + "/map";
}
export function dataImportReviewRouteV010(importJobId: string): string {
  return "/data-import/jobs/" + encodeURIComponent(importJobId) + "/review";
}
export function parseDataImportUploadIntentV010(route?: string): {
  targetId: string;
  initialParameters: Record<string, string>;
} | undefined {
  if (!route?.startsWith("/")) return undefined;
  let url: URL;
  try {
    url = new URL(route, "http://evo.local");
  } catch {
    return undefined;
  }
  const match = url.pathname.match(/^\/data-import\/new\/([^/?#]+)$/u);
  if (!match || url.hash || url.origin !== "http://evo.local") return undefined;
  const initialParameters: Record<string, string> = {};
  for (const [name, value] of url.searchParams) {
    if (!name.startsWith("parameter__")
      || !/^[a-zA-Z][a-zA-Z0-9_-]{0,63}$/.test(name.slice(11))
      || !value.trim() || value.length > 120
      || Object.hasOwn(initialParameters, name.slice(11))) return undefined;
    initialParameters[name.slice(11)] = value;
  }
  try {
    return { targetId: decodeURIComponent(match[1]), initialParameters };
  } catch {
    return undefined;
  }
}
export function parseDataImportUploadRouteV010(route?: string): string | undefined {
  return parseDataImportUploadIntentV010(route)?.targetId;
}
export function parseDataImportMappingRouteV010(route?: string): string | undefined {
  const match = route?.match(/^\/data-import\/jobs\/([^/?#]+)\/map(?:\?[^#]*)?$/u);
  return match ? decodeURIComponent(match[1]) : undefined;
}
export function parseDataImportReviewRouteV010(route?: string): string | undefined {
  const match = route?.match(/^\/data-import\/jobs\/([^/?#]+)\/review$/u);
  return match ? decodeURIComponent(match[1]) : undefined;
}
