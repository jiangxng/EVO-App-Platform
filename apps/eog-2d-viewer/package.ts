import type { PackageManifestV010 } from "../../contracts/package.js";
import {
  ENTERPRISE_BUSINESS_DEFINITION_CAPABILITY_V010
} from "../../contracts/enterprise-business-definition.js";

export const EOG_2D_VIEWER_PACKAGE_ID = "evo-eog-2d-viewer";
export const EOG_2D_VIEWER_FEATURE_ID = "evo-eog-2d-viewer.default";
export const EOG_2D_VIEWER_CAPABILITY = "enterprise.operating-graph.viewer.2d";
export const EOG_2D_VIEWER_EXPERIENCE_ID = "evo-eog-2d-viewer";
export const EOG_2D_VIEWER_WORKSPACE_PAGE_ID = "evo-eog-2d-viewer.workspace";
export const EOG_2D_VIEWER_WORKSPACE_PAGE_SOURCE =
  "app://evo-enterprise-operating-graph/pages/viewer";
export const EOG_2D_VIEWER_WORKSPACE_ROUTE = "/operating-graph/view";

/**
 * Observatory identifiers remain stable compatibility entrypoints.
 */
export const EOG_2D_VIEWER_PAGE_ID = "evo-eog-2d-viewer.observe";
export const EOG_2D_VIEWER_MOBILE_PAGE_ID = "evo-eog-2d-viewer.mobile-read";
export const EOG_2D_VIEWER_PAGE_SOURCE =
  "app://evo-enterprise-operating-graph/pages/observatory";
export const EOG_2D_VIEWER_MOBILE_PAGE_SOURCE =
  "app://evo-enterprise-operating-graph/pages/observatory-mobile-read";
export const EOG_2D_VIEWER_ROUTE = "/operating-graph/observe";
export const EOG_2D_VIEWER_MOBILE_ROUTE = "/m/operating-graph/observe";

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
    defaultActivation: true,
    requiresCapabilities: [
      ENTERPRISE_BUSINESS_DEFINITION_CAPABILITY_V010
    ],
    providesCapabilities: [
      EOG_2D_VIEWER_CAPABILITY
    ],
    contributions: [{
      kind: "eidos.experience",
      manifest: {
        contractVersion: "0.1.0",
        experienceId: EOG_2D_VIEWER_EXPERIENCE_ID,
        packageId: EOG_2D_VIEWER_PACKAGE_ID,
        featureId: EOG_2D_VIEWER_FEATURE_ID,
        defaultRoute: EOG_2D_VIEWER_WORKSPACE_ROUTE,
        pages: [
          {
            id: EOG_2D_VIEWER_WORKSPACE_PAGE_ID,
            title: "Enterprise Operating Graph Viewer",
            source: EOG_2D_VIEWER_WORKSPACE_PAGE_SOURCE
          },
          {
            id: EOG_2D_VIEWER_PAGE_ID,
            title: "Enterprise Operating Graph Viewer",
            source: EOG_2D_VIEWER_PAGE_SOURCE
          },
          {
            id: EOG_2D_VIEWER_MOBILE_PAGE_ID,
            title: "Enterprise Operating Graph Viewer",
            source: EOG_2D_VIEWER_MOBILE_PAGE_SOURCE
          }
        ],
        routes: [
          {
            id: EOG_2D_VIEWER_WORKSPACE_PAGE_ID,
            semanticId: "evo-eog-2d-viewer.workspace",
            surfaceId: "evo-eog-2d-viewer.desktop",
            path: EOG_2D_VIEWER_WORKSPACE_ROUTE,
            pageId: EOG_2D_VIEWER_WORKSPACE_PAGE_ID
          },
          {
            id: EOG_2D_VIEWER_PAGE_ID,
            semanticId: "evo-eog-2d-viewer.observe",
            surfaceId: "evo-eog-2d-viewer.desktop",
            path: EOG_2D_VIEWER_ROUTE,
            pageId: EOG_2D_VIEWER_PAGE_ID
          },
          {
            id: EOG_2D_VIEWER_MOBILE_PAGE_ID,
            semanticId: "evo-eog-2d-viewer.observe",
            surfaceId: "evo-eog-2d-viewer.mobile-read",
            path: EOG_2D_VIEWER_MOBILE_ROUTE,
            pageId: EOG_2D_VIEWER_MOBILE_PAGE_ID
          }
        ],
        navigation: [{
          id: "evo-eog-2d-viewer.nav",
          label: "Operating Graph",
          route: EOG_2D_VIEWER_WORKSPACE_ROUTE,
          order: 16,
          surfaceIds: ["evo-eog-2d-viewer.desktop"]
        }],
        surfaces: [
          {
            id: "evo-eog-2d-viewer.desktop",
            target: "DESKTOP_WORKBENCH",
            support: "FULL",
            entryRoute: EOG_2D_VIEWER_WORKSPACE_ROUTE
          },
          {
            id: "evo-eog-2d-viewer.mobile-task",
            target: "MOBILE_TASK",
            support: "UNSUPPORTED",
            fallbackSurfaceId: "evo-eog-2d-viewer.mobile-read"
          },
          {
            id: "evo-eog-2d-viewer.mobile-read",
            target: "MOBILE_READ",
            support: "READ_ONLY",
            entryRoute: EOG_2D_VIEWER_MOBILE_ROUTE
          }
        ]
      }
    }]
  }]
};
