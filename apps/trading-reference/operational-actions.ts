import type {
  AppActionHandler,
  AppActionRequestV010,
  AppActionExecutionResultV010,
  JsonValue
} from "../../actions/contracts.js";
import type { PlatformRequestContextV010 } from "../../contracts/platform-services.js";
import {
  PURCHASE_OPERATIONS_READ_COMMAND_V010,
  PURCHASE_OPERATIONS_ENTRY_OPEN_COMMAND_V010,
  PURCHASE_OPERATIONS_LOOKUP_ROUTE_V010,
  TRADING_REFERENCE_FEATURE_ID_V010,
  TRADING_REFERENCE_PACKAGE_ID_V010
} from "./constants.js";
import type {
  PurchaseOperationalProjectionServiceV010
} from "./operational-projection.js";
import { purchaseOperationalDetailRouteV010 } from "./operational-page.js";

function required(values: Record<string, JsonValue>, name: string): string {
  const value = values[name];
  if (typeof value !== "string" || !value.trim()) {
    throw new Error("TR01_OPERATIONAL_INPUT_REQUIRED:" + name);
  }
  return value.trim();
}

export function createPurchaseOperationalReadActionHandlerV010(options: {
  service: PurchaseOperationalProjectionServiceV010;
  /** Must resolve an EXPLICIT host-enterprise -> EVO-enterprise binding only. */
  resolveEvoEnterpriseId(context: PlatformRequestContextV010): string;
}): AppActionHandler {
  return {
    packageId: TRADING_REFERENCE_PACKAGE_ID_V010,
    featureId: TRADING_REFERENCE_FEATURE_ID_V010,
    commandCode: PURCHASE_OPERATIONS_READ_COMMAND_V010,
    async execute(
      request: AppActionRequestV010,
      context?: PlatformRequestContextV010
    ): Promise<AppActionExecutionResultV010> {
      try {
        const active = context?.context?.activeContext;
        if (!context || !active || active.kind !== "ENTERPRISE") {
          throw new Error("TR01_OPERATIONAL_ENTERPRISE_CONTEXT_REQUIRED");
        }
        const orderNo = required(request.values, "orderNo");
        const supplierCounterpartyId = required(
          request.values, "supplierCounterpartyId"
        );
        const itemId = required(request.values, "itemId");
        const warehouseId = required(request.values, "warehouseId");
        const evoEnterpriseId = options.resolveEvoEnterpriseId(context);
        if (!evoEnterpriseId.trim()) {
          throw new Error("TR01_OPERATIONAL_EVO_SCOPE_BINDING_REQUIRED");
        }
        const view = await options.service.read({
          requestContext: context,
          contextId: active.contextId,
          enterpriseId: evoEnterpriseId,
          orderNo, supplierCounterpartyId, itemId, warehouseId
        });
        return {
          ok: true,
          correlationId: context.correlationId,
          result: JSON.parse(JSON.stringify({
            ...view,
            navigateTo: purchaseOperationalDetailRouteV010({
              orderNo, supplierCounterpartyId, itemId, warehouseId
            })
          })) as JsonValue
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return {
          ok: false,
          ...(context?.correlationId ? { correlationId: context.correlationId } : {}),
          error: {
            code: message.split(":")[0] ?? "TR01_OPERATIONAL_READ_FAILED",
            message
          }
        };
      }
    }
  };
}

/** Entry is discoverable through a separate enterprise-scoped READ grant.
 * It is a navigation operation; it never reads EVO business data. */
export function createPurchaseOperationalEntryActionHandlerV010(): AppActionHandler {
  return {
    packageId: TRADING_REFERENCE_PACKAGE_ID_V010,
    featureId: TRADING_REFERENCE_FEATURE_ID_V010,
    commandCode: PURCHASE_OPERATIONS_ENTRY_OPEN_COMMAND_V010,
    async execute(_request, context) {
      const active = context?.context?.activeContext;
      if (!context || active?.kind !== "ENTERPRISE"
          || context.scope.enterpriseId !== active.enterpriseId) {
        return {
          ok: false,
          error: {
            code: "TR01_OPERATIONAL_ENTERPRISE_CONTEXT_REQUIRED",
            message: "Select an active Enterprise Context first."
          }
        };
      }
      return {
        ok: true,
        correlationId: context.correlationId,
        result: { navigateTo: PURCHASE_OPERATIONS_LOOKUP_ROUTE_V010 }
      };
    }
  };
}
