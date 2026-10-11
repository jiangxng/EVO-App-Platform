import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("3D Viewer owns a neutral Spatial Workspace implementation", async () => {
  const source = await readFile("apps/eog-3d/workspace-page.ts", "utf8");
  assert.equal(source.includes("SpatialWorkspacePageV010"), true);
  assert.equal(source.includes('kind: "spatial-workspace"'), true);
  assert.equal(source.includes("projectEnterpriseOperatingGraphSpatialBaseV010"), true);
  assert.equal(source.includes("ObservatoryProviderResolver"), false);
  assert.equal(source.includes("eog/observatory-input.js"), false);
});

test("Spatial Observatory is physically peer-owned with compatibility wrappers", async () => {
  const peer = await readFile(
    "apps/enterprise-observatory/spatial-page.ts",
    "utf8"
  );
  assert.equal(peer.includes("ENTERPRISE_OBSERVATORY_PACKAGE_ID"), true);
  assert.equal(peer.includes("projectEnterpriseOperatingGraphSpatialBaseV010"), true);
  assert.equal(peer.includes("eog/observatory-input.js"), true);

  const wrapper = await readFile(
    "apps/eog-3d-viewer/spatial-page.ts",
    "utf8"
  );
  assert.equal(
    wrapper.trim(),
    'export * from "../enterprise-observatory/spatial-page.js";'
  );
});
