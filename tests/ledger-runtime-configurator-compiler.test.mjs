import test from "node:test";
import assert from "node:assert/strict";
import { createLedgerRuntimeConfiguratorService } from "../dist/apps/ledger-runtime-configurator/service.js";

test("bookkeeping defaults compile to EVO Expression IR", () => {
  const service = createLedgerRuntimeConfiguratorService();
  const validation = service.validate();
  assert.equal(validation.ok, true, JSON.stringify(validation.errors, null, 2));
  assert.equal(validation.burn.ready, true, JSON.stringify(validation.burn.blockers, null, 2));

  const compiled = service.compileCurrent();
  assert.equal(compiled.rules.length, 912);
  assert.equal(compiled.compiler.compiledExpressionCount, compiled.compiler.uniqueExpressionCount);
  assert.equal(compiled.compiler.uniqueExpressionCount, 401);
  assert.ok(compiled.compiler.builtinNames.includes("cost"));
  assert.ok(compiled.compiler.builtinNames.includes("creditCost"));
});
