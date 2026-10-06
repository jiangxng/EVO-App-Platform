import type { PackageManifestV010 } from "../../contracts/package.js";
import {
  ENTERPRISE_BUSINESS_DEFINITION_CAPABILITY_V010
} from "../../contracts/enterprise-business-definition.js";
import {
  EOG_2D_VIEWER_FEATURE_ID
} from "../eog-2d/package.js";
import {
  EOG_3D_VIEWER_FEATURE_ID
} from "../eog-3d/package.js";

export const ENTERPRISE_OBSERVATORY_PACKAGE_ID =
  "evo-enterprise-observatory";

export const ENTERPRISE_OBSERVATORY_2D_FEATURE_ID =
  "evo-enterprise-observatory.2d";
export const ENTERPRISE_OBSERVATORY_2D_CAPABILITY =
  "enterprise.observatory.2d";
export const ENTERPRISE_OBSERVATORY_2D_EXPERIENCE_ID =
  "evo-enterprise-observatory";
export const ENTERPRISE_OBSERVATORY_2D_PAGE_ID =
  "evo-enterprise-operating-graph.observatory";
export const ENTERPRISE_OBSERVATORY_MOBILE_PAGE_ID =
  "evo-enterprise-operating-graph.observatory.mobile-read";
export const ENTERPRISE_OBSERVATORY_2D_PAGE_SOURCE =
  "app://evo-enterprise-operating-graph/pages/observatory";
export const ENTERPRISE_OBSERVATORY_MOBILE_PAGE_SOURCE =
  "app://evo-enterprise-operating-graph/pages/observatory-mobile-read";
export const ENTERPRISE_OBSERVATORY_2D_ROUTE =
  "/operating-graph/observe";
export const ENTERPRISE_OBSERVATORY_MOBILE_ROUTE =
  "/m/operating-graph/observe";

export const ENTERPRISE_OBSERVATORY_3D_FEATURE_ID =
  "evo-enterprise-observatory.3d";
export const ENTERPRISE_OBSERVATORY_3D_CAPABILITY =
  "enterprise.observatory.3d";
export const ENTERPRISE_OBSERVATORY_3D_EXPERIENCE_ID =
  "evo-enterprise-observatory-3d";
export const ENTERPRISE_OBSERVATORY_3D_PAGE_ID =
  "evo-enterprise-operating-graph.observatory-spatial";
export const ENTERPRISE_OBSERVATORY_3D_PAGE_SOURCE =
  "app://evo-enterprise-operating-graph/pages/observatory-spatial";
export const ENTERPRISE_OBSERVATORY_3D_ROUTE =
  "/operating-graph/observe/3d";

export const enterpriseObservatoryPackage: PackageManifestV010 = {
  contractVersion: "0.1.0",
  packageId: ENTERPRISE_OBSERVATORY_PACKAGE_ID,
  displayName: "Enterprise Observatory",
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
  features: [
    {
      contractVersion: "0.1.0",
      featureId: ENTERPRISE_OBSERVATORY_2D_FEATURE_ID,
      packageId: ENTERPRISE_OBSERVATORY_PACKAGE_ID,
      version: "0.1.0",
      activationScope: "INSTALLATION",
      defaultActivation: true,
      requiresFeatures: [
        EOG_2D_VIEWER_FEATURE_ID
      ],
      requiresCapabilities: [
        ENTERPRISE_BUSINESS_DEFINITION_CAPABILITY_V010
      ],
      providesCapabilities: [
        ENTERPRISE_OBSERVATORY_2D_CAPABILITY
      ],
      contributions: [{
        kind: "eidos.experience",
        manifest: {
          contractVersion: "0.1.0",
          experienceId: ENTERPRISE_OBSERVATORY_2D_EXPERIENCE_ID,
          packageId: ENTERPRISE_OBSERVATORY_PACKAGE_ID,
          featureId: ENTERPRISE_OBSERVATORY_2D_FEATURE_ID,
          defaultRoute: ENTERPRISE_OBSERVATORY_2D_ROUTE,
          pages: [
            {
              id: ENTERPRISE_OBSERVATORY_2D_PAGE_ID,
              title: "Enterprise Observatory",
              source: ENTERPRISE_OBSERVATORY_2D_PAGE_SOURCE
            },
            {
              id: ENTERPRISE_OBSERVATORY_MOBILE_PAGE_ID,
              title: "Enterprise Observatory",
              source: ENTERPRISE_OBSERVATORY_MOBILE_PAGE_SOURCE
            }
          ],
          routes: [
            {
              id: ENTERPRISE_OBSERVATORY_2D_PAGE_ID,
              semanticId: "evo-enterprise-observatory",
              surfaceId: "evo-enterprise-observatory.desktop",
              path: ENTERPRISE_OBSERVATORY_2D_ROUTE,
              pageId: ENTERPRISE_OBSERVATORY_2D_PAGE_ID
            },
            {
              id: ENTERPRISE_OBSERVATORY_MOBILE_PAGE_ID,
              semanticId: "evo-enterprise-observatory",
              surfaceId: "evo-enterprise-observatory.mobile-read",
              path: ENTERPRISE_OBSERVATORY_MOBILE_ROUTE,
              pageId: ENTERPRISE_OBSERVATORY_MOBILE_PAGE_ID
            }
          ],
          // Observatory is an on-demand analytical capability, not a permanent
          // application destination in ordinary business navigation.
          surfaces: [
            {
              id: "evo-enterprise-observatory.desktop",
              target: "DESKTOP_WORKBENCH",
              support: "FULL",
              entryRoute: ENTERPRISE_OBSERVATORY_2D_ROUTE
            },
            {
              id: "evo-enterprise-observatory.mobile-task",
              target: "MOBILE_TASK",
              support: "UNSUPPORTED",
              fallbackSurfaceId: "evo-enterprise-observatory.mobile-read"
            },
            {
              id: "evo-enterprise-observatory.mobile-read",
              target: "MOBILE_READ",
              support: "READ_ONLY",
              entryRoute: ENTERPRISE_OBSERVATORY_MOBILE_ROUTE
            }
          ]
        }
      }]
    },
    {
      contractVersion: "0.1.0",
      featureId: ENTERPRISE_OBSERVATORY_3D_FEATURE_ID,
      packageId: ENTERPRISE_OBSERVATORY_PACKAGE_ID,
      version: "0.1.0",
      activationScope: "INSTALLATION",
      defaultActivation: true,
      requiresFeatures: [
        EOG_3D_VIEWER_FEATURE_ID
      ],
      requiresCapabilities: [
        ENTERPRISE_BUSINESS_DEFINITION_CAPABILITY_V010
      ],
      providesCapabilities: [
        ENTERPRISE_OBSERVATORY_3D_CAPABILITY
      ],
      contributions: [{
        kind: "eidos.experience",
        manifest: {
          contractVersion: "0.1.0",
          experienceId: ENTERPRISE_OBSERVATORY_3D_EXPERIENCE_ID,
          packageId: ENTERPRISE_OBSERVATORY_PACKAGE_ID,
          featureId: ENTERPRISE_OBSERVATORY_3D_FEATURE_ID,
          defaultRoute: ENTERPRISE_OBSERVATORY_3D_ROUTE,
          pages: [{
            id: ENTERPRISE_OBSERVATORY_3D_PAGE_ID,
            title: "Enterprise Observatory 3D",
            source: ENTERPRISE_OBSERVATORY_3D_PAGE_SOURCE
          }],
          routes: [{
            id: ENTERPRISE_OBSERVATORY_3D_PAGE_ID,
            path: ENTERPRISE_OBSERVATORY_3D_ROUTE,
            pageId: ENTERPRISE_OBSERVATORY_3D_PAGE_ID
          }]
          // 3D Observatory remains routable and capability-discoverable, and
          // is opened only from a relevant analysis/diagnostic context.
        }
      }]
    }
  ]
};
