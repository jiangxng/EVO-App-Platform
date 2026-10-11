import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("vendor diagram cancels uncommitted selected-node drag on second touch", async () => {
  const source=await readFile(new URL("../../vendor/eidos/src/diagram/surface.ts",import.meta.url),"utf8");
  assert.match(source,/let cancelActiveNodeDrag:/);
  assert.match(source,/if \(navigationPointers.size >= 2\) \{\s*cancelActiveNodeDrag\?\.\(\);\s*cancelActiveRouteDrag\?\.\(\);\s*\}/);
  assert.match(source,/if \(event.pointerType === "touch" && navigationPointers.size >= 2\)/);
  assert.match(source,/cancelActiveNodeDrag\?\.\(\);/);
  assert.match(source,/cancelledByNavigation \|\| !moved/);
  assert.match(source,/renderContextNavigationV010/);
});
