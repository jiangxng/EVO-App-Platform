import type { PackageManifestV010 } from "../../contracts/package.js";

export const TEMPLATE_STORE_PACKAGE_ID = "evo-template-store";
export const TEMPLATE_STORE_FEATURE_ID = "evo-template-store.default";
export const TEMPLATE_STORE_EXPERIENCE_ID = "evo-template-store";
export const TEMPLATE_STORE_PAGE_ID = "evo-template-store.home";
export const TEMPLATE_STORE_PAGE_SOURCE = "app://evo-template-store/pages/home";
export const TEMPLATE_STORE_ROUTE = "/templates";
export const TEMPLATE_STORE_DETAIL_PAGE_ID = "evo-template-store.detail";
export const TEMPLATE_STORE_DETAIL_PAGE_SOURCE =
  "app://evo-template-store/pages/detail";
export const TEMPLATE_STORE_DETAIL_ROUTE = "/templates/detail";
export const TEMPLATE_STORE_COPY_COMMAND = "evo-template-store.copy";
export const TEMPLATE_STORE_OPEN_DETAIL_COMMAND =
  "evo-template-store.open-detail";
export const TEMPLATE_STORE_COPY_AUTHORIZATION_ACTION = "template.store.copy";
export const TEMPLATE_STORE_PREVIEW_2D_COMMAND =
  "evo-template-store.preview-2d";
export const TEMPLATE_STORE_DOWNLOAD_COMMAND =
  "evo-template-store.download";

export const templateStorePackage: PackageManifestV010 = {
  contractVersion: "0.1.0",
  packageId: TEMPLATE_STORE_PACKAGE_ID,
  displayName: "EVO Template Store",
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
    featureId: TEMPLATE_STORE_FEATURE_ID,
    packageId: TEMPLATE_STORE_PACKAGE_ID,
    version: "0.1.0",
    activationScope: "INSTALLATION",
    defaultActivation: true,
    providesCapabilities: ["template.store.browse"],
    contributions: [
      {
        kind: "eidos.experience",
        manifest: {
          contractVersion: "0.1.0",
          experienceId: TEMPLATE_STORE_EXPERIENCE_ID,
          packageId: TEMPLATE_STORE_PACKAGE_ID,
          featureId: TEMPLATE_STORE_FEATURE_ID,
          defaultRoute: TEMPLATE_STORE_ROUTE,
          pages: [{
            id: TEMPLATE_STORE_PAGE_ID,
            title: "Template Store",
            source: TEMPLATE_STORE_PAGE_SOURCE
          }, {
            id: TEMPLATE_STORE_DETAIL_PAGE_ID,
            title: "Template Detail",
            source: TEMPLATE_STORE_DETAIL_PAGE_SOURCE
          }],
          routes: [{
            id: TEMPLATE_STORE_PAGE_ID,
            path: TEMPLATE_STORE_ROUTE,
            pageId: TEMPLATE_STORE_PAGE_ID
          }, {
            id: TEMPLATE_STORE_DETAIL_PAGE_ID,
            path: TEMPLATE_STORE_DETAIL_ROUTE,
            pageId: TEMPLATE_STORE_DETAIL_PAGE_ID
          }]
        }
      },
      {
        kind: "eidos.localization-bundle",
        bundle: {
          contractVersion: "0.1.0",
          namespace: TEMPLATE_STORE_PACKAGE_ID,
          locale: "en",
          messages: {
            "navigation.evo-template-store.nav.label": "Template Store",
            "catalog.evo-template-store.title": "Template Store",
            "catalog.evo-template-store.description": "Browse shared templates and copy an independent enterprise-owned definition into Enterprise Context.",
            "catalog.evo-template-store.search.placeholder": "Search templates",
            "catalog.evo-template-store.search.ariaLabel": "Search templates",
            "catalog.evo-template-store.search.noResults": "No matching templates.",
            "catalog.evo-template-store.empty": "No shared templates are available."
          }
        }
      },
      {
        kind: "eidos.localization-bundle",
        bundle: {
          contractVersion: "0.1.0",
          namespace: TEMPLATE_STORE_PACKAGE_ID,
          locale: "zh-CN",
          messages: {
            "navigation.evo-template-store.nav.label": "模板商店",
            "catalog.evo-template-store.title": "模板商店",
            "catalog.evo-template-store.description": "浏览共享模板，并将独立副本复制到企业上下文仓库。",
            "catalog.evo-template-store.search.placeholder": "搜索模板",
            "catalog.evo-template-store.search.ariaLabel": "搜索模板",
            "catalog.evo-template-store.search.noResults": "没有匹配的模板。",
            "catalog.evo-template-store.empty": "当前没有可用的共享模板。"
          }
        }
      }
    ]
  }]
};
