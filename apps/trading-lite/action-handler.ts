import type {
  AppActionExecutionResultV010,
  AppActionHandler,
  AppActionRequestV010,
  JsonValue
} from "../../actions/contracts.js";

export interface TradingLiteEvoActionOptions {
  baseUrl: string;
  enterpriseCode?: string;
  actor?: {
    type: "HUMAN" | "AI" | "AUTOMATION";
    id: string;
  };
  fetchImpl?: typeof fetch;
  now?: () => Date;
}

interface EvoEnterprise {
  id: string;
  code: string;
  status: string;
}

interface EvoCapabilityCatalog {
  capabilities: Array<{ code: string; kind: string }>;
}

function normalizeBaseUrl(value: string): string {
  return value.endsWith("/") ? value.slice(0, -1) : value;
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

async function readJson<T>(response: Response): Promise<T> {
  const body = await response.json() as T;
  if (!response.ok) {
    const value = body as {
      error?: { code?: string; message?: string };
      code?: string;
      message?: string;
    };
    throw new Error(
      `${value.error?.code ?? value.code ?? "EVO_REQUEST_FAILED"}: ${value.error?.message ?? value.message ?? response.statusText}`
    );
  }
  return body;
}

export function createTradingLiteEvoActionHandler(
  options: TradingLiteEvoActionOptions
): AppActionHandler {
  const baseUrl = normalizeBaseUrl(options.baseUrl);
  const enterpriseCode = options.enterpriseCode ?? "EVO_DEMO";
  const actor = options.actor ?? { type: "HUMAN" as const, id: "demo-user" };
  const fetchImpl = options.fetchImpl ?? globalThis.fetch;
  const now = options.now ?? (() => new Date());

  if (!fetchImpl) throw new Error("TRADING_LITE_FETCH_UNAVAILABLE");

  let enterprise: EvoEnterprise | undefined;

  async function resolveEnterprise(): Promise<EvoEnterprise> {
    if (enterprise) return enterprise;
    enterprise = await readJson<EvoEnterprise>(
      await fetchImpl(
        `${baseUrl}/api/v1/enterprises/${encodeURIComponent(enterpriseCode)}`,
        { headers: { accept: "application/json" } }
      )
    );
    if (enterprise.status !== "ACTIVE") {
      throw new Error(`EVO_ENTERPRISE_NOT_ACTIVE: ${enterpriseCode}`);
    }
    return enterprise;
  }

  return {
    packageId: "trading-lite",
    featureId: "trading-lite.default",
    commandCode: "trading-lite.create-order",

    async execute(request: AppActionRequestV010): Promise<AppActionExecutionResultV010> {
      const correlationId =
        request.runtimeInstanceId ??
        `${request.command.code}:${request.sourceInteractionId}`;

      try {
        const targetEnterprise = await resolveEnterprise();
        const capabilityCode = "sales_order.approve-sales-order";

        const catalog = await readJson<EvoCapabilityCatalog>(
          await fetchImpl(
            `${baseUrl}/api/v1/capabilities?enterprise_id=${encodeURIComponent(targetEnterprise.id)}`,
            { headers: { accept: "application/json" } }
          )
        );

        if (!catalog.capabilities.some(
          capability => capability.code === capabilityCode && capability.kind === "COMMAND"
        )) {
          return {
            ok: false,
            correlationId,
            error: {
              code: "EVO_CAPABILITY_NOT_AVAILABLE",
              message: `Required EVO capability '${capabilityCode}' is not available.`
            }
          };
        }

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
          request.runtimeInstanceId ??
          `${request.sourceInteractionId}-${now().getTime()}`;
        const orderNo = `TL-${instanceKey}`;
        const totalAmount = amount.toFixed(2);
        const unitPrice = (amount / quantity).toFixed(2);

        const response = await readJson<{
          capabilityCode: string;
          command: {
            commandExecutionId: string;
            businessDataId: string;
            postingInputId: string;
            postingSequence: string;
            postingStatus: string;
          };
        }>(
          await fetchImpl(`${baseUrl}/api/v1/commands`, {
            method: "POST",
            headers: {
              "content-type": "application/json",
              accept: "application/json"
            },
            body: JSON.stringify({
              enterpriseId: targetEnterprise.id,
              capabilityCode,
              actor,
              idempotencyKey: `trading-lite:${instanceKey}`,
              correlationId: `TRADING-LITE:${instanceKey}`,
              effectiveAt: now().toISOString(),
              businessObjectKey: orderNo,
              input: {
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
            })
          })
        );

        return {
          ok: true,
          correlationId,
          result: {
            orderNo,
            capabilityCode: response.capabilityCode,
            commandExecutionId: response.command.commandExecutionId,
            businessDataId: response.command.businessDataId,
            postingInputId: response.command.postingInputId,
            postingSequence: response.command.postingSequence,
            postingStatus: response.command.postingStatus
          }
        };
      } catch (error) {
        return {
          ok: false,
          correlationId,
          error: {
            code: "TRADING_LITE_EVO_COMMAND_FAILED",
            message: error instanceof Error ? error.message : String(error)
          }
        };
      }
    }
  };
}
