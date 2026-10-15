import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { once } from 'node:events';
import { publishLedgerRuntimeConfigurationV010 as publish } from '../../dist/apps/ledger-manager/internal/publication-runtime.js';
import { compileLedgerDefinitionForPublicationV010 } from '../../dist/apps/ledger-manager/internal/publication-compiler.js';
import { createLedgerRuntimeConfiguratorService } from '../../dist/apps/ledger-runtime-configurator/service.js';

const compiled = compileLedgerDefinitionForPublicationV010(createLedgerRuntimeConfiguratorService().exportTemplate());
const target = { enterpriseCode: 'ent-a', enterpriseName: 'Enterprise A' };
const input = { baseUrl: 'http://runtime.invalid', target, compiled };
// Field mapping read from EVO d5ce0513 apps/api/src/configurator-mvp.ts:344–357.
function receipt() {
  return {
    ok: true, enterpriseId: 'runtime-a', enterpriseCode: 'ent-a',
    configurationId: compiled.configurationId, semanticDigest: compiled.semanticDigest,
    applications: new Set(compiled.applications.map(a => a.applicationId)).size,
    ledgers: compiled.accounts.length, rules: compiled.rules.length,
    uniqueExpressions: compiled.compiler.uniqueExpressionCount,
    compiledExpressions: compiled.compiler.compiledExpressionCount,
    runtimeBuiltins: [...compiled.compiler.builtinNames],
    applicationInstances: Object.fromEntries(compiled.applications.map(a => [a.applicationId, `instance:${a.applicationId}`]))
  };
}

for (const selected of [target, { enterpriseId: 'runtime-a' }]) {
  test(`matching receipt binds publication to ${Object.keys(selected)[0]}`, async () => {
    let calls = 0;
    const result = await publish({ ...input, target: selected, fetch: async (url, init) => {
      calls++;
      assert.equal(url, `${input.baseUrl}/api/v1/configurator/burn`);
      assert.equal(init.method, 'POST');
      assert.equal(init.redirect, 'error');
      assert.deepEqual(JSON.parse(init.body), { ...compiled, target: selected });
      return Response.json(receipt());
    }});
    assert.deepEqual(result, receipt());
    assert.equal(calls, 1);
  });
}

const corruptions = {
  'false success': r => ({ ...r, ok: false }),
  'wrong enterprise': r => ({ ...r, enterpriseCode: 'ent-b' }),
  'wrong configuration': r => ({ ...r, configurationId: 'other' }),
  'wrong digest': r => ({ ...r, semanticDigest: 'old' }),
  'partial rules': r => ({ ...r, rules: r.rules + 1 }),
  'partial applications': r => ({ ...r, applications: r.applications + 1 }),
  'partial ledgers': r => ({ ...r, ledgers: r.ledgers + 1 }),
  'missing instances': r => ({ ...r, applicationInstances: {} }),
  'invalid counters': r => ({ ...r, compiledExpressions: -1 }),
  'wrong builtins': r => ({ ...r, runtimeBuiltins: ['unexpected'] }),
  'non-object': () => null
};
for (const [name, corrupt] of Object.entries(corruptions)) {
  test(`2xx ${name} is unknown, not successful, and never retried`, async () => {
    let calls = 0;
    await assert.rejects(publish({ ...input, fetch: async () => {
      calls++; return Response.json(corrupt(receipt()));
    }}), /LEDGER_MANAGER_RUNTIME_PUBLISH_UNKNOWN.*RECEIPT_MISMATCH/);
    assert.equal(calls, 1);
  });
}

test('mapped enterprise ID must match even if enterprise code matches', async () => {
  await assert.rejects(publish({ ...input, target: { enterpriseId: 'runtime-b' },
    fetch: async () => Response.json(receipt()) }), /PUBLISH_UNKNOWN/);
});

for (const status of [422, 500, 503]) {
  test(`HTTP ${status} cannot prove absence of a write`, async () => {
    let calls = 0;
    await assert.rejects(publish({ ...input, fetch: async () => {
      calls++; return Response.json({ error: { code: 'REJECTED', message: 'private diagnostic' } }, { status });
    }}), error => error.message.includes(`HTTP_${status}`) && !error.message.includes('private diagnostic'));
    assert.equal(calls, 1);
  });
}

test('invalid JSON is not a successful publication', async () => {
  await assert.rejects(publish({ ...input, fetch: async () => new Response('<html>proxy</html>') }), /INVALID_RECEIPT/);
});

test('deadline settles even if a transport ignores AbortSignal; late result cannot change it', async () => {
  let signal, finish, calls = 0;
  await assert.rejects(publish({ ...input, timeoutMs: 10, fetch: async (_, init) => {
    calls++; signal = init.signal;
    return new Promise(resolve => { finish = resolve; });
  }}), /PUBLISH_UNKNOWN.*TIMEOUT/);
  assert.equal(signal.aborted, true);
  finish(Response.json(receipt()));
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(calls, 1);
});

for (const failure of ['headers-stall', 'body-stall', 'response-lost', 'redirect']) {
  test(`real HTTP ${failure}: one write only and uncertain outcome retained`, { timeout: 5000 }, async t => {
    let writes = 0, redirected = 0, reached;
    const received = new Promise(resolve => { reached = resolve; });
    const server = createServer(async (req, res) => {
      if (req.url === '/redirected') { redirected++; res.end('{}'); return; }
      for await (const _ of req) { /* consume actual request */ }
      writes++; reached(); // Simulate committed work before losing/stalling its acknowledgement.
      if (failure === 'body-stall') { res.writeHead(200, { 'content-type': 'application/json' }); res.write('{'); }
      if (failure === 'response-lost') req.socket.destroy();
      if (failure === 'redirect') { res.writeHead(307, { location: '/redirected' }); res.end(); }
    });
    server.listen(0, '127.0.0.1'); await once(server, 'listening');
    t.after(async () => { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); });
    const result = publish({ ...input, baseUrl: `http://127.0.0.1:${server.address().port}`, timeoutMs: 500 });
    const rejected = assert.rejects(result, /LEDGER_MANAGER_RUNTIME_PUBLISH_UNKNOWN/);
    await received; await rejected;
    assert.equal(writes, 1); assert.equal(redirected, 0);
  });
}

test('invalid local options reject before sending', async () => {
  let calls = 0;
  await assert.rejects(publish({ ...input, timeoutMs: 0, fetch: async () => { calls++; } }), /INPUT_INVALID/);
  assert.equal(calls, 0);
});
