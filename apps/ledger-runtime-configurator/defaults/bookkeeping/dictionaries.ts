// Generated from jiangxng/bookkeeping src/main/resources/dictionary.sql. Preserve source semantics; do not hand-edit.
export const bookkeepingDictionaries: readonly Record<string, unknown>[] = [
  {
    "id": 1,
    "key": "数量",
    "text": "quantity",
    "type": null,
    "description": null
  },
  {
    "id": 2,
    "key": "本次领料",
    "text": "quantity",
    "type": null,
    "description": null
  },
  {
    "id": 3,
    "key": "合格数",
    "text": "quantity",
    "type": null,
    "description": null
  },
  {
    "id": 4,
    "key": "关闭待领料数",
    "text": "closePickingQuantity",
    "type": null,
    "description": null
  },
  {
    "id": 5,
    "key": "验收数",
    "text": "quantity",
    "type": null,
    "description": null
  },
  {
    "id": 6,
    "key": "待验收",
    "text": "thenLockQty",
    "type": null,
    "description": null
  },
  {
    "id": 7,
    "key": "不合格数",
    "text": "unQuantity",
    "type": null,
    "description": null
  },
  {
    "id": 8,
    "key": "制损数",
    "text": "lossMakingQuantity",
    "type": null,
    "description": null
  },
  {
    "id": 9,
    "key": "不含税金额",
    "text": "amountWithoutTax",
    "type": null,
    "description": null
  },
  {
    "id": 10,
    "key": "含税金额",
    "text": "amount",
    "type": null,
    "description": null
  },
  {
    "id": 11,
    "key": "价税小计",
    "text": "amount",
    "type": null,
    "description": null
  },
  {
    "id": 12,
    "key": "价税计合",
    "text": "amount",
    "type": null,
    "description": null
  },
  {
    "id": 13,
    "key": "支付金额",
    "text": "amount",
    "type": null,
    "description": null
  },
  {
    "id": 14,
    "key": "金额",
    "text": "amount",
    "type": null,
    "description": null
  },
  {
    "id": 15,
    "key": "预付款",
    "text": "advancCharge",
    "type": null,
    "description": null
  },
  {
    "id": 16,
    "key": "预收款",
    "text": "advancesReceived",
    "type": null,
    "description": null
  },
  {
    "id": 17,
    "key": "关闭工单",
    "text": "whether",
    "type": null,
    "description": null
  },
  {
    "id": 18,
    "key": "项目",
    "text": "project",
    "type": null,
    "description": null
  },
  {
    "id": 19,
    "key": "部门",
    "text": "department",
    "type": null,
    "description": null
  },
  {
    "id": 20,
    "key": "客户编码",
    "text": "customer",
    "type": null,
    "description": null
  },
  {
    "id": 21,
    "key": "供应商编码",
    "text": "supplier",
    "type": null,
    "description": null
  },
  {
    "id": 22,
    "key": "个人",
    "text": "people",
    "type": null,
    "description": null
  },
  {
    "id": 23,
    "key": "销售订单",
    "text": "SO",
    "type": null,
    "description": null
  },
  {
    "id": 24,
    "key": "采购订单",
    "text": "PO",
    "type": null,
    "description": null
  },
  {
    "id": 25,
    "key": "加工订单",
    "text": "MO",
    "type": null,
    "description": null
  },
  {
    "id": 26,
    "key": "SPU",
    "text": "SPU",
    "type": null,
    "description": null
  },
  {
    "id": 27,
    "key": "仓库编码",
    "text": "storage",
    "type": null,
    "description": null
  },
  {
    "id": 28,
    "key": "库位编码",
    "text": "storageLocation",
    "type": null,
    "description": null
  },
  {
    "id": 29,
    "key": "箱码",
    "text": "boxCode",
    "type": null,
    "description": null
  },
  {
    "id": 30,
    "key": "销项发票",
    "text": "outputReceipt",
    "type": null,
    "description": null
  },
  {
    "id": 31,
    "key": "进项发票",
    "text": "inputReceipt",
    "type": null,
    "description": null
  },
  {
    "id": 32,
    "key": "现金流项目名称",
    "text": "cashFlowItem",
    "type": null,
    "description": null
  },
  {
    "id": 33,
    "key": "其他核算对象",
    "text": "otherObject",
    "type": null,
    "description": null
  },
  {
    "id": 34,
    "key": "物料编码",
    "text": "matCode",
    "type": null,
    "description": null
  },
  {
    "id": 35,
    "key": "物料属性",
    "text": "inventoryForms",
    "type": null,
    "description": null
  },
  {
    "id": 36,
    "key": "标识",
    "text": "changeTag",
    "type": null,
    "description": null
  },
  {
    "id": 37,
    "key": "税金",
    "text": "tax",
    "type": null,
    "description": null
  },
  {
    "id": 38,
    "key": "增加",
    "text": "add",
    "type": "system",
    "description": null
  },
  {
    "id": 39,
    "key": "减少",
    "text": "sub",
    "type": "system",
    "description": null
  },
  {
    "id": 40,
    "key": "借方",
    "text": "Dr",
    "type": "system",
    "description": null
  },
  {
    "id": 41,
    "key": "负借",
    "text": "-Dr",
    "type": "system",
    "description": null
  },
  {
    "id": 42,
    "key": "贷方",
    "text": "Cr",
    "type": "system",
    "description": null
  },
  {
    "id": 43,
    "key": "工价",
    "text": "labor",
    "type": null,
    "description": null
  },
  {
    "id": 44,
    "key": "制造费用",
    "text": "fee",
    "type": null,
    "description": null
  },
  {
    "id": 45,
    "key": "发票类型",
    "text": "invoiceType",
    "type": null,
    "description": null
  },
  {
    "id": 46,
    "key": "日期",
    "text": "date",
    "type": null,
    "description": null
  },
  {
    "id": 47,
    "key": "工序编码",
    "text": "proPointCode",
    "type": null,
    "description": null
  },
  {
    "id": 48,
    "key": "开工日期",
    "text": "commencementDate",
    "type": null,
    "description": null
  },
  {
    "id": 49,
    "key": "工作中心",
    "text": "workingCenterCode",
    "type": null,
    "description": null
  },
  {
    "id": 50,
    "key": "往来标签",
    "text": "dealerLabel",
    "type": null,
    "description": null
  },
  {
    "id": 51,
    "key": "生产批号",
    "text": "batchNo",
    "type": null,
    "description": null
  },
  {
    "id": 52,
    "key": "生产日期",
    "text": "productionDate",
    "type": null,
    "description": null
  },
  {
    "id": 53,
    "key": "派工单号",
    "text": "dispatchCode",
    "type": null,
    "description": null
  },
  {
    "id": 54,
    "key": "费用编码",
    "text": "expCode",
    "type": null,
    "description": null
  },
  {
    "id": 55,
    "key": "费用小类",
    "text": "expSubject",
    "type": null,
    "description": null
  },
  {
    "id": 56,
    "key": "设施类型",
    "text": "facilityType",
    "type": null,
    "description": null
  },
  {
    "id": 57,
    "key": "二级科目",
    "text": "accountSub",
    "type": null,
    "description": null
  },
  {
    "id": 58,
    "key": "资金账户大类",
    "text": "cashType",
    "type": null,
    "description": null
  },
  {
    "id": 59,
    "key": "资金编码",
    "text": "cashCode",
    "type": null,
    "description": null
  },
  {
    "id": 60,
    "key": "部门职能类型",
    "text": "depFunctionType",
    "type": null,
    "description": null
  },
  {
    "id": 61,
    "key": "invoiceNumber",
    "text": "invoiceNumber",
    "type": null,
    "description": null
  },
  {
    "id": 62,
    "key": "备货入库数",
    "text": "stockUpQuantity",
    "type": null,
    "description": null
  },
  {
    "id": 63,
    "key": "关闭可验收数",
    "text": "closeAcceptableQuantity",
    "type": null,
    "description": null
  },
  {
    "id": 64,
    "key": "关闭待配料数",
    "text": "closeBatchingQuantity",
    "type": null,
    "description": null
  },
  {
    "id": 65,
    "key": "工资总额",
    "text": "totalWage",
    "type": null,
    "description": null
  },
  {
    "id": 66,
    "key": "社保个人",
    "text": "socialSecurityPerson",
    "type": null,
    "description": null
  },
  {
    "id": 67,
    "key": "社保公司",
    "text": "socialSecurityCompany",
    "type": null,
    "description": null
  },
  {
    "id": 68,
    "key": "公积金个人",
    "text": "providentFundPerson",
    "type": null,
    "description": null
  },
  {
    "id": 69,
    "key": "公积金公司",
    "text": "providentFundCompany",
    "type": null,
    "description": null
  },
  {
    "id": 70,
    "key": "个税",
    "text": "personalIncomeTax",
    "type": null,
    "description": null
  },
  {
    "id": 71,
    "key": "应发工资",
    "text": "wagesPayable",
    "type": null,
    "description": null
  },
  {
    "id": 72,
    "key": "费用科目",
    "text": "expAccount",
    "type": null,
    "description": null
  },
  {
    "id": 73,
    "key": "transMatchedCode",
    "text": "transMatchedCode",
    "type": null,
    "description": null
  },
  {
    "id": 74,
    "key": "采购申请",
    "text": "poRequestCode",
    "type": null,
    "description": null
  },
  {
    "id": 75,
    "key": "storageLocation",
    "text": "storageLocation",
    "type": null,
    "description": null
  },
  {
    "id": 76,
    "key": "containerNumber",
    "text": "containerNumber",
    "type": null,
    "description": null
  },
  {
    "id": 77,
    "key": "结算方式",
    "text": "dealerPaymentTerm",
    "type": null,
    "description": null
  },
  {
    "id": 81,
    "key": "往来编码",
    "text": "dealerCode",
    "type": null,
    "description": null
  },
  {
    "id": 82,
    "key": "销售订单号",
    "text": "SO",
    "type": null,
    "description": null
  },
  {
    "id": 83,
    "key": "changeTag",
    "text": "changeTag",
    "type": null,
    "description": null
  },
  {
    "id": 84,
    "key": "采购订单号",
    "text": "PO",
    "type": null,
    "description": null
  },
  {
    "id": 85,
    "key": "仓库类型",
    "text": "storageType",
    "type": null,
    "description": null
  },
  {
    "id": 86,
    "key": "加工订单号",
    "text": "MO",
    "type": null,
    "description": null
  },
  {
    "id": 87,
    "key": "受益期限",
    "text": "benefitPeriod",
    "type": null,
    "description": null
  },
  {
    "id": 88,
    "key": "币种",
    "text": "currency",
    "type": null,
    "description": null
  },
  {
    "id": 89,
    "key": "其他核算编码",
    "text": "otherObject",
    "type": null,
    "description": null
  },
  {
    "id": 90,
    "key": "设施编码",
    "text": "facilityCode",
    "type": null,
    "description": null
  },
  {
    "id": 91,
    "key": "经办组织",
    "text": "department",
    "type": null,
    "description": null
  },
  {
    "id": 92,
    "key": "负贷",
    "text": "-Cr",
    "type": "system",
    "description": null
  },
  {
    "id": 93,
    "key": "手续费",
    "text": "commissionCharge",
    "type": null,
    "description": null
  },
  {
    "id": 94,
    "key": "设施卡片编码",
    "text": "facilityCardCode",
    "type": null,
    "description": null
  },
  {
    "id": 95,
    "key": "开票单号",
    "text": "invoiceCode",
    "type": null,
    "description": null
  },
  {
    "id": 96,
    "key": "现金流项目",
    "text": "cashFlowId",
    "type": null,
    "description": null
  },
  {
    "id": 97,
    "key": "借贷方向",
    "text": "checkDirection",
    "type": null,
    "description": null
  },
  {
    "id": 98,
    "key": "科目编码",
    "text": "accountCode",
    "type": null,
    "description": null
  },
  {
    "id": 100,
    "key": "调减待派工数",
    "text": "reduceDispatchQuantity",
    "type": null,
    "description": null
  },
  {
    "id": 101,
    "key": "调减待验收数",
    "text": "reduceAcceptableQuantity",
    "type": null,
    "description": null
  },
  {
    "id": 102,
    "key": "需求数量",
    "text": "requiredQuantity",
    "type": null,
    "description": null
  },
  {
    "id": 103,
    "key": "净收款金额",
    "text": "pureAmount",
    "type": null,
    "description": null
  },
  {
    "id": 104,
    "key": "票号",
    "text": "invoiceCode",
    "type": null,
    "description": null
  },
  {
    "id": 105,
    "key": "检损数",
    "text": "lossDetectionQuantity",
    "type": null,
    "description": null
  },
  {
    "id": 106,
    "key": "卡片",
    "text": "card",
    "type": null,
    "description": null
  },
  {
    "id": 107,
    "key": "月份",
    "text": "month",
    "type": null,
    "description": null
  },
  {
    "id": 108,
    "key": "验收总数",
    "text": "acceptanceSum",
    "type": null,
    "description": null
  },
  {
    "id": 109,
    "key": "原值金额",
    "text": "originalValueAmount",
    "type": null,
    "description": null
  },
  {
    "id": 110,
    "key": "累计折旧金额",
    "text": "accumulatedDepreciationAmount",
    "type": null,
    "description": null
  }
];
