import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();

test("CP-06 Host does not own or eagerly initialize BI Workbench", () => {
  const server = readFileSync(resolve(root, "manager/server.ts"), "utf8");
  const client = readFileSync(resolve(root, "manager/app-host-client.ts"), "utf8");
  const legacyPage = readFileSync(
    resolve(root, "manager/workspace-home-page.ts"),
    "utf8"
  );
  const pluginPackage = readFileSync(
    resolve(root, "apps/bi-workbench/package.ts"),
    "utf8"
  );

  assert.doesNotMatch(server, /workspaceHomeExperienceManifest/);
  assert.doesNotMatch(server, /createPostgresPersonalWorkbenchStateStoreV010/);
  assert.doesNotMatch(server, /isHostWorkbenchFeatureV010/);
  assert.match(
    server,
    /import\("\.\.\/apps\/bi-workbench\/runtime\.js"\)/
  );

  assert.doesNotMatch(
    client,
    /window\.location\.hash\s*=\s*["']\/workspace["']/
  );
  assert.match(client, /resolveBrowserDefaultExperienceRouteV010/);

  assert.doesNotMatch(legacyPage, /experienceId\s*:/);
  assert.match(legacyPage, /compatibility import seam only/);

  assert.match(pluginPackage, /packageId:\s*BI_WORKBENCH_PACKAGE_ID_V010/);
  assert.match(pluginPackage, /defaultRoute:\s*BI_WORKBENCH_HOME_ROUTE_V010/);
  assert.match(pluginPackage, /type:\s*"APPLICATION"/);
});
