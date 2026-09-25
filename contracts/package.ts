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

export interface PluginRuntimeV010 {
  kind: "DECLARATIVE" | "WORKER" | "REMOTE";
  isolation: "HOST" | "WORKER" | "REMOTE";
  entrypoint?: string;
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
    routes: Array<{ id: string; path: string; pageId: string }>;
    navigation?: Array<{ id: string; label: string; route: string; order?: number; parentId?: string }>;
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
  | EidosSettingsContributionV010
  | PlatformServiceProviderContributionV010;

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

export interface PackageManifestV010 {
  contractVersion: "0.1.0";
  packageId: string;
  displayName: string;
  version: string;
  type: PackageType;
  compatibility?: PluginCompatibilityV010;
  publisher?: PluginPublisherV010;
  permissions?: PluginPermissionV010[];
  runtime?: PluginRuntimeV010;
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
