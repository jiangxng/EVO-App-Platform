import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";

const browserProofs = [
  "tools/browser-lifecycle-production-proof.mjs",
  "tools/eog-mobile-read-production-proof.mjs",
  "tools/mobile-review-production-proof.mjs",
  "tools/mobile-task-inbox-production-proof.mjs",
  "tools/real-browser-rum-budget-proof.mjs",
  "tools/web-security-delivery-production-proof.mjs",
  "tools/browser-surface-network-proof.mjs",
];

test("retired Railway browser proof helpers require an explicit authorized HOST", () => {
  for (const path of browserProofs) {
    const content = readFileSync(path, "utf8");
    assert.match(content, /const host = process\.env\.HOST\?\.trim\(\);/, path);
    assert.match(content, /if \(!host\) throw new Error\("HOST is required;/, path);
    assert.doesNotMatch(content, /ledger-configurator-production\.up\.railway\.app/, path);
  }
});

test("running legacy browser proofs without HOST exits before any browser or remote traffic", () => {
  // The RUM proof imports dist before the HOST guard; source guard is covered
  // above, and its separate build tests exercise the module boundary.
  for (const path of browserProofs.filter(p => !p.includes("real-browser-rum"))) {
    const child = spawnSync(process.execPath, [path], {
      env: { ...process.env, HOST: "", CHROME: "" },
      encoding: "utf8",
      timeout: 5000
    });
    assert.notEqual(child.status, 0, path);
    assert.match(child.stderr, /HOST is required/, path);
  }
});
