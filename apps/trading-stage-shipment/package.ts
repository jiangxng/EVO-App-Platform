import {stagePackageV010,stagePageV010,stagePageSourceV010} from "../trading-stage/demo-kit.js";

/** Independent Sales Shipments APPLICATION plugin (synthetic stage fixture only). */
export const shipmentStageDemoSpecV010 = {
  "domain": "shipment",
  "titleZh": "出库发货",
  "titleEn": "Sales Shipments",
  "descriptionZh": "发货插件独立展示从销售订单引用的出库履约事件",
  "recordId": "DEMO-SHIP-1001",
  "referenceOrderNo": "DEMO-SO-1001",
  "statusZh": "已履约",
  "fields": {
    "出库仓库": "演示仓库 A",
    "销售订单": "DEMO-SO-1001",
    "发货数量": 1,
    "业务事件": "sales_order.shipped"
  },
  "nextDomain": "receivable"
} as const;
export const shipmentStagePackageV010 = stagePackageV010(shipmentStageDemoSpecV010);
export const shipmentStagePageV010 = stagePageV010(shipmentStageDemoSpecV010);
export const shipmentStagePageSourceV010 = stagePageSourceV010("shipment");
