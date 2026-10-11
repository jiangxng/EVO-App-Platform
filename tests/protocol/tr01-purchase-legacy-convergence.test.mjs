import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("TR-01A2 modern Purchase/Receipt reversal delegates to EVO via immutable public BusinessData facts", () => {
  const source = readFileSync("apps/trading-reference/purchase-loop.ts", "utf8");
  assert.match(source, /businessDataType: "purchase_order\.approved"/);
  assert.match(source, /businessDataType: "goods_receipt\.received"/);
  assert.match(source, /businessDataType: "goods_receipt\.reversed"/);
  assert.match(source, /causationId: originalBusinessDataId/);
  assert.match(source, /relationType: "REVERSES"/);
  assert.match(source, /relationType: "FULFILLS"/);
  assert.match(source, /const submission = await input\.adapter\.submit\(\{/);
  assert.doesNotMatch(source, /CREATE TABLE|INSERT INTO|UPDATE ledger|calculateFIFO|applyAllocation/i);
});

test("TR-01A2 public cross-project reversal replay regression remains active", () => {
  const workflow = readFileSync(".github/workflows/cross-project-evo-business-data.yml", "utf8");
  const certification = readFileSync("tools/certify-tr01-purchase-evo-postgres.mjs", "utf8");
  const tests = readFileSync("tests/protocol/tr01-purchase-reference-loop.test.mjs", "utf8");
  assert.match(workflow, /validate:tr01-purchase-receipt-reversal/);
  assert.match(certification, /REVERSES/);
  assert.match(tests, /TR-01A2 composes an immutable receipt-reversal fact/);
  assert.match(tests, /TR-01A2 rejects invalid reversal identity/);
});
