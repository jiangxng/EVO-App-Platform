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
  itemProjectionCapabilityContributionsV010
} from "./capability-manifest.js";
import {
  ITEM_CREATE_PAGE_ID,
  ITEM_CREATE_PAGE_SOURCE,
  ITEM_CREATE_ROUTE,
  ITEM_DETAIL_PAGE_ID,
  ITEM_DETAIL_PAGE_SOURCE,
  ITEM_DETAIL_ROUTE,
  ITEM_DIRECTORY_PAGE_ID,
  ITEM_DIRECTORY_PAGE_SOURCE,
  ITEM_DIRECTORY_ROUTE,
  ITEM_FEATURE_ID,
  ITEM_MY_ITEMS_PAGE_ID,
  ITEM_MY_ITEMS_PAGE_SOURCE,
  ITEM_MY_ITEMS_READ_OPERATION_V010,
  ITEM_MY_ITEMS_ROUTE,
  ITEM_PACKAGE_ID,
  ITEM_EDIT_PAGE_ID,
  ITEM_EDIT_PAGE_SOURCE,
  ITEM_EDIT_ROUTE,
  ITEM_PROJECTION_CAPABILITY_V010
} from "./constants.js";

export const itemPackage: PackageManifestV010 = {
  contractVersion: "0.1.0",
  packageId: ITEM_PACKAGE_ID,
  displayName: "EVO Item",
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
    featureId: ITEM_FEATURE_ID,
    packageId: ITEM_PACKAGE_ID,
    version: "0.1.0",
    activationScope: "INSTALLATION",
    defaultActivation: true,
    requiresCapabilities: [
      "enterprise.directory",
      ENTERPRISE_RESOURCE_CAPABILITY_V010,
      RESPONSIBILITY_CAPABILITY_V010
    ],
    providesCapabilities: [
      "enterprise.item.directory",
      ITEM_PROJECTION_CAPABILITY_V010
    ],
    contributions: [
      ...itemProjectionCapabilityContributionsV010,
      {
        kind: "eidos.workbench-home-item",
        item: {
          contractVersion: "0.1.0",
          id: "evo-item.workbench.my-items",
          title: "My Items",
          description:
            "Items in your governed Item stewardship responsibility scope.",
          section: "MY_BUSINESS_OBJECTS",
          route: ITEM_MY_ITEMS_ROUTE,
          capabilityOperationId: ITEM_MY_ITEMS_READ_OPERATION_V010,
          order: 40,
          localization: {
            namespace: ITEM_PACKAGE_ID,
            titleKey: "workbench.my-items.title",
            descriptionKey: "workbench.my-items.description"
          }
        }
      },
      {
        kind: "eidos.experience",
        manifest: {
          contractVersion: "0.1.0",
          experienceId: ITEM_PACKAGE_ID,
          packageId: ITEM_PACKAGE_ID,
          featureId: ITEM_FEATURE_ID,
          defaultRoute: ITEM_DIRECTORY_ROUTE,
          pages: [{
            id: ITEM_DIRECTORY_PAGE_ID,
            title: "Items",
            source: ITEM_DIRECTORY_PAGE_SOURCE
          }, {
            id: ITEM_MY_ITEMS_PAGE_ID,
            title: "My Items",
            source: ITEM_MY_ITEMS_PAGE_SOURCE
          }, {
            id: ITEM_CREATE_PAGE_ID,
            title: "New Item",
            source: ITEM_CREATE_PAGE_SOURCE
          }, {
            id: ITEM_DETAIL_PAGE_ID,
            title: "Item",
            source: ITEM_DETAIL_PAGE_SOURCE
          }, {
            id: ITEM_EDIT_PAGE_ID,
            title: "Edit Item",
            source: ITEM_EDIT_PAGE_SOURCE
          }],
          routes: [{
            id: ITEM_DIRECTORY_PAGE_ID,
            path: ITEM_DIRECTORY_ROUTE,
            pageId: ITEM_DIRECTORY_PAGE_ID
          }, {
            id: ITEM_MY_ITEMS_PAGE_ID,
            path: ITEM_MY_ITEMS_ROUTE,
            pageId: ITEM_MY_ITEMS_PAGE_ID
          }, {
            id: ITEM_CREATE_PAGE_ID,
            path: ITEM_CREATE_ROUTE,
            pageId: ITEM_CREATE_PAGE_ID
          }, {
            id: ITEM_DETAIL_PAGE_ID,
            path: ITEM_DETAIL_ROUTE,
            pageId: ITEM_DETAIL_PAGE_ID
          }, {
            id: ITEM_EDIT_PAGE_ID,
            path: ITEM_EDIT_ROUTE,
            pageId: ITEM_EDIT_PAGE_ID
          }],
          navigation: [{
            id: "evo-item.nav",
            label: "Items",
            route: ITEM_DIRECTORY_ROUTE,
            order: 36
          }, {
            id: "evo-item.my-items.nav",
            label: "My Items",
            route: ITEM_MY_ITEMS_ROUTE,
            parentId: "evo-item.nav",
            order: 1
          }]
        }
      },
      {
        kind: "eidos.localization-bundle",
        bundle: {
          contractVersion: "0.1.0",
          namespace: ITEM_PACKAGE_ID,
          locale: "en",
          messages: {
            "navigation.evo-item.nav.label": "Items",
            "navigation.evo-item.my-items.nav.label": "My Items",
            "workbench.my-items.title": "My Items",
            "workbench.my-items.description":
              "Items in your governed Item stewardship responsibility scope."
          }
        }
      },
      {
        kind: "eidos.localization-bundle",
        bundle: {
          contractVersion: "0.1.0",
          namespace: ITEM_PACKAGE_ID,
          locale: "zh-CN",
          messages: {
            "navigation.evo-item.nav.label": "物料 / 项目",
            "navigation.evo-item.my-items.nav.label": "我的 Item",
            "workbench.my-items.title": "我的 Item",
            "workbench.my-items.description":
              "当前 Item 主数据责任范围内由你负责的 Item。"
          }
        }
      }
    ]
  }]
};
