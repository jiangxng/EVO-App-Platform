import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("Template Store and 2D Viewer runtime resources are not eagerly imported by Host", () => {
  const seed = readFileSync("catalog/seed.ts", "utf8");
  const server = readFileSync("manager/server.ts", "utf8");

  assert.doesNotMatch(
    seed,
    /templateStoreExperienceAssets/
  );

  assert.doesNotMatch(
    server,
    /import\s*\{[^}]*createFileTemplateStoreRepositoryV010[^}]*\}\s*from\s*"\.\.\/apps\/template-store\/repository\.js"/s
  );
  assert.doesNotMatch(
    server,
    /from\s*"\.\.\/apps\/template-store\/copy-action\.js"/
  );
  assert.doesNotMatch(
    server,
    /from\s*"\.\.\/apps\/eog-2d-viewer\/workspace-page\.js"/
  );

  assert.match(
    server,
    /import\(\s*"\.\.\/apps\/template-store\/experience-assets\.js"\s*\)/
  );
  assert.match(
    server,
    /import\(\s*"\.\.\/apps\/template-store\/copy-action\.js"\s*\)/
  );
  assert.match(
    server,
    /import\(\s*"\.\.\/apps\/eog-2d-viewer\/workspace-page\.js"\s*\)/
  );

  assert.doesNotMatch(
    server,
    /manager\.install\(EOG_2D_VIEWER_PACKAGE_ID\)/
  );
  assert.doesNotMatch(
    server,
    /manager\.install\(EOG_2D_DESIGNER_PACKAGE_ID\)/
  );
});
