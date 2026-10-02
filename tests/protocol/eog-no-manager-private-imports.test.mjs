import test from "node:test";
import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";

test("EOG application packages do not import manager-private implementation", async () => {
  const dirs = [
    "apps/eog-2d-designer",
    "apps/eog-2d-viewer",
    "apps/eog-3d-viewer"
  ];

  for (const dir of dirs) {
    const names = (await readdir(dir)).filter(name => name.endsWith(".ts"));
    for (const name of names) {
      const source = await readFile(dir + "/" + name, "utf8");
      assert.equal(
        source.includes("../../manager/"),
        false,
        dir + "/" + name + " imports manager-private implementation"
      );
    }
  }
});
