import type {
  AppActionExecutionResultV010,
  AppActionHandler,
  AppActionRequestV010,
  JsonValue
} from "../../actions/contracts.js";
import type {
  AuthorizationProviderV010,
  PlatformRequestContextV010
} from "../../contracts/platform-services.js";
import type {
  EnterpriseTemplateTransferProviderV010
} from "../../contracts/template-transfer.js";
import {
  authorizeMaterialWriteV010
} from "../../manager/material-write-authorization.js";
import {
  TEMPLATE_STORE_FEATURE_ID,
  TEMPLATE_STORE_PACKAGE_ID
} from "./package.js";
import type {
  TemplateStoreRepositoryV010
} from "./repository.js";

export const TEMPLATE_STORE_COPY_COMMAND = "evo-template-store.copy";
export const TEMPLATE_STORE_COPY_AUTHORIZATION_ACTION = "template.store.copy";

export interface TemplateStoreCopyActionDependenciesV010 {
  store: TemplateStoreRepositoryV010;
  transfer: EnterpriseTemplateTransferProviderV010;
  resolveAuthorizationProvider(): AuthorizationProviderV010 | undefined;
  now?: () => Date;
}

function failure(error: unknown): AppActionExecutionResultV010 {
  const message = error instanceof Error ? error.message : String(error);
  const [candidate] = message.split(":");
  return {
    ok: false,
    error: {
      code: candidate && /^[A-Z0-9_]+$/.test(candidate)
        ? candidate
        : "TEMPLATE_STORE_COPY_FAILED",
      message
    }
  };
}

function requireContext(
  context: PlatformRequestContextV010 | undefined
): PlatformRequestContextV010 {
  if (!context) throw new Error("REQUEST_CONTEXT_REQUIRED");
  return context;
}

function requireHuman(context: PlatformRequestContextV010): void {
  if (context.principal.actorType !== "HUMAN") {
    throw new Error("TEMPLATE_STORE_COPY_HUMAN_REQUIRED");
  }
}

function requireConfirmation(request: AppActionRequestV010): void {
  if (request.requiresConfirmation !== true) {
    throw new Error("MATERIAL_WRITE_CONFIRMATION_REQUIRED");
  }
}

function activeEnterpriseId(context: PlatformRequestContextV010): string {
  const active = context.context?.activeContext;
  if (!active || active.kind !== "ENTERPRISE" || !active.enterpriseId.trim()) {
    throw new Error("ENTERPRISE_ACTIVE_CONTEXT_REQUIRED");
  }
  return active.enterpriseId.trim();
}

function stringValue(
  values: Record<string, JsonValue>,
  key: string
): string {
  const value = values[key];
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`TEMPLATE_STORE_COPY_FIELD_INVALID: ${key}`);
  }
  return value.trim();
}

function positiveInteger(
  values: Record<string, JsonValue>,
  key: string
): number {
  const value = values[key];
  if (
    typeof value !== "number"
    || !Number.isInteger(value)
    || value < 1
  ) {
    throw new Error(`TEMPLATE_STORE_COPY_FIELD_INVALID: ${key}`);
  }
  return value;
}

export function createTemplateStoreCopyActionHandlerV010(
  dependencies: TemplateStoreCopyActionDependenciesV010
): AppActionHandler {
  return {
    packageId: TEMPLATE_STORE_PACKAGE_ID,
    featureId: TEMPLATE_STORE_FEATURE_ID,
    commandCode: TEMPLATE_STORE_COPY_COMMAND,

    async execute(request, suppliedContext) {
      try {
        const context = requireContext(suppliedContext);
        requireHuman(context);
        requireConfirmation(request);

        const templateId = stringValue(request.values, "templateId");
        const templateVersion = positiveInteger(
          request.values,
          "templateVersion"
        );
        const targetDefinitionId = stringValue(
          request.values,
          "targetDefinitionId"
        );
        const targetEnterpriseId = activeEnterpriseId(context);

        const record = dependencies.store.getVersion(
          templateId,
          templateVersion
        );
        if (!record) throw new Error("TEMPLATE_STORE_VERSION_NOT_FOUND");

        const authorization = await authorizeMaterialWriteV010(
          dependencies.resolveAuthorizationProvider(),
          context,
          {
            action: TEMPLATE_STORE_COPY_AUTHORIZATION_ACTION,
            resource: {
              type: "template.store.entry",
              id: templateId,
              attributes: {
                templateVersion,
                targetEnterpriseId,
                targetDefinitionId
              }
            }
          }
        );
        if (!authorization.allowed) {
          throw new Error(
            `${authorization.reasonCodes[0] ?? "MATERIAL_WRITE_DENIED"}: `
            + `denied by '${authorization.policyProviderId}' `
            + authorization.reasonCodes.join(", ")
          );
        }

        const copied = dependencies.transfer.copyIntoEnterprise({
          bundle: record.bundle,
          targetEnterpriseId,
          targetDefinitionId,
          sourceRef: `template-store:${templateId}@${templateVersion}`,
          actor: {
            actorType: "HUMAN",
            subjectId: context.principal.subjectId
          },
          recordedAt: (dependencies.now ?? (() => new Date()))().toISOString()
        });

        return {
          ok: true,
          correlationId: context.correlationId,
          result: JSON.parse(JSON.stringify({
            templateId,
            templateVersion,
            targetEnterpriseId,
            targetDefinitionId,
            copiedRevision: copied.revision,
            copiedState: copied.state,
            origin: copied.origin
          })) as JsonValue
        };
      } catch (error) {
        return failure(error);
      }
    }
  };
}
