import type {
  AuthorizationProviderV010,
  EnterpriseContextRelationshipKindV010,
  PlatformRequestContextV010
} from "../../contracts/platform-services.js";
import type {
  ObjectExtensionValueSetV010
} from "../../contracts/foundation-object/extension-value.js";
import type {
  ObjectExtensionValueRepositoryV010
} from "../object-extension/values.js";
import type {
  ResponsibilityAssignmentV010,
  ResponsibilityRepositoryV010
} from "../responsibility/repository.js";
import {
  ITEM_DIRECTORY_ROUTE,
  ITEM_MY_ITEMS_ROUTE
} from "./constants.js";
import {
  resolveItemReadAccessV010
} from "./access.js";
import type {
  ItemRepositoryV010,
  ItemSubjectV010
} from "./repository.js";
import {
  ITEM_DIRECTORY_PROJECTION_V010,
  ITEM_MY_ITEMS_PROJECTION_V010,
  projectItemsV010,
  type ItemProjectionIdV010
} from "./projections.js";

export interface ItemProjectionRecordV010 {
  item: ItemSubjectV010;
  responsibilities: ResponsibilityAssignmentV010[];
  extensionValues: ObjectExtensionValueSetV010[];
}

export interface ItemProjectionResultV010 {
  contractVersion: "0.1.0";
  projectionId: ItemProjectionIdV010;
  route: string;
  count: number;
  items: ItemProjectionRecordV010[];
  readableFieldIds: string[];
}

export interface ItemProjectionServiceV010 {
  read(input: {
    contextId: string;
    projectionId: ItemProjectionIdV010;
    requestContext: PlatformRequestContextV010;
    enterpriseRelationshipKind?: EnterpriseContextRelationshipKindV010;
  }): Promise<ItemProjectionResultV010>;
}

export function itemProjectionRouteV010(
  projectionId: ItemProjectionIdV010
): string {
  switch (projectionId) {
    case ITEM_DIRECTORY_PROJECTION_V010:
      return ITEM_DIRECTORY_ROUTE;
    case ITEM_MY_ITEMS_PROJECTION_V010:
      return ITEM_MY_ITEMS_ROUTE;
  }
}

export function createItemProjectionServiceV010(input: {
  repository: ItemRepositoryV010;
  responsibilityRepository: ResponsibilityRepositoryV010;
  extensionValueRepository: ObjectExtensionValueRepositoryV010;
  resolveAuthorizationProvider(): AuthorizationProviderV010 | undefined;
  fieldIds(): readonly string[];
}): ItemProjectionServiceV010 {
  return {
    async read(request) {
      const items = input.repository.list(request.contextId);
      const responsibilities = input.responsibilityRepository.list(
        request.contextId,
        { objectType: "item.subject" }
      );
      const access = await resolveItemReadAccessV010({
        authorizationProvider: input.resolveAuthorizationProvider(),
        requestContext: request.requestContext,
        enterpriseRelationshipKind: request.enterpriseRelationshipKind,
        items,
        fieldIds: input.fieldIds()
      });
      const authorizedItemIds = new Set(
        access.items.map(item => item.itemId)
      );
      const projected = projectItemsV010({
        projectionId: request.projectionId,
        items: access.items,
        responsibilities,
        principalSubjectId: request.requestContext.principal.subjectId,
        authorizedItemIds
      });
      return {
        contractVersion: "0.1.0",
        projectionId: request.projectionId,
        route: itemProjectionRouteV010(request.projectionId),
        count: projected.length,
        items: projected.map(item => ({
          item,
          responsibilities: responsibilities.filter(assignment =>
            assignment.targetRef.objectId === item.itemId
          ),
          extensionValues: input.extensionValueRepository.listForObject({
            contextId: request.contextId,
            objectType: "item.subject",
            objectId: item.itemId
          })
        })),
        readableFieldIds: access.readableFieldIds
      };
    }
  };
}
