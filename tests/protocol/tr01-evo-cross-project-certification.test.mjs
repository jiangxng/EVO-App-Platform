import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("TR-01A cross-project certification pins the EVO dimension-filtered Ledger read merge", async () => {
  const source = await readFile(
    ".github/workflows/cross-project-evo-business-data.yml",
    "utf8"
  );

  assert.equal(
    source.includes(
      "EVO_CERTIFIED_COMMIT: 2311022640aa108a6baf3db44d9b26bd3e3ad623"
    ),
    true
  );
  assert.equal(
    source.includes("tools/certify-tr01-purchase-evo-postgres.mjs"),
    true
  );
  assert.equal(source.includes("postgres:18"), true);
});

test("TR-01A certification uses App Platform authorities and public EVO APIs only", async () => {
  const source = await readFile(
    "tools/certify-tr01-purchase-evo-postgres.mjs",
    "utf8"
  );

  assert.equal(source.includes("createCounterpartyRepositoryV010"), true);
  assert.equal(source.includes("createCounterpartyRoleRepositoryV010"), true);
  assert.equal(source.includes("createItemRepositoryV010"), true);
  assert.equal(source.includes("createWarehouseRepositoryV010"), true);
  assert.equal(source.includes("createEvoBusinessDataHttpAdapterV010"), true);
  assert.equal(source.includes("/api/v1/runtime-observations/query"), true);
  assert.equal(source.includes("/api/v1/work-items"), true);
  assert.equal(source.includes("/api/v1/ledgers/"), true);
  assert.equal(source.includes("../evo/"), false);
  assert.equal(source.includes("node_modules/"), false);
  assert.equal(source.includes("business_object_link"), false);
  assert.equal(source.includes("ledger_balance"), false);
});

test("TR-01A receipt contract carries explicit FULFILLS relation", async () => {
  const source = await readFile(
    "apps/trading-reference/purchase-loop.ts",
    "utf8"
  );

  assert.equal(source.includes('relationType: "FULFILLS"'), true);
  assert.equal(
    source.includes('businessDataType: "purchase_order.approved"'),
    true
  );
  assert.equal(
    source.includes('businessDataType: "goods_receipt.received"'),
    true
  );
  assert.equal(source.includes('movementType: "PURCHASE_RECEIPT"'), true);
});
