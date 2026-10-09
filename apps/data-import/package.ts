import type {
  PackageManifestV010
} from "../../contracts/package.js";
import {
  ENTERPRISE_RESOURCE_CAPABILITY_V010
} from "../../contracts/enterprise-resource.js";
import {
  dataImportCapabilityContributionsV010
} from "./capability-manifest.js";
import {
  DATA_IMPORT_CAPABILITY_V010,
  DATA_IMPORT_DIRECTORY_PAGE_ID,
  DATA_IMPORT_DIRECTORY_PAGE_SOURCE,
  DATA_IMPORT_DIRECTORY_ROUTE,
  DATA_IMPORT_FEATURE_ID,
  DATA_IMPORT_MAPPING_PAGE_ID,
  DATA_IMPORT_MAPPING_PAGE_SOURCE,
  DATA_IMPORT_MAPPING_ROUTE,
  DATA_IMPORT_PACKAGE_ID,
  DATA_IMPORT_REVIEW_PAGE_ID,
  DATA_IMPORT_REVIEW_PAGE_SOURCE,
  DATA_IMPORT_REVIEW_ROUTE,
  DATA_IMPORT_STAGE_FILE_OPERATION_V010,
  DATA_IMPORT_UPLOAD_PAGE_ID,
  DATA_IMPORT_UPLOAD_PAGE_SOURCE,
  DATA_IMPORT_UPLOAD_ROUTE
} from "./constants.js";

export {
  DATA_IMPORT_CAPABILITY_V010,
  DATA_IMPORT_FEATURE_ID,
  DATA_IMPORT_PACKAGE_ID
} from "./constants.js";

export const dataImportPackage: PackageManifestV010 = {
  contractVersion: "0.1.0",
  packageId: DATA_IMPORT_PACKAGE_ID,
  displayName: "EVO Data Import",
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
    featureId: DATA_IMPORT_FEATURE_ID,
    packageId: DATA_IMPORT_PACKAGE_ID,
    version: "0.1.0",
    activationScope: "INSTALLATION",
    defaultActivation: true,
    requiresCapabilities: [
      ENTERPRISE_RESOURCE_CAPABILITY_V010
    ],
    providesCapabilities: [
      DATA_IMPORT_CAPABILITY_V010
    ],
    contributions: [
      ...dataImportCapabilityContributionsV010,
      {
        kind: "eidos.workbench-home-item",
        item: {
          contractVersion: "0.1.0",
          id: "evo-data-import.workbench.import",
          title: "Data Import",
          description: "Upload, map, validate and commit governed business data.",
          section: "FIXED_CAPABILITIES",
          route: DATA_IMPORT_DIRECTORY_ROUTE,
          capabilityOperationId: DATA_IMPORT_STAGE_FILE_OPERATION_V010,
          order: 60
        }
      },
      {
        kind: "eidos.experience",
        manifest: {
          contractVersion: "0.1.0",
          experienceId: DATA_IMPORT_PACKAGE_ID,
          packageId: DATA_IMPORT_PACKAGE_ID,
          featureId: DATA_IMPORT_FEATURE_ID,
          defaultRoute: DATA_IMPORT_DIRECTORY_ROUTE,
          pages: [{
            id: DATA_IMPORT_DIRECTORY_PAGE_ID,
            title: "Data Import",
            source: DATA_IMPORT_DIRECTORY_PAGE_SOURCE
          }, {
            id: DATA_IMPORT_UPLOAD_PAGE_ID,
            title: "Upload Data",
            source: DATA_IMPORT_UPLOAD_PAGE_SOURCE
          }, {
            id: DATA_IMPORT_MAPPING_PAGE_ID,
            title: "Map Fields",
            source: DATA_IMPORT_MAPPING_PAGE_SOURCE
          }, {
            id: DATA_IMPORT_REVIEW_PAGE_ID,
            title: "Review Import",
            source: DATA_IMPORT_REVIEW_PAGE_SOURCE
          }],
          routes: [{
            id: DATA_IMPORT_DIRECTORY_PAGE_ID,
            path: DATA_IMPORT_DIRECTORY_ROUTE,
            pageId: DATA_IMPORT_DIRECTORY_PAGE_ID
          }, {
            id: DATA_IMPORT_UPLOAD_PAGE_ID,
            path: DATA_IMPORT_UPLOAD_ROUTE,
            pageId: DATA_IMPORT_UPLOAD_PAGE_ID
          }, {
            id: DATA_IMPORT_MAPPING_PAGE_ID,
            path: DATA_IMPORT_MAPPING_ROUTE,
            pageId: DATA_IMPORT_MAPPING_PAGE_ID
          }, {
            id: DATA_IMPORT_REVIEW_PAGE_ID,
            path: DATA_IMPORT_REVIEW_ROUTE,
            pageId: DATA_IMPORT_REVIEW_PAGE_ID
          }],
          navigation: [{
            id: "evo-data-import.nav",
            label: "Data Import",
            route: DATA_IMPORT_DIRECTORY_ROUTE,
            order: 36
          }]
        }
      },
      {
        kind: "eidos.localization-bundle",
        bundle: {
          contractVersion: "0.1.0",
          namespace: DATA_IMPORT_PACKAGE_ID,
          locale: "en",
          messages: {
            "navigation.evo-data-import.nav.label": "Data Import"
          }
        }
      },
      {
        kind: "eidos.localization-bundle",
        bundle: {
          contractVersion: "0.1.0",
          namespace: DATA_IMPORT_PACKAGE_ID,
          locale: "zh-CN",
          messages: {
            "navigation.evo-data-import.nav.label": "数据导入"
          }
        }
      }
    ]
  }]
};
