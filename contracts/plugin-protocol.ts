import type {
  EidosLocalizationBundleContributionV010,
  EidosSettingsContributionV010,
  EidosWorkbenchActivityContributionV010,
  EidosWorkbenchHomeItemContributionV010,
  ExperienceContributionV010,
  PackageManifestV010,
  PlatformCapabilityOperationContributionV010,
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
    | EidosWorkbenchHomeItemContributionV010
    | EidosSettingsContributionV010
    | PlatformServiceProviderContributionV010
    | PlatformCapabilityOperationContributionV010
): string {
  switch (contribution.kind) {
    case "eidos.experience":
      return contribution.manifest.contractVersion;
    case "eidos.localization-bundle":
      return contribution.bundle.contractVersion;
    case "eidos.workbench-activity":
      return contribution.activity.contractVersion;
    case "eidos.workbench-home-item":
      return contribution.item.contractVersion;
    case "eidos.settings":
      return contribution.settings.contractVersion;
    case "platform.service-provider":
      return contribution.provider.contractVersion;
    case "platform.capability-operation":
      return contribution.operation.contractVersion;
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

  if (pkg.compatibility) {
    for (const [field, value] of Object.entries(pkg.compatibility)) {
      if (typeof value !== "string" || !value.trim()) {
        add(
          "PLUGIN_COMPATIBILITY_RANGE_INVALID",
          `compatibility.${field}`,
          "Compatibility ranges must be non-empty strings."
        );
      }
    }
  }

  if (pkg.publisher && !pkg.publisher.id.trim()) {
    add("PLUGIN_PUBLISHER_ID_REQUIRED", "publisher.id", "Publisher id is required.");
  }

  const secretKeys = pkg.secrets?.map(secret => secret.key) ?? [];
  for (const duplicate of duplicateValues(secretKeys)) {
    add("PLUGIN_SECRET_KEY_DUPLICATE", "secrets", `Duplicate Secret key '${duplicate}'.`);
  }
  for (const [index, secret] of (pkg.secrets ?? []).entries()) {
    if (!/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(secret.key) || !secret.label.trim()) {
      add(
        "PLUGIN_SECRET_DECLARATION_INVALID",
        `secrets[${index}]`,
        "Secret key and human-readable label are required; values never belong in the manifest."
      );
    }
  }

  const permissionIds = pkg.permissions?.map(permission => permission.id) ?? [];
  for (const duplicate of duplicateValues(permissionIds)) {
    add("PLUGIN_PERMISSION_DUPLICATE", "permissions", `Duplicate permission '${duplicate}'.`);
  }
  for (const [index, permission] of (pkg.permissions ?? []).entries()) {
    if (!permission.id.trim() || !permission.label.trim()) {
      add(
        "PLUGIN_PERMISSION_INVALID",
        `permissions[${index}]`,
        "Permission id and label are required."
      );
    }
    if (permission.risk === "HIGH" && !permission.reason?.trim()) {
      add(
        "PLUGIN_HIGH_RISK_PERMISSION_REASON_REQUIRED",
        `permissions[${index}].reason`,
        "High-risk permissions require an explicit reason."
      );
    }
  }

  if (pkg.integrity) {
    if (pkg.integrity.format !== "EVO-SIGNATURE-v0.1") {
      add(
        "PLUGIN_INTEGRITY_FORMAT_UNSUPPORTED",
        "integrity.format",
        "Expected EVO-SIGNATURE-v0.1."
      );
    }
    if (!pkg.integrity.keyId.trim()) {
      add("PLUGIN_INTEGRITY_KEY_ID_REQUIRED", "integrity.keyId", "Signing key id is required.");
    }
    if (!/^[A-Za-z0-9+/]+={0,2}$/.test(pkg.integrity.signature) || pkg.integrity.signature.length < 32) {
      add(
        "PLUGIN_INTEGRITY_SIGNATURE_INVALID",
        "integrity.signature",
        "Ed25519 signature must be non-empty base64."
      );
    }
    if (
      pkg.integrity.artifact
      && !/^sha256:[0-9a-f]{64}$/.test(pkg.integrity.artifact.digest)
    ) {
      add(
        "PLUGIN_INTEGRITY_DIGEST_INVALID",
        "integrity.artifact.digest",
        "Artifact digest must use lowercase sha256:<64 hex> format."
      );
    }
    if (
      pkg.integrity.provenance?.type === "SIGSTORE_BUNDLE"
      && (
        !pkg.integrity.provenance.sigstore
        || !pkg.integrity.provenance.sigstore.bundle
        || typeof pkg.integrity.provenance.sigstore.bundle !== "object"
        || Array.isArray(pkg.integrity.provenance.sigstore.bundle)
      )
    ) {
      add(
        "PLUGIN_SIGSTORE_BUNDLE_REQUIRED",
        "integrity.provenance.sigstore.bundle",
        "SIGSTORE_BUNDLE provenance requires a serialized Sigstore bundle object."
      );
    }
  }

  if (pkg.runtime) {
    if (pkg.runtime.kind === "PROCESS" || pkg.runtime.kind === "REMOTE") {
      if (!pkg.integrity) {
        add(
          "PLUGIN_EXECUTABLE_INTEGRITY_REQUIRED",
          "integrity",
          "Executable PROCESS/REMOTE runtime packages require a signed integrity envelope."
        );
      } else if (
        pkg.runtime.kind === "PROCESS"
        && pkg.integrity.artifact?.scope !== "PROCESS_ENTRYPOINT"
      ) {
        add(
          "PLUGIN_PROCESS_ARTIFACT_DIGEST_REQUIRED",
          "integrity.artifact",
          "PROCESS runtime packages require a PROCESS_ENTRYPOINT artifact digest."
        );
      }
    }

    if (pkg.runtime.kind === "REMOTE") {
      const remote = pkg.runtime.remote;
      if (!remote) {
        add(
          "PLUGIN_REMOTE_RUNTIME_REQUIRED",
          "runtime.remote",
          "REMOTE runtime packages require a remote runtime declaration."
        );
      } else {
        if (remote.protocol !== "EVO-REMOTE-RUNTIME-v0.1") {
          add(
            "PLUGIN_REMOTE_PROTOCOL_UNSUPPORTED",
            "runtime.remote.protocol",
            "Expected EVO-REMOTE-RUNTIME-v0.1."
          );
        }
        if (remote.hostAccess !== "NONE") {
          add(
            "PLUGIN_REMOTE_HOST_ACCESS_UNSUPPORTED",
            "runtime.remote.hostAccess",
            "REMOTE P0 does not expose Host capability callbacks."
          );
        }
        if (remote.auth.scheme !== "HOST_BEARER" || !remote.auth.audience.trim()) {
          add(
            "PLUGIN_REMOTE_AUTH_INVALID",
            "runtime.remote.auth",
            "REMOTE P0 requires HOST_BEARER auth with a non-empty audience."
          );
        }
        try {
          const endpoint = new URL(remote.endpoint);
          if (endpoint.protocol !== "https:") {
            add(
              "PLUGIN_REMOTE_HTTPS_REQUIRED",
              "runtime.remote.endpoint",
              "REMOTE runtime endpoint must use HTTPS."
            );
          }
          if (endpoint.username || endpoint.password || endpoint.hash) {
            add(
              "PLUGIN_REMOTE_ENDPOINT_INVALID",
              "runtime.remote.endpoint",
              "REMOTE endpoint must not embed credentials or fragments."
            );
          }
        } catch {
          add(
            "PLUGIN_REMOTE_ENDPOINT_INVALID",
            "runtime.remote.endpoint",
            "REMOTE runtime endpoint must be an absolute HTTPS URL."
          );
        }
      }
      if (pkg.storage || (pkg.events?.publish?.length ?? 0) > 0 || (pkg.events?.subscribe?.length ?? 0) > 0) {
        add(
          "PLUGIN_REMOTE_HOST_CAPABILITY_UNSUPPORTED",
          "runtime.remote.hostAccess",
          "REMOTE P0 cannot directly use Host storage/events; hostAccess is NONE."
        );
      }
    }

    const validPair = (
      (pkg.runtime.kind === "DECLARATIVE" && pkg.runtime.isolation === "HOST")
      || (pkg.runtime.kind === "WORKER" && pkg.runtime.isolation === "WORKER")
      || (pkg.runtime.kind === "PROCESS" && pkg.runtime.isolation === "PROCESS")
      || (pkg.runtime.kind === "REMOTE" && pkg.runtime.isolation === "REMOTE")
    );
    if (!validPair) {
      add(
        "PLUGIN_RUNTIME_ISOLATION_INVALID",
        "runtime",
        "Runtime kind and isolation must use DECLARATIVE/HOST, WORKER/WORKER, PROCESS/PROCESS or REMOTE/REMOTE."
      );
    }
    if (
      (pkg.runtime.kind === "PROCESS" || pkg.runtime.kind === "WORKER")
      && !pkg.runtime.entrypoint?.trim()
    ) {
      add(
        "PLUGIN_RUNTIME_ENTRYPOINT_REQUIRED",
        "runtime.entrypoint",
        "PROCESS/WORKER runtimes require an entrypoint."
      );
    }
    if (
      pkg.runtime.limits?.invocationTimeoutMs !== undefined
      && (
        !Number.isInteger(pkg.runtime.limits.invocationTimeoutMs)
        || pkg.runtime.limits.invocationTimeoutMs < 50
        || pkg.runtime.limits.invocationTimeoutMs > 300000
      )
    ) {
      add(
        "PLUGIN_RUNTIME_TIMEOUT_INVALID",
        "runtime.limits.invocationTimeoutMs",
        "Invocation timeout must be an integer between 50 and 300000 ms."
      );
    }
    if (
      pkg.runtime.limits?.memoryMb !== undefined
      && (
        !Number.isInteger(pkg.runtime.limits.memoryMb)
        || pkg.runtime.limits.memoryMb < 16
        || pkg.runtime.limits.memoryMb > 2048
      )
    ) {
      add(
        "PLUGIN_RUNTIME_MEMORY_INVALID",
        "runtime.limits.memoryMb",
        "Process memory budget must be an integer between 16 and 2048 MB."
      );
    }
  }

  if ((pkg.secrets?.length ?? 0) > 0) {
    const requiresSecretsCapability = pkg.features.some(feature =>
      (feature.requiresCapabilities ?? []).includes("secrets.resolve")
    );
    if (!requiresSecretsCapability) {
      add(
        "PLUGIN_SECRET_CAPABILITY_REQUIRED",
        "features.requiresCapabilities",
        "A Package declaring Secrets must explicitly require the secrets.resolve capability."
      );
    }
  }

  if (pkg.storage?.quotaBytes !== undefined && pkg.storage.quotaBytes <= 0) {
    add("PLUGIN_STORAGE_QUOTA_INVALID", "storage.quotaBytes", "Storage quota must be positive.");
  }

  for (const topic of pkg.events?.publish ?? []) {
    if (!topic.startsWith(`${pkg.packageId}.`)) {
      add(
        "PLUGIN_EVENT_TOPIC_NOT_OWNED",
        "events.publish",
        `Published event '${topic}' must be namespaced by Package id '${pkg.packageId}'.`
      );
    }
  }

  const featureIds = pkg.features.map(feature => feature.featureId);
  for (const duplicate of duplicateValues(featureIds)) {
    add(
      "PLUGIN_FEATURE_ID_DUPLICATE",
      "features",
      `Duplicate Feature id '${duplicate}'.`
    );
  }

  const packageOperationIds = pkg.features.flatMap(feature =>
    (feature.contributions ?? [])
      .filter((item): item is PlatformCapabilityOperationContributionV010 =>
        item.kind === "platform.capability-operation"
      )
      .map(item => item.operation.operationId)
  );
  for (const duplicate of duplicateValues(packageOperationIds)) {
    add(
      "PLUGIN_CAPABILITY_OPERATION_ID_DUPLICATE",
      "features[].contributions",
      `Duplicate Capability Operation id '${duplicate}' within Package.`
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

    if (
      feature.activation?.mode === "ON_DEMAND"
      && (feature.activation.events?.length ?? 0) === 0
    ) {
      add(
        "PLUGIN_ACTIVATION_EVENT_REQUIRED",
        `${featurePath}.activation.events`,
        "ON_DEMAND activation requires at least one activation event."
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

      if (contribution.kind === "platform.capability-operation") {
        const operation = contribution.operation;
        if (!idPattern.test(operation.operationId)) {
          add(
            "PLUGIN_CAPABILITY_OPERATION_ID_INVALID",
            `${contributionPath}.operation.operationId`,
            "operationId must be a stable lowercase identifier using letters, digits, '.', '_' or '-'."
          );
        }
        if (!idPattern.test(operation.capability)) {
          add(
            "PLUGIN_CAPABILITY_OPERATION_CAPABILITY_INVALID",
            `${contributionPath}.operation.capability`,
            "Capability Operation capability must be a stable lowercase capability identifier."
          );
        }
        if (!(feature.providesCapabilities ?? []).includes(operation.capability)) {
          add(
            "PLUGIN_CAPABILITY_OPERATION_CAPABILITY_NOT_PROVIDED",
            `${contributionPath}.operation.capability`,
            `Feature must provide Capability '${operation.capability}' before contributing operations for it.`
          );
        }
        if (
          operation.operationId !== operation.capability
          && !operation.operationId.startsWith(operation.capability + ".")
        ) {
          add(
            "PLUGIN_CAPABILITY_OPERATION_ID_NAMESPACE_MISMATCH",
            `${contributionPath}.operation.operationId`,
            "operationId must equal the Capability id or begin with '<capability>.' so public operation identity remains semantically owned."
          );
        }
        if (
          !operation.operationVersion.trim()
          || !operation.title.trim()
          || !operation.description.trim()
        ) {
          add(
            "PLUGIN_CAPABILITY_OPERATION_METADATA_REQUIRED",
            `${contributionPath}.operation`,
            "operationVersion, title and description are required."
          );
        }
        const validDataScopes = [
          "SYSTEM",
          "INSTALLATION",
          "ENTERPRISE",
          "COMPANY",
          "WORKSPACE",
          "USER"
        ];
        if (!validDataScopes.includes(operation.dataScope)) {
          add(
            "PLUGIN_CAPABILITY_OPERATION_DATA_SCOPE_INVALID",
            `${contributionPath}.operation.dataScope`,
            "Capability Operation dataScope must use a supported platform scope."
          );
        }

        const authorization = operation.authorization;
        if (!authorization) {
          add(
            "PLUGIN_CAPABILITY_OPERATION_AUTHORIZATION_REQUIRED",
            `${contributionPath}.operation.authorization`,
            "Capability Operation authorization metadata is required."
          );
        } else {
          if (!idPattern.test(authorization.action)) {
            add(
              "PLUGIN_CAPABILITY_OPERATION_AUTH_ACTION_INVALID",
              `${contributionPath}.operation.authorization.action`,
              "Capability Operation authorization action must be a stable lowercase identifier."
            );
          }
          if (!authorization.resource || !idPattern.test(authorization.resource.type)) {
            add(
              "PLUGIN_CAPABILITY_OPERATION_AUTH_RESOURCE_INVALID",
              `${contributionPath}.operation.authorization.resource.type`,
              "Capability Operation authorization resource type must be a stable lowercase identifier."
            );
          } else {
            if (
              authorization.resource.idSource === "INPUT"
              && !authorization.resource.inputKey?.trim()
            ) {
              add(
                "PLUGIN_CAPABILITY_OPERATION_AUTH_INPUT_KEY_REQUIRED",
                `${contributionPath}.operation.authorization.resource.inputKey`,
                "INPUT resource idSource requires inputKey."
              );
            }
            if (
              authorization.resource.idSource !== "INPUT"
              && authorization.resource.inputKey !== undefined
            ) {
              add(
                "PLUGIN_CAPABILITY_OPERATION_AUTH_INPUT_KEY_FORBIDDEN",
                `${contributionPath}.operation.authorization.resource.inputKey`,
                "inputKey is valid only when resource idSource is INPUT."
              );
            }
            if (
              authorization.resource.idSource === "DATA_SCOPE"
              && (
                operation.dataScope === "SYSTEM"
                || operation.dataScope === "INSTALLATION"
              )
            ) {
              add(
                "PLUGIN_CAPABILITY_OPERATION_AUTH_DATA_SCOPE_ID_UNAVAILABLE",
                `${contributionPath}.operation.authorization.resource.idSource`,
                "SYSTEM/INSTALLATION operations do not have a request-scoped data id; use NONE or INPUT."
              );
            }
          }
        }
        if (!operation.binding.commandCode.trim() || !operation.binding.inputVersion.trim()) {
          add(
            "PLUGIN_CAPABILITY_OPERATION_BINDING_REQUIRED",
            `${contributionPath}.operation.binding`,
            "ACTION_HOST binding requires commandCode and inputVersion."
          );
        }
        if (operation.exposure.length === 0) {
          add(
            "PLUGIN_CAPABILITY_OPERATION_EXPOSURE_REQUIRED",
            `${contributionPath}.operation.exposure`,
            "At least one explicit exposure audience is required."
          );
        }
        for (const duplicate of duplicateValues(operation.exposure)) {
          add(
            "PLUGIN_CAPABILITY_OPERATION_EXPOSURE_DUPLICATE",
            `${contributionPath}.operation.exposure`,
            `Duplicate exposure audience '${duplicate}'.`
          );
        }
        if (operation.effect === "WRITE" && !operation.writeSafety) {
          add(
            "PLUGIN_CAPABILITY_OPERATION_WRITE_SAFETY_REQUIRED",
            `${contributionPath}.operation.writeSafety`,
            "WRITE operations require Host-owned idempotency and durable receipt semantics."
          );
        }
        if (operation.effect !== "WRITE" && operation.writeSafety) {
          add(
            "PLUGIN_CAPABILITY_OPERATION_WRITE_SAFETY_FORBIDDEN",
            `${contributionPath}.operation.writeSafety`,
            "READ/PLAN operations must not declare WRITE safety metadata."
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
