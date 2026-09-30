import type { PackageManifestV010 } from "../../contracts/package.js";
import { AUTHORIZATION_CHECK_CAPABILITY } from "../../providers/authorization/package.js";
import { ENTERPRISE_CONTEXT_CAPABILITY } from "../../providers/enterprise-context/package.js";
import { ENTERPRISE_MEMBERSHIP_CAPABILITY } from "../../providers/enterprise-context-grant/package.js";
import { IDENTITY_SESSION_CAPABILITY } from "../../providers/session/package.js";

export const EXTERNAL_AGENT_ACCESS_PACKAGE_ID = "evo-external-agent-access";
export const EXTERNAL_AGENT_ACCESS_FEATURE_ID =
  "evo-external-agent-access.default";
export const EXTERNAL_AGENT_ACCESS_CAPABILITY = "external.agent.access";

export const externalAgentAccessSetupPageSource =
  "app://evo-external-agent-access/pages/setup";

export const externalAgentAccessPackage: PackageManifestV010 = {
  contractVersion: "0.1.0",
  packageId: EXTERNAL_AGENT_ACCESS_PACKAGE_ID,
  displayName: "EVO External Agent Access",
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
    featureId: EXTERNAL_AGENT_ACCESS_FEATURE_ID,
    packageId: EXTERNAL_AGENT_ACCESS_PACKAGE_ID,
    version: "0.1.0",
    activationScope: "INSTALLATION",
    defaultActivation: true,
    requiresCapabilities: [
      IDENTITY_SESSION_CAPABILITY,
      AUTHORIZATION_CHECK_CAPABILITY,
      ENTERPRISE_CONTEXT_CAPABILITY,
      ENTERPRISE_MEMBERSHIP_CAPABILITY
    ],
    providesCapabilities: [EXTERNAL_AGENT_ACCESS_CAPABILITY],
    contributions: [
      {
        kind: "eidos.experience",
        manifest: {
          contractVersion: "0.1.0",
          experienceId: "evo-external-agent-access",
          packageId: EXTERNAL_AGENT_ACCESS_PACKAGE_ID,
          featureId: EXTERNAL_AGENT_ACCESS_FEATURE_ID,
          defaultRoute: "/external-agents",
          pages: [{
            id: "evo-external-agent-access.setup",
            title: "External Agent Access",
            source: externalAgentAccessSetupPageSource
          }],
          routes: [{
            id: "evo-external-agent-access.setup",
            path: "/external-agents",
            pageId: "evo-external-agent-access.setup"
          }],
          navigation: [{
            id: "evo-external-agent-access.nav",
            label: "External Agents",
            route: "/external-agents",
            order: 65
          }]
        }
      },
      {
        kind: "eidos.localization-bundle",
        bundle: {
          contractVersion: "0.1.0",
          namespace: EXTERNAL_AGENT_ACCESS_PACKAGE_ID,
          locale: "en",
          messages: {
            "navigation.evo-external-agent-access.nav.label": "External Agents",
            "page.evo-external-agent-access.setup.title": "External Agent Access"
          }
        }
      },
      {
        kind: "eidos.localization-bundle",
        bundle: {
          contractVersion: "0.1.0",
          namespace: EXTERNAL_AGENT_ACCESS_PACKAGE_ID,
          locale: "zh-CN",
          messages: {
            "navigation.evo-external-agent-access.nav.label": "外部 Agent",
            "page.evo-external-agent-access.setup.title": "外部 Agent 接入"
          }
        }
      }
    ]
  }]
};
