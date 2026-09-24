import test from "node:test";
import assert from "node:assert/strict";
import { createPluginStorePage } from "../dist/manager/plugin-store-page.js";
import { ledgerRuntimeConfiguratorPackage } from "../dist/catalog/seed.js";

const emptySnapshot = {
  contractVersion: "0.1.0",
  installedPackages: [],
  activeFeatures: [],
  effectiveCapabilities: []
};

test("Plugin Store presents one-click install with optional details", () => {
  const page = createPluginStorePage([ledgerRuntimeConfiguratorPackage], emptySnapshot);
  const item = page.items[0];
  assert.equal(item.status?.label, "Not installed");
  assert.equal(item.primaryAction?.id, "install");
  assert.equal(item.primaryAction?.label, "Install");
  assert.notEqual(item.primaryAction?.enabled, false);
  const details = item.secondaryActions?.find(action => action.id === "plan");
  assert.equal(details?.label, "Installation details");
});

test("one-click install delegates safety to automatic preflight", () => {
  const page = createPluginStorePage([ledgerRuntimeConfiguratorPackage], emptySnapshot);
  const install = page.items[0].primaryAction;
  assert.match(install?.helpText ?? "", /automatically checks dependencies and compatibility/);
});
