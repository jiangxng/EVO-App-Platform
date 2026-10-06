import type { PackageManifestV010 } from "../../contracts/package.js";
import {
  ENTERPRISE_BUSINESS_DEFINITION_CAPABILITY_V010
} from "../../contracts/enterprise-business-definition.js";

export const EOG_3D_PACKAGE_ID = "evo-eog-3d";
export const EOG_3D_VIEWER_FEATURE_ID = "evo-eog-3d.viewer";
export const EOG_3D_VIEWER_CAPABILITY =
  "enterprise.operating-graph.viewer.3d";
export const EOG_3D_VIEWER_EXPERIENCE_ID = "evo-eog-3d-viewer";
export const EOG_3D_VIEWER_PAGE_ID = "evo-eog-3d-viewer.workspace";
export const EOG_3D_VIEWER_PAGE_SOURCE =
  "app://evo-enterprise-operating-graph/pages/viewer-3d";
export const EOG_3D_VIEWER_ROUTE = "/operating-graph/view/3d";

export const eog3dPackage: PackageManifestV010 = {
  contractVersion: "0.1.0",
  packageId: EOG_3D_PACKAGE_ID,
  displayName: "EOG 3D",
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
    featureId: EOG_3D_VIEWER_FEATURE_ID,
    packageId: EOG_3D_PACKAGE_ID,
    version: "0.1.0",
    activationScope: "INSTALLATION",
    defaultActivation: true,
    requiresCapabilities: [
      ENTERPRISE_BUSINESS_DEFINITION_CAPABILITY_V010
    ],
    providesCapabilities: [
      EOG_3D_VIEWER_CAPABILITY
    ],
    contributions: [{
      kind: "eidos.experience",
      manifest: {
        contractVersion: "0.1.0",
        experienceId: EOG_3D_VIEWER_EXPERIENCE_ID,
        packageId: EOG_3D_PACKAGE_ID,
        featureId: EOG_3D_VIEWER_FEATURE_ID,
        defaultRoute: EOG_3D_VIEWER_ROUTE,
        pages: [{
          id: EOG_3D_VIEWER_PAGE_ID,
          title: "Enterprise Operating Graph 3D",
          source: EOG_3D_VIEWER_PAGE_SOURCE
        }],
        routes: [{
          id: EOG_3D_VIEWER_PAGE_ID,
          path: EOG_3D_VIEWER_ROUTE,
          pageId: EOG_3D_VIEWER_PAGE_ID
        }]
        // Spatial viewer remains an installed capability and routable surface,
        // but does not occupy persistent business navigation.
      }
    }]
  }]
};
