import {createHash} from "node:crypto";
import {readFileSync} from "node:fs";
import postgres from "postgres";
import type {EnterpriseResourceV010} from "../../contracts/enterprise-resource.js";
import {assertObjectExtensionDefinitionV010} from
  "../../contracts/foundation-object/extension.js";
import {
  OBJECT_EXTENSION_NAMESPACE_V010,OBJECT_EXTENSION_COLLECTION_V010,
  OBJECT_EXTENSION_RESOURCE_TYPE_V010,OBJECT_EXTENSION_SCHEMA_V010
} from "./repository.js";
import {OBJECT_EXTENSION_PACKAGE_ID} from "./constants.js";
import {preparePostgresObjectExtensionOwnerSchemaV010} from "./agent-owner-postgres.js";

/**
 * Explicit OFFLINE, isolated PA-02 data-migration rehearsal.
 *
 * This is deliberately NOT the Host's synchronous EnterpriseResourceRepository.
 * Operators must stop all writers to the source file before importing and
 * must not enable two simultaneous authorities. Byte digests detect drift
 * during this operation, but CANNOT stop an uncooperative file writer afterward.
 */
type Binding={contextId:string;enterpriseId:string};
type StoreSnapshot={contractVersion:"0.1.0";resources:EnterpriseResourceV010[]};
const sha=(input:string)=>createHash("sha256").update(input).digest("hex");
const required=(v:string)=> {
  if(typeof v!=="string"||!v.trim())throw Error("PA02_OBJECT_IMPORT_VALUE_REQUIRED");
  return v.trim();
};
function schemaName(value:string):string {
  if(!/^pa02_[a-z0-9_]{1,58}$/.test(value))
    throw Error("PA02_OBJECT_IMPORT_ISOLATED_SCHEMA_REQUIRED");
  return '"'+value+'"';
}
function stable(v:unknown):unknown {
  if(Array.isArray(v))return v.map(stable);
  if(v!==null&&typeof v==="object")return Object.fromEntries(
    Object.entries(v as Record<string,unknown>)
      .sort(([a],[b])=>a.localeCompare(b)).map(([k,x])=>[k,stable(x)]));
  return v;
}
const canonical=(v:unknown)=>JSON.stringify(stable(v));
function json<T>(raw:unknown):T {
  const value=typeof raw==="string"?JSON.parse(raw):raw;
  if(value===null||typeof value!=="object"||Array.isArray(value))
    throw Error("PA02_OBJECT_IMPORT_JSON_INVALID");
  return value as T;
}
function key(resource:EnterpriseResourceV010){
  return [resource.contextId,resource.namespace,resource.collectionId,
    resource.resourceType,resource.resourceId].map(required).join("\u001f");
}
function readSource(sourceFile:string,expectedSourceDigest:string):StoreSnapshot {
  if(!/^[0-9a-f]{64}$/.test(expectedSourceDigest))
    throw Error("PA02_OBJECT_IMPORT_DIGEST_INVALID");
  const bytes=readFileSync(sourceFile,"utf8");
  if(sha(bytes)!==expectedSourceDigest)
    throw Error("PA02_OBJECT_IMPORT_SOURCE_DRIFT");
  const snapshot=json<StoreSnapshot>(bytes);
  if(snapshot.contractVersion!=="0.1.0"||!Array.isArray(snapshot.resources))
    throw Error("PA02_OBJECT_IMPORT_SNAPSHOT_INVALID");
  const keys=new Set<string>();
  for(const resource of snapshot.resources) {
    const address=key(resource);
    if(keys.has(address))throw Error("PA02_OBJECT_IMPORT_SOURCE_DUPLICATE");
    keys.add(address);
  }
  return snapshot;
}
function select(
  snapshot:StoreSnapshot,contextId:string
):EnterpriseResourceV010[]{
  const resources=snapshot.resources.filter(item=>
    item.contextId===contextId&&
    item.namespace===OBJECT_EXTENSION_NAMESPACE_V010&&
    item.collectionId===OBJECT_EXTENSION_COLLECTION_V010&&
    item.resourceType===OBJECT_EXTENSION_RESOURCE_TYPE_V010
  );
  for(const r of resources){
    if(r.contractVersion!=="0.1.0"||
      r.schemaRef!==OBJECT_EXTENSION_SCHEMA_V010||
      r.ownerPackageId!==OBJECT_EXTENSION_PACKAGE_ID||
      r.storageKind!=="DOCUMENT"||
      !["ACTIVE","ARCHIVED"].includes(r.lifecycleState)||
      !Number.isFinite(Date.parse(r.createdAt))||
      !Number.isFinite(Date.parse(r.updatedAt))||
      !r.createdBySubjectId?.trim()||!r.updatedBySubjectId?.trim()||
      !r.payload||typeof r.payload!=="object"||Array.isArray(r.payload))
      throw Error("PA02_OBJECT_IMPORT_ENVELOPE_INVALID");
    const definition=assertObjectExtensionDefinitionV010(
      structuredClone(r.payload) as unknown as Parameters<typeof assertObjectExtensionDefinitionV010>[0]);
    if(definition.extensionId!==r.resourceId)
      throw Error("PA02_OBJECT_IMPORT_DEFINITION_ADDRESS_MISMATCH");
  }
  return resources.sort((a,b)=>a.resourceId.localeCompare(b.resourceId));
}
function bindingsOf(input:Binding[]):Binding[] {
  if(!Array.isArray(input)||input.length===0)
    throw Error("PA02_OBJECT_IMPORT_BINDINGS_REQUIRED");
  const set=new Set<string>();
  const list=input.map(v=>({contextId:required(v.contextId),
    enterpriseId:required(v.enterpriseId)}));
  for(const binding of list){
    if(set.has(binding.contextId))
      throw Error("PA02_OBJECT_IMPORT_BINDING_DUPLICATE");
    set.add(binding.contextId);
  }
  return list.sort((a,b)=>a.contextId.localeCompare(b.contextId));
}

/** Schema creation is explicit; neither Host startup nor WRITE invokes it. */
export async function preparePostgresObjectExtensionResourceImportV010(input:{
  connectionString:string;schema:string;
}):Promise<void>{
  await preparePostgresObjectExtensionOwnerSchemaV010(input);
  const q=schemaName(input.schema),sql=postgres(required(input.connectionString),{max:1});
  try{
    await sql.unsafe("CREATE TABLE IF NOT EXISTS "+q+".pa02_import_receipts ("+
      "context_id text PRIMARY KEY,enterprise_id text NOT NULL,"+
      "source_digest text NOT NULL,resources_digest text NOT NULL,"+
      "resource_count integer NOT NULL CHECK(resource_count>=0),"+
      "imported_at timestamptz NOT NULL,"+
      "FOREIGN KEY(context_id,enterprise_id) REFERENCES "+
      q+".pa02_contexts(context_id,enterprise_id))");
    await sql.unsafe("CREATE OR REPLACE TRIGGER pa02_import_immutable "+
      "BEFORE UPDATE OR DELETE ON "+q+".pa02_import_receipts "+
      "FOR EACH ROW EXECUTE FUNCTION "+q+".pa02_reject_receipt_mutation()");
  }finally{await sql.end();}
}

export interface ObjectExtensionImportResultV010 {
  contextId:string;enterpriseId:string;resourceCount:number;
  sourceDigest:string;resourcesDigest:string;created:boolean;
}
/**
 * Explicit offline source->PostgreSQL import. Every selected context's resource
 * set and immutable provenance receipt commit as a single SQL transaction.
 * Empty destination is mandatory: never merge or overwrite concurrent writes.
 */
export async function importFileObjectExtensionsToPostgresV010(input:{
  connectionString:string;schema:string;sourceFile:string;
  expectedSourceDigest:string;bindings:Binding[];
  /** Only an operator with the source offline/frozen may call this. */
  offlineSourceFrozen:true;
  /** Deterministic CI fault injection; source digest rechecked before COMMIT. */
  testOnlyBeforeCommit?:()=>Promise<void>;
}):Promise<ObjectExtensionImportResultV010[]>{
  if(input.offlineSourceFrozen!==true)
    throw Error("PA02_OBJECT_IMPORT_OFFLINE_SOURCE_REQUIRED");
  const sourceFile=required(input.sourceFile),q=schemaName(input.schema);
  const bindings=bindingsOf(input.bindings);
  const snapshot=readSource(sourceFile,input.expectedSourceDigest);
  const sources=bindings.map(binding=>{
    const resources=select(snapshot,binding.contextId);
    return {...binding,resources,resourcesDigest:sha(canonical(resources))};
  });
  const sql=postgres(required(input.connectionString),{
    max:4,connect_timeout:10,idle_timeout:15
  });
  try{
    return await sql.begin(async tx=>{
      const results:ObjectExtensionImportResultV010[]=[];
      for(const item of sources){
        await tx.unsafe("INSERT INTO "+q+".pa02_contexts(context_id,enterprise_id) "+
          "VALUES($1,$2) ON CONFLICT DO NOTHING",
          [item.contextId,item.enterpriseId]);
        const binding=await tx.unsafe("SELECT enterprise_id FROM "+q+
          ".pa02_contexts WHERE context_id=$1 FOR UPDATE",[item.contextId]);
        if(binding[0]?.enterprise_id!==item.enterpriseId)
          throw Error("PA02_OBJECT_IMPORT_ENTERPRISE_BINDING_CONFLICT");
        const prior=await tx.unsafe("SELECT * FROM "+q+".pa02_import_receipts "+
          "WHERE context_id=$1",[item.contextId]);
        if(prior.length){
          if(prior[0].enterprise_id!==item.enterpriseId||
             prior[0].source_digest!==input.expectedSourceDigest||
             prior[0].resources_digest!==item.resourcesDigest||
             Number(prior[0].resource_count)!==item.resources.length)
            throw Error("PA02_OBJECT_IMPORT_RECEIPT_CONFLICT");
          results.push({contextId:item.contextId,enterpriseId:item.enterpriseId,
            sourceDigest:input.expectedSourceDigest,
            resourcesDigest:item.resourcesDigest,
            resourceCount:item.resources.length,created:false});
          continue;
        }
        const existing=await tx.unsafe("SELECT 1 FROM "+q+
          ".pa02_definitions WHERE context_id=$1 LIMIT 1",[item.contextId]);
        const wrote=await tx.unsafe("SELECT 1 FROM "+q+
          ".pa02_owner_evidence WHERE context_id=$1 LIMIT 1",[item.contextId]);
        if(existing.length||wrote.length)
          throw Error("PA02_OBJECT_IMPORT_DESTINATION_NOT_EMPTY");
        for(const resource of item.resources){
          const definition=assertObjectExtensionDefinitionV010(
            resource.payload as unknown as Parameters<typeof assertObjectExtensionDefinitionV010>[0]);
          const inserted=await tx.unsafe("INSERT INTO "+q+".pa02_definitions "+
            "(context_id,enterprise_id,extension_id,target_object_type,"+
            "target_slot,field_id,resource,created_at) "+
            "VALUES($1,$2,$3,$4,$5,$6,$7::jsonb,$8::timestamptz) "+
            "ON CONFLICT DO NOTHING RETURNING extension_id",
            [item.contextId,item.enterpriseId,resource.resourceId,
              definition.targetObjectType,definition.targetSlot,definition.fieldId,
              sql.json(JSON.parse(JSON.stringify(resource))),resource.createdAt]);
          if(!inserted.length)
            throw Error("PA02_OBJECT_IMPORT_DOMAIN_CONFLICT");
        }
        await tx.unsafe("INSERT INTO "+q+".pa02_import_receipts "+
          "(context_id,enterprise_id,source_digest,resources_digest,"+
          "resource_count,imported_at) VALUES($1,$2,$3,$4,$5,clock_timestamp())",
          [item.contextId,item.enterpriseId,input.expectedSourceDigest,
            item.resourcesDigest,item.resources.length]);
        results.push({contextId:item.contextId,enterpriseId:item.enterpriseId,
          sourceDigest:input.expectedSourceDigest,
          resourcesDigest:item.resourcesDigest,
          resourceCount:item.resources.length,created:true});
      }
      await input.testOnlyBeforeCommit?.();
      // Detect ordinary file drift between preparing and committing. This
      // cannot replace an offline maintenance lock / controlled cutover.
      readSource(sourceFile,input.expectedSourceDigest);
      return results;
    });
  }finally{await sql.end();}
}

/** Independent read-only provenance query; never infers Agent Owner success. */
export async function readPostgresObjectExtensionImportReceiptV010(input:{
  connectionString:string;schema:string;contextId:string;enterpriseId:string;
}):Promise<Omit<ObjectExtensionImportResultV010,"created">|undefined>{
  const q=schemaName(input.schema),sql=postgres(required(input.connectionString),{max:1});
  try{
    const rows=await sql.unsafe("SELECT enterprise_id,source_digest,"+
      "resources_digest,resource_count FROM "+q+".pa02_import_receipts "+
      "WHERE context_id=$1 AND enterprise_id=$2",
      [required(input.contextId),required(input.enterpriseId)]);
    if(rows.length!==1)return undefined;
    const receipt=rows[0];
    return {contextId:input.contextId,enterpriseId:input.enterpriseId,
      sourceDigest:receipt.source_digest,resourcesDigest:receipt.resources_digest,
      resourceCount:Number(receipt.resource_count)};
  }finally{await sql.end();}
}
