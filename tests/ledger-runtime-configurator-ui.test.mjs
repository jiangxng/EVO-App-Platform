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
  assert.match(appHostShellHtml, /\/assets\/manager\/app-host-client\.js/);
  assert.equal(pluginStoreExperienceManifest.defaultRoute, "/store");
  assert.equal(pluginStoreExperienceManifest.pages[0].source, pluginStorePageSource);
});

test("Plugin Store is an Eidos Catalog Browser Experience with lifecycle actions", () => {
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
  assert.equal(page.kind, "catalog-browser");
  assert.equal(page.items[0].primaryAction.command, "app-platform.plan-install");
  assert.equal(page.items[0].secondaryActions[0].command, "app-platform.install-package");

  const html = renderAppHostPageToHtml({
    experienceId: "evo-plugin-store",
    packageId: "evo-app-platform",
    featureId: "evo-plugin-store.system",
    route: { id: "store", path: "/store", pageId: "store" },
    page: { id: "store", source: pluginStorePageSource },
    definition: page
  });
  assert.match(html, /data-eidos-capability="catalog-browser"/);
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
