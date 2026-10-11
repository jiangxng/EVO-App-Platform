import type { PackageManifestV010 } from "../../contracts/package.js";
import {
  PURCHASE_OPERATIONS_CAPABILITY_V010,
  PURCHASE_OPERATIONS_ENTRY_OPEN_ACTION_V010,
  PURCHASE_OPERATIONS_ENTRY_OPEN_COMMAND_V010,
  PURCHASE_OPERATIONS_ENTRY_OPEN_OPERATION_V010,
  PURCHASE_OPERATIONS_LOOKUP_PAGE_ID_V010,
  PURCHASE_OPERATIONS_LOOKUP_PAGE_SOURCE_V010,
  PURCHASE_OPERATIONS_LOOKUP_ROUTE_V010,
  PURCHASE_OPERATIONS_DETAIL_PAGE_ID_V010,
  PURCHASE_OPERATIONS_DETAIL_PAGE_SOURCE_V010,
  PURCHASE_OPERATIONS_DETAIL_ROUTE_V010,
  PURCHASE_OPERATIONS_READ_COMMAND_V010,
  PURCHASE_OPERATIONS_READ_OPERATION_V010,
  TRADING_REFERENCE_FEATURE_ID_V010,
  TRADING_REFERENCE_PACKAGE_ID_V010
} from "./constants.js";
import { PURCHASE_OPERATIONS_READ_ACTION_V010 } from "./operational-projection.js";

/**
 * Opt-in, read-only reference Application. No speculative navigation/Experience.
 * An administrator must explicitly install the package, bind the enterprise
 * to its EVO runtime scope, and grant scoped authorization.
 */
export const tradingReferencePackageV010: PackageManifestV010 = {
  contractVersion: "0.1.0",
  packageId: TRADING_REFERENCE_PACKAGE_ID_V010,
  displayName: "EVO Trading Reference",
  version: "0.1.0",
  type: "APPLICATION",
  publisher: {
    id: "evo",
    displayName: "EVO",
    trust: "FIRST_PARTY",
    source: "built-in"
  },
  compatibility: {
    appPlatform: ">=0.1.0 <0.2.0",
    eidos: "^1.3.0",
    pluginProtocol: "0.1.0"
  },
  features: [{
    contractVersion: "0.1.0",
    featureId: TRADING_REFERENCE_FEATURE_ID_V010,
    packageId: TRADING_REFERENCE_PACKAGE_ID_V010,
    version: "0.1.0",
    activationScope: "INSTALLATION",
    defaultActivation: true,
    providesCapabilities: [PURCHASE_OPERATIONS_CAPABILITY_V010],
    contributions: [{
      kind: "platform.capability-operation",
      operation: {
        contractVersion: "0.1.0",
        operationId: PURCHASE_OPERATIONS_ENTRY_OPEN_OPERATION_V010,
        capability: PURCHASE_OPERATIONS_CAPABILITY_V010,
        operationVersion: "0.1.0",
        title: "Open Purchase Operational Lookup",
        description: "Open the governed purchase order Work/Inventory/Payable lookup Experience, without reading transactional data.",
        effect: "READ",
        dataScope: "ENTERPRISE",
        authorization: {
          action: PURCHASE_OPERATIONS_ENTRY_OPEN_ACTION_V010,
          resource: { type: "trading-reference.purchase-lookup", idSource: "DATA_SCOPE" }
        },
        inputSchema: {
          type: "object", additionalProperties: false, properties: {}
        },
        outputSchema: {
          type: "object", required: ["navigateTo"],
          properties: { navigateTo: { const: PURCHASE_OPERATIONS_LOOKUP_ROUTE_V010 } }
        },
        binding: {
          type: "ACTION_HOST",
          commandCode: PURCHASE_OPERATIONS_ENTRY_OPEN_COMMAND_V010,
          inputVersion: "0.1.0"
        },
        exposure: ["HUMAN", "PERSONAL_AGENT", "AUTOMATION"]
      }
    }, {
      kind: "eidos.workbench-home-item",
      item: {
        contractVersion: "0.1.0",
        id: "evo-trading-reference.workbench.purchase-lookup",
        title: "Purchase Work and Position",
        description: "Open a governed purchase order lookup for RECEIVE Work, Inventory Position and Payable.",
        section: "OPERATIONAL_PROJECTIONS",
        route: PURCHASE_OPERATIONS_LOOKUP_ROUTE_V010,
        capabilityOperationId: PURCHASE_OPERATIONS_ENTRY_OPEN_OPERATION_V010,
        order: 55,
        localization: {
          namespace: TRADING_REFERENCE_PACKAGE_ID_V010,
          titleKey: "workbench.purchase-lookup.title",
          descriptionKey: "workbench.purchase-lookup.description"
        }
      }
    }, {
      kind: "eidos.experience",
      manifest: {
        contractVersion: "0.1.0",
        experienceId: TRADING_REFERENCE_PACKAGE_ID_V010,
        packageId: TRADING_REFERENCE_PACKAGE_ID_V010,
        featureId: TRADING_REFERENCE_FEATURE_ID_V010,
        defaultRoute: PURCHASE_OPERATIONS_LOOKUP_ROUTE_V010,
        pages: [{
          id: PURCHASE_OPERATIONS_LOOKUP_PAGE_ID_V010,
          title: "Purchase operational lookup",
          source: PURCHASE_OPERATIONS_LOOKUP_PAGE_SOURCE_V010
        }, {
          id: PURCHASE_OPERATIONS_DETAIL_PAGE_ID_V010,
          title: "Purchase operational position",
          source: PURCHASE_OPERATIONS_DETAIL_PAGE_SOURCE_V010
        }],
        routes: [{
          id: PURCHASE_OPERATIONS_LOOKUP_PAGE_ID_V010,
          path: PURCHASE_OPERATIONS_LOOKUP_ROUTE_V010,
          pageId: PURCHASE_OPERATIONS_LOOKUP_PAGE_ID_V010
        }, {
          id: PURCHASE_OPERATIONS_DETAIL_PAGE_ID_V010,
          path: PURCHASE_OPERATIONS_DETAIL_ROUTE_V010,
          pageId: PURCHASE_OPERATIONS_DETAIL_PAGE_ID_V010
        }],
        navigation: []
      }
    }, {
      kind: "eidos.localization-bundle",
      bundle: {
        contractVersion: "0.1.0",
        namespace: TRADING_REFERENCE_PACKAGE_ID_V010,
        locale: "en",
        messages: {
          "workbench.purchase-lookup.title": "Purchase Work and Position",
          "workbench.purchase-lookup.description": "Read governed RECEIVE/PAY Work and Inventory Position for one purchase order."
        }
      }
    }, {
      kind: "eidos.localization-bundle",
      bundle: {
        contractVersion: "0.1.0",
        namespace: TRADING_REFERENCE_PACKAGE_ID_V010,
        locale: "zh-CN",
        messages: {
          "workbench.purchase-lookup.title": "采购工作与库存位置",
          "workbench.purchase-lookup.description": "按采购单查看已授权的待收货、待付款及库存位置。"
        }
      }
    }, {
      kind: "platform.capability-operation",
      operation: {
        contractVersion: "0.1.0",
        operationId: PURCHASE_OPERATIONS_READ_OPERATION_V010,
        capability: PURCHASE_OPERATIONS_CAPABILITY_V010,
        operationVersion: "0.1.0",
        title: "Read Purchase Operational Position",
        description:
          "Read authorized purchase RECEIVE/PAY work and inventory/payable positions " +
          "from the EVO ledger for an explicit purchase order and master-data references.",
        effect: "READ",
        dataScope: "ENTERPRISE",
        authorization: {
          action: PURCHASE_OPERATIONS_READ_ACTION_V010,
          resource: {
            type: "trading-reference.purchase-order",
            idSource: "INPUT",
            inputKey: "orderNo"
          }
        },
        inputSchema: {
          type: "object",
          additionalProperties: false,
          required: [
            "orderNo", "supplierCounterpartyId", "itemId", "warehouseId"
          ],
          properties: {
            orderNo: { type: "string", minLength: 1 },
            supplierCounterpartyId: { type: "string", minLength: 1 },
            itemId: { type: "string", minLength: 1 },
            warehouseId: { type: "string", minLength: 1 }
          }
        },
        outputSchema: {
          type: "object",
          required: [
            "contractVersion", "projectionId", "enterpriseId",
            "orderNo", "references", "pendingPurchaseQuantity",
            "inventoryPosition", "payableAmount", "openWork"
          ],
          properties: {
            contractVersion: { const: "0.1.0" },
            projectionId: { const: "trading-reference.purchase-operations" },
            enterpriseId: { type: "string" },
            orderNo: { type: "string" },
            references: { type: "object" },
            pendingPurchaseQuantity: { type: "number" },
            inventoryPosition: { type: "object" },
            payableAmount: { type: "number" },
            openWork: { type: "object" }
          }
        },
        binding: {
          type: "ACTION_HOST",
          commandCode: PURCHASE_OPERATIONS_READ_COMMAND_V010,
          inputVersion: "0.1.0"
        },
        exposure: ["HUMAN", "PERSONAL_AGENT", "AUTOMATION"]
      }
    }]
  }]
};
