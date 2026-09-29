import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("browser bootstrap keeps desktop Workbench and mobile runtime behind dynamic Surface boundaries", async () => {
  const bootstrap = await readFile(
    new URL("../../dist/manager/app-host-client.js", import.meta.url),
    "utf8"
  );
  const mobile = await readFile(
    new URL("../../dist/manager/mobile-task-runtime.js", import.meta.url),
    "utf8"
  );

  assert.doesNotMatch(
    bootstrap,
    /from ["']\.\.\/vendor\/eidos\/src\/workbench\//
  );
  assert.match(
    bootstrap,
    /import\(["']\.\/desktop-workbench-runtime\.js["']\)/
  );
  assert.match(
    bootstrap,
    /import\(["']\.\/mobile-task-runtime\.js["']\)/
  );

  assert.doesNotMatch(mobile, /workbench/);
  assert.doesNotMatch(mobile, /diagram\/surface/);
  assert.doesNotMatch(mobile, /spatial\/surface/);
  assert.match(mobile, /data-evo-mobile-task-runtime/);
});

test("Surface Gateway does not import App Host aggregate barrel", async () => {
  const gateway = await readFile(
    new URL("../../dist/manager/browser-surface-gateway.js", import.meta.url),
    "utf8"
  );

  assert.doesNotMatch(gateway, /app-host\/index\.js/);
  assert.match(gateway, /app-host\/surface\.js/);
  assert.match(gateway, /app-host\/surface-handoff\.js/);
});
