import type { PackageManifestV010 } from "../../contracts/package.js";
import {
  ENTERPRISE_RESOURCE_CAPABILITY_V010
} from "../../contracts/enterprise-resource.js";
import {
  RESPONSIBILITY_CAPABILITY_V010,
  RESPONSIBILITY_FEATURE_ID,
  RESPONSIBILITY_PACKAGE_ID
} from "./constants.js";

export {
  RESPONSIBILITY_CAPABILITY_V010,
  RESPONSIBILITY_FEATURE_ID,
  RESPONSIBILITY_PACKAGE_ID
} from "./constants.js";

export const responsibilityPackage: PackageManifestV010 = {
  contractVersion: "0.1.0",
  packageId: RESPONSIBILITY_PACKAGE_ID,
  displayName: "EVO Responsibility",
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
    featureId: RESPONSIBILITY_FEATURE_ID,
    packageId: RESPONSIBILITY_PACKAGE_ID,
    version: "0.1.0",
    activationScope: "INSTALLATION",
    defaultActivation: true,
    requiresCapabilities: [
      ENTERPRISE_RESOURCE_CAPABILITY_V010
    ],
    providesCapabilities: [
      RESPONSIBILITY_CAPABILITY_V010
    ]
  }]
};
