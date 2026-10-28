import test from 'node:test';
import assert from 'node:assert/strict';
import { createMemorySettingsStore } from '../../dist/manager/settings-store.js';
import { createStartupDefaultsV010, resolveStartupProfileV010, shouldBootstrapBusinessDefaultV010 } from '../../dist/manager/startup-defaults.js';

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
  assert.equal(resolveStartupProfileV010(undefined, false), 'clean');
  assert.equal(resolveStartupProfileV010('compatible', false), 'compatible');
  assert.equal(resolveStartupProfileV010('minimal', true), 'minimal');
  assert.throws(() => resolveStartupProfileV010('minimal', false), /REQUIRES_MANAGED/);
  assert.throws(() => resolveStartupProfileV010('typo', true), /INVALID/);
});

test('clean plugin platform defers implicit defaults without blocking later explicit installs', () => {
  assert.equal(resolveStartupProfileV010('clean', false), 'clean');
  assert.equal(resolveStartupProfileV010('CLEAN', false), 'clean');
  assert.equal(shouldBootstrapBusinessDefaultV010('compatible', false), true);
  assert.equal(shouldBootstrapBusinessDefaultV010('clean', false), false);
  assert.equal(shouldBootstrapBusinessDefaultV010('clean', true), true);
  assert.equal(shouldBootstrapBusinessDefaultV010('minimal', false), false);

  const journal = createMemorySettingsStore();
  const defaults = createStartupDefaultsV010(journal);
  let installCount = 0;
  const bootstrap = (profile, explicit, installed = false) =>
    shouldBootstrapBusinessDefaultV010(profile, explicit)
      ? defaults.apply({ packageId: 'optional-business-app', installed,
          install() { installCount++; } })
      : 'SKIPPED';

  assert.equal(bootstrap('clean', false), 'SKIPPED');
  assert.equal(installCount, 0);
  // Later manual installation remains available with the exact same lifecycle
  // and can bind its requests to an Enterprise Context created afterward.
  assert.equal(bootstrap('clean', true), 'INSTALLED');
  assert.equal(installCount, 1);
  assert.equal(bootstrap('clean', false, true), 'SKIPPED');
  assert.equal(bootstrap('clean', true, true), 'PRESERVED');
  assert.equal(installCount, 1);
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
