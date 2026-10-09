import type {
  EnterpriseContextRelationshipKindV010
} from "../../contracts/platform-services.js";
import type {
  ResponsibilityAssignmentV010
} from "../responsibility/repository.js";
import type {
  WarehouseSubjectV010
} from "./repository.js";
import {
  WAREHOUSE_DIRECTORY_PROJECTION_V010,
  WAREHOUSE_MY_PROJECTION_V010,
  type WarehouseProjectionIdV010
} from "./constants.js";

export {
  WAREHOUSE_DIRECTORY_PROJECTION_V010,
  WAREHOUSE_MY_PROJECTION_V010,
  type WarehouseProjectionIdV010
} from "./constants.js";

export const WAREHOUSE_STEWARD_RESPONSIBILITY_V010 =
  "WAREHOUSE_STEWARD" as const;

export function warehouseAuthorizedDataScopeV010(input: {
  warehouses: readonly WarehouseSubjectV010[];
  enterpriseRelationshipKind?: EnterpriseContextRelationshipKindV010;
}): Set<string> {
  if (!input.enterpriseRelationshipKind) return new Set();
  if (!["OWNER", "ADMIN", "AUDITOR", "MEMBER"].includes(
    input.enterpriseRelationshipKind
  )) {
    return new Set();
  }
  return new Set(input.warehouses.map(item => item.warehouseId));
}

export function projectWarehousesV010(input: {
  projectionId: WarehouseProjectionIdV010;
  warehouses: readonly WarehouseSubjectV010[];
  responsibilities: readonly ResponsibilityAssignmentV010[];
  principalSubjectId: string;
  authorizedWarehouseIds: ReadonlySet<string>;
}): WarehouseSubjectV010[] {
  const mine = input.projectionId === WAREHOUSE_MY_PROJECTION_V010;
  const responsibilityIds = mine
    ? new Set(
        input.responsibilities
          .filter(item =>
            item.status === "ACTIVE"
            && item.targetRef.objectType === "warehouse.subject"
            && item.responsibilityType ===
              WAREHOUSE_STEWARD_RESPONSIBILITY_V010
            && item.assigneeRef.kind === "PRINCIPAL"
            && item.assigneeRef.id === input.principalSubjectId
          )
          .map(item => item.targetRef.objectId)
      )
    : undefined;

  return input.warehouses.filter(warehouse =>
    input.authorizedWarehouseIds.has(warehouse.warehouseId)
    && (!responsibilityIds
      || responsibilityIds.has(warehouse.warehouseId))
  );
}
