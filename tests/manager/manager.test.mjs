import test from "node:test";
import assert from "node:assert/strict";
import { createPackageCatalog } from "../../dist/catalog/catalog.js";
import {
  companyNotesExperienceAssets,
  companyNotesPackage,
  evoFoundationPackage,
  ledgerRuntimeConfiguratorPackage,
  referenceExperienceAssets,
  tradingLitePackage
} from "../../dist/catalog/seed.js";
import { createMemoryLifecycleStore } from "../../dist/manager/store.js";
import { createAppManagerService } from "../../dist/manager/service.js";

test("planInstall is side-effect free", () => {
  const catalog = createPackageCatalog([companyNotesPackage]);
  const store = createMemoryLifecycleStore();
  const manager = createAppManagerService(catalog, store, () => new Date("2026-09-23T00:00:00Z"), companyNotesExperienceAssets);
  const before = manager.getSnapshot();
  const plan = manager.planInstall("company-notes");
  const after = manager.getSnapshot();
  assert.deepEqual(after, before);
  assert.equal(plan.sideEffectFree, true);
  assert.deepEqual(plan.installPackages, ["company-notes"]);
  assert.deepEqual(plan.activateFeatures, ["company-notes.default"]);
  assert.deepEqual(plan.blockers, []);
});

test("install activates default feature and exposes Eidos experience", () => {
  const catalog = createPackageCatalog([companyNotesPackage]);
  const store = createMemoryLifecycleStore();
  const manager = createAppManagerService(catalog, store, () => new Date("2026-09-23T00:00:00Z"), companyNotesExperienceAssets);
  const snapshot = manager.install("company-notes");
  assert.deepEqual(snapshot.installedPackages.map(x => x.packageId), ["company-notes"]);
  assert.deepEqual(snapshot.activeFeatures.map(x => x.featureId), ["company-notes.default"]);
  assert.deepEqual(snapshot.effectiveCapabilities, ["company-notes"]);
  const experiences = manager.listEffectiveExperiences();
  assert.equal(experiences.length, 1);
  assert.equal(experiences[0].packageId, "company-notes");
  assert.equal(experiences[0].navigation[0].label, "Company Notes");
});

test("second install is idempotent at lifecycle state level", () => {
  const catalog = createPackageCatalog([companyNotesPackage]);
  const store = createMemoryLifecycleStore();
  const manager = createAppManagerService(catalog, store, () => new Date("2026-09-23T00:00:00Z"), companyNotesExperienceAssets);
  manager.install("company-notes");
  const plan = manager.planInstall("company-notes");
  assert.deepEqual(plan.installPackages, []);
  assert.deepEqual(plan.activateFeatures, []);
  assert.deepEqual(plan.blockers, []);
});

test("page asset is hidden before activation and available after install", () => {
  const catalog = createPackageCatalog([companyNotesPackage]);
  const store = createMemoryLifecycleStore();
  const manager = createAppManagerService(catalog, store, () => new Date("2026-09-23T00:00:00Z"), companyNotesExperienceAssets);
  assert.equal(manager.loadExperiencePage("app://company-notes/pages/home"), undefined);
  manager.install("company-notes");
  const page = manager.loadExperiencePage("app://company-notes/pages/home");
  assert.equal(page.kind, "form");
  assert.equal(page.id, "company-notes.home");
  assert.equal(page.command.code, "company-notes.save-note");
});

test("Proof B plan resolves Trading Lite through EVO capabilities", () => {
  const catalog = createPackageCatalog([companyNotesPackage, evoFoundationPackage, tradingLitePackage]);
  const store = createMemoryLifecycleStore();
  const manager = createAppManagerService(catalog, store, () => new Date("2026-09-23T00:00:00Z"), referenceExperienceAssets);

  const before = manager.getSnapshot();
  const plan = manager.planInstall("trading-lite");
  const after = manager.getSnapshot();

  assert.deepEqual(after, before);
  assert.deepEqual(plan.blockers, []);
  assert.deepEqual(plan.missingCapabilities, []);
  assert.deepEqual(plan.installPackages, ["evo.core", "trading-lite"]);
  assert.deepEqual(plan.activateFeatures, [
    "evo.balance",
    "evo.business-data",
    "evo.ledger",
    "evo.posting",
    "trading-lite.default"
  ]);
});

test("Proof B install activates only required EVO Features and exposes Trading Lite", () => {
  const catalog = createPackageCatalog([companyNotesPackage, evoFoundationPackage, tradingLitePackage]);
  const store = createMemoryLifecycleStore();
  const manager = createAppManagerService(catalog, store, () => new Date("2026-09-23T00:00:00Z"), referenceExperienceAssets);

  const snapshot = manager.install("trading-lite");

  assert.deepEqual(snapshot.installedPackages.map(x => x.packageId), ["evo.core", "trading-lite"]);
  assert.deepEqual(snapshot.activeFeatures.map(x => x.featureId), [
    "evo.balance",
    "evo.business-data",
    "evo.ledger",
    "evo.posting",
    "trading-lite.default"
  ]);
  assert.deepEqual(snapshot.effectiveCapabilities, [
    "evo.balance",
    "evo.business-data",
    "evo.ledger",
    "evo.posting",
    "trading-lite"
  ]);

  const experiences = manager.listEffectiveExperiences();
  assert.equal(experiences.length, 1);
  assert.equal(experiences[0].packageId, "trading-lite");
  assert.equal(experiences[0].navigation[0].label, "Trading Lite");
  const page = manager.loadExperiencePage("app://trading-lite/pages/home");
  assert.equal(page.id, "trading-lite.home");
  assert.equal(page.kind, "form");
  assert.equal(page.purpose, "execute-command");
  assert.equal(page.command.code, "trading-lite.create-order");
});


test("Ledger Runtime Configurator installs as an ordinary plugin with EVO ledger dependencies", () => {
  const catalog = createPackageCatalog([
    evoFoundationPackage,
    ledgerRuntimeConfiguratorPackage
  ]);
  const store = createMemoryLifecycleStore();
  const manager = createAppManagerService(
    catalog,
    store,
    () => new Date("2026-09-24T00:00:00Z"),
    referenceExperienceAssets
  );

  assert.deepEqual(manager.getSnapshot().installedPackages, []);
  assert.deepEqual(manager.getSnapshot().activeFeatures, []);
  assert.equal(
    manager.loadExperiencePage("app://evo-ledger-runtime-configurator/pages/home"),
    undefined,
    "Configurator Experience must be unavailable before installation/activation"
  );

  const plan = manager.planInstall("evo-ledger-runtime-configurator");
  assert.deepEqual(plan.blockers, []);
  assert.deepEqual(plan.installPackages, ["evo-ledger-runtime-configurator", "evo.core"]);
  assert.deepEqual(plan.activateFeatures, [
    "evo-ledger-runtime-configurator.default",
    "evo.business-data",
    "evo.ledger",
    "evo.posting"
  ]);

  const snapshot = manager.install("evo-ledger-runtime-configurator");
  assert.equal(snapshot.effectiveCapabilities.includes("evo.ledger-runtime.configurator"), true);

  const page = manager.loadExperiencePage("app://evo-ledger-runtime-configurator/pages/home");
  assert.equal(page.id, "evo-ledger-runtime-configurator.home");
  assert.equal(page.command.code, "evo-ledger-runtime-configurator.validate-default");
  assert.equal(page.metadata.defaultConfiguration.postingRules, 912);
});


test("package lifecycle closes install enable disable uninstall loop", () => {
  const catalog = createPackageCatalog([evoFoundationPackage, ledgerRuntimeConfiguratorPackage]);
  const store = createMemoryLifecycleStore();
  const manager = createAppManagerService(
    catalog,
    store,
    () => new Date("2026-09-24T00:00:00Z"),
    referenceExperienceAssets
  );

  manager.install("evo-ledger-runtime-configurator");
  assert.equal(
    manager.listEffectiveExperiences().some(x => x.packageId === "evo-ledger-runtime-configurator"),
    true
  );

  const disablePlan = manager.planDisable("evo-ledger-runtime-configurator");
  assert.deepEqual(disablePlan.blockers, []);
  assert.deepEqual(disablePlan.deactivateFeatures, ["evo-ledger-runtime-configurator.default"]);

  manager.disable("evo-ledger-runtime-configurator");
  assert.equal(
    manager.listEffectiveExperiences().some(x => x.packageId === "evo-ledger-runtime-configurator"),
    false
  );
  assert.equal(
    manager.getSnapshot().installedPackages.some(x => x.packageId === "evo-ledger-runtime-configurator"),
    true
  );

  manager.enable("evo-ledger-runtime-configurator");
  assert.equal(
    manager.listEffectiveExperiences().some(x => x.packageId === "evo-ledger-runtime-configurator"),
    true
  );

  const uninstallPlan = manager.planUninstall("evo-ledger-runtime-configurator");
  assert.deepEqual(uninstallPlan.blockers, []);
  manager.uninstall("evo-ledger-runtime-configurator");

  assert.equal(
    manager.getSnapshot().installedPackages.some(x => x.packageId === "evo-ledger-runtime-configurator"),
    false
  );
  assert.equal(
    manager.listEffectiveExperiences().some(x => x.packageId === "evo-ledger-runtime-configurator"),
    false
  );
  assert.equal(
    manager.getSnapshot().installedPackages.some(x => x.packageId === "evo.core"),
    true,
    "shared dependency remains installed"
  );
});

test("disable/uninstall fail closed when another active feature depends on package capability", () => {
  const catalog = createPackageCatalog([evoFoundationPackage, ledgerRuntimeConfiguratorPackage, tradingLitePackage]);
  const store = createMemoryLifecycleStore();
  const manager = createAppManagerService(
    catalog,
    store,
    () => new Date("2026-09-24T00:00:00Z"),
    referenceExperienceAssets
  );

  manager.install("trading-lite");
  const plan = manager.planDisable("evo.core");
  assert.ok(plan.blockers.some(x => x.code === "ACTIVE_DEPENDENT_CAPABILITY"));
  assert.throws(() => manager.disable("evo.core"), /DISABLE_BLOCKED/);
  assert.throws(() => manager.uninstall("evo.core"), /UNINSTALL_BLOCKED/);
});
