/**
 * CV-03 N1-04e ISOLATED SQL parity with the existing Saved View Domain Owner.
 * The source of truth remains personal-saved-views.ts address(ctx,id):
 *   sha256(JSON.stringify([enterpriseId, subjectId]))
 * This is a CI-only PostgreSQL DDL fragment, not a production migration.
 *
 * PostgreSQL json_build_array()::text inserts spaces after commas; it MUST NOT
 * be used as the digest input. Serialize each text scalar with to_json() and
 * concatenate using the exact comma, without touching contents of strings.
 */
export function cv03N104eDomainOwnerNamespaceSqlV010(schema) {
  if(typeof schema!=="string"||!/^cv03_[a-z0-9_]{1,58}$/.test(schema))
    throw Error("CV03_N1_ISOLATED_SCHEMA_REQUIRED");
  const s='"'+schema+'"';
  return `
CREATE OR REPLACE FUNCTION ${s}.cv03_n1_saved_view_namespace(
  p_enterprise text,p_subject text
) RETURNS text LANGUAGE sql IMMUTABLE STRICT
SET search_path = pg_catalog, pg_temp
AS $cv03_namespace$
 SELECT 'evo.saved-view.personal.' || encode(public.digest(
   convert_to('[' || to_json(p_enterprise)::text || ',' ||
     to_json(p_subject)::text || ']', 'UTF8'), 'sha256'), 'hex');
$cv03_namespace$;
`;
}
