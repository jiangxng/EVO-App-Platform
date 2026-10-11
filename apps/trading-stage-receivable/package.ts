import {stagePackageV010,stagePageV010,stagePageSourceV010} from "../trading-stage/demo-kit.js";

/** Independent Accounts Receivable APPLICATION plugin (synthetic stage fixture only). */
export const receivableStageDemoSpecV010 = {
  "domain": "receivable",
  "titleZh": "应收",
  "titleEn": "Accounts Receivable",
  "descriptionZh": "应收插件展示从业务事实派生的应收状态，不重复记账",
  "recordId": "DEMO-AR-1001",
  "referenceOrderNo": "DEMO-SO-1001",
  "statusZh": "已确认",
  "fields": {
    "应收单据": "DEMO-AR-1001",
    "应收金额": "USD 188.00",
    "来源订单": "DEMO-SO-1001",
    "账本归属": "EVO（此处仅合成示例）"
  },
  "nextDomain": "cash"
} as const;
export const receivableStagePackageV010 = stagePackageV010(receivableStageDemoSpecV010);
export const receivableStagePageV010 = stagePageV010(receivableStageDemoSpecV010);
export const receivableStagePageSourceV010 = stagePageSourceV010("receivable");
