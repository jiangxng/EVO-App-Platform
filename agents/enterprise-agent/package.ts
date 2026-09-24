import type { PackageManifestV010 } from "../../contracts/package.js";

export const ENTERPRISE_AGENT_PACKAGE_ID = "enterprise-agent";
export const ENTERPRISE_AGENT_FEATURE_ID = "enterprise-agent.default";
export const ENTERPRISE_AGENT_PAGE_SOURCE = "app://enterprise-agent/pages/home";

export const enterpriseAgentPackage: PackageManifestV010 = {
  contractVersion: "0.1.0",
  packageId: ENTERPRISE_AGENT_PACKAGE_ID,
  displayName: "Enterprise Agent",
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
        "agent.enterprise",
        "agent.enterprise.app-manager-tools"
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
                title: "Enterprise Agent",
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
                label: "Enterprise Agent",
                route: "/enterprise-agent",
                order: 10
              }
            ]
          }
        },
        {
          kind: "eidos.localization-bundle",
          bundle: {
            contractVersion: "0.1.0",
            namespace: ENTERPRISE_AGENT_PACKAGE_ID,
            locale: "en",
            messages: {
              "navigation.enterprise-agent.nav.label": "Enterprise Agent",
              "page.enterprise-agent.home.title": "Enterprise Agent",
              "field.enterprise-agent.home.message.label": "Tell Enterprise Agent what you want to accomplish",
              "action.enterprise-agent.home.send.label": "Send"
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
              "navigation.enterprise-agent.nav.label": "企业智能体",
              "page.enterprise-agent.home.title": "企业智能体",
              "field.enterprise-agent.home.message.label": "告诉企业智能体你要完成什么",
              "action.enterprise-agent.home.send.label": "发送"
            }
          }
        }
      ]
    }
  ]
};

export const enterpriseAgentExperienceAssets = new Map<string, unknown>([
  [ENTERPRISE_AGENT_PAGE_SOURCE, {
    contractVersion: "0.1.1",
    kind: "form",
    id: "enterprise-agent.home",
    title: "Enterprise Agent",
    purpose: "execute-command",
    command: {
      code: "enterprise-agent.chat",
      inputVersion: "0.1.0"
    },
    fields: [
      {
        key: "message",
        label: "Tell Enterprise Agent what you want to accomplish",
        semanticType: "agent-message",
        control: "text",
        required: true
      }
    ],
    actions: [
      {
        id: "send",
        label: "Send",
        type: "submit",
        command: "enterprise-agent.chat",
        requiresConfirmation: false
      }
    ],
    metadata: {
      packageId: ENTERPRISE_AGENT_PACKAGE_ID,
      featureId: ENTERPRISE_AGENT_FEATURE_ID,
      convergence: {
        historicalProject: "Experience Compiler (EC)",
        sourceRepository: "jiangxng/Experience-Compiler",
        sourceRelease: "1.0.1",
        targetIdentity: "Enterprise Agent"
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
