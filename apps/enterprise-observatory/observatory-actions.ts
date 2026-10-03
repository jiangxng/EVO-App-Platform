import type {
  AppActionExecutionResultV010,
  AppActionHandler,
  AppActionRequestV010
} from "../../actions/contracts.js";
import {
  ENTERPRISE_OBSERVATORY_2D_FEATURE_ID,
  ENTERPRISE_OBSERVATORY_PACKAGE_ID
} from "./package.js";
import type {
  PlatformRequestContextV010
} from "../../contracts/platform-services.js";
import type {
  EnterpriseOperatingGraphReadProviderV010
} from "../../contracts/enterprise-operating-graph-read.js";
import type {
  EnterpriseOperatingGraphObservatoryProviderResolverV020
} from "../../contracts/enterprise-operating-graph-observatory-runtime.js";
import {
  parseEogObservatoryRequestInputV020
} from "../../eog/observatory-input.js";

export const EOG_OBSERVE_ACTION =
  "enterprise-operating-graph.observatory.observe";
export const EOG_ANALYZE_ACTION =
  "enterprise-operating-graph.observatory.analyze";

function enterpriseId(
  context: PlatformRequestContextV010
): string {
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
  return active.enterpriseId.trim();
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
  const message = error instanceof Error
    ? error.message
    : String(error);
  const [candidate] = message.split(":");
  return {
    ok: false,
    correlationId: request.sourceInteractionId,
    error: {
      code: candidate && /^[A-Z0-9_]+$/u.test(candidate)
        ? candidate
        : "EOG_OBSERVATORY_ACTION_FAILED",
      message
    }
  };
}

function handler(
  commandCode: string,
  execute: (
    request: AppActionRequestV010,
    context: PlatformRequestContextV010
  ) => Promise<AppActionExecutionResultV010>
): AppActionHandler {
  return {
    packageId: ENTERPRISE_OBSERVATORY_PACKAGE_ID,
    featureId: ENTERPRISE_OBSERVATORY_2D_FEATURE_ID,
    commandCode,
    async execute(request, context) {
      if (!context) {
        return failure(
          request,
          new Error("REQUEST_CONTEXT_REQUIRED")
        );
      }
      try {
        return await execute(request, context);
      } catch (error) {
        return failure(request, error);
      }
    }
  };
}

export function createEnterpriseOperatingGraphObservatoryActionHandlersV020(
  input: {
    graphService: EnterpriseOperatingGraphReadProviderV010;
    providers: EnterpriseOperatingGraphObservatoryProviderResolverV020;
  }
): AppActionHandler[] {
  return [
    handler(EOG_OBSERVE_ACTION, async (request, context) => {
      const scopedEnterpriseId = enterpriseId(context);
      const query = parseEogObservatoryRequestInputV020(
        request.values
      );
      const service = input.providers.createService({
        graphService: input.graphService,
        enterpriseId: scopedEnterpriseId
      });
      return result(
        request,
        await service.observe({
          enterpriseId: scopedEnterpriseId,
          ...query
        })
      );
    }),

    handler(EOG_ANALYZE_ACTION, async (request, context) => {
      const scopedEnterpriseId = enterpriseId(context);
      const query = parseEogObservatoryRequestInputV020(
        request.values
      );
      const service = input.providers.createService({
        graphService: input.graphService,
        enterpriseId: scopedEnterpriseId,
        requireAnalysis: true
      });
      return result(
        request,
        await service.analyze({
          enterpriseId: scopedEnterpriseId,
          ...query
        })
      );
    })
  ];
}
