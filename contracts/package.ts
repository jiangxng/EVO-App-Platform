export type PackageType =
  | "FOUNDATION_RUNTIME"
  | "APPLICATION"
  | "RUNTIME_EXTENSION"
  | "PLATFORM_PROVIDER"
  | "EXPERIENCE"
  | "AGENT";

export type ActivationScope =
  | "SYSTEM"
  | "INSTALLATION"
  | "ENTERPRISE"
  | "COMPANY"
  | "WORKSPACE"
  | "USER";

export type PluginTrustLevelV010 = "FIRST_PARTY" | "VERIFIED" | "UNVERIFIED";
export type PluginPermissionRiskV010 = "LOW" | "MEDIUM" | "HIGH";

export interface PluginPermissionV010 {
  id: string;
  label: string;
  risk: PluginPermissionRiskV010;
  required?: boolean;
  reason?: string;
}

export interface PluginCompatibilityV010 {
  appPlatform?: string;
  eidos?: string;
  pluginProtocol?: string;
}

export interface PluginPublisherV010 {
  id: string;
  displayName?: string;
  trust?: PluginTrustLevelV010;
  source?: string;
}

export interface PluginArtifactIntegrityV010 {
  scope: "PROCESS_ENTRYPOINT" | "PACKAGE_BUNDLE";
  digest: string;
}

export interface SlsaProvenanceStatementV010 {
  _type: "https://in-toto.io/Statement/v1";
  subject: Array<{
    name: string;
    digest: { sha256: string };
  }>;
  predicateType: "https://slsa.dev/provenance/v1";
  predicate: {
    buildDefinition: {
      buildType: string;
      externalParameters: Record<string, unknown>;
      internalParameters?: Record<string, unknown>;
      resolvedDependencies?: unknown[];
    };
    runDetails: {
      builder: { id: string };
      metadata?: Record<string, unknown>;
      byproducts?: unknown[];
    };
  };
}

export interface PluginSigstoreBundleEvidenceV010 {
  bundle: Record<string, unknown>;
}

export interface PluginProvenanceV010 {
  type: "INTERNAL_CI" | "SIGSTORE_BUNDLE" | "OIDC_CI" | "SLSA_PROVENANCE";
  reference?: string;
  statement?: SlsaProvenanceStatementV010;
  sigstore?: PluginSigstoreBundleEvidenceV010;
}

export interface PluginIntegrityV010 {
  format: "EVO-SIGNATURE-v0.1";
  algorithm: "Ed25519";
  keyId: string;
  artifact?: PluginArtifactIntegrityV010;
  provenance?: PluginProvenanceV010;
  signature: string;
}

export interface PluginRemoteRuntimeV010 {
  protocol: "EVO-REMOTE-RUNTIME-v0.1";
  endpoint: string;
  hostAccess: "NONE";
  auth: {
    scheme: "HOST_BEARER";
    audience: string;
  };
}

export interface PluginRuntimeV010 {
  kind: "DECLARATIVE" | "WORKER" | "PROCESS" | "REMOTE";
  isolation: "HOST" | "WORKER" | "PROCESS" | "REMOTE";
  entrypoint?: string;
  remote?: PluginRemoteRuntimeV010;
  limits?: {
    invocationTimeoutMs?: number;
    memoryMb?: number;
  };
}

export interface PluginStorageDeclarationV010 {
  scope: "PACKAGE";
  quotaBytes?: number;
}

export interface PluginEventsDeclarationV010 {
  publish?: string[];
  subscribe?: string[];
}

export interface FeatureActivationV010 {
  mode: "EAGER" | "ON_DEMAND";
  events?: string[];
}

export interface ExperienceContributionV010 {
  kind: "eidos.experience";
  manifest: {
    contractVersion: "0.1.0";
    experienceId: string;
    packageId: string;
    featureId: string;
    defaultRoute?: string;
    pages: Array<{ id: string; title?: string; source: string }>;
    routes: Array<{
      id: string;
      path: string;
      pageId: string;
      semanticId?: string;
      surfaceId?: string;
    }>;
    navigation?: Array<{
      id: string;
      label: string;
      route: string;
      order?: number;
      parentId?: string;
      surfaceIds?: string[];
    }>;
    surfaces?: Array<{
      id: string;
      target:
        | "DESKTOP_WORKBENCH"
        | "MOBILE_TASK"
        | "MOBILE_READ"
        | "TABLET_WORKBENCH";
      support:
        | "FULL"
        | "TASK_FOCUSED"
        | "READ_ONLY"
        | "UNSUPPORTED";
      entryRoute?: string;
      fallbackSurfaceId?: string;
    }>;
  };
}

export interface EidosLocalizationBundleContributionV010 {
  kind: "eidos.localization-bundle";
  bundle: {
    contractVersion: "0.1.0";
    namespace: string;
    locale: string;
    messages: Record<string, string>;
  };
}

export interface EidosWorkbenchActivityContributionV010 {
  kind: "eidos.workbench-activity";
  activity: {
    contractVersion: "0.1.0";
    id: string;
    title: string;
    icon: string;
    kind: "navigation" | "side-route" | "workspace-route" | "workspace-focus";
    route?: string;
    order?: number;
    placement?: "primary" | "secondary";
    localization?: {
      namespace: string;
      key: string;
    };
  };
}

export interface EidosWorkbenchHomeItemContributionV010 {
  kind: "eidos.workbench-home-item";
  item: {
    contractVersion: "0.1.0";
    id: string;
    title: string;
    description?: string;
    section:
      | "MY_WORK"
      | "MY_BUSINESS_OBJECTS"
      | "OPERATIONAL_PROJECTIONS"
      | "FIXED_CAPABILITIES"
      | "PERSONAL_AGENT";
    route: string;
    capabilityOperationId?: string;
    order?: number;
    localization?: {
      namespace: string;
      titleKey: string;
      descriptionKey?: string;
    };
  };
}


export type SettingValueV010 = string | number | boolean;

export interface EidosSettingsContributionV010 {
  kind: "eidos.settings";
  settings: {
    contractVersion: "0.1.0";
    namespace: string;
    title: string;
    description?: string;
    properties: Array<{
      key: string;
      label: string;
      description?: string;
      type: "string" | "number" | "boolean" | "select";
      defaultValue: SettingValueV010;
      options?: Array<{ label: string; value: SettingValueV010 }>;
      scope?: ActivationScope;
      readOnly?: boolean;
    }>;
    advancedRoute?: string;
  };
}

export type CapabilityOperationEffectV010 = "READ" | "PLAN" | "WRITE";

export type CapabilityOperationExposureV010 =
  | "HUMAN"
  | "PERSONAL_AGENT"
  | "EXTERNAL_AGENT"
  | "AUTOMATION";

export interface PlatformCapabilityOperationContributionV010 {
  kind: "platform.capability-operation";
  operation: {
    contractVersion: "0.1.0";
    operationId: string;
    capability: string;
    operationVersion: string;
    title: string;
    description: string;
    effect: CapabilityOperationEffectV010;
    dataScope: ActivationScope;
    authorization: {
      action: string;
      resource: {
        type: string;
        idSource: "NONE" | "DATA_SCOPE" | "INPUT";
        inputKey?: string;
      };
    };
    inputSchema: Record<string, unknown>;
    outputSchema: Record<string, unknown>;
    binding: {
      type: "ACTION_HOST";
      commandCode: string;
      inputVersion: string;
    };
    exposure: CapabilityOperationExposureV010[];
    writeSafety?: {
      idempotency: "HOST_REQUIRED";
      receipt: "HOST_REQUIRED";
    };
  };
}

export interface PlatformDataImportTargetContributionV010 {
  kind: "platform.data-import-target";
  target: {
    contractVersion: "0.1.0";
    targetId: string;
    objectType: string;
    label: {
      default: string;
      translations?: Record<string, string>;
    };
    binding: {
      type: "HOST_FACTORY";
      ref: string;
    };
  };
}

export interface PlatformServiceProviderContributionV010 {
  kind: "platform.service-provider";
  provider: {
    contractVersion: "0.1.0";
    providerId: string;
    capability: string;
    providerContract: string;
    providerContractVersion: string;
    binding: {
      type: "HTTP" | "ACTION_HOST" | "QUERY_HOST" | "DECLARATIVE" | "IN_PROCESS";
      ref: string;
    };
    health?: {
      type: "HTTP";
      ref: string;
    };
    metadata?: Record<string, string | number | boolean | null>;
  };
}

export type FeatureContributionV010 =
  | ExperienceContributionV010
  | EidosLocalizationBundleContributionV010
  | EidosWorkbenchActivityContributionV010
  | EidosWorkbenchHomeItemContributionV010
  | EidosSettingsContributionV010
  | PlatformDataImportTargetContributionV010
  | PlatformServiceProviderContributionV010
  | PlatformCapabilityOperationContributionV010;

export interface FeatureManifestV010 {
  contractVersion: "0.1.0";
  featureId: string;
  packageId: string;
  version: string;
  activationScope: ActivationScope;
  defaultActivation?: boolean;
  activation?: FeatureActivationV010;
  requiresFeatures?: string[];
  requiresCapabilities?: string[];
  providesCapabilities?: string[];
  contributions?: FeatureContributionV010[];
}

export interface PackageSecretDeclarationV010 {
  key: string;
  label: string;
  description?: string;
  scope: ActivationScope;
  required?: boolean;
}

export interface PackageManifestV010 {
  contractVersion: "0.1.0";
  packageId: string;
  displayName: string;
  version: string;
  type: PackageType;
  compatibility?: PluginCompatibilityV010;
  publisher?: PluginPublisherV010;
  permissions?: PluginPermissionV010[];
  secrets?: PackageSecretDeclarationV010[];
  runtime?: PluginRuntimeV010;
  integrity?: PluginIntegrityV010;
  storage?: PluginStorageDeclarationV010;
  events?: PluginEventsDeclarationV010;
  features: FeatureManifestV010[];
}

export interface CatalogEntryV010 {
  package: PackageManifestV010;
}

export interface InstallPlanV010 {
  contractVersion: "0.1.0";
  packageId: string;
  packageVersion: string;
  installPackages: string[];
  activateFeatures: string[];
  missingCapabilities: string[];
  blockers: Array<{ code: string; message: string }>;
  compatibility?: {
    state: "COMPATIBLE" | "INCOMPATIBLE" | "UNKNOWN";
    messages: string[];
  };
  requestedPermissions?: PluginPermissionV010[];
  requiresTrustApproval?: boolean;
  requiresUserApproval?: boolean;
  sideEffectFree: true;
}

export interface InstalledPackageV010 {
  packageId: string;
  version: string;
  installedAt: string;
  trustApproved?: boolean;
  grantedPermissions?: string[];
}

export interface ActivatedFeatureV010 {
  featureId: string;
  packageId: string;
  version: string;
  activatedAt: string;
}

export interface PlatformSnapshotV010 {
  contractVersion: "0.1.0";
  installedPackages: InstalledPackageV010[];
  activeFeatures: ActivatedFeatureV010[];
  effectiveCapabilities: string[];
}

export interface PackageLifecyclePlanV010 {
  contractVersion: "0.1.0";
  operation: "DISABLE" | "UNINSTALL";
  packageId: string;
  deactivateFeatures: string[];
  uninstallPackages: string[];
  blockers: Array<{ code: string; message: string }>;
  sideEffectFree: true;
}

export interface PackageUpgradePlanV010 {
  contractVersion: "0.1.0";
  operation: "UPGRADE";
  packageId: string;
  fromVersion: string;
  toVersion: string;
  updateFeatures: Array<{
    featureId: string;
    fromVersion: string;
    toVersion: string;
  }>;
  blockers: Array<{ code: string; message: string }>;
  requestedPermissions?: PluginPermissionV010[];
  requiresTrustApproval?: boolean;
  requiresUserApproval?: boolean;
  sideEffectFree: true;
}
