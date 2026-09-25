import test from "node:test";
import assert from "node:assert/strict";

import { createPackageCatalog } from "../../dist/catalog/catalog.js";
import { companyNotesPackage } from "../../dist/catalog/seed.js";
import { createMemoryLifecycleStore } from "../../dist/manager/store.js";
import { createAppManagerService } from "../../dist/manager/service.js";
import {
  createPluginStorePage,
  pluginStoreExperienceManifest,
  pluginStorePageSource
} from "../../dist/manager/plugin-store-page.js";
import { renderAppHostPageToHtml } from "../../dist/vendor/eidos/src/app-host/index.js";
import { appHostShellHtml } from "../../dist/manager/app-host-shell.js";
import {
  eidosDesignPolicyV010,
  eidosDesignTokensV010,
  eidosIconSystemMetadataV010,
  renderEidosIconToSvg
} from "../../dist/vendor/eidos/src/design-language/index.js";

function loaded(definition) {
  return {
    experienceId: pluginStoreExperienceManifest.experienceId,
    packageId: pluginStoreExperienceManifest.packageId,
    featureId: pluginStoreExperienceManifest.featureId,
    route: pluginStoreExperienceManifest.routes[0],
    page: pluginStoreExperienceManifest.pages[0],
    definition
  };
}

test("App Platform + Eidos render Plugin Protocol compatibility without other runtimes", () => {
  const manager = createAppManagerService(
    createPackageCatalog([companyNotesPackage]),
    createMemoryLifecycleStore()
  );

  const page = createPluginStorePage([companyNotesPackage], manager.getSnapshot());
  assert.equal(page.kind, "extension-manager");
  assert.equal(page.protocol.name, "EVO Plugin Protocol");
  assert.equal(page.protocol.version, "0.1.0");
  assert.equal(page.items[0].compatibility.state, "unknown");
  assert.equal(page.items[0].trust.level, "trusted");
  assert.equal(page.items[0].runtime.kind, "declarative");
  assert.equal(page.items[0].runtime.isolation, "host");

  const html = renderAppHostPageToHtml(loaded(page));
  assert.match(html, /data-eidos-extension-manager=/);
  assert.match(html, /EVO Plugin Protocol/);
  assert.match(html, /data-eidos-extension-action="install"/);
  assert.match(html, /eidos\.experience/);
});

test("App Platform lifecycle is reflected by Eidos Extension Manager", () => {
  const manager = createAppManagerService(
    createPackageCatalog([companyNotesPackage]),
    createMemoryLifecycleStore()
  );

  const before = createPluginStorePage([companyNotesPackage], manager.getSnapshot());
  assert.equal(before.items[0].status.id, "not-installed");
  assert.equal(before.items[0].primaryAction.id, "install");

  manager.install("company-notes");
  const enabled = createPluginStorePage([companyNotesPackage], manager.getSnapshot());
  assert.equal(enabled.items[0].status.id, "enabled");
  assert.equal(enabled.items[0].primaryAction.id, "open");
  assert.ok(enabled.items[0].secondaryActions.some(action => action.id === "disable"));

  manager.disable("company-notes");
  const disabled = createPluginStorePage([companyNotesPackage], manager.getSnapshot());
  assert.equal(disabled.items[0].status.id, "disabled");
  assert.equal(disabled.items[0].primaryAction.id, "enable");

  manager.enable("company-notes");
  manager.uninstall("company-notes");
  const removed = createPluginStorePage([companyNotesPackage], manager.getSnapshot());
  assert.equal(removed.items[0].status.id, "not-installed");
  assert.equal(pluginStorePageSource, "app://evo-app-platform/pages/plugin-store");
});


test("App Platform consumes Eidos design language instead of owning Workbench CSS", async () => {
  assert.equal(eidosDesignTokensV010.spacing.xs, 4);
  assert.equal(eidosDesignPolicyV010.actions.maxPrimaryPerScope, 1);
  assert.match(appHostShellHtml, /--eidos-space-xs:4px/);
  assert.match(appHostShellHtml, /data-eidos-app-host-layout="workbench"/);

  const { readFile } = await import("node:fs/promises");
  const source = await readFile(
    new URL("../../manager/app-host-shell.ts", import.meta.url),
    "utf8"
  );
  assert.match(source, /eidosProductiveWorkbenchCss/);
  assert.doesNotMatch(source, /\[data-eidos-activity-bar\]\s*\{/);
});


test("App Platform Workbench consumes Eidos semantic icon system", async () => {
  assert.equal(eidosIconSystemMetadataV010.externalIconLibraryDependency, false);
  assert.match(renderEidosIconToSvg("plugins"), /data-eidos-icon="plugins"/);

  const { readFile } = await import("node:fs/promises");
  const client = await readFile(
    new URL("../../manager/app-host-client.ts", import.meta.url),
    "utf8"
  );
  assert.match(client, /icon: "dashboard"/);
  assert.match(client, /icon: "plugins"/);
  assert.match(client, /icon: "workspace"/);
  assert.match(client, /icon: "settings"/);
  assert.doesNotMatch(client, /icon: "[▦◇▣⚙]"/);
});


test("Plugin Platform surface exposes compatibility, trust, permissions and runtime posture", () => {
  const governedPackage = structuredClone(companyNotesPackage);
  governedPackage.compatibility = {
    appPlatform: ">=0.1.0 <0.2.0",
    eidos: "^1.3.0",
    pluginProtocol: "0.1.0"
  };
  governedPackage.publisher = {
    id: "example",
    displayName: "Example Publisher",
    trust: "UNVERIFIED",
    source: "private-catalog"
  };
  governedPackage.permissions = [{
    id: "workspace.read",
    label: "Read workspace",
    risk: "MEDIUM",
    required: true,
    reason: "Needed for notes."
  }];
  governedPackage.runtime = { kind: "DECLARATIVE", isolation: "HOST" };
  governedPackage.storage = { scope: "PACKAGE", quotaBytes: 4096 };
  governedPackage.events = { publish: ["company-notes.changed"], subscribe: [] };

  const manager = createAppManagerService(
    createPackageCatalog([governedPackage]),
    createMemoryLifecycleStore()
  );
  const page = createPluginStorePage([governedPackage], manager.getSnapshot());
  const item = page.items[0];

  assert.equal(item.compatibility.state, "compatible");
  assert.equal(item.trust.level, "review");
  assert.equal(item.permissions[0].risk, "medium");
  assert.equal(item.runtime.kind, "declarative");
  assert.equal(item.storage.state, "available");
  assert.deepEqual(item.events.publish, ["company-notes.changed"]);

  const html = renderAppHostPageToHtml(loaded(page));
  assert.match(html, /Review required/);
  assert.match(html, /Read workspace/);
  assert.match(html, /Runtime: declarative \/ host/);
  assert.match(html, /Storage: available/);
});
