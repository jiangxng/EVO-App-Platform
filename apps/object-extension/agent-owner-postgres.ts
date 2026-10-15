import {createHash} from "node:crypto";
import postgres from "postgres";
import type {EnterpriseResourceV010} from "../../contracts/enterprise-resource.js";
import type {ObjectExtensionDefinitionV010} from "../../contracts/foundation-object/extension.js";
import {assertObjectExtensionDefinitionV010} from "../../contracts/foundation-object/extension.js";
import type {GovernedAgentBusinessOwnerV040} from
  "../../agents/enterprise-agent/pa02b-governed-owner-write-handoff.js";
import type {AgentOwnerVerifierV030} from
  "../../agents/enterprise-agent/pa02b-owner-reconciliation.js";
import {hostAgentDurabilityScopeKeyV020}
  from "../../agents/enterprise-agent/pa02b-postgres-coordination.js";
import {OBJECT_EXTENSION_PACKAGE_ID,OBJECT_EXTENSION_DEFINITION_UPSERT_OPERATION_V010}
  from "./constants.js";
import {OBJECT_EXTENSION_NAMESPACE_V010,OBJECT_EXTENSION_COLLECTION_V010,
  OBJECT_EXTENSION_RESOURCE_TYPE_V010,OBJECT_EXTENSION_SCHEMA_V010} from "./repository.js";

/**
 * PA-02 isolated PostgreSQL BUSINESS-owner storage gate, not a Host registration.
 * Unlike the existing synchronous file ResourceRepository, this implementation
 * commits the actual Object Extension resource and immutable Owner receipt in
 * ONE PostgreSQL transaction shared by independent Node processes.
 *
 * Its schema is deliberately opt-in and isolated. Do NOT point ordinary Host
 * Object Extension/file-store reads at this schema without a separate
 * Enterprise Resource Provider cutover/migration and production WRITE approval.
 */
const hash=(value:string)=>createHash("sha256").update(value).digest("hex");
function canonical(value:unknown):unknown {
  if(Array.isArray(value))return value.map(canonical);
  if(value!==null&&typeof value==="object")return Object.fromEntries(
    Object.entries(value as Record<string,unknown>)
      .sort(([a],[b])=>a.localeCompare(b)).map(([k,v])=>[k,canonical(v)]));
  return value;
}
const json=(value:unknown)=>JSON.stringify(canonical(value));
function pgJson<T>(raw:unknown):T {
  // postgres.js sql.unsafe() returns JSONB as encoded text with this project's
  // current driver configuration. Never cast it directly to a domain object.
  const parsed=typeof raw==="string"?JSON.parse(raw):raw;
  if(!parsed||typeof parsed!=="object"||Array.isArray(parsed))
    throw Error("PA02_OBJECT_PG_JSONB_INVALID");
  return parsed as T;
}
function id(value:unknown):string {
  if(typeof value!=="string"||!value.trim())
    throw Error("PA02_OBJECT_PG_ID_REQUIRED");
  return value.trim();
}
function schemaName(value:string):string {
  if(!/^pa02_[a-z0-9_]{1,58}$/.test(value))
    throw Error("PA02_OBJECT_PG_ISOLATED_SCHEMA_REQUIRED");
  return '"'+value+'"';
}
function definitionOf(value:Record<string,unknown>|undefined):ObjectExtensionDefinitionV010 {
  if(!value||Object.keys(value).length!==1||
    !value.definition||typeof value.definition!=="object"||
    Array.isArray(value.definition))
    throw Error("PA02_OBJECT_PG_ARGUMENTS_INVALID");
  return assertObjectExtensionDefinitionV010(
    structuredClone(value.definition) as ObjectExtensionDefinitionV010);
}
type Source={
  scope:{contextKind:string;contextId:string;enterpriseId?:string;
    principalSubjectId:string;principalActorType:string};
  runId:string;effectId:string;receiptId:string;idempotencyKey:string;
  inputDigest:string;toolId:string;arguments?:Record<string,unknown>;
};
type Evidence={
  contractVersion:"0.1.0";runId:string;effectId:string;receiptId:string;
  idempotencyKey:string;inputDigest:string;ownerPackageId:string;
  contextId:string;enterpriseId:string;principalSubjectId:string;
  principalActorType:string;toolId:string;recordId:string;
  definition:ObjectExtensionDefinitionV010;recordedAt:string;
};
function scoped(source:{scope:Source["scope"]}) {
  if(source.scope?.contextKind!=="ENTERPRISE"||
     !source.scope.enterpriseId?.trim()||!source.scope.contextId?.trim()||
     !source.scope.principalSubjectId?.trim()||
     !["AI","HUMAN"].includes(source.scope.principalActorType))
    throw Error("PA02_OBJECT_PG_ENTERPRISE_SCOPE_REQUIRED");
  return {
    contextId:id(source.scope.contextId),
    enterpriseId:id(source.scope.enterpriseId),
    subjectId:id(source.scope.principalSubjectId),
    actorType:source.scope.principalActorType
  };
}
function config(input:{connectionString:string;schema:string}) {
  const q=schemaName(input.schema);
  const sql=postgres(id(input.connectionString),{
    max:6,connect_timeout:10,idle_timeout:15
  });
  return {q,sql};
}

/** Explicit isolated schema preparation. Never run on ordinary Host startup. */
export async function preparePostgresObjectExtensionOwnerSchemaV010(input:{
  connectionString:string;schema:string;
}):Promise<void> {
  const {q,sql}=config(input);
  try{
    await sql.unsafe("CREATE SCHEMA IF NOT EXISTS "+q);
    await sql.unsafe("CREATE TABLE IF NOT EXISTS "+q+".pa02_contexts ("+
      "context_id text PRIMARY KEY,enterprise_id text NOT NULL,"+
      "UNIQUE(context_id,enterprise_id))");
    await sql.unsafe("CREATE TABLE IF NOT EXISTS "+q+".pa02_definitions ("+
      "context_id text NOT NULL,enterprise_id text NOT NULL,"+
      "extension_id text NOT NULL,target_object_type text NOT NULL,"+
      "target_slot text NOT NULL,field_id text NOT NULL,"+
      "resource jsonb NOT NULL CHECK(jsonb_typeof(resource)='object'),created_at timestamptz NOT NULL,"+
      "PRIMARY KEY(context_id,extension_id),"+
      "UNIQUE(context_id,enterprise_id,extension_id),"+
      "FOREIGN KEY(context_id,enterprise_id) REFERENCES "+
        q+".pa02_contexts(context_id,enterprise_id))");
    // A historically ARCHIVED definition may coexist with a new ACTIVE
    // definition at the same business field slot. The legacy proof schema
    // constrained even archived rows; converge it during explicit preparation.
    await sql.unsafe("CREATE UNIQUE INDEX IF NOT EXISTS "+
      "pa02_active_field_unique ON "+q+".pa02_definitions "+
      "(context_id,target_object_type,target_slot,field_id) "+
      "WHERE (resource->>'lifecycleState')='ACTIVE'");
    const legacyKeys=await sql.unsafe("SELECT conname FROM pg_constraint "+
      "WHERE conrelid=$1::regclass AND contype='u' AND "+
      "pg_get_constraintdef(oid) LIKE 'UNIQUE (context_id, target_object_type, target_slot, field_id)%'",
      [input.schema+".pa02_definitions"]);
    for(const key of legacyKeys){
      await sql.unsafe("ALTER TABLE "+q+".pa02_definitions DROP CONSTRAINT "+
        '"'+String(key.conname).replaceAll('"','""')+'"');
    }
    await sql.unsafe("CREATE TABLE IF NOT EXISTS "+q+".pa02_owner_evidence ("+
      "context_id text NOT NULL,enterprise_id text NOT NULL,"+
      "idempotency_hash text NOT NULL,run_id text NOT NULL,"+
      "effect_id text NOT NULL,receipt_id text NOT NULL,"+
      "input_digest text NOT NULL,resource_id text NOT NULL,"+
      "evidence jsonb NOT NULL CHECK(jsonb_typeof(evidence)='object'),evidence_digest text NOT NULL,"+
      "recorded_at timestamptz NOT NULL,"+
      "PRIMARY KEY(context_id,idempotency_hash),"+
      "UNIQUE(context_id,run_id,effect_id),"+
      "FOREIGN KEY(context_id,enterprise_id,resource_id) REFERENCES "+
        q+".pa02_definitions(context_id,enterprise_id,extension_id))");
    // Accidental updates or deletes cannot rewrite the Owner's historical fact.
    await sql.unsafe("CREATE OR REPLACE FUNCTION "+q+
      ".pa02_reject_receipt_mutation() RETURNS trigger LANGUAGE plpgsql AS "+
      "$$ BEGIN RAISE EXCEPTION 'PA02_OBJECT_PG_EVIDENCE_IMMUTABLE'; END $$");
    await sql.unsafe("CREATE OR REPLACE TRIGGER pa02_evidence_immutable "+
      "BEFORE UPDATE OR DELETE ON "+q+".pa02_owner_evidence "+
      "FOR EACH ROW EXECUTE FUNCTION "+q+".pa02_reject_receipt_mutation()");
  }finally{await sql.end();}
}

export function createPostgresObjectExtensionAtomicOwnerV010(input:{
  connectionString:string;schema:string;now?:()=>Date;
  /** Test-only crash checkpoint AFTER business insert, BEFORE evidence insert. */
  testOnlyAfterBusinessInsert?:()=>Promise<void>;
  /** D14C4: trusted opt-in transaction-local source for database physical
   * guard; only install against an explicitly prepared isolated PA-02 schema.
   * Ordinary Object Extension existing file-backed production is unchanged. */
  pa05PhysicalAdmission?:{workerSchema:string};
}):{
  owner:GovernedAgentBusinessOwnerV040;
  verifier:AgentOwnerVerifierV030;
  getResource:(scope:{contextId:string;enterpriseId:string},
    extensionId:string)=>Promise<EnterpriseResourceV010|undefined>;
  /** Source-neutral resource envelopes, including migrated legacy definitions. */
  listResources:(scope:{contextId:string;enterpriseId:string},
    options?:{lifecycleState?:"ACTIVE"|"ARCHIVED"})=>Promise<EnterpriseResourceV010[]>;
  close:()=>Promise<void>;
} {
  const {q,sql}=config(input),now=input.now??(()=>new Date());
  if(input.pa05PhysicalAdmission &&
     (!/^[a-z][a-z0-9_]{0,62}$/.test(input.pa05PhysicalAdmission.workerSchema)||
      input.pa05PhysicalAdmission.workerSchema===input.schema))
    throw Error("PA05_OBJECT_SQL_PHYSICAL_SOURCE_CONFIG_INVALID");
  const owner:GovernedAgentBusinessOwnerV040={
    ownerPackageId:OBJECT_EXTENSION_PACKAGE_ID,
    async invoke(r) {
      const s=scoped(r);
      if(r.toolId!==OBJECT_EXTENSION_DEFINITION_UPSERT_OPERATION_V010)
        throw Error("PA02_OBJECT_PG_OPERATION_DENIED");
      const definition=definitionOf(r.arguments);
      if(hash(json(r.arguments))!==r.inputDigest)
        throw Error("PA02_OBJECT_PG_DIGEST_MISMATCH");
      const key=hash(id(r.idempotencyKey));
      const evidence:Evidence={
        contractVersion:"0.1.0",runId:id(r.runId),effectId:id(r.effectId),
        receiptId:id(r.receiptId),idempotencyKey:r.idempotencyKey,
        inputDigest:r.inputDigest,ownerPackageId:OBJECT_EXTENSION_PACKAGE_ID,
        contextId:s.contextId,enterpriseId:s.enterpriseId,
        principalSubjectId:s.subjectId,principalActorType:s.actorType,
        toolId:r.toolId,recordId:definition.extensionId,
        definition,recordedAt:now().toISOString()
      };
      await sql.begin(async tx=>{
        if(input.pa05PhysicalAdmission){
          // All markers are SET LOCAL and cleared on transaction commit or
          // rollback; the physical PG business-table trigger checks D10
          // ticket + PA-02 INVOKING/UNKNOWN + the local monotone STOP.
          // This is not a public Agent/Worker capability.
          const values:[
            string,string
          ][]=[
            ["scope_key",hostAgentDurabilityScopeKeyV020(r.scope)],
            ["run_id",r.runId],
            ["effect_id",r.effectId],
            ["input_digest",r.inputDigest],
            ["context_id",s.contextId],
            ["enterprise_id",s.enterpriseId]
          ];
          for(const [key,value] of values)
            await tx.unsafe("SELECT set_config($1,$2,true)",
              ["evo.pa05."+key,value]);
        }
        await tx.unsafe("INSERT INTO "+q+".pa02_contexts(context_id,enterprise_id) "+
          "VALUES($1,$2) ON CONFLICT DO NOTHING",[s.contextId,s.enterpriseId]);
        // Ordinary Owner retains the original FOR UPDATE authority.
        // PA05 physical opt-in has strictly SELECT+INSERT SQL privileges:
        // advisory transaction lock serializes cooperating opted-in Owners
        // across processes without giving the runtime LOGIN table UPDATE.
        if(input.pa05PhysicalAdmission)
          await tx.unsafe("SELECT pg_advisory_xact_lock("+
            "hashtextextended($1::text,0))",[s.contextId]);
        const bindings=await tx.unsafe("SELECT enterprise_id FROM "+q+
          ".pa02_contexts WHERE context_id=$1 "+
          (input.pa05PhysicalAdmission?"FOR SHARE":"FOR UPDATE"),[s.contextId]);
        if(bindings[0]?.enterprise_id!==s.enterpriseId)
          throw Error("PA02_OBJECT_PG_ENTERPRISE_BINDING_CONFLICT");
        const previous=await tx.unsafe("SELECT evidence,evidence_digest FROM "+q+
          ".pa02_owner_evidence WHERE context_id=$1 AND idempotency_hash=$2",
          [s.contextId,key]);
        if(previous.length) {
          const prior=pgJson<Evidence>(previous[0].evidence);
          const conflicts=[
            ["runId",prior.runId!==evidence.runId],
            ["effectId",prior.effectId!==evidence.effectId],
            ["receiptId",prior.receiptId!==evidence.receiptId],
            ["inputDigest",prior.inputDigest!==evidence.inputDigest],
            ["enterpriseId",prior.enterpriseId!==evidence.enterpriseId],
            ["principalSubjectId",prior.principalSubjectId!==evidence.principalSubjectId],
            ["principalActorType",prior.principalActorType!==evidence.principalActorType],
            ["toolId",prior.toolId!==evidence.toolId],
            ["definition",json(prior.definition)!==json(definition)],
            ["idempotencyKey",prior.idempotencyKey!==evidence.idempotencyKey]
          ].filter(([,mismatch])=>mismatch).map(([field])=>field);
          if(conflicts.length)
            throw Error("PA02_OBJECT_PG_IDEMPOTENCY_CONFLICT_SOURCE:"+conflicts.join(","));
          if(previous[0].evidence_digest!==hash(json(prior)))
            throw Error("PA02_OBJECT_PG_IDEMPOTENCY_CONFLICT_EVIDENCE_INTEGRITY");
          return;
        }
        const record:EnterpriseResourceV010={
          contractVersion:"0.1.0",contextId:s.contextId,
          namespace:OBJECT_EXTENSION_NAMESPACE_V010,
          collectionId:OBJECT_EXTENSION_COLLECTION_V010,
          resourceType:OBJECT_EXTENSION_RESOURCE_TYPE_V010,
          resourceId:definition.extensionId,
          schemaRef:OBJECT_EXTENSION_SCHEMA_V010,
          ownerPackageId:OBJECT_EXTENSION_PACKAGE_ID,
          storageKind:"DOCUMENT",payload:JSON.parse(JSON.stringify(definition)),
          metadata:{targetObjectType:definition.targetObjectType,
            targetSlot:definition.targetSlot,fieldId:definition.fieldId,
            namespace:definition.namespace},
          lifecycleState:"ACTIVE",createdAt:evidence.recordedAt,
          createdBySubjectId:s.subjectId,updatedAt:evidence.recordedAt,
          updatedBySubjectId:s.subjectId
        };
        const inserted=await tx.unsafe("INSERT INTO "+q+".pa02_definitions "+
          "(context_id,enterprise_id,extension_id,target_object_type,target_slot,"+
          "field_id,resource,created_at) "+
          "VALUES($1,$2,$3,$4,$5,$6,$7::jsonb,$8::timestamptz) "+
          "ON CONFLICT DO NOTHING RETURNING extension_id",
          [s.contextId,s.enterpriseId,definition.extensionId,
            definition.targetObjectType,definition.targetSlot,definition.fieldId,
            sql.json(JSON.parse(JSON.stringify(record))),evidence.recordedAt]);
        if(!inserted.length)throw Error("PA02_OBJECT_PG_CREATE_ONLY_OR_FIELD_CONFLICT");
        if(input.testOnlyAfterBusinessInsert)
          await input.testOnlyAfterBusinessInsert();
        await tx.unsafe("INSERT INTO "+q+".pa02_owner_evidence "+
          "(context_id,enterprise_id,idempotency_hash,run_id,effect_id,"+
          "receipt_id,input_digest,resource_id,evidence,evidence_digest,recorded_at) "+
          "VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb,$10,$11::timestamptz)",
          [s.contextId,s.enterpriseId,key,evidence.runId,evidence.effectId,
            evidence.receiptId,evidence.inputDigest,evidence.recordId,
            sql.json(JSON.parse(JSON.stringify(evidence))),hash(json(evidence)),evidence.recordedAt]);
      });
    }
  };
  const verifier:AgentOwnerVerifierV030={
    async verify(r) {
      const s=scoped(r);
      if(r.ownerPackageId!==OBJECT_EXTENSION_PACKAGE_ID)return {outcome:"UNRESOLVED"};
      const matches=await sql.unsafe("SELECT e.evidence,e.evidence_digest,"+
        "e.idempotency_hash,d.resource FROM "+q+".pa02_owner_evidence e "+
        "JOIN "+q+".pa02_definitions d ON d.context_id=e.context_id "+
        "AND d.enterprise_id=e.enterprise_id AND d.extension_id=e.resource_id "+
        "WHERE e.context_id=$1 AND e.enterprise_id=$2 AND e.run_id=$3 "+
        "AND e.effect_id=$4 AND e.receipt_id=$5 AND e.input_digest=$6",
        [s.contextId,s.enterpriseId,r.runId,r.effectId,r.receiptId,r.inputDigest]);
      if(matches.length!==1)return {outcome:"UNRESOLVED"};
      const m=matches[0],e=pgJson<Evidence>(m.evidence);
      if(e.contractVersion!=="0.1.0"||
        e.contextId!==s.contextId||e.enterpriseId!==s.enterpriseId||
        e.principalSubjectId!==s.subjectId||e.principalActorType!==s.actorType||
        e.ownerPackageId!==OBJECT_EXTENSION_PACKAGE_ID||
        e.recordId!==pgJson<EnterpriseResourceV010>(m.resource).resourceId||
        e.inputDigest!==r.inputDigest||
        hash(e.idempotencyKey)!==m.idempotency_hash||
        hash(json(e))!==m.evidence_digest)
        return {outcome:"UNRESOLVED"};
      // Historical success derives from the immutable Owner receipt, NOT an
      // equality test against a potentially later human-edited business row.
      return {
        outcome:"SUCCEEDED",evidenceRef:"object-extension:pg:"+input.schema+":"+
          m.idempotency_hash,evidenceDigest:m.evidence_digest,
        terminal:{receiptId:r.receiptId,status:"SUCCEEDED",
          completedAt:e.recordedAt,resultDigest:hash(json(e.definition)),
          resultEntityRefs:["object-extension:"+e.recordId],
          resultSummary:"Object Extension creation committed with atomic Owner evidence"}
      };
    }
  };
  return {
    owner,verifier,
    async getResource(scope,extensionId) {
      const rows=await sql.unsafe("SELECT d.resource FROM "+q+".pa02_definitions d "+
        "JOIN "+q+".pa02_contexts c ON c.context_id=d.context_id "+
        "AND c.enterprise_id=d.enterprise_id "+
        "WHERE d.context_id=$1 AND d.enterprise_id=$2 AND d.extension_id=$3",
        [id(scope.contextId),id(scope.enterpriseId),id(extensionId)]);
      return rows[0]?pgJson<EnterpriseResourceV010>(rows[0].resource):undefined;
    },
    async listResources(scope,options) {
      const rows=await sql.unsafe("SELECT d.resource FROM "+q+".pa02_definitions d "+
        "JOIN "+q+".pa02_contexts c ON c.context_id=d.context_id "+
        "AND c.enterprise_id=d.enterprise_id "+
        "WHERE d.context_id=$1 AND d.enterprise_id=$2 "+
        "ORDER BY d.extension_id",
        [id(scope.contextId),id(scope.enterpriseId)]);
      const resources=rows.map(row=>pgJson<EnterpriseResourceV010>(row.resource));
      return options?.lifecycleState
        ? resources.filter(resource=>resource.lifecycleState===options.lifecycleState)
        : resources;
    },
    close:()=>sql.end()
  };
}
