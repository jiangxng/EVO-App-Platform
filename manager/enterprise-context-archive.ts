import { randomUUID } from "node:crypto";
import type {
  AppActionExecutionResultV010,
  AppActionHandler,
  AppActionRequestV010
} from "../actions/contracts.js";
import type {
  AuthorizationProviderV010,
  PlatformRequestContextV010
} from "../contracts/platform-services.js";
import {
  HOST_ENTERPRISE_CONTEXT_FEATURE_ID,
  HOST_ENTERPRISE_CONTEXT_PACKAGE_ID
} from "../providers/enterprise-context/package.js";
import {
  ENTERPRISE_CONTEXT_ARCHIVE_COMMAND
} from "../apps/enterprise-context-governance/constants.js";
import type {
  EnterpriseContextGovernanceStoreV010
} from "./enterprise-context-governance-store.js";
import { authorizeMaterialWriteV010 } from "./material-write-authorization.js";

export function createEnterpriseContextArchiveActionHandlerV010(input: {
  store: EnterpriseContextGovernanceStoreV010;
  resolveAuthorizationProvider(): AuthorizationProviderV010 | undefined;
  now?: () => Date;
  id?: () => string;
}): AppActionHandler {
  const now = input.now ?? (() => new Date());
  const nextId = input.id ?? randomUUID;

  return {
    packageId: HOST_ENTERPRISE_CONTEXT_PACKAGE_ID,
    featureId: HOST_ENTERPRISE_CONTEXT_FEATURE_ID,
    commandCode: ENTERPRISE_CONTEXT_ARCHIVE_COMMAND,
    async execute(
      request: AppActionRequestV010,
      context?: PlatformRequestContextV010
    ): Promise<AppActionExecutionResultV010> {
      if (!context) {
        return {
          ok: false,
          error: {
            code: "REQUEST_CONTEXT_REQUIRED",
            message: "Archiving an Enterprise Context requires a request context."
          }
        };
      }
      if (context.principal.actorType !== "HUMAN") {
        return {
          ok: false,
          error: {
            code: "ENTERPRISE_CONTEXT_ARCHIVE_HUMAN_REQUIRED",
            message: "Only a Human Principal may archive an Enterprise Context."
          }
        };
      }
      if (request.requiresConfirmation !== true) {
        return {
          ok: false,
          correlationId: context.correlationId,
          error: {
            code: "MATERIAL_WRITE_CONFIRMATION_REQUIRED",
            message: "Archiving an Enterprise Context requires explicit confirmation."
          }
        };
      }

      const raw = request.values.targetContextId;
      const targetContextId = typeof raw === "string" ? raw.trim() : "";
      if (!targetContextId) {
        return {
          ok: false,
          correlationId: context.correlationId,
          error: {
            code: "ENTERPRISE_CONTEXT_ARCHIVE_TARGET_REQUIRED",
            message: "Choose an Enterprise Context to archive."
          }
        };
      }

      try {
        const snapshot = input.store.snapshot();
        const targetIndex = snapshot.contexts.findIndex(
          item => item.contextId === targetContextId
        );
        if (targetIndex < 0) {
          throw new Error("ENTERPRISE_GOVERNANCE_CONTEXT_NOT_FOUND");
        }
        const target = snapshot.contexts[targetIndex]!;
        if (target.lifecycleState !== "ACTIVE") {
          throw new Error("ENTERPRISE_CONTEXT_NOT_ACTIVE");
        }

        const owner = snapshot.relationships.some(item =>
          item.contextId === targetContextId
          && item.subjectId === context.principal.subjectId
          && item.kind === "OWNER"
          && item.state === "ACTIVE"
        );
        if (!owner) {
          throw new Error("ENTERPRISE_CONTEXT_ARCHIVE_OWNER_REQUIRED");
        }

        const authorization = await authorizeMaterialWriteV010(
          input.resolveAuthorizationProvider(),
          context,
          {
            action: ENTERPRISE_CONTEXT_ARCHIVE_COMMAND,
            resource: {
              type: "enterprise.context",
              id: targetContextId,
              attributes: {
                enterpriseId: target.enterpriseId,
                lifecycleState: target.lifecycleState
              }
            }
          }
        );
        if (!authorization.allowed) {
          throw new Error(
            (authorization.reasonCodes[0] ?? "MATERIAL_WRITE_DENIED")
            + ": denied by '" + authorization.policyProviderId + "' "
            + authorization.reasonCodes.join(", ")
          );
        }

        const occurredAt = now().toISOString();
        const contexts = snapshot.contexts.map((item, index) =>
          index === targetIndex
            ? { ...item, lifecycleState: "ARCHIVED" as const }
            : item
        );

        input.store.save({
          ...snapshot,
          contexts,
          defaultContexts: snapshot.defaultContexts.filter(
            item => item.contextId !== targetContextId
          ),
          lifecycleEvents: [
            ...snapshot.lifecycleEvents,
            {
              contractVersion: "0.1.0",
              eventId: "lifecycle:" + nextId(),
              contextId: targetContextId,
              from: "ACTIVE",
              to: "ARCHIVED",
              occurredAt,
              actorSubjectId: context.principal.subjectId
            }
          ]
        });

        return {
          ok: true,
          correlationId: context.correlationId,
          result: {
            message: "Enterprise Context archived.",
            archivedContextId: targetContextId,
            archivedEnterpriseId: target.enterpriseId,
            navigateTo: "/enterprise-contexts"
          }
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        const [candidate] = message.split(":");
        return {
          ok: false,
          correlationId: context.correlationId,
          error: {
            code: candidate && /^[A-Z0-9_]+$/u.test(candidate)
              ? candidate
              : "ENTERPRISE_CONTEXT_ARCHIVE_FAILED",
            message
          }
        };
      }
    }
  };
}
