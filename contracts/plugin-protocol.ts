import type {
  EidosLocalizationBundleContributionV010,
  EidosSettingsContributionV010,
  EidosWorkbenchActivityContributionV010,
  ExperienceContributionV010,
  PackageManifestV010,
  PlatformServiceProviderContributionV010
} from "./package.js";

export const EVO_PLUGIN_PROTOCOL_VERSION = "0.1.0" as const;

export interface PluginProtocolIssueV010 {
  code: string;
  path: string;
  message: string;
}

export interface PluginProtocolValidationV010 {
  protocolVersion: typeof EVO_PLUGIN_PROTOCOL_VERSION;
  ok: boolean;
  issues: PluginProtocolIssueV010[];
}

const idPattern = /^[a-z0-9][a-z0-9._-]*$/;

function duplicateValues(values: readonly string[]): string[] {
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  for (const value of values) {
    if (seen.has(value)) duplicates.add(value);
    else seen.add(value);
  }
  return [...duplicates].sort();
}

function contributionContractVersion(
  contribution:
    | ExperienceContributionV010
    | EidosLocalizationBundleContributionV010
    | EidosWorkbenchActivityContributionV010
    | EidosSettingsContributionV010
    | PlatformServiceProviderContributionV010
): string {
  switch (contribution.kind) {
    case "eidos.experience":
      return contribution.manifest.contractVersion;
    case "eidos.localization-bundle":
      return contribution.bundle.contractVersion;
    case "eidos.workbench-activity":
      return contribution.activity.contractVersion;
    case "eidos.settings":
      return contribution.settings.contractVersion;
    case "platform.service-provider":
      return contribution.provider.contractVersion;
  }
}

export function validatePluginManifestV010(
  pkg: PackageManifestV010
): PluginProtocolValidationV010 {
  const issues: PluginProtocolIssueV010[] = [];

  const add = (code: string, path: string, message: string): void => {
    issues.push({ code, path, message });
  };

  if (pkg.contractVersion !== EVO_PLUGIN_PROTOCOL_VERSION) {
    add(
      "PLUGIN_PROTOCOL_VERSION_UNSUPPORTED",
      "contractVersion",
      `Expected ${EVO_PLUGIN_PROTOCOL_VERSION}, got '${pkg.contractVersion}'.`
    );
  }

  if (!idPattern.test(pkg.packageId)) {
    add(
      "PLUGIN_PACKAGE_ID_INVALID",
      "packageId",
      "packageId must be a stable lowercase identifier using letters, digits, '.', '_' or '-'."
    );
  }

  if (!pkg.displayName.trim()) {
    add("PLUGIN_DISPLAY_NAME_REQUIRED", "displayName", "displayName is required.");
  }

  if (!pkg.version.trim()) {
    add("PLUGIN_VERSION_REQUIRED", "version", "version is required.");
  }

  if (pkg.features.length === 0) {
    add("PLUGIN_FEATURE_REQUIRED", "features", "At least one Feature is required.");
  }

  const featureIds = pkg.features.map(feature => feature.featureId);
  for (const duplicate of duplicateValues(featureIds)) {
    add(
      "PLUGIN_FEATURE_ID_DUPLICATE",
      "features",
      `Duplicate Feature id '${duplicate}'.`
    );
  }

  for (const [featureIndex, feature] of pkg.features.entries()) {
    const featurePath = `features[${featureIndex}]`;

    if (feature.contractVersion !== EVO_PLUGIN_PROTOCOL_VERSION) {
      add(
        "PLUGIN_FEATURE_CONTRACT_VERSION_UNSUPPORTED",
        `${featurePath}.contractVersion`,
        `Expected ${EVO_PLUGIN_PROTOCOL_VERSION}, got '${feature.contractVersion}'.`
      );
    }

    if (!idPattern.test(feature.featureId)) {
      add(
        "PLUGIN_FEATURE_ID_INVALID",
        `${featurePath}.featureId`,
        "featureId must be a stable lowercase identifier."
      );
    }

    if (feature.packageId !== pkg.packageId) {
      add(
        "PLUGIN_FEATURE_PACKAGE_MISMATCH",
        `${featurePath}.packageId`,
        `Feature belongs to '${feature.packageId}', expected '${pkg.packageId}'.`
      );
    }

    if (!feature.version.trim()) {
      add(
        "PLUGIN_FEATURE_VERSION_REQUIRED",
        `${featurePath}.version`,
        "Feature version is required."
      );
    }

    for (const [field, values] of [
      ["requiresFeatures", feature.requiresFeatures ?? []],
      ["requiresCapabilities", feature.requiresCapabilities ?? []],
      ["providesCapabilities", feature.providesCapabilities ?? []]
    ] as const) {
      for (const duplicate of duplicateValues(values)) {
        add(
          "PLUGIN_DEPENDENCY_DUPLICATE",
          `${featurePath}.${field}`,
          `Duplicate entry '${duplicate}'.`
        );
      }
      for (const [index, value] of values.entries()) {
        if (!value.trim()) {
          add(
            "PLUGIN_DEPENDENCY_EMPTY",
            `${featurePath}.${field}[${index}]`,
            "Dependency/capability identifiers must not be empty."
          );
        }
      }
    }

    if ((feature.requiresFeatures ?? []).includes(feature.featureId)) {
      add(
        "PLUGIN_FEATURE_SELF_DEPENDENCY",
        `${featurePath}.requiresFeatures`,
        "A Feature must not require itself."
      );
    }

    for (const [contributionIndex, contribution] of (feature.contributions ?? []).entries()) {
      const contributionPath = `${featurePath}.contributions[${contributionIndex}]`;

      if (contributionContractVersion(contribution) !== EVO_PLUGIN_PROTOCOL_VERSION) {
        add(
          "PLUGIN_CONTRIBUTION_VERSION_UNSUPPORTED",
          contributionPath,
          `Contribution '${contribution.kind}' must use contractVersion ${EVO_PLUGIN_PROTOCOL_VERSION}.`
        );
      }

      if (contribution.kind === "eidos.experience") {
        const manifest = contribution.manifest;
        if (manifest.packageId !== pkg.packageId) {
          add(
            "PLUGIN_EXPERIENCE_PACKAGE_MISMATCH",
            `${contributionPath}.manifest.packageId`,
            "Experience packageId must equal owning Package id."
          );
        }
        if (manifest.featureId !== feature.featureId) {
          add(
            "PLUGIN_EXPERIENCE_FEATURE_MISMATCH",
            `${contributionPath}.manifest.featureId`,
            "Experience featureId must equal owning Feature id."
          );
        }
      }

      if (contribution.kind === "eidos.localization-bundle") {
        if (contribution.bundle.namespace !== pkg.packageId) {
          add(
            "PLUGIN_LOCALIZATION_NAMESPACE_MISMATCH",
            `${contributionPath}.bundle.namespace`,
            "Localization namespace must equal owning Package id."
          );
        }
      }

      if (contribution.kind === "eidos.workbench-activity") {
        const activity = contribution.activity;
        if (
          (activity.kind === "side-route" || activity.kind === "workspace-route")
          && !activity.route?.trim()
        ) {
          add(
            "PLUGIN_WORKBENCH_ROUTE_REQUIRED",
            `${contributionPath}.activity.route`,
            "Route-based Workbench Activities require a route."
          );
        }
        if (
          activity.localization
          && activity.localization.namespace !== pkg.packageId
        ) {
          add(
            "PLUGIN_WORKBENCH_LOCALIZATION_NAMESPACE_MISMATCH",
            `${contributionPath}.activity.localization.namespace`,
            "Workbench Activity localization namespace must equal owning Package id."
          );
        }
      }

      if (contribution.kind === "eidos.settings") {
        const settings = contribution.settings;
        if (settings.namespace !== pkg.packageId) {
          add(
            "PLUGIN_SETTINGS_NAMESPACE_MISMATCH",
            `${contributionPath}.settings.namespace`,
            "Settings namespace must equal owning Package id."
          );
        }
        for (const duplicate of duplicateValues(settings.properties.map(property => property.key))) {
          add(
            "PLUGIN_SETTING_KEY_DUPLICATE",
            `${contributionPath}.settings.properties`,
            `Duplicate setting key '${duplicate}'.`
          );
        }
      }

      if (contribution.kind === "platform.service-provider") {
        const provider = contribution.provider;
        if (!provider.providerId.trim()) {
          add(
            "PLUGIN_PROVIDER_ID_REQUIRED",
            `${contributionPath}.provider.providerId`,
            "providerId is required."
          );
        }
        if (!provider.capability.trim()) {
          add(
            "PLUGIN_PROVIDER_CAPABILITY_REQUIRED",
            `${contributionPath}.provider.capability`,
            "Provider capability is required."
          );
        }
        if (!provider.providerContract.trim() || !provider.providerContractVersion.trim()) {
          add(
            "PLUGIN_PROVIDER_CONTRACT_REQUIRED",
            `${contributionPath}.provider`,
            "Provider contract id and version are required."
          );
        }
      }
    }
  }

  return {
    protocolVersion: EVO_PLUGIN_PROTOCOL_VERSION,
    ok: issues.length === 0,
    issues
  };
}

export function assertPluginManifestV010(pkg: PackageManifestV010): void {
  const result = validatePluginManifestV010(pkg);
  if (result.ok) return;
  const summary = result.issues
    .map(issue => `${issue.code}@${issue.path}: ${issue.message}`)
    .join("; ");
  throw new Error(`PLUGIN_PROTOCOL_INVALID: ${summary}`);
}
