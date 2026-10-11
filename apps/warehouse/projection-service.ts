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
import type {
  WarehouseLocationRepositoryV010,
  WarehouseLocationV010
} from "./locations.js";
import type {
  WarehouseRepositoryV010,
  WarehouseSubjectV010
} from "./repository.js";
import {
  WAREHOUSE_DIRECTORY_ROUTE,
  WAREHOUSE_MY_ROUTE
} from "./constants.js";
import {
  resolveWarehouseReadAccessV010
} from "./access.js";
import {
  WAREHOUSE_DIRECTORY_PROJECTION_V010,
  WAREHOUSE_MY_PROJECTION_V010,
  projectWarehousesV010,
  type WarehouseProjectionIdV010
} from "./projections.js";

export interface WarehouseProjectionRecordV010 {
  warehouse: WarehouseSubjectV010;
  locations: WarehouseLocationV010[];
  responsibilities: ResponsibilityAssignmentV010[];
  extensionValues: ObjectExtensionValueSetV010[];
}

export interface WarehouseProjectionResultV010 {
  contractVersion: "0.1.0";
  projectionId: WarehouseProjectionIdV010;
  route: string;
  count: number;
  warehouses: WarehouseProjectionRecordV010[];
  readableFieldIds: string[];
}

export interface WarehouseProjectionServiceV010 {
  read(input: {
    contextId: string;
    projectionId: WarehouseProjectionIdV010;
    requestContext: PlatformRequestContextV010;
    enterpriseRelationshipKind?: EnterpriseContextRelationshipKindV010;
  }): Promise<WarehouseProjectionResultV010>;
}

export function warehouseProjectionRouteV010(
  projectionId: WarehouseProjectionIdV010
): string {
  switch (projectionId) {
    case WAREHOUSE_DIRECTORY_PROJECTION_V010:
      return WAREHOUSE_DIRECTORY_ROUTE;
    case WAREHOUSE_MY_PROJECTION_V010:
      return WAREHOUSE_MY_ROUTE;
  }
}

export function createWarehouseProjectionServiceV010(input: {
  repository: WarehouseRepositoryV010;
  locationRepository: WarehouseLocationRepositoryV010;
  responsibilityRepository: ResponsibilityRepositoryV010;
  extensionValueRepository: ObjectExtensionValueRepositoryV010;
  resolveAuthorizationProvider(): AuthorizationProviderV010 | undefined;
  fieldIds(): readonly string[];
}): WarehouseProjectionServiceV010 {
  return {
    async read(request) {
      const warehouses = input.repository.list(request.contextId);
      const responsibilities = input.responsibilityRepository.list(
        request.contextId,
        { objectType: "warehouse.subject" }
      );
      const access = await resolveWarehouseReadAccessV010({
        authorizationProvider: input.resolveAuthorizationProvider(),
        requestContext: request.requestContext,
        enterpriseRelationshipKind: request.enterpriseRelationshipKind,
        warehouses,
        fieldIds: input.fieldIds()
      });
      const authorizedWarehouseIds = new Set(
        access.warehouses.map(item => item.warehouseId)
      );
      const projected = projectWarehousesV010({
        projectionId: request.projectionId,
        warehouses: access.warehouses,
        responsibilities,
        principalSubjectId: request.requestContext.principal.subjectId,
        authorizedWarehouseIds
      });

      return {
        contractVersion: "0.1.0",
        projectionId: request.projectionId,
        route: warehouseProjectionRouteV010(request.projectionId),
        count: projected.length,
        warehouses: projected.map(warehouse => ({
          warehouse,
          locations: input.locationRepository.list(
            request.contextId,
            warehouse.warehouseId
          ),
          responsibilities: responsibilities.filter(assignment =>
            assignment.targetRef.objectId === warehouse.warehouseId
          ),
          extensionValues: input.extensionValueRepository.listForObject({
            contextId: request.contextId,
            objectType: "warehouse.subject",
            objectId: warehouse.warehouseId
          })
        })),
        readableFieldIds: access.readableFieldIds
      };
    }
  };
}
