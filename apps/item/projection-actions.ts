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
  ITEM_DIRECTORY_READ_COMMAND_V010,
  ITEM_FEATURE_ID,
  ITEM_MY_ITEMS_READ_COMMAND_V010,
  ITEM_PACKAGE_ID
} from "./constants.js";
import {
  ITEM_DIRECTORY_PROJECTION_V010,
  ITEM_MY_ITEMS_PROJECTION_V010,
  type ItemProjectionIdV010
} from "./projections.js";
import type {
  ItemProjectionServiceV010
} from "./projection-service.js";

function activeEnterpriseContext(
  context: PlatformRequestContextV010 | undefined
): { contextId: string } {
  const active = context?.context?.activeContext;
  if (!context || !active || active.kind !== "ENTERPRISE") {
    throw new Error("ITEM_ENTERPRISE_CONTEXT_REQUIRED");
  }
  return { contextId: active.contextId };
}

function failure(
  error: unknown,
  context?: PlatformRequestContextV010
): AppActionExecutionResultV010 {
  const code = error instanceof Error
    ? error.message.split(":")[0]
    : "ITEM_PROJECTION_READ_FAILED";
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

export function createItemProjectionActionHandlersV010(input: {
  service: ItemProjectionServiceV010;
  resolveEnterpriseRelationshipKind(
    principal: PlatformPrincipalV010,
    contextId: string
  ): EnterpriseContextRelationshipKindV010 | undefined;
}): AppActionHandler[] {
  const create = (
    commandCode: string,
    projectionId: ItemProjectionIdV010
  ): AppActionHandler => ({
    packageId: ITEM_PACKAGE_ID,
    featureId: ITEM_FEATURE_ID,
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
    create(ITEM_DIRECTORY_READ_COMMAND_V010, ITEM_DIRECTORY_PROJECTION_V010),
    create(ITEM_MY_ITEMS_READ_COMMAND_V010, ITEM_MY_ITEMS_PROJECTION_V010)
  ];
}
