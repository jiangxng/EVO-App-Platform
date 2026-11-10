import postgres from "postgres";
import {timingSafeEqual} from "node:crypto";
import type {
  AgentActionReceiptBeginInputV010,
  AgentActionReceiptV010
} from "../../contracts/agent-action-receipt.js";
import {
  digestConditionalResourcePutV010, sha256ResourceReceiptV010,
  stableResourceReceiptJsonV010, hmacCv03HostResourceReceiptV010
} from "./resource-receipt-digest.js";
import type {
  EnterpriseResourceAddressV010,
  EnterpriseResourceCommittedWriteLookupV010,
  EnterpriseResourceCommittedWriteV010,
  EnterpriseResourceSignedHostReceiptV010,
  EnterpriseResourceConditionalArchiveInputV010,
  EnterpriseResourceConditionalAsyncRepositoryV010,
  EnterpriseResourceConditionalPutInputV010,
  EnterpriseResourceListInputV010,
  EnterpriseResourceV010
} from "../../contracts/enterprise-resource.js";
import { validateEnterpriseResourceV010 } from "./resources.js";

/**
 * Opt-in CV-03 storage adapter for the EXISTING Enterprise Resource contract.
 * Never registered as the default Host repository: legacy consumers require a
 * synchronous interface, while a real shared PostgreSQL authority is async.
 * Explicit preparation and cutover/authorization remain separate gates.
 */
function schemaName(value: string): string {
  if (typeof value !== "string" || !/^cv03_[a-z0-9_]{1,58}$/.test(value)) {
    throw new Error("ENTERPRISE_RESOURCE_POSTGRES_ISOLATED_SCHEMA_REQUIRED");
  }
  return '"' + value + '"';
}

function required(value: string, code: string): string {
  if (typeof value !== "string" || !value.trim()) throw new Error(code);
  return value.trim();
}

function addressValues(a: EnterpriseResourceAddressV010): string[] {
  return [
    required(a.contextId, "ENTERPRISE_RESOURCE_CONTEXT_REQUIRED"),
    required(a.namespace, "ENTERPRISE_RESOURCE_NAMESPACE_REQUIRED"),
    required(a.collectionId, "ENTERPRISE_RESOURCE_COLLECTION_REQUIRED"),
    required(a.resourceType, "ENTERPRISE_RESOURCE_TYPE_REQUIRED"),
    required(a.resourceId, "ENTERPRISE_RESOURCE_ID_REQUIRED")
  ];
}

function revisionNumber(value: number): number {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new Error("ENTERPRISE_RESOURCE_REVISION_INVALID");
  }
  return value;
}

function timestamp(value: string): string {
  if (typeof value !== "string" || !Number.isFinite(Date.parse(value))) {
    throw new Error("ENTERPRISE_RESOURCE_RECORDED_AT_INVALID");
  }
  return value;
}

function resourceFromRow(row: Record<string, unknown>): EnterpriseResourceV010 {
  const text = row.resource;
  const resource = validateEnterpriseResourceV010(
    (typeof text === "string" ? JSON.parse(text) : text) as EnterpriseResourceV010
  );
  const revision = Number(row.revision);
  if (!Number.isSafeInteger(revision) || resource.revision !== revision) {
    throw new Error("ENTERPRISE_RESOURCE_POSTGRES_REVISION_MISMATCH");
  }
  return resource;
}

function makeResource(
  input: EnterpriseResourceConditionalPutInputV010,
  previous: EnterpriseResourceV010 | undefined,
  revision: number
): EnterpriseResourceV010 {
  const [contextId, namespace, collectionId, resourceType, resourceId] = addressValues(input);
  const actor = required(input.actorSubjectId, "ENTERPRISE_RESOURCE_ACTOR_REQUIRED");
  const recordedAt = timestamp(input.recordedAt);
  return validateEnterpriseResourceV010({
    contractVersion: "0.1.0",
    contextId, namespace, collectionId, resourceType, resourceId,
    schemaRef: required(input.schemaRef, "ENTERPRISE_RESOURCE_SCHEMA_REQUIRED"),
    ...(input.ownerPackageId?.trim() ? { ownerPackageId: input.ownerPackageId.trim() } : {}),
    storageKind: input.storageKind ?? "DOCUMENT",
    ...(input.payload !== undefined ? { payload: structuredClone(input.payload) } : {}),
    ...(input.payloadRef?.trim() ? { payloadRef: input.payloadRef.trim() } : {}),
    ...(input.metadata ? { metadata: structuredClone(input.metadata) } : {}),
    lifecycleState: "ACTIVE",
    revision,
    createdAt: previous?.createdAt ?? recordedAt,
    createdBySubjectId: previous?.createdBySubjectId ?? actor,
    updatedAt: recordedAt,
    updatedBySubjectId: actor
  });
}

function database(input: { connectionString: string; schema: string }) {
  const schema = schemaName(input.schema);
  const connectionString = required(
    input.connectionString, "ENTERPRISE_RESOURCE_POSTGRES_DATABASE_URL_REQUIRED"
  );
  const sql = postgres(connectionString, {
    max: 5, connect_timeout: 10, idle_timeout: 15, prepare: false
  });
  return { sql, table: schema + ".resources",
    receipts: schema + ".cv03_resource_receipts", schema };
}

/**
 * Explicit isolated schema preparation. This is NOT a production migration and
 * must not be invoked automatically by a service's ordinary startup.
 */
export async function preparePostgresConditionalResourceSchemaV010(input: {
  connectionString: string;
  schema: string;
}): Promise<void> {
  const { sql, schema, table, receipts } = database(input);
  try {
    await sql.unsafe("CREATE SCHEMA IF NOT EXISTS " + schema);
    await sql.unsafe(
      "CREATE TABLE IF NOT EXISTS " + table + " (" +
      "context_id text NOT NULL, namespace text NOT NULL, " +
      "collection_id text NOT NULL, resource_type text NOT NULL, " +
      "resource_id text NOT NULL, revision bigint NOT NULL CHECK(revision >= 0), " +
      "resource jsonb NOT NULL CHECK(jsonb_typeof(resource)='object'), " +
      "PRIMARY KEY(context_id, namespace, collection_id, resource_type, resource_id))"
    );
    // Deliberate explicit opt-in schema, never a Host startup migration.
    await sql.unsafe(
      "CREATE TABLE IF NOT EXISTS " + receipts + " (" +
      "context_id text NOT NULL, idempotency_hash text NOT NULL, " +
      "receipt_id text NOT NULL UNIQUE, approval_digest text NOT NULL, " +
      "input_digest text NOT NULL, receipt_digest text NOT NULL, " +
      "receipt jsonb NOT NULL CHECK(jsonb_typeof(receipt)='object'), " +
      "resource jsonb NOT NULL CHECK(jsonb_typeof(resource)='object'), " +
      "PRIMARY KEY(context_id,idempotency_hash))"
    );
    await sql.unsafe("CREATE OR REPLACE FUNCTION " + schema +
      ".cv03_reject_receipt_mutation() RETURNS trigger LANGUAGE plpgsql AS " +
      "'BEGIN RAISE EXCEPTION ''CV03_RESOURCE_RECEIPT_IMMUTABLE''; END'");
    await sql.unsafe("CREATE OR REPLACE TRIGGER cv03_resource_receipts_immutable " +
      "BEFORE UPDATE OR DELETE ON " + receipts +
      " FOR EACH ROW EXECUTE FUNCTION " + schema + ".cv03_reject_receipt_mutation()");
  } finally {
    await sql.end();
  }
}


function verifyHostReceiptBinding(
  input: EnterpriseResourceConditionalPutInputV010,
  approval: AgentActionReceiptBeginInputV010
): void {
  if (!input.namespace.startsWith("evo.saved-view.personal.") ||
      input.resourceType !== "saved-collection-view" ||
      input.ownerPackageId !== "host-enterprise-context-provider" ||
      approval.ownerPackageId !== input.ownerPackageId ||
      approval.sourceActionId !== "collection.saved-view.personal.save" ||
      approval.toolId !== approval.sourceActionId ||
      approval.principalSubjectId !== input.actorSubjectId ||
      (approval.principalActorType !== "AI" && approval.principalActorType !== "HUMAN") ||
      approval.context?.kind !== "ENTERPRISE" ||
      approval.context.contextId !== input.contextId ||
      typeof approval.context.enterpriseId !== "string" ||
      !(input.payload && typeof input.payload === "object" && !Array.isArray(input.payload)) ||
      (input.payload as Record<string, unknown>).enterpriseId !== approval.context.enterpriseId ||
      (input.payload as Record<string, unknown>).ownerSubjectId !== approval.principalSubjectId ||
      typeof approval.idempotencyKey !== "string" || !approval.idempotencyKey.trim() ||
      typeof approval.receiptId !== "string" || !approval.receiptId.trim() ||
      typeof approval.invocationId !== "string" || !approval.invocationId.trim() ||
      typeof approval.sourceInteractionId !== "string" || !approval.sourceInteractionId.trim() ||
      typeof approval.requestedAt !== "string" ||
      !Number.isFinite(Date.parse(approval.requestedAt))) {
    throw new Error("CV03_RESOURCE_HOST_RECEIPT_BINDING_INVALID");
  }
  if (approval.inputDigest !== digestConditionalResourcePutV010(input)) {
    throw new Error("CV03_RESOURCE_HOST_RECEIPT_DIGEST_MISMATCH");
  }
}

/** Historical receipt evidence, independent of later updates to the live view. */
function committedFromReceiptRow(
  row: Record<string, unknown>,
  replayed: boolean
): EnterpriseResourceCommittedWriteV010 {
  const receipt = JSON.parse(String(row.receipt)) as AgentActionReceiptV010;
  const resource = validateEnterpriseResourceV010(
    JSON.parse(String(row.resource)) as EnterpriseResourceV010
  );
  if (sha256ResourceReceiptV010(receipt) !== row.receipt_digest) {
    throw new Error("CV03_RESOURCE_RECEIPT_EVIDENCE_INTEGRITY");
  }
  if (receipt.status !== "SUCCEEDED" ||
      receipt.resultDigest !== sha256ResourceReceiptV010(resource) ||
      receipt.inputDigest !== row.input_digest ||
      resource.lifecycleState !== "ACTIVE") {
    throw new Error("CV03_RESOURCE_RECEIPT_EVIDENCE_INTEGRITY");
  }
  return {resource, receipt, replayed};
}

function completedReceipt(
  approval: AgentActionReceiptBeginInputV010,
  resource: EnterpriseResourceV010
): AgentActionReceiptV010 {
  return {
    contractVersion: "0.1.0", receiptId: approval.receiptId,
    invocationId: approval.invocationId,
    idempotencyKey: approval.idempotencyKey,
    sourceInteractionId: approval.sourceInteractionId,
    sourceActionId: approval.sourceActionId,
    principalSubjectId: approval.principalSubjectId,
    principalActorType: approval.principalActorType,
    context: structuredClone(approval.context),
    toolId: approval.toolId, ownerPackageId: approval.ownerPackageId,
    ...(approval.capability ? {capability: approval.capability}: {}),
    effect: "WRITE", inputDigest: approval.inputDigest,
    status: "SUCCEEDED", requestedAt: approval.requestedAt,
    completedAt: resource.updatedAt,
    resultDigest: sha256ResourceReceiptV010(resource),
    resultEntityRefs: ["enterprise-resource:" + resource.resourceId],
    resultSummary: "Saved view resource and immutable receipt committed atomically",
    latestEventId: "cv03-resource-commit:" + approval.receiptId
  };
}

/** Independent clients and processes share PostgreSQL row locks/uniqueness. */
export function createPostgresConditionalResourceRepositoryV010(input: {
  connectionString: string;
  schema: string;
  /**
   * Privileged Host-only verifier keys. Without a configured verifier, the
   * receipt-bearing WRITE is unavailable; ordinary READ and C3-01 CAS remain.
   * Real credentials are never passed through an Action request or saved view.
   */
  trustedHostReceiptKeys?: readonly {keyId:string;secret:string}[];
  /**
   * EXPLICIT ISOLATED N1-03 only. Never selected by the production Host.
   * In this mode signed writes go exclusively through the DB-enforced
   * SECURITY DEFINER gateway and cannot downgrade to raw table DML.
   * Existing legacy direct mode is retained solely for old isolated tests.
   */
  receiptWriteMode?: "LEGACY_DIRECT_ISOLATED_V010" | "SQL_GATEWAY_ISOLATED_V010";
  /**
   * Explicit N1-04b CI-only SQL-login scope. Never selected by the official
   * Host: each physical SQL login is bound to exactly one principal/enterprise.
   * A shared multi-user connection string must NOT be treated as a principal.
   */
  readMode?: "SQL_ROLE_SCOPED_ISOLATED_V010";
}): EnterpriseResourceConditionalAsyncRepositoryV010 {
  if (input.receiptWriteMode !== undefined &&
      !["LEGACY_DIRECT_ISOLATED_V010","SQL_GATEWAY_ISOLATED_V010"]
        .includes(input.receiptWriteMode)) {
    throw new Error("CV03_RESOURCE_RECEIPT_WRITE_MODE_INVALID");
  }
  const gatewayMode=input.receiptWriteMode==="SQL_GATEWAY_ISOLATED_V010";
  if (input.readMode!==undefined &&
      input.readMode!=="SQL_ROLE_SCOPED_ISOLATED_V010") {
    throw Error("CV03_N104B_READ_MODE_INVALID");
  }
  const scopedReadMode=input.readMode==="SQL_ROLE_SCOPED_ISOLATED_V010";
  if (scopedReadMode && !gatewayMode) {
    throw Error("CV03_N104B_SCOPED_READ_REQUIRES_SQL_GATEWAY");
  }
  if (gatewayMode && input.trustedHostReceiptKeys?.length) {
    throw new Error("CV03_N1_GATEWAY_RUNTIME_MUST_NOT_HOLD_VERIFIER_SECRET");
  }
  const { sql, table, receipts, schema } = database(input);
  const verifierKeys = new Map<string,string>();
  for (const key of input.trustedHostReceiptKeys ?? []) {
    if (verifierKeys.has(key.keyId)) {
      throw Error("CV03_HOST_RECEIPT_SIGNING_CONFIG_INVALID");
    }
    // Validate key format and entropy floor before allowing any WRITE.
    hmacCv03HostResourceReceiptV010({
      receiptId:"validation",invocationId:"validation",
      idempotencyKey:"validation",sourceInteractionId:"validation",
      sourceActionId:"validation",principalSubjectId:"validation",
      principalActorType:"HUMAN",
      context:{contractVersion:"0.1.0",kind:"ENTERPRISE",
        contextId:"validation",enterpriseId:"validation"},
      toolId:"validation",ownerPackageId:"validation",
      inputDigest:"validation",requestedAt:"2026-11-09T05:00:00.000Z"
    },key.keyId,key.secret);
    verifierKeys.set(key.keyId,key.secret);
  }
  const selectAddress = (forUpdate: boolean): string =>
    "SELECT revision, resource::text AS resource FROM " + table +
    " WHERE context_id=$1 AND namespace=$2 AND collection_id=$3" +
    " AND resource_type=$4 AND resource_id=$5" +
    (forUpdate ? " FOR UPDATE" : "");
  // Each read operation is a physical SQL function when selected. A missing
  // scoped function or revoked runtime EXECUTE fails closed: no raw SELECT.
  const readAddressSql=scopedReadMode ?
    "SELECT revision,resource FROM "+schema+
      ".cv03_n1_scoped_get($1,$2,$3,$4,$5)" : selectAddress(false);
  const readReceiptSql=scopedReadMode ?
    "SELECT receipt,resource,input_digest,approval_digest,receipt_digest "+
      "FROM "+schema+".cv03_n1_scoped_receipt($1,$2)" :
    "SELECT receipt::text AS receipt,resource::text AS resource,"+
      "input_digest,approval_digest,receipt_digest FROM "+receipts+
      " WHERE context_id=$1 AND idempotency_hash=$2";

  return {
    conditionalWriteConsistency: "SHARED_POSTGRES_TRANSACTION",
    async get(address) {
      const rows = await sql.unsafe(readAddressSql,addressValues(address));
      return rows.length ? resourceFromRow(rows[0] as Record<string, unknown>) : undefined;
    },
    async list(input: EnterpriseResourceListInputV010) {
      const contextId = required(input.contextId, "ENTERPRISE_RESOURCE_CONTEXT_REQUIRED");
      const filter = (v: string | undefined): string | null => v === undefined ? null :
        required(v, "ENTERPRISE_RESOURCE_ADDRESS_INVALID");
      if (input.lifecycleState !== undefined &&
          !["ACTIVE", "ARCHIVED"].includes(input.lifecycleState)) {
        throw new Error("ENTERPRISE_RESOURCE_LIFECYCLE_INVALID");
      }
      const query=scopedReadMode ?
        "SELECT revision,resource FROM "+schema+
          ".cv03_n1_scoped_list($1,$2,$3,$4,$5)" :
        "SELECT revision, resource::text AS resource FROM " + table +
        " WHERE context_id=$1 AND ($2::text IS NULL OR namespace=$2)" +
        " AND ($3::text IS NULL OR collection_id=$3)" +
        " AND ($4::text IS NULL OR resource_type=$4)" +
        " AND ($5::text IS NULL OR resource->>'lifecycleState'=$5)" +
        " ORDER BY namespace, collection_id, resource_type, resource_id";
      const rows = await sql.unsafe(query,
        [contextId, filter(input.namespace), filter(input.collectionId),
         filter(input.resourceType), input.lifecycleState ?? null]
      );
      return rows.map(row => resourceFromRow(row as Record<string, unknown>));
    },
    async putIfRevision(input) {
      if (gatewayMode) {
        throw new Error("CV03_N1_GATEWAY_UNSIGNED_RESOURCE_WRITE_DENIED");
      }
      const address = addressValues(input);
      if (input.expectedRevision === null) {
        const resource = makeResource(input, undefined, 0);
        const result = await sql.unsafe(
          "INSERT INTO " + table +
          " (context_id,namespace,collection_id,resource_type,resource_id,revision,resource)" +
          " VALUES ($1,$2,$3,$4,$5,0,$6::text::jsonb)" +
          " ON CONFLICT DO NOTHING RETURNING revision,resource::text AS resource",
          [...address, JSON.stringify(resource)]
        );
        if (!result.length) throw new Error("ENTERPRISE_RESOURCE_REVISION_CONFLICT");
        return resourceFromRow(result[0] as Record<string, unknown>);
      }
      const expected = revisionNumber(input.expectedRevision);
      return sql.begin(async tx => {
        const rows = await tx.unsafe(selectAddress(true), address);
        if (!rows.length || Number(rows[0].revision) !== expected) {
          throw new Error("ENTERPRISE_RESOURCE_REVISION_CONFLICT");
        }
        const previous = resourceFromRow(rows[0] as Record<string, unknown>);
        if (previous.lifecycleState === "ARCHIVED") {
          throw new Error("ENTERPRISE_RESOURCE_ALREADY_ARCHIVED");
        }
        const next = makeResource(input, previous, expected + 1);
        const committed = await tx.unsafe(
          "UPDATE " + table +
          " SET revision=$6, resource=$7::text::jsonb" +
          " WHERE context_id=$1 AND namespace=$2 AND collection_id=$3" +
          " AND resource_type=$4 AND resource_id=$5 AND revision=$8" +
          " RETURNING revision,resource::text AS resource",
          [...address, expected + 1, JSON.stringify(next), expected]
        );
        if (committed.length !== 1) throw new Error("ENTERPRISE_RESOURCE_REVISION_CONFLICT");
        return resourceFromRow(committed[0] as Record<string, unknown>);
      });
    },

    async putIfRevisionWithReceipt(
      input: EnterpriseResourceConditionalPutInputV010,
      signedApproval: EnterpriseResourceSignedHostReceiptV010
    ): Promise<EnterpriseResourceCommittedWriteV010> {
      const approval=signedApproval?.receipt;
      const proof=signedApproval?.proof;
      const key=proof?.keyId && verifierKeys.get(proof.keyId);
      if((!gatewayMode && !key) || !proof ||
        !/^[a-zA-Z0-9_-]{1,48}$/.test(proof.keyId ?? "") ||
        proof.contractVersion!=="0.1.0" ||
        proof.purpose!=="cv03.enterprise-resource.host-write" ||
        proof.algorithm!=="HMAC-SHA256" ||
        typeof proof.signature!=="string" ||
        !/^[a-f0-9]{64}$/.test(proof.signature)){
        throw Error("CV03_RESOURCE_HOST_SIGNED_PROOF_REQUIRED");
      }
      if (!gatewayMode) {
        const expected=hmacCv03HostResourceReceiptV010(approval,proof.keyId,key!);
        if(!timingSafeEqual(Buffer.from(proof.signature,"hex"),
                            Buffer.from(expected,"hex"))){
          throw Error("CV03_RESOURCE_HOST_SIGNED_PROOF_INVALID");
        }
      }
      // These business/identity invariants apply to BOTH signed paths.
      // In gateway mode PostgreSQL also authenticates the HMAC itself.
      verifyHostReceiptBinding(input, approval);
      const address = addressValues(input);
      if (gatewayMode) {
        // This isolated mode is intentionally narrower than the legacy
        // Enterprise Resource contract. No raw DML or unsigned CAS fallback.
        if ((input.storageKind && input.storageKind!=="DOCUMENT") ||
            input.metadata || input.payloadRef) {
          throw Error("CV03_N1_GATEWAY_UNSUPPORTED_RESOURCE_SHAPE");
        }
        const approvalDigest=sha256ResourceReceiptV010(approval);
        const idHash=sha256ResourceReceiptV010(approval.idempotencyKey);
        const old=await sql.unsafe(readReceiptSql,[input.contextId,idHash]);
        // History is independent from later resource revisions: do not
        // regenerate the old canonical result using the live resource.
        let proposed:EnterpriseResourceV010;
        let complete:AgentActionReceiptV010;
        if (old.length) {
          const historic=committedFromReceiptRow(
            old[0] as Record<string,unknown>,true
          );
          proposed=historic.resource;
          complete=historic.receipt;
        } else {
          const prior=await sql.unsafe(readAddressSql,address);
          const current=prior.length ?
            resourceFromRow(prior[0] as Record<string,unknown>) : undefined;
          const revision=input.expectedRevision===null?0:
            revisionNumber(input.expectedRevision)+1;
          proposed=makeResource(input,current,revision);
          complete=completedReceipt(approval,proposed);
        }
        const envelope=stableResourceReceiptJsonV010({
          domain:"cv03.enterprise-resource.host-write/0.1.0",
          keyId:proof.keyId,receipt:approval
        });
        // NO untrusted SQL identifiers, and no DB signing secret in JS.
        const rows=await sql.unsafe(
          "SELECT "+schema+
          ".cv03_n1_signed_save($1::text,$2::text,$3::text,"+
          "$4::text,$5::text,$6::text) AS result",
          [stableResourceReceiptJsonV010(input),envelope,proof.signature,
           stableResourceReceiptJsonV010(proposed),
           stableResourceReceiptJsonV010(complete),
           stableResourceReceiptJsonV010(approval)]
        );
        if(rows.length!==1 || !rows[0].result ||
           typeof rows[0].result.replayed!=="boolean") {
          throw Error("CV03_N1_GATEWAY_RESULT_INVALID");
        }
        const record=await sql.unsafe(readReceiptSql,[input.contextId,idHash]);
        if (record.length!==1 || record[0].approval_digest!==approvalDigest){
          throw Error("CV03_N1_GATEWAY_COMMITTED_EVIDENCE_INVALID");
        }
        const committed=committedFromReceiptRow(
          record[0] as Record<string,unknown>,
          Boolean(rows[0].result.replayed)
        );
        if(sha256ResourceReceiptV010(committed.resource)!==
           sha256ResourceReceiptV010(rows[0].result.resource) ||
           sha256ResourceReceiptV010(committed.receipt)!==
           sha256ResourceReceiptV010(rows[0].result.receipt) ||
           committed.receipt.receiptId!==approval.receiptId ||
           committed.receipt.inputDigest!==approval.inputDigest ||
           addressValues(committed.resource).some((v,i)=>v!==address[i])){
          throw Error("CV03_N1_GATEWAY_COMMITTED_EVIDENCE_INVALID");
        }
        return committed;
      }
      const keyHash = sha256ResourceReceiptV010(approval.idempotencyKey);
      const approvalDigest = sha256ResourceReceiptV010(approval);
      return sql.begin(async tx => {
        // One scoped idempotency serialization point shared by ALL PG clients.
        // Hash collisions only over-serialize; they cannot approve a wrong key.
        await tx.unsafe(
          "SELECT pg_advisory_xact_lock(hashtextextended($1::text,0))",
          [input.contextId + "|" + keyHash]
        );
        const previous = await tx.unsafe(
          "SELECT receipt::text AS receipt,resource::text AS resource," +
          " input_digest,approval_digest,receipt_digest FROM " + receipts +
          " WHERE context_id=$1 AND idempotency_hash=$2",
          [input.contextId, keyHash]
        );
        if (previous.length) {
          if (previous[0].input_digest !== approval.inputDigest ||
              previous[0].approval_digest !== approvalDigest) {
            throw new Error("CV03_RESOURCE_RECEIPT_IDEMPOTENCY_CONFLICT");
          }
          const committed = committedFromReceiptRow(
            previous[0] as Record<string,unknown>, true
          );
          if (committed.receipt.receiptId !== approval.receiptId ||
              addressValues(committed.resource).some((v,i) => v !== address[i])) {
            throw new Error("CV03_RESOURCE_RECEIPT_IDEMPOTENCY_CONFLICT");
          }
          return committed;
        }
        let resource: EnterpriseResourceV010;
        if (input.expectedRevision === null) {
          const first = makeResource(input,undefined,0);
          const created = await tx.unsafe(
            "INSERT INTO " + table +
            " (context_id,namespace,collection_id,resource_type,resource_id,revision,resource)" +
            " VALUES ($1,$2,$3,$4,$5,0,$6::text::jsonb)" +
            " ON CONFLICT DO NOTHING RETURNING revision,resource::text AS resource",
            [...address,JSON.stringify(first)]
          );
          if (created.length !== 1) {
            throw new Error("ENTERPRISE_RESOURCE_REVISION_CONFLICT");
          }
          resource = resourceFromRow(created[0] as Record<string,unknown>);
        } else {
          const expected = revisionNumber(input.expectedRevision);
          const rows = await tx.unsafe(selectAddress(true),address);
          if(rows.length !== 1 || Number(rows[0].revision) !== expected) {
            throw new Error("ENTERPRISE_RESOURCE_REVISION_CONFLICT");
          }
          const prior = resourceFromRow(rows[0] as Record<string,unknown>);
          if(prior.lifecycleState === "ARCHIVED") {
            throw new Error("ENTERPRISE_RESOURCE_ALREADY_ARCHIVED");
          }
          const next = makeResource(input,prior,expected+1);
          const updated = await tx.unsafe(
            "UPDATE " + table + " SET revision=$6,resource=$7::text::jsonb" +
            " WHERE context_id=$1 AND namespace=$2 AND collection_id=$3" +
            " AND resource_type=$4 AND resource_id=$5 AND revision=$8" +
            " RETURNING revision,resource::text AS resource",
            [...address,expected+1,JSON.stringify(next),expected]
          );
          if(updated.length !== 1)throw Error("ENTERPRISE_RESOURCE_REVISION_CONFLICT");
          resource = resourceFromRow(updated[0] as Record<string,unknown>);
        }
        const receipt=completedReceipt(approval,resource);
        // The INSERT is intentionally AFTER the business CAS in the SAME tx.
        // A failed receipt INSERT (or a killed Worker) rolls back the resource.
        await tx.unsafe(
          "INSERT INTO " + receipts +
          " (context_id,idempotency_hash,receipt_id,approval_digest,input_digest," +
          " receipt_digest,receipt,resource) " +
          "VALUES ($1,$2,$3,$4,$5,$6,$7::text::jsonb,$8::text::jsonb)",
          [input.contextId,keyHash,approval.receiptId,approvalDigest,
           approval.inputDigest,sha256ResourceReceiptV010(receipt),
           JSON.stringify(receipt),JSON.stringify(resource)]
        );
        return {resource,receipt,replayed:false};
      });
    },
    async getCommittedWriteByIdempotencyKey(
      query: EnterpriseResourceCommittedWriteLookupV010
    ): Promise<EnterpriseResourceCommittedWriteV010 | undefined> {
      const address=addressValues(query.address);
      if (!query.idempotencyKey?.trim() || !query.receiptId?.trim() ||
          !query.inputDigest?.trim() || !query.principalSubjectId?.trim() ||
          !["AI","HUMAN"].includes(query.principalActorType)) {
        throw new Error("CV03_RESOURCE_RECEIPT_LOOKUP_INVALID");
      }
      const rows=await sql.unsafe(readReceiptSql,
        [address[0],sha256ResourceReceiptV010(query.idempotencyKey)]
      );
      if(rows.length!==1)return undefined;
      const item=rows[0] as Record<string,unknown>;
      const result=committedFromReceiptRow(item,false);
      if(result.receipt.receiptId!==query.receiptId ||
        result.receipt.idempotencyKey!==query.idempotencyKey ||
        result.receipt.inputDigest!==query.inputDigest ||
        result.receipt.principalSubjectId!==query.principalSubjectId ||
        result.receipt.principalActorType!==query.principalActorType ||
        addressValues(result.resource).some((v,i)=>v!==address[i]))return undefined;
      return result;
    },
    async archiveIfRevision(input: EnterpriseResourceConditionalArchiveInputV010) {
      if (gatewayMode) {
        throw Error("CV03_N1_GATEWAY_UNSIGNED_RESOURCE_WRITE_DENIED");
      }
      const expected = revisionNumber(input.expectedRevision);
      const address = addressValues(input.address);
      return sql.begin(async tx => {
        const rows = await tx.unsafe(selectAddress(true), address);
        if (!rows.length || Number(rows[0].revision) !== expected) {
          throw new Error("ENTERPRISE_RESOURCE_REVISION_CONFLICT");
        }
        const previous = resourceFromRow(rows[0] as Record<string, unknown>);
        if (previous.lifecycleState === "ARCHIVED") {
          throw new Error("ENTERPRISE_RESOURCE_ALREADY_ARCHIVED");
        }
        const next = validateEnterpriseResourceV010({
          ...previous, revision: expected + 1, lifecycleState: "ARCHIVED",
          updatedAt: timestamp(input.recordedAt),
          updatedBySubjectId: required(input.actorSubjectId, "ENTERPRISE_RESOURCE_ACTOR_REQUIRED")
        });
        const committed = await tx.unsafe(
          "UPDATE " + table +
          " SET revision=$6, resource=$7::text::jsonb" +
          " WHERE context_id=$1 AND namespace=$2 AND collection_id=$3" +
          " AND resource_type=$4 AND resource_id=$5 AND revision=$8" +
          " RETURNING revision,resource::text AS resource",
          [...address, expected + 1, JSON.stringify(next), expected]
        );
        if (committed.length !== 1) throw new Error("ENTERPRISE_RESOURCE_REVISION_CONFLICT");
        return resourceFromRow(committed[0] as Record<string, unknown>);
      });
    },
    async close() { await sql.end(); }
  };
}
