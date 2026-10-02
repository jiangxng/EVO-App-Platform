import type { PackageManifestV010 } from "../../contracts/package.js";
import {
  ENTERPRISE_BUSINESS_DEFINITION_CAPABILITY_V010
} from "../../contracts/enterprise-business-definition.js";

export const EOG_2D_VIEWER_PACKAGE_ID = "evo-eog-2d-viewer";
export const EOG_2D_VIEWER_FEATURE_ID = "evo-eog-2d-viewer.default";
export const EOG_2D_VIEWER_CAPABILITY = "enterprise.operating-graph.viewer.2d";

export const eog2dViewerPackage: PackageManifestV010 = {
  contractVersion: "0.1.0",
  packageId: EOG_2D_VIEWER_PACKAGE_ID,
  displayName: "EOG 2D Viewer",
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
    featureId: EOG_2D_VIEWER_FEATURE_ID,
    packageId: EOG_2D_VIEWER_PACKAGE_ID,
    version: "0.1.0",
    activationScope: "INSTALLATION",
    defaultActivation: false,
    requiresCapabilities: [
      ENTERPRISE_BUSINESS_DEFINITION_CAPABILITY_V010
    ],
    providesCapabilities: [
      EOG_2D_VIEWER_CAPABILITY
    ]
  }]
};
