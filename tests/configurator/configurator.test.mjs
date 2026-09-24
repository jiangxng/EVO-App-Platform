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

test("all 912 legacy-source posting rules are compiled and burn-ready", () => {
  const service = createLedgerRuntimeConfiguratorService();
  const result = service.validate();
  assert.equal(result.ok, true, JSON.stringify(result.errors, null, 2));
  assert.equal(result.burn.ready, true, JSON.stringify(result.burn.blockers, null, 2));
  assert.deepEqual(result.burn.blockers, []);
  const compiled = service.compileCurrent();
  assert.equal(compiled.rules.length, 912);
  assert.equal(compiled.compiler.compiledExpressionCount, compiled.compiler.uniqueExpressionCount);
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


test("Ledger Runtime Template export/import preserves the complete configuration digest", () => {
  const service = createLedgerRuntimeConfiguratorService();
  const template = service.exportTemplate();
  assert.equal(template.kind, "evo.ledger-runtime.template");
  assert.equal(template.configuration.expressionLanguage, "bookkeeping-aviator-v1");
  assert.ok(template.compatibility.requiredRuntimeCapabilities.includes("expression.bookkeeping-aviator-v1"));
  assert.ok(template.compatibility.requiredRuntimeCapabilities.includes("direction.financial-dr-cr"));
  assert.equal(template.configuration.accounts.length, 141);
  assert.equal(template.configuration.applications.length, 143);
  assert.equal(template.configuration.dictionaries.length, 106);
  assert.equal(template.configuration.postingRules.length, 912);

  const result = service.importTemplate(structuredClone(template));
  assert.equal(result.ok, true);
  assert.equal(result.semanticDigest, template.semanticDigest);
});

test("Ledger Runtime Template rejects content changed without digest update", () => {
  const service = createLedgerRuntimeConfiguratorService();
  const template = service.exportTemplate();
  template.configuration.displayName = "tampered";
  const result = service.importTemplate(template);
  assert.equal(result.ok, false);
  assert.ok(result.errors.some(x => x.code === "TEMPLATE_DIGEST_MISMATCH"));
});

test("financial Dr/Cr directions are valid configuration semantics, not a burn blocker", () => {
  const service = createLedgerRuntimeConfiguratorService();
  const result = service.validate();
  assert.equal(result.burn.blockers.some(x => x.code === "LEDGER_DIRECTION_SEMANTICS_REQUIRED"), false);
});

test("runtime-derived amount symbols compile as runtime builtins without blocking burn", () => {
  const service = createLedgerRuntimeConfiguratorService();
  const result = service.validate();
  assert.equal(result.burn.ready, true, JSON.stringify(result.burn.blockers, null, 2));
  assert.ok(result.warnings.some(x => x.code === "LEDGER_RUNTIME_BUILTINS_PRESENT"));
  const compiled = service.compileCurrent();
  assert.ok(compiled.compiler.builtinNames.length > 0);
  assert.ok(compiled.compiler.builtinNames.includes("cost"));
});
