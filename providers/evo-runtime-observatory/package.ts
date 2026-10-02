import type { PackageManifestV010 } from "../../contracts/package.js";
import {
  EOG_RUNTIME_FACT_PROVIDER_CAPABILITY_V020,
  EOG_RUNTIME_FACT_PROVIDER_CONTRACT_V020
} from "../../contracts/enterprise-operating-graph-observatory-runtime.js";

export const EVO_RUNTIME_OBSERVATORY_PROVIDER_ID =
  "evo.runtime-observatory";
export const EVO_RUNTIME_OBSERVATORY_PACKAGE_ID =
  "evo-runtime-observatory-provider";
export const EVO_RUNTIME_OBSERVATORY_FEATURE_ID =
  "evo-runtime-observatory-provider.default";

export const evoRuntimeObservatoryProviderPackage: PackageManifestV010 = {
  contractVersion: "0.1.0",
  packageId: EVO_RUNTIME_OBSERVATORY_PACKAGE_ID,
  displayName: "EVO Runtime Observatory Provider",
  version: "0.1.0",
  type: "PLATFORM_PROVIDER",
  features: [
    {
      contractVersion: "0.1.0",
      featureId: EVO_RUNTIME_OBSERVATORY_FEATURE_ID,
      packageId: EVO_RUNTIME_OBSERVATORY_PACKAGE_ID,
      version: "0.1.0",
      activationScope: "INSTALLATION",
      defaultActivation: true,
      providesCapabilities: [
        EOG_RUNTIME_FACT_PROVIDER_CAPABILITY_V020
      ],
      contributions: [
        {
          kind: "platform.service-provider",
          provider: {
            contractVersion: "0.1.0",
            providerId: EVO_RUNTIME_OBSERVATORY_PROVIDER_ID,
            capability: EOG_RUNTIME_FACT_PROVIDER_CAPABILITY_V020,
            providerContract: EOG_RUNTIME_FACT_PROVIDER_CONTRACT_V020,
            providerContractVersion: "0.2.0",
            binding: {
              type: "IN_PROCESS",
              ref: "runtime://evo.runtime-observatory"
            },
            metadata: {
              source: "EVO Ledger Runtime",
              observationApiVersion: "0.1.0"
            }
          }
        }
      ]
    }
  ]
};
