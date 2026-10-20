// Test-only crypto counts and synthetic HTTP port. Never loaded by production.
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {syncBuiltinESMExports} from 'node:module';
let decryptions = 0, failDlp = false;
const decipher = crypto.createDecipheriv;
crypto.createDecipheriv = (...args) => {decryptions++; return decipher(...args);};
syncBuiltinESMExports();
const counts = {dlp: 0, ec: 0}, anonymous = {dlp: 0, ec: 0}, revisions = {dlp: 0, ec: 0};
const intervals = new Map(), set = globalThis.setInterval, clear = globalThis.clearInterval;
globalThis.setInterval = function (fn, delay, ...args) {
  const timer = set(fn, delay, ...args);
  if (new Error().stack?.includes('/manager/context-memory-scheduler.js')) intervals.set(timer, fn);
  return timer;
};
globalThis.clearInterval = timer => {intervals.delete(timer); return clear(timer);};
globalThis.fetch = async (url, init) => {
  const endpoint = new URL(url), name = endpoint.pathname.slice(1);
  assert.equal(endpoint.origin, 'https://memory-credential.invalid');
  assert.ok(name in counts); assert.equal(init.method, 'POST');
  assert.equal(init.redirect, 'error'); assert.equal(init.signal.aborted, false);
  const authorization = new Headers(init.headers).get('authorization');
  if (authorization) {
    const match = authorization.match(new RegExp('^Bearer synthetic-' + name + '-v([123])$'));
    assert.ok(match, 'wrong credential namespace or revision'); revisions[name] = Number(match[1]);
  } else {anonymous[name]++; revisions[name] = 0;}
  counts[name]++;
  const body = name === 'dlp'
    ? {contractVersion: '0.1.0', privacyClass: 'STANDARD', labels: [], reasonCodes: []}
    : {contractVersion: '0.1.0', records: []};
  return new Response(JSON.stringify(body), {status: name === 'dlp' && failDlp ? 503 : 200});
};
process.on('message', message => {
  if (message?.kind === 'memory-credential-snapshot') process.send?.({id: message.id, counts, anonymous, revisions, decryptions});
  if (message?.kind === 'memory-credential-fire') {
    for (const fn of intervals.values()) fn();
    process.send?.({id: message.id});
  }
  if (message?.kind === 'memory-credential-fail') {failDlp = message.fail; process.send?.({id: message.id});}
});
