export type PackageType =
  | "FOUNDATION_RUNTIME"
  | "APPLICATION"
  | "RUNTIME_EXTENSION"
  | "EXPERIENCE"
  | "AGENT";

export type ActivationScope =
  | "SYSTEM"
  | "INSTALLATION"
  | "ENTERPRISE"
  | "COMPANY"
  | "WORKSPACE"
  | "USER";

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

export type FeatureContributionV010 = ExperienceContributionV010;

export interface FeatureManifestV010 {
  contractVersion: "0.1.0";
  featureId: string;
  packageId: string;
  version: string;
  activationScope: ActivationScope;
  defaultActivation?: boolean;
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
  sideEffectFree: true;
}

export interface InstalledPackageV010 {
  packageId: string;
  version: string;
  installedAt: string;
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
