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
import {
  COUNTERPARTY_ARCHIVE_COMMAND,
  COUNTERPARTY_ASSIGN_ROLE_COMMAND,
  COUNTERPARTY_CREATE_COMMAND,
  COUNTERPARTY_REMOVE_ROLE_COMMAND,
  COUNTERPARTY_UPDATE_COMMAND
} from "./constants.js";
import {
  COUNTERPARTY_RESOURCE_TYPE_V010,
  COUNTERPARTY_SCHEMA_V010
} from "./repository.js";

export const COUNTERPARTY_IDENTITY_SLOT_V010 =
  "counterparty.identity" as const;
export const COUNTERPARTY_CUSTOMER_PROFILE_SLOT_V010 =
  "counterparty.customer-profile" as const;
export const COUNTERPARTY_SUPPLIER_PROFILE_SLOT_V010 =
  "counterparty.supplier-profile" as const;

export const counterpartyFoundationObjectDescriptorV010:
  FoundationObjectDescriptorV010 = {
    contractVersion: "0.1.0",
    objectType: COUNTERPARTY_RESOURCE_TYPE_V010,
    ownerPackageId: "evo-counterparty",
    identitySchemaRef: COUNTERPARTY_SCHEMA_V010,
    extensionSlots: [{
      slotId: COUNTERPARTY_IDENTITY_SLOT_V010,
      label: "Counterparty identity",
      allowsEnterpriseExtensions: true
    }, {
      slotId: COUNTERPARTY_CUSTOMER_PROFILE_SLOT_V010,
      label: "Customer profile",
      allowsEnterpriseExtensions: true
    }, {
      slotId: COUNTERPARTY_SUPPLIER_PROFILE_SLOT_V010,
      label: "Supplier profile",
      allowsEnterpriseExtensions: true
    }],
    commands: [
      COUNTERPARTY_CREATE_COMMAND,
      COUNTERPARTY_UPDATE_COMMAND,
      COUNTERPARTY_ARCHIVE_COMMAND,
      COUNTERPARTY_ASSIGN_ROLE_COMMAND,
      COUNTERPARTY_REMOVE_ROLE_COMMAND
    ],
    queries: [
      "counterparty.get",
      "counterparty.list"
    ],
    importTargets: [
      "counterparty.subject"
    ],
    projectionSources: [
      "counterparty.subject"
    ],
    permissionCapabilities: [
      "counterparty.read",
      "counterparty.write"
    ],
    agentOperations: []
  };

export const counterpartyCoreSchemaV010: FoundationObjectCoreSchemaV010 = {
  contractVersion: "0.1.0",
  objectType: COUNTERPARTY_RESOURCE_TYPE_V010,
  ownerPackageId: "evo-counterparty",
  schemaRef: COUNTERPARTY_SCHEMA_V010,
  fields: [{
    fieldId: "counterpartyId",
    slotId: COUNTERPARTY_IDENTITY_SLOT_V010,
    semanticType: "counterparty-id",
    valueType: "STRING",
    control: "text",
    label: {
      default: "ID",
      translations: { "zh-CN": "ID" }
    },
    required: true,
    readOnly: true,
    order: 0,
    surfaces: ["EDIT", "DETAIL", "AGENT_READ", "EXPORT"]
  }, {
    fieldId: "code",
    slotId: COUNTERPARTY_IDENTITY_SLOT_V010,
    semanticType: "counterparty-code",
    valueType: "STRING",
    control: "text",
    label: {
      default: "Counterparty code",
      translations: { "zh-CN": "往来编码" }
    },
    description: {
      default: "Enterprise-stable identifier used to identify and deduplicate the counterparty. Prefer an actual source-system code/key; a display name is not a substitute unless the source system intentionally uses names as codes.",
      translations: {
        "zh-CN": "企业内稳定识别并去重往来对象的编码。应优先使用源系统真实编码或键；除非源系统明确以名称作为编码，否则名称不能替代编码。"
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
    slotId: COUNTERPARTY_IDENTITY_SLOT_V010,
    semanticType: "counterparty-display-name",
    valueType: "STRING",
    control: "text",
    label: {
      default: "Display name",
      translations: { "zh-CN": "往来名称" }
    },
    description: {
      default: "Human-facing name used to identify the counterparty in business work. It may differ from the registered legal name.",
      translations: {
        "zh-CN": "业务工作中供人识别往来对象的显示名称，可以与法定登记名称不同。"
      }
    },
    required: true,
    order: 20,
    surfaces: [
      "CREATE", "EDIT", "DETAIL", "LIST",
      "IMPORT", "EXPORT", "FILTER", "AGENT_READ", "AGENT_WRITE"
    ]
  }, {
    fieldId: "subjectType",
    slotId: COUNTERPARTY_IDENTITY_SLOT_V010,
    semanticType: "counterparty-subject-type",
    valueType: "ENUM",
    control: "select",
    label: {
      default: "Subject type",
      translations: { "zh-CN": "主体类型" }
    },
    description: {
      default: "Identity form of the counterparty: an organization/legal entity or an individual person. This is not a customer/supplier category, product or service category, industry, relationship role, or other business classification.",
      translations: {
        "zh-CN": "往来对象的身份形态：机构/法人主体或个人。它不是客户/供应商分类、产品或服务分类、行业、关系角色或其他业务分类。"
      }
    },
    required: true,
    order: 30,
    surfaces: [
      "CREATE", "EDIT", "DETAIL",
      "IMPORT", "EXPORT", "FILTER", "AGENT_READ", "AGENT_WRITE"
    ],
    enumOptions: [{
      value: "ORGANIZATION",
      label: {
        default: "Organization",
        translations: { "zh-CN": "机构" }
      },
      aliases: [
        "organization",
        "organisation",
        "company",
        "corporation",
        "legal entity",
        "机构",
        "组织",
        "企业",
        "公司",
        "法人",
        "法人主体"
      ]
    }, {
      value: "PERSON",
      label: {
        default: "Person",
        translations: { "zh-CN": "个人" }
      },
      aliases: [
        "person",
        "individual",
        "natural person",
        "个人",
        "自然人"
      ]
    }]
  }, {
    fieldId: "legalName",
    slotId: COUNTERPARTY_IDENTITY_SLOT_V010,
    semanticType: "counterparty-legal-name",
    valueType: "STRING",
    control: "text",
    label: {
      default: "Legal name",
      translations: { "zh-CN": "法定名称" }
    },
    description: {
      default: "Registered legal name of the counterparty when known.",
      translations: { "zh-CN": "往来对象已知的法定登记名称。" }
    },
    required: false,
    order: 40,
    surfaces: [
      "CREATE", "EDIT", "DETAIL", "IMPORT",
      "EXPORT", "FILTER", "AGENT_READ", "AGENT_WRITE"
    ]
  }, {
    fieldId: "taxIdentifier",
    slotId: COUNTERPARTY_IDENTITY_SLOT_V010,
    semanticType: "tax-identifier",
    valueType: "STRING",
    control: "text",
    label: {
      default: "Tax identifier",
      translations: { "zh-CN": "税号 / 纳税识别号" }
    },
    description: {
      default: "Official tax registration identifier. Do not map unrelated business codes here.",
      translations: { "zh-CN": "官方税务登记识别号，不应映射无关的业务编码。" }
    },
    required: false,
    order: 50,
    surfaces: [
      "CREATE", "EDIT", "DETAIL", "IMPORT",
      "EXPORT", "FILTER", "AGENT_READ", "AGENT_WRITE"
    ]
  }, {
    fieldId: "countryOrRegion",
    slotId: COUNTERPARTY_IDENTITY_SLOT_V010,
    semanticType: "country-or-region",
    valueType: "STRING",
    control: "text",
    label: {
      default: "Country or region",
      translations: { "zh-CN": "国家或地区" }
    },
    description: {
      default: "Country or region associated with the counterparty identity or primary business location.",
      translations: { "zh-CN": "与往来对象身份或主要经营所在地相关的国家或地区。" }
    },
    required: false,
    order: 60,
    surfaces: [
      "CREATE", "EDIT", "DETAIL", "IMPORT",
      "EXPORT", "FILTER", "AGENT_READ", "AGENT_WRITE"
    ]
  }, {
    fieldId: "phone",
    slotId: COUNTERPARTY_IDENTITY_SLOT_V010,
    semanticType: "phone",
    valueType: "STRING",
    control: "text",
    label: {
      default: "Phone",
      translations: { "zh-CN": "联系电话" }
    },
    description: {
      default: "Telephone or phone contact value only. Email addresses and payment instructions do not belong in this field.",
      translations: { "zh-CN": "仅用于电话号码或电话联系方式。电子邮件地址、付款说明等信息不属于该字段。" }
    },
    required: false,
    order: 70,
    surfaces: [
      "CREATE", "EDIT", "DETAIL", "IMPORT",
      "EXPORT", "AGENT_READ", "AGENT_WRITE"
    ]
  }, {
    fieldId: "email",
    slotId: COUNTERPARTY_IDENTITY_SLOT_V010,
    semanticType: "email",
    valueType: "STRING",
    control: "text",
    label: {
      default: "Email",
      translations: { "zh-CN": "电子邮件" }
    },
    description: {
      default: "Electronic mail address for the counterparty.",
      translations: { "zh-CN": "往来对象的电子邮件地址。" }
    },
    required: false,
    order: 80,
    surfaces: [
      "CREATE", "EDIT", "DETAIL", "IMPORT",
      "EXPORT", "AGENT_READ", "AGENT_WRITE"
    ]
  }, {
    fieldId: "notes",
    slotId: COUNTERPARTY_IDENTITY_SLOT_V010,
    semanticType: "notes",
    valueType: "STRING",
    control: "text",
    label: {
      default: "Notes",
      translations: { "zh-CN": "备注" }
    },
    description: {
      default: "Free-form explanatory notes. This is not a catch-all replacement for structured business fields, profiles, transactions, balances, or audit data.",
      translations: {
        "zh-CN": "自由文本说明。它不是结构化业务字段、档案、交易、余额或审计数据的通用替代存储。"
      }
    },
    required: false,
    order: 90,
    surfaces: [
      "CREATE", "EDIT", "IMPORT", "EXPORT", "AGENT_READ", "AGENT_WRITE"
    ]
  }]
};

export function createCounterpartyEffectiveObjectSchemaV010(input: {
  locale?: string;
  activeRelationshipRoles?: readonly string[];
  extensions?: readonly ObjectExtensionDefinitionV010[];
  authorizeField?: FoundationObjectFieldAuthorizationV010;
} = {}): EffectiveObjectSchemaV010 {
  return compileEffectiveObjectSchemaV010({
    descriptor: counterpartyFoundationObjectDescriptorV010,
    coreSchema: counterpartyCoreSchemaV010,
    locale: input.locale,
    activeRelationshipRoles: input.activeRelationshipRoles,
    extensions: input.extensions,
    authorizeField: input.authorizeField
  });
}
