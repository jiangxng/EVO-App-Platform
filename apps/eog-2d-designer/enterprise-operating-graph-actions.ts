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
import {
  EOG_2D_DESIGNER_FEATURE_ID,
  EOG_2D_DESIGNER_PACKAGE_ID
} from "./package.js";
import type {
  EnterpriseOperatingGraphHostServiceV010,
  EnterpriseOperatingGraphMutationV010
} from "./enterprise-operating-graph-service.js";
import {
  authorizeMaterialWriteV010
} from "../../manager/material-write-authorization.js";

export const EOG_CREATE_ACTION = "enterprise-operating-graph.create";
export const EOG_GET_ACTION = "enterprise-operating-graph.get";
export const EOG_LIST_ACTION = "enterprise-operating-graph.list";
export const EOG_VALIDATE_ACTION = "enterprise-operating-graph.validate";
export const EOG_APPLY_OPERATION_ACTION =
  "enterprise-operating-graph.operation.apply";

export interface EnterpriseOperatingGraphActionDependenciesV010 {
  service: EnterpriseOperatingGraphHostServiceV010;
  resolveAuthorizationProvider(): AuthorizationProviderV010 | undefined;
}

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
        : "EOG_ACTION_FAILED",
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
    result: JSON.parse(JSON.stringify(value))
  };
}

function stringValue(
  values: Record<string, JsonValue>,
  key: string,
  required = true
): string | undefined {
  const value = values[key];
  if (value === undefined && !required) return undefined;
  if (typeof value !== "string" || !value.trim()) {
    throw new Error("EOG_ACTION_FIELD_INVALID:" + key);
  }
  return value.trim();
}

function numberValue(
  values: Record<string, JsonValue>,
  key: string
): number {
  const value = values[key];
  if (
    typeof value !== "number"
    || !Number.isInteger(value)
    || value < 0
  ) {
    throw new Error("EOG_ACTION_FIELD_INVALID:" + key);
  }
  return value;
}

function mutationValue(
  values: Record<string, JsonValue>
): EnterpriseOperatingGraphMutationV010 {
  const value = values.mutation;
  if (
    value === null
    || typeof value !== "object"
    || Array.isArray(value)
    || typeof value.type !== "string"
  ) {
    throw new Error("EOG_MUTATION_INVALID");
  }
  return structuredClone(value) as EnterpriseOperatingGraphMutationV010;
}

function enterpriseContext(
  context: PlatformRequestContextV010
): {
  enterpriseId: string;
  subjectId: string;
} {
  const active = context.context?.activeContext;
  if (
    active?.kind !== "ENTERPRISE"
    || !active.enterpriseId?.trim()
  ) {
    throw new Error("EOG_ENTERPRISE_CONTEXT_REQUIRED");
  }
  if (context.principal.actorType !== "HUMAN") {
    throw new Error("EOG_HUMAN_ACTION_REQUIRED");
  }
  return {
    enterpriseId: active.enterpriseId.trim(),
    subjectId: context.principal.subjectId
  };
}

async function authorize(
  dependencies: EnterpriseOperatingGraphActionDependenciesV010,
  requestContext: PlatformRequestContextV010,
  action: string,
  graphId?: string,
  mutationType?: string
): Promise<void> {
  const active = requestContext.context?.activeContext;
  const decision = await authorizeMaterialWriteV010(
    dependencies.resolveAuthorizationProvider(),
    requestContext,
    {
      action,
      resource: {
        type: "enterprise.operating-graph",
        ...(graphId ? { id: graphId } : {}),
        attributes: {
          ...(active?.kind === "ENTERPRISE"
            ? { enterpriseId: active.enterpriseId }
            : {}),
          ...(mutationType ? { mutationType } : {})
        }
      }
    }
  );
  if (!decision.allowed) {
    throw new Error(
      (decision.reasonCodes[0] ?? "MATERIAL_WRITE_DENIED")
      + ": denied by '"
      + decision.policyProviderId
      + "' "
      + decision.reasonCodes.join(", ")
    );
  }
}

function handler(
  commandCode: string,
  execute: (
    request: AppActionRequestV010,
    context: PlatformRequestContextV010
  ) => Promise<AppActionExecutionResultV010>
): AppActionHandler {
  return {
    packageId: EOG_2D_DESIGNER_PACKAGE_ID,
    featureId: EOG_2D_DESIGNER_FEATURE_ID,
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

export function createEnterpriseOperatingGraphActionHandlersV010(
  dependencies: EnterpriseOperatingGraphActionDependenciesV010
): AppActionHandler[] {
  return [
    handler(EOG_CREATE_ACTION, async (request, context) => {
      const scope = enterpriseContext(context);
      const graphId = stringValue(request.values, "graphId", false);
      await authorize(
        dependencies,
        context,
        "enterprise.operating-graph.create",
        graphId
      );
      return success(
        request,
        dependencies.service.create({
          enterpriseId: scope.enterpriseId,
          ...(graphId ? { graphId } : {}),
          actor: {
            type: "HUMAN",
            subjectId: scope.subjectId
          }
        })
      );
    }),

    handler(EOG_GET_ACTION, async (request, context) => {
      const scope = enterpriseContext(context);
      return success(
        request,
        dependencies.service.get({
          enterpriseId: scope.enterpriseId,
          graphId: stringValue(request.values, "graphId")!
        })
      );
    }),

    handler(EOG_LIST_ACTION, async (request, context) => {
      const scope = enterpriseContext(context);
      return success(
        request,
        {
          graphs: dependencies.service.list({
            enterpriseId: scope.enterpriseId
          })
        }
      );
    }),

    handler(EOG_VALIDATE_ACTION, async (request, context) => {
      const scope = enterpriseContext(context);
      return success(
        request,
        dependencies.service.validate({
          enterpriseId: scope.enterpriseId,
          graphId: stringValue(request.values, "graphId")!
        })
      );
    }),

    handler(EOG_APPLY_OPERATION_ACTION, async (request, context) => {
      const scope = enterpriseContext(context);
      const graphId = stringValue(request.values, "graphId")!;
      const mutation = mutationValue(request.values);
      if (
        mutation.type === "PUBLISH"
        && request.requiresConfirmation !== true
      ) {
        throw new Error("EOG_PUBLISH_CONFIRMATION_REQUIRED");
      }

      await authorize(
        dependencies,
        context,
        mutation.type === "PUBLISH"
          ? "enterprise.operating-graph.publish"
          : "enterprise.operating-graph.edit",
        graphId,
        mutation.type
      );

      return success(
        request,
        dependencies.service.apply({
          enterpriseId: scope.enterpriseId,
          graphId,
          expectedRevision: numberValue(
            request.values,
            "expectedRevision"
          ),
          mutation,
          actor: {
            type: "HUMAN",
            subjectId: scope.subjectId
          },
          ...(stringValue(request.values, "operationId", false)
            ? {
                operationId: stringValue(
                  request.values,
                  "operationId",
                  false
                )
              }
            : {})
        })
      );
    })
  ];
}
