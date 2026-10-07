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
      }
    }, {
      value: "PERSON",
      label: {
        default: "Person",
        translations: { "zh-CN": "个人" }
      }
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
