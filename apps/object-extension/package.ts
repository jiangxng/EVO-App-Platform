import type { PackageManifestV010 } from "../../contracts/package.js";
import {
  ENTERPRISE_RESOURCE_CAPABILITY_V010
} from "../../contracts/enterprise-resource.js";

export const OBJECT_EXTENSION_PACKAGE_ID =
  "evo-object-extension" as const;
export const OBJECT_EXTENSION_FEATURE_ID =
  "evo-object-extension.default" as const;
export const OBJECT_EXTENSION_DEFINITION_CAPABILITY_V010 =
  "enterprise.object-extension.definition" as const;

export const objectExtensionPackage: PackageManifestV010 = {
  contractVersion: "0.1.0",
  packageId: OBJECT_EXTENSION_PACKAGE_ID,
  displayName: "EVO Object Extension",
  version: "0.1.0",
  type: "APPLICATION",
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
    featureId: OBJECT_EXTENSION_FEATURE_ID,
    packageId: OBJECT_EXTENSION_PACKAGE_ID,
    version: "0.1.0",
    activationScope: "ENTERPRISE",
    defaultActivation: false,
    requiresCapabilities: [
      ENTERPRISE_RESOURCE_CAPABILITY_V010
    ],
    providesCapabilities: [
      OBJECT_EXTENSION_DEFINITION_CAPABILITY_V010
    ],
    contributions: []
  }]
};
