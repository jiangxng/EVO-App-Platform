import type {
  AuthorizationProviderV010,
  EnterpriseContextRelationshipKindV010,
  PlatformRequestContextV010
} from "../../contracts/platform-services.js";
import type {
  ResponsibilityRepositoryV010
} from "../responsibility/repository.js";
import {
  resolveCounterpartyReadAccessV010
} from "./access.js";
import type {
  CounterpartySubjectV010,
  CounterpartyRepositoryV010
} from "./repository.js";
import type {
  CounterpartyRoleRepositoryV010
} from "./roles.js";
import {
  COUNTERPARTY_CUSTOMER_PROJECTION_V010,
  COUNTERPARTY_MY_CUSTOMER_PROJECTION_V010,
  COUNTERPARTY_MY_SUPPLIER_PROJECTION_V010,
  COUNTERPARTY_SUPPLIER_PROJECTION_V010,
  projectCounterpartiesV010,
  type CounterpartyProjectionIdV010
} from "./projections.js";
import {
  COUNTERPARTY_CUSTOMERS_ROUTE,
  COUNTERPARTY_MY_CUSTOMERS_ROUTE,
  COUNTERPARTY_MY_SUPPLIERS_ROUTE,
  COUNTERPARTY_SUPPLIERS_ROUTE
} from "./constants.js";

export interface CounterpartyProjectionResultV010 {
  contractVersion: "0.1.0";
  projectionId: CounterpartyProjectionIdV010;
  route: string;
  count: number;
  counterparties: CounterpartySubjectV010[];
  readableFieldIds: string[];
}

export interface CounterpartyProjectionServiceV010 {
  read(input: {
    contextId: string;
    projectionId: CounterpartyProjectionIdV010;
    requestContext: PlatformRequestContextV010;
    enterpriseRelationshipKind?: EnterpriseContextRelationshipKindV010;
  }): Promise<CounterpartyProjectionResultV010>;
}

export function counterpartyProjectionRouteV010(
  projectionId: CounterpartyProjectionIdV010
): string {
  switch (projectionId) {
    case COUNTERPARTY_CUSTOMER_PROJECTION_V010:
      return COUNTERPARTY_CUSTOMERS_ROUTE;
    case COUNTERPARTY_SUPPLIER_PROJECTION_V010:
      return COUNTERPARTY_SUPPLIERS_ROUTE;
    case COUNTERPARTY_MY_CUSTOMER_PROJECTION_V010:
      return COUNTERPARTY_MY_CUSTOMERS_ROUTE;
    case COUNTERPARTY_MY_SUPPLIER_PROJECTION_V010:
      return COUNTERPARTY_MY_SUPPLIERS_ROUTE;
  }
}

export function createCounterpartyProjectionServiceV010(input: {
  repository: CounterpartyRepositoryV010;
  roleRepository: CounterpartyRoleRepositoryV010;
  responsibilityRepository: ResponsibilityRepositoryV010;
  resolveAuthorizationProvider(): AuthorizationProviderV010 | undefined;
  fieldIds(): readonly string[];
}): CounterpartyProjectionServiceV010 {
  return {
    async read(request) {
      const counterparties = input.repository.list(request.contextId);
      const responsibilities = input.responsibilityRepository.list(
        request.contextId,
        { objectType: "counterparty.subject" }
      );
      const access = await resolveCounterpartyReadAccessV010({
        authorizationProvider: input.resolveAuthorizationProvider(),
        requestContext: request.requestContext,
        enterpriseRelationshipKind: request.enterpriseRelationshipKind,
        counterparties,
        responsibilities,
        fieldIds: input.fieldIds()
      });
      const authorizedCounterpartyIds = new Set(
        access.counterparties.map(item => item.counterpartyId)
      );
      const projected = projectCounterpartiesV010({
        projectionId: request.projectionId,
        counterparties: access.counterparties,
        roles: input.roleRepository.list(request.contextId),
        responsibilities,
        principalSubjectId: request.requestContext.principal.subjectId,
        authorizedCounterpartyIds
      });
      return {
        contractVersion: "0.1.0",
        projectionId: request.projectionId,
        route: counterpartyProjectionRouteV010(request.projectionId),
        count: projected.length,
        counterparties: projected,
        readableFieldIds: access.readableFieldIds
      };
    }
  };
}
