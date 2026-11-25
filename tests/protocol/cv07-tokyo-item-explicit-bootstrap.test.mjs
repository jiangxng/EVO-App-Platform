import test from "node:test";
import assert from "node:assert/strict";
import { createPackageCatalog } from "../../dist/catalog/catalog.js";
import { createMemoryLifecycleStore } from "../../dist/manager/store.js";
import { createMemorySettingsStore } from "../../dist/manager/settings-store.js";
import { createAppManagerService } from "../../dist/manager/service.js";
import {
  createStartupDefaultsV010, shouldBootstrapBusinessDefaultV010
} from "../../dist/manager/startup-defaults.js";
import {
  hostEnterpriseContextProviderPackage
} from "../../dist/providers/enterprise-context/package.js";
import { responsibilityPackage } from "../../dist/apps/responsibility/package.js";
import { itemPackage } from "../../dist/apps/item/package.js";

function freshHost() {
  const store = createMemoryLifecycleStore();
  const catalog = createPackageCatalog([
    hostEnterpriseContextProviderPackage, responsibilityPackage, itemPackage
  ]);
  const manager = createAppManagerService(catalog, store);
  const journal = createMemorySettingsStore();
  const defaults = createStartupDefaultsV010(journal);
  return { manager, store, journal, defaults };
}

test("CV07 Tokyo: clean profile never silently installs Item without opt-in", () => {
  const {manager} = freshHost();
  assert.equal(shouldBootstrapBusinessDefaultV010("clean", false), false);
  assert.equal(manager.getSnapshot().installedPackages.length, 0);
  assert.equal(manager.getSnapshot().activeFeatures.length, 0);
});

test("CV07 Tokyo: explicit preview opt-in uses existing Manager dependencies", () => {
  const {manager, defaults, journal} = freshHost();
  const plan = manager.planInstall("evo-item");
  assert.deepEqual(plan.blockers, []);
  assert.equal(plan.sideEffectFree, true);
  for (const id of [
    "evo-item.default",
    "evo-responsibility.default",
    "host-enterprise-context-provider.default"
  ]) assert.ok(plan.activateFeatures.includes(id), id);

  assert.equal(shouldBootstrapBusinessDefaultV010("clean", true), true);
  const outcome = defaults.apply({
    packageId: "evo-item", installed: false,
    install: () => manager.install("evo-item")
  });
  assert.equal(outcome, "INSTALLED");
  const active = new Set(manager.getSnapshot().activeFeatures.map(x => x.featureId));
  for (const id of plan.activateFeatures) assert.ok(active.has(id), id);
  assert.equal(manager.getSnapshot().installedPackages.some(x =>
    x.packageId === "evo-item"), true);
  assert.equal(journal.getNamespace("host.startup-defaults.v1")["evo-item"], true);

  // Second startup preserves state; never replays a material install.
  assert.equal(defaults.apply({
    packageId: "evo-item", installed: true,
    install: () => { throw new Error("CV07_BOOTSTRAP_REPLAY_FORBIDDEN"); }
  }), "PRESERVED");
});

test("CV07 Tokyo: one-time journal never silently re-enables a disabled Item", () => {
  const {manager, store, defaults} = freshHost();
  defaults.apply({
    packageId: "evo-item", installed: false,
    install: () => manager.install("evo-item")
  });
  store.deleteActiveFeature("evo-item.default");
  assert.equal(defaults.apply({
    packageId: "evo-item", installed: true,
    install: () => { throw new Error("CV07_BOOTSTRAP_REENABLE_FORBIDDEN"); }
  }), "PRESERVED");
  assert.equal(store.snapshot().activeFeatures.some(x =>
    x.featureId === "evo-item.default"), false,
    "Host preview admission must refuse inactive persisted Item");
});
