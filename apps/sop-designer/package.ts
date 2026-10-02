import type { PackageManifestV010 } from "../../contracts/package.js";
import {
  ENTERPRISE_BUSINESS_DEFINITION_CAPABILITY_V010
} from "../../contracts/enterprise-business-definition.js";

export const SOP_DESIGNER_PACKAGE_ID = "evo-sop-designer";
export const SOP_DESIGNER_FEATURE_ID = "evo-sop-designer.default";
export const SOP_DESIGNER_CAPABILITY = "enterprise.sop.designer";

export const sopDesignerPackage: PackageManifestV010 = {
  contractVersion: "0.1.0",
  packageId: SOP_DESIGNER_PACKAGE_ID,
  displayName: "SOP Designer",
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
    featureId: SOP_DESIGNER_FEATURE_ID,
    packageId: SOP_DESIGNER_PACKAGE_ID,
    version: "0.1.0",
    activationScope: "INSTALLATION",
    defaultActivation: false,
    requiresCapabilities: [
      ENTERPRISE_BUSINESS_DEFINITION_CAPABILITY_V010,
      "authorization.check"
    ],
    providesCapabilities: [
      SOP_DESIGNER_CAPABILITY
    ]
  }]
};
