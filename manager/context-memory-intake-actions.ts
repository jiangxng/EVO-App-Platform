import type {
  AppActionExecutionResultV010,
  AppActionHandler,
  AppActionRequestV010
} from "../actions/contracts.js";
import type {
  AuthorizationProviderV010,
  ContextMemoryIntakeSourceAdapterV010,
  EnterpriseContextRelationshipProviderV010,
  PlatformRequestContextV010
} from "../contracts/platform-services.js";
import {
  HOST_MEMORY_INTAKE_FEATURE_ID,
  HOST_MEMORY_INTAKE_PACKAGE_ID
} from "../providers/memory-intake/package.js";
import {
  requireContextMemoryWriteAuthorityV010
} from "./context-memory-authority.js";
import type {
  ContextMemoryIntakeServiceV010
} from "./context-memory-intake-service.js";
import { authorizeMaterialWriteV010 } from "./material-write-authorization.js";

export const CONTEXT_MEMORY_INTAKE_RUN_ACTION = "context.memory.intake.run";

export interface ContextMemoryIntakeActionDependenciesV010 {
  service: ContextMemoryIntakeServiceV010;
  resolveAuthorizationProvider(): AuthorizationProviderV010 | undefined;
  resolveRelationshipProvider(): EnterpriseContextRelationshipProviderV010 | undefined;
  resolveSourceAdapter(): ContextMemoryIntakeSourceAdapterV010 | undefined;
}

function errorResult(error: unknown): AppActionExecutionResultV010 {
  const message = error instanceof Error ? error.message : String(error);
  const [candidate] = message.split(":");
  return {
    ok: false,
    error: {
      code: candidate && /^[A-Z0-9_]+$/.test(candidate)
        ? candidate
        : "CONTEXT_MEMORY_INTAKE_ACTION_FAILED",
      message
    }
  };
}

export function createContextMemoryIntakeActionHandlerV010(
  dependencies: ContextMemoryIntakeActionDependenciesV010
): AppActionHandler {
  return {
    packageId: HOST_MEMORY_INTAKE_PACKAGE_ID,
    featureId: HOST_MEMORY_INTAKE_FEATURE_ID,
    commandCode: CONTEXT_MEMORY_INTAKE_RUN_ACTION,
    async execute(request: AppActionRequestV010, requestContext?: PlatformRequestContextV010) {
      try {
        if (!requestContext) throw new Error("REQUEST_CONTEXT_REQUIRED");
        if (requestContext.principal.actorType !== "HUMAN") {
          throw new Error("CONTEXT_MEMORY_INTAKE_HUMAN_REQUIRED");
        }
        if (request.requiresConfirmation !== true) {
          throw new Error("MATERIAL_WRITE_CONFIRMATION_REQUIRED");
        }
        const context = requestContext.context?.activeContext;
        if (!context) throw new Error("CONTEXT_MEMORY_ACTIVE_CONTEXT_REQUIRED");

        requireContextMemoryWriteAuthorityV010({
          principal: requestContext.principal,
          personalContext: requestContext.context?.personalContext,
          targetContext: context,
          relationshipProvider: dependencies.resolveRelationshipProvider()
        });

        const sourceAdapter = dependencies.resolveSourceAdapter();
        if (!sourceAdapter) {
          throw new Error("CONTEXT_MEMORY_INTAKE_SOURCE_REQUIRED");
        }

        const decision = await authorizeMaterialWriteV010(
          dependencies.resolveAuthorizationProvider(),
          requestContext,
          {
            action: CONTEXT_MEMORY_INTAKE_RUN_ACTION,
            resource: {
              type: "context.memory.intake",
              id: sourceAdapter.sourceId,
              attributes: {
                contextId: context.contextId,
                contextKind: context.kind,
                sourceId: sourceAdapter.sourceId
              }
            }
          }
        );
        if (!decision.allowed) {
          throw new Error(
            `${decision.reasonCodes[0] ?? "MATERIAL_WRITE_DENIED"}: denied by '${decision.policyProviderId}' ${decision.reasonCodes.join(", ")}`
          );
        }

        const rawLimit = request.values.limit;
        if (
          rawLimit !== undefined
          && (
            typeof rawLimit !== "number"
            || !Number.isInteger(rawLimit)
            || rawLimit < 1
            || rawLimit > 500
          )
        ) {
          throw new Error("CONTEXT_MEMORY_INTAKE_LIMIT_INVALID");
        }
        const rawCursor = request.values.cursor;
        if (
          rawCursor !== undefined
          && (typeof rawCursor !== "string" || !rawCursor.trim())
        ) {
          throw new Error("CONTEXT_MEMORY_INTAKE_CURSOR_INVALID");
        }

        const result = await dependencies.service.run({
          principal: requestContext.principal,
          context,
          ...(typeof rawCursor === "string" ? { cursor: rawCursor.trim() } : {}),
          ...(typeof rawLimit === "number" ? { limit: rawLimit } : {})
        });

        return {
          ok: true,
          correlationId: requestContext.correlationId,
          result: JSON.parse(JSON.stringify(result))
        };
      } catch (error) {
        return errorResult(error);
      }
    }
  };
}
