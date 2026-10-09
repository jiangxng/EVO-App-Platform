import type {
  AuthorizationProviderV010,
  EnterpriseContextRelationshipKindV010,
  PlatformRequestContextV010
} from "../../contracts/platform-services.js";
import {
  ITEM_FIELD_READ_ACTION_V010,
  ITEM_FIELD_RESOURCE_V010,
  ITEM_READ_ACTION_V010,
  ITEM_READ_RESOURCE_V010
} from "./authorization.js";
import {
  itemAuthorizedDataScopeV010
} from "./projections.js";
import type {
  ItemSubjectV010
} from "./repository.js";

export interface ItemReadAccessV010 {
  items: ItemSubjectV010[];
  readableFieldIds: string[];
}

export async function resolveItemReadAccessV010(input: {
  authorizationProvider: AuthorizationProviderV010 | undefined;
  requestContext: PlatformRequestContextV010;
  enterpriseRelationshipKind?: EnterpriseContextRelationshipKindV010;
  items: readonly ItemSubjectV010[];
  fieldIds: readonly string[];
}): Promise<ItemReadAccessV010> {
  const provider = input.authorizationProvider;
  if (!provider) return { items: [], readableFieldIds: [] };

  const principalSubjectId = input.requestContext.principal.subjectId;
  const dataScope = itemAuthorizedDataScopeV010({
    items: input.items,
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

  const items: ItemSubjectV010[] = [];
  for (const item of input.items) {
    if (!dataScope.has(item.itemId)) continue;
    const decision = await provider.check({
      contractVersion: "0.1.0",
      principal: input.requestContext.principal,
      scope,
      action: ITEM_READ_ACTION_V010,
      resource: {
        type: ITEM_READ_RESOURCE_V010,
        id: item.itemId
      },
      context: {
        activeContextId:
          input.requestContext.context?.activeContext.contextId ?? "",
        correlationId: input.requestContext.correlationId
      }
    });
    if (decision.allowed) items.push(item);
  }

  const readableFieldIds: string[] = [];
  for (const fieldId of [...new Set(input.fieldIds)]) {
    const decision = await provider.check({
      contractVersion: "0.1.0",
      principal: input.requestContext.principal,
      scope,
      action: ITEM_FIELD_READ_ACTION_V010,
      resource: {
        type: ITEM_FIELD_RESOURCE_V010,
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
    return { items: [], readableFieldIds };
  }
  return { items, readableFieldIds };
}
