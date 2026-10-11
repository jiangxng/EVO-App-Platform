import type {
  PackageManifestV010
} from "../../contracts/package.js";
import {
  ENTERPRISE_RESOURCE_CAPABILITY_V010
} from "../../contracts/enterprise-resource.js";
import {
  RESPONSIBILITY_CAPABILITY_V010
} from "../responsibility/constants.js";
import {
  warehouseProjectionCapabilityContributionsV010
} from "./capability-manifest.js";
import {
  WAREHOUSE_DETAIL_PAGE_ID,
  WAREHOUSE_DETAIL_PAGE_SOURCE,
  WAREHOUSE_DETAIL_ROUTE,
  WAREHOUSE_DIRECTORY_PAGE_ID,
  WAREHOUSE_DIRECTORY_PAGE_SOURCE,
  WAREHOUSE_DIRECTORY_ROUTE,
  WAREHOUSE_FEATURE_ID,
  WAREHOUSE_MY_PAGE_ID,
  WAREHOUSE_MY_PAGE_SOURCE,
  WAREHOUSE_MY_READ_OPERATION_V010,
  WAREHOUSE_MY_ROUTE,
  WAREHOUSE_PACKAGE_ID,
  WAREHOUSE_PROJECTION_CAPABILITY_V010
} from "./constants.js";

export const warehousePackage: PackageManifestV010 = {
  contractVersion: "0.1.0",
  packageId: WAREHOUSE_PACKAGE_ID,
  displayName: "EVO Warehouse",
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
    featureId: WAREHOUSE_FEATURE_ID,
    packageId: WAREHOUSE_PACKAGE_ID,
    version: "0.1.0",
    activationScope: "INSTALLATION",
    defaultActivation: true,
    requiresCapabilities: [
      "enterprise.directory",
      ENTERPRISE_RESOURCE_CAPABILITY_V010,
      RESPONSIBILITY_CAPABILITY_V010
    ],
    providesCapabilities: [
      "enterprise.warehouse.directory",
      WAREHOUSE_PROJECTION_CAPABILITY_V010
    ],
    contributions: [
      ...warehouseProjectionCapabilityContributionsV010,
      {
        kind: "platform.data-import-target",
        target: {
          contractVersion: "0.1.0",
          targetId: "warehouse.location",
          objectType: "warehouse.location",
          label: {
            default: "Warehouse locations",
            translations: { "zh-CN": "仓库位置层级" }
          },
          binding: {
            type: "HOST_FACTORY",
            ref: "evo-warehouse.location-import-target.v0.1"
          }
        }
      },
      {
        kind: "eidos.workbench-home-item",
        item: {
          contractVersion: "0.1.0",
          id: "evo-warehouse.workbench.my-warehouses",
          title: "My Warehouses",
          description:
            "Warehouses in your governed Warehouse stewardship responsibility scope.",
          section: "MY_BUSINESS_OBJECTS",
          route: WAREHOUSE_MY_ROUTE,
          capabilityOperationId: WAREHOUSE_MY_READ_OPERATION_V010,
          order: 45,
          localization: {
            namespace: WAREHOUSE_PACKAGE_ID,
            titleKey: "workbench.my-warehouses.title",
            descriptionKey: "workbench.my-warehouses.description"
          }
        }
      },
      {
        kind: "eidos.experience",
        manifest: {
          contractVersion: "0.1.0",
          experienceId: WAREHOUSE_PACKAGE_ID,
          packageId: WAREHOUSE_PACKAGE_ID,
          featureId: WAREHOUSE_FEATURE_ID,
          defaultRoute: WAREHOUSE_DIRECTORY_ROUTE,
          pages: [{
            id: WAREHOUSE_DIRECTORY_PAGE_ID,
            title: "Warehouses",
            source: WAREHOUSE_DIRECTORY_PAGE_SOURCE
          }, {
            id: WAREHOUSE_MY_PAGE_ID,
            title: "My Warehouses",
            source: WAREHOUSE_MY_PAGE_SOURCE
          }, {
            id: WAREHOUSE_DETAIL_PAGE_ID,
            title: "Warehouse",
            source: WAREHOUSE_DETAIL_PAGE_SOURCE
          }],
          routes: [{
            id: WAREHOUSE_DIRECTORY_PAGE_ID,
            path: WAREHOUSE_DIRECTORY_ROUTE,
            pageId: WAREHOUSE_DIRECTORY_PAGE_ID
          }, {
            id: WAREHOUSE_MY_PAGE_ID,
            path: WAREHOUSE_MY_ROUTE,
            pageId: WAREHOUSE_MY_PAGE_ID
          }, {
            id: WAREHOUSE_DETAIL_PAGE_ID,
            path: WAREHOUSE_DETAIL_ROUTE,
            pageId: WAREHOUSE_DETAIL_PAGE_ID
          }],
          navigation: [{
            id: "evo-warehouse.nav",
            label: "Warehouses",
            route: WAREHOUSE_DIRECTORY_ROUTE,
            order: 38
          }, {
            id: "evo-warehouse.my.nav",
            label: "My Warehouses",
            route: WAREHOUSE_MY_ROUTE,
            parentId: "evo-warehouse.nav",
            order: 1
          }]
        }
      },
      {
        kind: "eidos.localization-bundle",
        bundle: {
          contractVersion: "0.1.0",
          namespace: WAREHOUSE_PACKAGE_ID,
          locale: "en",
          messages: {
            "navigation.evo-warehouse.nav.label": "Warehouses",
            "navigation.evo-warehouse.my.nav.label": "My Warehouses",
            "workbench.my-warehouses.title": "My Warehouses",
            "workbench.my-warehouses.description":
              "Warehouses in your governed Warehouse stewardship responsibility scope."
          }
        }
      },
      {
        kind: "eidos.localization-bundle",
        bundle: {
          contractVersion: "0.1.0",
          namespace: WAREHOUSE_PACKAGE_ID,
          locale: "zh-CN",
          messages: {
            "navigation.evo-warehouse.nav.label": "仓库 / 位置",
            "navigation.evo-warehouse.my.nav.label": "我的仓库",
            "workbench.my-warehouses.title": "我的仓库",
            "workbench.my-warehouses.description":
              "当前 Warehouse 责任范围内由你负责的仓库。"
          }
        }
      }
    ]
  }]
};
