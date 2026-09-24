import test from "node:test";
import assert from "node:assert/strict";
import { createLedgerRuntimeConfiguratorService } from "../../dist/apps/ledger-runtime-configurator/service.js";
import {
  bookkeepingDefaultConfiguration,
  bookkeepingReferenceLegacyPostingRules
} from "../../dist/apps/ledger-runtime-configurator/default-library.js";

test("bookkeeping default library is complete at the imported baseline", () => {
  assert.equal(bookkeepingDefaultConfiguration.accounts.length, 141);
  assert.equal(bookkeepingDefaultConfiguration.applications.length, 143);
  assert.equal(bookkeepingDefaultConfiguration.dictionaries.length, 106);
  assert.equal(bookkeepingDefaultConfiguration.postingRules.length, 912);
  assert.equal(bookkeepingReferenceLegacyPostingRules.length, 587);
});

test("bookkeeping baseline has no dangling application or ledger references", () => {
  const service = createLedgerRuntimeConfiguratorService();
  const result = service.validate();
  assert.equal(result.ok, true);
  assert.deepEqual(result.errors, []);
  assert.equal(result.summary.accounts, 141);
  assert.equal(result.summary.applications, 143);
  assert.equal(result.summary.dictionaries, 106);
  assert.equal(result.summary.postingRules, 912);
});

test("legacy expressions are preserved but burn is blocked until compiled", () => {
  const service = createLedgerRuntimeConfiguratorService();
  const result = service.validate();
  assert.equal(result.burn.ready, false);
  const blocker = result.burn.blockers.find(x => x.code === "LEGACY_EXPRESSION_COMPILER_REQUIRED");
  assert.ok(blocker);
  assert.ok((blocker.count ?? 0) > 0);
});

test("export-import round trip preserves semantic digest", () => {
  const service = createLedgerRuntimeConfiguratorService();
  const exported = service.getCurrent();
  const before = service.validate(exported);
  const imported = service.importConfiguration(structuredClone(exported));
  assert.equal(imported.ok, true);
  const after = service.validate();
  assert.equal(after.semanticDigest, before.semanticDigest);
});

test("reference legacy rule set stays separate from the active baseline", () => {
  const service = createLedgerRuntimeConfiguratorService();
  const summary = service.getSummary();
  assert.equal(summary.counts.postingRules, 912);
  assert.equal(summary.counts.referenceLegacyPostingRules, 587);
  assert.equal(summary.sourceLibraries[0].status, "ACTIVE_BASELINE");
  assert.equal(summary.sourceLibraries[1].status, "REFERENCE");
});
