import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import {
  assertTemplateTransferBundleV010
} from "../../dist/contracts/template-transfer.js";

const definition = JSON.parse(
  readFileSync(
    "apps/template-store/seeds/evo-enterprise-core-v1.definition.json",
    "utf8"
  )
);
const seed = JSON.parse(
  readFileSync(
    "apps/template-store/seeds/evo-ledger-runtime-baseline.v0.1.seed.json",
    "utf8"
  )
);

test("exported EVO Enterprise Core definition is complete", () => {
  assert.equal(definition.schemaVersion, "enterprise-template/1.0");
  assert.equal(definition.templateSemanticVersion, "1.0.0");
  assert.equal(definition.code, "enterprise-core");
  assert.equal(definition.domains.length, 8);
  assert.equal(definition.dimensions.length, 10);
  assert.equal(definition.masterData.length, 6);
  assert.equal(definition.fieldCatalog.length, 17);
  assert.equal(definition.transactionTypes.length, 9);
  assert.equal(definition.applications.length, 9);
  assert.equal(definition.ledgers.length, 11);
  assert.equal(definition.postingRules.length, 15);
  assert.equal(definition.valuationPolicies.length, 4);
  assert.ok(definition.allocationPolicy);
  assert.ok(definition.replayPolicy);
  assert.ok(definition.installation);
});

test("exported Template Store bootstrap Seed is a valid transfer bundle", () => {
  assert.equal(seed.contractVersion, "0.1.0");
  assert.equal(seed.templateId, "evo.ledger-runtime.baseline.v0.1");
  assert.equal(seed.version, 1);

  const bundle = assertTemplateTransferBundleV010(seed.bundle);
  assert.equal(bundle.definition.kind, "LEDGER_RUNTIME_TEMPLATE");
  assert.deepEqual(bundle.definition.payload, definition);
  assert.match(bundle.contentDigest, /^sha256:[0-9a-f]{64}$/);
});
