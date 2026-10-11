#!/usr/bin/env node
/**
 * B2D3 isolated concurrency proof, AFTER original Sales/Cash/Cost/Replay CI.
 * Two independently running EVO HTTP processes share one real PostgreSQL.
 * (A) Exact same signed jti submitted concurrently: one accepted, one replay.
 * (B) A DB-locked operator revocation commits before two waiting new requests:
 *     both must reject without consuming their nonce.
 * Never a production/multi-machine certification or finance write authority.
 */
import assert from 'node:assert/strict';
import { generateKeyPairSync, randomUUID, sign } from 'node:crypto';
import { spawn, spawnSync } from 'node:child_process';
import { openSync, closeSync, readFileSync, writeFileSync } from 'node:fs';
import { setTimeout as sleep } from 'node:timers/promises';
import pg from '../evo/node_modules/pg/lib/index.js';
import { createDatabase } from '../evo/dist/platform/database/src/index.js';
import { computeEconomicRuntimeDigest, computeReplayInputDigest } from
  '../evo/dist/modules/replay/infrastructure/postgres-replay-digest.js';

const { Client } = pg;
if (process.env.NODE_ENV !== 'test' || !process.env.DATABASE_URL) {
  throw new Error('TR01B2D3_DISPOSABLE_POSTGRES_CI_REQUIRED');
}
const installation = JSON.parse(readFileSync('/tmp/tr01b2d3-host-install.json', 'utf8'));
const { privateKey, publicKey } = generateKeyPairSync('ed25519');
const keyId = 'tr01b2d3-ci-concurrent-revocation-1';
const key = {
  ...installation, keyId,
  publicKeyPem: publicKey.export({ type: 'spki', format: 'pem' }).toString(),
  enabled: true
};
const publicFile = '/tmp/tr01b2d3-ci-concurrent-public.json';
writeFileSync(publicFile, JSON.stringify(key), { mode: 0o600 });
const endpoint = '/api/v1/plugins/trading-finance/readonly-verifications';
const baseA = 'http://127.0.0.1:3000';
const baseB = 'http://127.0.0.1:3003';
const dbh = createDatabase(process.env.DATABASE_URL);
const db = dbh.db;
const operator = new Client({ connectionString: process.env.DATABASE_URL });
let transactionOpen = false;
let secondary;
let outputFd;

function cli(...args) {
  const child = spawnSync(process.execPath,
    ['dist/scripts/finance-trust-operator.js', ...args],
    { cwd: 'evo', env: process.env, encoding: 'utf8' });
  assert.equal(child.status, 0,
    'Isolated operator CLI grant failed: ' + child.stderr.slice(-1000));
  assert.match(child.stdout, /FINANCE_TRUST_OPERATOR_CHANGE/u);
}
async function health(base) {
  for (let attempt = 0; attempt < 55; attempt += 1) {
    if (secondary?.exitCode !== null && secondary?.exitCode !== undefined) break;
    try {
      const response = await fetch(base + '/health/ready',
        { signal: AbortSignal.timeout(750) });
      if (response.ok) return;
    } catch { /* startup connection not yet open */ }
    await sleep(200);
  }
  throw new Error('TR01B2D3_SECOND_EVO_API_NOT_READY');
}
function pin(row) { return { id: row.id, version: row.version }; }
async function originalIntent(boundary) {
  const tenant = installation.evoEnterpriseId;
  const [shipment, valuation, allocation, rule] = await Promise.all([
    db.selectFrom('business_data').select('id')
      .where('enterprise_id', '=', tenant)
      .where('business_data_type', '=', 'sales_shipment.created')
      .where('business_object_key', '=', 'TR01B-SHIP-001')
      .executeTakeFirstOrThrow(),
    db.selectFrom('valuation_policy').select(['id', 'version'])
      .where('enterprise_id', '=', tenant)
      .where('code', '=', 'inventory_fifo')
      .where('status', '=', 'ACTIVE')
      .where('version', '=', 1).executeTakeFirstOrThrow(),
    db.selectFrom('allocation_policy').select(['id', 'version'])
      .where('enterprise_id', '=', tenant)
      .where('code', '=', 'inventory_fifo')
      .where('status', '=', 'PUBLISHED')
      .where('version', '=', 1).executeTakeFirstOrThrow(),
    db.selectFrom('valuation_rule').select(['id', 'version'])
      .where('enterprise_id', '=', tenant)
      .where('code', '=', 'shipment-inventory-to-cogs')
      .where('status', '=', 'PUBLISHED')
      .where('version', '=', 1).executeTakeFirstOrThrow()
  ]);
  return {
    contractVersion: '0.1.0',
    kind: 'COST_VALUATION',
    evoEnterpriseId: tenant,
    orderNo: 'TR01B-SO-001',
    customerCounterpartyId: 'cp-tr01b-customer',
    itemId: 'item-tr01b',
    warehouseId: 'wh-tr01b',
    idempotencyKey: 'tr01b2d3-dual-instance-race',
    shipmentBusinessDataId: shipment.id,
    costMethod: 'FIFO',
    valuationPolicy: pin(valuation),
    allocationPolicy: pin(allocation),
    shipmentValuationRule: pin(rule),
    boundarySequence: boundary
  };
}
function signed(intent) {
  // Uses the same Ed25519 signed Host assertion contract independently
  // admitted by EVO owner. No mock owner verdict enters the proof.
  const now = Math.floor(Date.now() / 1000);
  const header = {
    alg: 'Ed25519', typ: 'evo-finance-delegation+jwt', kid: keyId
  };
  const claims = {
    iss: installation.issuer,
    aud: 'evo:trading-finance-owner:read-only:v0.1.0',
    iat: now, nbf: now, exp: now + 45,
    jti: randomUUID(), purpose: 'TR01B2D3_FINANCE_READONLY',
    installationId: installation.installationId,
    hostEnterpriseId: installation.hostEnterpriseId,
    contextId: installation.contextId,
    evoEnterpriseId: installation.evoEnterpriseId,
    actorSubjectId: 'ci-cross-instance-host-user',
    actorType: 'HUMAN',
    correlationId: 'tr01b2d3-postgres-lock-race',
    intent
  };
  const body = [header, claims].map(v =>
    Buffer.from(JSON.stringify(v)).toString('base64url')).join('.');
  return body + '.' + sign(null, Buffer.from(body), privateKey).toString('base64url');
}
async function post(base, assertion) {
  const result = await fetch(base + endpoint, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ assertion }),
    signal: AbortSignal.timeout(12000)
  });
  return { status: result.status, body: await result.json() };
}
async function nonceCount() {
  const row = await db.selectFrom('finance_delegation_nonce')
    .select(({ fn }) => fn.countAll().as('n'))
    .where('issuer', '=', installation.issuer).executeTakeFirstOrThrow();
  return Number(row.n);
}
async function snapshot() {
  const state = await db.selectFrom('enterprise_runtime_state')
    .select(['consistency_domain', 'next_posting_sequence'])
    .where('enterprise_id', '=', installation.evoEnterpriseId)
    .executeTakeFirstOrThrow();
  const boundary = BigInt(state.next_posting_sequence) - 1n;
  const count = async table => {
    const row = await db.selectFrom(table)
      .select(({ fn }) => fn.countAll().as('n'))
      .where('enterprise_id', '=', installation.evoEnterpriseId)
      .executeTakeFirstOrThrow();
    return Number(row.n);
  };
  return {
    boundary: String(boundary),
    economic: await computeEconomicRuntimeDigest(
      db, installation.evoEnterpriseId, state.consistency_domain, boundary),
    replayInput: await computeReplayInputDigest(
      db, installation.evoEnterpriseId, state.consistency_domain, boundary),
    costRuns: await count('cost_run'),
    allocationInstructions: await count('allocation_instruction')
  };
}
function assertReadOnly(result) {
  assert.equal(result.status, 200);
  assert.equal(result.body.verified, true);
  assert.equal(result.body.verificationKind, 'OWNER_DATABASE_READ_ONLY');
  assert.equal(result.body.executionAllowed, false);
  assert.equal(result.body.orderNo, 'TR01B-SO-001');
}
function assertDenied(result, expectedStatus, reason) {
  assert.equal(result.status, expectedStatus);
  assert.equal(result.body.status, 'DENIED');
  assert.equal(result.body.executionAllowed, false);
  assert.equal(result.body.code, reason);
}

try {
  await operator.connect();
  await health(baseA);
  outputFd = openSync('/tmp/tr01b2d3-race-evo-api.log', 'w', 0o600);
  secondary = spawn(process.execPath, ['dist/apps/api/src/main.js'], {
    cwd: 'evo',
    env: { ...process.env, EVO_FINANCE_TRUST_AUTHORITY: 'POSTGRES',
      HOST: '127.0.0.1', PORT: '3003', LOG_LEVEL: 'silent' },
    stdio: ['ignore', outputFd, outputFd]
  });
  await health(baseB);
  const before = await snapshot();
  const intent = await originalIntent(before.boundary);
  const startingNonces = await nonceCount();
  const auditBefore = await db.selectFrom('finance_trust_change_audit')
    .select(['action']).where('key_id', '=', keyId).execute();
  assert.equal(auditBefore.length, 0, 'the CI key identity must be fresh');

  cli('grant', publicFile, 'ci-cross-instance-operator', 'CI-CROSS-INSTANCE-GRANT');
  // Same one-use token reaches two ACTUALLY INDEPENDENT EVO HTTP processes
  // at once, but Postgres primary-key UNIQUE jti must allow only one.
  const duplicate = signed(intent);
  const responses = await Promise.all([
    post(baseA, duplicate), post(baseB, duplicate)
  ]);
  assert.deepEqual(responses.map(v => v.status).sort(), [200, 409]);
  assertReadOnly(responses.find(v => v.status === 200));
  assertDenied(responses.find(v => v.status === 409), 409,
    'EVO_FINANCE_DELEGATION_REPLAY');
  assert.equal(await nonceCount(), startingNonces + 1);

  // Deliberately hold an uncommitted operator UPDATE lock. Two *different*
  // signed new nonces must wait at the protected active-key read.
  await operator.query('begin');
  transactionOpen = true;
  await operator.query(
    "select set_config('evo.finance_trust_actor',$1,true), set_config('evo.finance_trust_reason',$2,true)",
    ['ci-cross-instance-operator', 'CI-CROSS-INSTANCE-REVOKE-RACE']
  );
  const revoked = await operator.query(
    `update finance_trusted_signing_key
       set status='REVOKED', revoked_at=now()
     where issuer=$1 and installation_id=$2 and key_id=$3
       and status='ACTIVE' returning key_id`,
    [installation.issuer, installation.installationId, keyId]
  );
  assert.equal(revoked.rowCount, 1);
  const raceAssertions = [signed(intent), signed(intent)];
  let firstFinished = false;
  let secondFinished = false;
  const pendingA = post(baseA, raceAssertions[0]).finally(() => {
    firstFinished = true;
  });
  const pendingB = post(baseB, raceAssertions[1]).finally(() => {
    secondFinished = true;
  });
  await sleep(200);
  assert.equal(firstFinished, false, 'in-flight request A must wait for operator lock');
  assert.equal(secondFinished, false, 'in-flight request B must wait for operator lock');
  assert.equal(await nonceCount(), startingNonces + 1,
    'no nonce can be admitted while the revoke transaction holds its key lock');

  await operator.query('commit');
  transactionOpen = false;
  const afterRevocation = await Promise.all([pendingA, pendingB]);
  for (const result of afterRevocation) {
    assertDenied(result, 401, 'EVO_FINANCE_INSTALLATION_NOT_ADMITTED');
  }
  assert.equal(await nonceCount(), startingNonces + 1,
    'no newly signed assertion may pass after committed revocation');
  const audit = await db.selectFrom('finance_trust_change_audit')
    .select(['action', 'operator_id', 'reason'])
    .where('key_id', '=', keyId).orderBy('audit_id', 'asc').execute();
  assert.deepEqual(audit.map(v => v.action), ['GRANT', 'REVOKE']);
  assert.ok(audit.every(v => v.operator_id === 'ci-cross-instance-operator'));
  assert.deepEqual(audit.map(v => v.reason),
    ['CI-CROSS-INSTANCE-GRANT', 'CI-CROSS-INSTANCE-REVOKE-RACE']);
  assert.deepEqual(await snapshot(), before);
  console.log('TR01B2D3_TWO_EVO_CONCURRENT_NONCE_REVOKE_PROOF=' +
    JSON.stringify({
      status: 'PASS',
      twoIndependentEvoHttpProcesses: true,
      sharedRealPostgresNonceUniqueness: true,
      sameSignedAssertionAcceptedExactlyOnce: true,
      replayDeniedAcrossTwoInstances: true,
      committedOperatorRevocationRejectsWaitingRequests: true,
      waitingNewRequestsConsumedNoNonce: true,
      operatorAppendOnlyAuditEntries: audit.length,
      financeEconomicAndReplayInputUnchanged: true,
      financialExecutionAllowed: false,
      productionMultiMachineNetwork: 'NOT_CERTIFIED',
      productionTlsAndIdentity: 'NOT_CERTIFIED'
    }));
} finally {
  if (transactionOpen) await operator.query('rollback').catch(() => {});
  if (secondary && secondary.exitCode === null) {
    secondary.kill('SIGTERM');
    await Promise.race([
      new Promise(resolve => secondary.once('exit', resolve)),
      sleep(3500)
    ]);
    if (secondary.exitCode === null) secondary.kill('SIGKILL');
  }
  if (outputFd !== undefined) closeSync(outputFd);
  await Promise.allSettled([operator.end(), dbh.destroy()]);
}
