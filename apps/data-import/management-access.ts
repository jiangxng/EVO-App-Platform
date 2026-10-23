import type { PlatformPrincipalV010, PlatformRequestContextV010 } from "../../contracts/platform-services.js";

export function activeEnterpriseContext(
  context: PlatformRequestContextV010 | undefined
): { contextId: string; enterpriseId: string } {
  const active = context?.context?.activeContext;
  if (
    !context
    || !active
    || active.kind !== "ENTERPRISE"
    || !active.contextId?.trim()
    || !active.enterpriseId?.trim()
  ) {
    throw new Error("DATA_IMPORT_ENTERPRISE_CONTEXT_REQUIRED");
  }
  return {
    contextId: active.contextId.trim(),
    enterpriseId: active.enterpriseId.trim()
  };
}

export function ensureManage(
  principal: PlatformPrincipalV010,
  contextId: string,
  canManageEnterpriseContext: (
    principal: PlatformPrincipalV010,
    contextId: string
  ) => boolean
): void {
  if (!canManageEnterpriseContext(principal, contextId)) {
    throw new Error("DATA_IMPORT_MANAGE_ROLE_REQUIRED");
  }
}


/** Same management contract before lazy loading and before business execution. */
export function assertDataImportManagementRequestV010(
  context: PlatformRequestContextV010 | undefined,
  canManage: (principal: PlatformPrincipalV010, contextId: string) => boolean
): void {
  if (!context) throw new Error("REQUEST_CONTEXT_REQUIRED");
  const active = activeEnterpriseContext(context);
  ensureManage(context.principal, active.contextId, canManage);
}
