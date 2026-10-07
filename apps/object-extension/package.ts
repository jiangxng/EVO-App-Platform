import type { PackageManifestV010 } from "../../contracts/package.js";
import {
  ENTERPRISE_RESOURCE_CAPABILITY_V010
} from "../../contracts/enterprise-resource.js";
import {
  objectExtensionCapabilityContributionsV010
} from "./capability-manifest.js";
import {
  OBJECT_EXTENSION_DEFINITION_CAPABILITY_V010,
  OBJECT_EXTENSION_FEATURE_ID,
  OBJECT_EXTENSION_PACKAGE_ID
} from "./constants.js";

export {
  OBJECT_EXTENSION_DEFINITION_CAPABILITY_V010,
  OBJECT_EXTENSION_FEATURE_ID,
  OBJECT_EXTENSION_PACKAGE_ID
} from "./constants.js";

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
    activationScope: "INSTALLATION",
    defaultActivation: true,
    requiresCapabilities: [
      ENTERPRISE_RESOURCE_CAPABILITY_V010
    ],
    providesCapabilities: [
      OBJECT_EXTENSION_DEFINITION_CAPABILITY_V010
    ],
    contributions: [
      ...objectExtensionCapabilityContributionsV010
    ]
  }]
};
