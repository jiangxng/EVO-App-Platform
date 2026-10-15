import type { PackageManifestV010 } from "../../contracts/package.js";
import {
  PURCHASE_OPERATIONS_OPERATION_CAPABILITY_V010
} from "../trading-reference/constants.js";

/**
 * PA05-03 independently owned, opt-in reference business plugin.
 * No executable plugin is registered on the production Host by this module.
 */
export const PURCHASE_ATTENTION_PACKAGE_ID_V010 = "evo-purchase-attention" as const;
export const PURCHASE_ATTENTION_FEATURE_ID_V010 = "evo-purchase-attention.default" as const;
export const PURCHASE_ATTENTION_CAPABILITY_V010 = "purchase.attention" as const;
export const PURCHASE_ATTENTION_OPERATION_V010 = "purchase.attention.read" as const;
export const PURCHASE_ATTENTION_COMMAND_V010 = PURCHASE_ATTENTION_OPERATION_V010;
export const PURCHASE_ATTENTION_ACTION_V010 = PURCHASE_ATTENTION_OPERATION_V010;

export const purchaseAttentionPackageV010: PackageManifestV010 = {
  contractVersion: "0.1.0",
  packageId: PURCHASE_ATTENTION_PACKAGE_ID_V010,
  displayName: "Purchase Attention",
  description: "只读识别采购单的待收货和待付款关注事项，复用已授权的采购工作状态。",
  displayNameTranslations: {
    "en": "Purchase Attention",
    "zh-CN": "采购待办关注",
    "ja": "購買要対応確認",
    "zh-TW": "採購待辦關注"
  },
  version: "0.1.0",
  type: "APPLICATION",
  publisher: { id: "evo", trust: "FIRST_PARTY", source: "built-in" },
  compatibility: { appPlatform: ">=0.1.0 <0.2.0", pluginProtocol: "0.1.0" },
  features: [{
    contractVersion: "0.1.0",
    packageId: PURCHASE_ATTENTION_PACKAGE_ID_V010,
    featureId: PURCHASE_ATTENTION_FEATURE_ID_V010,
    version: "0.1.0",
    activationScope: "INSTALLATION",
    defaultActivation: true,
    requiresCapabilities: [PURCHASE_OPERATIONS_OPERATION_CAPABILITY_V010],
    providesCapabilities: [PURCHASE_ATTENTION_CAPABILITY_V010],
    contributions: [{
      kind: "platform.capability-operation",
      operation: {
        contractVersion: "0.1.0",
        operationId: PURCHASE_ATTENTION_OPERATION_V010,
        capability: PURCHASE_ATTENTION_CAPABILITY_V010,
        operationVersion: "0.1.0",
        title: "Review Purchase Attention",
        description:
          "Read governed purchase order RECEIVE/PAY open work and return deterministic " +
          "attention flags. This is not an overdue, risk or payment approval decision.",
        effect: "READ",
        dataScope: "ENTERPRISE",
        authorization: {
          action: PURCHASE_ATTENTION_ACTION_V010,
          resource: {
            type: "purchase.attention-order",
            idSource: "INPUT",
            inputKey: "orderNo"
          }
        },
        inputSchema: {
          type: "object",
          additionalProperties: false,
          required: ["orderNo", "supplierCounterpartyId", "itemId", "warehouseId"],
          properties: {
            orderNo: { type: "string", minLength: 1 },
            supplierCounterpartyId: { type: "string", minLength: 1 },
            itemId: { type: "string", minLength: 1 },
            warehouseId: { type: "string", minLength: 1 }
          }
        },
        outputSchema: {
          type: "object",
          additionalProperties: false,
          required: [
            "contractVersion", "summaryId", "orderNo", "sourceOperationId",
            "attentionFlags", "needsAttention", "pendingPurchaseQuantity", "payableAmount"
          ],
          properties: {
            contractVersion: { const: "0.1.0" },
            summaryId: { const: PURCHASE_ATTENTION_OPERATION_V010 },
            orderNo: { type: "string", minLength: 1 },
            sourceOperationId: { const: "trading-reference.purchase-operations.read" },
            attentionFlags: {
              type: "array",
              items: { type: "string", enum: ["RECEIVE_PENDING", "PAYMENT_PENDING"] },
              minItems: 0, maxItems: 2
            },
            needsAttention: { type: "boolean" },
            pendingPurchaseQuantity: { type: "number", minimum: 0 },
            payableAmount: { type: "number", minimum: 0 }
          }
        },
        binding: {
          type: "ACTION_HOST",
          commandCode: PURCHASE_ATTENTION_COMMAND_V010,
          inputVersion: "0.1.0"
        },
        exposure: ["HUMAN", "PERSONAL_AGENT"]
      }
    }]
  }]
};
