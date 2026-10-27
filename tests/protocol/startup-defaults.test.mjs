import test from 'node:test';
import assert from 'node:assert/strict';
import { createMemorySettingsStore } from '../../dist/manager/settings-store.js';
import { createStartupDefaultsV010, resolveStartupProfileV010 } from '../../dist/manager/startup-defaults.js';

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


test('minimal profile requires managed authentication and invalid profiles fail closed', () => {
  assert.equal(resolveStartupProfileV010(undefined, false), 'compatible');
  assert.equal(resolveStartupProfileV010('minimal', true), 'minimal');
  assert.throws(() => resolveStartupProfileV010('minimal', false), /REQUIRES_MANAGED/);
  assert.throws(() => resolveStartupProfileV010('typo', true), /INVALID/);
});

test('versioned migrations run once and failures are retryable', () => {
  const journal = createMemorySettingsStore();
  let calls = 0;
  const input = { id: 'migration-v1', ready: true, run() { calls++; } };
  createStartupDefaultsV010(journal).migrate({ ...input, ready: false });
  assert.equal(calls, 0);
  assert.throws(() => createStartupDefaultsV010(journal).migrate({ ...input, run() { throw Error('retry'); } }));
  createStartupDefaultsV010(journal).migrate(input);
  createStartupDefaultsV010(journal).migrate(input);
  assert.equal(calls, 1);
});
