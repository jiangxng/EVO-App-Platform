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

export const WAREHOUSE_RESOURCE_TYPE_V010 = "warehouse.subject" as const;
export const WAREHOUSE_SCHEMA_V010 = "evo.warehouse/0.1.0" as const;
export const WAREHOUSE_IDENTITY_SLOT_V010 = "warehouse.identity" as const;
export const WAREHOUSE_FACILITY_PROFILE_SLOT_V010 =
  "warehouse.facility-profile" as const;

export const warehouseFoundationObjectDescriptorV010:
  FoundationObjectDescriptorV010 = {
    contractVersion: "0.1.0",
    objectType: WAREHOUSE_RESOURCE_TYPE_V010,
    ownerPackageId: "evo-warehouse",
    identitySchemaRef: WAREHOUSE_SCHEMA_V010,
    extensionSlots: [{
      slotId: WAREHOUSE_IDENTITY_SLOT_V010,
      label: "Warehouse identity",
      allowsEnterpriseExtensions: true
    }, {
      slotId: WAREHOUSE_FACILITY_PROFILE_SLOT_V010,
      label: "Facility profile",
      allowsEnterpriseExtensions: true
    }],
    commands: [],
    queries: [],
    importTargets: [],
    projectionSources: [],
    permissionCapabilities: [],
    agentOperations: []
  };

export const warehouseCoreSchemaV010: FoundationObjectCoreSchemaV010 = {
  contractVersion: "0.1.0",
  objectType: WAREHOUSE_RESOURCE_TYPE_V010,
  ownerPackageId: "evo-warehouse",
  schemaRef: WAREHOUSE_SCHEMA_V010,
  fields: [{
    fieldId: "warehouseId",
    slotId: WAREHOUSE_IDENTITY_SLOT_V010,
    semanticType: "warehouse-id",
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
    slotId: WAREHOUSE_IDENTITY_SLOT_V010,
    semanticType: "warehouse-code",
    valueType: "STRING",
    control: "text",
    label: {
      default: "Warehouse code",
      translations: { "zh-CN": "仓库编码" }
    },
    description: {
      default: "Enterprise-stable warehouse identity code. External location identifiers such as GLN remain separate identifier evidence.",
      translations: {
        "zh-CN": "企业内稳定的仓库身份编码。GLN 等外部位置标识保持为独立识别证据。"
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
    slotId: WAREHOUSE_IDENTITY_SLOT_V010,
    semanticType: "warehouse-display-name",
    valueType: "STRING",
    control: "text",
    label: {
      default: "Warehouse name",
      translations: { "zh-CN": "仓库名称" }
    },
    required: true,
    order: 20,
    surfaces: [
      "CREATE", "EDIT", "DETAIL", "LIST",
      "IMPORT", "EXPORT", "FILTER", "AGENT_READ", "AGENT_WRITE"
    ]
  }, {
    fieldId: "description",
    slotId: WAREHOUSE_IDENTITY_SLOT_V010,
    semanticType: "warehouse-description",
    valueType: "STRING",
    control: "text",
    label: {
      default: "Description",
      translations: { "zh-CN": "说明" }
    },
    required: false,
    order: 30,
    surfaces: [
      "CREATE", "EDIT", "DETAIL", "IMPORT",
      "EXPORT", "AGENT_READ", "AGENT_WRITE"
    ]
  }]
};

export function createWarehouseEffectiveObjectSchemaV010(input: {
  locale?: string;
  extensions?: readonly ObjectExtensionDefinitionV010[];
  authorizeField?: FoundationObjectFieldAuthorizationV010;
} = {}): EffectiveObjectSchemaV010 {
  return compileEffectiveObjectSchemaV010({
    descriptor: warehouseFoundationObjectDescriptorV010,
    coreSchema: warehouseCoreSchemaV010,
    locale: input.locale,
    extensions: input.extensions,
    authorizeField: input.authorizeField
  });
}
