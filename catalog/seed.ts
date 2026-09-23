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

export const referenceExperienceAssets = new Map<string, unknown>([
  ...companyNotesExperienceAssets,
  ...tradingLiteExperienceAssets
]);
