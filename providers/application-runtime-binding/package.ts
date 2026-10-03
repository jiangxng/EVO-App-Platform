import type { PackageManifestV010 } from "../../contracts/package.js";
import {
  ENTERPRISE_APPLICATION_RUNTIME_BINDING_CAPABILITY_V010,
  ENTERPRISE_APPLICATION_RUNTIME_BINDING_CONTRACT_V010
} from "../../contracts/enterprise-application-runtime-binding.js";

export const APPLICATION_RUNTIME_BINDING_PROVIDER_ID =
  "evo.application-runtime-binding";
export const APPLICATION_RUNTIME_BINDING_PACKAGE_ID =
  "evo-application-runtime-binding-provider";
export const APPLICATION_RUNTIME_BINDING_FEATURE_ID =
  "evo-application-runtime-binding-provider.default";

export const applicationRuntimeBindingProviderPackage: PackageManifestV010 = {
  contractVersion: "0.1.0",
  packageId: APPLICATION_RUNTIME_BINDING_PACKAGE_ID,
  displayName: "Enterprise Application Runtime Binding Provider",
  version: "0.1.0",
  type: "PLATFORM_PROVIDER",
  features: [
    {
      contractVersion: "0.1.0",
      featureId: APPLICATION_RUNTIME_BINDING_FEATURE_ID,
      packageId: APPLICATION_RUNTIME_BINDING_PACKAGE_ID,
      version: "0.1.0",
      activationScope: "INSTALLATION",
      defaultActivation: true,
      providesCapabilities: [
        ENTERPRISE_APPLICATION_RUNTIME_BINDING_CAPABILITY_V010
      ],
      contributions: [
        {
          kind: "platform.service-provider",
          provider: {
            contractVersion: "0.1.0",
            providerId: APPLICATION_RUNTIME_BINDING_PROVIDER_ID,
            capability: ENTERPRISE_APPLICATION_RUNTIME_BINDING_CAPABILITY_V010,
            providerContract: ENTERPRISE_APPLICATION_RUNTIME_BINDING_CONTRACT_V010,
            providerContractVersion: "0.1.0",
            binding: {
              type: "IN_PROCESS",
              ref: "runtime://evo.application-runtime-binding"
            },
            metadata: {
              role: "RUNTIME_BINDING_ADAPTER",
              semanticOwner: "ENTERPRISE_CONTEXT",
              runtimeOwner: "EVO_LEDGER_RUNTIME"
            }
          }
        }
      ]
    }
  ]
};
