import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
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

// The Platform CI paths filter intentionally excludes most workflow-only PRs.
// The Project Continuity workflow runs this same test for *every* PR/push.
test("archived Railway live proofs cannot re-enter active Actions workflows", () => {
  const archiveDir = "docs/archive/railway-live-production-proof-actions-20261113";
  const archived = readdirSync(archiveDir)
    .filter(name => /\.ya?ml$/i.test(name));
  assert.equal(archived.length, 10, "ten original Railway proof YAMLs must remain archived");

  const workflowDir = ".github/workflows";
  const active = readdirSync(workflowDir)
    .filter(name => /\.ya?ml$/i.test(name));
  for (const name of archived) {
    assert.ok(!active.includes(name), `retired Railway proof reactivated: ${name}`);
  }
  for (const name of active) {
    const body = readFileSync(`${workflowDir}/${name}`, "utf8");
    assert.doesNotMatch(
      body, /[a-z0-9-]+\.up\.railway\.app\b/i,
      `active Action ${name} must not target a legacy Railway service`
    );
  }
});
