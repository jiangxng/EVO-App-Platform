export const OBJECT_EXTENSION_PACKAGE_ID =
  "evo-object-extension" as const;
export const OBJECT_EXTENSION_FEATURE_ID =
  "evo-object-extension.default" as const;

export const OBJECT_EXTENSION_DEFINITION_CAPABILITY_V010 =
  "enterprise.object-extension.definition" as const;

export const OBJECT_EXTENSION_DEFINITION_LIST_OPERATION_V010 =
  "enterprise.object-extension.definition.list" as const;
export const OBJECT_EXTENSION_DEFINITION_UPSERT_OPERATION_V010 =
  "enterprise.object-extension.definition.upsert" as const;
export const OBJECT_EXTENSION_DEFINITION_ARCHIVE_OPERATION_V010 =
  "enterprise.object-extension.definition.archive" as const;

export const OBJECT_EXTENSION_DEFINITION_LIST_COMMAND_V010 =
  "object-extension.definition.list" as const;
export const OBJECT_EXTENSION_DEFINITION_UPSERT_COMMAND_V010 =
  "object-extension.definition.upsert" as const;
export const OBJECT_EXTENSION_DEFINITION_ARCHIVE_COMMAND_V010 =
  "object-extension.definition.archive" as const;

export const OBJECT_EXTENSION_DEFINITION_READ_ACTION_V010 =
  "object-extension.definition.read" as const;
export const OBJECT_EXTENSION_DEFINITION_WRITE_ACTION_V010 =
  "object-extension.definition.write" as const;

export const OBJECT_EXTENSION_DEFINITION_AUTH_RESOURCE_V010 =
  "enterprise.object-extension.definition" as const;

export const OBJECT_EXTENSION_IMPORT_PAGE_ID_V010 = "evo-object-extension.from-import" as const;
export const OBJECT_EXTENSION_IMPORT_PAGE_SOURCE_V010 = "evo-object-extension.from-import" as const;
export const OBJECT_EXTENSION_IMPORT_ROUTE_V010 = "/object-extensions/from-import" as const;
export const OBJECT_EXTENSION_IMPORT_CREATE_COMMAND_V010 = "object-extension.definition.create-from-import" as const;
export const OBJECT_EXTENSION_IMPORT_DRAFT_SAVE_COMMAND_V010 = "object-extension.batch-review.save-draft" as const;
export function objectExtensionImportRouteV010(jobId: string, sourceColumn?: string): string {
  return OBJECT_EXTENSION_IMPORT_ROUTE_V010 + "?job=" + encodeURIComponent(jobId)
    + (sourceColumn ? "&column=" + encodeURIComponent(sourceColumn) : "");
}
export function parseObjectExtensionImportRouteV010(path: string | undefined): string | undefined {
  if (!path || !path.startsWith("/")) return undefined;
  const url = new URL(path, "https://evo.invalid");
  if (url.pathname !== OBJECT_EXTENSION_IMPORT_ROUTE_V010) return undefined;
  const job = url.searchParams.get("job");
  return job && /^[a-zA-Z0-9_-]{1,128}$/.test(job) ? job : undefined;
}
