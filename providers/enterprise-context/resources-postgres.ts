import postgres from "postgres";
import type {
  EnterpriseResourceAddressV010,
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
  return { sql, table: schema + ".resources", schema };
}

/**
 * Explicit isolated schema preparation. This is NOT a production migration and
 * must not be invoked automatically by a service's ordinary startup.
 */
export async function preparePostgresConditionalResourceSchemaV010(input: {
  connectionString: string;
  schema: string;
}): Promise<void> {
  const { sql, schema, table } = database(input);
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
  } finally {
    await sql.end();
  }
}

/** Independent clients and processes share PostgreSQL row locks/uniqueness. */
export function createPostgresConditionalResourceRepositoryV010(input: {
  connectionString: string;
  schema: string;
}): EnterpriseResourceConditionalAsyncRepositoryV010 {
  const { sql, table } = database(input);
  const selectAddress = (forUpdate: boolean): string =>
    "SELECT revision, resource::text AS resource FROM " + table +
    " WHERE context_id=$1 AND namespace=$2 AND collection_id=$3" +
    " AND resource_type=$4 AND resource_id=$5" +
    (forUpdate ? " FOR UPDATE" : "");

  return {
    conditionalWriteConsistency: "SHARED_POSTGRES_TRANSACTION",
    async get(address) {
      const rows = await sql.unsafe(selectAddress(false), addressValues(address));
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
      const rows = await sql.unsafe(
        "SELECT revision, resource::text AS resource FROM " + table +
        " WHERE context_id=$1 AND ($2::text IS NULL OR namespace=$2)" +
        " AND ($3::text IS NULL OR collection_id=$3)" +
        " AND ($4::text IS NULL OR resource_type=$4)" +
        " AND ($5::text IS NULL OR resource->>'lifecycleState'=$5)" +
        " ORDER BY namespace, collection_id, resource_type, resource_id",
        [contextId, filter(input.namespace), filter(input.collectionId),
         filter(input.resourceType), input.lifecycleState ?? null]
      );
      return rows.map(row => resourceFromRow(row as Record<string, unknown>));
    },
    async putIfRevision(input) {
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
    async archiveIfRevision(input: EnterpriseResourceConditionalArchiveInputV010) {
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
