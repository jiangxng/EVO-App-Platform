import type {
  AppActionExecutionResultV010,
  AppActionHandler,
  AppActionRequestV010,
  JsonValue
} from "../actions/contracts.js";
import {
  ENTERPRISE_AGENT_FEATURE_ID,
  ENTERPRISE_AGENT_PACKAGE_ID
} from "../agents/enterprise-agent/package.js";
import type {
  AuthorizationProviderV010,
  PlatformRequestContextV010
} from "../contracts/platform-services.js";
import {
  authorizeMaterialWriteV010
} from "./material-write-authorization.js";
import type {
  EogExpectedSopServiceV010
} from "./enterprise-operating-graph-sop-service.js";

export const EOG_SOP_LIST_ACTION =
  "enterprise-operating-graph.sop.list";
export const EOG_SOP_CREATE_ACTION =
  "enterprise-operating-graph.sop.create";
export const EOG_SOP_REVISE_ACTION =
  "enterprise-operating-graph.sop.revise";
export const EOG_SOP_PUBLISH_ACTION =
  "enterprise-operating-graph.sop.publish";

function textValue(
  values: Record<string, JsonValue>,
  key: string
): string {
  const value = values[key];
  if (typeof value !== "string" || !value.trim()) {
    throw new Error("EOG_SOP_FIELD_REQUIRED:" + key);
  }
  return value.trim();
}

function stringArray(
  values: Record<string, JsonValue>,
  key: string
): string[] {
  const value = values[key];
  if (
    !Array.isArray(value)
    || value.some(item => typeof item !== "string" || !item.trim())
  ) {
    throw new Error("EOG_SOP_FIELD_INVALID:" + key);
  }
  return value.map(item => String(item).trim());
}

function revision(
  values: Record<string, JsonValue>
): number {
  const value = values.expectedRevision;
  if (
    typeof value !== "number"
    || !Number.isInteger(value)
    || value < 0
  ) {
    throw new Error("EOG_SOP_REVISION_INVALID");
  }
  return value;
}

function enterpriseScope(context: PlatformRequestContextV010): {
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

function result(
  request: AppActionRequestV010,
  value: unknown
): AppActionExecutionResultV010 {
  return {
    ok: true,
    correlationId: request.sourceInteractionId,
    result: JSON.parse(JSON.stringify(value))
  };
}

function failure(
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
        : "EOG_SOP_ACTION_FAILED",
      message
    }
  };
}

export function createEogExpectedSopActionHandlersV010(input: {
  service: EogExpectedSopServiceV010;
  resolveAuthorizationProvider(): AuthorizationProviderV010 | undefined;
}): AppActionHandler[] {
  const handler = (
    commandCode: string,
    execute: (
      request: AppActionRequestV010,
      context: PlatformRequestContextV010
    ) => Promise<AppActionExecutionResultV010>
  ): AppActionHandler => ({
    packageId: ENTERPRISE_AGENT_PACKAGE_ID,
    featureId: ENTERPRISE_AGENT_FEATURE_ID,
    commandCode,
    async execute(request, context) {
      if (!context) {
        return failure(request, new Error("REQUEST_CONTEXT_REQUIRED"));
      }
      try {
        return await execute(request, context);
      } catch (error) {
        return failure(request, error);
      }
    }
  });

  const authorize = async (
    context: PlatformRequestContextV010,
    action: string,
    graphId: string,
    sopId: string
  ) => {
    const decision = await authorizeMaterialWriteV010(
      input.resolveAuthorizationProvider(),
      context,
      {
        action,
        resource: {
          type: "enterprise.operating-graph.sop",
          id: sopId,
          attributes: { graphId }
        }
      }
    );
    if (!decision.allowed) {
      throw new Error(
        (decision.reasonCodes[0] ?? "MATERIAL_WRITE_DENIED")
      );
    }
  };

  return [
    handler(EOG_SOP_LIST_ACTION, async (request, context) => {
      const scope = enterpriseScope(context);
      return result(
        request,
        input.service.list({
          enterpriseId: scope.enterpriseId,
          graphId: textValue(request.values, "graphId")
        })
      );
    }),

    handler(EOG_SOP_CREATE_ACTION, async (request, context) => {
      const scope = enterpriseScope(context);
      const graphId = textValue(request.values, "graphId");
      const sopId = textValue(request.values, "sopId");
      await authorize(
        context,
        "enterprise.operating-graph.sop.create",
        graphId,
        sopId
      );
      return result(
        request,
        input.service.create({
          enterpriseId: scope.enterpriseId,
          graphId,
          sopId,
          title: textValue(request.values, "title"),
          applicationNodeIds: stringArray(
            request.values,
            "applicationNodeIds"
          )
        })
      );
    }),

    handler(EOG_SOP_REVISE_ACTION, async (request, context) => {
      const scope = enterpriseScope(context);
      const graphId = textValue(request.values, "graphId");
      const sopId = textValue(request.values, "sopId");
      await authorize(
        context,
        "enterprise.operating-graph.sop.revise",
        graphId,
        sopId
      );
      const title = request.values.title;
      const applicationNodeIds = request.values.applicationNodeIds;
      return result(
        request,
        input.service.revise({
          enterpriseId: scope.enterpriseId,
          graphId,
          sopId,
          expectedRevision: revision(request.values),
          ...(typeof title === "string"
            ? { title: title.trim() }
            : {}),
          ...(Array.isArray(applicationNodeIds)
            ? {
                applicationNodeIds: stringArray(
                  request.values,
                  "applicationNodeIds"
                )
              }
            : {})
        })
      );
    }),

    handler(EOG_SOP_PUBLISH_ACTION, async (request, context) => {
      if (request.requiresConfirmation !== true) {
        throw new Error("EOG_SOP_PUBLISH_CONFIRMATION_REQUIRED");
      }
      const scope = enterpriseScope(context);
      const graphId = textValue(request.values, "graphId");
      const sopId = textValue(request.values, "sopId");
      await authorize(
        context,
        "enterprise.operating-graph.sop.publish",
        graphId,
        sopId
      );
      return result(
        request,
        input.service.publish({
          enterpriseId: scope.enterpriseId,
          graphId,
          sopId,
          expectedRevision: revision(request.values),
          subjectId: scope.subjectId
        })
      );
    })
  ];
}
