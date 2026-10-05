import type { PackageManifestV010 } from "../../contracts/package.js";
import {
  ENTERPRISE_BUSINESS_DEFINITION_CAPABILITY_V010
} from "../../contracts/enterprise-business-definition.js";
import {
  ENTERPRISE_TEMPLATE_TRANSFER_CAPABILITY_V010
} from "../../contracts/template-transfer.js";
import {
  ENTERPRISE_APPLICATIONS_ROUTE,
  ENTERPRISE_CONTEXT_AUDIT_PAGE_ID,
  ENTERPRISE_CONTEXT_AUDIT_PAGE_SOURCE,
  ENTERPRISE_CONTEXT_AUDIT_ROUTE,
  ENTERPRISE_CONTEXT_CONNECTIONS_PAGE_ID,
  ENTERPRISE_CONTEXT_CONNECTIONS_PAGE_SOURCE,
  ENTERPRISE_CONTEXT_CONNECTIONS_ROUTE,
  ENTERPRISE_CONTEXT_CREATE_PAGE_ID,
  ENTERPRISE_CONTEXT_CREATE_PAGE_SOURCE,
  ENTERPRISE_CONTEXT_CREATE_ROUTE,
  ENTERPRISE_CONTEXT_DATA_PAGE_ID,
  ENTERPRISE_CONTEXT_DATA_PAGE_SOURCE,
  ENTERPRISE_CONTEXT_DATA_ROUTE,
  ENTERPRISE_CONTEXT_DIRECTORY_PAGE_ID,
  ENTERPRISE_CONTEXT_DIRECTORY_PAGE_SOURCE,
  ENTERPRISE_CONTEXT_DIRECTORY_ROUTE,
  ENTERPRISE_CONTEXT_FILES_PAGE_ID,
  ENTERPRISE_CONTEXT_FILES_PAGE_SOURCE,
  ENTERPRISE_CONTEXT_FILES_ROUTE,
  ENTERPRISE_CONTEXT_GOVERNANCE_APP_FEATURE_ID,
  ENTERPRISE_CONTEXT_GOVERNANCE_APP_PACKAGE_ID,
  ENTERPRISE_CONTEXT_JOBS_PAGE_ID,
  ENTERPRISE_CONTEXT_JOBS_PAGE_SOURCE,
  ENTERPRISE_CONTEXT_JOBS_ROUTE,
  ENTERPRISE_CONTEXT_MEMBERS_PAGE_ID,
  ENTERPRISE_CONTEXT_MEMBERS_PAGE_SOURCE,
  ENTERPRISE_CONTEXT_MEMBERS_ROUTE,
  ENTERPRISE_CONTEXT_ORGANIZATION_PAGE_ID,
  ENTERPRISE_CONTEXT_ORGANIZATION_PAGE_SOURCE,
  ENTERPRISE_CONTEXT_ORGANIZATION_ROUTE,
  ENTERPRISE_CONTEXT_OVERVIEW_PAGE_ID,
  ENTERPRISE_CONTEXT_OVERVIEW_PAGE_SOURCE,
  ENTERPRISE_CONTEXT_OVERVIEW_ROUTE,
  ENTERPRISE_CONTEXT_SETTINGS_PAGE_ID,
  ENTERPRISE_CONTEXT_SETTINGS_PAGE_SOURCE,
  ENTERPRISE_CONTEXT_SETTINGS_ROUTE,
  ENTERPRISE_SOFTWARE_DETAIL_PAGE_ID,
  ENTERPRISE_SOFTWARE_DETAIL_PAGE_SOURCE,
  ENTERPRISE_SOFTWARE_DETAIL_ROUTE,
  ENTERPRISE_SOFTWARE_PAGE_ID,
  ENTERPRISE_SOFTWARE_PAGE_SOURCE,
  ENTERPRISE_SOFTWARE_ROUTE
} from "./constants.js";

export {
  ENTERPRISE_CONTEXT_GOVERNANCE_APP_FEATURE_ID,
  ENTERPRISE_CONTEXT_GOVERNANCE_APP_PACKAGE_ID
} from "./constants.js";

const navigation = [
  {
    id: "evo-enterprise-context-governance.nav",
    label: "Enterprise Contexts",
    route: ENTERPRISE_CONTEXT_DIRECTORY_ROUTE,
    order: 20
  },
  {
    id: "evo-enterprise-context-governance.overview.nav",
    label: "Overview",
    route: ENTERPRISE_CONTEXT_OVERVIEW_ROUTE,
    order: 21
  },
  {
    id: "evo-enterprise-context-governance.applications.nav",
    label: "Applications",
    route: ENTERPRISE_APPLICATIONS_ROUTE,
    order: 22
  },
  {
    id: "evo-enterprise-context-governance.organization.nav",
    label: "Organization",
    route: ENTERPRISE_CONTEXT_ORGANIZATION_ROUTE,
    order: 23
  },
  {
    id: "evo-enterprise-context-governance.data.nav",
    label: "Data",
    route: ENTERPRISE_CONTEXT_DATA_ROUTE,
    order: 24
  },
  {
    id: "evo-enterprise-context-governance.files.nav",
    label: "Files",
    route: ENTERPRISE_CONTEXT_FILES_ROUTE,
    order: 25
  },
  {
    id: "evo-enterprise-context-governance.members.nav",
    label: "Members & Access",
    route: ENTERPRISE_CONTEXT_MEMBERS_ROUTE,
    order: 26
  },
  {
    id: "evo-enterprise-context-governance.connections.nav",
    label: "Connections",
    route: ENTERPRISE_CONTEXT_CONNECTIONS_ROUTE,
    order: 27
  },
  {
    id: "evo-enterprise-context-governance.jobs.nav",
    label: "Jobs",
    route: ENTERPRISE_CONTEXT_JOBS_ROUTE,
    order: 28
  },
  {
    id: "evo-enterprise-context-governance.audit.nav",
    label: "Audit",
    route: ENTERPRISE_CONTEXT_AUDIT_ROUTE,
    order: 29
  },
  {
    id: "evo-enterprise-context-governance.settings.nav",
    label: "Settings",
    route: ENTERPRISE_CONTEXT_SETTINGS_ROUTE,
    order: 30
  }
] as const;

export const enterpriseContextGovernanceAppPackage: PackageManifestV010 = {
  contractVersion: "0.1.0",
  packageId: ENTERPRISE_CONTEXT_GOVERNANCE_APP_PACKAGE_ID,
  displayName: "Enterprise Context Governance",
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
    featureId: ENTERPRISE_CONTEXT_GOVERNANCE_APP_FEATURE_ID,
    packageId: ENTERPRISE_CONTEXT_GOVERNANCE_APP_PACKAGE_ID,
    version: "0.1.0",
    activationScope: "INSTALLATION",
    defaultActivation: true,
    requiresCapabilities: [
      "enterprise.directory",
      "authorization.check",
      ENTERPRISE_BUSINESS_DEFINITION_CAPABILITY_V010,
      ENTERPRISE_TEMPLATE_TRANSFER_CAPABILITY_V010
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
            title: "Enterprise Overview",
            source: ENTERPRISE_CONTEXT_OVERVIEW_PAGE_SOURCE
          }, {
            id: ENTERPRISE_SOFTWARE_PAGE_ID,
            title: "Applications",
            source: ENTERPRISE_SOFTWARE_PAGE_SOURCE
          }, {
            id: ENTERPRISE_CONTEXT_ORGANIZATION_PAGE_ID,
            title: "Organization",
            source: ENTERPRISE_CONTEXT_ORGANIZATION_PAGE_SOURCE
          }, {
            id: ENTERPRISE_CONTEXT_DATA_PAGE_ID,
            title: "Data",
            source: ENTERPRISE_CONTEXT_DATA_PAGE_SOURCE
          }, {
            id: ENTERPRISE_CONTEXT_FILES_PAGE_ID,
            title: "Files",
            source: ENTERPRISE_CONTEXT_FILES_PAGE_SOURCE
          }, {
            id: ENTERPRISE_CONTEXT_MEMBERS_PAGE_ID,
            title: "Members & Access",
            source: ENTERPRISE_CONTEXT_MEMBERS_PAGE_SOURCE
          }, {
            id: ENTERPRISE_CONTEXT_CONNECTIONS_PAGE_ID,
            title: "Connections",
            source: ENTERPRISE_CONTEXT_CONNECTIONS_PAGE_SOURCE
          }, {
            id: ENTERPRISE_CONTEXT_JOBS_PAGE_ID,
            title: "Jobs",
            source: ENTERPRISE_CONTEXT_JOBS_PAGE_SOURCE
          }, {
            id: ENTERPRISE_CONTEXT_AUDIT_PAGE_ID,
            title: "Audit",
            source: ENTERPRISE_CONTEXT_AUDIT_PAGE_SOURCE
          }, {
            id: ENTERPRISE_CONTEXT_SETTINGS_PAGE_ID,
            title: "Settings",
            source: ENTERPRISE_CONTEXT_SETTINGS_PAGE_SOURCE
          }, {
            id: ENTERPRISE_SOFTWARE_DETAIL_PAGE_ID,
            title: "Application Detail",
            source: ENTERPRISE_SOFTWARE_DETAIL_PAGE_SOURCE
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
          }, {
            id: "evo-enterprise-context-governance.applications",
            path: ENTERPRISE_APPLICATIONS_ROUTE,
            pageId: ENTERPRISE_SOFTWARE_PAGE_ID
          }, {
            id: ENTERPRISE_SOFTWARE_PAGE_ID,
            path: ENTERPRISE_SOFTWARE_ROUTE,
            pageId: ENTERPRISE_SOFTWARE_PAGE_ID
          }, {
            id: ENTERPRISE_CONTEXT_ORGANIZATION_PAGE_ID,
            path: ENTERPRISE_CONTEXT_ORGANIZATION_ROUTE,
            pageId: ENTERPRISE_CONTEXT_ORGANIZATION_PAGE_ID
          }, {
            id: ENTERPRISE_CONTEXT_DATA_PAGE_ID,
            path: ENTERPRISE_CONTEXT_DATA_ROUTE,
            pageId: ENTERPRISE_CONTEXT_DATA_PAGE_ID
          }, {
            id: ENTERPRISE_CONTEXT_FILES_PAGE_ID,
            path: ENTERPRISE_CONTEXT_FILES_ROUTE,
            pageId: ENTERPRISE_CONTEXT_FILES_PAGE_ID
          }, {
            id: ENTERPRISE_CONTEXT_MEMBERS_PAGE_ID,
            path: ENTERPRISE_CONTEXT_MEMBERS_ROUTE,
            pageId: ENTERPRISE_CONTEXT_MEMBERS_PAGE_ID
          }, {
            id: ENTERPRISE_CONTEXT_CONNECTIONS_PAGE_ID,
            path: ENTERPRISE_CONTEXT_CONNECTIONS_ROUTE,
            pageId: ENTERPRISE_CONTEXT_CONNECTIONS_PAGE_ID
          }, {
            id: ENTERPRISE_CONTEXT_JOBS_PAGE_ID,
            path: ENTERPRISE_CONTEXT_JOBS_ROUTE,
            pageId: ENTERPRISE_CONTEXT_JOBS_PAGE_ID
          }, {
            id: ENTERPRISE_CONTEXT_AUDIT_PAGE_ID,
            path: ENTERPRISE_CONTEXT_AUDIT_ROUTE,
            pageId: ENTERPRISE_CONTEXT_AUDIT_PAGE_ID
          }, {
            id: ENTERPRISE_CONTEXT_SETTINGS_PAGE_ID,
            path: ENTERPRISE_CONTEXT_SETTINGS_ROUTE,
            pageId: ENTERPRISE_CONTEXT_SETTINGS_PAGE_ID
          }, {
            id: ENTERPRISE_SOFTWARE_DETAIL_PAGE_ID,
            path: ENTERPRISE_SOFTWARE_DETAIL_ROUTE,
            pageId: ENTERPRISE_SOFTWARE_DETAIL_PAGE_ID
          }],
          navigation: [...navigation]
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
            "navigation.evo-enterprise-context-governance.overview.nav.label": "Overview",
            "navigation.evo-enterprise-context-governance.applications.nav.label": "Applications",
            "navigation.evo-enterprise-context-governance.organization.nav.label": "Organization",
            "navigation.evo-enterprise-context-governance.data.nav.label": "Data",
            "navigation.evo-enterprise-context-governance.files.nav.label": "Files",
            "navigation.evo-enterprise-context-governance.members.nav.label": "Members & Access",
            "navigation.evo-enterprise-context-governance.connections.nav.label": "Connections",
            "navigation.evo-enterprise-context-governance.jobs.nav.label": "Jobs",
            "navigation.evo-enterprise-context-governance.audit.nav.label": "Audit",
            "navigation.evo-enterprise-context-governance.settings.nav.label": "Settings",
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
            "navigation.evo-enterprise-context-governance.overview.nav.label": "概览",
            "navigation.evo-enterprise-context-governance.applications.nav.label": "应用",
            "navigation.evo-enterprise-context-governance.organization.nav.label": "组织",
            "navigation.evo-enterprise-context-governance.data.nav.label": "数据",
            "navigation.evo-enterprise-context-governance.files.nav.label": "文件",
            "navigation.evo-enterprise-context-governance.members.nav.label": "成员与权限",
            "navigation.evo-enterprise-context-governance.connections.nav.label": "连接",
            "navigation.evo-enterprise-context-governance.jobs.nav.label": "任务",
            "navigation.evo-enterprise-context-governance.audit.nav.label": "审计",
            "navigation.evo-enterprise-context-governance.settings.nav.label": "设置",
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
