import type {
  AuthorizationProviderV010,
  EnterpriseContextRelationshipKindV010,
  PlatformRequestContextV010
} from "../../contracts/platform-services.js";
import type { DataCollectionResultV010, DataCollectionQueryV010 } from "../../contracts/data-collection/query.js";
import { pageAuthorizedItemProjectionV010 } from "./collection-query.js";
import type {
  ObjectExtensionValueSetV010
} from "../../contracts/foundation-object/extension-value.js";
import type {
  ObjectExtensionValueReaderV010
} from "../../contracts/foundation-object/extension-value.js";
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
  /** Present only for bounded, owner-authorized Collection reads. */
  collection?: DataCollectionResultV010;
}

export interface ItemProjectionServiceV010 {
  read(input: {
    contextId: string;
    projectionId: ItemProjectionIdV010;
    requestContext: PlatformRequestContextV010;
    enterpriseRelationshipKind?: EnterpriseContextRelationshipKindV010;
    query?: DataCollectionQueryV010;
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
  extensionValueRepository: ObjectExtensionValueReaderV010;
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
      // Index responsibilities once. The previous per-record filter was
      // quadratic when many items had assignments.
      const byItemId = new Map<string, ResponsibilityAssignmentV010[]>();
      for (const assignment of responsibilities) {
        if (assignment.targetRef.objectType !== "item.subject") continue;
        const id = assignment.targetRef.objectId;
        const bucket = byItemId.get(id) ?? [];
        bucket.push(assignment);
        byItemId.set(id, bucket);
      }
      const hydrate = (item: ItemSubjectV010): ItemProjectionRecordV010 => ({
        item,
        responsibilities: byItemId.get(item.itemId) ?? [],
        extensionValues: input.extensionValueRepository.listForObject({
          contextId: request.contextId,
          objectType: "item.subject",
          objectId: item.itemId
        })
      });
      const base = {
        contractVersion: "0.1.0" as const,
        projectionId: request.projectionId,
        route: itemProjectionRouteV010(request.projectionId),
        count: projected.length,
        readableFieldIds: access.readableFieldIds
      };
      // Preserve legacy unpaged behavior, but avoid repeated assignment scans.
      if (!request.query) {
        return { ...base, items: projected.map(hydrate) };
      }
      // The Collection helper uses only the already-authorized Item fields.
      // It never consumes Responsibility or extension values: keep them empty
      // until server-side filter/sort/page has selected the visible rows.
      // Authorization still happens on the full candidate set FIRST.
      const candidate: ItemProjectionResultV010 = {
        ...base,
        items: projected.map(item => ({
          item, responsibilities: [], extensionValues: []
        }))
      };
      const paged = pageAuthorizedItemProjectionV010({
        projection: candidate, query: request.query
      });
      return {
        ...base,
        items: paged.items.map(record => hydrate(record.item)),
        collection: paged.collection
      };
    }
  };
}
