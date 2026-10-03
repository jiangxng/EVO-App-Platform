import type {
  AppActionExecutionResultV010,
  AppActionHandler,
  AppActionRequestV010,
  JsonValue
} from "../../actions/contracts.js";
import type {
  PlatformRequestContextV010
} from "../../contracts/platform-services.js";
import type {
  EvoBusinessDataAdapterV010
} from "../../contracts/evo-business-data.js";

export const TRADING_LITE_HOST_APPLICATION_REF_ID_V010 =
  "application:trading-lite" as const;

export interface TradingLiteEvoRuntimeTargetV010 {
  scopeKey: string;
  applicationId: string;
}

export interface TradingLiteEvoActionOptions {
  adapter: EvoBusinessDataAdapterV010;
  resolveRuntimeTarget(
    context: PlatformRequestContextV010 | undefined
  ):
    | Promise<TradingLiteEvoRuntimeTargetV010>
    | TradingLiteEvoRuntimeTargetV010;
  now?: () => Date;
}

function requiredString(
  values: Record<string, JsonValue>,
  key: string
): string {
  const value = values[key];
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`TRADING_LITE_FIELD_REQUIRED: ${key}`);
  }
  return value.trim();
}

function requiredNumber(
  values: Record<string, JsonValue>,
  key: string
): number {
  const value = values[key];
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`TRADING_LITE_FIELD_REQUIRED: ${key}`);
  }
  return value;
}

function requiredTargetText(value: string, code: string): string {
  if (typeof value !== "string" || !value.trim()) throw new Error(code);
  return value.trim();
}

export function createTradingLiteEvoActionHandler(
  options: TradingLiteEvoActionOptions
): AppActionHandler {
  const now = options.now ?? (() => new Date());

  return {
    packageId: "trading-lite",
    featureId: "trading-lite.default",
    commandCode: "trading-lite.create-order",

    async execute(
      request: AppActionRequestV010,
      context?: PlatformRequestContextV010
    ): Promise<AppActionExecutionResultV010> {
      const correlationId =
        request.runtimeInstanceId
        ?? `${request.command.code}:${request.sourceInteractionId}`;

      try {
        const target = await options.resolveRuntimeTarget(context);
        const scopeKey = requiredTargetText(
          target.scopeKey,
          "TRADING_LITE_EVO_SCOPE_REQUIRED"
        );
        const applicationId = requiredTargetText(
          target.applicationId,
          "TRADING_LITE_EVO_APPLICATION_ID_REQUIRED"
        );

        const customer = requiredString(request.values, "customer");
        const productId = requiredString(request.values, "item");
        const quantity = requiredNumber(request.values, "quantity");
        const amount = requiredNumber(request.values, "amount");
        const currencyValue = request.values.currency;
        const currency =
          typeof currencyValue === "string" && currencyValue.trim()
            ? currencyValue.trim()
            : "USD";

        if (quantity <= 0 || amount < 0) {
          throw new Error("TRADING_LITE_INVALID_ORDER_VALUE");
        }

        const instanceKey =
          request.runtimeInstanceId
          ?? `${request.sourceInteractionId}-${now().getTime()}`;
        const orderNo = `TL-${instanceKey}`;
        const totalAmount = amount.toFixed(2);
        const unitPrice = (amount / quantity).toFixed(2);

        const response = await options.adapter.submit({
          contractVersion: "0.1.0",
          scopeKey,
          applicationId,
          businessDataType: "sales_order.approved",
          businessObjectKey: orderNo,
          effectiveAt: now().toISOString(),
          correlationId: `TRADING-LITE:${instanceKey}`,
          idempotencyKey: `trading-lite:${instanceKey}`,
          payload: {
            eventKind: "ORDER",
            orderNo,
            customer,
            productId,
            quantity,
            unitPrice,
            totalAmount,
            currency,
            localCarryingAmount: totalAmount,
            localCurrency: currency,
            fulfillmentMode: "MAKE",
            project: null,
            department: null,
            profitCenter: null,
            costCenter: null
          }
        });

        return {
          ok: true,
          correlationId,
          result: {
            orderNo,
            applicationId,
            businessDataId: response.businessDataId,
            businessObjectVersion: response.businessObjectVersion,
            postingInputId: response.postingInputId,
            postingSequence: response.postingSequence,
            postingStatus: response.postingStatus,
            replayRequired: response.replayRequired,
            idempotentReplay: response.idempotentReplay
          }
        };
      } catch (error) {
        return {
          ok: false,
          correlationId,
          error: {
            code: "TRADING_LITE_EVO_SUBMISSION_FAILED",
            message: error instanceof Error ? error.message : String(error)
          }
        };
      }
    }
  };
}
