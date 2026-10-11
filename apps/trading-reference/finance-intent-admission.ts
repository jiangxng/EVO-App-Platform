import type {
  AuthorizationProviderV010,
  PlatformRequestContextV010
} from "../../contracts/platform-services.js";

/**
 * TR-01B2D1: Host-side finance intent verification only.
 *
 * This intentionally has no HTTP, ledger writer, cost engine, command runner
 * or Agent registration. Even an allowed Host policy is NOT authority to mutate
 * EVO: the separately installed EVO-owned plugin must verify facts/pins again.
 */
export const TRADING_FINANCE_COST_REQUEST_ACTION_V010 =
  "trading-reference.finance.cost.request" as const;
export const TRADING_FINANCE_ALLOCATION_REQUEST_ACTION_V010 =
  "trading-reference.finance.allocation.request" as const;

export interface FinancePinV010 {
  id: string;
  version: number;
}
interface FinanceIntentBaseV010 {
  contractVersion: "0.1.0";
  orderNo: string;
  customerCounterpartyId: string;
  itemId: string;
  warehouseId: string;
  idempotencyKey: string;
}
export interface CostValuationFinanceIntentV010 extends FinanceIntentBaseV010 {
  kind: "COST_VALUATION";
  shipmentBusinessDataId: string;
  costMethod: "FIFO" | "LIFO" | "MOVING_AVERAGE" | "SPECIFIC_IDENTIFICATION";
  valuationPolicy: FinancePinV010;
  allocationPolicy: FinancePinV010;
  shipmentValuationRule: FinancePinV010;
  /** Exact EVO posting boundary; never implicitly default to latest. */
  boundarySequence: string;
}
export interface CashAllocationFinanceIntentV010 extends FinanceIntentBaseV010 {
  kind: "CASH_ALLOCATION";
  sourceOrderBusinessDataId: string;
  consumerReceiptBusinessDataId: string;
  amount: string;
  currency: string;
  allocationPolicy: FinancePinV010;
  /** Single-source, same-currency, full settlement reference only. */
  settlementMode: "EXPLICIT_FULL";
}
export type TradingFinanceIntentV010 =
  | CostValuationFinanceIntentV010
  | CashAllocationFinanceIntentV010;

export interface FinanceIntentPreflightRequestV010 {
  requestContext: PlatformRequestContextV010;
  contextId: string;
  intent: TradingFinanceIntentV010;
}
export interface FinanceOwnerPreflightInputV010 {
  contractVersion: "0.1.0";
  /** No fallback to EVO_DEMO, and never accepted from user-supplied intent. */
  evoEnterpriseId: string;
  hostEnterpriseId: string;
  actorSubjectId: string;
  actorType: PlatformRequestContextV010["principal"]["actorType"];
  correlationId: string;
  contextId: string;
  intent: TradingFinanceIntentV010;
}
export interface FinanceOwnerPreflightV010 {
  /** Explicit owner plugin: verifies actual EVO BusinessData identity and pins.
   * It is READ-ONLY, and does not reserve, queue, sign or post an execution. */
  verify(input: FinanceOwnerPreflightInputV010): Promise<{
    contractVersion: "0.1.0";
    verified: boolean;
    evoEnterpriseId: string;
    orderNo: string;
    reasonCodes: string[];
  }>;
}
export interface FinanceIntentPreflightResultV010 {
  contractVersion: "0.1.0";
  status: "OWNER_FACTS_VERIFIED_NO_EXECUTION";
  operation: "COST_VALUATION" | "CASH_ALLOCATION";
  orderNo: string;
  /** An informational Host/owner assertion, NOT an execution authorization. */
  executionAllowed: false;
}
function required(value: unknown, field: string): string {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error("TR01B2D_FIELD_REQUIRED:" + field);
  }
  return value.trim();
}
function pin(value: unknown, field: string): FinancePinV010 {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("TR01B2D_PIN_REQUIRED:" + field);
  }
  const p = value as FinancePinV010;
  const id = required(p.id, field + ".id");
  if (!Number.isSafeInteger(p.version) || p.version <= 0) {
    throw new Error("TR01B2D_PIN_VERSION_INVALID:" + field);
  }
  return { id, version: p.version };
}
function normalize(intent: TradingFinanceIntentV010): TradingFinanceIntentV010 {
  if (!intent || intent.contractVersion !== "0.1.0") {
    throw new Error("TR01B2D_INTENT_VERSION_UNSUPPORTED");
  }
  const common = {
    contractVersion: "0.1.0" as const,
    orderNo: required(intent.orderNo, "orderNo"),
    customerCounterpartyId: required(intent.customerCounterpartyId, "customerCounterpartyId"),
    itemId: required(intent.itemId, "itemId"),
    warehouseId: required(intent.warehouseId, "warehouseId"),
    idempotencyKey: required(intent.idempotencyKey, "idempotencyKey")
  };
  if (intent.kind === "COST_VALUATION") {
    const boundarySequence = required(intent.boundarySequence, "boundarySequence");
    if (!/^[1-9][0-9]*$/u.test(boundarySequence)) {
      throw new Error("TR01B2D_BOUNDARY_INVALID");
    }
    if (!["FIFO", "LIFO", "MOVING_AVERAGE", "SPECIFIC_IDENTIFICATION"]
      .includes(intent.costMethod)) {
      throw new Error("TR01B2D_COST_METHOD_UNSUPPORTED");
    }
    return {
      ...common, kind: "COST_VALUATION",
      shipmentBusinessDataId: required(intent.shipmentBusinessDataId, "shipmentBusinessDataId"),
      costMethod: intent.costMethod,
      valuationPolicy: pin(intent.valuationPolicy, "valuationPolicy"),
      allocationPolicy: pin(intent.allocationPolicy, "allocationPolicy"),
      shipmentValuationRule: pin(intent.shipmentValuationRule, "shipmentValuationRule"),
      boundarySequence
    };
  }
  if (intent.kind === "CASH_ALLOCATION") {
    const source = required(intent.sourceOrderBusinessDataId, "sourceOrderBusinessDataId");
    const consumer = required(intent.consumerReceiptBusinessDataId, "consumerReceiptBusinessDataId");
    if (source === consumer) throw new Error("TR01B2D_SOURCE_CONSUMER_SAME");
    const amount = required(intent.amount, "amount");
    if (!/^(?:0|[1-9][0-9]*)(?:\.[0-9]{1,2})?$/u.test(amount)
        || Number(amount) <= 0 || !Number.isFinite(Number(amount))) {
      throw new Error("TR01B2D_AMOUNT_INVALID");
    }
    const currency = required(intent.currency, "currency");
    if (!/^[A-Z]{3}$/u.test(currency)) throw new Error("TR01B2D_CURRENCY_INVALID");
    if (intent.settlementMode !== "EXPLICIT_FULL") {
      throw new Error("TR01B2D_PARTIAL_SETTLEMENT_NOT_CERTIFIED");
    }
    return {
      ...common,kind:"CASH_ALLOCATION",
      sourceOrderBusinessDataId: source,
      consumerReceiptBusinessDataId:consumer,
      amount,currency,settlementMode:"EXPLICIT_FULL",
      allocationPolicy:pin(intent.allocationPolicy,"allocationPolicy")
    };
  }
  throw new Error("TR01B2D_KIND_UNSUPPORTED");
}

/** No default owner verifier. No production adapter is installed at this gate. */
export function createTradingFinanceIntentPreflightV010(options: {
  resolveAuthorizationProvider(): AuthorizationProviderV010 | undefined;
  /** Must look up Host Enterprise -> EVO Enterprise server-side, not in the input. */
  resolveEvoEnterpriseId(context: PlatformRequestContextV010): string;
  resolveOwnerPreflight(): FinanceOwnerPreflightV010 | undefined;
}) {
  return {
    async verify(request: FinanceIntentPreflightRequestV010):
      Promise<FinanceIntentPreflightResultV010> {
      const context = request.requestContext;
      const active = context?.context?.activeContext;
      if (!active || active.kind !== "ENTERPRISE"
          || active.contextId !== request.contextId
          || active.enterpriseId !== context.scope.enterpriseId
          || !context.principal?.subjectId?.trim()) {
        throw new Error("TR01B2D_ENTERPRISE_CONTEXT_MISMATCH");
      }
      const intent = normalize(request.intent);
      const evoEnterpriseId = required(
        options.resolveEvoEnterpriseId(context), "resolvedEvoEnterpriseId"
      );
      const policy = options.resolveAuthorizationProvider();
      if (!policy) throw new Error("TR01B2D_AUTHORIZATION_REQUIRED");

      const action = intent.kind === "COST_VALUATION"
        ? TRADING_FINANCE_COST_REQUEST_ACTION_V010
        : TRADING_FINANCE_ALLOCATION_REQUEST_ACTION_V010;
      const targets: Array<[string, string]> = [
        ["trading-reference.sales-order", intent.orderNo],
        ["counterparty.subject", intent.customerCounterpartyId],
        ["item.subject", intent.itemId],
        ["warehouse.subject", intent.warehouseId],
        ...(intent.kind === "COST_VALUATION"
          ? [["trading-reference.shipment-business-data",intent.shipmentBusinessDataId] as [string,string]]
          : [
              ["trading-reference.source-order-business-data",
                intent.sourceOrderBusinessDataId] as [string,string],
              ["trading-reference.customer-receipt-business-data",
                intent.consumerReceiptBusinessDataId] as [string,string]
            ])
      ];
      // Static policy adapters might not inspect resource.attributes.
      // Check every resource *separately* and reject ANY conditional obligation.
      for (const [type,id] of targets) {
        const decision = await policy.check({
          contractVersion: "0.1.0",
          principal: context.principal,
          scope: context.scope,
          action,resource:{type,id},
          context:{
            activeContextId:request.contextId,
            correlationId:context.correlationId
          }
        });
        if (decision.allowed !== true || (decision.obligations?.length ?? 0) !== 0) {
          throw new Error("TR01B2D_RESOURCE_AUTHORIZATION_DENIED:" + type);
        }
      }

      const owner = options.resolveOwnerPreflight();
      if (!owner) throw new Error("TR01B2D_OWNER_PLUGIN_NOT_ADMITTED");
      const attestation = await owner.verify({
        contractVersion:"0.1.0",
        hostEnterpriseId:active.enterpriseId,
        evoEnterpriseId,
        actorSubjectId:context.principal.subjectId,
        actorType:context.principal.actorType,
        correlationId:required(context.correlationId,"correlationId"),
        contextId:request.contextId,
        intent
      });
      if (attestation.contractVersion !== "0.1.0" || !attestation.verified
          || attestation.evoEnterpriseId !== evoEnterpriseId
          || attestation.orderNo !== intent.orderNo
          || attestation.reasonCodes.length > 0) {
        throw new Error("TR01B2D_OWNER_FACT_ATTESTATION_REJECTED");
      }
      // Never issue a write token: a later action must reauthorize/revalidate.
      return {
        contractVersion:"0.1.0",
        status:"OWNER_FACTS_VERIFIED_NO_EXECUTION",
        operation:intent.kind,
        orderNo:intent.orderNo,
        executionAllowed:false
      };
    }
  };
}
