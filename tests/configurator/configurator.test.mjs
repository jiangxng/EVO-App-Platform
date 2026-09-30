import test from "node:test";
import assert from "node:assert/strict";
import { createLedgerRuntimeConfiguratorService } from "../../dist/apps/ledger-runtime-configurator/service.js";
import {
  createLedgerRuntimeConfiguratorCapabilityActionHandlers
} from "../../dist/apps/ledger-runtime-configurator/action-handler.js";
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


function request(commandCode, values = {}) {
  return {
    contractVersion: "0.1.0",
    type: "command",
    command: { code: commandCode, inputVersion: "0.1.0" },
    values,
    sourceInteractionId: "test-interaction",
    actionId: "test-action",
    requiresConfirmation: false
  };
}

test("Ledger Runtime describe operation returns bounded semantic template metadata", async () => {
  const service = createLedgerRuntimeConfiguratorService();
  const handlers = createLedgerRuntimeConfiguratorCapabilityActionHandlers(service);
  const describe = handlers.find(
    item => item.commandCode === "evo-ledger-runtime-configurator.describe"
  );
  const result = await describe.execute(
    request("evo-ledger-runtime-configurator.describe")
  );

  assert.equal(result.ok, true);
  assert.equal(result.result.contractVersion, "0.1.0");
  assert.equal(result.result.counts.accounts, 141);
  assert.equal(result.result.counts.applications, 143);
  assert.equal(result.result.counts.dictionaries, 106);
  assert.equal(result.result.counts.postingRules, 912);
  assert.equal(result.result.sections.length, 4);
  assert.equal(Array.isArray(result.result.requiredRuntimeCapabilities), true);
  assert.equal("configuration" in result.result, false);
});

test("Ledger Runtime section read paginates and binds cursor to semantic digest", async () => {
  const service = createLedgerRuntimeConfiguratorService();
  const handlers = createLedgerRuntimeConfiguratorCapabilityActionHandlers(service);
  const read = handlers.find(
    item => item.commandCode === "evo-ledger-runtime-configurator.section.read"
  );

  const first = await read.execute(
    request(
      "evo-ledger-runtime-configurator.section.read",
      { section: "postingRules", limit: 25 }
    )
  );
  assert.equal(first.ok, true);
  assert.equal(first.result.items.length, 25);
  assert.equal(first.result.page.offset, 0);
  assert.equal(first.result.page.total, 912);
  assert.equal(typeof first.result.page.nextCursor, "string");

  const second = await read.execute(
    request(
      "evo-ledger-runtime-configurator.section.read",
      {
        section: "postingRules",
        limit: 25,
        cursor: first.result.page.nextCursor
      }
    )
  );
  assert.equal(second.ok, true);
  assert.equal(second.result.page.offset, 25);
  assert.equal(second.result.items.length, 25);
  assert.equal(second.result.semanticDigest, first.result.semanticDigest);

  const changed = service.getCurrent();
  changed.displayName = changed.displayName + " v2";
  assert.equal(service.importConfiguration(changed).ok, true);

  const stale = await read.execute(
    request(
      "evo-ledger-runtime-configurator.section.read",
      {
        section: "postingRules",
        limit: 25,
        cursor: first.result.page.nextCursor
      }
    )
  );
  assert.equal(stale.ok, false);
  assert.equal(stale.error.code, "LEDGER_CONFIGURATION_CURSOR_STALE");
});

test("Ledger Runtime section read validates section, page size and cursor section", async () => {
  const service = createLedgerRuntimeConfiguratorService();
  const handlers = createLedgerRuntimeConfiguratorCapabilityActionHandlers(service);
  const read = handlers.find(
    item => item.commandCode === "evo-ledger-runtime-configurator.section.read"
  );

  const invalidLimit = await read.execute(
    request(
      "evo-ledger-runtime-configurator.section.read",
      { section: "accounts", limit: 1000 }
    )
  );
  assert.equal(invalidLimit.ok, false);
  assert.equal(
    invalidLimit.error.code,
    "LEDGER_CONFIGURATION_SECTION_INPUT_INVALID"
  );

  const accounts = await read.execute(
    request(
      "evo-ledger-runtime-configurator.section.read",
      { section: "accounts", limit: 10 }
    )
  );
  assert.equal(accounts.ok, true);

  const mismatch = await read.execute(
    request(
      "evo-ledger-runtime-configurator.section.read",
      {
        section: "applications",
        limit: 10,
        cursor: accounts.result.page.nextCursor
      }
    )
  );
  assert.equal(mismatch.ok, false);
  assert.equal(
    mismatch.error.code,
    "LEDGER_CONFIGURATION_CURSOR_SECTION_MISMATCH"
  );
});
