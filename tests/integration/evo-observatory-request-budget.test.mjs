import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import {setTimeout as delay} from 'node:timers/promises';
import {createEvoRuntimeObservatoryProviderV020 as create, createEvoRuntimeObservatoryHealthProbeV010 as health} from '../../dist/providers/evo-runtime-observatory/runtime.js';

const request = {contractVersion: '0.2.0', enterpriseId: 'synthetic-host', graphId: 'synthetic-graph',
  window: {startAt: '2026-10-21T00:00:00Z', endAt: '2026-10-22T00:00:00Z'},
  semanticTargets: [
    {target: {kind: 'NODE', nodeId: 'stock'}, node: {nodeId: 'stock', kind: 'LEDGER',
      semanticRef: {authority: 'EVO', kind: 'LEDGER_DEFINITION', refId: 'ledger:stock'}}},
    {target: {kind: 'NODE', nodeId: 'app'}, node: {nodeId: 'app', kind: 'APPLICATION',
      semanticRef: {authority: 'HOST', kind: 'APPLICATION', refId: 'host-app'}}}
  ], metricCodes: ['event.count', 'sop.transition.count']};
async function fixture(t, stage, phase, status = 200) {
  let blocking = true, closed = 0; const calls = [], sockets = new Set();
  const server = http.createServer((req, res) => {
    req.resume(); const current = req.url.includes('/enterprises/') ? 'enterprise'
      : req.url.includes('/runtime-traces/') ? 'traces' : req.url.includes('/health/') ? 'readiness' : 'observations';
    calls.push(current);
    if (blocking && current === stage) {
      res.once('close', () => {closed++;});
      if (phase === 'body') {res.writeHead(status, {'content-type': 'application/json'}); res.write('{');}
      return;
    }
    res.writeHead(200, {'content-type': 'application/json'});
    res.end(JSON.stringify(current === 'enterprise' ? {id: 'synthetic-evo'} : current === 'traces' ? {traces: []} : {observations: []}));
  });
  server.on('connection', socket => {sockets.add(socket); socket.once('close', () => sockets.delete(socket));});
  await new Promise((resolve, reject) => {server.once('error', reject); server.listen(0, '127.0.0.1', resolve);});
  t.after(async () => {for (const socket of sockets) socket.destroy(); await new Promise(resolve => server.close(resolve));});
  const options = {baseUrl: `http://127.0.0.1:${server.address().port}`, timeoutMs: 500,
    resolveEnterpriseCode: () => 'synthetic-code', resolveApplicationId: () => 'synthetic-runtime-app'};
  return {runtime: create(options), probe: health(options), calls, recover() {blocking = false;},
    async assertClosed() {const until = Date.now() + 2000; while (!closed && Date.now() < until) await delay(10); assert.equal(closed, 1, 'native fetch abort must close the hanging response');}};
}

for (const [stage, count] of [['enterprise', 1], ['observations', 2], ['traces', 4]]) {
  for (const phase of ['headers', 'body']) test(`native EVO fetch aborts hanging ${stage} ${phase} and fresh query recovers`, {timeout: 10000}, async t => {
    const f = await fixture(t, stage, phase);
    await assert.rejects(f.runtime.query(request), /EVO_OBSERVATORY_REQUEST_TIMEOUT/);
    assert.equal(f.calls.length, count); await f.assertClosed();
    f.recover(); assert.deepEqual(await f.runtime.query(request), []);
    assert.equal(f.calls.length, count + 4, 'a timed-out query is not automatically replayed');
  });
}

test('native readiness header timeout reports UNAVAILABLE and explicit probe recovers', {timeout: 10000}, async t => {
  const f = await fixture(t, 'readiness', 'headers');
  assert.deepEqual(await f.probe(), {state: 'UNAVAILABLE', message: 'EVO_OBSERVATORY_REQUEST_TIMEOUT'});
  assert.deepEqual(f.calls, ['readiness']); await f.assertClosed();
  f.recover(); assert.equal((await f.probe()).state, 'HEALTHY'); assert.deepEqual(f.calls, ['readiness', 'readiness']);
});

for (const status of [200, 503]) test(`native readiness HTTP ${status} releases an unfinished body without waiting for JSON`, {timeout: 10000}, async t => {
  const f = await fixture(t, 'readiness', 'body', status);
  const result = await f.probe(); assert.equal(result.state, status === 200 ? 'HEALTHY' : 'UNAVAILABLE');
  if (status === 503) assert.match(result.message, /HTTP 503/);
  await f.assertClosed(); assert.deepEqual(f.calls, ['readiness']);
});
