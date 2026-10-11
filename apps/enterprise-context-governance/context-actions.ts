import type {
  AppActionExecutionResultV010,
  AppActionHandler,
  AppActionRequestV010,
  JsonValue
} from "../../actions/contracts.js";
import type {
  ActiveContextRefV010,
  PlatformPrincipalV010,
  PlatformRequestContextV010
} from "../../contracts/platform-services.js";
import {
  ENTERPRISE_CONTEXT_GOVERNANCE_APP_FEATURE_ID,
  ENTERPRISE_CONTEXT_GOVERNANCE_APP_PACKAGE_ID,
  ENTERPRISE_CONTEXT_SELECT_COMMAND
} from "./constants.js";

export function createEnterpriseContextSelectionActionHandlerV010(input: {
  listAvailableContexts(
    principal: PlatformPrincipalV010
  ): ActiveContextRefV010[];
}): AppActionHandler {
  return {
    packageId: ENTERPRISE_CONTEXT_GOVERNANCE_APP_PACKAGE_ID,
    featureId: ENTERPRISE_CONTEXT_GOVERNANCE_APP_FEATURE_ID,
    commandCode: ENTERPRISE_CONTEXT_SELECT_COMMAND,
    async execute(
      request: AppActionRequestV010,
      context?: PlatformRequestContextV010
    ): Promise<AppActionExecutionResultV010> {
      if (!context) {
        return {
          ok: false,
          error: {
            code: "REQUEST_CONTEXT_REQUIRED",
            message: "Enterprise Context selection requires a request context."
          }
        };
      }

      const raw = request.values.targetContextId;
      const targetContextId =
        typeof raw === "string" ? raw.trim() : "";
      const target = input.listAvailableContexts(context.principal)
        .find(item =>
          item.kind === "ENTERPRISE"
          && item.contextId === targetContextId
        );

      if (!target || target.kind !== "ENTERPRISE") {
        return {
          ok: false,
          correlationId: context.correlationId,
          error: {
            code: "ENTERPRISE_CONTEXT_NOT_AVAILABLE",
            message: "The selected Enterprise Context is not available."
          }
        };
      }

      return {
        ok: true,
        correlationId: context.correlationId,
        result: JSON.parse(JSON.stringify({
          message: "Enterprise Context selected.",
          selectedContextId: target.contextId,
          selectedEnterpriseId: target.enterpriseId,
          navigateTo:
            typeof request.values.navigateTo === "string"
              ? request.values.navigateTo
              : undefined
        })) as JsonValue
      };
    }
  };
}
