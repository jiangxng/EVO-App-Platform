import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  TR01_BUSINESS_GUARD_FILES_V010,
  inspectTr01BusinessPluginOwnershipV010
} from "../../tools/tr01-business-plugin-ownership-guard.mjs";

async function baseline() {
  const [policyRaw, ...sources] = await Promise.all([
    readFile("architecture.boundary-policy.json", "utf8"),
    ...TR01_BUSINESS_GUARD_FILES_V010.map(path => readFile(path, "utf8"))
  ]);
  return {
    policy: JSON.parse(policyRaw),
    files: Object.fromEntries(
      TR01_BUSINESS_GUARD_FILES_V010.map((path, i) => [path, sources[i]])
    )
  };
}

test("TR-01 business/plugin/EVO boundary currently passes without new finance writes", async () => {
  const input = await baseline();
  assert.deepEqual(inspectTr01BusinessPluginOwnershipV010(input), []);
});

test("TR-01 boundary fails if Application business events start using private SQL or Host manager", async () => {
  const input = await baseline();
  const path = "apps/trading-reference/purchase-loop.ts";
  input.files[path] = 'import { Pool } from "pg";\n'
    + 'import { internal } from "../../manager/internal.js";\n'
    + input.files[path];
  const errors = inspectTr01BusinessPluginOwnershipV010(input);
  assert.ok(errors.some(error => error.includes("direct SQL/database implementation import")));
  assert.ok(errors.some(error => error.includes("Host private manager")));
});

test("TR-01 boundary fails if installed read-only plugin silently gains finance WRITE", async () => {
  const input = await baseline();
  const path = "apps/trading-reference/package.ts";
  assert.match(input.files[path], /effect:\s*"READ"/u);
  input.files[path] = input.files[path].replace('effect: "READ"', 'effect: "WRITE"');
  const errors = inspectTr01BusinessPluginOwnershipV010(input);
  assert.ok(errors.some(error => error.includes("remain read-only")));
});

test("TR-01 boundary fails if B2D3 preflight starts authorizing execution", async () => {
  const input = await baseline();
  const path = "apps/trading-reference/finance-intent-admission.ts";
  assert.match(input.files[path], /executionAllowed:\s*false/u);
  input.files[path] = input.files[path].replaceAll(/executionAllowed:\s*false/gu, "executionAllowed: true");
  const errors = inspectTr01BusinessPluginOwnershipV010(input);
  assert.ok(errors.some(error => error.includes("executionAllowed:false")));
});

test("TR-01 boundary fails if owner policy is changed to move ledger responsibility into Host", async () => {
  const input = await baseline();
  input.policy.businessPluginOwnership.tr01.deterministicLedgerOwner = "EVO-App-Platform";
  const errors = inspectTr01BusinessPluginOwnershipV010(input);
  assert.ok(errors.some(error => error.includes("policy drift: deterministicLedgerOwner")));
});

test("TR-01 boundary fails when business facts are moved away from the public EVO port", async () => {
  const input = await baseline();
  const path = "apps/trading-reference/sales-loop.ts";
  input.files[path] = input.files[path].replace(
    "input.adapter.submit({", "privateLedgerWriter({"
  );
  const errors = inspectTr01BusinessPluginOwnershipV010(input);
  assert.ok(errors.some(error => error.includes("public EVO adapter")));
});
