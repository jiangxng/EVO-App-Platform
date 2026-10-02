import type { PackageManifestV010 } from "../../contracts/package.js";
import {
  ENTERPRISE_BUSINESS_DEFINITION_CAPABILITY_V010
} from "../../contracts/enterprise-business-definition.js";

export const EOG_2D_DESIGNER_PACKAGE_ID = "evo-eog-2d-designer";
export const EOG_2D_DESIGNER_FEATURE_ID = "evo-eog-2d-designer.default";
export const EOG_2D_DESIGNER_CAPABILITY = "enterprise.operating-graph.designer.2d";
export const EOG_2D_DESIGNER_EXPERIENCE_ID = "evo-eog-2d-designer";
export const EOG_2D_DESIGNER_PAGE_ID = "evo-eog-2d-designer.editor";
export const EOG_2D_DESIGNER_PAGE_SOURCE =
  "app://evo-enterprise-operating-graph/pages/editor";
export const EOG_2D_DESIGNER_ROUTE = "/operating-graph";

export const eog2dDesignerPackage: PackageManifestV010 = {
  contractVersion: "0.1.0",
  packageId: EOG_2D_DESIGNER_PACKAGE_ID,
  displayName: "EOG 2D Designer",
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
    featureId: EOG_2D_DESIGNER_FEATURE_ID,
    packageId: EOG_2D_DESIGNER_PACKAGE_ID,
    version: "0.1.0",
    activationScope: "INSTALLATION",
    defaultActivation: false,
    requiresCapabilities: [
      ENTERPRISE_BUSINESS_DEFINITION_CAPABILITY_V010,
      "authorization.check"
    ],
    providesCapabilities: [
      EOG_2D_DESIGNER_CAPABILITY
    ],
    contributions: [{
      kind: "eidos.experience",
      manifest: {
        contractVersion: "0.1.0",
        experienceId: EOG_2D_DESIGNER_EXPERIENCE_ID,
        packageId: EOG_2D_DESIGNER_PACKAGE_ID,
        featureId: EOG_2D_DESIGNER_FEATURE_ID,
        defaultRoute: EOG_2D_DESIGNER_ROUTE,
        pages: [{
          id: EOG_2D_DESIGNER_PAGE_ID,
          title: "Enterprise Operating Graph Designer",
          source: EOG_2D_DESIGNER_PAGE_SOURCE
        }],
        routes: [{
          id: EOG_2D_DESIGNER_PAGE_ID,
          path: EOG_2D_DESIGNER_ROUTE,
          pageId: EOG_2D_DESIGNER_PAGE_ID
        }],
        navigation: [{
          id: "evo-eog-2d-designer.nav",
          label: "Operating Graph Designer",
          route: EOG_2D_DESIGNER_ROUTE,
          order: 15
        }]
      }
    }]
  }]
};
