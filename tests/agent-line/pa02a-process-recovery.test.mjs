import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createHash, randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import postgres from 'postgres';
import { createPostgresAgentDurabilityProofV020 } from '../../dist/agents/enterprise-agent/pa02a-postgres-durability-proof.js';

const url = process.env.PA02A_PROOF_DATABASE_URL;
const scope = {
  principalSubjectId: 'pa02a-process-test-human', principalActorType: 'HUMAN',
  contextKind: 'ENTERPRISE', contextId: 'enterprise:pa02a-process', enterpriseId: 'pa02a-process-tenant'
};
const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const ids = schema => ({
  runId: `run:${schema}`, eventId: `run-created:${schema}`,
  receiptId: `receipt:${schema}`, key: `receipt-idempotency:${schema}`
});
function claim(schema, overrides = {}) {
  const { runId, eventId } = ids(schema);
  return {
    scope, threadId: 'thread:pa02a-process', clientTurnId: 'turn-before-worker-crash',
    taskDigest: hash(['pa02a-process-v1',schema,'same-task']),
    taskPayload: { version: 1, source: 'process-restart-test' },
    created: {
      contractVersion: '0.1.0', eventId, runId, type: 'RUN_CREATED',
      occurredAt: '2026-10-13T00:00:00.000Z',
      payload: {
        principalSubjectId: scope.principalSubjectId, principalActorType: scope.principalActorType,
        context: { contractVersion: '0.1.0', kind: 'ENTERPRISE', contextId: scope.contextId, enterpriseId: scope.enterpriseId },
        sourceInteractionId: 'thread:pa02a-process', sourceActionId: 'synthetic-claim',
        input: { message: 'test only', conversationHistory: [], locale: 'en', providerId: 'test', modelId: 'fixture' }
      }
    },
    ...overrides
  };
}
function receipt(schema) {
  const { receiptId, key } = ids(schema);
  return { scope, receipt: {
    receiptId, invocationId: `invocation:${schema}`, idempotencyKey: key,
    sourceInteractionId: 'thread:pa02a-process', sourceActionId: 'synthetic-pending-write',
    principalSubjectId: scope.principalSubjectId, principalActorType: scope.principalActorType,
    context: { contractVersion: '0.1.0', kind: 'ENTERPRISE', contextId: scope.contextId, enterpriseId: scope.enterpriseId },
    toolId: 'evo.capabilities.invoke.write', ownerPackageId: 'app-platform',
    inputDigest: hash(['pa02a-process-v1',schema,'write']), requestedAt: '2026-10-13T00:00:00.000Z'
  }};
}

async function worker(mode, schema) {
  if (!url) throw Error('PA02A_PROOF_DATABASE_URL_REQUIRED');
  const store = await createPostgresAgentDurabilityProofV020({ connectionString: url, schema });
  if (mode === 'crash-after-commit-before-ack') {
    assert.equal((await store.claimTurn(claim(schema))).created, true);
    assert.equal((await store.beginReceipt(receipt(schema))).created, true);
    // Both DB transactions committed; kill this Node process before acknowledging the parent.
    process.kill(process.pid, 'SIGKILL');
    throw Error('PA02A_PROCESS_WAS_NOT_KILLED');
  }
  if (mode !== 'recover-in-new-process') throw Error('PA02A_PROCESS_MODE_INVALID');
  try {
    const id = ids(schema);
    const original = await store.getByTurn({ scope, threadId: 'thread:pa02a-process', clientTurnId: 'turn-before-worker-crash' });
    assert.equal(original?.runId, id.runId);
    assert.deepEqual((await store.listRunEvents({ scope, runId: id.runId })).map(e => e.type), ['RUN_CREATED']);
    const pending = await store.getReceipt({ scope, receiptId: id.receiptId });
    assert.equal(pending?.status, 'REQUESTED');
    assert.equal((await store.claimTurn(claim(schema))).created, false);
    assert.equal((await store.beginReceipt(receipt(schema))).created, false);
    assert.equal((await store.getReceipt({ scope, receiptId: id.receiptId })).status, 'REQUESTED');
    const outsider = { ...scope, enterpriseId: 'other-enterprise' };
    assert.equal(await store.getByTurn({ scope: outsider, threadId: 'thread:pa02a-process', clientTurnId: 'turn-before-worker-crash' }), undefined);
    assert.equal(await store.getReceipt({ scope: outsider, receiptId: id.receiptId }), undefined);
    await assert.rejects(store.claimTurn(claim(schema, { taskPayload: { version: 99 } })), /CONVERSATION_THREAD_CLIENT_TURN_ID_REUSED/);
    // Event insert fails on duplicate eventId; the newly inserted turn must roll back.
    await assert.rejects(store.claimTurn(claim(schema, {
      clientTurnId: 'transaction-must-roll-back', taskDigest: hash('fault-case'),
      created: { ...claim(schema).created, runId: `${id.runId}:rolled-back` }
    })));
    assert.equal(await store.getByTurn({ scope, threadId: 'thread:pa02a-process', clientTurnId: 'transaction-must-roll-back' }), undefined);
    console.log('PA02A_FRESH_PROCESS_RECOVERY=' + JSON.stringify({
      recoveredRun: true, pendingReceipt: 'REQUESTED', replayedWithoutDuplicate: true,
      differentEnterpriseInvisible: true, failedTransactionRolledBack: true,
      externalBusinessWriteVerified: false, formalHostAdapterEnabled: false
    }));
  } finally { await store.close(); }
}

function runWorker(mode, schema) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [fileURLToPath(import.meta.url), 'worker', mode, schema], {
      env: process.env, stdio: ['ignore', 'pipe', 'pipe']
    });
    let stdout = '', stderr = '', timedOut = false;
    child.stdout.setEncoding('utf8'); child.stderr.setEncoding('utf8');
    child.stdout.on('data', chunk => { stdout += chunk; });
    child.stderr.on('data', chunk => { stderr += chunk; });
    const deadline = setTimeout(() => { timedOut = true; child.kill('SIGKILL'); }, 30000);
    child.on('error', err => { clearTimeout(deadline); reject(err); });
    child.on('close', (code, signal) => {
      clearTimeout(deadline);
      if (timedOut) reject(Error(`PA02A_CHILD_TIMEOUT ${mode}\n${stdout}\n${stderr}`));
      else resolve({ code, signal, stdout, stderr });
    });
  });
}

if (process.argv[2] === 'worker') {
  worker(process.argv[3], process.argv[4]).catch(error => {
    console.error(error);
    process.exitCode = 1;
  });
} else {
  test('PA02A: real Node process SIGKILL, fresh-process recovery, pending receipt and SQL rollback', {
    skip: !url ? 'Requires a disposable PA02A_PROOF_DATABASE_URL' : false, timeout: 95000
  }, async () => {
    const schema = 'agent_pa02a_proc_' + randomUUID().replaceAll('-', '').slice(0, 16);
    const admin = postgres(url, { max: 1 });
    try {
      const crashed = await runWorker('crash-after-commit-before-ack', schema);
      assert.equal(crashed.signal, 'SIGKILL', `Expected actual SIGKILL\n${crashed.stderr}`);
      const recovered = await runWorker('recover-in-new-process', schema);
      assert.equal(recovered.code, 0, recovered.stderr);
      assert.match(recovered.stdout, /PA02A_FRESH_PROCESS_RECOVERY=/);
      const q = `"${schema}"`;
      const turns = await admin.unsafe(`SELECT count(*)::int AS total FROM ${q}.agent_turns`);
      const events = await admin.unsafe(`SELECT count(*)::int AS total FROM ${q}.agent_run_events`);
      const receipts = await admin.unsafe(`SELECT count(*)::int AS total FROM ${q}.agent_receipts`);
      assert.deepEqual([Number(turns[0].total), Number(events[0].total), Number(receipts[0].total)], [1,1,1]);
      console.log('PA02A_ACTUAL_PROCESS_RESTART=' + JSON.stringify({
        status: 'PASS', parentObservedSignal: 'SIGKILL', recoveredFromDifferentNodeProcess: true,
        runCount: 1, eventCount: 1, receiptCount: 1, receiptRemainsUnreconciled: true,
        postgresServerRestarted: false, productionUsed: false, formalHostAdapterEnabled: false
      }));
    } finally {
      try { await admin.unsafe(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`); }
      finally { await admin.end(); }
    }
  });
}
