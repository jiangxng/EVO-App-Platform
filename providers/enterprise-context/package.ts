import type { PackageManifestV010 } from "../../contracts/package.js";
import {
  ENTERPRISE_BUSINESS_DEFINITION_CAPABILITY_V010,
  ENTERPRISE_BUSINESS_DEFINITION_CONTRACT_V010
} from "../../contracts/enterprise-business-definition.js";
import {
  ENTERPRISE_TEMPLATE_TRANSFER_CAPABILITY_V010,
  ENTERPRISE_TEMPLATE_TRANSFER_CONTRACT_V010
} from "../../contracts/template-transfer.js";
import {
  ENTERPRISE_RESOURCE_CAPABILITY_V010,
  ENTERPRISE_RESOURCE_CONTRACT_V010
} from "../../contracts/enterprise-resource.js";

export const HOST_ENTERPRISE_CONTEXT_PACKAGE_ID = "host-enterprise-context-provider";
export const HOST_ENTERPRISE_CONTEXT_FEATURE_ID = "host-enterprise-context-provider.default";
export const HOST_ENTERPRISE_CONTEXT_PROVIDER_ID = "host.enterprise-context";
export const ENTERPRISE_CONTEXT_CAPABILITY = "enterprise.directory";
export const HOST_ENTERPRISE_BUSINESS_DEFINITION_PROVIDER_ID =
  "host.enterprise-context.business-definitions";
export const HOST_ENTERPRISE_TEMPLATE_TRANSFER_PROVIDER_ID =
  "host.enterprise-context.template-transfer";
export const HOST_ENTERPRISE_RESOURCE_PROVIDER_ID =
  "host.enterprise-context.resources";

export const hostEnterpriseContextProviderPackage: PackageManifestV010 = {
  contractVersion: "0.1.0",
  packageId: HOST_ENTERPRISE_CONTEXT_PACKAGE_ID,
  displayName: "Host Enterprise Context Provider",
  version: "0.1.0",
  type: "PLATFORM_PROVIDER",
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
    featureId: HOST_ENTERPRISE_CONTEXT_FEATURE_ID,
    packageId: HOST_ENTERPRISE_CONTEXT_PACKAGE_ID,
    version: "0.1.0",
    activationScope: "INSTALLATION",
    defaultActivation: true,
    providesCapabilities: [
      ENTERPRISE_CONTEXT_CAPABILITY,
      ENTERPRISE_BUSINESS_DEFINITION_CAPABILITY_V010,
      ENTERPRISE_TEMPLATE_TRANSFER_CAPABILITY_V010,
      ENTERPRISE_RESOURCE_CAPABILITY_V010
    ],
    contributions: [
      {
        kind: "platform.service-provider",
        provider: {
          contractVersion: "0.1.0",
          providerId: HOST_ENTERPRISE_CONTEXT_PROVIDER_ID,
          capability: ENTERPRISE_CONTEXT_CAPABILITY,
          providerContract: "evo.enterprise.context-directory",
          providerContractVersion: "0.1.0",
          binding: {
            type: "IN_PROCESS",
            ref: "runtime://host.enterprise-context"
          },
          metadata: {
            configurationBoundary: "APP_PLATFORM_ENTERPRISE_CONTEXTS_JSON",
            purpose: "Host-owned Enterprise Context directory"
          }
        }
      },
      {
        kind: "platform.service-provider",
        provider: {
          contractVersion: "0.1.0",
          providerId: HOST_ENTERPRISE_BUSINESS_DEFINITION_PROVIDER_ID,
          capability: ENTERPRISE_BUSINESS_DEFINITION_CAPABILITY_V010,
          providerContract:
            ENTERPRISE_BUSINESS_DEFINITION_CONTRACT_V010,
          providerContractVersion: "0.1.0",
          binding: {
            type: "IN_PROCESS",
            ref: "runtime://host.enterprise-context.business-definitions"
          },
          metadata: {
            purpose:
              "Enterprise-scoped business definitions, immutable revisions and publication history",
            revisionModel: "IMMUTABLE_APPEND_ONLY",
            knowledgeBoundary: "EXPERIENCE_COMPILER"
          }
        }
      },
      {
        kind: "platform.service-provider",
        provider: {
          contractVersion: "0.1.0",
          providerId: HOST_ENTERPRISE_TEMPLATE_TRANSFER_PROVIDER_ID,
          capability: ENTERPRISE_TEMPLATE_TRANSFER_CAPABILITY_V010,
          providerContract: ENTERPRISE_TEMPLATE_TRANSFER_CONTRACT_V010,
          providerContractVersion: "0.1.0",
          binding: {
            type: "IN_PROCESS",
            ref: "runtime://host.enterprise-context.template-transfer"
          },
          metadata: {
            purpose:
              "Export exact Enterprise Context definition revisions as portable template bundles and copy bundles into independent enterprise-owned drafts",
            copySemantics: "INDEPENDENT_DRAFT",
            sourceDependency: "NONE_AFTER_COPY"
          }
        }
      },
      {
        kind: "platform.service-provider",
        provider: {
          contractVersion: "0.1.0",
          providerId: HOST_ENTERPRISE_RESOURCE_PROVIDER_ID,
          capability: ENTERPRISE_RESOURCE_CAPABILITY_V010,
          providerContract: ENTERPRISE_RESOURCE_CONTRACT_V010,
          providerContractVersion: "0.1.0",
          binding: {
            type: "IN_PROCESS",
            ref: "runtime://host.enterprise-context.resources"
          },
          metadata: {
            purpose:
              "Provider-neutral Enterprise Context Resource Library persistence",
            semanticsBoundary: "DOMAIN_PLUGIN",
            lifecycleBoundary: "CONTEXT_OWNED"
          }
        }
      }
    ]
  }]
};
