import { stagePackageV010, stagePageV010, stagePageSourceV010 } from "../trading-stage/demo-kit.js";

/**
 * Independent purchasing APPLICATION Package, first-stage READ-only Eidos Experience.
 * The existing operational TR-01 reference service remains the authoritative
 * compatibility path until its BusinessData operations are migrated explicitly.
 * No ledger, inventory valuation, FIFO or financial allocation implementation.
 */
export const purchasingStageDemoSpecV010 = {
  "domain": "purchasing",
  "titleZh": "采购订单",
  "titleEn": "Purchase Orders",
  "descriptionZh": "采购插件独立展示经授权采购订单事实",
  "recordId": "DEMO-PO-1001",
  "referenceOrderNo": "DEMO-PO-1001",
  "statusZh": "已批准",
  "fields": {
    "供应商": "演示供应商 A",
    "物料": "演示物料 A",
    "订单金额": "CNY 125.00",
    "采购数量": 10,
    "业务事件": "purchase_order.approved"
  },
  "nextDomain": "receiving"
} as const;
export const purchasingStagePackageV010 = stagePackageV010(purchasingStageDemoSpecV010);
export const purchasingStagePageV010 = stagePageV010(purchasingStageDemoSpecV010);
export const purchasingStagePageSourceV010 = stagePageSourceV010("purchasing");
