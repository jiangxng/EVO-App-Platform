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

test("Plugin Store blocks install until an installation plan has been reviewed", () => {
  const page = createPluginStorePage([ledgerRuntimeConfiguratorPackage], emptySnapshot);
  const item = page.items[0];
  assert.equal(item.status?.label, "未安装");
  assert.equal(item.primaryAction?.id, "plan");
  const install = item.secondaryActions?.find(action => action.id === "install");
  assert.equal(install?.enabled, false);
  assert.match(install?.disabledReason ?? "", /查看安装计划/);
});

test("Plugin Store unlocks install after the package has a current plan", () => {
  const page = createPluginStorePage(
    [ledgerRuntimeConfiguratorPackage],
    emptySnapshot,
    new Set(["evo-ledger-runtime-configurator"])
  );
  const item = page.items[0];
  assert.equal(item.status?.label, "安装计划已就绪");
  const install = item.secondaryActions?.find(action => action.id === "install");
  assert.equal(install?.enabled, true);
  assert.match(install?.helpText ?? "", /可以确认安装/);
});
