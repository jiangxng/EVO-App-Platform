import type {
  AppActionExecutionResultV010,
  AppActionHandler,
  AppActionRequestV010,
  JsonValue
} from "../../actions/contracts.js";
import type {
  EnterpriseContextRelationshipKindV010,
  PlatformPrincipalV010,
  PlatformRequestContextV010
} from "../../contracts/platform-services.js";
import {
  COUNTERPARTY_FEATURE_ID,
  COUNTERPARTY_MY_CUSTOMERS_READ_COMMAND_V010,
  COUNTERPARTY_MY_SUPPLIERS_READ_COMMAND_V010,
  COUNTERPARTY_PACKAGE_ID
} from "./constants.js";
import {
  COUNTERPARTY_MY_CUSTOMER_PROJECTION_V010,
  COUNTERPARTY_MY_SUPPLIER_PROJECTION_V010,
  type CounterpartyProjectionIdV010
} from "./projections.js";
import type {
  CounterpartyProjectionServiceV010
} from "./projection-service.js";

function activeEnterpriseContext(
  context: PlatformRequestContextV010 | undefined
): { contextId: string } {
  const active = context?.context?.activeContext;
  if (!context || !active || active.kind !== "ENTERPRISE") {
    throw new Error("COUNTERPARTY_ENTERPRISE_CONTEXT_REQUIRED");
  }
  return { contextId: active.contextId };
}

function failure(
  error: unknown,
  context?: PlatformRequestContextV010
): AppActionExecutionResultV010 {
  const code = error instanceof Error
    ? error.message.split(":")[0]
    : "COUNTERPARTY_PROJECTION_READ_FAILED";
  return {
    ok: false,
    ...(context?.correlationId
      ? { correlationId: context.correlationId }
      : {}),
    error: {
      code,
      message: error instanceof Error ? error.message : String(error)
    }
  };
}

export function createCounterpartyProjectionActionHandlersV010(input: {
  service: CounterpartyProjectionServiceV010;
  resolveEnterpriseRelationshipKind(
    principal: PlatformPrincipalV010,
    contextId: string
  ): EnterpriseContextRelationshipKindV010 | undefined;
}): AppActionHandler[] {
  const create = (
    commandCode: string,
    projectionId: CounterpartyProjectionIdV010
  ): AppActionHandler => ({
    packageId: COUNTERPARTY_PACKAGE_ID,
    featureId: COUNTERPARTY_FEATURE_ID,
    commandCode,
    async execute(
      _request: AppActionRequestV010,
      context?: PlatformRequestContextV010
    ): Promise<AppActionExecutionResultV010> {
      try {
        if (!context) throw new Error("REQUEST_CONTEXT_REQUIRED");
        const active = activeEnterpriseContext(context);
        const result = await input.service.read({
          contextId: active.contextId,
          projectionId,
          requestContext: context,
          enterpriseRelationshipKind:
            input.resolveEnterpriseRelationshipKind(
              context.principal,
              active.contextId
            )
        });
        return {
          ok: true,
          correlationId: context.correlationId,
          result: JSON.parse(JSON.stringify(result)) as JsonValue
        };
      } catch (error) {
        return failure(error, context);
      }
    }
  });

  return [
    create(
      COUNTERPARTY_MY_CUSTOMERS_READ_COMMAND_V010,
      COUNTERPARTY_MY_CUSTOMER_PROJECTION_V010
    ),
    create(
      COUNTERPARTY_MY_SUPPLIERS_READ_COMMAND_V010,
      COUNTERPARTY_MY_SUPPLIER_PROJECTION_V010
    )
  ];
}
