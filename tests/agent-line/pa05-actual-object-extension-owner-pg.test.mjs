import test from "node:test";
import assert from "node:assert/strict";
import {createHash,randomUUID} from "node:crypto";
import postgres from "postgres";
import {
  preparePostgresObjectExtensionOwnerSchemaV010,
  createPostgresObjectExtensionAtomicOwnerV010
} from "../../dist/apps/object-extension/agent-owner-postgres.js";
import {createPa05GovernedObjectExtensionOwnerV010}
  from "../../dist/apps/object-extension/pa05-governed-owner.js";
import {
  OBJECT_EXTENSION_DEFINITION_UPSERT_OPERATION_V010,
  OBJECT_EXTENSION_PACKAGE_ID
} from "../../dist/apps/object-extension/constants.js";
import {hostAgentDurabilityScopeKeyV020}
  from "../../dist/agents/enterprise-agent/pa02b-postgres-coordination.js";
import {createPa05CrossDatabaseReservationAuthorityV010}
  from "../../dist/manager/pa05-cross-database-admission.js";
import {createPa05CrossDatabaseRemoteSqlAdmissionV010}
  from "../../dist/manager/pa05-cross-database-remote-sql-admission.js";

const urls=[
  process.env.PA05_XDB_AUTHORITY_DATABASE_URL,
  process.env.PA05_XDB_WORKER_A_DATABASE_URL,
  process.env.PA05_XDB_WORKER_B_DATABASE_URL
];
const canonical=x=>Array.isArray(x)?x.map(canonical):
  x&&typeof x==="object"?Object.fromEntries(Object.entries(x)
    .sort(([a],[b])=>a.localeCompare(b)).map(([k,v])=>[k,canonical(v)])):x;
const sha=x=>createHash("sha256").update(JSON.stringify(canonical(x))).digest("hex");
const scope={
  principalSubjectId:"pa05:object-extension-human",
  principalActorType:"HUMAN",contextKind:"ENTERPRISE",
  contextId:"enterprise:pa05:c3",enterpriseId:"org:pa05:c3"
};
const quote=x=>'"'+x+'"';
function makeRequest(name){
  const args={definition:{
    contractVersion:"0.1.0",
    extensionId:"ext:pa05:"+name,
    targetObjectType:"counterparty.subject",targetSlot:"basic",
    namespace:"demo",fieldId:"field"+name,semanticType:"text",
    valueType:"STRING",label:{default:"Actual "+name},
    required:false,order:101,surfaces:["DETAIL"]
  }};
  return {
    scope,runId:"run:"+name,effectId:"effect:"+name,
    receiptId:"receipt:"+name,idempotencyKey:"idem:"+name,
    inputDigest:sha(args),toolId:OBJECT_EXTENSION_DEFINITION_UPSERT_OPERATION_V010,
    arguments:args
  };
}
test("PA05-04D14C3: actual installed Object Extension package uses real PostgreSQL Owner+Verifier behind D9/D10, retains privileged bypass NOT_SIGNED",{
  skip:urls.some(x=>!x)?"three independently physical PostgreSQL18 clusters required":false,
  timeout:110000
},async()=>{
  const suffix=randomUUID().replaceAll("-","").slice(0,11);
  const workerSchema="pa05_c3w_"+suffix;
  const businessSchema="pa02_c3_"+suffix;
  const centralSchema="pa05_c3c_"+suffix;
  const role="pa05c3worker_"+suffix;
  const pw="Proof_"+randomUUID().replaceAll("-","");
  const [central,a,b]=urls.map(url=>postgres(url,{max:3}));
  const q=quote(workerSchema), d=quote(businessSchema);
  const systems=await Promise.all([central,a,b].map(async db=>
    String((await db.unsafe("SELECT system_identifier::text AS sid FROM pg_control_system()"))[0].sid)));
  assert.equal(new Set(systems).size,3);
  let authority,remote,realOwner,guarded;
  let oldTicketCnt=0;
  async function prepare(effect){
    await a.unsafe("INSERT INTO "+q+".pa02b_writes "+
      "(scope_key,effect_id,run_id,input_digest,fence,state) "+
      "VALUES($1,$2,$3,$4,1,'PREPARED')",
      [hostAgentDurabilityScopeKeyV020(scope),effect.effectId,effect.runId,effect.inputDigest]);
  }
  async function begin(effect){
    await a.unsafe("UPDATE "+q+".pa02b_writes SET state='INVOKING' "+
      "WHERE scope_key=$1 AND effect_id=$2 AND run_id=$3",
      [hostAgentDurabilityScopeKeyV020(scope),effect.effectId,effect.runId]);
  }
  try{
    await a.unsafe("CREATE SCHEMA "+q);
    await a.unsafe("CREATE TABLE "+q+".pa02b_writes ("+
      "scope_key text NOT NULL,effect_id text NOT NULL,run_id text NOT NULL,"+
      "input_digest text NOT NULL,fence bigint NOT NULL,state text NOT NULL,"+
      "PRIMARY KEY(scope_key,effect_id))");
    await a.unsafe('CREATE ROLE "'+role+'" LOGIN PASSWORD \''+pw+'\'');
    await a.unsafe('GRANT USAGE ON SCHEMA '+q+' TO "'+role+'"');
    await a.unsafe('GRANT SELECT,UPDATE ON '+q+'.pa02b_writes TO "'+role+'"');
    await preparePostgresObjectExtensionOwnerSchemaV010({
      connectionString:urls[1],schema:businessSchema
    });
    authority=await createPa05CrossDatabaseReservationAuthorityV010({
      authorityConnectionString:urls[0],authoritySchema:centralSchema,
      trustedWorkers:[{
        workerId:"object-extension-worker-a",databaseId:"physical-a",
        ownerPackageId:OBJECT_EXTENSION_PACKAGE_ID
      }]
    });
    await authority.registerFrozenOwner(OBJECT_EXTENSION_PACKAGE_ID,"1.0.0");
    await authority.reopenOwner({
      packageId:OBJECT_EXTENSION_PACKAGE_ID,version:"1.0.0",
      trustedOwnerReady:()=>true
    });
    remote=await createPa05CrossDatabaseRemoteSqlAdmissionV010({
      connectionString:urls[1],workerSchema,
      workerId:"object-extension-worker-a",
      ownerPackageId:OBJECT_EXTENSION_PACKAGE_ID,ownerVersion:"1.0.0",
      workerLoginRole:role,authority
    });
    realOwner=createPostgresObjectExtensionAtomicOwnerV010({
      connectionString:urls[1],schema:businessSchema
    });
    guarded=createPa05GovernedObjectExtensionOwnerV010({
      connectionString:urls[1],workerSchema,objectExtensionSchema:businessSchema,
      businessOwner:realOwner
    });
    await guarded.assertDomainContract();
    const noTicket=makeRequest("before-ticket");
    await prepare(noTicket);
    await assert.rejects(guarded.owner.invoke(noTicket),
      /PA05_OBJECT_OWNER_DURABLE_WRITE_ADMISSION_REQUIRED/);
    assert.equal((await a.unsafe("SELECT count(*)::integer AS n FROM "+d+
      ".pa02_definitions"))[0].n,0);
    // Original owner was already live in the first-party plugin, not the
    // artificial Sales/Purchase table created in earlier D14C tests.
    const effect=makeRequest("real-domain");
    await prepare(effect);
    await remote.stagePreparedEffect({
      scopeKey:hostAgentDurabilityScopeKeyV020(scope),effectId:effect.effectId
    });
    await assert.rejects(guarded.owner.invoke(effect),
      /PA05_OBJECT_OWNER_DURABLE_WRITE_ADMISSION_REQUIRED/);
    await begin(effect);
    await guarded.owner.invoke(effect);
    const evidence=await guarded.verifier.verify({
      scope,runId:effect.runId,effectId:effect.effectId,
      receiptId:effect.receiptId,inputDigest:effect.inputDigest,
      ownerPackageId:OBJECT_EXTENSION_PACKAGE_ID
    });
    assert.equal(evidence.outcome,"SUCCEEDED");
    assert.equal((await realOwner.getResource({
      contextId:scope.contextId,enterpriseId:scope.enterpriseId
    },effect.arguments.definition.extensionId))?.payload?.fieldId,
      effect.arguments.definition.fieldId);
    const resourceCount=await a.unsafe("SELECT count(*)::integer AS n FROM "+d+
      ".pa02_definitions");
    const receiptCount=await a.unsafe("SELECT count(*)::integer AS n FROM "+d+
      ".pa02_owner_evidence");
    assert.equal(resourceCount[0].n,1);
    assert.equal(receiptCount[0].n,1);
    await guarded.owner.invoke(effect);
    assert.equal((await a.unsafe("SELECT count(*)::integer AS n FROM "+d+
      ".pa02_owner_evidence"))[0].n,1,"real Owner idempotency retains one evidence");
    await assert.rejects(guarded.owner.invoke({
      ...effect,toolId:"unknown.plugin.write"
    }),/PA05_OBJECT_OWNER_OPERATION_NOT_AUTHORIZED/);
    await assert.rejects(guarded.owner.invoke({
      ...effect,runId:"run:forged"
    }),/PA05_OBJECT_OWNER_DURABLE_WRITE_ADMISSION_REQUIRED/);

    // Actual Owner's physical immutable evidence trigger is mandatory, not
    // a invented replacement domain table. Lost evidence cannot pass.
    await a.unsafe("ALTER TABLE "+d+
      ".pa02_owner_evidence DISABLE TRIGGER pa02_evidence_immutable");
    const afterDisable=makeRequest("disabled-evidence");
    await prepare(afterDisable);
    await remote.stagePreparedEffect({
      scopeKey:hostAgentDurabilityScopeKeyV020(scope),
      effectId:afterDisable.effectId
    });
    await begin(afterDisable);
    await assert.rejects(guarded.owner.invoke(afterDisable),
      /PA05_OBJECT_OWNER_ACTUAL_EVIDENCE_GUARD_DISABLED/);
    await a.unsafe("ALTER TABLE "+d+
      ".pa02_owner_evidence ENABLE TRIGGER pa02_evidence_immutable");
    assert.equal((await a.unsafe("SELECT count(*)::integer AS n FROM "+d+
      ".pa02_definitions"))[0].n,1);

    // Actual D14A freeze stops the opted-in Owner even if a remote ticket
    // and PA-02 INVOKING row already exist.
    await remote.freezeRemote();
    await assert.rejects(guarded.owner.invoke(afterDisable),
      /PA05_OBJECT_OWNER_REMOTE_FROZEN/);

    // Existing first-party Owner has a separate direct invocation method.
    // It can STILL commit without this optional adapter because its actual
    // business tables lack an enforced D14C1 SQL protection contract.
    // Keep this counterexample explicit rather than claiming production safe.
    const bypass=makeRequest("direct-original-bypass");
    await realOwner.owner.invoke(bypass);
    assert.equal((await realOwner.verifier.verify({
      scope,runId:bypass.runId,effectId:bypass.effectId,
      receiptId:bypass.receiptId,inputDigest:bypass.inputDigest,
      ownerPackageId:OBJECT_EXTENSION_PACKAGE_ID
    })).outcome,"SUCCEEDED");
    const rawCount=(await a.unsafe("SELECT count(*)::integer AS n FROM "+d+
      ".pa02_definitions"))[0].n;
    assert.equal(rawCount,2);
    oldTicketCnt=(await authority.getState(OBJECT_EXTENSION_PACKAGE_ID)).pendingCount;
    assert.equal(oldTicketCnt,2);
    console.log("PA05_ACTUAL_OBJECT_EXTENSION_OWNER_PG="+JSON.stringify({
      actualFirstPartyPlugin:"evo-object-extension",
      ownerOperation:OBJECT_EXTENSION_DEFINITION_UPSERT_OPERATION_V010,
      actualPostgres18:true,physicalClusters:3,
      businessDefinitionsAndEvidenceReal:true,
      existingOwnerVerifierReused:true,
      exactRealD10TicketRequired:true,
      pa02InvokingStateRequired:true,
      ownerIdempotentNoDuplicateBusinessFact:true,
      disabledActualOwnerEvidenceTriggerRejected:true,
      localFreezeDeniesOptInOwner:true,
      originalOwnerDirectBypassStillPossible:true,
      originalBusinessTablesAreNotD14C1Fenced:true,
      productionWriteEnabled:false,
      pa05W06Signed:false
    }));
  }finally{
    for(const x of [guarded,realOwner,remote,authority])
      if(x)try{await x.close();}catch{}
    try{await a.unsafe("DROP SCHEMA IF EXISTS "+d+" CASCADE");}catch{}
    try{await a.unsafe("DROP SCHEMA IF EXISTS "+q+" CASCADE");}catch{}
    try{await a.unsafe('DROP OWNED BY "'+role+'"');}catch{}
    try{await a.unsafe('DROP ROLE IF EXISTS "'+role+'"');}catch{}
    try{await central.unsafe("DROP SCHEMA IF EXISTS "+quote(centralSchema)+" CASCADE");}catch{}
    await Promise.allSettled([central.end(),a.end(),b.end()]);
  }
});
