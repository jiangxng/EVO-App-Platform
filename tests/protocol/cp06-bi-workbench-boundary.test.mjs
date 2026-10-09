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
  assert.match(
    server,
    /import\("\.\.\/apps\/bi-workbench\/page\.js"\)/
  );
  assert.doesNotMatch(
    server,
    /from\s+["']\.\.\/apps\/bi-workbench\/runtime\.js["']/
  );
  assert.doesNotMatch(
    server,
    /from\s+["']\.\.\/apps\/bi-workbench\/page\.js["']/
  );
  assert.doesNotMatch(
    server,
    /bi-workbench\/postgres-store\.js/
  );
  assert.match(
    server,
    /EVO_BI_WORKBENCH_AUTOINSTALL\?\.trim\(\)\s*===\s*["']1["']/
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


test("Plugin lazy-loading authority keeps inactive BI Workbench off the heavy Host cold path", () => {
  const authority = readFileSync(
    resolve(root, "docs/architecture/PLUGIN-LAZY-RESOURCE-LOADING-v0.1.md"),
    "utf8"
  );
  const server = readFileSync(resolve(root, "manager/server.ts"), "utf8");
  const runtime = readFileSync(
    resolve(root, "apps/bi-workbench/runtime.ts"),
    "utf8"
  );

  assert.match(authority, /Discover metadata cheaply\. Load implementation only when lifecycle and use require it\./);
  assert.match(authority, /no plugin (?:runtime|persistence|state).*initialization/i);

  // Heavy plugin runtime and page implementation stay behind dynamic imports.
  assert.match(server, /import\("\.\.\/apps\/bi-workbench\/runtime\.js"\)/);
  assert.match(server, /import\("\.\.\/apps\/bi-workbench\/page\.js"\)/);

  // The database adapter belongs behind the plugin runtime, not Host startup.
  assert.doesNotMatch(server, /createPostgresPersonalWorkbenchStateStoreV010/);
  assert.match(runtime, /createPostgresPersonalWorkbenchStateStoreV010/);

  // First-party availability in the catalog is not implicit installation.
  assert.match(server, /EVO_BI_WORKBENCH_AUTOINSTALL\?\.trim\(\)\s*===\s*["']1["']/);
});
