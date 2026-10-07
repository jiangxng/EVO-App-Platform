import type {
  AuthorizationProviderV010,
  EnterpriseContextRelationshipKindV010,
  PlatformRequestContextV010
} from "../../contracts/platform-services.js";
import type {
  ResponsibilityAssignmentV010
} from "../responsibility/repository.js";
import {
  legacyScopeFromRequestContextV010
} from "../../manager/material-write-authorization.js";
import {
  COUNTERPARTY_FIELD_READ_ACTION_V010,
  COUNTERPARTY_FIELD_RESOURCE_V010,
  COUNTERPARTY_READ_ACTION_V010,
  COUNTERPARTY_READ_RESOURCE_V010
} from "./authorization.js";
import {
  counterpartyAuthorizedDataScopeV010
} from "./projections.js";
import type {
  CounterpartySubjectV010
} from "./repository.js";

export interface CounterpartyReadAccessV010 {
  counterparties: CounterpartySubjectV010[];
  readableFieldIds: string[];
}

export async function resolveCounterpartyReadAccessV010(input: {
  authorizationProvider: AuthorizationProviderV010 | undefined;
  requestContext: PlatformRequestContextV010;
  enterpriseRelationshipKind?: EnterpriseContextRelationshipKindV010;
  counterparties: readonly CounterpartySubjectV010[];
  responsibilities: readonly ResponsibilityAssignmentV010[];
  fieldIds: readonly string[];
}): Promise<CounterpartyReadAccessV010> {
  const provider = input.authorizationProvider;
  if (!provider) {
    return { counterparties: [], readableFieldIds: [] };
  }

  const principalSubjectId = input.requestContext.principal.subjectId;
  const dataScope = counterpartyAuthorizedDataScopeV010({
    counterparties: input.counterparties,
    responsibilities: input.responsibilities,
    principalSubjectId,
    enterpriseRelationshipKind: input.enterpriseRelationshipKind
  });
  const scope = legacyScopeFromRequestContextV010(input.requestContext);

  const counterparties: CounterpartySubjectV010[] = [];
  for (const item of input.counterparties) {
    if (!dataScope.has(item.counterpartyId)) continue;
    const decision = await provider.check({
      contractVersion: "0.1.0",
      principal: input.requestContext.principal,
      scope,
      action: COUNTERPARTY_READ_ACTION_V010,
      resource: {
        type: COUNTERPARTY_READ_RESOURCE_V010,
        id: item.counterpartyId
      },
      context: {
        activeContextId:
          input.requestContext.context?.activeContext.contextId ?? "",
        correlationId: input.requestContext.correlationId
      }
    });
    if (decision.allowed) counterparties.push(item);
  }

  const readableFieldIds: string[] = [];
  for (const fieldId of [...new Set(input.fieldIds)]) {
    const decision = await provider.check({
      contractVersion: "0.1.0",
      principal: input.requestContext.principal,
      scope,
      action: COUNTERPARTY_FIELD_READ_ACTION_V010,
      resource: {
        type: COUNTERPARTY_FIELD_RESOURCE_V010,
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
    return { counterparties: [], readableFieldIds };
  }

  return { counterparties, readableFieldIds };
}
