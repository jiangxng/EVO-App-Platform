import type {
  EnterpriseContextRelationshipKindV010
} from "../../contracts/platform-services.js";
import type {
  ResponsibilityAssignmentV010
} from "../responsibility/repository.js";
import type {
  ItemSubjectV010
} from "./repository.js";

export const ITEM_DIRECTORY_PROJECTION_V010 =
  "item.directory" as const;
export const ITEM_MY_ITEMS_PROJECTION_V010 =
  "item.my-stewardship" as const;
export const ITEM_STEWARD_RESPONSIBILITY_V010 =
  "ITEM_STEWARD" as const;

export type ItemProjectionIdV010 =
  | typeof ITEM_DIRECTORY_PROJECTION_V010
  | typeof ITEM_MY_ITEMS_PROJECTION_V010;

export function itemAuthorizedDataScopeV010(input: {
  items: readonly ItemSubjectV010[];
  enterpriseRelationshipKind?: EnterpriseContextRelationshipKindV010;
}): Set<string> {
  if (!input.enterpriseRelationshipKind) return new Set();
  if (!["OWNER", "ADMIN", "AUDITOR", "MEMBER"].includes(
    input.enterpriseRelationshipKind
  )) {
    return new Set();
  }
  return new Set(input.items.map(item => item.itemId));
}

export function projectItemsV010(input: {
  projectionId: ItemProjectionIdV010;
  items: readonly ItemSubjectV010[];
  responsibilities: readonly ResponsibilityAssignmentV010[];
  principalSubjectId: string;
  authorizedItemIds: ReadonlySet<string>;
}): ItemSubjectV010[] {
  const mine = input.projectionId === ITEM_MY_ITEMS_PROJECTION_V010;
  const responsibilityIds = mine
    ? new Set(
        input.responsibilities
          .filter(item =>
            item.status === "ACTIVE"
            && item.targetRef.objectType === "item.subject"
            && item.responsibilityType === ITEM_STEWARD_RESPONSIBILITY_V010
            && item.assigneeRef.kind === "PRINCIPAL"
            && item.assigneeRef.id === input.principalSubjectId
          )
          .map(item => item.targetRef.objectId)
      )
    : undefined;

  return input.items.filter(item =>
    input.authorizedItemIds.has(item.itemId)
    && (!responsibilityIds || responsibilityIds.has(item.itemId))
  );
}
