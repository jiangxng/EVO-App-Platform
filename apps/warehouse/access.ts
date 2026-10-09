import type {
  AuthorizationProviderV010,
  EnterpriseContextRelationshipKindV010,
  PlatformRequestContextV010
} from "../../contracts/platform-services.js";
import {
  WAREHOUSE_FIELD_READ_ACTION_V010,
  WAREHOUSE_FIELD_RESOURCE_V010,
  WAREHOUSE_READ_ACTION_V010,
  WAREHOUSE_READ_RESOURCE_V010
} from "./authorization.js";
import {
  warehouseAuthorizedDataScopeV010
} from "./projections.js";
import type {
  WarehouseSubjectV010
} from "./repository.js";

export interface WarehouseReadAccessV010 {
  warehouses: WarehouseSubjectV010[];
  readableFieldIds: string[];
}

export async function resolveWarehouseReadAccessV010(input: {
  authorizationProvider: AuthorizationProviderV010 | undefined;
  requestContext: PlatformRequestContextV010;
  enterpriseRelationshipKind?: EnterpriseContextRelationshipKindV010;
  warehouses: readonly WarehouseSubjectV010[];
  fieldIds: readonly string[];
}): Promise<WarehouseReadAccessV010> {
  const provider = input.authorizationProvider;
  if (!provider) return { warehouses: [], readableFieldIds: [] };

  const principalSubjectId = input.requestContext.principal.subjectId;
  const dataScope = warehouseAuthorizedDataScopeV010({
    warehouses: input.warehouses,
    enterpriseRelationshipKind: input.enterpriseRelationshipKind
  });
  const active = input.requestContext.context?.activeContext;
  const enterprise = input.requestContext.context?.enterpriseContext;
  const scope = active?.kind === "ENTERPRISE"
    ? {
        contractVersion: "0.1.0" as const,
        enterpriseId: enterprise?.enterpriseId ?? active.enterpriseId,
        ...(enterprise?.companyId
          ? { companyId: enterprise.companyId }
          : {}),
        ...(enterprise?.workspaceId
          ? { workspaceId: enterprise.workspaceId }
          : {}),
        userId: principalSubjectId
      }
    : {
        contractVersion: "0.1.0" as const,
        userId: principalSubjectId
      };

  const warehouses: WarehouseSubjectV010[] = [];
  for (const warehouse of input.warehouses) {
    if (!dataScope.has(warehouse.warehouseId)) continue;
    const decision = await provider.check({
      contractVersion: "0.1.0",
      principal: input.requestContext.principal,
      scope,
      action: WAREHOUSE_READ_ACTION_V010,
      resource: {
        type: WAREHOUSE_READ_RESOURCE_V010,
        id: warehouse.warehouseId
      },
      context: {
        activeContextId:
          input.requestContext.context?.activeContext.contextId ?? "",
        correlationId: input.requestContext.correlationId
      }
    });
    if (decision.allowed) warehouses.push(warehouse);
  }

  const readableFieldIds: string[] = [];
  for (const fieldId of [...new Set(input.fieldIds)]) {
    const decision = await provider.check({
      contractVersion: "0.1.0",
      principal: input.requestContext.principal,
      scope,
      action: WAREHOUSE_FIELD_READ_ACTION_V010,
      resource: {
        type: WAREHOUSE_FIELD_RESOURCE_V010,
        id: fieldId
      },
      context: {
        activeContextId:
          input.requestContext.context?.activeContext.contextId ?? "",
        correlationId: input.requestContext.correlationId
      }
    });
    if (decision.allowed) readableFieldIds.push(fieldId);
  }

  if (!readableFieldIds.includes("displayName")) {
    return { warehouses: [], readableFieldIds };
  }
  return { warehouses, readableFieldIds };
}
