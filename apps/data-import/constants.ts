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

export const DATA_IMPORT_READ_ACTION_V010 =
  "data-import.read" as const;
export const DATA_IMPORT_WRITE_ACTION_V010 =
  "data-import.write" as const;
export const DATA_IMPORT_AUTH_RESOURCE_V010 =
  "enterprise.data-import.job" as const;

export const DATA_IMPORT_STAGE_FILE_OPERATION_V010 =
  "enterprise.data-import.stage-file" as const;
export const DATA_IMPORT_APPLY_MAPPING_DRY_RUN_OPERATION_V010 =
  "enterprise.data-import.apply-mapping-dry-run" as const;

export const DATA_IMPORT_STAGE_FILE_COMMAND_V010 =
  "data-import.stage-file" as const;
export const DATA_IMPORT_APPLY_MAPPING_DRY_RUN_COMMAND_V010 =
  "data-import.apply-mapping-dry-run" as const;

export const DATA_IMPORT_REVIEW_PAGE_ID_V010 =
  "evo-data-import.review" as const;
export const DATA_IMPORT_REVIEW_PAGE_SOURCE_V010 =
  "app://evo-data-import/pages/review" as const;
export const DATA_IMPORT_REVIEW_ROUTE_V010 =
  "/data-import/review" as const;

export function dataImportReviewRouteV010(importJobId: string): string {
  if (!importJobId.trim()) throw new Error("DATA_IMPORT_JOB_ID_REQUIRED");
  const query = new URLSearchParams({ importJobId: importJobId.trim() });
  return `${DATA_IMPORT_REVIEW_ROUTE_V010}?${query.toString()}`;
}

export function parseDataImportReviewRouteV010(
  route: string | undefined
): string | undefined {
  if (!route?.trim() || !route.trim().startsWith("/")) return undefined;
  const url = new URL(route.trim(), "http://evo.local");
  if (url.pathname !== DATA_IMPORT_REVIEW_ROUTE_V010) return undefined;
  return url.searchParams.get("importJobId")?.trim() || undefined;
}
