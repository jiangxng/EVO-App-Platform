import test from "node:test";
import assert from "node:assert/strict";

import {
  EVO_PLUGIN_PROTOCOL_VERSION,
  validatePluginManifestV010
} from "../../dist/contracts/plugin-protocol.js";

const validPlugin = {
  contractVersion: "0.1.0",
  packageId: "sample-plugin",
  displayName: "Sample Plugin",
  version: "0.1.0",
  type: "APPLICATION",
  features: [
    {
      contractVersion: "0.1.0",
      featureId: "sample-plugin.default",
      packageId: "sample-plugin",
      version: "0.1.0",
      activationScope: "INSTALLATION",
      defaultActivation: true,
      providesCapabilities: ["sample-plugin"],
      contributions: [
        {
          kind: "eidos.experience",
          manifest: {
            contractVersion: "0.1.0",
            experienceId: "sample-plugin",
            packageId: "sample-plugin",
            featureId: "sample-plugin.default",
            defaultRoute: "/sample",
            pages: [
              { id: "sample-plugin.home", source: "app://sample-plugin/pages/home" }
            ],
            routes: [
              { id: "sample-plugin.home", path: "/sample", pageId: "sample-plugin.home" }
            ]
          }
        },
        {
          kind: "eidos.localization-bundle",
          bundle: {
            contractVersion: "0.1.0",
            namespace: "sample-plugin",
            locale: "en",
            messages: {
              "page.sample-plugin.home.title": "Sample Plugin"
            }
          }
        }
      ]
    }
  ]
};

test("Plugin Protocol v0.1 accepts an isolated conforming plugin", () => {
  const result = validatePluginManifestV010(validPlugin);
  assert.equal(EVO_PLUGIN_PROTOCOL_VERSION, "0.1.0");
  assert.equal(result.ok, true);
  assert.deepEqual(result.issues, []);
});

test("Plugin Protocol v0.1 rejects ownership and dependency ambiguity without loading other plugins", () => {
  const invalid = structuredClone(validPlugin);
  invalid.features[0].packageId = "other-plugin";
  invalid.features[0].requiresCapabilities = ["evo.ledger", "evo.ledger"];
  invalid.features[0].contributions.push({
    kind: "eidos.localization-bundle",
    bundle: {
      contractVersion: "0.1.0",
      namespace: "other-plugin",
      locale: "en",
      messages: {}
    }
  });

  const result = validatePluginManifestV010(invalid);
  assert.equal(result.ok, false);
  assert.ok(result.issues.some(issue => issue.code === "PLUGIN_FEATURE_PACKAGE_MISMATCH"));
  assert.ok(result.issues.some(issue => issue.code === "PLUGIN_DEPENDENCY_DUPLICATE"));
  assert.ok(result.issues.some(issue => issue.code === "PLUGIN_LOCALIZATION_NAMESPACE_MISMATCH"));
});

test("Plugin Protocol v0.1 rejects route contributions that cannot be rendered deterministically", () => {
  const invalid = structuredClone(validPlugin);
  invalid.features[0].contributions.push({
    kind: "eidos.workbench-activity",
    activity: {
      contractVersion: "0.1.0",
      id: "sample-plugin.activity",
      title: "Sample",
      icon: "S",
      kind: "side-route",
      localization: {
        namespace: "sample-plugin",
        key: "workbench.activity.label"
      }
    }
  });

  const result = validatePluginManifestV010(invalid);
  assert.equal(result.ok, false);
  assert.ok(result.issues.some(issue => issue.code === "PLUGIN_WORKBENCH_ROUTE_REQUIRED"));
});


test("Plugin Protocol accepts Secret requirements but rejects duplicate Secret keys", () => {
  const valid = structuredClone(validPlugin);
  valid.secrets = [{
    key: "apiKey",
    label: "API Key",
    scope: "INSTALLATION",
    required: true
  }];
  assert.equal(validatePluginManifestV010(valid).ok, true);

  valid.secrets.push({
    key: "apiKey",
    label: "Duplicate",
    scope: "INSTALLATION"
  });
  const result = validatePluginManifestV010(valid);
  assert.equal(result.ok, false);
  assert.ok(result.issues.some(issue => issue.code === "PLUGIN_SECRET_KEY_DUPLICATE"));
});
