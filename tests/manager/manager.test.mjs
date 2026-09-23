import test from "node:test";
import assert from "node:assert/strict";
import { createPackageCatalog } from "../../dist/catalog/catalog.js";
import { companyNotesPackage } from "../../dist/catalog/seed.js";
import { createMemoryLifecycleStore } from "../../dist/manager/store.js";
import { createAppManagerService } from "../../dist/manager/service.js";

test("planInstall is side-effect free", () => {
  const catalog = createPackageCatalog([companyNotesPackage]);
  const store = createMemoryLifecycleStore();
  const manager = createAppManagerService(catalog, store, () => new Date("2026-09-23T00:00:00Z"));

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
  const manager = createAppManagerService(catalog, store, () => new Date("2026-09-23T00:00:00Z"));

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
  const manager = createAppManagerService(catalog, store, () => new Date("2026-09-23T00:00:00Z"));

  manager.install("company-notes");
  const plan = manager.planInstall("company-notes");

  assert.deepEqual(plan.installPackages, []);
  assert.deepEqual(plan.activateFeatures, []);
  assert.deepEqual(plan.blockers, []);
});
