import type {
  AppActionExecutionResultV010,
  AppActionHandler,
  AppActionRequestV010
} from "../actions/contracts.js";
import {
  ENTERPRISE_CONTEXT_DEFAULT_SET_COMMAND_V010
} from "../contracts/enterprise-context-preference.js";
import type {
  ActiveContextRefV010,
  PlatformPrincipalV010,
  PlatformRequestContextV010
} from "../contracts/platform-services.js";
import {
  HOST_ENTERPRISE_CONTEXT_FEATURE_ID,
  HOST_ENTERPRISE_CONTEXT_PACKAGE_ID
} from "../providers/enterprise-context/package.js";
import type {
  EnterpriseContextGovernanceStoreV010
} from "./enterprise-context-governance-store.js";

export function createEnterpriseContextDefaultActionHandlerV010(input: {
  store: EnterpriseContextGovernanceStoreV010;
  listAvailableContexts(
    principal: PlatformPrincipalV010
  ): ActiveContextRefV010[];
  now?: () => Date;
}): AppActionHandler {
  return {
    packageId: HOST_ENTERPRISE_CONTEXT_PACKAGE_ID,
    featureId: HOST_ENTERPRISE_CONTEXT_FEATURE_ID,
    commandCode: ENTERPRISE_CONTEXT_DEFAULT_SET_COMMAND_V010,
    async execute(
      request: AppActionRequestV010,
      context?: PlatformRequestContextV010
    ): Promise<AppActionExecutionResultV010> {
      if (!context) {
        return {
          ok: false,
          error: {
            code: "REQUEST_CONTEXT_REQUIRED",
            message: "Setting the default Enterprise Context requires a request context."
          }
        };
      }
      if (context.principal.actorType !== "HUMAN") {
        return {
          ok: false,
          error: {
            code: "ENTERPRISE_CONTEXT_DEFAULT_HUMAN_REQUIRED",
            message: "Only a Human Principal may set the default Enterprise Context."
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
            code: "ENTERPRISE_CONTEXT_DEFAULT_NOT_AVAILABLE",
            message: "The selected Enterprise Context is not available."
          }
        };
      }

      const snapshot = input.store.snapshot();
      const selectedAt = (input.now ?? (() => new Date()))().toISOString();
      input.store.save({
        ...snapshot,
        defaultContexts: [
          ...snapshot.defaultContexts.filter(
            item => item.subjectId !== context.principal.subjectId
          ),
          {
            contractVersion: "0.1.0",
            subjectId: context.principal.subjectId,
            contextId: target.contextId,
            selectedAt,
            selectedBySubjectId: context.principal.subjectId
          }
        ]
      });

      return {
        ok: true,
        correlationId: context.correlationId,
        result: {
          message: "Default Enterprise Context updated.",
          defaultContextId: target.contextId,
          defaultEnterpriseId: target.enterpriseId
        }
      };
    }
  };
}
