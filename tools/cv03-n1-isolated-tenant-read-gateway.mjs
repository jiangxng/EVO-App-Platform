/**
 * CV-03 N1-04b — isolated PostgreSQL tenant-bound read gateway SQL only.
 * No DDL is executed by this module. Explicit CI fixture installation.
 *
 * SECURITY DEFINER uses session_user (the authenticated SQL login), not
 * current_user (which changes to the function owner). Each isolated SQL
 * login has exactly one owner+Enterprise scope. A pooled cross-tenant SQL
 * login is NOT a production solution; real PA05/Host identity mapping and
 * revocation ordering remain separate, blocking production admission.
 */
export function cv03N1ScopedReadGatewaySqlV010(schema) {
  if (typeof schema !== "string" || !/^cv03_[a-z0-9_]{1,58}$/.test(schema)) {
    throw Error("CV03_N1_ISOLATED_SCHEMA_REQUIRED");
  }
  const s='"'+schema+'"';
  return `
CREATE TABLE ${s}.cv03_n1_read_scope (
 runtime_role name PRIMARY KEY,
 context_id text NOT NULL,
 owner_subject_id text NOT NULL,
 enterprise_id text NOT NULL,
 enabled boolean NOT NULL DEFAULT false
);
REVOKE ALL ON TABLE ${s}.cv03_n1_read_scope FROM PUBLIC;

CREATE FUNCTION ${s}.cv03_n1_scoped_get(
 p_context text,p_namespace text,p_collection text,p_type text,p_id text
)
RETURNS TABLE(revision bigint,resource text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = pg_catalog, pg_temp
AS $cv03_read_get$
 SELECT r.revision,r.resource::text
 FROM ${s}.resources r
 INNER JOIN ${s}.cv03_n1_read_scope g
   ON g.runtime_role = session_user
 WHERE g.enabled
   AND g.context_id=p_context
   AND r.context_id=g.context_id
   AND r.namespace='evo.saved-view.personal.'||g.owner_subject_id
   AND r.namespace=p_namespace
   AND r.collection_id=p_collection
   AND r.resource_type='saved-collection-view'
   AND r.resource_type=p_type
   AND r.resource_id=p_id
   AND r.resource->'payload'->>'ownerSubjectId'=g.owner_subject_id
   AND r.resource->'payload'->>'enterpriseId'=g.enterprise_id;
$cv03_read_get$;

CREATE FUNCTION ${s}.cv03_n1_scoped_list(
 p_context text,p_namespace text,p_collection text,
 p_type text,p_lifecycle text
)
RETURNS TABLE(revision bigint,resource text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = pg_catalog, pg_temp
AS $cv03_read_list$
 SELECT r.revision,r.resource::text
 FROM ${s}.resources r
 INNER JOIN ${s}.cv03_n1_read_scope g
   ON g.runtime_role=session_user
 WHERE g.enabled
   AND g.context_id=p_context
   AND r.context_id=g.context_id
   AND r.namespace='evo.saved-view.personal.'||g.owner_subject_id
   AND (p_namespace IS NULL OR r.namespace=p_namespace)
   AND (p_collection IS NULL OR r.collection_id=p_collection)
   AND r.resource_type='saved-collection-view'
   AND (p_type IS NULL OR r.resource_type=p_type)
   AND (p_lifecycle IS NULL OR r.resource->>'lifecycleState'=p_lifecycle)
   AND r.resource->'payload'->>'ownerSubjectId'=g.owner_subject_id
   AND r.resource->'payload'->>'enterpriseId'=g.enterprise_id
 ORDER BY r.collection_id,r.resource_id;
$cv03_read_list$;

CREATE FUNCTION ${s}.cv03_n1_scoped_receipt(
 p_context text,p_hash text
)
RETURNS TABLE(receipt text,resource text,input_digest text,
  approval_digest text,receipt_digest text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = pg_catalog, pg_temp
AS $cv03_read_receipt$
 SELECT r.receipt::text,r.resource::text,r.input_digest,
   r.approval_digest,r.receipt_digest
 FROM ${s}.cv03_resource_receipts r
 INNER JOIN ${s}.cv03_n1_read_scope g
   ON g.runtime_role=session_user
 WHERE g.enabled
   AND g.context_id=p_context
   AND r.context_id=g.context_id
   AND r.idempotency_hash=p_hash
   AND r.receipt->>'principalSubjectId'=g.owner_subject_id
   AND r.receipt->'context'->>'enterpriseId'=g.enterprise_id
   AND r.resource->>'namespace'='evo.saved-view.personal.'||g.owner_subject_id
   AND r.resource->'payload'->>'ownerSubjectId'=g.owner_subject_id
   AND r.resource->'payload'->>'enterpriseId'=g.enterprise_id;
$cv03_read_receipt$;
`;
}
