import type { PackageManifestV010 } from "../../contracts/package.js";

export const ENTERPRISE_CONTEXT_GOVERNANCE_APP_PACKAGE_ID =
  "evo-enterprise-context-governance";
export const ENTERPRISE_CONTEXT_GOVERNANCE_APP_FEATURE_ID =
  "evo-enterprise-context-governance.default";

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
          defaultRoute: "/enterprise-contexts/new",
          pages: [{
            id: "evo-enterprise-context-governance.create",
            title: "Create Enterprise Context",
            source: "app://evo-enterprise-context-governance/pages/create"
          }],
          routes: [{
            id: "evo-enterprise-context-governance.create",
            path: "/enterprise-contexts/new",
            pageId: "evo-enterprise-context-governance.create"
          }],
          navigation: [{
            id: "evo-enterprise-context-governance.nav",
            label: "Enterprise Contexts",
            route: "/enterprise-contexts/new",
            order: 20
          }]
        }
      },
      {
        kind: "eidos.localization-bundle",
        bundle: {
          contractVersion: "0.1.0",
          namespace: "evo-enterprise-context-governance",
          locale: "en",
          messages: {
            "navigation.evo-enterprise-context-governance.nav.label":
              "Enterprise Contexts",
            "page.evo-enterprise-context-governance.create.title":
              "Create Enterprise Context",
            "field.evo-enterprise-context-governance.create.displayName.label":
              "Enterprise name",
            "field.evo-enterprise-context-governance.create.code.label":
              "Enterprise code",
            "action.evo-enterprise-context-governance.create.create.label":
              "Create enterprise"
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
            "navigation.evo-enterprise-context-governance.nav.label":
              "企业上下文",
            "page.evo-enterprise-context-governance.create.title":
              "创建企业上下文",
            "field.evo-enterprise-context-governance.create.displayName.label":
              "企业名称",
            "field.evo-enterprise-context-governance.create.code.label":
              "企业代码",
            "action.evo-enterprise-context-governance.create.create.label":
              "创建企业"
          }
        }
      }
    ]
  }]
};
