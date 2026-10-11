import type {
  FoundationObjectDescriptorV010
} from "../../contracts/foundation-object/descriptor.js";
import type {
  ObjectExtensionDefinitionV010
} from "../../contracts/foundation-object/extension.js";
import type {
  EffectiveObjectSchemaV010,
  FoundationObjectCoreSchemaV010
} from "../../contracts/foundation-object/schema.js";
import {
  compileEffectiveObjectSchemaV010,
  type FoundationObjectFieldAuthorizationV010
} from "../../foundation/schema-compiler/index.js";

export const ITEM_RESOURCE_TYPE_V010 = "item.subject" as const;
export const ITEM_SCHEMA_V010 = "evo.item/0.1.0" as const;
export const ITEM_IDENTITY_SLOT_V010 = "item.identity" as const;
export const ITEM_TRADE_PROFILE_SLOT_V010 = "item.trade-profile" as const;
export const ITEM_INVENTORY_PROFILE_SLOT_V010 =
  "item.inventory-profile" as const;

export type ItemKindV010 = "GOODS" | "SERVICE";

export const itemFoundationObjectDescriptorV010:
  FoundationObjectDescriptorV010 = {
    contractVersion: "0.1.0",
    objectType: ITEM_RESOURCE_TYPE_V010,
    ownerPackageId: "evo-item",
    identitySchemaRef: ITEM_SCHEMA_V010,
    extensionSlots: [{
      slotId: ITEM_IDENTITY_SLOT_V010,
      label: "Item identity",
      allowsEnterpriseExtensions: true
    }, {
      slotId: ITEM_TRADE_PROFILE_SLOT_V010,
      label: "Trade profile",
      allowsEnterpriseExtensions: true
    }, {
      slotId: ITEM_INVENTORY_PROFILE_SLOT_V010,
      label: "Inventory profile",
      allowsEnterpriseExtensions: true
    }],
    commands: [],
    queries: [],
    importTargets: [],
    projectionSources: [],
    permissionCapabilities: [],
    agentOperations: []
  };

export const itemCoreSchemaV010: FoundationObjectCoreSchemaV010 = {
  contractVersion: "0.1.0",
  objectType: ITEM_RESOURCE_TYPE_V010,
  ownerPackageId: "evo-item",
  schemaRef: ITEM_SCHEMA_V010,
  fields: [{
    fieldId: "itemId",
    slotId: ITEM_IDENTITY_SLOT_V010,
    semanticType: "item-id",
    valueType: "STRING",
    control: "text",
    label: {
      default: "ID",
      translations: { "zh-CN": "ID" }
    },
    required: true,
    readOnly: true,
    order: 0,
    surfaces: ["EDIT", "DETAIL", "EXPORT", "AGENT_READ"]
  }, {
    fieldId: "code",
    slotId: ITEM_IDENTITY_SLOT_V010,
    semanticType: "item-code",
    valueType: "STRING",
    control: "text",
    label: {
      default: "Item code",
      translations: { "zh-CN": "物料/项目编码" }
    },
    description: {
      default: "Enterprise-stable Item identifier. It is not a GTIN, SKU or barcode unless the enterprise intentionally defines it that way.",
      translations: {
        "zh-CN": "企业内稳定的 Item 标识。除非企业明确这样定义，否则它不等同于 GTIN、SKU 或条码。"
      }
    },
    required: true,
    order: 10,
    surfaces: [
      "CREATE", "EDIT", "DETAIL", "LIST",
      "IMPORT", "EXPORT", "FILTER", "AGENT_READ", "AGENT_WRITE"
    ]
  }, {
    fieldId: "displayName",
    slotId: ITEM_IDENTITY_SLOT_V010,
    semanticType: "item-display-name",
    valueType: "STRING",
    control: "text",
    label: {
      default: "Display name",
      translations: { "zh-CN": "物料/项目名称" }
    },
    description: {
      default: "Human-facing Item name used in enterprise work.",
      translations: { "zh-CN": "企业业务工作中供人识别 Item 的显示名称。" }
    },
    required: true,
    order: 20,
    surfaces: [
      "CREATE", "EDIT", "DETAIL", "LIST",
      "IMPORT", "EXPORT", "FILTER", "AGENT_READ", "AGENT_WRITE"
    ]
  }, {
    fieldId: "itemKind",
    slotId: ITEM_IDENTITY_SLOT_V010,
    semanticType: "item-kind",
    valueType: "ENUM",
    control: "select",
    label: {
      default: "Item kind",
      translations: { "zh-CN": "Item 类型" }
    },
    description: {
      default: "Minimal operational distinction between tangible/intangible goods and services. Category, variant and SKU semantics are separate concerns.",
      translations: {
        "zh-CN": "最小业务边界：货物类 Item 与服务类 Item。分类、变体和 SKU 属于独立语义问题。"
      }
    },
    required: true,
    order: 30,
    surfaces: [
      "CREATE", "EDIT", "DETAIL", "LIST",
      "IMPORT", "EXPORT", "FILTER", "AGENT_READ", "AGENT_WRITE"
    ],
    enumOptions: [{
      value: "GOODS",
      label: {
        default: "Goods",
        translations: { "zh-CN": "货物" }
      },
      aliases: ["goods", "product", "material", "货物", "商品", "物料"]
    }, {
      value: "SERVICE",
      label: {
        default: "Service",
        translations: { "zh-CN": "服务" }
      },
      aliases: ["service", "服务"]
    }]
  }, {
    fieldId: "baseUomCode",
    slotId: ITEM_IDENTITY_SLOT_V010,
    semanticType: "unit-of-measure-code",
    valueType: "STRING",
    control: "text",
    label: {
      default: "Base unit of measure",
      translations: { "zh-CN": "基本计量单位" }
    },
    description: {
      default: "Canonical quantity unit code for this Item. The domain will align governed codes with UN/CEFACT Recommendation 20 instead of treating arbitrary display text as authority.",
      translations: {
        "zh-CN": "该 Item 的规范数量计量单位代码。后续受治理代码将与 UN/CEFACT Recommendation 20 对齐，不把任意显示文本当作权威。"
      }
    },
    required: true,
    order: 40,
    surfaces: [
      "CREATE", "EDIT", "DETAIL", "LIST",
      "IMPORT", "EXPORT", "FILTER", "AGENT_READ", "AGENT_WRITE"
    ]
  }, {
    fieldId: "description",
    slotId: ITEM_IDENTITY_SLOT_V010,
    semanticType: "item-description",
    valueType: "STRING",
    control: "text",
    label: {
      default: "Description",
      translations: { "zh-CN": "说明" }
    },
    required: false,
    order: 50,
    surfaces: [
      "CREATE", "EDIT", "DETAIL", "IMPORT",
      "EXPORT", "AGENT_READ", "AGENT_WRITE"
    ]
  }]
};

export function createItemEffectiveObjectSchemaV010(input: {
  locale?: string;
  itemKind?: ItemKindV010;
  applicabilityMode?: "EFFECTIVE" | "DISCOVERY";
  extensions?: readonly ObjectExtensionDefinitionV010[];
  authorizeField?: FoundationObjectFieldAuthorizationV010;
} = {}): EffectiveObjectSchemaV010 {
  return compileEffectiveObjectSchemaV010({
    descriptor: itemFoundationObjectDescriptorV010,
    coreSchema: itemCoreSchemaV010,
    locale: input.locale,
    applicabilityMode: input.applicabilityMode,
    ...(input.itemKind
      ? { activeQualifiers: { "item.kind": [input.itemKind] } }
      : {}),
    extensions: input.extensions,
    authorizeField: input.authorizeField
  });
}
