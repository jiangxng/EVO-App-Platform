#!/usr/bin/env node
/**
 * TR01B2D3: catalog-only, non-destructive privilege preflight.
 * Run with the dedicated Finance Owner runtime LOGIN, never an operator URL.
 * This cannot certify production TLS, OIDC, KMS, deployment, or write access.
 */
import postgres from 'postgres';

export const EXPECTED_FLAGS = Object.freeze({
  role_can_login: true,
  role_superuser: false,
  role_createdb: false,
  role_createrole: false,
  role_replication: false,
  role_bypassrls: false,
  role_inherit: false,
  database_create: false,
  schema_create: false,
  public_schema_create: false,
  function_security_definer: true,
  function_fixed_path: true,
  function_public_execute: false,
  function_execute: true,
  function_owner_membership: false,
  definer_owner_named: true,
  definer_owner_no_login: true,
  definer_owner_no_inherit: true,
  definer_owner_non_privileged: true,
  definer_owner_schema_create: false,
  definer_owner_key_insert: false,
  definer_owner_key_delete: false,
  definer_owner_key_select_issuer: true,
  definer_owner_key_select_status: true,
  definer_owner_key_update_status: true,
  definer_owner_key_update_issuer: false,
  definer_owner_audit_insert: false,
  definer_owner_has_memberships: false,
  definer_owner_only_function: true,
  definer_owner_no_tables: true,
  key_select: false,
  key_insert: false,
  key_update: false,
  key_delete: false,
  audit_select: false,
  audit_insert: false,
  nonce_insert: true,
  nonce_select: false,
  nonce_issuer_select: true,
  nonce_jti_select: true,
  nonce_installation_select: false,
  nonce_expiry_select: false,
  nonce_update: false,
  nonce_delete: false,
  nonce_truncate: false,
  business_data_select: true,
  business_data_insert: false,
  cost_run_insert: false,
  allocation_instruction_insert: false
});

const CATALOG_QUERY = [
 'select',
 'session_user as session_login, current_user as effective_login,',
 'r.rolcanlogin as role_can_login, r.rolsuper as role_superuser,',
 'r.rolcreatedb as role_createdb, r.rolcreaterole as role_createrole,',
 'r.rolreplication as role_replication, r.rolbypassrls as role_bypassrls,',
 'r.rolinherit as role_inherit,',
 "has_database_privilege(session_user,current_database(),'CREATE') as database_create,",
 "has_schema_privilege(session_user,'public','CREATE') as schema_create,",
 'exists (select 1 from pg_namespace ns,',
 "lateral aclexplode(coalesce(ns.nspacl,acldefault('n',ns.nspowner))) acl",
 "where ns.nspname='public' and acl.grantee=0 and acl.privilege_type='CREATE'",
 ') as public_schema_create,',
 'p.prosecdef as function_security_definer,',
 "false",
 "or coalesce('search_path=pg_catalog, pg_temp'=any(p.proconfig),false)",
 'as function_fixed_path,',
 'exists (select 1 from',
 "aclexplode(coalesce(p.proacl,acldefault('f',p.proowner))) acl",
 "where acl.grantee=0 and acl.privilege_type='EXECUTE'",
 ') as function_public_execute,',
 "has_function_privilege(r.oid,p.oid,'EXECUTE') as function_execute,",
 "pg_has_role(r.oid,p.proowner,'MEMBER') as function_owner_membership,",
 'owner_role.rolsuper as function_owner_superuser,',
 "owner_role.rolname='evo_finance_key_lock_definer_v010' as definer_owner_named,",
 'not owner_role.rolcanlogin as definer_owner_no_login,',
 'not owner_role.rolinherit as definer_owner_no_inherit,',
 'not (owner_role.rolsuper or owner_role.rolcreatedb or owner_role.rolcreaterole',
 'or owner_role.rolreplication or owner_role.rolbypassrls) as definer_owner_non_privileged,',
 "has_schema_privilege(owner_role.oid,'public','CREATE') as definer_owner_schema_create,",
 "has_table_privilege(owner_role.oid,'public.finance_trusted_signing_key','INSERT') as definer_owner_key_insert,",
 "has_table_privilege(owner_role.oid,'public.finance_trusted_signing_key','DELETE') as definer_owner_key_delete,",
 "has_column_privilege(owner_role.oid,'public.finance_trusted_signing_key','issuer','SELECT') as definer_owner_key_select_issuer,",
 "has_column_privilege(owner_role.oid,'public.finance_trusted_signing_key','status','SELECT') as definer_owner_key_select_status,",
 "has_column_privilege(owner_role.oid,'public.finance_trusted_signing_key','status','UPDATE') as definer_owner_key_update_status,",
 "has_column_privilege(owner_role.oid,'public.finance_trusted_signing_key','issuer','UPDATE') as definer_owner_key_update_issuer,",
 "has_table_privilege(owner_role.oid,'public.finance_trust_change_audit','INSERT') as definer_owner_audit_insert,",
 'exists (select 1 from pg_auth_members m where m.member=owner_role.oid) as definer_owner_has_memberships,',
 '(select count(*)=1 from pg_proc p2 where p2.proowner=owner_role.oid) as definer_owner_only_function,',
 'not exists (select 1 from pg_class cl where cl.relowner=owner_role.oid) as definer_owner_no_tables,',
 "has_table_privilege(session_user,'public.finance_trusted_signing_key','SELECT') as key_select,",
 "has_table_privilege(session_user,'public.finance_trusted_signing_key','INSERT') as key_insert,",
 "has_table_privilege(session_user,'public.finance_trusted_signing_key','UPDATE') as key_update,",
 "has_table_privilege(session_user,'public.finance_trusted_signing_key','DELETE') as key_delete,",
 "has_table_privilege(session_user,'public.finance_trust_change_audit','SELECT') as audit_select,",
 "has_table_privilege(session_user,'public.finance_trust_change_audit','INSERT') as audit_insert,",
 "has_table_privilege(session_user,'public.finance_delegation_nonce','INSERT') as nonce_insert,",
 "has_table_privilege(session_user,'public.finance_delegation_nonce','SELECT') as nonce_select,",
 "has_column_privilege(session_user,'public.finance_delegation_nonce','issuer','SELECT') as nonce_issuer_select,",
 "has_column_privilege(session_user,'public.finance_delegation_nonce','jti','SELECT') as nonce_jti_select,",
 "has_column_privilege(session_user,'public.finance_delegation_nonce','installation_id','SELECT') as nonce_installation_select,",
 "has_column_privilege(session_user,'public.finance_delegation_nonce','expires_at','SELECT') as nonce_expiry_select,",
 "has_table_privilege(session_user,'public.finance_delegation_nonce','UPDATE') as nonce_update,",
 "has_table_privilege(session_user,'public.finance_delegation_nonce','DELETE') as nonce_delete,",
 "has_table_privilege(session_user,'public.finance_delegation_nonce','TRUNCATE') as nonce_truncate,",
 "has_table_privilege(session_user,'public.business_data','SELECT') as business_data_select,",
 "has_table_privilege(session_user,'public.business_data','INSERT') as business_data_insert,",
 "has_table_privilege(session_user,'public.cost_run','INSERT') as cost_run_insert,",
 "has_table_privilege(session_user,'public.allocation_instruction','INSERT') as allocation_instruction_insert",
 'from pg_proc p',
 'join pg_roles owner_role on owner_role.oid=p.proowner',
 'join pg_roles r on r.rolname=session_user',
 "where p.oid=to_regprocedure('public.finance_lock_active_signing_key_v010(text,text,text)')"
].join('\n');

export function evaluateFinanceOwnerCatalog(row, { strictOwner = false } = {}) {
  if (!row || typeof row !== 'object') {
    return { automatedStatus: 'FAIL', failedChecks: ['CATALOG_FUNCTION_OR_ROLE_MISSING'],
      ownerReview: 'NOT_EVALUATED', productionCertification: 'NOT_CERTIFIED',
      executionAllowed: false };
  }
  const failedChecks = Object.entries(EXPECTED_FLAGS)
    .filter(([key,expected]) => row[key] !== expected)
    .map(([key]) => key);
  if (!row.session_login || row.session_login !== row.effective_login) {
    failedChecks.push('DISTINCT_SESSION_LOGIN_REQUIRED');
  }
  if (strictOwner && row.function_owner_superuser !== false) {
    failedChecks.push('SECURITY_DEFINER_OWNER_MUST_NOT_BE_SUPERUSER');
  }
  if (strictOwner && failedChecks.some(k => k.startsWith('definer_owner_'))) {
    failedChecks.push('SECURITY_DEFINER_OWNER_SCOPE_NOT_ADMITTED');
  }
  return {
    automatedStatus: failedChecks.length === 0 ? 'PASS' : 'FAIL',
    failedChecks,
    ownerReview: row.function_owner_superuser === true
      ? 'SUPERUSER_OWNER_PRODUCTION_BLOCKER'
      : row.function_owner_superuser === false
        ? failedChecks.some(k => k.startsWith('definer_owner_'))
          ? 'DEFINER_OWNER_SCOPE_VIOLATION'
          : 'NON_SUPERUSER_OWNER_SCOPE_AUTOMATED_PASS'
        : 'OWNER_NOT_EVALUATED',
    productionCertification: 'NOT_CERTIFIED',
    executionAllowed: false
  };
}

export async function runFinanceOwnerCatalogPreflight({
  connectionString = process.env.DATABASE_URL, strictOwner = false
} = {}) {
  if (!connectionString) return evaluateFinanceOwnerCatalog(null);
  const sql = postgres(connectionString, {
    max: 1, connect_timeout: 8, idle_timeout: 2, max_lifetime: 20
  });
  try {
    const rows = await sql.begin(async tx => {
      await tx.unsafe('set transaction read only');
      return tx.unsafe(CATALOG_QUERY);
    });
    return evaluateFinanceOwnerCatalog(rows[0], { strictOwner });
  } finally {
    await sql.end({ timeout: 2 });
  }
}

if (process.argv[1]?.endsWith('/tr01b2d3-finance-owner-catalog-preflight.mjs')) {
  try {
    const result = await runFinanceOwnerCatalogPreflight({
      strictOwner: process.argv.includes('--strict-owner')
    });
    console.log('TR01B2D3_FINANCE_OWNER_CATALOG_PREFLIGHT=' + JSON.stringify(result));
    if (result.automatedStatus !== 'PASS') process.exitCode = 1;
  } catch (error) {
    // Never print credentials, DSN or SQL error message.
    console.log('TR01B2D3_FINANCE_OWNER_CATALOG_PREFLIGHT=' + JSON.stringify({
      automatedStatus: 'FAIL', failedChecks: ['READ_ONLY_CATALOG_QUERY_FAILED'],
      postgresErrorCode: typeof error?.code === 'string' ? error.code : 'UNKNOWN',
      productionCertification: 'NOT_CERTIFIED', executionAllowed: false
    }));
    process.exitCode = 1;
  }
}
