import type { PackageManifestV010 } from "../../contracts/package.js";
import {
  ENTERPRISE_BUSINESS_DEFINITION_CAPABILITY_V010
} from "../../contracts/enterprise-business-definition.js";
import {
  TEMPLATE_2D_PREVIEW_ROUTE_V010,
  VISUAL_2D_VIEWER_CAPABILITY_V010
} from "../../contracts/template-preview.js";

export const EOG_2D_PACKAGE_ID = "evo-eog-2d";

export const EOG_2D_VIEWER_FEATURE_ID = "evo-eog-2d.viewer";
export const EOG_2D_VIEWER_CAPABILITY =
  "enterprise.operating-graph.viewer.2d";
export const EOG_2D_VIEWER_EXPERIENCE_ID = "evo-eog-2d-viewer";
export const EOG_2D_VIEWER_WORKSPACE_PAGE_ID =
  "evo-eog-2d-viewer.workspace";
export const EOG_2D_VIEWER_WORKSPACE_PAGE_SOURCE =
  "app://evo-enterprise-operating-graph/pages/viewer";
export const EOG_2D_VIEWER_WORKSPACE_ROUTE = "/operating-graph/view";
export const EOG_2D_VIEWER_WORKSPACE_GET_ACTION =
  "enterprise-operating-graph.viewer.workspace.get";
export const EOG_2D_VIEWER_WORKSPACE_SELECTION_GET_ACTION =
  "enterprise-operating-graph.viewer.workspace.selection.get";
export const EOG_2D_VIEWER_TEMPLATE_PREVIEW_PAGE_ID =
  "evo-eog-2d-viewer.template-preview";
export const EOG_2D_VIEWER_TEMPLATE_PREVIEW_PAGE_SOURCE =
  "app://evo-eog-2d-viewer/pages/template-preview";
export const EOG_2D_VIEWER_TEMPLATE_PREVIEW_ROUTE =
  TEMPLATE_2D_PREVIEW_ROUTE_V010;
export const EOG_2D_VIEWER_TEMPLATE_PREVIEW_GET_ACTION =
  "evo-eog-2d.viewer.template-preview.get";
export const EOG_2D_VIEWER_TEMPLATE_PREVIEW_SELECTION_GET_ACTION =
  "evo-eog-2d.viewer.template-preview.selection.get";

export const EOG_2D_DESIGNER_FEATURE_ID = "evo-eog-2d.designer";
export const EOG_2D_DESIGNER_CAPABILITY =
  "enterprise.operating-graph.designer.2d";
export const EOG_2D_DESIGNER_EXPERIENCE_ID = "evo-eog-2d-designer";
export const EOG_2D_DESIGNER_PAGE_ID = "evo-eog-2d-designer.editor";
export const EOG_2D_DESIGNER_PAGE_SOURCE =
  "app://evo-enterprise-operating-graph/pages/editor";
export const EOG_2D_DESIGNER_ROUTE = "/operating-graph";

/**
 * One installable EOG 2D package with two capability profiles:
 *
 * Viewer   = interactive Workspace + selection + Inspector + navigation
 * Designer = Viewer baseline + governed semantic mutation
 *
 * Observatory is a peer package and is intentionally not contributed here.
 */
export const eog2dPackage: PackageManifestV010 = {
  contractVersion: "0.1.0",
  packageId: EOG_2D_PACKAGE_ID,
  displayName: "EOG 2D",
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
      featureId: EOG_2D_VIEWER_FEATURE_ID,
      packageId: EOG_2D_PACKAGE_ID,
      version: "0.1.0",
      activationScope: "INSTALLATION",
      defaultActivation: true,
      requiresCapabilities: [
        ENTERPRISE_BUSINESS_DEFINITION_CAPABILITY_V010
      ],
      providesCapabilities: [
        EOG_2D_VIEWER_CAPABILITY,
        VISUAL_2D_VIEWER_CAPABILITY_V010
      ],
      contributions: [{
        kind: "eidos.experience",
        manifest: {
          contractVersion: "0.1.0",
          experienceId: EOG_2D_VIEWER_EXPERIENCE_ID,
          packageId: EOG_2D_PACKAGE_ID,
          featureId: EOG_2D_VIEWER_FEATURE_ID,
          defaultRoute: EOG_2D_VIEWER_WORKSPACE_ROUTE,
          pages: [{
            id: EOG_2D_VIEWER_WORKSPACE_PAGE_ID,
            title: "Enterprise Operating Graph Viewer",
            source: EOG_2D_VIEWER_WORKSPACE_PAGE_SOURCE
          }, {
            id: EOG_2D_VIEWER_TEMPLATE_PREVIEW_PAGE_ID,
            title: "2D Template Preview",
            source: EOG_2D_VIEWER_TEMPLATE_PREVIEW_PAGE_SOURCE
          }],
          routes: [{
            id: EOG_2D_VIEWER_WORKSPACE_PAGE_ID,
            semanticId: "evo-eog-2d-viewer.workspace",
            path: EOG_2D_VIEWER_WORKSPACE_ROUTE,
            pageId: EOG_2D_VIEWER_WORKSPACE_PAGE_ID
          }, {
            id: EOG_2D_VIEWER_TEMPLATE_PREVIEW_PAGE_ID,
            semanticId: "evo-eog-2d-viewer.template-preview",
            path: EOG_2D_VIEWER_TEMPLATE_PREVIEW_ROUTE,
            pageId: EOG_2D_VIEWER_TEMPLATE_PREVIEW_PAGE_ID
          }],
          navigation: [{
            id: "evo-eog-2d-viewer.nav",
            label: "Operating Graph",
            route: EOG_2D_VIEWER_WORKSPACE_ROUTE,
            order: 16,
            surfaceIds: [
              "evo-eog-2d-viewer.desktop",
              "evo-eog-2d-viewer.mobile",
              "evo-eog-2d-viewer.tablet"
            ]
          }],
          surfaces: [{
            id: "evo-eog-2d-viewer.desktop",
            target: "DESKTOP_WORKBENCH",
            support: "FULL",
            entryRoute: EOG_2D_VIEWER_WORKSPACE_ROUTE
          }, {
            id: "evo-eog-2d-viewer.mobile",
            target: "MOBILE_TASK",
            support: "FULL",
            entryRoute: EOG_2D_VIEWER_WORKSPACE_ROUTE
          }, {
            id: "evo-eog-2d-viewer.tablet",
            target: "TABLET_WORKBENCH",
            support: "FULL",
            entryRoute: EOG_2D_VIEWER_WORKSPACE_ROUTE
          }]
        }
      }]
    },
    {
      contractVersion: "0.1.0",
      featureId: EOG_2D_DESIGNER_FEATURE_ID,
      packageId: EOG_2D_PACKAGE_ID,
      version: "0.1.0",
      activationScope: "INSTALLATION",
      defaultActivation: true,
      requiresFeatures: [
        EOG_2D_VIEWER_FEATURE_ID
      ],
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
          packageId: EOG_2D_PACKAGE_ID,
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
    }
  ]
};
