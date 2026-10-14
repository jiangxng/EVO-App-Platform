import test from 'node:test';
import assert from 'node:assert/strict';
import { compileLedgerDefinitionForPublicationV010 as compile } from '../../dist/apps/ledger-manager/internal/publication-compiler.js';
import { createLedgerRuntimeConfiguratorService } from '../../dist/apps/ledger-runtime-configurator/service.js';
import { ledgerManagerPackage } from '../../dist/apps/ledger-manager/package.js';
import { ledgerRuntimeConfiguratorPackage } from '../../dist/catalog/seed.js';

test('publication uses the same deterministic compiler without requiring the legacy plugin', () => {
  const legacy = createLedgerRuntimeConfiguratorService();
  const template = legacy.exportTemplate();
  const before = structuredClone(template);
  assert.deepEqual(compile(template), legacy.compileCurrent());
  assert.deepEqual(template, before);
  assert.equal(ledgerManagerPackage.features.some(feature =>
    feature.requiresCapabilities?.includes('evo.ledger-runtime.configurator')), false);
  assert.equal(ledgerRuntimeConfiguratorPackage.packageId, 'evo-ledger-runtime-configurator');
  assert.ok(ledgerRuntimeConfiguratorPackage.features[0].providesCapabilities.includes('ledger.runtime.configuration'));
});

test('failed publication cannot fall back to defaults or contaminate the next publication', () => {
  const template = createLedgerRuntimeConfiguratorService().exportTemplate();
  const expected = compile(template);
  const corrupted = structuredClone(template);
  corrupted.semanticDigest = 'invalid';
  assert.throws(() => compile(corrupted), /LEDGER_MANAGER_TEMPLATE_NOT_RUNTIME_READY.*TEMPLATE_DIGEST_MISMATCH/);
  assert.deepEqual(compile(template), expected);
});

test('legacy mutable configuration is isolated from publication in both directions', () => {
  const legacy = createLedgerRuntimeConfiguratorService();
  const original = legacy.exportTemplate();
  const changed = legacy.getCurrent();
  changed.configurationId = 'legacy-only';
  assert.equal(legacy.importConfiguration(changed).ok, true);
  const before = legacy.exportTemplate();
  const result = compile(original);
  assert.equal(result.semanticDigest, original.semanticDigest);
  assert.deepEqual(legacy.exportTemplate(), before);
  assert.notEqual(result.semanticDigest, before.semanticDigest);
});
