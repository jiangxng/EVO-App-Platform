import test from 'node:test';
import assert from 'node:assert/strict';
import { createMemorySettingsStore } from '../../dist/manager/settings-store.js';
import { createStartupDefaultsV010 } from '../../dist/manager/startup-defaults.js';

test('bootstrap respects existing inactive installs and remembered uninstall', () => {
  const journal = createMemorySettingsStore();
  let installs = 0;
  const apply = installed => createStartupDefaultsV010(journal).apply({
    packageId: 'optional', installed, install() { installs++; }
  });
  assert.equal(apply(true), 'PRESERVED');
  assert.equal(apply(false), 'PRESERVED');
  assert.equal(installs, 0);
});

test('unready and failed defaults retry; successful defaults run once', () => {
  const journal = createMemorySettingsStore();
  const defaults = createStartupDefaultsV010(journal);
  let installs = 0;
  const input = { packageId: 'optional', installed: false, install() { installs++; } };
  assert.equal(defaults.apply({ ...input, ready: false }), 'DEFERRED');
  assert.equal(installs, 0);
  assert.throws(() => defaults.apply({ ...input, install() { throw new Error('failed'); } }), /failed/);
  assert.equal(defaults.apply(input), 'INSTALLED');
  assert.equal(createStartupDefaultsV010(journal).apply(input), 'PRESERVED');
  assert.equal(installs, 1);
});
