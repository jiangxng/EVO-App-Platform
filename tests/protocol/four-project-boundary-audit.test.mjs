import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("App Platform does not collapse Experience Compiler into Enterprise Agent package identity", async () => {
  const architecture = await readFile("ARCHITECTURE.md", "utf8");
  assert.equal(
    architecture.includes("Experience Compiler is an independent owner project"),
    true
  );
  assert.equal(
    architecture.includes("former EC / Experience Compiler concept is being redefined"),
    false
  );
});

test("four-project audit keeps SOP deferred and names the four current owners", async () => {
  const audit = JSON.parse(await readFile(
    "docs/architecture/four-project-contract-boundary-audit.v0.1.json",
    "utf8"
  ));
  assert.deepEqual(
    Object.keys(audit.projects).sort(),
    ["EVO", "EVO-App-Platform", "Eidos", "Experience-Compiler"].sort()
  );
  assert.equal(audit.sop, "DEFERRED_PRESERVED");
});
