import type {
  FeatureManifestV010,
  InstallPlanV010,
  PackageLifecyclePlanV010,
  PackageManifestV010,
  PlatformSnapshotV010,
  PlatformCapabilityOperationContributionV010,
  PlatformServiceProviderContributionV010,
  EidosLocalizationBundleContributionV010,
  EidosWorkbenchActivityContributionV010,
  EidosWorkbenchHomeItemContributionV010,
  EidosSettingsContributionV010
} from "../contracts/package.js";
import type { PackageCatalog } from "../catalog/catalog.js";
import type { LifecycleStore } from "./store.js";
import { evaluatePackageCompatibility } from "./compatibility.js";
import {
  inspectPluginRuntimeV010,
  type PluginRuntimeStatusV010
} from "./plugin-runtime-host.js";

export interface InstallAuthorizationV010 {
  trustApproved?: boolean;
  approvedPermissions?: string[];
}

export interface PackageIntegrityAdmissionV010 {
  state: "VERIFIED" | "UNSIGNED" | "UNTRUSTED" | "INVALID" | "PENDING_ARTIFACT";
  message: string;
}

export interface PluginLifecycleEventV010 {
  contractVersion: "0.1.0";
  type: "PACKAGE_INSTALLED" | "FEATURE_ACTIVATED" | "FEATURE_DEACTIVATED" | "PACKAGE_UNINSTALLED";
  packageId: string;
  featureId?: string;
  occurredAt: string;
}

export interface AppManagerService {
  listCatalog(): PackageManifestV010[];
  planInstall(packageId: string): InstallPlanV010;
  install(packageId: string, authorization?: InstallAuthorizationV010): PlatformSnapshotV010;
  activateForEvent(eventName: string): PlatformSnapshotV010;
  enable(packageId: string): PlatformSnapshotV010;
  planDisable(packageId: string): PackageLifecyclePlanV010;
  disable(packageId: string): PlatformSnapshotV010;
  planUninstall(packageId: string): PackageLifecyclePlanV010;
  uninstall(packageId: string): PlatformSnapshotV010;
  getSnapshot(): PlatformSnapshotV010;
  listEffectiveExperiences(): unknown[];
  listEffectiveServiceProviders(capability?: string): Array<PlatformServiceProviderContributionV010["provider"] & { packageId: string; featureId: string }>;
  listEffectiveCapabilityOperations(capability?: string): Array<PlatformCapabilityOperationContributionV010["operation"] & { packageId: string; featureId: string }>;
  listEffectiveLocalizationBundles(): Array<EidosLocalizationBundleContributionV010["bundle"] & { packageId: string; featureId: string }>;
  listEffectiveWorkbenchActivities(): Array<EidosWorkbenchActivityContributionV010["activity"] & { packageId: string; featureId: string }>;
  listEffectiveWorkbenchHomeItems(): Array<EidosWorkbenchHomeItemContributionV010["item"] & { packageId: string; featureId: string }>;
  listInstalledSettings(packageId?: string): Array<EidosSettingsContributionV010["settings"] & { packageId: string; featureId: string }>;
  loadExperiencePage(source: string): unknown | undefined;
}

function uniqueSorted(values: Iterable<string>): string[] {
  return [...new Set(values)].sort();
}

export function createAppManagerService(
  catalog: PackageCatalog,
  store: LifecycleStore,
  now: () => Date = () => new Date(),
  experienceAssets: ReadonlyMap<string, unknown> = new Map(),
  onLifecycleEvent: (event: PluginLifecycleEventV010) => void = () => {},
  evaluateIntegrity: (pkg: PackageManifestV010) => PackageIntegrityAdmissionV010 =
    () => ({ state: "UNSIGNED", message: "Package integrity not evaluated by this Host." }),
  evaluateRuntime: (pkg: PackageManifestV010) => PluginRuntimeStatusV010 =
    inspectPluginRuntimeV010
): AppManagerService {
  function effectiveCapabilities(): Set<string> {
    const snapshot = store.snapshot();
    const result = new Set<string>();

    for (const active of snapshot.activeFeatures) {
      const pkg = catalog.get(active.packageId);
      const feature = pkg?.features.find(x => x.featureId === active.featureId);
      for (const capability of feature?.providesCapabilities ?? []) result.add(capability);
    }
    return result;
  }

  function resolveFeature(
    pkg: PackageManifestV010,
    feature: FeatureManifestV010,
    visiting: Set<string>,
    packages: Set<string>,
    features: Set<string>,
    missingCapabilities: Set<string>,
    blockers: Array<{ code: string; message: string }>
  ): void {
    const key = feature.featureId;
    if (features.has(key) || store.getActiveFeature(key)) return;

    if (visiting.has(key)) {
      blockers.push({
        code: "FEATURE_DEPENDENCY_CYCLE",
        message: `Feature dependency cycle detected at '${key}'`
      });
      return;
    }

    visiting.add(key);
    packages.add(pkg.packageId);

    for (const requiredFeatureId of feature.requiresFeatures ?? []) {
      let providerPackage: PackageManifestV010 | undefined;
      let requiredFeature: FeatureManifestV010 | undefined;

      for (const entry of catalog.list()) {
        const candidate = entry.package.features.find(x => x.featureId === requiredFeatureId);
        if (candidate) {
          providerPackage = entry.package;
          requiredFeature = candidate;
          break;
        }
      }

      if (!providerPackage || !requiredFeature) {
        blockers.push({
          code: "MISSING_FEATURE",
          message: `Required Feature '${requiredFeatureId}' is not available in the catalog`
        });
        continue;
      }

      resolveFeature(providerPackage, requiredFeature, visiting, packages, features, missingCapabilities, blockers);
    }

    const available = effectiveCapabilities();
    for (const capability of feature.requiresCapabilities ?? []) {
      if (available.has(capability)) continue;

      const providers = catalog.findCapabilityProviders(capability);
      if (providers.length === 0) {
        missingCapabilities.add(capability);
        blockers.push({
          code: "MISSING_CAPABILITY",
          message: `Required Capability '${capability}' is not available in the catalog`
        });
        continue;
      }

      const provider = providers[0];
      const providerPackage = catalog.get(provider.packageId);
      const providerFeature = providerPackage?.features.find(x => x.featureId === provider.featureId);
      if (providerPackage && providerFeature) {
        resolveFeature(providerPackage, providerFeature, visiting, packages, features, missingCapabilities, blockers);
      }
    }

    features.add(feature.featureId);
    visiting.delete(key);
  }

  function planInstall(packageId: string): InstallPlanV010 {
    const target = catalog.get(packageId);
    if (!target) {
      return {
        contractVersion: "0.1.0",
        packageId,
        packageVersion: "",
        installPackages: [],
        activateFeatures: [],
        missingCapabilities: [],
        blockers: [{ code: "PACKAGE_NOT_FOUND", message: `Package '${packageId}' is not in the catalog` }],
        sideEffectFree: true
      };
    }

    const packages = new Set<string>([target.packageId]);
    const features = new Set<string>();
    const missingCapabilities = new Set<string>();
    const blockers: Array<{ code: string; message: string }> = [];

    for (const feature of target.features.filter(x => x.defaultActivation === true)) {
      resolveFeature(target, feature, new Set(), packages, features, missingCapabilities, blockers);
      if (feature.activation?.mode === "ON_DEMAND") {
        features.delete(feature.featureId);
      }
    }

    const compatibility = evaluatePackageCompatibility(target);

    for (const candidatePackageId of packages) {
      const candidate = catalog.get(candidatePackageId);
      if (!candidate) continue;

      const candidateCompatibility = evaluatePackageCompatibility(candidate);
      if (candidateCompatibility.state === "INCOMPATIBLE") {
        blockers.push({
          code: candidatePackageId === target.packageId
            ? "HOST_INCOMPATIBLE"
            : "DEPENDENCY_HOST_INCOMPATIBLE",
          message: `Package '${candidatePackageId}': ${candidateCompatibility.messages.join(" ")}`
        });
      }

      const candidateRuntime = evaluateRuntime(candidate);
      if (candidateRuntime.status !== "READY") {
        blockers.push({
          code: candidatePackageId === target.packageId
            ? "PLUGIN_RUNTIME_UNSUPPORTED"
            : "DEPENDENCY_RUNTIME_UNSUPPORTED",
          message: `Package '${candidatePackageId}': ${candidateRuntime.message}`
        });
      }

      const integrity = evaluateIntegrity(candidate);
      if (integrity.state === "INVALID" || integrity.state === "UNTRUSTED") {
        blockers.push({
          code: candidatePackageId === target.packageId
            ? "PACKAGE_INTEGRITY_REJECTED"
            : "DEPENDENCY_INTEGRITY_REJECTED",
          message: `Package '${candidatePackageId}': ${integrity.message}`
        });
      }
      if (
        (candidate.runtime?.kind === "PROCESS" || candidate.runtime?.kind === "REMOTE")
        && integrity.state === "UNSIGNED"
      ) {
        blockers.push({
          code: candidatePackageId === target.packageId
            ? "PROCESS_PACKAGE_SIGNATURE_REQUIRED"
            : "DEPENDENCY_PROCESS_SIGNATURE_REQUIRED",
          message: `Package '${candidatePackageId}' requires a trusted signature before executable runtime admission.`
        });
      }

      if (
        candidatePackageId !== target.packageId
        && (
          (candidate.permissions?.length ?? 0) > 0
          || candidate.publisher?.trust === "UNVERIFIED"
        )
      ) {
        blockers.push({
          code: "DEPENDENCY_APPROVAL_REQUIRED",
          message: `Dependency Package '${candidatePackageId}' requests permissions or unverified publisher trust and requires an explicit separate approval flow.`
        });
      }
    }

    const requestedPermissions = structuredClone(target.permissions ?? []);
    const requiresTrustApproval = target.publisher?.trust === "UNVERIFIED";
    const requiresUserApproval = requiresTrustApproval || requestedPermissions.length > 0;

    return {
      contractVersion: "0.1.0",
      packageId: target.packageId,
      packageVersion: target.version,
      installPackages: uniqueSorted([...packages].filter(id => !store.getInstalledPackage(id))),
      activateFeatures: uniqueSorted([...features].filter(id => !store.getActiveFeature(id))),
      missingCapabilities: uniqueSorted(missingCapabilities),
      blockers,
      compatibility: {
        state: compatibility.state,
        messages: compatibility.messages
      },
      requestedPermissions,
      requiresTrustApproval,
      requiresUserApproval,
      sideEffectFree: true
    };
  }

  function install(
    packageId: string,
    authorization: InstallAuthorizationV010 = {}
  ): PlatformSnapshotV010 {
    const plan = planInstall(packageId);
    if (plan.blockers.length > 0) {
      throw new Error(`INSTALL_BLOCKED: ${JSON.stringify(plan.blockers)}`);
    }

    if (plan.requiresTrustApproval && authorization.trustApproved !== true) {
      throw new Error(`INSTALL_TRUST_APPROVAL_REQUIRED: ${packageId}`);
    }

    const approved = new Set(authorization.approvedPermissions ?? []);
    const missingRequiredPermissions = (plan.requestedPermissions ?? [])
      .filter(permission => permission.required !== false && !approved.has(permission.id))
      .map(permission => permission.id);
    if (missingRequiredPermissions.length > 0) {
      throw new Error(
        `INSTALL_PERMISSION_APPROVAL_REQUIRED: ${missingRequiredPermissions.join(",")}`
      );
    }

    const timestamp = now().toISOString();

    for (const id of plan.installPackages) {
      const pkg = catalog.get(id);
      if (!pkg) throw new Error(`PACKAGE_NOT_FOUND_DURING_INSTALL: ${id}`);
      const grantedPermissions = id === packageId
        ? (authorization.approvedPermissions ?? []).filter(permissionId =>
            (pkg.permissions ?? []).some(permission => permission.id === permissionId)
          )
        : [];
      store.saveInstalledPackage({
        packageId: pkg.packageId,
        version: pkg.version,
        installedAt: timestamp,
        trustApproved: pkg.publisher?.trust === "UNVERIFIED"
          ? id === packageId && authorization.trustApproved === true
          : true,
        grantedPermissions
      });
      onLifecycleEvent({
        contractVersion: "0.1.0",
        type: "PACKAGE_INSTALLED",
        packageId: pkg.packageId,
        occurredAt: timestamp
      });
    }

    for (const featureId of plan.activateFeatures) {
      let owner: PackageManifestV010 | undefined;
      let feature: FeatureManifestV010 | undefined;
      for (const entry of catalog.list()) {
        const candidate = entry.package.features.find(x => x.featureId === featureId);
        if (candidate) {
          owner = entry.package;
          feature = candidate;
          break;
        }
      }
      if (!owner || !feature) throw new Error(`FEATURE_NOT_FOUND_DURING_ACTIVATION: ${featureId}`);
      store.saveActiveFeature({
        featureId: feature.featureId,
        packageId: owner.packageId,
        version: feature.version,
        activatedAt: timestamp
      });
      onLifecycleEvent({
        contractVersion: "0.1.0",
        type: "FEATURE_ACTIVATED",
        packageId: owner.packageId,
        featureId: feature.featureId,
        occurredAt: timestamp
      });
    }

    return getSnapshot();
  }

  function activateForEvent(eventName: string): PlatformSnapshotV010 {
    const normalized = eventName.trim();
    if (!normalized) throw new Error("ACTIVATION_EVENT_REQUIRED");

    const packages = new Set<string>();
    const features = new Set<string>();
    const missingCapabilities = new Set<string>();
    const blockers: Array<{ code: string; message: string }> = [];

    for (const installed of store.snapshot().installedPackages) {
      const pkg = catalog.get(installed.packageId);
      if (!pkg) continue;
      for (const feature of pkg.features) {
        if (store.getActiveFeature(feature.featureId)) continue;
        if (feature.activation?.mode !== "ON_DEMAND") continue;
        if (!(feature.activation.events ?? []).includes(normalized)) continue;
        resolveFeature(
          pkg,
          feature,
          new Set(),
          packages,
          features,
          missingCapabilities,
          blockers
        );
      }
    }

    const notInstalled = [...packages].filter(id => !store.getInstalledPackage(id));
    if (notInstalled.length > 0) {
      blockers.push({
        code: "ACTIVATION_DEPENDENCY_NOT_INSTALLED",
        message: `Activation event '${normalized}' requires installed packages: ${notInstalled.join(", ")}`
      });
    }
    if (blockers.length > 0) {
      throw new Error(`ACTIVATION_BLOCKED: ${JSON.stringify(blockers)}`);
    }

    const timestamp = now().toISOString();
    for (const featureId of uniqueSorted(features)) {
      if (store.getActiveFeature(featureId)) continue;
      let owner: PackageManifestV010 | undefined;
      let feature: FeatureManifestV010 | undefined;
      for (const entry of catalog.list()) {
        const candidate = entry.package.features.find(x => x.featureId === featureId);
        if (candidate) {
          owner = entry.package;
          feature = candidate;
          break;
        }
      }
      if (!owner || !feature) continue;
      store.saveActiveFeature({
        featureId,
        packageId: owner.packageId,
        version: feature.version,
        activatedAt: timestamp
      });
      onLifecycleEvent({
        contractVersion: "0.1.0",
        type: "FEATURE_ACTIVATED",
        packageId: owner.packageId,
        featureId,
        occurredAt: timestamp
      });
    }

    return getSnapshot();
  }

  function lifecyclePlan(
    packageId: string,
    operation: "DISABLE" | "UNINSTALL"
  ): PackageLifecyclePlanV010 {
    const snapshot = store.snapshot();
    const installed = store.getInstalledPackage(packageId);
    const blockers: Array<{ code: string; message: string }> = [];

    if (!installed) {
      blockers.push({
        code: "PACKAGE_NOT_INSTALLED",
        message: `Package '${packageId}' is not installed.`
      });
      return {
        contractVersion: "0.1.0",
        operation,
        packageId,
        deactivateFeatures: [],
        uninstallPackages: [],
        blockers,
        sideEffectFree: true
      };
    }

    const targetActive = snapshot.activeFeatures.filter(x => x.packageId === packageId);
    const targetFeatureIds = new Set(targetActive.map(x => x.featureId));
    const targetCapabilities = new Set<string>();

    for (const active of targetActive) {
      const pkg = catalog.get(active.packageId);
      const feature = pkg?.features.find(x => x.featureId === active.featureId);
      for (const capability of feature?.providesCapabilities ?? []) {
        targetCapabilities.add(capability);
      }
    }

    const activeOutsideTarget = snapshot.activeFeatures.filter(x => x.packageId !== packageId);
    const alternativeCapabilities = new Set<string>();
    for (const active of activeOutsideTarget) {
      const pkg = catalog.get(active.packageId);
      const feature = pkg?.features.find(x => x.featureId === active.featureId);
      for (const capability of feature?.providesCapabilities ?? []) {
        alternativeCapabilities.add(capability);
      }
    }

    for (const active of activeOutsideTarget) {
      const pkg = catalog.get(active.packageId);
      const feature = pkg?.features.find(x => x.featureId === active.featureId);
      if (!feature) continue;

      for (const requiredFeature of feature.requiresFeatures ?? []) {
        if (targetFeatureIds.has(requiredFeature)) {
          blockers.push({
            code: "ACTIVE_DEPENDENT_FEATURE",
            message: `Active Feature '${feature.featureId}' depends on '${requiredFeature}' from Package '${packageId}'.`
          });
        }
      }

      for (const requiredCapability of feature.requiresCapabilities ?? []) {
        if (targetCapabilities.has(requiredCapability) && !alternativeCapabilities.has(requiredCapability)) {
          blockers.push({
            code: "ACTIVE_DEPENDENT_CAPABILITY",
            message: `Active Feature '${feature.featureId}' requires Capability '${requiredCapability}' provided by Package '${packageId}'.`
          });
        }
      }
    }

    return {
      contractVersion: "0.1.0",
      operation,
      packageId,
      deactivateFeatures: uniqueSorted(targetFeatureIds),
      uninstallPackages: operation === "UNINSTALL" ? [packageId] : [],
      blockers,
      sideEffectFree: true
    };
  }

  function enable(packageId: string): PlatformSnapshotV010 {
    if (!store.getInstalledPackage(packageId)) {
      throw new Error(`ENABLE_REQUIRES_INSTALLED_PACKAGE: ${packageId}`);
    }
    const target = catalog.get(packageId);
    const authorization: InstallAuthorizationV010 = {
      trustApproved: true,
      approvedPermissions: target?.permissions?.map(permission => permission.id) ?? []
    };
    return install(packageId, authorization);
  }

  function planDisable(packageId: string): PackageLifecyclePlanV010 {
    return lifecyclePlan(packageId, "DISABLE");
  }

  function disable(packageId: string): PlatformSnapshotV010 {
    const plan = planDisable(packageId);
    if (plan.blockers.length > 0) {
      throw new Error(`DISABLE_BLOCKED: ${JSON.stringify(plan.blockers)}`);
    }
    const timestamp = now().toISOString();
    for (const featureId of plan.deactivateFeatures) {
      const active = store.getActiveFeature(featureId);
      store.deleteActiveFeature(featureId);
      if (active) {
        onLifecycleEvent({
          contractVersion: "0.1.0",
          type: "FEATURE_DEACTIVATED",
          packageId: active.packageId,
          featureId,
          occurredAt: timestamp
        });
      }
    }
    return getSnapshot();
  }

  function planUninstall(packageId: string): PackageLifecyclePlanV010 {
    return lifecyclePlan(packageId, "UNINSTALL");
  }

  function uninstall(packageId: string): PlatformSnapshotV010 {
    const plan = planUninstall(packageId);
    if (plan.blockers.length > 0) {
      throw new Error(`UNINSTALL_BLOCKED: ${JSON.stringify(plan.blockers)}`);
    }
    const timestamp = now().toISOString();
    for (const featureId of plan.deactivateFeatures) {
      const active = store.getActiveFeature(featureId);
      store.deleteActiveFeature(featureId);
      if (active) {
        onLifecycleEvent({
          contractVersion: "0.1.0",
          type: "FEATURE_DEACTIVATED",
          packageId: active.packageId,
          featureId,
          occurredAt: timestamp
        });
      }
    }
    store.deleteInstalledPackage(packageId);
    onLifecycleEvent({
      contractVersion: "0.1.0",
      type: "PACKAGE_UNINSTALLED",
      packageId,
      occurredAt: timestamp
    });
    return getSnapshot();
  }

  function getSnapshot(): PlatformSnapshotV010 {
    const snapshot = store.snapshot();
    return {
      ...snapshot,
      effectiveCapabilities: uniqueSorted(effectiveCapabilities())
    };
  }

  function listEffectiveExperiences(): unknown[] {
    const active = store.snapshot().activeFeatures;
    const result: unknown[] = [];

    for (const item of active) {
      const pkg = catalog.get(item.packageId);
      const feature = pkg?.features.find(x => x.featureId === item.featureId);
      for (const contribution of feature?.contributions ?? []) {
        if (contribution.kind === "eidos.experience") {
          result.push(structuredClone(contribution.manifest));
        }
      }
    }

    return result.sort((a, b) => {
      const ax = a as { packageId: string; featureId: string; experienceId: string };
      const bx = b as { packageId: string; featureId: string; experienceId: string };
      return ax.packageId.localeCompare(bx.packageId)
        || ax.featureId.localeCompare(bx.featureId)
        || ax.experienceId.localeCompare(bx.experienceId);
    });
  }

  function listEffectiveServiceProviders(
    capability?: string
  ): Array<PlatformServiceProviderContributionV010["provider"] & { packageId: string; featureId: string }> {
    const active = store.snapshot().activeFeatures;
    const result: Array<PlatformServiceProviderContributionV010["provider"] & { packageId: string; featureId: string }> = [];

    for (const item of active) {
      const pkg = catalog.get(item.packageId);
      const feature = pkg?.features.find(x => x.featureId === item.featureId);
      for (const contribution of feature?.contributions ?? []) {
        if (contribution.kind !== "platform.service-provider") continue;
        if (capability !== undefined && contribution.provider.capability !== capability) continue;
        result.push({
          ...structuredClone(contribution.provider),
          packageId: item.packageId,
          featureId: item.featureId
        });
      }
    }

    return result.sort((a, b) =>
      a.capability.localeCompare(b.capability)
      || a.providerId.localeCompare(b.providerId)
    );
  }

  function listEffectiveCapabilityOperations(
    capability?: string
  ): Array<PlatformCapabilityOperationContributionV010["operation"] & { packageId: string; featureId: string }> {
    const active = store.snapshot().activeFeatures;
    const all: Array<PlatformCapabilityOperationContributionV010["operation"] & { packageId: string; featureId: string }> = [];
    const owners = new Map<string, { packageId: string; featureId: string }>();
    const actionBindings = new Map<string, {
      operationId: string;
      packageId: string;
      featureId: string;
    }>();

    for (const item of active) {
      const pkg = catalog.get(item.packageId);
      const feature = pkg?.features.find(x => x.featureId === item.featureId);
      for (const contribution of feature?.contributions ?? []) {
        if (contribution.kind !== "platform.capability-operation") continue;
        const operation = structuredClone(contribution.operation);
        const previous = owners.get(operation.operationId);
        if (previous) {
          throw new Error(
            `CAPABILITY_OPERATION_ID_CONFLICT: ${operation.operationId} is contributed by `
            + `${previous.packageId}/${previous.featureId} and ${item.packageId}/${item.featureId}`
          );
        }
        owners.set(operation.operationId, {
          packageId: item.packageId,
          featureId: item.featureId
        });

        if (operation.binding.type === "ACTION_HOST") {
          const previousBinding = actionBindings.get(
            operation.binding.commandCode
          );
          if (previousBinding) {
            throw new Error(
              `CAPABILITY_OPERATION_BINDING_CONFLICT: ${operation.binding.commandCode} is claimed by `
              + `${previousBinding.operationId} (${previousBinding.packageId}/${previousBinding.featureId}) and `
              + `${operation.operationId} (${item.packageId}/${item.featureId})`
            );
          }
          actionBindings.set(operation.binding.commandCode, {
            operationId: operation.operationId,
            packageId: item.packageId,
            featureId: item.featureId
          });
        }

        all.push({
          ...operation,
          packageId: item.packageId,
          featureId: item.featureId
        });
      }
    }

    return all
      .filter(operation => capability === undefined || operation.capability === capability)
      .sort((a, b) =>
        a.operationId.localeCompare(b.operationId)
        || a.packageId.localeCompare(b.packageId)
        || a.featureId.localeCompare(b.featureId)
      );
  }

  function listEffectiveLocalizationBundles(): Array<EidosLocalizationBundleContributionV010["bundle"] & { packageId: string; featureId: string }> {
    const active = store.snapshot().activeFeatures;
    const result: Array<EidosLocalizationBundleContributionV010["bundle"] & { packageId: string; featureId: string }> = [];

    for (const item of active) {
      const pkg = catalog.get(item.packageId);
      const feature = pkg?.features.find(x => x.featureId === item.featureId);
      for (const contribution of feature?.contributions ?? []) {
        if (contribution.kind !== "eidos.localization-bundle") continue;
        if (contribution.bundle.namespace !== item.packageId) {
          throw new Error(`LOCALIZATION_NAMESPACE_MISMATCH: ${contribution.bundle.namespace} != ${item.packageId}`);
        }
        result.push({
          ...structuredClone(contribution.bundle),
          packageId: item.packageId,
          featureId: item.featureId
        });
      }
    }

    return result.sort((a, b) =>
      a.namespace.localeCompare(b.namespace)
      || a.locale.localeCompare(b.locale)
    );
  }

  function listEffectiveWorkbenchActivities(): Array<EidosWorkbenchActivityContributionV010["activity"] & { packageId: string; featureId: string }> {
    const active = store.snapshot().activeFeatures;
    const result: Array<EidosWorkbenchActivityContributionV010["activity"] & { packageId: string; featureId: string }> = [];
    const ids = new Set<string>();

    for (const item of active) {
      const pkg = catalog.get(item.packageId);
      const feature = pkg?.features.find(x => x.featureId === item.featureId);
      for (const contribution of feature?.contributions ?? []) {
        if (contribution.kind !== "eidos.workbench-activity") continue;

        const activity = structuredClone(contribution.activity);
        if (ids.has(activity.id)) {
          throw new Error(`WORKBENCH_ACTIVITY_ID_CONFLICT: ${activity.id}`);
        }
        ids.add(activity.id);

        if (
          activity.localization
          && activity.localization.namespace !== item.packageId
        ) {
          throw new Error(
            `WORKBENCH_ACTIVITY_LOCALIZATION_NAMESPACE_MISMATCH: ${activity.localization.namespace} != ${item.packageId}`
          );
        }

        result.push({
          ...activity,
          packageId: item.packageId,
          featureId: item.featureId
        });
      }
    }

    return result.sort((a, b) =>
      (a.order ?? 0) - (b.order ?? 0)
      || a.id.localeCompare(b.id)
    );
  }

  function listEffectiveWorkbenchHomeItems(): Array<EidosWorkbenchHomeItemContributionV010["item"] & { packageId: string; featureId: string }> {
    const active = store.snapshot().activeFeatures;
    const result: Array<EidosWorkbenchHomeItemContributionV010["item"] & { packageId: string; featureId: string }> = [];
    const ids = new Set<string>();

    for (const item of active) {
      const pkg = catalog.get(item.packageId);
      const feature = pkg?.features.find(x => x.featureId === item.featureId);
      for (const contribution of feature?.contributions ?? []) {
        if (contribution.kind !== "eidos.workbench-home-item") continue;

        const homeItem = structuredClone(contribution.item);
        if (ids.has(homeItem.id)) {
          throw new Error(`WORKBENCH_HOME_ITEM_ID_CONFLICT: ${homeItem.id}`);
        }
        ids.add(homeItem.id);

        if (
          homeItem.localization
          && homeItem.localization.namespace !== item.packageId
        ) {
          throw new Error(
            `WORKBENCH_HOME_ITEM_LOCALIZATION_NAMESPACE_MISMATCH: ${homeItem.localization.namespace} != ${item.packageId}`
          );
        }

        result.push({
          ...homeItem,
          packageId: item.packageId,
          featureId: item.featureId
        });
      }
    }

    return result.sort((a, b) =>
      (a.order ?? 0) - (b.order ?? 0)
      || a.id.localeCompare(b.id)
    );
  }

  function listInstalledSettings(
    packageId?: string
  ): Array<EidosSettingsContributionV010["settings"] & { packageId: string; featureId: string }> {
    const installed = new Set(
      store.snapshot().installedPackages.map(item => item.packageId)
    );
    const result: Array<EidosSettingsContributionV010["settings"] & { packageId: string; featureId: string }> = [];

    for (const entry of catalog.list()) {
      const pkg = entry.package;
      if (!installed.has(pkg.packageId)) continue;
      if (packageId !== undefined && pkg.packageId !== packageId) continue;

      for (const feature of pkg.features) {
        for (const contribution of feature.contributions ?? []) {
          if (contribution.kind !== "eidos.settings") continue;
          if (contribution.settings.namespace !== pkg.packageId) {
            throw new Error(
              `SETTINGS_NAMESPACE_MISMATCH: ${contribution.settings.namespace} != ${pkg.packageId}`
            );
          }
          result.push({
            ...structuredClone(contribution.settings),
            packageId: pkg.packageId,
            featureId: feature.featureId
          });
        }
      }
    }

    return result.sort((a, b) =>
      a.packageId.localeCompare(b.packageId)
      || a.featureId.localeCompare(b.featureId)
      || a.namespace.localeCompare(b.namespace)
    );
  }

  function loadExperiencePage(source: string): unknown | undefined {
    const isEffective = listEffectiveExperiences().some(value => {
      const manifest = value as { pages?: Array<{ source?: string }> };
      return manifest.pages?.some(page => page.source === source) === true;
    });
    if (!isEffective) return undefined;
    const asset = experienceAssets.get(source);
    return asset === undefined ? undefined : structuredClone(asset);
  }

  return {
    listCatalog: () => catalog.list().map(x => x.package),
    planInstall,
    install,
    activateForEvent,
    enable,
    planDisable,
    disable,
    planUninstall,
    uninstall,
    getSnapshot,
    listEffectiveExperiences,
    listEffectiveServiceProviders,
    listEffectiveCapabilityOperations,
    listEffectiveLocalizationBundles,
    listEffectiveWorkbenchActivities,
    listEffectiveWorkbenchHomeItems,
    listInstalledSettings,
    loadExperiencePage
  };
}
