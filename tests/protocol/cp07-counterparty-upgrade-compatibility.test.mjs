import test from "node:test";
import assert from "node:assert/strict";

import { createPackageCatalog } from "../../dist/catalog/catalog.js";
import { createMemoryLifecycleStore } from "../../dist/manager/store.js";
import { createAppManagerService } from "../../dist/manager/service.js";
import {
  createMemoryEnterpriseResourceRepositoryV010
} from "../../dist/providers/enterprise-context/resources.js";
import {
  createCounterpartyRepositoryV010
} from "../../dist/apps/counterparty/repository.js";
import {
  counterpartyPackage
} from "../../dist/apps/counterparty/package.js";
import {
  COUNTERPARTY_FEATURE_ID,
  COUNTERPARTY_PACKAGE_ID
} from "../../dist/apps/counterparty/constants.js";

const dependencyPackage = {
  contractVersion: "0.1.0",
  packageId: "cp07-counterparty-dependencies",
  displayName: "CP-07 Counterparty Dependencies",
  version: "0.1.0",
  type: "PLATFORM_PROVIDER",
  features: [{
    contractVersion: "0.1.0",
    featureId: "cp07-counterparty-dependencies.default",
    packageId: "cp07-counterparty-dependencies",
    version: "0.1.0",
    activationScope: "INSTALLATION",
    defaultActivation: true,
    providesCapabilities: [
      "enterprise.directory",
      "enterprise.resource.repository",
      "enterprise.responsibility"
    ]
  }]
};

function upgradedCounterparty(version = "0.1.1") {
  return {
    ...structuredClone(counterpartyPackage),
    version,
    features: counterpartyPackage.features.map(feature => ({
      ...structuredClone(feature),
      version
    }))
  };
}

function lifecycleStore(installedVersion = "0.1.0") {
  const store = createMemoryLifecycleStore();
  store.saveInstalledPackage({
    packageId: dependencyPackage.packageId,
    version: dependencyPackage.version,
    installedAt: "2026-10-09T00:00:00.000Z",
    trustApproved: true,
    grantedPermissions: []
  });
  store.saveActiveFeature({
    featureId: dependencyPackage.features[0].featureId,
    packageId: dependencyPackage.packageId,
    version: dependencyPackage.features[0].version,
    activatedAt: "2026-10-09T00:00:00.000Z"
  });
  store.saveInstalledPackage({
    packageId: COUNTERPARTY_PACKAGE_ID,
    version: installedVersion,
    installedAt: "2026-10-09T00:01:00.000Z",
    trustApproved: true,
    grantedPermissions: []
  });
  store.saveActiveFeature({
    featureId: COUNTERPARTY_FEATURE_ID,
    packageId: COUNTERPARTY_PACKAGE_ID,
    version: installedVersion,
    activatedAt: "2026-10-09T00:01:00.000Z"
  });
  return store;
}

test("CP-07 upgrades Counterparty lifecycle metadata without rewriting Enterprise Context master data", () => {
  const resources = createMemoryEnterpriseResourceRepositoryV010();
  const counterparties = createCounterpartyRepositoryV010(resources);
  counterparties.save({
    contextId: "enterprise-context:a",
    subject: {
      contractVersion: "0.1.0",
      counterpartyId: "cp-upgrade-proof",
      code: "CP-UPGRADE-001",
      displayName: "Upgrade Proof Counterparty",
      subjectType: "ORGANIZATION",
      status: "ACTIVE",
      legalName: "Upgrade Proof Counterparty Ltd",
      taxIdentifier: "TAX-UPGRADE-001"
    },
    actorSubjectId: "owner-a",
    recordedAt: "2026-10-09T00:02:00.000Z"
  });

  const store = lifecycleStore();
  const events = [];
  const manager = createAppManagerService(
    createPackageCatalog([
      dependencyPackage,
      upgradedCounterparty("0.1.1")
    ]),
    store,
    () => new Date("2026-10-09T00:03:00.000Z"),
    new Map(),
    event => events.push(event)
  );

  const before = store.snapshot();
  const plan = manager.planUpgrade(COUNTERPARTY_PACKAGE_ID);
  assert.deepEqual(plan.blockers, []);
  assert.equal(plan.fromVersion, "0.1.0");
  assert.equal(plan.toVersion, "0.1.1");
  assert.deepEqual(plan.updateFeatures, [{
    featureId: COUNTERPARTY_FEATURE_ID,
    fromVersion: "0.1.0",
    toVersion: "0.1.1"
  }]);
  assert.deepEqual(store.snapshot(), before, "upgrade planning must be side-effect free");

  const snapshot = manager.upgrade(COUNTERPARTY_PACKAGE_ID);
  assert.equal(
    snapshot.installedPackages.find(
      item => item.packageId === COUNTERPARTY_PACKAGE_ID
    )?.version,
    "0.1.1"
  );
  assert.equal(
    snapshot.activeFeatures.find(
      item => item.featureId === COUNTERPARTY_FEATURE_ID
    )?.version,
    "0.1.1"
  );

  const after = counterparties.get(
    "enterprise-context:a",
    "cp-upgrade-proof"
  );
  assert.equal(after?.displayName, "Upgrade Proof Counterparty");
  assert.equal(after?.taxIdentifier, "TAX-UPGRADE-001");

  const raw = resources.get({
    contextId: "enterprise-context:a",
    namespace: "evo.counterparty",
    collectionId: "counterparties",
    resourceType: "counterparty.subject",
    resourceId: "cp-upgrade-proof"
  });
  assert.equal(raw?.schemaRef, "evo.counterparty/0.1.0");
  assert.equal(
    manager.listEffectiveExperiences().some(
      experience => experience.experienceId === COUNTERPARTY_PACKAGE_ID
    ),
    true
  );
  assert.deepEqual(
    events.filter(event => event.type === "PACKAGE_UPGRADED"),
    [{
      contractVersion: "0.1.0",
      type: "PACKAGE_UPGRADED",
      packageId: COUNTERPARTY_PACKAGE_ID,
      fromVersion: "0.1.0",
      toVersion: "0.1.1",
      occurredAt: "2026-10-09T00:03:00.000Z"
    }]
  );
});

test("CP-07 package upgrade refuses downgrade and removal of an active Counterparty feature", () => {
  const downgradeStore = lifecycleStore("0.1.1");
  const downgradeManager = createAppManagerService(
    createPackageCatalog([
      dependencyPackage,
      upgradedCounterparty("0.1.0")
    ]),
    downgradeStore
  );
  assert.equal(
    downgradeManager.planUpgrade(COUNTERPARTY_PACKAGE_ID).blockers
      .some(blocker => blocker.code === "PACKAGE_DOWNGRADE_NOT_ALLOWED"),
    true
  );

  const removedFeatureStore = lifecycleStore("0.1.0");
  const removedFeaturePackage = {
    ...upgradedCounterparty("0.1.1"),
    features: []
  };
  const removedFeatureManager = createAppManagerService(
    createPackageCatalog([
      dependencyPackage,
      removedFeaturePackage
    ]),
    removedFeatureStore
  );
  assert.equal(
    removedFeatureManager.planUpgrade(COUNTERPARTY_PACKAGE_ID).blockers
      .some(blocker => blocker.code === "ACTIVE_FEATURE_REMOVED_BY_UPGRADE"),
    true
  );
});

test("CP-07 package upgrade rejects a newer Counterparty version that is incompatible with the current Host", () => {
  const store = lifecycleStore("0.1.0");
  const incompatible = upgradedCounterparty("0.1.1");
  incompatible.compatibility = {
    ...incompatible.compatibility,
    appPlatform: ">=9.0.0"
  };
  const manager = createAppManagerService(
    createPackageCatalog([dependencyPackage, incompatible]),
    store
  );
  assert.equal(
    manager.planUpgrade(COUNTERPARTY_PACKAGE_ID).blockers
      .some(blocker => blocker.code === "HOST_INCOMPATIBLE"),
    true
  );
});
