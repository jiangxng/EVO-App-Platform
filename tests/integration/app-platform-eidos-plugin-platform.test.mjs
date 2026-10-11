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
import {
  appHostShellCss,
  appHostShellHtml
} from "../../dist/manager/app-host-shell.js";
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


test("App Platform consumes Eidos design language without duplicating Workbench CSS", async () => {
  assert.equal(eidosDesignTokensV010.spacing.xs, 4);
  assert.equal(eidosDesignPolicyV010.actions.maxPrimaryPerScope, 1);
  assert.match(appHostShellCss, /--eidos-space-xs:4px/);
  assert.match(appHostShellCss, /data-eidos-app-host-layout="workbench"/);
  assert.match(
    appHostShellHtml,
    /href="\/assets\/dev\/manager\/app-host-shell\.css"/
  );
  assert.doesNotMatch(appHostShellHtml, /<style\b/i);

  const { readFile } = await import("node:fs/promises");
  const source = await readFile(
    new URL("../../manager/app-host-shell.ts", import.meta.url),
    "utf8"
  );
  assert.match(source, /appHostShellCss = eidosProductiveWorkbenchCss/);
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
  const desktopRuntime = await readFile(
    new URL("../../manager/desktop-workbench-runtime.ts", import.meta.url),
    "utf8"
  );

  assert.doesNotMatch(client, /icon: "dashboard"/);
  assert.match(client, /import\(\s*"\.\/desktop-workbench-runtime\.js"\s*\)/);

  assert.match(desktopRuntime, /icon: "dashboard"/);
  assert.match(desktopRuntime, /icon: "workspace"/);
  assert.doesNotMatch(desktopRuntime, /id: "plugins"/);
  assert.doesNotMatch(desktopRuntime, /id: "memory"/);
  assert.match(desktopRuntime, /icon: "help"/);
  assert.match(desktopRuntime, /id: "help"/);
  assert.match(desktopRuntime, /kind: "workspace-route"/);
  assert.match(desktopRuntime, /route: "\/help"/);
  assert.match(desktopRuntime, /placement: "secondary"/);
  assert.match(desktopRuntime, /icon: "settings"/);
  assert.doesNotMatch(desktopRuntime, /icon: "[▦◇▣⚙]"/);
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


test("Extension Manager receives Host-evaluated runtime readiness and recent operational history", () => {
  const pkg = structuredClone(companyNotesPackage);
  pkg.runtime = { kind: "REMOTE", isolation: "REMOTE", remote: {
    protocol: "EVO-REMOTE-RUNTIME-v0.1",
    endpoint: "https://runtime.example.invalid/invoke",
    hostAccess: "NONE",
    auth: { scheme: "HOST_BEARER", audience: "company-notes" }
  }};
  pkg.publisher = { id: "evo", displayName: "EVO", trust: "VERIFIED" };
  pkg.integrity = {
    format: "EVO-SIGNATURE-v0.1",
    algorithm: "Ed25519",
    keyId: "fixture",
    signature: "x".repeat(32)
  };

  const manager = createAppManagerService(
    createPackageCatalog([pkg]),
    createMemoryLifecycleStore()
  );
  const page = createPluginStorePage([pkg], manager.getSnapshot(), {
    evaluateRuntime() {
      return {
        packageId: pkg.packageId,
        kind: "REMOTE",
        isolation: "REMOTE",
        status: "READY",
        message: "credential Provider available"
      };
    },
    runtimeEvents: [{
      contractVersion: "0.1.0",
      sequence: 7,
      occurredAt: "2026-09-25T12:00:00.000Z",
      packageId: pkg.packageId,
      type: "INVOCATION_FAILED",
      invocationId: "i-7",
      method: "sync",
      durationMs: 18,
      message: "remote error"
    }]
  });

  assert.equal(page.items[0].runtime.status, "ready");
  assert.equal(page.items[0].runtime.history[0].type, "INVOCATION_FAILED");

  const html = renderAppHostPageToHtml(loaded(page));
  assert.match(html, /Recent runtime activity/);
  assert.match(html, /INVOCATION_FAILED/);
  assert.match(html, /remote error/);
});


test("Extension Manager can surface Host-owned product readiness without changing package lifecycle status", () => {
  const manager = createAppManagerService(
    createPackageCatalog([companyNotesPackage]),
    createMemoryLifecycleStore()
  );
  manager.install("company-notes");

  const page = createPluginStorePage([companyNotesPackage], manager.getSnapshot(), {
    evaluateProductState(_pkg, lifecycle) {
      assert.equal(lifecycle.isInstalled, true);
      assert.equal(lifecycle.isEnabled, true);
      return {
        readiness: {
          id: "setup-required",
          label: "Needs setup",
          tone: "warning",
          message: "Complete setup."
        },
        primaryAction: {
          id: "setup",
          label: "Set up",
          type: "navigate",
          route: "/setup"
        }
      };
    }
  });

  assert.equal(page.items[0].status.id, "enabled");
  assert.equal(page.items[0].readiness.id, "setup-required");
  assert.equal(page.items[0].primaryAction.id, "setup");
  assert.equal(page.items[0].primaryAction.route, "/setup");
});
