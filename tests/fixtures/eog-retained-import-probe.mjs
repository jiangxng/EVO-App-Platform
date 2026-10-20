// Test-only process: install guards BEFORE the first project module import.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import net from 'node:net';
import http from 'node:http';
import https from 'node:https';
import timers from 'node:timers';
import timerPromises from 'node:timers/promises';
import childProcess from 'node:child_process';
import {registerHooks, syncBuiltinESMExports} from 'node:module';

// Node 24 may read ESM source through the public fs.readFileSync export.
// Let the native loader read only unchanged built JS using a captured function;
// project evaluations still see every patched fs export, even for that path.
const readSource = fs.readFileSync;
const dist = new URL('../../dist/', import.meta.url).href;
const loaded = new Set();
registerHooks({load(url, context, nextLoad) {
  if (url.startsWith(dist) && url.endsWith('.js')) {
    loaded.add(url);
    return {format: 'module', source: readSource(new URL(url), 'utf8'), shortCircuit: true};
  }
  return nextLoad(url, context);
}});

const attempts = [];
// Reused by directed construction probes after the guarded import completes.
export function assertNoGuardedResourceAttempts() {
  assert.deepEqual(attempts, [], 'retained module attempted guarded resource work');
}
const block = (object, key, label) => {
  object[key] = () => { attempts.push(label); throw Error('EOG_IMPORT_RESOURCE:' + label); };
};
for (const key of ['accessSync', 'existsSync', 'statSync', 'lstatSync', 'readdirSync', 'readFileSync', 'openSync', 'writeSync', 'writeFileSync', 'appendFileSync', 'mkdirSync', 'renameSync', 'unlinkSync', 'watch', 'watchFile', 'createReadStream', 'createWriteStream', 'access', 'stat', 'readdir', 'readFile', 'open', 'writeFile', 'appendFile', 'mkdir']) block(fs, key, 'fs.' + key);
for (const key of ['access', 'stat', 'readdir', 'readFile', 'open', 'writeFile', 'appendFile', 'mkdir']) block(fs.promises, key, 'fs.promises.' + key);
block(net.Socket.prototype, 'connect', 'TCP.connect');
for (const [object, label] of [[http, 'http'], [https, 'https']]) for (const key of ['request', 'get']) block(object, key, label + '.' + key);
block(globalThis, 'fetch', 'fetch');
for (const key of ['setTimeout', 'setInterval', 'setImmediate']) {
  block(globalThis, key, key);
  block(timers, key, 'timers.' + key);
  block(timerPromises, key, 'timers.promises.' + key);
}
for (const key of ['exec', 'execSync', 'execFile', 'execFileSync', 'spawn', 'spawnSync', 'fork']) block(childProcess, key, 'child_process.' + key);
syncBuiltinESMExports();

const [mode, ...modules] = process.argv.slice(2);
if (mode === 'canary') {
  // A swallowed top-level attempt must still be detected. Each is a real ESM
  // evaluation after guard installation, not a direct call to the guard.
  const canaries = [
    ["import {readFileSync} from 'node:fs'; try {readFileSync('/unopened-eog-business/state.json')} catch {}", 'fs.readFileSync'],
    ["import {readFileSync} from 'node:fs'; try {readFileSync(new URL(" + JSON.stringify(dist + 'contracts/definition-projection.js') + "))} catch {}", 'fs.readFileSync'],
    ["import {readFile} from 'node:fs/promises'; try {await readFile('/unopened-eog-business/state.json')} catch {}", 'fs.promises.readFile'],
    ["import {writeFileSync} from 'node:fs'; try {writeFileSync('/unopened-eog-business/state.json', '{}')} catch {}", 'fs.writeFileSync'],
    ["import {connect} from 'node:net'; try {connect({host:'127.0.0.1',port:9})} catch {}", 'TCP.connect'],
    ["try {fetch('https://eog-import.invalid')} catch {}", 'fetch'],
    ["import {setInterval} from 'node:timers'; try {setInterval(()=>{},1)} catch {}", 'timers.setInterval'],
    ["import {setTimeout} from 'node:timers/promises'; try {await setTimeout(1)} catch {}", 'timers.promises.setTimeout'],
    ["import {execSync} from 'node:child_process'; try {execSync('true')} catch {}", 'child_process.execSync']
  ];
  for (const [source, label] of canaries) {
    const before = attempts.length;
    await import('data:text/javascript,' + encodeURIComponent(source));
    assert.deepEqual(attempts.slice(before), [label]);
  }
} else {
  assert.equal(mode, 'imports');
  assert.ok(modules.length > 0);
  for (const module of modules) {
    const namespace = await import(new URL('../../dist/' + module, import.meta.url));
    assert.ok(Object.keys(namespace).length > 0, module + ': empty runtime namespace');
    assert.ok(loaded.has(dist + module), module + ': was not freshly loaded under guard');
  }
  assertNoGuardedResourceAttempts();
}
