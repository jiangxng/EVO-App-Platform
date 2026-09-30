import test from "node:test";
import assert from "node:assert/strict";
import { appHostShellHtml } from "../dist/manager/app-host-shell.js";
import {
  createPluginStorePage,
  pluginStoreExperienceManifest,
  pluginStorePageSource
} from "../dist/manager/plugin-store-page.js";
import { renderAppHostPageToHtml } from "../dist/vendor/eidos/src/app-host/browser-shell.js";

test("EVO product entry boots the canonical Eidos App Host", () => {
  assert.match(appHostShellHtml, /id="app"/);
  assert.match(appHostShellHtml, /\/assets\/dev\/manager\/app-host-client\.js/);
  assert.equal(pluginStoreExperienceManifest.defaultRoute, "/store");
  assert.equal(pluginStoreExperienceManifest.pages[0].source, pluginStorePageSource);
});

test("Plugin Store is an Eidos Extension Manager Experience with lifecycle actions", () => {
  const packages = [{
    contractVersion: "0.1.0",
    packageId: "demo-app",
    displayName: "Demo App",
    version: "1.0.0",
    type: "APPLICATION",
    features: [{
      contractVersion: "0.1.0",
      featureId: "demo-app.default",
      packageId: "demo-app",
      version: "1.0.0",
      activationScope: "INSTALLATION",
      defaultActivation: true,
      contributions: [{
        kind: "eidos.experience",
        manifest: {
          contractVersion: "0.1.0",
          experienceId: "demo-app",
          packageId: "demo-app",
          featureId: "demo-app.default",
          defaultRoute: "/demo",
          pages: [{ id: "demo.home", source: "app://demo/home" }],
          routes: [{ id: "demo.home", path: "/demo", pageId: "demo.home" }]
        }
      }]
    }]
  }];
  const emptySnapshot = {
    contractVersion: "0.1.0",
    installedPackages: [],
    activeFeatures: [],
    effectiveCapabilities: []
  };
  const page = createPluginStorePage(packages, emptySnapshot);
  assert.equal(page.kind, "extension-manager");
  assert.equal(page.items[0].primaryAction.command, "app-platform.install-package");
  assert.equal(page.items[0].secondaryActions[0].command, "app-platform.plan-install");

  const html = renderAppHostPageToHtml({
    experienceId: "evo-plugin-store",
    packageId: "evo-app-platform",
    featureId: "evo-plugin-store.system",
    route: { id: "store", path: "/store", pageId: "store" },
    page: { id: "store", source: pluginStorePageSource },
    definition: page
  });
  assert.match(html, /data-eidos-capability="extension-manager"/);
  assert.match(html, /data-eidos-command="app-platform\.plan-install"/);
});

test("installed Plugin Store item becomes an App Host navigation action", () => {
  const packages = [{
    contractVersion: "0.1.0",
    packageId: "demo-app",
    displayName: "Demo App",
    version: "1.0.0",
    type: "APPLICATION",
    features: [{
      contractVersion: "0.1.0",
      featureId: "demo-app.default",
      packageId: "demo-app",
      version: "1.0.0",
      activationScope: "INSTALLATION",
      defaultActivation: true,
      contributions: [{
        kind: "eidos.experience",
        manifest: {
          contractVersion: "0.1.0",
          experienceId: "demo-app",
          packageId: "demo-app",
          featureId: "demo-app.default",
          defaultRoute: "/demo",
          pages: [{ id: "demo.home", source: "app://demo/home" }],
          routes: [{ id: "demo.home", path: "/demo", pageId: "demo.home" }]
        }
      }]
    }]
  }];
  const installedSnapshot = {
    contractVersion: "0.1.0",
    installedPackages: [{ packageId: "demo-app", version: "1.0.0", installedAt: "2026-09-24T00:00:00Z" }],
    activeFeatures: [{ featureId: "demo-app.default", packageId: "demo-app", version: "1.0.0", activatedAt: "2026-09-24T00:00:00Z" }],
    effectiveCapabilities: []
  };
  const page = createPluginStorePage(packages, installedSnapshot);
  assert.equal(page.items[0].primaryAction.type, "navigate");
  assert.equal(page.items[0].primaryAction.route, "/demo");
});


test("installed Configurator is visible and renderable through Eidos App Host", async () => {
  const { createPackageCatalog } = await import("../dist/catalog/catalog.js");
  const { createMemoryLifecycleStore } = await import("../dist/manager/store.js");
  const { createAppManagerService } = await import("../dist/manager/service.js");
  const {
    evoFoundationPackage,
    ledgerRuntimeConfiguratorPackage,
    referenceExperienceAssets
  } = await import("../dist/catalog/seed.js");
  const {
    createAppHost,
    createMemoryExperienceSource
  } = await import("../dist/vendor/eidos/src/app-host/index.js");

  const manager = createAppManagerService(
    createPackageCatalog([evoFoundationPackage, ledgerRuntimeConfiguratorPackage]),
    createMemoryLifecycleStore(),
    () => new Date("2026-09-24T00:00:00Z"),
    referenceExperienceAssets
  );

  manager.install("evo-ledger-runtime-configurator");
  const manifests = manager.listEffectiveExperiences();
  const source = createMemoryExperienceSource(
    manifests,
    {
      "app://evo-ledger-runtime-configurator/pages/home":
        manager.loadExperiencePage("app://evo-ledger-runtime-configurator/pages/home")
    }
  );
  const host = createAppHost(source);
  const snapshot = await host.refresh();

  assert.ok(snapshot.navigation.some(x => x.route === "/ledger-runtime-configurator"));
  assert.ok(host.resolveRoute("/ledger-runtime-configurator"));

  const loaded = await host.loadRoute("/ledger-runtime-configurator");
  assert.equal(loaded.page.id, "evo-ledger-runtime-configurator.home");
  const html = renderAppHostPageToHtml(loaded);
  assert.match(html, /Ledger Runtime Configurator/);
  assert.match(html, /evo-ledger-runtime-configurator\.validate-default/);
});

test("Plugin Store exposes disable enable and uninstall states", () => {
  const pkg = {
    contractVersion: "0.1.0",
    packageId: "demo-app",
    displayName: "Demo App",
    version: "1.0.0",
    type: "APPLICATION",
    features: [{
      contractVersion: "0.1.0",
      featureId: "demo-app.default",
      packageId: "demo-app",
      version: "1.0.0",
      activationScope: "INSTALLATION",
      defaultActivation: true,
      contributions: [{
        kind: "eidos.experience",
        manifest: {
          contractVersion: "0.1.0",
          experienceId: "demo-app",
          packageId: "demo-app",
          featureId: "demo-app.default",
          defaultRoute: "/demo",
          pages: [{ id: "demo.home", source: "app://demo/home" }],
          routes: [{ id: "demo.home", path: "/demo", pageId: "demo.home" }]
        }
      }]
    }]
  };

  const enabled = createPluginStorePage([pkg], {
    contractVersion: "0.1.0",
    installedPackages: [{ packageId: "demo-app", version: "1.0.0", installedAt: "2026-09-24T00:00:00Z" }],
    activeFeatures: [{ featureId: "demo-app.default", packageId: "demo-app", version: "1.0.0", activatedAt: "2026-09-24T00:00:00Z" }],
    effectiveCapabilities: []
  });
  assert.equal(enabled.items[0].status.label, "Enabled");
  assert.equal(enabled.items[0].primaryAction.id, "open");
  assert.ok(enabled.items[0].secondaryActions.some(x => x.command === "app-platform.disable-package"));
  assert.ok(enabled.items[0].secondaryActions.some(x => x.command === "app-platform.uninstall-package"));

  const disabled = createPluginStorePage([pkg], {
    contractVersion: "0.1.0",
    installedPackages: [{ packageId: "demo-app", version: "1.0.0", installedAt: "2026-09-24T00:00:00Z" }],
    activeFeatures: [],
    effectiveCapabilities: []
  });
  assert.equal(disabled.items[0].status.label, "Disabled");
  assert.equal(disabled.items[0].primaryAction.command, "app-platform.enable-package");
  assert.ok(disabled.items[0].secondaryActions.some(x => x.command === "app-platform.uninstall-package"));
});
