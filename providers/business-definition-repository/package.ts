import type { PackageManifestV010 } from "../../contracts/package.js";
import {
  BUSINESS_DEFINITION_REPOSITORY_CAPABILITY_V010,
  BUSINESS_DEFINITION_REPOSITORY_CONTRACT_V010
} from "../../contracts/business-definition-repository.js";

export const BUSINESS_DEFINITION_REPOSITORY_PACKAGE_ID =
  "business-definition-repository";
export const BUSINESS_DEFINITION_REPOSITORY_FEATURE_ID =
  "business-definition-repository.default";
export const BUSINESS_DEFINITION_REPOSITORY_PROVIDER_ID =
  "host.business-definition-repository";

export const businessDefinitionRepositoryPackage: PackageManifestV010 = {
  contractVersion: "0.1.0",
  packageId: BUSINESS_DEFINITION_REPOSITORY_PACKAGE_ID,
  displayName: "Business Definition Repository",
  version: "0.1.0",
  type: "PLATFORM_PROVIDER",
  features: [
    {
      contractVersion: "0.1.0",
      featureId: BUSINESS_DEFINITION_REPOSITORY_FEATURE_ID,
      packageId: BUSINESS_DEFINITION_REPOSITORY_PACKAGE_ID,
      version: "0.1.0",
      activationScope: "INSTALLATION",
      defaultActivation: true,
      providesCapabilities: [
        BUSINESS_DEFINITION_REPOSITORY_CAPABILITY_V010
      ],
      contributions: [
        {
          kind: "platform.service-provider",
          provider: {
            contractVersion: "0.1.0",
            providerId: BUSINESS_DEFINITION_REPOSITORY_PROVIDER_ID,
            capability: BUSINESS_DEFINITION_REPOSITORY_CAPABILITY_V010,
            providerContract:
              BUSINESS_DEFINITION_REPOSITORY_CONTRACT_V010,
            providerContractVersion: "0.1.0",
            binding: {
              type: "IN_PROCESS",
              ref: "runtime://host.business-definition-repository"
            },
            metadata: {
              scope: "ENTERPRISE_CONTEXT",
              revisionModel: "IMMUTABLE_APPEND_ONLY"
            }
          }
        }
      ]
    }
  ]
};
