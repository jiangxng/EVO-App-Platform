import test from "node:test";
import assert from "node:assert/strict";
import { createPluginStorePage } from "../dist/manager/plugin-store-page.js";
import {
  ledgerRuntimeConfiguratorPackage,
  enterpriseAgentPackage
} from "../dist/catalog/seed.js";

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


test("installed Personal Agent shows Set up instead of Open when product readiness is incomplete", () => {
  const snapshot = {
    contractVersion: "0.1.0",
    installedPackages: [{
      packageId: "enterprise-agent",
      version: "0.1.0",
      installedAt: "2026-09-26T00:00:00.000Z"
    }],
    activeFeatures: [{
      packageId: "enterprise-agent",
      featureId: "enterprise-agent.default",
      activatedAt: "2026-09-26T00:00:00.000Z"
    }],
    effectiveCapabilities: ["agent.personal"]
  };
  const page = createPluginStorePage([enterpriseAgentPackage], snapshot, {
    readinessForPackage() {
      return {
        id: "setup-required",
        label: "Needs setup",
        tone: "warning",
        message: "Connect an LLM Provider.",
        setupRoute: "/enterprise-agent/setup"
      };
    }
  });
  const item = page.items[0];
  assert.equal(item.status.id, "enabled");
  assert.equal(item.readiness.id, "setup-required");
  assert.equal(item.primaryAction.id, "setup");
  assert.equal(item.primaryAction.route, "/enterprise-agent/setup");
  assert.notEqual(item.primaryAction.id, "open");
});

test("ready Personal Agent returns to the ordinary Open action", () => {
  const snapshot = {
    contractVersion: "0.1.0",
    installedPackages: [{
      packageId: "enterprise-agent",
      version: "0.1.0",
      installedAt: "2026-09-26T00:00:00.000Z"
    }],
    activeFeatures: [{
      packageId: "enterprise-agent",
      featureId: "enterprise-agent.default",
      activatedAt: "2026-09-26T00:00:00.000Z"
    }],
    effectiveCapabilities: ["agent.personal"]
  };
  const page = createPluginStorePage([enterpriseAgentPackage], snapshot, {
    readinessForPackage() {
      return { id: "ready", label: "Ready", tone: "positive" };
    }
  });
  assert.equal(page.items[0].readiness.id, "ready");
  assert.equal(page.items[0].primaryAction.id, "open");
});
