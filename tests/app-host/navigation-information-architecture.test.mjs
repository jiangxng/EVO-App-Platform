import test from "node:test";
import assert from "node:assert/strict";

import {
  pluginStoreExperienceManifest
} from "../../dist/manager/plugin-store-page.js";
import {
  enterpriseContextGovernanceAppPackage
} from "../../dist/apps/enterprise-context-governance/package.js";
import {
  ledgerManagerPackage
} from "../../dist/apps/ledger-manager/package.js";
import {
  templateStorePackage
} from "../../dist/apps/template-store/package.js";

function experienceManifest(pkg) {
  const contribution = pkg.features
    .flatMap(feature => feature.contributions ?? [])
    .find(item => item.kind === "eidos.experience");
  assert.ok(contribution);
  return contribution.manifest;
}

test("low-frequency administration stays out of persistent Applications navigation", () => {
  assert.deepEqual(pluginStoreExperienceManifest.navigation ?? [], []);
  assert.deepEqual(
    experienceManifest(enterpriseContextGovernanceAppPackage).navigation ?? [],
    []
  );
  assert.deepEqual(
    experienceManifest(ledgerManagerPackage).navigation ?? [],
    []
  );
  assert.deepEqual(
    experienceManifest(templateStorePackage).navigation ?? [],
    []
  );
});

test("primary Workbench activities contain work context, not system administration", async () => {
  const source = await import("node:fs/promises").then(fs =>
    fs.readFile(
      new URL("../../manager/desktop-workbench-runtime.ts", import.meta.url),
      "utf8"
    )
  );

  assert.match(source, /id: "apps"/);
  assert.match(source, /id: "workspace"/);
  assert.match(source, /id: "help"/);
  assert.match(source, /id: "settings"/);
  assert.match(
    source,
    /id: "help"[\s\S]*?kind: "workspace-route"[\s\S]*?route: "\/help"/
  );
  assert.doesNotMatch(source, /id: "plugins"/);
  assert.doesNotMatch(source, /id: "memory"/);
  assert.match(source, /defaultActivityId: "apps"/);
});


test("successful business actions may navigate the Workbench to a declared internal route", async () => {
  const source = await import("node:fs/promises").then(fs =>
    fs.readFile(
      new URL("../../manager/desktop-workbench-runtime.ts", import.meta.url),
      "utf8"
    )
  );

  assert.match(
    source,
    /const navigateTo =[\s\S]*?typeof payload\?\.navigateTo === "string"[\s\S]*?navigateTo\.startsWith\("\/"\)[\s\S]*?workbench\?\.navigateWorkspace\(navigateTo\)/
  );
});


test("vendored Eidos Workbench owns action-result navigation and empty-hash recovery", async () => {
  const source = await import("node:fs/promises").then(fs =>
    fs.readFile(
      new URL("../../vendor/eidos/src/workbench/shell.ts", import.meta.url),
      "utf8"
    )
  );

  assert.match(source, /function actionResultNavigateToV010/);
  assert.match(
    source,
    /const navigateTo = actionResultNavigateToV010\(result\);[\s\S]*?await navigateWorkspace\(navigateTo\)/
  );
  assert.match(source, /window\.history\.replaceState/);
  assert.match(source, /void navigateWorkspace\(fallback\)/);
});


test("Desktop Workbench forwards qualified route read options to the page source", async () => {
  const source = await import("node:fs/promises").then(fs =>
    fs.readFile(
      new URL("../../manager/desktop-workbench-runtime.ts", import.meta.url),
      "utf8"
    )
  );

  assert.match(
    source,
    /loadPage\(page, readOptions\)\s*\{\s*return source\.loadPage\(page, readOptions\);\s*\}/
  );
});


test("vendored ActionHost preserves EVO context headers while localizing actions", async () => {
  const source = await import("node:fs/promises").then(fs =>
    fs.readFile(
      new URL("../../vendor/eidos/src/app-host/app-manager-action-host.ts", import.meta.url),
      "utf8"
    )
  );

  assert.match(source, /request\.values\.activeContext/);
  assert.match(source, /"x-evo-context-id"/);
  assert.match(source, /options\.locale\?\.\(\)\?\.trim\(\)/);
  assert.match(source, /searchParams\.set\("locale", locale\)/);
});
