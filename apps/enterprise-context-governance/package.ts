import type { PackageManifestV010 } from "../../contracts/package.js";
import {
  ENTERPRISE_APPLICATIONS_ROUTE,
  ENTERPRISE_CONTEXT_AUDIT_ROUTE,
  ENTERPRISE_CONTEXT_CONNECTIONS_ROUTE,
  ENTERPRISE_CONTEXT_CREATE_PAGE_ID,
  ENTERPRISE_CONTEXT_CREATE_PAGE_SOURCE,
  ENTERPRISE_CONTEXT_CREATE_ROUTE,
  ENTERPRISE_CONTEXT_DATA_ROUTE,
  ENTERPRISE_CONTEXT_DIRECTORY_PAGE_ID,
  ENTERPRISE_CONTEXT_DIRECTORY_PAGE_SOURCE,
  ENTERPRISE_CONTEXT_DIRECTORY_ROUTE,
  ENTERPRISE_CONTEXT_FILES_ROUTE,
  ENTERPRISE_CONTEXT_GOVERNANCE_APP_FEATURE_ID,
  ENTERPRISE_CONTEXT_GOVERNANCE_APP_PACKAGE_ID,
  ENTERPRISE_CONTEXT_JOBS_ROUTE,
  ENTERPRISE_CONTEXT_MEMBERS_ROUTE,
  ENTERPRISE_CONTEXT_ORGANIZATION_ROUTE,
  ENTERPRISE_CONTEXT_OVERVIEW_PAGE_ID,
  ENTERPRISE_CONTEXT_OVERVIEW_PAGE_SOURCE,
  ENTERPRISE_CONTEXT_OVERVIEW_ROUTE,
  ENTERPRISE_CONTEXT_SETTINGS_ROUTE,
  ENTERPRISE_SOFTWARE_DETAIL_ROUTE,
  ENTERPRISE_SOFTWARE_ROUTE
} from "./constants.js";

export {
  ENTERPRISE_CONTEXT_GOVERNANCE_APP_FEATURE_ID,
  ENTERPRISE_CONTEXT_GOVERNANCE_APP_PACKAGE_ID
} from "./constants.js";

const legacyContextRoutes = [
  ENTERPRISE_APPLICATIONS_ROUTE,
  ENTERPRISE_SOFTWARE_ROUTE,
  ENTERPRISE_SOFTWARE_DETAIL_ROUTE,
  ENTERPRISE_CONTEXT_ORGANIZATION_ROUTE,
  ENTERPRISE_CONTEXT_DATA_ROUTE,
  ENTERPRISE_CONTEXT_FILES_ROUTE,
  ENTERPRISE_CONTEXT_MEMBERS_ROUTE,
  ENTERPRISE_CONTEXT_CONNECTIONS_ROUTE,
  ENTERPRISE_CONTEXT_JOBS_ROUTE,
  ENTERPRISE_CONTEXT_AUDIT_ROUTE,
  ENTERPRISE_CONTEXT_SETTINGS_ROUTE
] as const;

export const enterpriseContextGovernanceAppPackage: PackageManifestV010 = {
  contractVersion: "0.1.0",
  packageId: ENTERPRISE_CONTEXT_GOVERNANCE_APP_PACKAGE_ID,
  displayName: "Enterprise Context",
  version: "0.2.0",
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
    featureId: ENTERPRISE_CONTEXT_GOVERNANCE_APP_FEATURE_ID,
    packageId: ENTERPRISE_CONTEXT_GOVERNANCE_APP_PACKAGE_ID,
    version: "0.2.0",
    activationScope: "INSTALLATION",
    defaultActivation: true,
    requiresCapabilities: [
      "enterprise.directory",
      "authorization.check"
    ],
    providesCapabilities: [
      "enterprise.context.governance-experience"
    ],
    contributions: [
      {
        kind: "eidos.experience",
        manifest: {
          contractVersion: "0.1.0",
          experienceId: "evo-enterprise-context-governance",
          packageId: ENTERPRISE_CONTEXT_GOVERNANCE_APP_PACKAGE_ID,
          featureId: ENTERPRISE_CONTEXT_GOVERNANCE_APP_FEATURE_ID,
          defaultRoute: ENTERPRISE_CONTEXT_DIRECTORY_ROUTE,
          pages: [{
            id: ENTERPRISE_CONTEXT_DIRECTORY_PAGE_ID,
            title: "Enterprise Contexts",
            source: ENTERPRISE_CONTEXT_DIRECTORY_PAGE_SOURCE
          }, {
            id: ENTERPRISE_CONTEXT_CREATE_PAGE_ID,
            title: "Create Enterprise Context",
            source: ENTERPRISE_CONTEXT_CREATE_PAGE_SOURCE
          }, {
            id: ENTERPRISE_CONTEXT_OVERVIEW_PAGE_ID,
            title: "Enterprise Context",
            source: ENTERPRISE_CONTEXT_OVERVIEW_PAGE_SOURCE
          }],
          routes: [{
            id: ENTERPRISE_CONTEXT_DIRECTORY_PAGE_ID,
            path: ENTERPRISE_CONTEXT_DIRECTORY_ROUTE,
            pageId: ENTERPRISE_CONTEXT_DIRECTORY_PAGE_ID
          }, {
            id: ENTERPRISE_CONTEXT_CREATE_PAGE_ID,
            path: ENTERPRISE_CONTEXT_CREATE_ROUTE,
            pageId: ENTERPRISE_CONTEXT_CREATE_PAGE_ID
          }, {
            id: ENTERPRISE_CONTEXT_OVERVIEW_PAGE_ID,
            path: ENTERPRISE_CONTEXT_OVERVIEW_ROUTE,
            pageId: ENTERPRISE_CONTEXT_OVERVIEW_PAGE_ID
          }, ...legacyContextRoutes.map((path, index) => ({
            id: `evo-enterprise-context-governance.legacy-route-${index + 1}`,
            path,
            pageId: ENTERPRISE_CONTEXT_OVERVIEW_PAGE_ID
          }))]
        }
      },
      {
        kind: "eidos.localization-bundle",
        bundle: {
          contractVersion: "0.1.0",
          namespace: "evo-enterprise-context-governance",
          locale: "en",
          messages: {
            "navigation.evo-enterprise-context-governance.nav.label": "Enterprise Contexts",
            "page.evo-enterprise-context-governance.create.title": "Create Enterprise Context",
            "field.evo-enterprise-context-governance.create.displayName.label": "Enterprise name",
            "field.evo-enterprise-context-governance.create.code.label": "Enterprise code",
            "action.evo-enterprise-context-governance.create.create.label": "Create enterprise"
          }
        }
      },
      {
        kind: "eidos.localization-bundle",
        bundle: {
          contractVersion: "0.1.0",
          namespace: "evo-enterprise-context-governance",
          locale: "zh-CN",
          messages: {
            "navigation.evo-enterprise-context-governance.nav.label": "企业上下文",
            "page.evo-enterprise-context-governance.create.title": "创建企业上下文",
            "field.evo-enterprise-context-governance.create.displayName.label": "企业名称",
            "field.evo-enterprise-context-governance.create.code.label": "企业代码",
            "action.evo-enterprise-context-governance.create.create.label": "创建企业"
          }
        }
      }
    ]
  }]
};
