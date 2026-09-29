import type { PackageManifestV010 } from "../../contracts/package.js";
import {
  EOG_ANALYSIS_PROVIDER_CAPABILITY_V020,
  EOG_ANALYSIS_PROVIDER_CONTRACT_V020
} from "../../manager/enterprise-operating-graph-observatory-provider.js";

export const EOG_BOTTLENECK_ANALYSIS_PROVIDER_ID =
  "eog.bottleneck-analysis";
export const EOG_BOTTLENECK_ANALYSIS_PACKAGE_ID =
  "eog-bottleneck-analysis-provider";
export const EOG_BOTTLENECK_ANALYSIS_FEATURE_ID =
  "eog-bottleneck-analysis-provider.default";

export const eogBottleneckAnalysisProviderPackage: PackageManifestV010 = {
  contractVersion: "0.1.0",
  packageId: EOG_BOTTLENECK_ANALYSIS_PACKAGE_ID,
  displayName: "EOG Bottleneck Analysis Provider",
  version: "0.1.0",
  type: "PLATFORM_PROVIDER",
  features: [
    {
      contractVersion: "0.1.0",
      featureId: EOG_BOTTLENECK_ANALYSIS_FEATURE_ID,
      packageId: EOG_BOTTLENECK_ANALYSIS_PACKAGE_ID,
      version: "0.1.0",
      activationScope: "INSTALLATION",
      defaultActivation: true,
      providesCapabilities: [
        EOG_ANALYSIS_PROVIDER_CAPABILITY_V020
      ],
      contributions: [
        {
          kind: "platform.service-provider",
          provider: {
            contractVersion: "0.1.0",
            providerId: EOG_BOTTLENECK_ANALYSIS_PROVIDER_ID,
            capability: EOG_ANALYSIS_PROVIDER_CAPABILITY_V020,
            providerContract: EOG_ANALYSIS_PROVIDER_CONTRACT_V020,
            providerContractVersion: "0.2.0",
            binding: {
              type: "IN_PROCESS",
              ref: "runtime://eog.bottleneck-analysis"
            },
            metadata: {
              analyzer: "evidence-backed-pressure-trend-v0.1",
              policy: "insufficient-evidence-fails-open"
            }
          }
        }
      ]
    }
  ]
};
