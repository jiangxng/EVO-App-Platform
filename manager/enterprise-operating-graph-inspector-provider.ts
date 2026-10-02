import type { AppManagerService } from "./service.js";
import type {
  EnterpriseOperatingGraphInspectorPropertyProviderV010,
  EnterpriseOperatingGraphInspectorPropertyResolverV010,
  EogInspectorPropertyContributionV010,
  EogInspectorTargetV010
} from "../contracts/enterprise-operating-graph-inspector.js";
import {
  EOG_INSPECTOR_PROPERTY_PROVIDER_CAPABILITY_V010
} from "../contracts/enterprise-operating-graph-inspector.js";
import type {
  ProviderRuntimeRegistry
} from "../providers/runtime-registry.js";

function required(value: string, code: string): string {
  if (!value?.trim()) throw new Error(code);
  return value.trim();
}

export function createEnterpriseOperatingGraphInspectorPropertyResolverV010(
  input: {
    manager: Pick<AppManagerService, "listEffectiveServiceProviders">;
    registry: ProviderRuntimeRegistry;
  }
): EnterpriseOperatingGraphInspectorPropertyResolverV010 {
  const descriptors = () =>
    input.manager
      .listEffectiveServiceProviders(
        EOG_INSPECTOR_PROPERTY_PROVIDER_CAPABILITY_V010
      )
      .slice()
      .sort((a, b) => a.providerId.localeCompare(b.providerId));

  const runtimes = (): Array<{
    providerId: string;
    runtime: EnterpriseOperatingGraphInspectorPropertyProviderV010;
  }> => descriptors()
    .filter(descriptor => input.registry.has(descriptor.providerId))
    .map(descriptor => {
      const runtime =
        input.registry.get<EnterpriseOperatingGraphInspectorPropertyProviderV010>(
          descriptor.providerId
        );
      if (!runtime) {
        throw new Error("EOG_INSPECTOR_PROVIDER_RUNTIME_REQUIRED");
      }
      if (runtime.providerId !== descriptor.providerId) {
        throw new Error("EOG_INSPECTOR_PROVIDER_ID_MISMATCH");
      }
      return {
        providerId: descriptor.providerId,
        runtime
      };
    });

  return {
    hasCandidates() {
      return runtimes().length > 0;
    },

    async inspect(request) {
      const enterpriseId = required(
        request.enterpriseId,
        "EOG_ENTERPRISE_ID_REQUIRED"
      );
      const graphId = required(
        request.graphId,
        "EOG_GRAPH_ID_REQUIRED"
      );
      const target = structuredClone(request.target) as EogInspectorTargetV010;
      const contributions: EogInspectorPropertyContributionV010[] = [];

      for (const candidate of runtimes()) {
        const contribution = await candidate.runtime.inspect({
          enterpriseId,
          graphId,
          target
        });

        if (
          contribution.contractVersion !== "0.1.0"
          || contribution.providerId !== candidate.providerId
          || JSON.stringify(contribution.target) !== JSON.stringify(target)
        ) {
          throw new Error("EOG_INSPECTOR_PROVIDER_CONTRACT_MISMATCH");
        }
        contributions.push(structuredClone(contribution));
      }

      return contributions;
    }
  };
}
