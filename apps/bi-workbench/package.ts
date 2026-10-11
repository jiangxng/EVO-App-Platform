import type {
  PackageManifestV010
} from "../../contracts/package.js";
import {
  BI_WORKBENCH_CAPABILITY_V010,
  BI_WORKBENCH_FEATURE_ID_V010,
  BI_WORKBENCH_HOME_PAGE_ID_V010,
  BI_WORKBENCH_HOME_PAGE_SOURCE_V010,
  BI_WORKBENCH_HOME_ROUTE_V010,
  BI_WORKBENCH_PACKAGE_ID_V010
} from "./constants.js";

export {
  BI_WORKBENCH_CAPABILITY_V010,
  BI_WORKBENCH_FEATURE_ID_V010,
  BI_WORKBENCH_HOME_PAGE_SOURCE_V010,
  BI_WORKBENCH_HOME_ROUTE_V010,
  BI_WORKBENCH_PACKAGE_ID_V010
} from "./constants.js";

export const biWorkbenchPackage: PackageManifestV010 = {
  contractVersion: "0.1.0",
  packageId: BI_WORKBENCH_PACKAGE_ID_V010,
  displayName: "EVO BI Workbench",
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
    featureId: BI_WORKBENCH_FEATURE_ID_V010,
    packageId: BI_WORKBENCH_PACKAGE_ID_V010,
    version: "0.1.0",
    activationScope: "INSTALLATION",
    defaultActivation: true,
    providesCapabilities: [
      BI_WORKBENCH_CAPABILITY_V010
    ],
    contributions: [{
      kind: "eidos.experience",
      manifest: {
        contractVersion: "0.1.0",
        experienceId: BI_WORKBENCH_PACKAGE_ID_V010,
        packageId: BI_WORKBENCH_PACKAGE_ID_V010,
        featureId: BI_WORKBENCH_FEATURE_ID_V010,
        defaultRoute: BI_WORKBENCH_HOME_ROUTE_V010,
        pages: [{
          id: BI_WORKBENCH_HOME_PAGE_ID_V010,
          title: "Workspace",
          source: BI_WORKBENCH_HOME_PAGE_SOURCE_V010
        }],
        routes: [{
          id: BI_WORKBENCH_HOME_PAGE_ID_V010,
          path: BI_WORKBENCH_HOME_ROUTE_V010,
          pageId: BI_WORKBENCH_HOME_PAGE_ID_V010
        }],
        navigation: [{
          id: "evo-bi-workbench.nav",
          label: "Workspace",
          route: BI_WORKBENCH_HOME_ROUTE_V010,
          order: 5
        }]
      }
    }, {
      kind: "eidos.localization-bundle",
      bundle: {
        contractVersion: "0.1.0",
        namespace: BI_WORKBENCH_PACKAGE_ID_V010,
        locale: "en",
        messages: {
          "navigation.evo-bi-workbench.nav.label": "Workspace"
        }
      }
    }, {
      kind: "eidos.localization-bundle",
      bundle: {
        contractVersion: "0.1.0",
        namespace: BI_WORKBENCH_PACKAGE_ID_V010,
        locale: "zh-CN",
        messages: {
          "navigation.evo-bi-workbench.nav.label": "工作区"
        }
      }
    }]
  }]
};
