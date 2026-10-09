import type { PackageManifestV010 } from "../../contracts/package.js";
import {
  ENTERPRISE_RESOURCE_CAPABILITY_V010
} from "../../contracts/enterprise-resource.js";
import {
  RESPONSIBILITY_CAPABILITY_V010
} from "../responsibility/constants.js";
import {
  counterpartyProjectionCapabilityContributionsV010
} from "./capability-manifest.js";
import {
  COUNTERPARTY_CREATE_PAGE_ID,
  COUNTERPARTY_CUSTOMERS_PAGE_ID,
  COUNTERPARTY_CUSTOMERS_PAGE_SOURCE,
  COUNTERPARTY_CUSTOMERS_ROUTE,
  COUNTERPARTY_CREATE_PAGE_SOURCE,
  COUNTERPARTY_CREATE_ROUTE,
  COUNTERPARTY_DETAIL_PAGE_ID,
  COUNTERPARTY_MY_CUSTOMERS_PAGE_ID,
  COUNTERPARTY_MY_CUSTOMERS_PAGE_SOURCE,
  COUNTERPARTY_MY_CUSTOMERS_ROUTE,
  COUNTERPARTY_MY_CUSTOMERS_READ_OPERATION_V010,
  COUNTERPARTY_MY_SUPPLIERS_PAGE_ID,
  COUNTERPARTY_MY_SUPPLIERS_PAGE_SOURCE,
  COUNTERPARTY_MY_SUPPLIERS_ROUTE,
  COUNTERPARTY_MY_SUPPLIERS_READ_OPERATION_V010,
  COUNTERPARTY_DETAIL_PAGE_SOURCE,
  COUNTERPARTY_DETAIL_ROUTE,
  COUNTERPARTY_EDIT_PAGE_ID,
  COUNTERPARTY_EDIT_PAGE_SOURCE,
  COUNTERPARTY_EDIT_ROUTE,
  COUNTERPARTY_DIRECTORY_PAGE_ID,
  COUNTERPARTY_DIRECTORY_PAGE_SOURCE,
  COUNTERPARTY_DIRECTORY_ROUTE,
  COUNTERPARTY_FEATURE_ID,
  COUNTERPARTY_PACKAGE_ID,
  COUNTERPARTY_PROJECTION_CAPABILITY_V010,
  COUNTERPARTY_SUPPLIERS_PAGE_ID,
  COUNTERPARTY_SUPPLIERS_PAGE_SOURCE,
  COUNTERPARTY_SUPPLIERS_ROUTE
} from "./constants.js";

export const counterpartyPackage: PackageManifestV010 = {
  contractVersion: "0.1.0",
  packageId: COUNTERPARTY_PACKAGE_ID,
  displayName: "EVO Counterparty",
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
    featureId: COUNTERPARTY_FEATURE_ID,
    packageId: COUNTERPARTY_PACKAGE_ID,
    version: "0.1.0",
    activationScope: "INSTALLATION",
    defaultActivation: true,
    requiresCapabilities: [
      "enterprise.directory",
      ENTERPRISE_RESOURCE_CAPABILITY_V010,
      RESPONSIBILITY_CAPABILITY_V010
    ],
    providesCapabilities: [
      "enterprise.counterparty.directory",
      "enterprise.counterparty.relationship-role",
      COUNTERPARTY_PROJECTION_CAPABILITY_V010
    ],
    contributions: [
      ...counterpartyProjectionCapabilityContributionsV010,
      {
        kind: "eidos.workbench-home-item",
        item: {
          contractVersion: "0.1.0",
          id: "evo-counterparty.workbench.my-customers",
          title: "My Customers",
          description: "Customers assigned to your governed sales responsibility scope.",
          section: "MY_BUSINESS_OBJECTS",
          route: COUNTERPARTY_MY_CUSTOMERS_ROUTE,
          capabilityOperationId:
            COUNTERPARTY_MY_CUSTOMERS_READ_OPERATION_V010,
          order: 20,
          localization: {
            namespace: COUNTERPARTY_PACKAGE_ID,
            titleKey: "workbench.my-customers.title",
            descriptionKey: "workbench.my-customers.description"
          }
        }
      }, {
        kind: "eidos.workbench-home-item",
        item: {
          contractVersion: "0.1.0",
          id: "evo-counterparty.workbench.my-suppliers",
          title: "My Suppliers",
          description: "Suppliers assigned to your governed procurement responsibility scope.",
          section: "MY_BUSINESS_OBJECTS",
          route: COUNTERPARTY_MY_SUPPLIERS_ROUTE,
          capabilityOperationId:
            COUNTERPARTY_MY_SUPPLIERS_READ_OPERATION_V010,
          order: 30,
          localization: {
            namespace: COUNTERPARTY_PACKAGE_ID,
            titleKey: "workbench.my-suppliers.title",
            descriptionKey: "workbench.my-suppliers.description"
          }
        }
      }, {
      kind: "eidos.experience",
      manifest: {
        contractVersion: "0.1.0",
        experienceId: COUNTERPARTY_PACKAGE_ID,
        packageId: COUNTERPARTY_PACKAGE_ID,
        featureId: COUNTERPARTY_FEATURE_ID,
        defaultRoute: COUNTERPARTY_DIRECTORY_ROUTE,
        pages: [{
          id: COUNTERPARTY_DIRECTORY_PAGE_ID,
          title: "Counterparties",
          source: COUNTERPARTY_DIRECTORY_PAGE_SOURCE
        }, {
          id: COUNTERPARTY_CUSTOMERS_PAGE_ID,
          title: "Customers",
          source: COUNTERPARTY_CUSTOMERS_PAGE_SOURCE
        }, {
          id: COUNTERPARTY_SUPPLIERS_PAGE_ID,
          title: "Suppliers",
          source: COUNTERPARTY_SUPPLIERS_PAGE_SOURCE
        }, {
          id: COUNTERPARTY_MY_CUSTOMERS_PAGE_ID,
          title: "My Customers",
          source: COUNTERPARTY_MY_CUSTOMERS_PAGE_SOURCE
        }, {
          id: COUNTERPARTY_MY_SUPPLIERS_PAGE_ID,
          title: "My Suppliers",
          source: COUNTERPARTY_MY_SUPPLIERS_PAGE_SOURCE
        }, {
          id: COUNTERPARTY_CREATE_PAGE_ID,
          title: "New Counterparty",
          source: COUNTERPARTY_CREATE_PAGE_SOURCE
        }, {
          id: COUNTERPARTY_DETAIL_PAGE_ID,
          title: "Counterparty",
          source: COUNTERPARTY_DETAIL_PAGE_SOURCE
        }, {
          id: COUNTERPARTY_EDIT_PAGE_ID,
          title: "Edit Counterparty",
          source: COUNTERPARTY_EDIT_PAGE_SOURCE
        }],
        routes: [{
          id: COUNTERPARTY_DIRECTORY_PAGE_ID,
          path: COUNTERPARTY_DIRECTORY_ROUTE,
          pageId: COUNTERPARTY_DIRECTORY_PAGE_ID
        }, {
          id: COUNTERPARTY_CUSTOMERS_PAGE_ID,
          path: COUNTERPARTY_CUSTOMERS_ROUTE,
          pageId: COUNTERPARTY_CUSTOMERS_PAGE_ID
        }, {
          id: COUNTERPARTY_SUPPLIERS_PAGE_ID,
          path: COUNTERPARTY_SUPPLIERS_ROUTE,
          pageId: COUNTERPARTY_SUPPLIERS_PAGE_ID
        }, {
          id: COUNTERPARTY_MY_CUSTOMERS_PAGE_ID,
          path: COUNTERPARTY_MY_CUSTOMERS_ROUTE,
          pageId: COUNTERPARTY_MY_CUSTOMERS_PAGE_ID
        }, {
          id: COUNTERPARTY_MY_SUPPLIERS_PAGE_ID,
          path: COUNTERPARTY_MY_SUPPLIERS_ROUTE,
          pageId: COUNTERPARTY_MY_SUPPLIERS_PAGE_ID
        }, {
          id: COUNTERPARTY_CREATE_PAGE_ID,
          path: COUNTERPARTY_CREATE_ROUTE,
          pageId: COUNTERPARTY_CREATE_PAGE_ID
        }, {
          id: COUNTERPARTY_DETAIL_PAGE_ID,
          path: COUNTERPARTY_DETAIL_ROUTE,
          pageId: COUNTERPARTY_DETAIL_PAGE_ID
        }, {
          id: COUNTERPARTY_EDIT_PAGE_ID,
          path: COUNTERPARTY_EDIT_ROUTE,
          pageId: COUNTERPARTY_EDIT_PAGE_ID
        }],
        navigation: [{
          id: "evo-counterparty.nav",
          label: "Counterparties",
          route: COUNTERPARTY_DIRECTORY_ROUTE,
          order: 35
        }, {
          id: "evo-counterparty.customers.nav",
          label: "Customers",
          route: COUNTERPARTY_CUSTOMERS_ROUTE,
          parentId: "evo-counterparty.nav",
          order: 1
        }, {
          id: "evo-counterparty.suppliers.nav",
          label: "Suppliers",
          route: COUNTERPARTY_SUPPLIERS_ROUTE,
          parentId: "evo-counterparty.nav",
          order: 2
        }, {
          id: "evo-counterparty.my-customers.nav",
          label: "My Customers",
          route: COUNTERPARTY_MY_CUSTOMERS_ROUTE,
          parentId: "evo-counterparty.nav",
          order: 3
        }, {
          id: "evo-counterparty.my-suppliers.nav",
          label: "My Suppliers",
          route: COUNTERPARTY_MY_SUPPLIERS_ROUTE,
          parentId: "evo-counterparty.nav",
          order: 4
        }]
      }
    }, {
      kind: "eidos.localization-bundle",
      bundle: {
        contractVersion: "0.1.0",
        namespace: COUNTERPARTY_PACKAGE_ID,
        locale: "en",
        messages: {
          "navigation.evo-counterparty.nav.label": "Counterparties",
          "navigation.evo-counterparty.customers.nav.label": "Customers",
          "navigation.evo-counterparty.suppliers.nav.label": "Suppliers",
          "navigation.evo-counterparty.my-customers.nav.label": "My Customers",
          "navigation.evo-counterparty.my-suppliers.nav.label": "My Suppliers",
          "workbench.my-customers.title": "My Customers",
          "workbench.my-customers.description": "Customers assigned to your governed sales responsibility scope.",
          "workbench.my-suppliers.title": "My Suppliers",
          "workbench.my-suppliers.description": "Suppliers assigned to your governed procurement responsibility scope."
        }
      }
    }, {
      kind: "eidos.localization-bundle",
      bundle: {
        contractVersion: "0.1.0",
        namespace: COUNTERPARTY_PACKAGE_ID,
        locale: "zh-CN",
        messages: {
          "navigation.evo-counterparty.nav.label": "往来对象",
          "navigation.evo-counterparty.customers.nav.label": "客户",
          "navigation.evo-counterparty.suppliers.nav.label": "供应商",
          "navigation.evo-counterparty.my-customers.nav.label": "我的客户",
          "navigation.evo-counterparty.my-suppliers.nav.label": "我的供应商",
          "workbench.my-customers.title": "我的客户",
          "workbench.my-customers.description": "当前销售责任范围内由你负责的客户。",
          "workbench.my-suppliers.title": "我的供应商",
          "workbench.my-suppliers.description": "当前采购责任范围内由你负责的供应商。"
        }
      }
    }]
  }]
};
