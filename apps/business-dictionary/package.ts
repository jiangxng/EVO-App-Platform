import type { PackageManifestV010 } from "../../contracts/package.js";
import { ENTERPRISE_RESOURCE_CAPABILITY_V010 } from "../../contracts/enterprise-resource.js";
import {
  BUSINESS_DICTIONARY_CAPABILITY_V010, BUSINESS_DICTIONARY_FEATURE_ID,
  BUSINESS_DICTIONARY_PACKAGE_ID
} from "./constants.js";
import { businessDictionaryCapabilityContributionsV010 } from "./capability-manifest.js";

export { BUSINESS_DICTIONARY_PACKAGE_ID, BUSINESS_DICTIONARY_FEATURE_ID } from "./constants.js";

export const businessDictionaryPackage: PackageManifestV010 = {
  contractVersion: "0.1.0",
  packageId: BUSINESS_DICTIONARY_PACKAGE_ID,
  displayName: "EVO Business Dictionary",
  description: "管理企业业务字典、稳定编码、批量字典值及受控发布。",
  displayNameTranslations: {
    en: "EVO Business Dictionary",
    "zh-CN": "EVO 业务字典",
    ja: "EVO 業務辞書",
    "zh-TW": "EVO 業務字典"
  },
  version: "0.1.0",
  type: "APPLICATION",
  publisher: { id: "evo", displayName: "EVO", trust: "FIRST_PARTY", source: "built-in" },
  compatibility: {
    appPlatform: ">=0.1.0 <0.2.0", eidos: "^1.3.0", pluginProtocol: "0.1.0"
  },
  features: [{
    contractVersion: "0.1.0",
    featureId: BUSINESS_DICTIONARY_FEATURE_ID,
    packageId: BUSINESS_DICTIONARY_PACKAGE_ID,
    version: "0.1.0",
    activationScope: "INSTALLATION",
    defaultActivation: true,
    requiresCapabilities: [ENTERPRISE_RESOURCE_CAPABILITY_V010],
    providesCapabilities: [BUSINESS_DICTIONARY_CAPABILITY_V010],
    contributions: [...businessDictionaryCapabilityContributionsV010]
  }]
};
