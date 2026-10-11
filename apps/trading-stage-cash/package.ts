import {stagePackageV010,stagePageV010,stagePageSourceV010} from "../trading-stage/demo-kit.js";

/** Independent Customer Receipts APPLICATION plugin (synthetic stage fixture only). */
export const cashStageDemoSpecV010 = {
  "domain": "cash",
  "titleZh": "收款",
  "titleEn": "Customer Receipts",
  "descriptionZh": "收款插件独立展示客户收款业务记录与应收关联，禁止触发财务分配",
  "recordId": "DEMO-REC-1001",
  "referenceOrderNo": "DEMO-SO-1001",
  "statusZh": "已收款",
  "fields": {
    "收款单据": "DEMO-REC-1001",
    "关联应收": "DEMO-AR-1001",
    "收款金额": "USD 188.00",
    "业务事件": "customer_cash_receipt.recorded"
  }
} as const;
export const cashStagePackageV010 = stagePackageV010(cashStageDemoSpecV010);
export const cashStagePageV010 = stagePageV010(cashStageDemoSpecV010);
export const cashStagePageSourceV010 = stagePageSourceV010("cash");
