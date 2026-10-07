import type {
  PackageManifestV010
} from "../../contracts/package.js";
import {
  ENTERPRISE_RESOURCE_CAPABILITY_V010
} from "../../contracts/enterprise-resource.js";
import {
  dataImportCapabilityContributionsV010
} from "./capability-manifest.js";
import {
  DATA_IMPORT_CAPABILITY_V010,
  DATA_IMPORT_FEATURE_ID,
  DATA_IMPORT_PACKAGE_ID
} from "./constants.js";

export {
  DATA_IMPORT_CAPABILITY_V010,
  DATA_IMPORT_FEATURE_ID,
  DATA_IMPORT_PACKAGE_ID
} from "./constants.js";

export const dataImportPackage: PackageManifestV010 = {
  contractVersion: "0.1.0",
  packageId: DATA_IMPORT_PACKAGE_ID,
  displayName: "EVO Data Import",
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
    featureId: DATA_IMPORT_FEATURE_ID,
    packageId: DATA_IMPORT_PACKAGE_ID,
    version: "0.1.0",
    activationScope: "INSTALLATION",
    defaultActivation: true,
    requiresCapabilities: [
      ENTERPRISE_RESOURCE_CAPABILITY_V010
    ],
    providesCapabilities: [
      DATA_IMPORT_CAPABILITY_V010
    ],
    contributions: [
      ...dataImportCapabilityContributionsV010
    ]
  }]
};
