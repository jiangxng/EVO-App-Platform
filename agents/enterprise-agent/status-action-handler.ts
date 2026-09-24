import type {
  AppActionExecutionResultV010,
  AppActionHandler,
  AppActionRequestV010
} from "../../actions/contracts.js";
import {
  ENTERPRISE_AGENT_FEATURE_ID,
  ENTERPRISE_AGENT_PACKAGE_ID
} from "./package.js";

export interface EnterpriseAgentStatusDependencies {
  listLlmProviders(): Array<{
    providerId: string;
    capability: string;
    providerContract: string;
    providerContractVersion: string;
  }>;
}

export function createEnterpriseAgentStatusActionHandler(
  dependencies: EnterpriseAgentStatusDependencies
): AppActionHandler {
  return {
    packageId: ENTERPRISE_AGENT_PACKAGE_ID,
    featureId: ENTERPRISE_AGENT_FEATURE_ID,
    commandCode: "enterprise-agent.status",

    async execute(request: AppActionRequestV010): Promise<AppActionExecutionResultV010> {
      const providers = dependencies.listLlmProviders();
      return {
        ok: true,
        correlationId: request.sourceInteractionId,
        result: {
          contractVersion: "0.1.0",
          agentId: "enterprise-agent",
          packageStatus: "ACTIVE",
          intelligenceSource: {
            repository: "jiangxng/Experience-Compiler",
            release: "1.0.1",
            role: "durable knowledge/memory/learning/context/research assets"
          },
          hostRuntime: {
            repository: "jiangxng/EVO-App-Platform",
            runtime: "agents/enterprise-agent",
            role: "package lifecycle, App Manager tools and Agent host boundary"
          },
          llm: {
            requiredCapability: "llm.inference",
            connected: providers.length > 0,
            providers: providers.map(provider => ({
              providerId: provider.providerId,
              providerContract: provider.providerContract,
              providerContractVersion: provider.providerContractVersion
            })),
            nextStep: providers.length > 0
              ? "Resolve an llm.inference provider and enable Enterprise Agent chat."
              : "Install and configure an llm.inference Provider plugin."
          }
        }
      };
    }
  };
}
