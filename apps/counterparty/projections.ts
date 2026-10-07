import type {
  EnterpriseContextRelationshipKindV010
} from "../../contracts/platform-services.js";
import type {
  ResponsibilityAssignmentV010
} from "../responsibility/repository.js";
import type {
  CounterpartyRelationshipRoleV010
} from "./roles.js";
import type {
  CounterpartySubjectV010
} from "./repository.js";

export const COUNTERPARTY_CUSTOMER_PROJECTION_V010 =
  "counterparty.customers" as const;
export const COUNTERPARTY_SUPPLIER_PROJECTION_V010 =
  "counterparty.suppliers" as const;
export const COUNTERPARTY_MY_CUSTOMER_PROJECTION_V010 =
  "counterparty.my-customers" as const;
export const COUNTERPARTY_MY_SUPPLIER_PROJECTION_V010 =
  "counterparty.my-suppliers" as const;

export const COUNTERPARTY_SALES_OWNER_RESPONSIBILITY_V010 =
  "SALES_OWNER" as const;
export const COUNTERPARTY_PROCUREMENT_OWNER_RESPONSIBILITY_V010 =
  "PROCUREMENT_OWNER" as const;

export type CounterpartyProjectionIdV010 =
  | typeof COUNTERPARTY_CUSTOMER_PROJECTION_V010
  | typeof COUNTERPARTY_SUPPLIER_PROJECTION_V010
  | typeof COUNTERPARTY_MY_CUSTOMER_PROJECTION_V010
  | typeof COUNTERPARTY_MY_SUPPLIER_PROJECTION_V010;

export function counterpartyAuthorizedDataScopeV010(input: {
  counterparties: readonly CounterpartySubjectV010[];
  responsibilities: readonly ResponsibilityAssignmentV010[];
  principalSubjectId: string;
  enterpriseRelationshipKind?: EnterpriseContextRelationshipKindV010;
}): Set<string> {
  if (
    input.enterpriseRelationshipKind === "OWNER"
    || input.enterpriseRelationshipKind === "ADMIN"
    || input.enterpriseRelationshipKind === "AUDITOR"
  ) {
    return new Set(
      input.counterparties.map(item => item.counterpartyId)
    );
  }

  if (input.enterpriseRelationshipKind !== "MEMBER") {
    return new Set();
  }

  return new Set(
    input.responsibilities
      .filter(item =>
        item.status === "ACTIVE"
        && item.targetRef.objectType === "counterparty.subject"
        && item.assigneeRef.kind === "PRINCIPAL"
        && item.assigneeRef.id === input.principalSubjectId
      )
      .map(item => item.targetRef.objectId)
  );
}

export function projectCounterpartiesV010(input: {
  projectionId: CounterpartyProjectionIdV010;
  counterparties: readonly CounterpartySubjectV010[];
  roles: readonly CounterpartyRelationshipRoleV010[];
  responsibilities: readonly ResponsibilityAssignmentV010[];
  principalSubjectId: string;
  authorizedCounterpartyIds: ReadonlySet<string>;
}): CounterpartySubjectV010[] {
  const isCustomer =
    input.projectionId === COUNTERPARTY_CUSTOMER_PROJECTION_V010
    || input.projectionId === COUNTERPARTY_MY_CUSTOMER_PROJECTION_V010;
  const isMine =
    input.projectionId === COUNTERPARTY_MY_CUSTOMER_PROJECTION_V010
    || input.projectionId === COUNTERPARTY_MY_SUPPLIER_PROJECTION_V010;
  const requiredRole = isCustomer ? "CUSTOMER" : "SUPPLIER";
  const requiredResponsibility = isCustomer
    ? COUNTERPARTY_SALES_OWNER_RESPONSIBILITY_V010
    : COUNTERPARTY_PROCUREMENT_OWNER_RESPONSIBILITY_V010;

  const roleIds = new Set(
    input.roles
      .filter(role => role.roleCode === requiredRole)
      .map(role => role.counterpartyId)
  );
  const responsibilityIds = isMine
    ? new Set(
        input.responsibilities
          .filter(item =>
            item.status === "ACTIVE"
            && item.targetRef.objectType === "counterparty.subject"
            && item.responsibilityType === requiredResponsibility
            && item.assigneeRef.kind === "PRINCIPAL"
            && item.assigneeRef.id === input.principalSubjectId
          )
          .map(item => item.targetRef.objectId)
      )
    : undefined;

  return input.counterparties.filter(item =>
    input.authorizedCounterpartyIds.has(item.counterpartyId)
    && roleIds.has(item.counterpartyId)
    && (!responsibilityIds
      || responsibilityIds.has(item.counterpartyId))
  );
}
