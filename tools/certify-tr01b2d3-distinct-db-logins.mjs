#!/usr/bin/env node
/**
 * TR-01B2D3 disposable PostgreSQL CI: actual independent LOGIN credentials,
 * not a superuser SET ROLE session. EVO API uses a restricted runtime URL
 * while the isolated operator CLI holds another URL for trust grants/revokes.
 * Production passwords, ingress and deployment are NOT certified.
 */
import assert from 'node:assert/strict';
import { generateKeyPairSync, randomBytes } from 'node:crypto';
import { spawn, spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync, openSync, closeSync } from 'node:fs';
import { setTimeout as sleep } from 'node:timers/promises';
import pg from '../evo/node_modules/pg/lib/index.js';
import { createDatabase } from '../evo/dist/platform/database/src/index.js';
import { computeEconomicRuntimeDigest, computeReplayInputDigest } from
  '../evo/dist/modules/replay/infrastructure/postgres-replay-digest.js';
import { createTrustedRemoteFinanceOwnerPreflightV010 } from
  '../dist/apps/trading-reference/finance-owner-remote.js';

const { Client } = pg;
const rootUrl = process.env.DATABASE_URL;
if (!rootUrl || process.env.NODE_ENV !== 'test') {
  throw new Error('TR01B2D3_DISPOSABLE_POSTGRES_CI_REQUIRED');
}
const runtimeRole = 'tr01b2d3_runtime_login_ci';
const operatorRole = 'tr01b2d3_operator_login_ci';
const password = () => randomBytes(28).toString('hex');
function accountUrl(role, secret) {
  const url = new URL(rootUrl);
  url.username = role;
  url.password = secret;
  return url.toString();
}
const runtimeUrl = accountUrl(runtimeRole, password());
const operatorUrl = accountUrl(operatorRole, password());
const admin = new Client({ connectionString: rootUrl });
const dbh = createDatabase(rootUrl);
const db = dbh.db;
const install = JSON.parse(readFileSync('/tmp/tr01b2d3-host-install.json', 'utf8'));
const keyId = 'tr01b2d3-distinct-db-login-1';
const { publicKey, privateKey } = generateKeyPairSync('ed25519');
const publicConfig = {
  ...install, keyId,
  publicKeyPem: publicKey.export({ type: 'spki', format: 'pem' }).toString(),
  enabled: true
};
const publicFile = '/tmp/tr01b2d3-distinct-db-public.json';
writeFileSync(publicFile, JSON.stringify(publicConfig), { mode: 0o600 });
const clientKey = privateKey.export({ type: 'pkcs8', format: 'pem' }).toString();
const endpoint = 'http://127.0.0.1:3002/api/v1/plugins/trading-finance/readonly-verifications';
const sessionConfig = { ...install, keyId, endpoint, active: true };
const proof = createTrustedRemoteFinanceOwnerPreflightV010({
  resolveInstallation: () => sessionConfig,
  resolveSigningPrivateKey: () => clientKey,
  allowLoopbackHttpInTest: true
});
let api;
let logFd;
const logFile = '/tmp/tr01b2d3-distinct-db-evo-api.log';

function operatorCli(url, action, params, expectSuccess) {
  const result = spawnSync(process.execPath,
    ['dist/scripts/finance-trust-operator.js', action, ...params],
    { cwd: 'evo', env: { ...process.env, DATABASE_URL: url }, encoding: 'utf8' });
  if (expectSuccess) {
    assert.equal(result.status, 0,
      'separately logged-in operator CLI failed: ' + result.stderr.slice(-1300));
    assert.match(result.stdout, /FINANCE_TRUST_OPERATOR_CHANGE/u);
  } else {
    assert.notEqual(result.status, 0,
      'separately logged-in runtime must never change trust');
  }
}

async function loggedInClient(url, expectedUser) {
  const client = new Client({ connectionString: url });
  await client.connect();
  const result = await client.query(
    'select session_user as login, current_user as effective'
  );
  assert.equal(result.rows[0].login, expectedUser);
  assert.equal(result.rows[0].effective, expectedUser);
  return client;
}

async function permissionDenied(client, query) {
  await assert.rejects(
    client.query(query),
    error => error?.code === '42501',
    'SQL must be rejected by PostgreSQL permissions: ' + query
  );
}

async function snapshot() {
  const state = await db.selectFrom('enterprise_runtime_state')
    .select(['consistency_domain', 'next_posting_sequence'])
    .where('enterprise_id', '=', install.evoEnterpriseId)
    .executeTakeFirstOrThrow();
  const boundary = BigInt(state.next_posting_sequence) - 1n;
  const count = async table => {
    const row = await db.selectFrom(table)
      .select(({fn}) => fn.countAll().as('count'))
      .where('enterprise_id', '=', install.evoEnterpriseId)
      .executeTakeFirstOrThrow();
    return Number(row.count);
  };
  return {
    boundary: String(boundary),
    economic: await computeEconomicRuntimeDigest(
      db, install.evoEnterpriseId, state.consistency_domain, boundary),
    replayInput: await computeReplayInputDigest(
      db, install.evoEnterpriseId, state.consistency_domain, boundary),
    costRuns: await count('cost_run'),
    allocations: await count('allocation_instruction')
  };
}

async function waitReady(child) {
  for (let i = 0; i < 55; i += 1) {
    if (child.exitCode !== null) break;
    try {
      const res = await fetch('http://127.0.0.1:3002/health/ready',
        { signal: AbortSignal.timeout(700) });
      if (res.ok) return;
    } catch { /* expected during startup */ }
    await sleep(300);
  }
  throw new Error('TR01B2D3_RESTRICTED_LOGIN_EVO_FAILED_TO_START');
}

async function factInput(boundary) {
  const e = install.evoEnterpriseId;
  const [shipment, valuation, allocation, rule] = await Promise.all([
    db.selectFrom('business_data').select('id')
      .where('enterprise_id', '=', e)
      .where('business_data_type', '=', 'sales_shipment.created')
      .where('business_object_key', '=', 'TR01B-SHIP-001')
      .executeTakeFirstOrThrow(),
    db.selectFrom('valuation_policy').select(['id', 'version'])
      .where('enterprise_id', '=', e)
      .where('code', '=', 'inventory_fifo')
      .where('status', '=', 'ACTIVE')
      .where('version', '=', 1).executeTakeFirstOrThrow(),
    db.selectFrom('allocation_policy').select(['id', 'version'])
      .where('enterprise_id', '=', e)
      .where('code', '=', 'inventory_fifo')
      .where('status', '=', 'PUBLISHED')
      .where('version', '=', 1).executeTakeFirstOrThrow(),
    db.selectFrom('valuation_rule').select(['id', 'version'])
      .where('enterprise_id', '=', e)
      .where('code', '=', 'shipment-inventory-to-cogs')
      .where('status', '=', 'PUBLISHED')
      .where('version', '=', 1).executeTakeFirstOrThrow()
  ]);
  const pin = row => ({ id: row.id, version: row.version });
  return {
    contractVersion: '0.1.0', kind: 'COST_VALUATION',
    orderNo: 'TR01B-SO-001',
    customerCounterpartyId: 'cp-tr01b-customer',
    itemId: 'item-tr01b', warehouseId: 'wh-tr01b',
    idempotencyKey: 'tr01b2d3-restricted-db-login',
    shipmentBusinessDataId: shipment.id,
    costMethod: 'FIFO',
    valuationPolicy: pin(valuation),
    allocationPolicy: pin(allocation),
    shipmentValuationRule: pin(rule),
    boundarySequence: boundary
  };
}

try {
  await admin.connect();
  // Fixed names are legal ONLY against the disposable CI DB. Unique,
  // unpredictable passwords never leave this process and subprocess env.
  for (const [role, url] of [[runtimeRole, runtimeUrl], [operatorRole, operatorUrl]]) {
    const secret = new URL(url).password;
    assert.match(secret, /^[a-f0-9]{56}$/u);
    await admin.query("create role " + role + " login noinherit password '" + secret + "'");
  }
  await admin.query('grant usage on schema public to ' + runtimeRole + ', ' + operatorRole);
  await admin.query('grant select on enterprise_runtime_state, business_data, posting_input, valuation_policy, allocation_policy, valuation_rule to ' + runtimeRole);
  // SECURITY DEFINER is the only row-lock path: no UPDATE or raw SELECT
  // privilege on finance_trusted_signing_key is available to the API login.
  await admin.query('grant execute on function public.finance_lock_active_signing_key_v010(text,text,text) to ' + runtimeRole);
  await admin.query('grant insert on finance_delegation_nonce to ' + runtimeRole);
  // ON CONFLICT (issuer,jti) needs SELECT on its arbiter columns,
  // while INSERT ... RETURNING jti needs SELECT(jti). No other nonce
  // columns or financial tables are readable by this runtime login.
  await admin.query('grant select(issuer,jti) on finance_delegation_nonce to ' + runtimeRole);
  await admin.query('grant select,insert,update on finance_trusted_signing_key to ' + operatorRole);
  await admin.query('grant select,insert on finance_trust_change_audit to ' + operatorRole);
  await admin.query('grant usage on sequence finance_trust_change_audit_audit_id_seq to ' + operatorRole);

  const runtime = await loggedInClient(runtimeUrl, runtimeRole);
  const operator = await loggedInClient(operatorUrl, operatorRole);
  // Catalog-only preflight of the actual runtime LOGIN, not SET LOCAL ROLE.
  // Function owner is privileged in disposable CI and remains a deployment blocker.
  const catalog = spawnSync(process.execPath,
    ['tools/tr01b2d3-finance-owner-catalog-preflight.mjs'],
    { env: { ...process.env, DATABASE_URL: runtimeUrl }, encoding: 'utf8' });
  assert.equal(catalog.status, 0,
    'runtime catalog preflight failed: ' + catalog.stdout + catalog.stderr.slice(-500));
  assert.match(catalog.stdout,
    /TR01B2D3_FINANCE_OWNER_CATALOG_PREFLIGHT=.*"automatedStatus":"PASS"/u);
  assert.match(catalog.stdout, /"productionCertification":"NOT_CERTIFIED"/u);
  console.log(catalog.stdout.trim());
  try {
    await runtime.query('select count(*) from business_data');
    await operator.query('select count(*) from finance_trusted_signing_key');
    await permissionDenied(runtime, 'select count(*) from finance_trusted_signing_key');
    await permissionDenied(runtime, "update finance_trusted_signing_key set status='REVOKED' where false");
    await permissionDenied(runtime, 'insert into finance_trust_change_audit (issuer) values (\'test\')');
    await permissionDenied(runtime, 'insert into cost_run(id) values (\'00000000-0000-4000-8000-000000000001\')');
    await permissionDenied(operator, 'select count(*) from business_data');
    await permissionDenied(operator, 'insert into finance_delegation_nonce (issuer) values (\'bad\')');
    await permissionDenied(operator, 'insert into cost_run(id) values (\'00000000-0000-4000-8000-000000000001\')');
  } finally {
    await Promise.all([runtime.end(), operator.end()]);
  }
  const before = await snapshot();
  const auditBefore = await db.selectFrom('finance_trust_change_audit')
    .select(({fn}) => fn.countAll().as('n'))
    .where('key_id', '=', keyId).executeTakeFirstOrThrow();
  assert.equal(Number(auditBefore.n), 0);

  // Same existing operator CLI, but now with a physically separate PG LOGIN.
  operatorCli(operatorUrl, 'grant',
    [publicFile, 'ci-distinct-db-operator', 'CI-SEPARATE-LOGIN-GRANT'], true);
  operatorCli(runtimeUrl, 'revoke',
    [install.issuer, install.installationId, keyId,
      'ci-malicious-runtime', 'MUST-NOT-REVOKE'], false);

  logFd = openSync(logFile, 'w', 0o600);
  api = spawn(process.execPath, ['dist/apps/api/src/finance-owner-readonly-main.js'], {
    cwd: 'evo', env: { ...process.env,
      DATABASE_URL: runtimeUrl,
      EVO_FINANCE_OWNER_ISOLATED_READONLY: 'true',
      EVO_FINANCE_TRUST_AUTHORITY: 'POSTGRES',
      EVO_FINANCE_TRUSTED_INSTALLATIONS_JSON: '',
      HOST: '127.0.0.1', PORT: '3002', LOG_LEVEL: 'silent'
    }, stdio: ['ignore', logFd, logFd]
  });
  await waitReady(api);
  // This credential must be used by a dedicated *plugin-only* listener,
  // not a full EVO API with inherited demo/commands/financial write routes.
  const isolatedBase = 'http://127.0.0.1:3002';
  for (const url of [
    '/api/v1/commands',
    '/api/v1/demo/cost/recalculate',
    '/api/v1/demo/sales-orders/approve',
    '/api/v1/configurator/business-data',
    '/api/v1/enterprise-templates/enterprise-core/initialize'
  ]) {
    const response = await fetch(isolatedBase + url, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: '{}', signal: AbortSignal.timeout(4000)
    });
    assert.equal(response.status, 404, 'isolated owner must not mount: ' + url);
  }
  const apps = await fetch(isolatedBase + '/api/v1/apps');
  assert.equal(apps.status, 404, 'no general EVO discovery route mounted on finance-only process');
  const intent = await factInput(before.boundary);
  const request = {
    contractVersion: '0.1.0',
    hostEnterpriseId: install.hostEnterpriseId,
    evoEnterpriseId: install.evoEnterpriseId,
    contextId: install.contextId,
    actorSubjectId: 'ci-independent-host-principal',
    actorType: 'HUMAN',
    correlationId: 'tr01b2d3-distinct-db-credentials',
    intent
  };
  const verified = await proof.verify(request);
  assert.equal(verified.verified, true);
  assert.equal(verified.orderNo, 'TR01B-SO-001');

  operatorCli(operatorUrl, 'revoke',
    [install.issuer, install.installationId, keyId,
      'ci-distinct-db-operator', 'CI-SEPARATE-LOGIN-REVOKE'], true);
  await assert.rejects(proof.verify(request),
    error => error?.message === 'TR01B2D3_OWNER_REMOTE_DENIED_401');

  const audit = await db.selectFrom('finance_trust_change_audit')
    .select(['action','operator_id','reason'])
    .where('key_id', '=', keyId)
    .orderBy('audit_id', 'asc').execute();
  assert.deepEqual(audit.map(x => x.action), ['GRANT', 'REVOKE']);
  assert.ok(audit.every(x => x.operator_id === 'ci-distinct-db-operator'));
  const after = await snapshot();
  assert.deepEqual(after, before, 'read-only owner checks must not change real finance economics');
  console.log('TR01B2D3_DISTINCT_DATABASE_LOGINS_LIVE_OWNER_PROOF=' +
    JSON.stringify({
      status: 'PASS',
      runtimeSessionIsDistinctLogin: true,
      operatorSessionIsDistinctLogin: true,
      evoApiUsesRestrictedRuntimeCredential: true,
      financeOwnerProcessIsolatedFromCommandsAndDemo: true,
      actualHostSignedHttpOwnerRead: true,
      operatorCliUsesRestrictedOperatorCredential: true,
      operatorAuditEntries: audit.length,
      crossRolePrivilegeEscalationDenied: true,
      revocationEffectiveWithoutEvoRestart: true,
      originalEconomicAndReplayInputUnchanged: true,
      financialExecutionAllowed: false,
      realProductionCredentials: 'NOT_CERTIFIED',
      productionTlsAndIdentity: 'NOT_CERTIFIED'
    }));
} finally {
  if (api) {
    api.kill('SIGTERM');
    await new Promise(resolve => {
      if (api.exitCode !== null) return resolve();
      api.once('exit', resolve);
      setTimeout(resolve, 4000);
    });
  }
  if (logFd !== undefined) closeSync(logFd);
  await Promise.allSettled([admin.end(), dbh.destroy()]);
}
