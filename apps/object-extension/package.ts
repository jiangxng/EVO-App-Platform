import type { PackageManifestV010 } from "../../contracts/package.js";
import {
  ENTERPRISE_RESOURCE_CAPABILITY_V010
} from "../../contracts/enterprise-resource.js";
import {
  objectExtensionCapabilityContributionsV010,
  objectExtensionModelCapabilityContributionsV010
} from "./capability-manifest.js";
import {
  OBJECT_EXTENSION_IMPORT_PAGE_ID_V010,
  OBJECT_EXTENSION_IMPORT_PAGE_SOURCE_V010,
  OBJECT_EXTENSION_IMPORT_ROUTE_V010
} from "./constants.js";
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
  description: "为基础对象配置企业自定义字段，满足不同业务的信息需求。",
  displayNameTranslations: {
    "en": "EVO Object Extension",
    "zh-CN": "EVO 对象扩展",
    "ja": "EVO オブジェクト拡張",
    "zh-TW": "EVO 物件擴充"
  },
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
      ...objectExtensionCapabilityContributionsV010,
      ...objectExtensionModelCapabilityContributionsV010,
      {
        kind:"eidos.experience",
        manifest:{
          contractVersion:"0.1.0",
          experienceId:OBJECT_EXTENSION_PACKAGE_ID,
          packageId:OBJECT_EXTENSION_PACKAGE_ID,
          featureId:OBJECT_EXTENSION_FEATURE_ID,
          defaultRoute:OBJECT_EXTENSION_IMPORT_ROUTE_V010,
          pages:[{id:OBJECT_EXTENSION_IMPORT_PAGE_ID_V010,title:"Create Extension Field",source:OBJECT_EXTENSION_IMPORT_PAGE_SOURCE_V010}],
          routes:[{id:OBJECT_EXTENSION_IMPORT_PAGE_ID_V010,path:OBJECT_EXTENSION_IMPORT_ROUTE_V010,pageId:OBJECT_EXTENSION_IMPORT_PAGE_ID_V010}],
          navigation:[]
        }
      }
    ]
  }]
};
