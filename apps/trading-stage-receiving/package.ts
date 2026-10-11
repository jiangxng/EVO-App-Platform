import { stagePackageV010, stagePageV010, stagePageSourceV010 } from "../trading-stage/demo-kit.js";

/**
 * Independent receiving APPLICATION Package, first-stage READ-only Eidos Experience.
 * The existing operational TR-01 reference service remains the authoritative
 * compatibility path until its BusinessData operations are migrated explicitly.
 * No ledger, inventory valuation, FIFO or financial allocation implementation.
 */
export const receivingStageDemoSpecV010 = {
  "domain": "receiving",
  "titleZh": "采购收货",
  "titleEn": "Goods Receiving",
  "descriptionZh": "收货插件独立展示采购履约和不可变冲销关系，不产生影子库存账",
  "recordId": "DEMO-GR-1001",
  "referenceOrderNo": "DEMO-PO-1001",
  "statusZh": "已收货",
  "fields": {
    "关联采购单": "DEMO-PO-1001",
    "收货数量": 10,
    "收货仓库": "演示仓库 A",
    "业务事件": "goods_receipt.received"
  }
} as const;
export const receivingStagePackageV010 = stagePackageV010(receivingStageDemoSpecV010);
export const receivingStagePageV010 = stagePageV010(receivingStageDemoSpecV010);
export const receivingStagePageSourceV010 = stagePageSourceV010("receiving");
