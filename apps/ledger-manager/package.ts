import type { PackageManifestV010 } from "../../contracts/package.js";
import {
  LEDGER_MANAGER_DETAIL_PAGE_ID,
  LEDGER_MANAGER_DETAIL_PAGE_SOURCE,
  LEDGER_MANAGER_DETAIL_ROUTE,
  LEDGER_MANAGER_FEATURE_ID,
  LEDGER_MANAGER_PACKAGE_ID,
  LEDGER_MANAGER_PAGE_ID,
  LEDGER_MANAGER_PAGE_SOURCE,
  LEDGER_MANAGER_ROUTE
} from "./constants.js";

export const ledgerManagerPackage: PackageManifestV010 = {
  contractVersion: "0.1.0",
  packageId: LEDGER_MANAGER_PACKAGE_ID,
  displayName: "EVO Ledger Manager",
  version: "0.1.0",
  type: "APPLICATION",
  publisher: {
    id: "evo",
    displayName: "EVO",
    trust: "FIRST_PARTY",
    source: "built-in"
  },
  compatibility: {
    appPlatform: ">=0.1.0 <0.2.0",
    eidos: "^1.3.0",
    pluginProtocol: "0.1.0"
  },
  features: [{
    contractVersion: "0.1.0",
    featureId: LEDGER_MANAGER_FEATURE_ID,
    packageId: LEDGER_MANAGER_PACKAGE_ID,
    version: "0.1.0",
    activationScope: "INSTALLATION",
    defaultActivation: true,
    requiresCapabilities: [
      "enterprise.business-definition.repository",
      "authorization.check",
      "evo.posting",
      "evo.ledger"
    ],
    providesCapabilities: ["evo.ledger-manager"],
    contributions: [{
      kind: "eidos.experience",
      manifest: {
        contractVersion: "0.1.0",
        experienceId: LEDGER_MANAGER_PACKAGE_ID,
        packageId: LEDGER_MANAGER_PACKAGE_ID,
        featureId: LEDGER_MANAGER_FEATURE_ID,
        defaultRoute: LEDGER_MANAGER_ROUTE,
        pages: [{
          id: LEDGER_MANAGER_PAGE_ID,
          title: "Ledger Manager",
          source: LEDGER_MANAGER_PAGE_SOURCE
        }, {
          id: LEDGER_MANAGER_DETAIL_PAGE_ID,
          title: "Ledger Definition",
          source: LEDGER_MANAGER_DETAIL_PAGE_SOURCE
        }],
        routes: [{
          id: LEDGER_MANAGER_PAGE_ID,
          path: LEDGER_MANAGER_ROUTE,
          pageId: LEDGER_MANAGER_PAGE_ID
        }, {
          id: LEDGER_MANAGER_DETAIL_PAGE_ID,
          path: LEDGER_MANAGER_DETAIL_ROUTE,
          pageId: LEDGER_MANAGER_DETAIL_PAGE_ID
        }]
      }
    }, {
      kind: "eidos.localization-bundle",
      bundle: {
        contractVersion: "0.1.0",
        namespace: LEDGER_MANAGER_PACKAGE_ID,
        locale: "en",
        messages: {
          "navigation.evo-ledger-manager.nav.label": "Ledger Manager"
        }
      }
    }, {
      kind: "eidos.localization-bundle",
      bundle: {
        contractVersion: "0.1.0",
        namespace: LEDGER_MANAGER_PACKAGE_ID,
        locale: "zh-CN",
        messages: {
          "navigation.evo-ledger-manager.nav.label": "账本管理"
        }
      }
    }]
  }]
};
