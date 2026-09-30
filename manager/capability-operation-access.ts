import type {
  AppActionExecutionResultV010,
  AppActionRequestV010,
  JsonValue
} from "../actions/contracts.js";
import type { AppActionPreExecuteV010 } from "../actions/router.js";
import type {
  ActivationScope,
  CapabilityOperationExposureV010,
  PlatformCapabilityOperationContributionV010
} from "../contracts/package.js";
import type {
  AuthorizationDecisionV010,
  AuthorizationProviderV010,
  PlatformActorType,
  PlatformRequestContextV010,
  PlatformScopeV010
} from "../contracts/platform-services.js";
import { legacyScopeFromRequestContextV010 } from "./material-write-authorization.js";
import type { AppManagerService } from "./service.js";

export type EffectiveCapabilityOperationV010 =
  PlatformCapabilityOperationContributionV010["operation"] & {
    packageId: string;
    featureId: string;
  };

export interface CapabilityOperationAccessEvaluationV010 {
  contractVersion: "0.1.0";
  operationId: string;
  allowed: boolean;
  policyProviderId: string;
  reasonCodes: string[];
}

export interface AuthorizedCapabilityOperationCatalogV010 {
  contractVersion: "0.1.0";
  audience: CapabilityOperationExposureV010;
  operations: EffectiveCapabilityOperationV010[];
  evaluations: CapabilityOperationAccessEvaluationV010[];
}

function denied(
  operationId: string,
  reasonCode: string,
  policyProviderId = "host.capability-operation-access"
): CapabilityOperationAccessEvaluationV010 {
  return {
    contractVersion: "0.1.0",
    operationId,
    allowed: false,
    policyProviderId,
    reasonCodes: [reasonCode]
  };
}

function allowedFromDecision(
  operationId: string,
  decision: AuthorizationDecisionV010
): CapabilityOperationAccessEvaluationV010 {
  return {
    contractVersion: "0.1.0",
    operationId,
    allowed: decision.allowed,
    policyProviderId: decision.policyProviderId,
    reasonCodes: [...decision.reasonCodes]
  };
}

function dataScopeId(
  dataScope: ActivationScope,
  scope: PlatformScopeV010
): string | undefined {
  switch (dataScope) {
    case "ENTERPRISE":
      return scope.enterpriseId;
    case "COMPANY":
      return scope.companyId;
    case "WORKSPACE":
      return scope.workspaceId;
    case "USER":
      return scope.userId;
    case "SYSTEM":
    case "INSTALLATION":
      return undefined;
  }
}

function dataScopeAvailable(
  dataScope: ActivationScope,
  scope: PlatformScopeV010
): boolean {
  switch (dataScope) {
    case "ENTERPRISE":
      return typeof scope.enterpriseId === "string" && scope.enterpriseId.length > 0;
    case "COMPANY":
      return typeof scope.companyId === "string" && scope.companyId.length > 0;
    case "WORKSPACE":
      return typeof scope.workspaceId === "string" && scope.workspaceId.length > 0;
    case "USER":
      return typeof scope.userId === "string" && scope.userId.length > 0;
    case "SYSTEM":
    case "INSTALLATION":
      return true;
  }
}

function inputResourceId(
  request: AppActionRequestV010,
  key: string
): string | undefined {
  const value = request.values[key];
  if (typeof value === "string") {
    const normalized = value.trim();
    return normalized || undefined;
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }
  return undefined;
}

function resourceIdFor(
  operation: EffectiveCapabilityOperationV010,
  scope: PlatformScopeV010,
  request?: AppActionRequestV010
): string | undefined {
  const source = operation.authorization.resource.idSource;
  switch (source) {
    case "NONE":
      return undefined;
    case "DATA_SCOPE":
      return dataScopeId(operation.dataScope, scope);
    case "INPUT":
      return request && operation.authorization.resource.inputKey
        ? inputResourceId(request, operation.authorization.resource.inputKey)
        : undefined;
  }
}

function activeContextMetadata(
  context: PlatformRequestContextV010
): Record<string, string | number | boolean | null> {
  const active = context.context?.activeContext;
  return {
    correlationId: context.correlationId,
    ...(active ? {
      activeContextKind: active.kind,
      activeContextId: active.contextId
    } : {})
  };
}

async function evaluateAuthorization(
  operation: EffectiveCapabilityOperationV010,
  provider: AuthorizationProviderV010 | undefined,
  context: PlatformRequestContextV010,
  request?: AppActionRequestV010
): Promise<CapabilityOperationAccessEvaluationV010> {
  const scope = legacyScopeFromRequestContextV010(context);

  if (!dataScopeAvailable(operation.dataScope, scope)) {
    return denied(
      operation.operationId,
      "CAPABILITY_OPERATION_DATA_SCOPE_UNAVAILABLE"
    );
  }

  if (
    operation.authorization.resource.idSource === "INPUT"
    && request
    && !resourceIdFor(operation, scope, request)
  ) {
    return denied(
      operation.operationId,
      "CAPABILITY_OPERATION_RESOURCE_ID_REQUIRED"
    );
  }

  if (!provider) {
    return denied(
      operation.operationId,
      "AUTHORIZATION_PROVIDER_REQUIRED",
      "host.missing-authorization-provider"
    );
  }

  try {
    const id = resourceIdFor(operation, scope, request);
    const decision = await provider.check({
      contractVersion: "0.1.0",
      principal: context.principal,
      scope,
      action: operation.authorization.action,
      resource: {
        type: operation.authorization.resource.type,
        ...(id ? { id } : {}),
        attributes: {
          operationId: operation.operationId,
          capability: operation.capability,
          dataScope: operation.dataScope
        }
      },
      context: {
        ...activeContextMetadata(context),
        packageId: operation.packageId,
        featureId: operation.featureId,
        operationId: operation.operationId,
        capability: operation.capability,
        dataScope: operation.dataScope
      }
    });
    return allowedFromDecision(operation.operationId, decision);
  } catch {
    return denied(
      operation.operationId,
      "AUTHORIZATION_PROVIDER_ERROR",
      provider.providerId
    );
  }
}

function audienceForContext(
  context: PlatformRequestContextV010
): CapabilityOperationExposureV010 {
  if (context.delegatedActor?.kind === "EXTERNAL_AGENT") {
    return "EXTERNAL_AGENT";
  }
  switch (context.principal.actorType) {
    case "HUMAN":
      return "HUMAN";
    case "AI":
      return "PERSONAL_AGENT";
    case "AUTOMATION":
    case "SERVICE":
      return "AUTOMATION";
  }
}

export async function listAuthorizedCapabilityOperationsV010(input: {
  manager: AppManagerService;
  authorizationProvider: AuthorizationProviderV010 | undefined;
  requestContext: PlatformRequestContextV010;
  audience: CapabilityOperationExposureV010;
  capability?: string;
}): Promise<AuthorizedCapabilityOperationCatalogV010> {
  const effective = input.manager.listEffectiveCapabilityOperations(
    input.capability
  );
  const evaluations: CapabilityOperationAccessEvaluationV010[] = [];
  const operations: EffectiveCapabilityOperationV010[] = [];

  for (const operation of effective) {
    if (!operation.exposure.includes(input.audience)) {
      evaluations.push(
        denied(operation.operationId, "CAPABILITY_OPERATION_EXPOSURE_DENIED")
      );
      continue;
    }

    if (input.audience === "EXTERNAL_AGENT") {
      evaluations.push(
        denied(
          operation.operationId,
          "EXTERNAL_AGENT_DELEGATED_AUTHORITY_REQUIRED"
        )
      );
      continue;
    }

    const evaluation = await evaluateAuthorization(
      operation,
      input.authorizationProvider,
      input.requestContext
    );
    evaluations.push(evaluation);
    if (evaluation.allowed) operations.push(structuredClone(operation));
  }

  return {
    contractVersion: "0.1.0",
    audience: input.audience,
    operations,
    evaluations
  };
}

function actionError(
  context: PlatformRequestContextV010 | undefined,
  code: string,
  message: string
): AppActionExecutionResultV010 {
  return {
    ok: false,
    ...(context ? { correlationId: context.correlationId } : {}),
    error: { code, message }
  };
}

export function createCapabilityOperationActionPreExecuteV010(input: {
  manager: AppManagerService;
  resolveAuthorizationProvider(): AuthorizationProviderV010 | undefined;
}): AppActionPreExecuteV010 {
  return async ({ request, context }) => {
    const matches = input.manager
      .listEffectiveCapabilityOperations()
      .filter(operation =>
        operation.binding.type === "ACTION_HOST"
        && operation.binding.commandCode === request.command.code
      );

    if (matches.length === 0) return undefined;
    if (matches.length > 1) {
      return actionError(
        context,
        "CAPABILITY_OPERATION_BINDING_CONFLICT",
        "Multiple effective Capability Operations claim the same Host Action binding."
      );
    }

    const operation = matches[0];

    if (!context) {
      return actionError(
        context,
        "REQUEST_CONTEXT_REQUIRED",
        "Capability Operation invocation requires a Host-resolved request context."
      );
    }

    if (request.command.inputVersion !== operation.binding.inputVersion) {
      return actionError(
        context,
        "CAPABILITY_OPERATION_INPUT_VERSION_UNSUPPORTED",
        "Action inputVersion does not match the Capability Operation binding."
      );
    }

    const audience = audienceForContext(context);
    if (!operation.exposure.includes(audience)) {
      return actionError(
        context,
        "CAPABILITY_OPERATION_EXPOSURE_DENIED",
        "Capability Operation is not eligible for this Host actor class."
      );
    }

    const evaluation = await evaluateAuthorization(
      operation,
      input.resolveAuthorizationProvider(),
      context,
      request
    );
    if (!evaluation.allowed) {
      return actionError(
        context,
        evaluation.reasonCodes[0] ?? "CAPABILITY_OPERATION_AUTHORIZATION_DENIED",
        "Capability Operation denied by '"
          + evaluation.policyProviderId
          + "': "
          + evaluation.reasonCodes.join(", ")
      );
    }

    return undefined;
  };
}

export function capabilityOperationPublicMetadataV010(
  operation: EffectiveCapabilityOperationV010
): JsonValue {
  return JSON.parse(JSON.stringify({
    contractVersion: operation.contractVersion,
    operationId: operation.operationId,
    capability: operation.capability,
    operationVersion: operation.operationVersion,
    title: operation.title,
    description: operation.description,
    effect: operation.effect,
    dataScope: operation.dataScope,
    inputSchema: operation.inputSchema,
    outputSchema: operation.outputSchema
  })) as JsonValue;
}
