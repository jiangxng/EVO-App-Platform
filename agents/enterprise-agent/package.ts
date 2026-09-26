import type { PackageManifestV010 } from "../../contracts/package.js";

export const ENTERPRISE_AGENT_PACKAGE_ID = "enterprise-agent";
export const ENTERPRISE_AGENT_FEATURE_ID = "enterprise-agent.default";
export const ENTERPRISE_AGENT_PAGE_SOURCE = "app://enterprise-agent/pages/home";

export const enterpriseAgentPackage: PackageManifestV010 = {
  contractVersion: "0.1.0",
  packageId: ENTERPRISE_AGENT_PACKAGE_ID,
  displayName: "Personal Agent",
  version: "0.1.0",
  type: "AGENT",
  features: [
    {
      contractVersion: "0.1.0",
      featureId: ENTERPRISE_AGENT_FEATURE_ID,
      packageId: ENTERPRISE_AGENT_PACKAGE_ID,
      version: "0.1.0",
      activationScope: "INSTALLATION",
      defaultActivation: true,
      providesCapabilities: [
        "agent.personal",
        "agent.personal.tool-discovery",
        "agent.enterprise",
        "agent.enterprise.app-manager-tools",
        "agent.enterprise.tool-discovery"
      ],
      contributions: [
        {
          kind: "eidos.experience",
          manifest: {
            contractVersion: "0.1.0",
            experienceId: "enterprise-agent",
            packageId: ENTERPRISE_AGENT_PACKAGE_ID,
            featureId: ENTERPRISE_AGENT_FEATURE_ID,
            defaultRoute: "/enterprise-agent",
            pages: [
              {
                id: "enterprise-agent.home",
                title: "Personal Agent",
                source: ENTERPRISE_AGENT_PAGE_SOURCE
              }
            ],
            routes: [
              {
                id: "enterprise-agent.home",
                path: "/enterprise-agent",
                pageId: "enterprise-agent.home"
              }
            ],
            navigation: [
              {
                id: "enterprise-agent.nav",
                label: "Personal Agent",
                route: "/enterprise-agent",
                order: 10
              }
            ]
          }
        },
        {
          kind: "eidos.workbench-activity",
          activity: {
            contractVersion: "0.1.0",
            id: "enterprise-agent",
            title: "Personal Agent",
            icon: "agent",
            kind: "side-route",
            route: "/enterprise-agent",
            order: 20,
            localization: {
              namespace: ENTERPRISE_AGENT_PACKAGE_ID,
              key: "workbench.activity.label"
            }
          }
        },
        {
          kind: "eidos.localization-bundle",
          bundle: {
            contractVersion: "0.1.0",
            namespace: ENTERPRISE_AGENT_PACKAGE_ID,
            locale: "en",
            messages: {
              "workbench.activity.label": "Personal Agent",
              "navigation.enterprise-agent.nav.label": "Personal Agent",
              "page.enterprise-agent.home.title": "Personal Agent",
              "chat.enterprise-agent.home.composer.placeholder": "Tell Personal Agent what you want to accomplish",
              "chat.enterprise-agent.home.composer.sendLabel": "Send",
              "chat.enterprise-agent.home.emptyState": "Ask Personal Agent to inspect, explain or prepare an opinion or change."
            }
          }
        },
        {
          kind: "eidos.localization-bundle",
          bundle: {
            contractVersion: "0.1.0",
            namespace: ENTERPRISE_AGENT_PACKAGE_ID,
            locale: "zh-CN",
            messages: {
              "workbench.activity.label": "个人 Agent",
              "navigation.enterprise-agent.nav.label": "个人 Agent",
              "page.enterprise-agent.home.title": "个人 Agent",
              "chat.enterprise-agent.home.composer.placeholder": "告诉个人 Agent 你想分析或处理什么",
              "chat.enterprise-agent.home.composer.sendLabel": "发送",
              "chat.enterprise-agent.home.emptyState": "让个人 Agent 帮你查看、分析、提出意见或准备变更。"
            }
          }
        }
      ]
    }
  ]
};

export const enterpriseAgentExperienceAssets = new Map<string, unknown>([
  [ENTERPRISE_AGENT_PAGE_SOURCE, {
    contractVersion: "0.1.0",
    kind: "chat",
    id: "enterprise-agent.home",
    title: "Personal Agent",
    command: {
      code: "enterprise-agent.chat",
      inputVersion: "0.1.0"
    },
    composer: {
      key: "message",
      placeholder: "Tell Enterprise Agent what you want to accomplish",
      sendLabel: "Send"
    },
    emptyState: "Ask Enterprise Agent to inspect, explain or prepare a change.",
    metadata: {
      packageId: ENTERPRISE_AGENT_PACKAGE_ID,
      featureId: ENTERPRISE_AGENT_FEATURE_ID,
      convergence: {
        historicalProject: "Experience Compiler (EC)",
        sourceRepository: "jiangxng/Experience-Compiler",
        sourceRelease: "1.0.1",
        targetIdentity: "Personal Agent"
      },
      llm: {
        requiredCapability: "llm.inference",
        integrationStatus: "PROVIDER_RESOLVED_AT_RUNTIME"
      },
      preservedAssets: [
        "knowledge",
        "memory",
        "learning",
        "research",
        "context-compiler",
        "provenance-lineage",
        "industry-packs",
        "model-replacement"
      ]
    }
  }]
]);
