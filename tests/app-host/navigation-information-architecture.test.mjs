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
  assert.doesNotMatch(source, /id: "plugins"/);
  assert.doesNotMatch(source, /id: "memory"/);
  assert.match(source, /defaultActivityId: "apps"/);
});

test("global Help Center uses the main workspace while remaining secondary navigation", async () => {
  const source = await import("node:fs/promises").then(fs =>
    fs.readFile(
      new URL("../../manager/desktop-workbench-runtime.ts", import.meta.url),
      "utf8"
    )
  );

  const helpStart = source.indexOf('id: "help"');
  assert.notEqual(helpStart, -1);
  const helpBlock = source.slice(helpStart, helpStart + 520);
  assert.match(helpBlock, /kind: "workspace-route"/);
  assert.match(helpBlock, /route: "\/help"/);
  assert.match(helpBlock, /placement: "secondary"/);
  assert.doesNotMatch(helpBlock, /kind: "side-route"/);
});
