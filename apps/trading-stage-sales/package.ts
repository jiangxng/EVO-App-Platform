import {stagePackageV010,stagePageV010,stagePageSourceV010} from "../trading-stage/demo-kit.js";

/** Independent Sales Orders APPLICATION plugin (synthetic stage fixture only). */
export const salesStageDemoSpecV010 = {
  "domain": "sales",
  "titleZh": "销售订单",
  "titleEn": "Sales Orders",
  "descriptionZh": "销售订单插件独立展示已确认订单事实",
  "recordId": "DEMO-SO-1001",
  "referenceOrderNo": "DEMO-SO-1001",
  "statusZh": "已确认",
  "fields": {
    "客户": "演示客户 A",
    "订单金额": "USD 188.00",
    "销售数量": 1,
    "业务事件": "sales_order.approved"
  },
  "nextDomain": "shipment"
} as const;
export const salesStagePackageV010 = stagePackageV010(salesStageDemoSpecV010);
export const salesStagePageV010 = stagePageV010(salesStageDemoSpecV010);
export const salesStagePageSourceV010 = stagePageSourceV010("sales");
