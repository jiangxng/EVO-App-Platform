import type { PackageManifestV010, PlatformCapabilityOperationContributionV010 } from "../contracts/package.js";
import {
  ORGANIZATION_PACKAGE_ID_V010, ORGANIZATION_FEATURE_ID_V010,
  ORGANIZATION_CAPABILITY_V010, ORGANIZATION_LIST_COMMAND_V010,
  ORGANIZATION_DRAFT_COMMAND_V010, ORGANIZATION_PUBLISH_COMMAND_V010,
  ORGANIZATION_RESOLVE_COMMAND_V010
} from "../contracts/reference-data/organization.js";
import { ENTERPRISE_RESOURCE_CAPABILITY_V010 } from "../contracts/enterprise-resource.js";
import {
  enterpriseAgentExperienceAssets,
  enterpriseAgentPackage
} from "../agents/enterprise-agent/package.js";
import {
  LEDGER_RUNTIME_CONFIGURATION_CAPABILITY,
  ledgerRuntimeConfigurationCapabilityContributionsV010
} from "../apps/ledger-runtime-configurator/capability-manifest.js";
import {
  enterpriseContextGovernanceAppPackage
} from "../apps/enterprise-context-governance/package.js";
import {
  enterpriseContextGovernanceExperienceAssets
} from "../apps/enterprise-context-governance/experience-assets.js";
import {
  ledgerManagerPackage
} from "../apps/ledger-manager/package.js";
import {
  templateStorePackage
} from "../apps/template-store/package.js";
import {
  counterpartyPackage
} from "../apps/counterparty/package.js";
import {
  itemPackage
} from "../apps/item/package.js";
import {
  warehousePackage
} from "../apps/warehouse/package.js";
import {
  tradingReferencePackageV010
} from "../apps/trading-reference/package.js";
import {
  biWorkbenchPackage
} from "../apps/bi-workbench/package.js";
import {
  dataImportPackage
} from "../apps/data-import/package.js";
import {
  objectExtensionPackage
} from "../apps/object-extension/package.js";
import {
  responsibilityPackage
} from "../apps/responsibility/package.js";
import {
  BUSINESS_DICTIONARY_CAPABILITY_V010, BUSINESS_DICTIONARY_FEATURE_ID,
  BUSINESS_DICTIONARY_PACKAGE_ID, BUSINESS_DICTIONARY_AUTH_RESOURCE_V010,
  BUSINESS_DICTIONARY_DRAFT_COMMAND_V010, BUSINESS_DICTIONARY_LIST_COMMAND_V010,
  BUSINESS_DICTIONARY_PUBLISH_COMMAND_V010, BUSINESS_DICTIONARY_RESOLVE_COMMAND_V010,
  BUSINESS_DICTIONARY_PUBLISH_ACTION_V010, BUSINESS_DICTIONARY_READ_ACTION_V010,
  BUSINESS_DICTIONARY_WRITE_ACTION_V010
} from "../contracts/reference-data/dictionary-operations.js";
import {
  eog2dPackage
} from "../apps/eog-2d/package.js";
import {
  eog3dPackage
} from "../apps/eog-3d/package.js";
import {
  enterpriseObservatoryPackage
} from "../apps/enterprise-observatory/package.js";

export { enterpriseAgentPackage } from "../agents/enterprise-agent/package.js";
export {
  enterpriseContextGovernanceAppPackage
} from "../apps/enterprise-context-governance/package.js";
export {
  templateStorePackage
} from "../apps/template-store/package.js";
export {
  counterpartyPackage
} from "../apps/counterparty/package.js";
export {
  itemPackage
} from "../apps/item/package.js";
export {
  warehousePackage
} from "../apps/warehouse/package.js";
export {
  tradingReferencePackageV010
} from "../apps/trading-reference/package.js";
export {
  biWorkbenchPackage
} from "../apps/bi-workbench/package.js";
export {
  dataImportPackage
} from "../apps/data-import/package.js";
export {
  objectExtensionPackage
} from "../apps/object-extension/package.js";
export {
  responsibilityPackage
} from "../apps/responsibility/package.js";

export {
  ledgerManagerPackage
} from "../apps/ledger-manager/package.js";
export {
  eog2dPackage
} from "../apps/eog-2d/package.js";
export {
  eog3dPackage
} from "../apps/eog-3d/package.js";
export {
  eog3dViewerPackage
} from "../apps/eog-3d-viewer/package.js";
export {
  enterpriseObservatoryPackage
} from "../apps/enterprise-observatory/package.js";


export const companyNotesPackage: PackageManifestV010 = {
  contractVersion: "0.1.0",
  packageId: "company-notes",
  displayName: "Company Notes",
  description: "提供企业笔记示例页面，演示插件安装、启用与内容展示。",
  displayNameTranslations: {
    "en": "Company Notes",
    "zh-CN": "企业笔记",
    "ja": "企業ノート",
    "zh-TW": "企業筆記"
  },
  version: "0.1.0",
  type: "APPLICATION",
  features: [
    {
      contractVersion: "0.1.0",
      featureId: "company-notes.default",
      packageId: "company-notes",
      version: "0.1.0",
      activationScope: "INSTALLATION",
      defaultActivation: true,
      providesCapabilities: ["company-notes"],
      contributions: [
        {
          kind: "eidos.experience",
          manifest: {
            contractVersion: "0.1.0",
            experienceId: "company-notes",
            packageId: "company-notes",
            featureId: "company-notes.default",
            defaultRoute: "/notes",
            pages: [
              { id: "company-notes.home", title: "Company Notes", source: "app://company-notes/pages/home" }
            ],
            routes: [
              { id: "company-notes.home", path: "/notes", pageId: "company-notes.home" }
            ],
            navigation: [
              { id: "company-notes.nav", label: "Company Notes", route: "/notes", order: 20 }
            ]
          }
        },
        {
          kind: "eidos.localization-bundle",
          bundle: {
            contractVersion: "0.1.0",
            namespace: "company-notes",
            locale: "en",
            messages: {
                      "navigation.company-notes.nav.label": "Company Notes",
                      "page.company-notes.home.title": "Company Notes",
                      "field.company-notes.home.title.label": "Title",
                      "field.company-notes.home.content.label": "Content",
                      "action.company-notes.home.save.label": "Save Note"
            }
          }
        },
        {
          kind: "eidos.localization-bundle",
          bundle: {
            contractVersion: "0.1.0",
            namespace: "company-notes",
            locale: "zh-CN",
            messages: {
                      "navigation.company-notes.nav.label": "企业笔记",
                      "page.company-notes.home.title": "企业笔记",
                      "field.company-notes.home.title.label": "标题",
                      "field.company-notes.home.content.label": "内容",
                      "action.company-notes.home.save.label": "保存笔记"
            }
          }
        }
      ]
    }
  ]
};

export const evoFoundationPackage: PackageManifestV010 = {
  contractVersion: "0.1.0",
  packageId: "evo.core",
  displayName: "EVO Foundation",
  description: "声明业务数据、记账与账本依赖；实际执行还需连接并配置账本服务。",
  displayNameTranslations: {
    "en": "EVO Foundation",
    "zh-CN": "EVO 基础运行时",
    "ja": "EVO 基盤ランタイム",
    "zh-TW": "EVO 基礎執行環境"
  },
  version: "0.1.0",
  type: "FOUNDATION_RUNTIME",
  features: [
    {
      contractVersion: "0.1.0",
      featureId: "evo.business-data",
      packageId: "evo.core",
      version: "0.1.0",
      activationScope: "INSTALLATION",
      providesCapabilities: ["evo.business-data"]
    },
    {
      contractVersion: "0.1.0",
      featureId: "evo.posting",
      packageId: "evo.core",
      version: "0.1.0",
      activationScope: "INSTALLATION",
      providesCapabilities: ["evo.posting"],
      requiresCapabilities: ["evo.business-data"]
    },
    {
      contractVersion: "0.1.0",
      featureId: "evo.ledger",
      packageId: "evo.core",
      version: "0.1.0",
      activationScope: "INSTALLATION",
      providesCapabilities: ["evo.ledger"],
      requiresCapabilities: ["evo.posting"]
    },
    {
      contractVersion: "0.1.0",
      featureId: "evo.balance",
      packageId: "evo.core",
      version: "0.1.0",
      activationScope: "INSTALLATION",
      providesCapabilities: ["evo.balance"],
      requiresCapabilities: ["evo.ledger"]
    }
  ]
};


export const ledgerRuntimeConfiguratorPackage: PackageManifestV010 = {
  contractVersion: "0.1.0",
  packageId: "evo-ledger-runtime-configurator",
  displayName: "EVO Ledger Compiler (Legacy Compatibility)",
  description: "兼容旧编译接口及配置读取；新账本请在账本管理中校验并发布，无需另装此插件。",
  displayNameTranslations: {
    "en": "EVO Ledger Compiler (Legacy Compatibility)",
    "zh-CN": "EVO 账本编译兼容接口",
    "ja": "EVO 台帳コンパイラ（旧版互換）",
    "zh-TW": "EVO 帳本編譯相容介面"
  },
  version: "0.1.0",
  type: "RUNTIME_EXTENSION",
  features: [
    {
      contractVersion: "0.1.0",
      featureId: "evo-ledger-runtime-configurator.default",
      packageId: "evo-ledger-runtime-configurator",
      version: "0.1.0",
      activationScope: "INSTALLATION",
      defaultActivation: true,
      requiresCapabilities: ["evo.posting", "evo.ledger"],
      providesCapabilities: [
        "evo.ledger-runtime.configurator",
        LEDGER_RUNTIME_CONFIGURATION_CAPABILITY
      ],
      contributions: [
        ...ledgerRuntimeConfigurationCapabilityContributionsV010
      ]
    }
  ]
};


export const tradingLitePackage: PackageManifestV010 = {
  contractVersion: "0.1.0",
  packageId: "trading-lite",
  displayName: "Trading Lite",
  description: "展示轻量交易示例及其运行时依赖，验证插件协作流程。",
  displayNameTranslations: {
    "en": "Trading Lite",
    "zh-CN": "轻量交易示例",
    "ja": "軽量取引サンプル",
    "zh-TW": "輕量交易範例"
  },
  version: "0.1.0",
  type: "APPLICATION",
  features: [
    {
      contractVersion: "0.1.0",
      featureId: "trading-lite.default",
      packageId: "trading-lite",
      version: "0.1.0",
      activationScope: "INSTALLATION",
      defaultActivation: true,
      requiresCapabilities: ["evo.business-data", "evo.posting", "evo.ledger", "evo.balance", "enterprise.application-runtime-binding"],
      providesCapabilities: ["trading-lite"],
      contributions: [
        {
          kind: "eidos.experience",
          manifest: {
            contractVersion: "0.1.0",
            experienceId: "trading-lite",
            packageId: "trading-lite",
            featureId: "trading-lite.default",
            defaultRoute: "/trading",
            pages: [
              { id: "trading-lite.home", title: "Trading Lite", source: "app://trading-lite/pages/home" }
            ],
            routes: [
              { id: "trading-lite.home", path: "/trading", pageId: "trading-lite.home" }
            ],
            navigation: [
              { id: "trading-lite.nav", label: "Trading Lite", route: "/trading", order: 30 }
            ]
          }
        },
        {
          kind: "eidos.localization-bundle",
          bundle: {
            contractVersion: "0.1.0",
            namespace: "trading-lite",
            locale: "en",
            messages: {
                      "navigation.trading-lite.nav.label": "Trading Lite",
                      "page.trading-lite.home.title": "Trading Lite",
                      "field.trading-lite.home.customer.label": "Customer",
                      "field.trading-lite.home.item.label": "Item",
                      "field.trading-lite.home.quantity.label": "Quantity",
                      "field.trading-lite.home.amount.label": "Amount",
                      "action.trading-lite.home.create-order.label": "Create Order"
            }
          }
        },
        {
          kind: "eidos.localization-bundle",
          bundle: {
            contractVersion: "0.1.0",
            namespace: "trading-lite",
            locale: "zh-CN",
            messages: {
                      "navigation.trading-lite.nav.label": "轻量交易",
                      "page.trading-lite.home.title": "轻量交易",
                      "field.trading-lite.home.customer.label": "客户",
                      "field.trading-lite.home.item.label": "商品",
                      "field.trading-lite.home.quantity.label": "数量",
                      "field.trading-lite.home.amount.label": "金额",
                      "action.trading-lite.home.create-order.label": "创建订单"
            }
          }
        }
      ]
    }
  ]
};

export const companyNotesExperienceAssets = new Map<string, unknown>([
  ["app://company-notes/pages/home", {
    contractVersion: "0.1.1",
    kind: "form",
    id: "company-notes.home",
    title: "Company Notes",
    purpose: "execute-command",
    command: { code: "company-notes.save-note", inputVersion: "0.1.0" },
    fields: [
      { key: "title", label: "Title", semanticType: "note-title", control: "text", required: true },
      { key: "content", label: "Content", semanticType: "note-content", control: "text", required: true }
    ],
    actions: [
      { id: "save", label: "Save Note", type: "submit", command: "company-notes.save-note", requiresConfirmation: false }
    ],
    metadata: { packageId: "company-notes", featureId: "company-notes.default" }
  }]
]);

export const tradingLiteExperienceAssets = new Map<string, unknown>([
  ["app://trading-lite/pages/home", {
    contractVersion: "0.1.1",
    kind: "form",
    id: "trading-lite.home",
    title: "Trading Lite",
    purpose: "execute-command",
    command: { code: "trading-lite.create-order", inputVersion: "0.1.0" },
    fields: [
      { key: "customer", label: "Customer", semanticType: "customer-name", control: "text", required: true },
      { key: "item", label: "Item", semanticType: "item-name", control: "text", required: true },
      { key: "quantity", label: "Quantity", semanticType: "quantity", control: "number", required: true },
      { key: "amount", label: "Amount", semanticType: "money", control: "money", required: true }
    ],
    actions: [
      {
        id: "create-order",
        label: "Create Order",
        type: "submit",
        command: "trading-lite.create-order",
        requiresConfirmation: false
      }
    ],
    metadata: { packageId: "trading-lite", featureId: "trading-lite.default" }
  }]
]);


export const ledgerRuntimeConfiguratorExperienceAssets = new Map<string, unknown>([
  ["app://evo-ledger-runtime-configurator/pages/home", {
    contractVersion: "0.1.1",
    kind: "form",
    id: "evo-ledger-runtime-configurator.home",
    title: "Ledger Runtime Configurator — Bookkeeping defaults",
    purpose: "execute-command",
    command: {
      code: "evo-ledger-runtime-configurator.validate-default",
      inputVersion: "0.1.0"
    },
    fields: [],
    actions: [
      {
        id: "validate-default",
        label: "Validate Default Configuration",
        type: "submit",
        command: "evo-ledger-runtime-configurator.validate-default",
        requiresConfirmation: false
      }
    ],
    metadata: {
      packageId: "evo-ledger-runtime-configurator",
      featureId: "evo-ledger-runtime-configurator.default",
      defaultConfiguration: {
        accounts: 141,
        applications: 143,
        dictionaries: 106,
        postingRules: 912,
        referenceLegacyPostingRules: 587
      }
    }
  }]
]);

export const referenceExperienceAssets = new Map<string, unknown>([
  ...enterpriseAgentExperienceAssets,
  ...enterpriseContextGovernanceExperienceAssets,
  ...companyNotesExperienceAssets,
  ...tradingLiteExperienceAssets,
  ...ledgerRuntimeConfiguratorExperienceAssets
]);


// Optional plugin metadata only. Do not import its runtime or handlers at startup.
// Control-plane catalog owns inert declarations; business semantics load on demand.
const businessDictionaryOptionSchema = {
  type: "object", required: ["code", "label", "status"],
  properties: {
    code: { type: "string", minLength: 1 },
    label: { type: "object" },
    aliases: { type: "array", items: { type: "string" } },
    status: { enum: ["ACTIVE", "INACTIVE"] }
  }
} as const;

const businessDictionarySchema = {
  type: "object",
  required: ["contractVersion", "contextId", "dictionaryId", "version", "state", "options"],
  properties: {
    contractVersion: { const: "0.1.0" },
    contextId: { type: "string" }, dictionaryId: { type: "string" },
    version: { type: "integer" },
    state: { enum: ["BUSINESS_DICTIONARY_DRAFT_COMMAND_V010", "PUBLISHED"] },
    options: { type: "array", items: businessDictionaryOptionSchema }
  }
} as const;

const businessDictionaryOp = (operationId: string, effect: "READ" | "WRITE", action: string,
  commandCode: string, properties: Record<string, unknown>, required: string[] = []) => ({
  kind: "platform.capability-operation" as const,
  operation: {
    contractVersion: "0.1.0" as const,
    operationId, capability: BUSINESS_DICTIONARY_CAPABILITY_V010, operationVersion: "0.1.0",
    title: operationId, description: "Enterprise-scoped governed business dictionary operation",
    effect, dataScope: "ENTERPRISE" as const,
    authorization: { action, resource: {
      type: BUSINESS_DICTIONARY_AUTH_RESOURCE_V010, idSource: "DATA_SCOPE" as const
    } },
    inputSchema: {
      type: "object", additionalProperties: false, required, properties
    },
    outputSchema: { type: "object" },
    binding: { type: "ACTION_HOST" as const, commandCode, inputVersion: "0.1.0" },
    exposure: (effect === "READ" ? ["HUMAN", "PERSONAL_AGENT"]
      : ["HUMAN"]) as ("HUMAN" | "PERSONAL_AGENT")[],
    ...(effect === "WRITE" ? { writeSafety: {
      idempotency: "HOST_REQUIRED" as const,
      receipt: "HOST_REQUIRED" as const
    } } : {})
  }
});

export const businessDictionaryCapabilityContributionsV010:
  PlatformCapabilityOperationContributionV010[] = [
    businessDictionaryOp(BUSINESS_DICTIONARY_LIST_COMMAND_V010, "READ", BUSINESS_DICTIONARY_READ_ACTION_V010, BUSINESS_DICTIONARY_LIST_COMMAND_V010,
      { dictionaryId: { type: "string" } }),
    businessDictionaryOp(BUSINESS_DICTIONARY_RESOLVE_COMMAND_V010, "READ", BUSINESS_DICTIONARY_READ_ACTION_V010, BUSINESS_DICTIONARY_RESOLVE_COMMAND_V010, {
      dictionaryId: { type: "string", minLength: 1 },
      expectedVersion: { type: "integer" },
      sourceValues: { type: "array", items: { type: "string" } }
    }, ["dictionaryId", "sourceValues"]),
    businessDictionaryOp(BUSINESS_DICTIONARY_DRAFT_COMMAND_V010, "WRITE", BUSINESS_DICTIONARY_WRITE_ACTION_V010, BUSINESS_DICTIONARY_DRAFT_COMMAND_V010, {
      dictionaryId: { type: "string", minLength: 1 },
      expectedVersion: { type: "integer", minimum: 0 },
      options: { type: "array", items: businessDictionaryOptionSchema }
    }, ["dictionaryId", "expectedVersion", "options"]),
    businessDictionaryOp(BUSINESS_DICTIONARY_PUBLISH_COMMAND_V010, "WRITE", BUSINESS_DICTIONARY_PUBLISH_ACTION_V010, BUSINESS_DICTIONARY_PUBLISH_COMMAND_V010, {
      dictionaryId: { type: "string", minLength: 1 },
      expectedVersion: { type: "integer", minimum: 1 }
    }, ["dictionaryId", "expectedVersion"])
  ];

export const businessDictionaryPackage: PackageManifestV010 = {
  contractVersion: "0.1.0",
  packageId: BUSINESS_DICTIONARY_PACKAGE_ID,
  displayName: "EVO Business Dictionary",
  description: "管理企业业务字典、稳定编码、批量字典值及受控发布。",
  displayNameTranslations: {
    en: "EVO Business Dictionary",
    "zh-CN": "EVO 业务字典",
    ja: "EVO 業務辞書",
    "zh-TW": "EVO 業務字典"
  },
  version: "0.1.0",
  type: "APPLICATION",
  publisher: { id: "evo", displayName: "EVO", trust: "FIRST_PARTY", source: "built-in" },
  compatibility: {
    appPlatform: ">=0.1.0 <0.2.0", eidos: "^1.3.0", pluginProtocol: "0.1.0"
  },
  features: [{
    contractVersion: "0.1.0",
    featureId: BUSINESS_DICTIONARY_FEATURE_ID,
    packageId: BUSINESS_DICTIONARY_PACKAGE_ID,
    version: "0.1.0",
    activationScope: "INSTALLATION",
    defaultActivation: true,
    requiresCapabilities: [ENTERPRISE_RESOURCE_CAPABILITY_V010],
    providesCapabilities: [BUSINESS_DICTIONARY_CAPABILITY_V010],
    contributions: [...businessDictionaryCapabilityContributionsV010]
  }]
};



// Inert organization catalog metadata. No static import of org runtime/application.
const organizationUnitSchemaV010 = {
  type: "object", required: ["unitId", "code", "displayName", "kind", "status"],
  properties: {
    unitId: { type: "string", minLength: 1 },
    code: { type: "string", minLength: 1 },
    displayName: { type: "object" },
    kind: { enum: ["DEPARTMENT", "DIVISION", "TEAM", "OTHER"] },
    parentUnitId: { type: "string" },
    aliases: { type: "array", items: { type: "string" } },
    status: { enum: ["ACTIVE", "INACTIVE"] },
    effectiveFrom: { type: "string" },
    effectiveTo: { type: "string" }
  }
} as const;
const organizationOperationV010 = (command:string,effect:"READ"|"WRITE",
  properties:Record<string,unknown>,required:string[]=[]):
  PlatformCapabilityOperationContributionV010 => ({
  kind:"platform.capability-operation",
  operation:{
    contractVersion:"0.1.0",operationId:command,
    capability:ORGANIZATION_CAPABILITY_V010,
    operationVersion:"0.1.0",
    title:command,
    description:"Enterprise-scoped organization hierarchy and stable identity operation",
    effect,dataScope:"ENTERPRISE",
    authorization:{
      action:effect==="READ"?"organization.read":command===ORGANIZATION_PUBLISH_COMMAND_V010
        ?"organization.publish":"organization.write",
      resource:{type:"organization.definition",idSource:"DATA_SCOPE"}
    },
    inputSchema:{type:"object",additionalProperties:false,required,properties},
    outputSchema:{type:"object"},
    binding:{type:"ACTION_HOST",commandCode:command,inputVersion:"0.1.0"},
    exposure:effect==="READ"?["HUMAN","PERSONAL_AGENT"]:["HUMAN"],
    ...(effect==="WRITE"?{writeSafety:{idempotency:"HOST_REQUIRED",receipt:"HOST_REQUIRED"}}:{})
  }
});
export const organizationPackage:PackageManifestV010={
  contractVersion:"0.1.0",packageId:ORGANIZATION_PACKAGE_ID_V010,
  displayName:"EVO Organization",
  description:"维护企业部门与组织关系、稳定身份和版本化发布。",
  displayNameTranslations:{
    en:"EVO Organization","zh-CN":"EVO 组织管理",
    ja:"EVO 組織管理","zh-TW":"EVO 組織管理"
  },
  version:"0.1.0",type:"APPLICATION",
  publisher:{id:"evo",displayName:"EVO",trust:"FIRST_PARTY",source:"built-in"},
  compatibility:{appPlatform:">=0.1.0 <0.2.0",eidos:"^1.3.0",pluginProtocol:"0.1.0"},
  features:[{
    contractVersion:"0.1.0",featureId:ORGANIZATION_FEATURE_ID_V010,
    packageId:ORGANIZATION_PACKAGE_ID_V010,version:"0.1.0",
    activationScope:"INSTALLATION",defaultActivation:true,
    requiresCapabilities:["enterprise.resource.repository"],
    providesCapabilities:[ORGANIZATION_CAPABILITY_V010],
    contributions:[
      organizationOperationV010(ORGANIZATION_LIST_COMMAND_V010,"READ",
        {organizationId:{type:"string"}}),
      organizationOperationV010(ORGANIZATION_RESOLVE_COMMAND_V010,"READ",
        {organizationId:{type:"string",minLength:1},
         sourceValues:{type:"array",items:{type:"string"}},
         expectedVersion:{type:"integer"},
         effectiveAt:{type:"string"}},["organizationId","sourceValues"]),
      organizationOperationV010(ORGANIZATION_DRAFT_COMMAND_V010,"WRITE",
        {organizationId:{type:"string",minLength:1},
         expectedVersion:{type:"integer",minimum:0},
         units:{type:"array",items:organizationUnitSchemaV010}},
         ["organizationId","expectedVersion","units"]),
      organizationOperationV010(ORGANIZATION_PUBLISH_COMMAND_V010,"WRITE",
        {organizationId:{type:"string",minLength:1},
         expectedVersion:{type:"integer",minimum:1}},["organizationId","expectedVersion"])
    ]
  }]
};
