import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("2D Viewer owns its interactive Workspace while Observatory is peer-owned", async () => {
  const viewer = await readFile(
    "apps/eog-2d-viewer/workspace-page.ts",
    "utf8"
  );
  assert.equal(
    viewer.includes("projectEnterpriseOperatingGraphDiagramBaseV010"),
    true
  );
  assert.equal(viewer.includes("ObservatoryProviderResolver"), false);
  assert.equal(viewer.includes("operationCommand"), false);

  const peerOwned = [
    "apps/enterprise-observatory/observatory-actions.ts",
    "apps/enterprise-observatory/agent-tools.ts",
    "apps/enterprise-observatory/mobile-read-page.ts",
    "apps/enterprise-observatory/desktop-page.ts"
  ];
  const contents = await Promise.all(
    peerOwned.map(path => readFile(path, "utf8"))
  );
  assert.equal(
    contents.every(content =>
      content.includes("ENTERPRISE_OBSERVATORY_PACKAGE_ID")
    ),
    true
  );
});

test("legacy Viewer Observatory modules are compatibility re-exports only", async () => {
  const paths = [
    "apps/eog-2d-viewer/observatory-actions.ts",
    "apps/eog-2d-viewer/agent-tools.ts",
    "apps/eog-2d-viewer/mobile-read-page.ts",
    "apps/eog-2d-viewer/desktop-page.ts"
  ];
  const wrappers = await Promise.all(
    paths.map(path => readFile(path, "utf8"))
  );
  assert.equal(
    wrappers.every(content =>
      content.trim().startsWith('export * from "../enterprise-observatory/')
    ),
    true
  );
});
