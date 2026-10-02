import type { AppManagerService } from "./service.js";
import type {
  ProviderBindingStoreV010
} from "./provider-resolution.js";
import {
  resolveProviderRuntimeV010
} from "./provider-resolution.js";
import type {
  ProviderRuntimeRegistry
} from "../providers/runtime-registry.js";
import type {
  EnterpriseOperatingGraphAnalysisProviderV020,
  EnterpriseOperatingGraphRuntimeFactProviderV020
} from "../contracts/enterprise-operating-graph-observatory.js";
import {
  EOG_ANALYSIS_PROVIDER_CAPABILITY_V020,
  EOG_ANALYSIS_PROVIDER_CONTRACT_V020,
  EOG_RUNTIME_FACT_PROVIDER_CAPABILITY_V020,
  EOG_RUNTIME_FACT_PROVIDER_CONTRACT_V020,
  type EnterpriseOperatingGraphObservatoryProviderResolverV020
} from "../contracts/enterprise-operating-graph-observatory-runtime.js";
import type {
  EnterpriseOperatingGraphReadProviderV010
} from "../contracts/enterprise-operating-graph-read.js";
import {
  createEnterpriseOperatingGraphObservatoryServiceV020
} from "./enterprise-operating-graph-observatory.js";

export {
  EOG_ANALYSIS_PROVIDER_CAPABILITY_V020,
  EOG_ANALYSIS_PROVIDER_CONTRACT_V020,
  EOG_RUNTIME_FACT_PROVIDER_CAPABILITY_V020,
  EOG_RUNTIME_FACT_PROVIDER_CONTRACT_V020
} from "../contracts/enterprise-operating-graph-observatory-runtime.js";
export type {
  EnterpriseOperatingGraphObservatoryProviderResolverV020,
  EnterpriseOperatingGraphObservatoryServiceV020
} from "../contracts/enterprise-operating-graph-observatory-runtime.js";

function required(value: string, code: string): string {
  if (!value?.trim()) throw new Error(code);
  return value.trim();
}

export function createEnterpriseOperatingGraphObservatoryProviderResolverV020(
  input: {
    manager: Pick<AppManagerService, "listEffectiveServiceProviders">;
    registry: ProviderRuntimeRegistry;
    bindings: ProviderBindingStoreV010;
    installationId?: string;
  }
): EnterpriseOperatingGraphObservatoryProviderResolverV020 {
  const installationId = input.installationId?.trim() || "default";

  const descriptors = (capability: string) =>
    input.manager.listEffectiveServiceProviders(capability);

  const hasCandidate = (capability: string): boolean =>
    descriptors(capability).some(
      descriptor => input.registry.has(descriptor.providerId)
    );

  const resolve = <T>(
    capability: string,
    enterpriseId: string
  ): { providerId: string; runtime: T } | undefined => {
    const result = resolveProviderRuntimeV010<T>(
      input.registry,
      descriptors(capability),
      input.bindings,
      capability,
      {
        installationId,
        enterpriseId: required(
          enterpriseId,
          "EOG_ENTERPRISE_ID_REQUIRED"
        )
      }
    );
    return result
      ? {
          providerId: result.providerId,
          runtime: result.runtime
        }
      : undefined;
  };

  const resolveRuntime = (
    enterpriseId: string
  ): EnterpriseOperatingGraphRuntimeFactProviderV020 | undefined => {
    const resolved =
      resolve<EnterpriseOperatingGraphRuntimeFactProviderV020>(
        EOG_RUNTIME_FACT_PROVIDER_CAPABILITY_V020,
        enterpriseId
      );
    if (!resolved) return undefined;
    if (
      resolved.runtime.contractVersion !== "0.2.0"
      || resolved.runtime.providerId !== resolved.providerId
    ) {
      throw new Error("EOG_RUNTIME_PROVIDER_CONTRACT_MISMATCH");
    }
    return resolved.runtime;
  };

  const resolveAnalysis = (
    enterpriseId: string
  ): EnterpriseOperatingGraphAnalysisProviderV020 | undefined => {
    const resolved =
      resolve<EnterpriseOperatingGraphAnalysisProviderV020>(
        EOG_ANALYSIS_PROVIDER_CAPABILITY_V020,
        enterpriseId
      );
    if (!resolved) return undefined;
    if (
      resolved.runtime.contractVersion !== "0.2.0"
      || resolved.runtime.providerId !== resolved.providerId
    ) {
      throw new Error("EOG_ANALYSIS_PROVIDER_CONTRACT_MISMATCH");
    }
    return resolved.runtime;
  };

  return {
    hasRuntimeCandidate() {
      return hasCandidate(EOG_RUNTIME_FACT_PROVIDER_CAPABILITY_V020);
    },

    hasAnalysisCandidate() {
      return hasCandidate(EOG_ANALYSIS_PROVIDER_CAPABILITY_V020);
    },

    resolveRuntime,

    resolveAnalysis,

    createService(request) {
      const enterpriseId = required(
        request.enterpriseId,
        "EOG_ENTERPRISE_ID_REQUIRED"
      );
      const runtimeProvider = resolveRuntime(enterpriseId);
      if (!runtimeProvider) {
        throw new Error("EOG_RUNTIME_PROVIDER_REQUIRED");
      }

      if (!request.requireAnalysis) {
        return createEnterpriseOperatingGraphObservatoryServiceV020({
          graphService: request.graphService,
          runtimeProvider
        });
      }

      const analysisProvider = resolveAnalysis(enterpriseId);
      if (!analysisProvider) {
        throw new Error("EOG_ANALYSIS_PROVIDER_REQUIRED");
      }
      return createEnterpriseOperatingGraphObservatoryServiceV020({
        graphService: request.graphService,
        runtimeProvider,
        analysisProvider
      });
    }
  };
}
