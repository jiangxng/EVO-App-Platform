import type { PackageManifestV010 } from "../contracts/package.js";

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
  displayName: "EVO Ledger Runtime Configurator",
  version: "0.1.0",
  type: "APPLICATION",
  features: [
    {
      contractVersion: "0.1.0",
      featureId: "evo-ledger-runtime-configurator.default",
      packageId: "evo-ledger-runtime-configurator",
      version: "0.1.0",
      activationScope: "INSTALLATION",
      defaultActivation: true,
      requiresCapabilities: ["evo.posting", "evo.ledger"],
      providesCapabilities: ["evo.ledger-runtime.configurator"],
      contributions: [
        {
          kind: "eidos.experience",
          manifest: {
            contractVersion: "0.1.0",
            experienceId: "evo-ledger-runtime-configurator",
            packageId: "evo-ledger-runtime-configurator",
            featureId: "evo-ledger-runtime-configurator.default",
            defaultRoute: "/ledger-runtime-configurator",
            pages: [
              {
                id: "evo-ledger-runtime-configurator.home",
                title: "Ledger Runtime Configurator",
                source: "app://evo-ledger-runtime-configurator/pages/home"
              }
            ],
            routes: [
              {
                id: "evo-ledger-runtime-configurator.home",
                path: "/ledger-runtime-configurator",
                pageId: "evo-ledger-runtime-configurator.home"
              }
            ],
            navigation: [
              {
                id: "evo-ledger-runtime-configurator.nav",
                label: "Ledger Configurator",
                route: "/ledger-runtime-configurator",
                order: 40
              }
            ]
          }
        }
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
      requiresCapabilities: ["evo.business-data", "evo.posting", "evo.ledger", "evo.balance"],
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
  ...companyNotesExperienceAssets,
  ...tradingLiteExperienceAssets,
  ...ledgerRuntimeConfiguratorExperienceAssets
]);
