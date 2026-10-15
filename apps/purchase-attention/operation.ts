import type {
  AppActionHandler, AppActionRequestV010, AppActionExecutionResultV010, JsonValue
} from "../../actions/contracts.js";
import type { AppActionRouter } from "../../actions/router.js";
import type {
  AuthorizationProviderV010, PlatformRequestContextV010
} from "../../contracts/platform-services.js";
import {
  PURCHASE_OPERATIONS_READ_COMMAND_V010
} from "../trading-reference/constants.js";
import {
  PURCHASE_ATTENTION_ACTION_V010,
  PURCHASE_ATTENTION_COMMAND_V010,
  PURCHASE_ATTENTION_FEATURE_ID_V010,
  PURCHASE_ATTENTION_OPERATION_V010,
  PURCHASE_ATTENTION_PACKAGE_ID_V010
} from "./package.js";

function deny(context: PlatformRequestContextV010 | undefined, code: string):
  AppActionExecutionResultV010 {
  return {
    ok: false,
    ...(context?.correlationId ? { correlationId: context.correlationId } : {}),
    error: { code, message: "Purchase attention request unavailable or denied." }
  };
}
function record(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
function nonNegative(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}
const fields = ["orderNo", "supplierCounterpartyId", "itemId", "warehouseId"] as const;

function validatedInputs(values: Record<string, JsonValue>):
  Record<typeof fields[number], string> | undefined {
  if (!record(values)
    || Object.keys(values).some(key => !fields.includes(key as typeof fields[number]))) {
    return undefined;
  }
  const result = {} as Record<typeof fields[number], string>;
  for (const field of fields) {
    const value = values[field];
    if (typeof value !== "string" || !value.trim()) return undefined;
    result[field] = value.trim();
  }
  return result;
}

/**
 * A third, separately owned business plugin. It calls the existing Trading
 * Reference READ through the *same* governed Action Host, so its dependency's
 * activation and permission cannot be bypassed by calling a service directly.
 *
 * The Host must separately register this action handler and plugin manifest.
 * No Agent-specific tool registration is needed.
 */
export function createPurchaseAttentionActionHandlerV010(input: {
  sourceRouter: AppActionRouter;
  resolveAuthorizationProvider(): AuthorizationProviderV010 | undefined;
}): AppActionHandler {
  return {
    packageId: PURCHASE_ATTENTION_PACKAGE_ID_V010,
    featureId: PURCHASE_ATTENTION_FEATURE_ID_V010,
    commandCode: PURCHASE_ATTENTION_COMMAND_V010,
    async execute(
      request: AppActionRequestV010, context?: PlatformRequestContextV010
    ): Promise<AppActionExecutionResultV010> {
      const active = context?.context?.activeContext;
      if (!context || active?.kind !== "ENTERPRISE"
        || !context.scope.enterpriseId
        || active.enterpriseId !== context.scope.enterpriseId) {
        return deny(context, "PURCHASE_ATTENTION_ENTERPRISE_CONTEXT_REQUIRED");
      }
      const values = validatedInputs(request.values);
      if (!values) return deny(context, "PURCHASE_ATTENTION_INPUT_INVALID");

      const provider = input.resolveAuthorizationProvider();
      if (!provider) return deny(context, "PURCHASE_ATTENTION_AUTHORIZATION_REQUIRED");
      try {
        const decision = await provider.check({
          contractVersion: "0.1.0",
          principal: context.principal,
          scope: context.scope,
          action: PURCHASE_ATTENTION_ACTION_V010,
          resource: {
            type: "purchase.attention-order",
            id: values.orderNo,
            attributes: { operationId: PURCHASE_ATTENTION_OPERATION_V010 }
          },
          context: {
            correlationId: context.correlationId,
            activeContextId: active.contextId
          }
        });
        if (!decision.allowed || decision.obligations?.length) {
          return deny(context, "PURCHASE_ATTENTION_DENIED");
        }
      } catch {
        return deny(context, "PURCHASE_ATTENTION_AUTHORIZATION_ERROR");
      }

      let received: AppActionExecutionResultV010;
      try {
        received = await input.sourceRouter.execute({
          contractVersion: "0.1.0",
          type: "command",
          command: { code: PURCHASE_OPERATIONS_READ_COMMAND_V010, inputVersion: "0.1.0" },
          values,
          sourceInteractionId: request.sourceInteractionId,
          actionId: "purchase-attention.source-read",
          requiresConfirmation: false
        }, context);
      } catch {
        return deny(context, "PURCHASE_ATTENTION_SOURCE_UNAVAILABLE");
      }
      // No source errors or partial source output are copied into an Agent
      // result; authorization and runtime details must remain private.
      if (!received?.ok || !record(received.result)) {
        return deny(context, "PURCHASE_ATTENTION_SOURCE_UNAVAILABLE");
      }
      const source = received.result;
      const refs = source.references;
      const work = source.openWork;
      if (source.contractVersion !== "0.1.0"
        || source.projectionId !== "trading-reference.purchase-operations"
        || typeof source.enterpriseId !== "string" || !source.enterpriseId.trim()
        || source.orderNo !== values.orderNo
        || !record(refs) || !record(work)
        || refs.supplierCounterpartyId !== values.supplierCounterpartyId
        || refs.itemId !== values.itemId || refs.warehouseId !== values.warehouseId
        || !nonNegative(source.pendingPurchaseQuantity)
        || !nonNegative(source.payableAmount)) {
        return deny(context, "PURCHASE_ATTENTION_SOURCE_CONTRACT_INVALID");
      }
      const receive = work.receive;
      const pay = work.pay;
      if ((receive !== null && (!record(receive) || !nonNegative(receive.quantity)))
        || (pay !== null && (!record(pay) || !nonNegative(pay.amount)))
        || (source.pendingPurchaseQuantity > 0 && receive === null)
        || (source.payableAmount > 0 && pay === null)) {
        return deny(context, "PURCHASE_ATTENTION_SOURCE_CONTRACT_INVALID");
      }
      const flags: Array<"RECEIVE_PENDING" | "PAYMENT_PENDING"> = [];
      if (source.pendingPurchaseQuantity > 0) flags.push("RECEIVE_PENDING");
      if (source.payableAmount > 0) flags.push("PAYMENT_PENDING");

      return {
        ok: true,
        correlationId: context.correlationId,
        result: {
          contractVersion: "0.1.0",
          summaryId: PURCHASE_ATTENTION_OPERATION_V010,
          orderNo: values.orderNo,
          sourceOperationId: PURCHASE_OPERATIONS_READ_COMMAND_V010,
          attentionFlags: flags,
          needsAttention: flags.length > 0,
          pendingPurchaseQuantity: source.pendingPurchaseQuantity,
          payableAmount: source.payableAmount
        }
      };
    }
  };
}
