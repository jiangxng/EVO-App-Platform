import postgres from "postgres";
import {
  createPostgresObjectExtensionAtomicOwnerV010
} from "./agent-owner-postgres.js";
import {
  OBJECT_EXTENSION_PACKAGE_ID,
  OBJECT_EXTENSION_DEFINITION_UPSERT_OPERATION_V010
} from "./constants.js";
import {objectExtensionCapabilityContributionsV010}
  from "./capability-manifest.js";
import {hostAgentDurabilityScopeKeyV020}
  from "../../agents/enterprise-agent/pa02b-postgres-coordination.js";

/**
 * PA05-04D14C3 — first ACTUAL business package opt-in integration.
 *
 * Retains the genuine Object Extension PostgreSQL business tables, Owner
 * implementation and independent Owner verifier. Does not create a synthetic
 * domain write engine. A trusted Host composes this OWNER ADAPTER only after
 * installing the real Owner and D10 central/remote admission ports.
 *
 * This is a pre-invoke governance port, NOT a database trigger on the actual
 * Object Extension business tables. Calling the original Owner directly or
 * with privileged SQL credentials still bypasses it; no production cutover.
 */
export function createPa05GovernedObjectExtensionOwnerV010(input:{
  connectionString:string;
  workerSchema:string;
  objectExtensionSchema:string;
  /** Trusted Owner implementation from the actual first-party package. */
  businessOwner:ReturnType<typeof createPostgresObjectExtensionAtomicOwnerV010>;
}){
  const valid=(s:string,pattern:RegExp,code:string)=>{
    if(typeof s!=="string"||!pattern.test(s))throw Error(code);
    return s;
  };
  const workerSchema=valid(input.workerSchema,/^[a-z][a-z0-9_]{0,62}$/,
    "PA05_OBJECT_OWNER_WORKER_SCHEMA_INVALID");
  const ownerSchema=valid(input.objectExtensionSchema,/^pa02_[a-z0-9_]{1,58}$/,
    "PA05_OBJECT_OWNER_BUSINESS_SCHEMA_INVALID");
  if(workerSchema===ownerSchema||!input.connectionString||
    input.businessOwner?.owner?.ownerPackageId!==OBJECT_EXTENSION_PACKAGE_ID||
    typeof input.businessOwner?.verifier?.verify!=="function")
    throw Error("PA05_OBJECT_OWNER_TRUSTED_REGISTRATION_REQUIRED");
  const capability=objectExtensionCapabilityContributionsV010.filter(
    op=>op.kind==="platform.capability-operation"&&
      op.operation.operationId===OBJECT_EXTENSION_DEFINITION_UPSERT_OPERATION_V010);
  if(capability.length!==1||
    capability[0].kind!=="platform.capability-operation"||
    capability[0].operation.effect!=="WRITE"||
    !capability[0].operation.exposure.includes("PERSONAL_AGENT")||
    capability[0].operation.writeSafety?.idempotency!=="HOST_REQUIRED"||
    capability[0].operation.writeSafety?.receipt!=="HOST_REQUIRED")
    throw Error("PA05_OBJECT_OWNER_PACKAGE_OPERATION_UNCERTIFIED");

  const sql=postgres(input.connectionString,{max:3,connect_timeout:10,idle_timeout:15});
  const w='"'+workerSchema+'"',d='"'+ownerSchema+'"';
  async function assertDomainContract(){
    // These are the actual physical tables used by the existing PA-02 Object
    // Extension Owner, not fictitious canonical D14C1 domain tables.
    const rows=await sql.unsafe(
      "SELECT c.relname,a.attname,c.relkind FROM pg_class c "+
      "JOIN pg_namespace n ON n.oid=c.relnamespace "+
      "JOIN pg_attribute a ON a.attrelid=c.oid "+
      "WHERE n.nspname=$1 AND a.attnum>0 AND NOT a.attisdropped "+
      "AND c.relname=ANY($2::text[])",
      [ownerSchema,["pa02_definitions","pa02_owner_evidence","pa02_contexts"]]
    );
    const required:{
      [name:string]:string[]
    }={
      pa02_definitions:["context_id","enterprise_id","extension_id","resource"],
      pa02_owner_evidence:["context_id","run_id","effect_id",
        "receipt_id","input_digest","resource_id","evidence_digest"],
      pa02_contexts:["context_id","enterprise_id"]
    };
    if(Object.entries(required).some(([table,cols])=>
      cols.some(c=>!rows.some(r=>r.relname===table&&r.attname===c&&
        r.relkind==="r"))))
      throw Error("PA05_OBJECT_OWNER_ACTUAL_BUSINESS_SCHEMA_MISMATCH");
    const guard=await sql.unsafe(
      "SELECT t.tgenabled,t.tgtype::integer AS mask,"+
      "p.proname,ns.nspname AS function_schema "+
      "FROM pg_trigger t JOIN pg_class c ON c.oid=t.tgrelid "+
      "JOIN pg_namespace n ON n.oid=c.relnamespace "+
      "JOIN pg_proc p ON p.oid=t.tgfoid "+
      "JOIN pg_namespace ns ON ns.oid=p.pronamespace "+
      "WHERE n.nspname=$1 AND c.relname='pa02_owner_evidence' "+
      "AND t.tgname='pa02_evidence_immutable' AND NOT t.tgisinternal",
      [ownerSchema]
    );
    if(guard.length!==1||guard[0].tgenabled!=="O"||
      guard[0].mask!==27||guard[0].proname!=="pa02_reject_receipt_mutation"||
      guard[0].function_schema!==ownerSchema)
      throw Error("PA05_OBJECT_OWNER_ACTUAL_EVIDENCE_GUARD_DISABLED");
  }
  async function assertAdmitted(input:{
    scope:Parameters<typeof input.businessOwner.owner.invoke>[0]["scope"];
    effectId:string;runId:string;inputDigest:string;
  }){
    await assertDomainContract();
    const scopeKey=hostAgentDurabilityScopeKeyV020(input.scope);
    // An opt-in trusted Host must have called D9 reserve + D10 ticket stage
    // and committed real PA-02 beginWrite before calling business Owner.
    // SELECT locks the local monotone gate against freezeRemote().
    const check=await sql.begin(async tx=>{
      const gate=await tx.unsafe("SELECT state FROM "+w+
        ".pa05_xdb_remote_config WHERE singleton FOR SHARE");
      if(gate.length!==1||gate[0].state!=="ACTIVE")
        throw Error("PA05_OBJECT_OWNER_REMOTE_FROZEN");
      const rows=await tx.unsafe(
        "SELECT w.state,w.run_id,w.input_digest,t.reservation_id "+
        "FROM "+w+".pa02b_writes w JOIN "+w+
        ".pa05_xdb_remote_tickets t ON "+
        "t.scope_key=w.scope_key AND t.effect_id=w.effect_id AND "+
        "t.run_id=w.run_id AND t.input_digest=w.input_digest AND "+
        "t.fence=w.fence WHERE w.scope_key=$1 AND w.effect_id=$2",
        [scopeKey,input.effectId]
      );
      if(rows.length!==1||!["INVOKING","UNKNOWN"].includes(rows[0].state)||
        rows[0].run_id!==input.runId||
        rows[0].input_digest!==input.inputDigest||
        !/^[a-f0-9]{64}$/.test(rows[0].reservation_id))
        throw Error("PA05_OBJECT_OWNER_DURABLE_WRITE_ADMISSION_REQUIRED");
      return true;
    });
    return check;
  }
  return {
    owner:{
      ownerPackageId:OBJECT_EXTENSION_PACKAGE_ID,
      async invoke(request:Parameters<typeof input.businessOwner.owner.invoke>[0]){
        if(request.toolId!==OBJECT_EXTENSION_DEFINITION_UPSERT_OPERATION_V010)
          throw Error("PA05_OBJECT_OWNER_OPERATION_NOT_AUTHORIZED");
        await assertAdmitted(request);
        await input.businessOwner.owner.invoke(request);
        // Verify against the actual PA-02 Owner resource+immutable evidence;
        // do NOT re-invoke the business Owner if evidence is uncertain.
        const verified=await input.businessOwner.verifier.verify({
          scope:request.scope,runId:request.runId,effectId:request.effectId,
          receiptId:request.receiptId,inputDigest:request.inputDigest,
          ownerPackageId:OBJECT_EXTENSION_PACKAGE_ID
        });
        if(verified.outcome!=="SUCCEEDED")
          throw Error("PA05_OBJECT_OWNER_TERMINAL_EVIDENCE_UNRESOLVED");
      }
    },
    verifier:input.businessOwner.verifier,
    assertDomainContract,
    close:()=>sql.end()
  };
}
