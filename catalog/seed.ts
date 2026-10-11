import type { PackageManifestV010 } from "../contracts/package.js";
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
  displayName: "EVO Ledger Runtime Compiler",
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
