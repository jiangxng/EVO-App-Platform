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

export function dataImportUploadRouteV010(targetId: string): string {
  return "/data-import/new/" + encodeURIComponent(targetId);
}
export function dataImportMappingRouteV010(importJobId: string): string {
  return "/data-import/jobs/" + encodeURIComponent(importJobId) + "/map";
}
export function dataImportReviewRouteV010(importJobId: string): string {
  return "/data-import/jobs/" + encodeURIComponent(importJobId) + "/review";
}
export function parseDataImportUploadRouteV010(route?: string): string | undefined {
  const match = route?.match(/^\/data-import\/new\/([^/?#]+)$/u);
  return match ? decodeURIComponent(match[1]) : undefined;
}
export function parseDataImportMappingRouteV010(route?: string): string | undefined {
  const match = route?.match(/^\/data-import\/jobs\/([^/?#]+)\/map$/u);
  return match ? decodeURIComponent(match[1]) : undefined;
}
export function parseDataImportReviewRouteV010(route?: string): string | undefined {
  const match = route?.match(/^\/data-import\/jobs\/([^/?#]+)\/review$/u);
  return match ? decodeURIComponent(match[1]) : undefined;
}
