import type {
  AppActionExecutionResultV010,
  AppActionHandler,
  AppActionRequestV010,
  JsonValue
} from "../../actions/contracts.js";
import {
  authorizeMaterialWriteV010
} from "../../manager/material-write-authorization.js";
import type {
  BusinessDefinitionRepositoryV010
} from "../../contracts/enterprise-business-definition.js";
import {
  definition2dPreviewRouteV010,
  type DefinitionProjectionSessionStoreV010
} from "../../contracts/definition-projection.js";
import type {
  AuthorizationProviderV010,
  PlatformPrincipalV010,
  PlatformRequestContextV010
} from "../../contracts/platform-services.js";
import {
  createLedgerRuntimeConfiguratorService
} from "../ledger-runtime-configurator/service.js";
import type {
  LedgerRuntimeTemplateV010
} from "../ledger-runtime-configurator/contracts.js";
import type {
  CompiledLedgerRuntimeConfigurationV010
} from "../ledger-runtime-configurator/expression-compiler.js";
import {
  LEDGER_MANAGER_DEFINITION_KIND,
  LEDGER_MANAGER_FEATURE_ID,
  LEDGER_MANAGER_OPEN_DETAIL_COMMAND,
  LEDGER_MANAGER_PACKAGE_ID,
  LEDGER_MANAGER_PREVIEW_PROJECTION_COMMAND,
  LEDGER_MANAGER_PUBLISH_AUTHORIZATION_ACTION,
  LEDGER_MANAGER_PUBLISH_COMMAND,
  ledgerManagerDetailRouteV010
} from "./constants.js";
import {
  ledgerManagerVersionLabelV010
} from "./page.js";

function errorResult(
  request: AppActionRequestV010,
  error: unknown
): AppActionExecutionResultV010 {
  const message = error instanceof Error ? error.message : String(error);
  const [candidate] = message.split(":");
  return {
    ok: false,
    correlationId: request.sourceInteractionId,
    error: {
      code: candidate && /^[A-Z0-9_]+$/u.test(candidate)
        ? candidate
        : "LEDGER_MANAGER_ACTION_FAILED",
      message
    }
  };
}

function success(
  request: AppActionRequestV010,
  value: unknown
): AppActionExecutionResultV010 {
  return {
    ok: true,
    correlationId: request.sourceInteractionId,
    result: JSON.parse(JSON.stringify(value)) as JsonValue
  };
}

function enterpriseScope(context: PlatformRequestContextV010): {
  contextId: string;
  enterpriseId: string;
  subjectId: string;
} {
  const active = context.context?.activeContext;
  if (active?.kind !== "ENTERPRISE") {
    throw new Error("LEDGER_MANAGER_ENTERPRISE_CONTEXT_REQUIRED");
  }
  if (context.principal.actorType !== "HUMAN") {
    throw new Error("LEDGER_MANAGER_HUMAN_REQUIRED");
  }
  return {
    contextId: active.contextId,
    enterpriseId: active.enterpriseId,
    subjectId: context.principal.subjectId
  };
}

function stringValue(values: Record<string, JsonValue>, key: string): string {
  const value = values[key];
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`LEDGER_MANAGER_FIELD_INVALID: ${key}`);
  }
  return value.trim();
}

function revisionValue(
  values: Record<string, JsonValue>,
  key = "definitionRevision"
): number {
  const value = values[key];
  if (typeof value !== "number" || !Number.isInteger(value) || value < 0) {
    throw new Error("LEDGER_MANAGER_REVISION_INVALID");
  }
  return value;
}

function sessionKeys(context: PlatformRequestContextV010): string[] {
  return [
    context.principal.sessionId?.trim(),
    context.principal.subjectId.trim()
  ].filter((value, index, values): value is string =>
    Boolean(value) && values.indexOf(value) === index
  );
}

function handler(
  commandCode: string,
  execute: (
    request: AppActionRequestV010,
    context: PlatformRequestContextV010
  ) => Promise<AppActionExecutionResultV010>
): AppActionHandler {
  return {
    packageId: LEDGER_MANAGER_PACKAGE_ID,
    featureId: LEDGER_MANAGER_FEATURE_ID,
    commandCode,
    async execute(request, context) {
      if (!context) {
        return errorResult(request, new Error("REQUEST_CONTEXT_REQUIRED"));
      }
      try {
        return await execute(request, context);
      } catch (error) {
        return errorResult(request, error);
      }
    }
  };
}

function ledgerRevision(input: {
  repository: BusinessDefinitionRepositoryV010;
  enterpriseId: string;
  definitionId: string;
  revision: number;
}) {
  const item = input.repository.listHistory({
    enterpriseId: input.enterpriseId,
    definitionId: input.definitionId
  }).find(candidate => candidate.revision === input.revision);
  if (!item) throw new Error("LEDGER_MANAGER_DEFINITION_NOT_FOUND");
  if (item.kind !== LEDGER_MANAGER_DEFINITION_KIND) {
    throw new Error("LEDGER_MANAGER_DEFINITION_KIND_INVALID");
  }
  return item;
}

export function createLedgerManagerActionHandlersV010(input: {
  repository: BusinessDefinitionRepositoryV010;
  projectionSessions: DefinitionProjectionSessionStoreV010;
  resolveAuthorizationProvider(): AuthorizationProviderV010 | undefined;
  canManageEnterpriseContext(
    principal: PlatformPrincipalV010,
    contextId: string
  ): boolean;
  viewerAvailable(): boolean;
  publishToLedgerRuntime(args: {
    enterpriseId: string;
    enterpriseDisplayName?: string;
    compiled: CompiledLedgerRuntimeConfigurationV010;
  }): Promise<unknown>;
  resolveEnterpriseDisplayName?(enterpriseId: string): string | undefined;
  now?: () => Date;
}): AppActionHandler[] {
  const now = input.now ?? (() => new Date());

  return [
    handler(
      LEDGER_MANAGER_OPEN_DETAIL_COMMAND,
      async (request, context) => {
        const scope = enterpriseScope(context);
        const definitionId = stringValue(request.values, "definitionId");
        const definitionRevision = revisionValue(request.values);
        const revision = ledgerRevision({
          repository: input.repository,
          enterpriseId: scope.enterpriseId,
          definitionId,
          revision: definitionRevision
        });
        const selection = {
          contractVersion: "0.1.0" as const,
          enterpriseId: scope.enterpriseId,
          definitionId,
          definitionRevision,
          selectedAt: now().toISOString()
        };
        for (const key of sessionKeys(context)) {
          input.projectionSessions.set(key, selection);
        }
        return success(request, {
          message: `Opening ${ledgerManagerVersionLabelV010(revision.revision)} for “${revision.title}”.`,
          navigateTo: ledgerManagerDetailRouteV010(
            definitionId,
            definitionRevision
          )
        });
      }
    ),

    handler(
      LEDGER_MANAGER_PREVIEW_PROJECTION_COMMAND,
      async (request, context) => {
        const scope = enterpriseScope(context);
        if (!input.viewerAvailable()) {
          throw new Error("LEDGER_MANAGER_2D_VIEWER_NOT_AVAILABLE");
        }
        const definitionId = stringValue(request.values, "definitionId");
        const definitionRevision = revisionValue(request.values);
        const projectionId = stringValue(request.values, "projectionId");
        const revision = ledgerRevision({
          repository: input.repository,
          enterpriseId: scope.enterpriseId,
          definitionId,
          revision: definitionRevision
        });
        if (
          !revision.projectionGallery?.projections.some(
            projection => projection.projectionId === projectionId
          )
        ) {
          throw new Error("LEDGER_MANAGER_PROJECTION_NOT_FOUND");
        }
        const selection = {
          contractVersion: "0.1.0" as const,
          enterpriseId: scope.enterpriseId,
          definitionId,
          definitionRevision,
          projectionId,
          selectedAt: now().toISOString()
        };
        for (const key of sessionKeys(context)) {
          input.projectionSessions.set(key, selection);
        }
        return success(request, {
          message: `Opening 2D projection “${projectionId}”.`,
          navigateTo: definition2dPreviewRouteV010({
            definitionId,
            definitionRevision,
            projectionId
          })
        });
      }
    ),

    handler(
      LEDGER_MANAGER_PUBLISH_COMMAND,
      async (request, context) => {
        const scope = enterpriseScope(context);
        if (request.requiresConfirmation !== true) {
          throw new Error("LEDGER_MANAGER_PUBLISH_CONFIRMATION_REQUIRED");
        }
        if (
          !input.canManageEnterpriseContext(
            context.principal,
            scope.contextId
          )
        ) {
          throw new Error("LEDGER_MANAGER_MANAGE_ROLE_REQUIRED");
        }

        const definitionId = stringValue(request.values, "definitionId");
        const definitionRevision = revisionValue(request.values);
        const revision = ledgerRevision({
          repository: input.repository,
          enterpriseId: scope.enterpriseId,
          definitionId,
          revision: definitionRevision
        });

        const authorization = await authorizeMaterialWriteV010(
          input.resolveAuthorizationProvider(),
          context,
          {
            action: LEDGER_MANAGER_PUBLISH_AUTHORIZATION_ACTION,
            resource: {
              type: "ledger.definition",
              id: definitionId,
              attributes: {
                revision: definitionRevision,
                enterpriseId: scope.enterpriseId
              }
            }
          }
        );
        if (!authorization.allowed) {
          throw new Error(
            `${authorization.reasonCodes[0] ?? "MATERIAL_WRITE_DENIED"}: denied by '${authorization.policyProviderId}' ${authorization.reasonCodes.join(", ")}`
          );
        }

        const template = revision.payload as unknown as LedgerRuntimeTemplateV010;
        const compiler = createLedgerRuntimeConfiguratorService();
        const validation = compiler.importTemplate(template);
        if (!validation.ok || !validation.burn.ready) {
          throw new Error(
            "LEDGER_MANAGER_TEMPLATE_NOT_RUNTIME_READY: "
            + JSON.stringify({
                errors: validation.errors,
                blockers: validation.burn.blockers
              })
          );
        }
        const compiled = compiler.compileCurrent();
        const runtimeResult = await input.publishToLedgerRuntime({
          enterpriseId: scope.enterpriseId,
          enterpriseDisplayName:
            input.resolveEnterpriseDisplayName?.(scope.enterpriseId),
          compiled
        });

        return success(request, {
          message:
            `Published “${revision.title}” ${ledgerManagerVersionLabelV010(revision.revision)} to Ledger Runtime.`,
          definitionId,
          definitionRevision,
          version: ledgerManagerVersionLabelV010(revision.revision),
          semanticDigest: compiled.semanticDigest,
          runtime: runtimeResult
        });
      }
    )
  ];
}
