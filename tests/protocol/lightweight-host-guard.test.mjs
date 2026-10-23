import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { imports, inspect, compare } from '../../tools/lightweight-host-validate.mjs';

test('emitted import inspection distinguishes types and deferred loading', () => {
  const found = imports(`import type { A } from './types.js';
    export type { B } from './types.js';
    import './side-effect.js';
    export { value } from './barrel.js';
    await import('./eager.js');
    export const load = () => import('./lazy.js');`, 'fixture.ts');
  assert.deepEqual(found.map(x => x.specifier), ['./side-effect.js', './barrel.js', './eager.js']);
  assert.throws(() => imports('await import(target)', 'fixture.ts'), /computed eager/);
});

test('transitive barrels cannot hide a new eager business import', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'host-guard-'));
  try {
    for (const [file, source] of Object.entries({
      'host.ts': `export { value } from './bridge.js'`,
      'bridge.ts': `export { value } from './apps/new/service.js'`,
      'apps/new/service.ts': 'export const value = 1;'
    })) {
      fs.mkdirSync(path.dirname(path.join(root, file)), { recursive: true });
      fs.writeFileSync(path.join(root, file), source);
    }
    const result = inspect(root, ['host.ts']);
    assert.deepEqual(result.edges, ['bridge.ts -> apps/new/service.ts [static]']);
    assert.equal(compare(result.edges, []).added.length, 1);
    assert.equal(compare([], result.edges).removed.length, 1);
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
});


test('startup IIFEs cannot disguise eager imports as lazy factories', () => {
  const found = imports(`
    void (async () => { await import('./startup.js'); })();
    (function () { void import('./sync-startup.js'); })();
    export const deferred = () => (async () => import('./on-use.js'))();
    const callback = () => import('./callback.js');
    void (() => { const later = () => import('./nested-later.js'); })();
  `, 'fixture.ts');
  assert.deepEqual(found.map(item => item.specifier), ['./startup.js', './sync-startup.js']);
  assert.throws(() => imports('(async () => import(target))()', 'fixture.ts'), /computed eager/);
});

test('startup IIFE dependency reaches the same no-expansion ratchet', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'host-iife-guard-'));
  try {
    fs.mkdirSync(path.join(root, 'apps/optional'), { recursive: true });
    fs.writeFileSync(path.join(root, 'host.ts'),
      `void (async () => { await import('./apps/optional/runtime.js'); })();`);
    fs.writeFileSync(path.join(root, 'apps/optional/runtime.ts'), 'export const runtime = {};');
    const result = inspect(root, ['host.ts']);
    assert.deepEqual(compare(result.edges, []).added,
      ['host.ts -> apps/optional/runtime.ts [eager-dynamic]']);
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
});
