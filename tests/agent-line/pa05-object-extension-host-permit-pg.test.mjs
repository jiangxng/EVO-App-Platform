import test from "node:test";
import assert from "node:assert/strict";
import {createHash,randomUUID} from "node:crypto";
import postgres from "postgres";
import {
  preparePostgresObjectExtensionOwnerSchemaV010,
  createPostgresObjectExtensionAtomicOwnerV010,
  buildPa05ObjectExtensionApprovedMaterialV010
} from "../../dist/apps/object-extension/agent-owner-postgres.js";
import {installPa05ObjectExtensionPhysicalFenceV010}
  from "../../dist/apps/object-extension/pa05-physical-sql-guard.js";
import {createPa05ObjectExtensionHostPermitIssuerV010}
  from "../../dist/apps/object-extension/pa05-host-sql-permit.js";
import {createPa05CrossDatabaseReservationAuthorityV010}
  from "../../dist/manager/pa05-cross-database-admission.js";
import {createPa05CrossDatabaseRemoteSqlAdmissionV010}
  from "../../dist/manager/pa05-cross-database-remote-sql-admission.js";
import {hostAgentDurabilityScopeKeyV020}
  from "../../dist/agents/enterprise-agent/pa02b-postgres-coordination.js";
import {
  OBJECT_EXTENSION_PACKAGE_ID,
  OBJECT_EXTENSION_DEFINITION_UPSERT_OPERATION_V010
} from "../../dist/apps/object-extension/constants.js";

const urls=[process.env.PA05_XDB_AUTHORITY_DATABASE_URL,
  process.env.PA05_XDB_WORKER_A_DATABASE_URL,
  process.env.PA05_XDB_WORKER_B_DATABASE_URL];
const canon=x=>Array.isArray(x)?x.map(canon):
  x&&typeof x==="object"?Object.fromEntries(Object.entries(x)
    .sort(([a],[b])=>a.localeCompare(b)).map(([k,v])=>[k,canon(v)])):x;
const hash=x=>createHash("sha256").update(JSON.stringify(canon(x))).digest("hex");
const q=s=>'"'+s+'"';
const u=(raw,name,pwd)=>{const x=new URL(raw);x.username=name;x.password=pwd;return x.toString();};
const scope={contextKind:"ENTERPRISE",contextId:"enterprise:pa05:d14c5",
  enterpriseId:"org:pa05:d14c5",principalSubjectId:"subject:pa05:human",
  principalActorType:"HUMAN"};
function request(label){
  const args={definition:{contractVersion:"0.1.0",
    extensionId:"ext:pa05:d14c5:"+label,
    targetObjectType:"counterparty.subject",targetSlot:"basic",
    namespace:"demo",fieldId:"field"+label,semanticType:"text",
    valueType:"STRING",label:{default:"Guarded "+label},
    required:false,order:102,surfaces:["DETAIL"]}};
  return {scope,runId:"run:"+label,effectId:"effect:"+label,
    receiptId:"receipt:"+label,idempotencyKey:"idem:"+label,
    inputDigest:hash(args),toolId:OBJECT_EXTENSION_DEFINITION_UPSERT_OPERATION_V010,
    arguments:args};
}
test("PA05-04D14C5 genuine Object Extension physical SQL fence on all 3 business tables: raw unprivileged Owner cannot bypass",{
  skip:urls.some(x=>!x)?"requires three distinct physical PostgreSQL18 clusters":false,
  timeout:110000
},async()=>{
  const suffix=randomUUID().replaceAll("-","").slice(0,12);
  const ownerSchema="pa02_d14c5_"+suffix,workerSchema="pa05_c5w_"+suffix,
    centralSchema="pa05_c5c_"+suffix;
  const businessRole="pa05c5owner_"+suffix,workerRole="pa05c5worker_"+suffix,hostRole="pa05c5host_"+suffix;
  const password="Proof_"+randomUUID().replaceAll("-","");
  const [central,db,b]=urls.map(s=>postgres(s,{max:4}));
  const systems=await Promise.all([central,db,b].map(async client=>
    String((await client.unsafe("SELECT system_identifier::text AS sid FROM pg_control_system()"))[0].sid)));
  assert.equal(new Set(systems).size,3);
  let authority,gateway,raw,guarded,issuer,privileged,stolen;
  const issued=[];
  const w=q(workerSchema),d=q(ownerSchema);
  const scopeKey=hostAgentDurabilityScopeKeyV020(scope);
  const approvedRequest=r=>{
    const a=buildPa05ObjectExtensionApprovedMaterialV010(
      r,new Date().toISOString());
    return {
      scopeKey,runId:r.runId,effectId:r.effectId,
      inputDigest:r.inputDigest,contextId:scope.contextId,
      enterpriseId:scope.enterpriseId,approvedInputArguments:r.arguments,
      approvedResource:a.record,
      approvedEvidence:a.evidence,approvedEvidenceDigest:a.evidenceDigest,
      approvedIdempotencyHash:a.key
    };
  };
  async function seed(r,options={}){
    await db.unsafe("INSERT INTO "+w+".pa02b_writes("+
      "scope_key,effect_id,run_id,input_digest,fence,state) "+
      "VALUES($1,$2,$3,$4,1,'PREPARED')",
      [scopeKey,r.effectId,r.runId,r.inputDigest]);
    // Independent Host fixture, before original Owner dispatch. Never
    // lazily approve inside the Owner -> issuer.issue() callback.
    if(!options.withoutHostApproval)
      assert.equal(await issuer.approveCommand({scopeKey,source:r}),
        "APPROVED");
  }
  async function start(r){
    await db.unsafe("UPDATE "+w+".pa02b_writes SET state='INVOKING' "+
      "WHERE scope_key=$1 AND effect_id=$2",[scopeKey,r.effectId]);
  }
  try{
    await db.unsafe("CREATE SCHEMA "+w);
    await db.unsafe("CREATE TABLE "+w+".pa02b_writes ("+
      "scope_key text NOT NULL,effect_id text NOT NULL,run_id text NOT NULL,"+
      "input_digest text NOT NULL,fence bigint NOT NULL,state text NOT NULL,"+
      "PRIMARY KEY(scope_key,effect_id))");
    await db.unsafe('CREATE ROLE "'+businessRole+
      '" LOGIN PASSWORD \''+password+'\'');
    await db.unsafe('CREATE ROLE "'+workerRole+
      '" LOGIN PASSWORD \''+password+'\'');
    await db.unsafe('CREATE ROLE "'+hostRole+
      '" LOGIN PASSWORD \''+password+'\'');
    await db.unsafe('GRANT USAGE ON SCHEMA '+w+' TO "'+workerRole+'"');
    await db.unsafe('GRANT SELECT,UPDATE ON '+w+
      '.pa02b_writes TO "'+workerRole+'"');
    await preparePostgresObjectExtensionOwnerSchemaV010({
      connectionString:urls[1],schema:ownerSchema
    });
    await db.unsafe('GRANT USAGE ON SCHEMA '+d+' TO "'+businessRole+'"');
    for(const table of ["pa02_contexts","pa02_definitions","pa02_owner_evidence"])
      await db.unsafe('GRANT SELECT,INSERT ON '+d+'."'+table+
        '" TO "'+businessRole+'"');
    await installPa05ObjectExtensionPhysicalFenceV010({
      connectionString:urls[1],objectSchema:ownerSchema,
      workerSchema,businessOwnerLoginRole:businessRole,
      trustedHostLoginRole:hostRole
    });
    // SQL permission itself must deny any ordinary DDL trigger tampering.
    const ownerSql=postgres(u(urls[1],businessRole,password),{max:1});
    await assert.rejects(ownerSql.unsafe("ALTER TABLE "+d+
      ".pa02_definitions DISABLE TRIGGER pa05_object_physical_guard"),
      /must be owner|permission denied/);
    await assert.rejects(ownerSql.unsafe("UPDATE "+d+
      ".pa02_definitions SET extension_id='changed'"),
      /permission denied/);
    await ownerSql.end();

    authority=await createPa05CrossDatabaseReservationAuthorityV010({
      authorityConnectionString:urls[0],authoritySchema:centralSchema,
      trustedWorkers:[{workerId:"object-extension-worker-a",
        ownerPackageId:OBJECT_EXTENSION_PACKAGE_ID,databaseId:"worker-a"}]
    });
    await authority.registerFrozenOwner(OBJECT_EXTENSION_PACKAGE_ID,"1.0.0");
    await authority.reopenOwner({packageId:OBJECT_EXTENSION_PACKAGE_ID,
      version:"1.0.0",trustedOwnerReady:()=>true});
    gateway=await createPa05CrossDatabaseRemoteSqlAdmissionV010({
      connectionString:urls[1],workerSchema,
      workerId:"object-extension-worker-a",
      ownerPackageId:OBJECT_EXTENSION_PACKAGE_ID,ownerVersion:"1.0.0",
      workerLoginRole:workerRole,authority
    });
    // Both Owner objects use the SAME physically restricted SQL LOGIN.
    // Only the trusted opted-in variant installs transaction-local source.
    raw=createPostgresObjectExtensionAtomicOwnerV010({
      connectionString:u(urls[1],businessRole,password),schema:ownerSchema
    });
    issuer=createPa05ObjectExtensionHostPermitIssuerV010({
      connectionString:u(urls[1],hostRole,password),objectSchema:ownerSchema
    });
    guarded=createPostgresObjectExtensionAtomicOwnerV010({
      connectionString:u(urls[1],businessRole,password),schema:ownerSchema,
      pa05PhysicalAdmission:{workerSchema,hostPermitIssuer:{
        issue:async request=>{
          const token=await issuer.issue(request);
          issued.push(token);
          return token;
        },
        bindTransaction:request=>issuer.bindTransaction(request)
      }}
    });
    const noTicket=request("without-ticket");
    await seed(noTicket);
    await assert.rejects(raw.owner.invoke(noTicket),
      /PA05_OBJECT_SQL_TRANSACTION_SOURCE_REQUIRED/);
    await assert.rejects(guarded.owner.invoke(noTicket),
      /PA05_OBJECT_SQL_HOST_ADMISSION_REQUIRED/);
    assert.equal((await db.unsafe("SELECT count(*)::int AS n FROM "+d+
      ".pa02_definitions"))[0].n,0);

    const real=request("physical-real-write");
    await seed(real,{withoutHostApproval:true});
    await gateway.stagePreparedEffect({scopeKey,effectId:real.effectId});
    // Even with a durable D10 ticket, Owner must wait for PA-02 INVOKING.
    await assert.rejects(guarded.owner.invoke(real),
      /PA05_OBJECT_SQL_HOST_ADMISSION_REQUIRED/);
    await start(real);
    // D14C9: a genuine D10/PA-02 INVOKING command is still not authorized
    // until the separate SQL Host explicitly, immutably stages it.
    await assert.rejects(guarded.owner.invoke(real),
      /PA05_OBJECT_SQL_HOST_COMMAND_NOT_APPROVED/);
    assert.equal(await issuer.approveCommand({scopeKey,source:real}),
      "APPROVED");
    assert.equal(await issuer.approveCommand({scopeKey,source:real}),
      "APPROVED");
    await assert.rejects(issuer.approveCommand({
      scopeKey,source:{...real,receiptId:"receipt:source-forged"}
    }),/PA05_OBJECT_SQL_HOST_COMMAND_IMMUTABLE/);
    // D14C6: GRANT after installation is not trusted just because the
    // initial installer attested least privilege. This must fail inside
    // the real Host PostgreSQL SECURITY DEFINER issuer, not just JS.
    await db.unsafe('GRANT UPDATE ON '+w+
      '.pa02b_writes TO "'+hostRole+'"');
    await assert.rejects(guarded.owner.invoke(real),
      /PA05_OBJECT_SQL_ROLE_DRIFT/);
    await db.unsafe('REVOKE UPDATE ON '+w+
      '.pa02b_writes FROM "'+hostRole+'"');

    // Even non-inherited delegated grants and SET ROLE paths fail closed.
    const driftRole="pa05c6delegate_"+suffix;
    await db.unsafe('CREATE ROLE "'+driftRole+'" NOLOGIN');
    await db.unsafe('GRANT UPDATE ON '+w+
      '.pa02b_writes TO "'+driftRole+'"');
    await db.unsafe('GRANT "'+driftRole+'" TO "'+
      businessRole+'" WITH INHERIT FALSE');
    await assert.rejects(guarded.owner.invoke(real),
      /PA05_OBJECT_SQL_ROLE_DRIFT/);
    await db.unsafe('REVOKE "'+driftRole+'" FROM "'+businessRole+'"');
    await db.unsafe('REVOKE UPDATE ON '+w+
      '.pa02b_writes FROM "'+driftRole+'"');
    await db.unsafe('DROP ROLE "'+driftRole+'"');

    // A PUBLIC EXECUTE drift would let the stolen Owner invoke the Host
    // issuer unless the actual issuer independently revalidates its ACL.
    const issueSignature=d+
      '.pa05_object_issue_host_permit(text,text,text,text,text,text,jsonb,jsonb,text,text,jsonb)';
    await db.unsafe('GRANT EXECUTE ON FUNCTION '+issueSignature+' TO PUBLIC');
    await assert.rejects(guarded.owner.invoke(real),
      /PA05_OBJECT_SQL_ROLE_DRIFT/);
    await db.unsafe('REVOKE EXECUTE ON FUNCTION '+
      issueSignature+' FROM PUBLIC');

    // Registering Host command is a privileged SQL function. An accidental
    // PUBLIC EXECUTE GRANT must be caught at the live privilege boundary.
    const registerSignature=d+
      '.pa05_object_register_host_command(text,text,text,text,text,text,jsonb)';
    await db.unsafe('GRANT EXECUTE ON FUNCTION '+registerSignature+' TO PUBLIC');
    await assert.rejects(issuer.approveCommand({scopeKey,source:real}),
      /PA05_OBJECT_SQL_ROLE_DRIFT/);
    await db.unsafe('REVOKE EXECUTE ON FUNCTION '+registerSignature+
      ' FROM PUBLIC');
    // Real stolen business LOGIN can forge all D10 transaction GUC fields,
    // but cannot read permits, mint one, or switch to the trusted Host LOGIN.
    stolen=postgres(u(urls[1],businessRole,password),{max:1});
    await assert.rejects(stolen.unsafe("SELECT token FROM "+d+
      ".pa05_object_host_permits"),/permission denied/);
    await assert.rejects(stolen.unsafe("SELECT approved_source FROM "+d+
      ".pa05_object_host_commands"),/permission denied/);
    await assert.rejects(stolen.unsafe("SELECT "+d+
      ".pa05_object_register_host_command("+
      "$1,$2,$3,$4,$5,$6,$7::jsonb)",[
        scopeKey,real.runId,real.effectId,real.inputDigest,
        scope.contextId,scope.enterpriseId,
        stolen.json({runId:real.runId,effectId:real.effectId})
      ]),/permission denied/);
    await assert.rejects(stolen.unsafe("SELECT "+d+
      ".pa05_object_bind_host_permit($1,$2,$3,$4,$5)",[
        scopeKey,real.effectId,"0".repeat(64),1,"1"
      ]),/permission denied/);
    await assert.rejects(stolen.unsafe("SET ROLE "+q(hostRole)),
      /permission denied/);
    const stolenIssue=approvedRequest(real);
    await assert.rejects(stolen.unsafe("SELECT "+d+
      ".pa05_object_issue_host_permit("+
      "$1,$2,$3,$4,$5,$6,$7::jsonb,$8::jsonb,$9,$10,$11::jsonb)",[
        scopeKey,real.runId,real.effectId,real.inputDigest,
        scope.contextId,scope.enterpriseId,
        JSON.stringify(stolenIssue.approvedResource),
        JSON.stringify(stolenIssue.approvedEvidence),
        stolenIssue.approvedEvidenceDigest,
        stolenIssue.approvedIdempotencyHash,
        stolen.json(real.arguments)
      ]),/permission denied/);
    async function forgedInsert(permit){
      await stolen.begin(async tx=>{
        const values=[["scope_key",scopeKey],["run_id",real.runId],
          ["effect_id",real.effectId],["input_digest",real.inputDigest],
          ["context_id",scope.contextId],["enterprise_id",scope.enterpriseId]];
        if(permit)values.push(["host_permit",permit]);
        for(const [key,value] of values)
          await tx.unsafe("SELECT set_config($1,$2,true)",
            ["evo.pa05."+key,value]);
        await tx.unsafe("INSERT INTO "+d+".pa02_definitions "+
          "(context_id,enterprise_id,extension_id,target_object_type,"+
          "target_slot,field_id,resource,created_at) "+
          "VALUES($1,$2,$3,'counterparty.subject','basic',"+
          "'stolen','{}'::jsonb,now())",
          [scope.contextId,scope.enterpriseId,"ext:stolen:replay"]);
      });
    }
    await assert.rejects(forgedInsert(),/PA05_OBJECT_SQL_HOST_PERMIT_REQUIRED/);
    await assert.rejects(forgedInsert("00000000000000000000000000000000"),
      /PA05_OBJECT_SQL_HOST_PERMIT_REQUIRED/);
    // Even a valid trusted Host permit cannot commit an orphan physical
    // business row without the original PA-02 immutable Owner evidence.
    const orphan=request("host-permit-orphan");
    await seed(orphan);
    await gateway.stagePreparedEffect({scopeKey,effectId:orphan.effectId});
    await start(orphan);
    const orphanToken=await issuer.issue(approvedRequest(orphan));
    const orphanWrite=(bindHere=false)=>stolen.begin(async tx=>{
      if(bindHere){
        const identity=await tx.unsafe(
          "SELECT pg_backend_pid() AS pid,pg_current_xact_id()::text AS txid");
        assert.equal(await issuer.bindTransaction({
          scopeKey,effectId:orphan.effectId,token:orphanToken,
          backendPid:Number(identity[0].pid),
          transactionId:String(identity[0].txid)
        }),"BOUND");
      }
      for(const [key,value] of [["scope_key",scopeKey],
        ["run_id",orphan.runId],["effect_id",orphan.effectId],
        ["input_digest",orphan.inputDigest],["context_id",scope.contextId],
        ["enterprise_id",scope.enterpriseId],["host_permit",orphanToken]])
        await tx.unsafe("SELECT set_config($1,$2,true)",["evo.pa05."+key,value]);
      await tx.unsafe("INSERT INTO "+d+
        ".pa02_contexts(context_id,enterprise_id) VALUES($1,$2)",
        [scope.contextId,scope.enterpriseId]);
    });
    // A permit already exists: granting its protected table to the
    // business credential must not open a physical-write window.
    await db.unsafe('GRANT SELECT ON '+d+
      '.pa05_object_host_permits TO "'+businessRole+'"');
    await assert.rejects(orphanWrite(),/PA05_OBJECT_SQL_ROLE_DRIFT/);
    await db.unsafe('REVOKE SELECT ON '+d+
      '.pa05_object_host_permits FROM "'+businessRole+'"');
    await assert.rejects(orphanWrite(true),/PA05_OBJECT_SQL_RECEIPT_REQUIRED/);
    assert.equal((await db.unsafe("SELECT count(*)::int AS n FROM "+d+
      ".pa02_contexts"))[0].n,0);
    // D14C7: independently revoke a real issued, unused one-effect permit.
    // The already known bearer token and still-valid D10 ticket fail closed.
    assert.equal(await issuer.revoke({
      scopeKey,effectId:orphan.effectId,
      token:"0".repeat(64)
    }),"NOT_FOUND");
    await assert.rejects(stolen.unsafe("SELECT "+d+
      ".pa05_object_revoke_host_permit($1,$2,$3)",[
        scopeKey,orphan.effectId,orphanToken
      ]),/permission denied/);
    assert.equal(await issuer.revoke({
      scopeKey,effectId:orphan.effectId,token:orphanToken
    }),"REVOKED");
    assert.equal(await issuer.revoke({
      scopeKey,effectId:orphan.effectId,token:orphanToken
    }),"REVOKED");
    await assert.rejects(orphanWrite(),
      /PA05_OBJECT_SQL_HOST_PERMIT_REQUIRED/);
    await assert.rejects(issuer.issue(approvedRequest(orphan)),
      /PA05_OBJECT_SQL_HOST_PERMIT_UNRESOLVED/);
    // D14C8: a *valid, unrevoked* captured token + genuine D10 receipt
    // cannot authorize different business fields, resource JSON or receipt.
    const tampered=request("approved-payload-tamper");
    await seed(tampered);
    await gateway.stagePreparedEffect({scopeKey,effectId:tampered.effectId});
    await start(tampered);
    const expected=approvedRequest(tampered);
    await assert.rejects(issuer.issue({
      ...expected,approvedResource:{
        ...expected.approvedResource,payload:{
          ...expected.approvedResource.payload,fieldId:"injected-field"
        }
      }
    }),/PA05_OBJECT_SQL_APPROVED_COMMAND_MISMATCH/);
    // The independent Host-approved source is immutable even when Owner
    // provides internally consistent forged evidence under an existing D10.
    const substituted={...expected,
      approvedEvidence:{...expected.approvedEvidence,
        receiptId:"receipt:alternate-unapproved"}};
    substituted.approvedEvidenceDigest=hash(substituted.approvedEvidence);
    await assert.rejects(issuer.issue(substituted),
      /PA05_OBJECT_SQL_HOST_COMMAND_NOT_APPROVED/);
    const approvedToken=await issuer.issue(expected);
    const approvalShape=(await db.unsafe(
      "SELECT jsonb_typeof(approved_resource) AS resource_type,"+
      "jsonb_typeof(approved_evidence) AS evidence_type,"+
      "approved_resource ? 'resourceId' AS has_id,"+
      "approved_resource->>'resourceId' AS recorded_id,"+
      "approved_resource->'payload'->>'fieldId' AS recorded_field "+
      "FROM "+d+".pa05_object_host_permits WHERE effect_id=$1",
      [tampered.effectId]))[0];
    assert.equal(approvalShape.resource_type,"object");
    assert.equal(approvalShape.evidence_type,"object");
    assert.equal(approvalShape.has_id,true);
    assert.equal(approvalShape.recorded_id,expected.approvedResource.resourceId);
    assert.equal(approvalShape.recorded_field,
      expected.approvedResource.payload.fieldId);
    const receiptCase=request("approved-receipt-tamper");
    await seed(receiptCase);
    await gateway.stagePreparedEffect({scopeKey,effectId:receiptCase.effectId});
    await start(receiptCase);
    const approvedReceiptCase=approvedRequest(receiptCase);
    const receiptToken=await issuer.issue(approvedReceiptCase);
    const forge=async(attack,material,token,changeReceipt)=>stolen.begin(async tx=>{
      const identity=await tx.unsafe(
        "SELECT pg_backend_pid() AS pid,pg_current_xact_id()::text AS txid");
      // Explicit, test-only trusted Host binding to the malicious backend:
      // proves C8 payload/receipt gates are still effective once C10 passes.
      assert.equal(await issuer.bindTransaction({
        scopeKey,effectId:attack.effectId,token,
        backendPid:Number(identity[0].pid),
        transactionId:String(identity[0].txid)
      }),"BOUND");
      await tx.unsafe("SET LOCAL statement_timeout = '8000ms'");
      await tx.unsafe("SET LOCAL lock_timeout = '6000ms'");
      for(const [key,value] of [["scope_key",scopeKey],
        ["run_id",attack.runId],["effect_id",attack.effectId],
        ["input_digest",attack.inputDigest],
        ["context_id",scope.contextId],["enterprise_id",scope.enterpriseId],
        ["host_permit",token]])
        await tx.unsafe("SELECT set_config($1,$2,true)",
          ["evo.pa05."+key,value]);
      await tx.unsafe("INSERT INTO "+d+
        ".pa02_contexts(context_id,enterprise_id) VALUES($1,$2) "+
        "ON CONFLICT DO NOTHING",[scope.contextId,scope.enterpriseId]);
      await tx.unsafe("INSERT INTO "+d+".pa02_definitions "+
        "(context_id,enterprise_id,extension_id,target_object_type,"+
        "target_slot,field_id,resource,created_at) "+
        "VALUES($1,$2,$3,$4,$5,$6,$7::jsonb,$8::timestamptz)",
        [scope.contextId,scope.enterpriseId,
          material.approvedResource.resourceId,
          material.approvedResource.payload.targetObjectType,
          material.approvedResource.payload.targetSlot,
          changeReceipt?material.approvedResource.payload.fieldId:"forged",
          stolen.json(JSON.parse(JSON.stringify(material.approvedResource))),
          material.approvedResource.createdAt]);
      if(changeReceipt)
        await tx.unsafe("INSERT INTO "+d+".pa02_owner_evidence "+
          "(context_id,enterprise_id,idempotency_hash,run_id,effect_id,"+
          "receipt_id,input_digest,resource_id,evidence,evidence_digest,recorded_at) "+
          "VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb,$10,$11::timestamptz)",
          [scope.contextId,scope.enterpriseId,
            material.approvedIdempotencyHash,attack.runId,attack.effectId,
            "receipt:forged",attack.inputDigest,
            material.approvedResource.resourceId,
            stolen.json(JSON.parse(JSON.stringify(material.approvedEvidence))),
            material.approvedEvidenceDigest,
            material.approvedEvidence.recordedAt]);
    });
    await assert.rejects(forge(tampered,expected,approvedToken,false),
      /PA05_OBJECT_SQL_APPROVED_RESOURCE_MISMATCH/);
    await assert.rejects(forge(receiptCase,approvedReceiptCase,receiptToken,true),
      /PA05_OBJECT_SQL_APPROVED_EVIDENCE_MISMATCH/);
    assert.equal((await db.unsafe("SELECT count(*)::int AS n FROM "+d+
      ".pa02_definitions"))[0].n,0);
    assert.equal((await db.unsafe("SELECT count(*)::int AS n FROM "+d+
      ".pa02_owner_evidence"))[0].n,0);
    // The approved snapshot is stored in Host-owned SQL, not in GUCs.
    await assert.rejects(stolen.unsafe("SELECT approved_resource FROM "+d+
      ".pa05_object_host_permits"),/permission denied/);
    // D14C3's raw original Owner bypass is also physically denied.
    await assert.rejects(raw.owner.invoke(real),
      /PA05_OBJECT_SQL_TRANSACTION_SOURCE_REQUIRED/);
    await guarded.owner.invoke(real);
    // Once original Owner receipt committed, no later revoke can erase it.
    assert.equal(await issuer.revoke({
      scopeKey,effectId:real.effectId,token:issued[0]
    }),"COMMITTED");
    assert.equal(issued.length,1);
    assert.equal(issued[0].length,64);
    // Consumed real permit is no longer valid even when GUCs are forged.
    await assert.rejects(forgedInsert(issued[0]),
      /PA05_OBJECT_SQL_HOST_PERMIT_REQUIRED/);
    assert.equal((await guarded.verifier.verify({
      scope,runId:real.runId,effectId:real.effectId,
      receiptId:real.receiptId,inputDigest:real.inputDigest,
      ownerPackageId:OBJECT_EXTENSION_PACKAGE_ID
    })).outcome,"SUCCEEDED");
    assert.equal((await guarded.getResource({
      contextId:scope.contextId,enterpriseId:scope.enterpriseId
    },real.arguments.definition.extensionId))?.payload?.fieldId,
      real.arguments.definition.fieldId);
    await guarded.owner.invoke(real);
    assert.equal((await db.unsafe("SELECT count(*)::int AS n FROM "+
      d+".pa02_owner_evidence"))[0].n,1);

    // D14C7: real PostgreSQL race. The original business transaction
    // holds FOR UPDATE on its Host permit row across the resource/evidence
    // atomic commit. Host revocation must wait and report COMMITTED.
    const racing=request("concurrent-revoke-commit");
    await seed(racing);
    await gateway.stagePreparedEffect({scopeKey,effectId:racing.effectId});
    await start(racing);
    let enteredResolve,releaseResolve,raceToken;
    const entered=new Promise(resolve=>{enteredResolve=resolve;});
    const release=new Promise(resolve=>{releaseResolve=resolve;});
    const racedOwner=createPostgresObjectExtensionAtomicOwnerV010({
      connectionString:u(urls[1],businessRole,password),
      schema:ownerSchema,testOnlyAfterBusinessInsert:async()=>{
        enteredResolve();await release;
      },
      pa05PhysicalAdmission:{workerSchema,hostPermitIssuer:{
        issue:async req=>{
          raceToken=await issuer.issue(req);
          return raceToken;
        },
        bindTransaction:request=>issuer.bindTransaction(request)
      }}
    });
    try{
      const writeTask=racedOwner.owner.invoke(racing);
      await Promise.race([
        entered,
        writeTask.then(()=>{throw Error("PA05_RACE_CHECKPOINT_MISSED");})
      ]);
      const revokeTask=issuer.revoke({
        scopeKey,effectId:racing.effectId,token:raceToken
      });
      // Observe actual blocked backend instead of assuming a JS timer
      // proves database mutual exclusion.
      let blocked=false;
      for(let attempt=0;attempt<30;attempt++){
        const active=await db.unsafe(
          "SELECT count(*)::int AS n FROM pg_stat_activity "+
          "WHERE query LIKE $1 AND wait_event_type='Lock'",
          ["%"+ownerSchema+"%pa05_object_revoke_host_permit%"]);
        if(active[0].n>0){blocked=true;break;}
        await new Promise(resolve=>setTimeout(resolve,40));
      }
      releaseResolve();
      await writeTask;
      assert.equal(await revokeTask,"COMMITTED");
      assert.equal(blocked,true);
      assert.equal((await racedOwner.verifier.verify({
        scope,runId:racing.runId,effectId:racing.effectId,
        receiptId:racing.receiptId,inputDigest:racing.inputDigest,
        ownerPackageId:OBJECT_EXTENSION_PACKAGE_ID
      })).outcome,"SUCCEEDED");
    }finally{
      releaseResolve();
      await racedOwner.close();
    }
    // D14C10: same approved Host command / stolen *unrevoked* bearer /
    // original business SQL password cannot execute the IDENTICAL row on a
    // different physical PostgreSQL backend/transaction.
    const exactReplay=request("stolen-exact-replay");
    await seed(exactReplay);
    await gateway.stagePreparedEffect({scopeKey,effectId:exactReplay.effectId});
    await start(exactReplay);
    const exact=approvedRequest(exactReplay);
    let boundReady,releaseBound;
    const ready=new Promise(resolve=>{boundReady=resolve;});
    const allowOwner=new Promise(resolve=>{releaseBound=resolve;});
    const held=createPostgresObjectExtensionAtomicOwnerV010({
      connectionString:u(urls[1],businessRole,password),schema:ownerSchema,
      pa05PhysicalAdmission:{workerSchema,hostPermitIssuer:{
        issue:req=>issuer.issue(req),
        bindTransaction:async req=>{
          const state=await issuer.bindTransaction(req);
          boundReady(req);
          await allowOwner;
          return state;
        }
      }}
    });
    try{
      const legitimate=held.owner.invoke(exactReplay);
      const bound=await Promise.race([
        ready,legitimate.then(()=>{throw Error("PA05_C10_BIND_NEVER_REACHED");})
      ]);
      assert.equal(bound.token.length,64);
      // A real stolen owner SQL session with the *same login*, full approved
      // document and permit is still a different backend/transaction.
      await assert.rejects(stolen.begin(async tx=>{
        await tx.unsafe("SET LOCAL statement_timeout = '8000ms'");
        await tx.unsafe("SET LOCAL lock_timeout = '5000ms'");
        const other=await tx.unsafe(
          "SELECT pg_backend_pid() AS pid,pg_current_xact_id()::text AS txid");
        assert.notEqual(Number(other[0].pid),bound.backendPid);
        await assert.rejects(issuer.bindTransaction({
          scopeKey,effectId:exactReplay.effectId,token:bound.token,
          backendPid:Number(other[0].pid),
          transactionId:String(other[0].txid)
        }),/PA05_OBJECT_SQL_TRANSACTION_REBIND_DENIED/);
        for(const [key,value] of [["scope_key",scopeKey],
          ["run_id",exactReplay.runId],["effect_id",exactReplay.effectId],
          ["input_digest",exactReplay.inputDigest],
          ["context_id",scope.contextId],
          ["enterprise_id",scope.enterpriseId],
          ["host_permit",bound.token]])
          await tx.unsafe("SELECT set_config($1,$2,true)",
            ["evo.pa05."+key,value]);
        await tx.unsafe("INSERT INTO "+d+".pa02_definitions "+
          "(context_id,enterprise_id,extension_id,target_object_type,"+
          "target_slot,field_id,resource,created_at) "+
          "VALUES($1,$2,$3,$4,$5,$6,$7::jsonb,$8::timestamptz)",[
            scope.contextId,scope.enterpriseId,
            exact.approvedResource.resourceId,
            exact.approvedResource.payload.targetObjectType,
            exact.approvedResource.payload.targetSlot,
            exact.approvedResource.payload.fieldId,
            stolen.json(JSON.parse(JSON.stringify(exact.approvedResource))),
            exact.approvedResource.createdAt
          ]);
      }),/PA05_OBJECT_SQL_TRANSACTION_BIND_REQUIRED/);
      releaseBound();
      await legitimate;
      assert.equal((await held.verifier.verify({
        scope,runId:exactReplay.runId,effectId:exactReplay.effectId,
        receiptId:exactReplay.receiptId,inputDigest:exactReplay.inputDigest,
        ownerPackageId:OBJECT_EXTENSION_PACKAGE_ID
      })).outcome,"SUCCEEDED");
      assert.equal((await db.unsafe("SELECT count(*)::int AS n FROM "+d+
        ".pa02_owner_evidence WHERE effect_id=$1",
        [exactReplay.effectId]))[0].n,1);
      assert.equal(await issuer.revoke({
        scopeKey,effectId:exactReplay.effectId,token:bound.token
      }),"COMMITTED");
    }finally{
      releaseBound();
      await held.close();
    }
    // Previously INVOKING but not committed: local STOP acquires the same
    // config row lock, and the physical business table trigger checks it.
    const frozen=request("frozen-uncommitted");
    await seed(frozen);
    await gateway.stagePreparedEffect({scopeKey,effectId:frozen.effectId});
    await start(frozen);
    await gateway.freezeRemote();
    await assert.rejects(guarded.owner.invoke(frozen),
      /PA05_OBJECT_SQL_HOST_REMOTE_FROZEN/);
    await assert.rejects(raw.owner.invoke(frozen),
      /PA05_OBJECT_SQL_TRANSACTION_SOURCE_REQUIRED/);
    assert.equal((await db.unsafe("SELECT count(*)::int AS n FROM "+
      d+".pa02_owner_evidence"))[0].n,3);

    // A privileged database table owner can still disable the physical SQL
    // trigger. This remains a named production blocker, not a signoff.
    privileged=createPostgresObjectExtensionAtomicOwnerV010({
      connectionString:urls[1],schema:ownerSchema
    });
    await db.unsafe("ALTER TABLE "+d+
      ".pa02_contexts DISABLE TRIGGER pa05_object_physical_guard");
    await db.unsafe("ALTER TABLE "+d+
      ".pa02_definitions DISABLE TRIGGER pa05_object_physical_guard");
    await db.unsafe("ALTER TABLE "+d+
      ".pa02_owner_evidence DISABLE TRIGGER pa05_object_physical_guard");
    // Privileged table owner can disable BOTH admission and deferred receipt
    // constraints: application SQL cannot protect against administrator tamper.
    for(const table of ["pa02_contexts","pa02_definitions"])
      await db.unsafe("ALTER TABLE "+d+"."+table+
        " DISABLE TRIGGER pa05_object_commit_receipt_guard");
    const escape=request("privileged-bypass");
    await privileged.owner.invoke(escape);
    assert.equal((await privileged.verifier.verify({
      scope,runId:escape.runId,effectId:escape.effectId,
      receiptId:escape.receiptId,inputDigest:escape.inputDigest,
      ownerPackageId:OBJECT_EXTENSION_PACKAGE_ID
    })).outcome,"SUCCEEDED");
    assert.equal((await db.unsafe("SELECT count(*)::int AS n FROM "+
      d+".pa02_owner_evidence"))[0].n,4);
    for(const table of ["pa02_contexts","pa02_definitions","pa02_owner_evidence"])
      await db.unsafe("ALTER TABLE "+d+"."+table+
        " ENABLE TRIGGER pa05_object_physical_guard");
    for(const table of ["pa02_contexts","pa02_definitions"])
      await db.unsafe("ALTER TABLE "+d+"."+table+
        " ENABLE TRIGGER pa05_object_commit_receipt_guard");
    await assert.rejects(privileged.owner.invoke(request("restored-guard")),
      /PA05_OBJECT_SQL_WRONG_LOGIN/);
    assert.equal((await authority.getState(OBJECT_EXTENSION_PACKAGE_ID)).pendingCount,7);
    console.log("PA05_ACTUAL_OBJECT_SQL_TRANSACTION_BINDING_PG="+JSON.stringify({
      realPlugin:"evo-object-extension",physicalClusters:3,
      hostBindsLiveBusinessSqlBackendAndTransaction:true,
      ownerBeginsRealTransactionBeforeHostBinding:true,
      stolenUnrevokedPermitCannotExecuteIdenticalApprovedRowOnOtherBackend:true,
      originalBusinessSqlPasswordDoesNotAllowRebind:true,
      standaloneHostPermitMustBeBoundBeforeBusinessInsert:true,
      actualOwnerCommitAndIndependentVerifierStillSucceed:true,
      physicalMachineIdentityCertified:false,
      compromisedOriginalBackendStillOutOfScope:true,
      productionWriteEnabled:false
    }));
    console.log("PA05_ACTUAL_OBJECT_HOST_COMMAND_PROVENANCE_PG="+JSON.stringify({
      realPlugin:"evo-object-extension",physicalClusters:3,
      separateSqlHostApprovedBeforeOwnerInvoke:true,
      unapprovedButValidD10OwnerInvocationDenied:true,
      stagedCommandCannotBeMutated:true,
      businessLoginCannotReadOrStageCommand:true,
      publicRegisterFunctionPermissionDriftDenied:true,
      forgedInternallyConsistentOwnerReceiptNotInHostCommandDenied:true,
      independentlyStagedExactCommandGenuineOwnerStillWorks:true,
      sourceIdentityIsHostSqlLoginNotMachineAttestation:true,
      productionWriteEnabled:false
    }));
    console.log("PA05_ACTUAL_OBJECT_APPROVED_PAYLOAD_PG="+JSON.stringify({
      physicalClusters:3,realPlugin:"evo-object-extension",
      unrevokedCapturedPermitCannotChangeDomainFields:true,
      unrevokedCapturedPermitCannotChangeImmutableReceipt:true,
      hostApprovalSnapshotMustMatchD10CanonicalDigest:true,
      approvedSnapshotsHiddenFromBusinessSqlLogin:true,
      originalOwnerAndIndependentVerifierRetained:true,
      privilegedDbAdministratorCanStillBypass:true,
      productionWriteEnabled:false,
      trustedHostCommandSourceIndependentlyAuthenticated:false
    }));
    console.log("PA05_ACTUAL_OBJECT_HOST_PERMIT_REVOCATION_PG="+JSON.stringify({
      realPlugin:"evo-object-extension",physicalClusters:3,
      unusedPermitRevocationDurable:true,
      stolenBearerAfterRevokeDenied:true,
      invalidRevokeTargetNotFound:true,
      businessSqlLoginCannotRevoke:true,
      revokedPermitCannotBeBlindlyReissued:true,
      originalCommittedReceiptCannotBeRevoked:true,
      ownerTransactionCommitWinsSqlPermitRowLock:true,
      concurrentRevokeReturnsCommittedNotFalseCancellation:true,
      originallyIndependentOwnerVerifierReused:true,
      privilegedAdministratorCanStillBypass:true,
      productionWriteEnabled:false
    }));
    console.log("PA05_ACTUAL_OBJECT_SQL_ROLE_DRIFT_PG="+JSON.stringify({
      physicalClusters:3,realPlugin:"evo-object-extension",
      hostWorkerDmlGrantDeniedAtNewIssuance:true,
      businessDelegatedNoinheritWriteGrantDenied:true,
      publicHostIssuerExecuteDriftDenied:true,
      businessPermitTableReadGrantDeniedAtPhysicalInsert:true,
      revokedPrivilegesRestoreGenuineOwnerCommit:true,
      privilegedDbAdministratorTamperStillPossible:true,
      productionWriteEnabled:false
    }));
    console.log("PA05_ACTUAL_OBJECT_HOST_PERMIT_PG="+JSON.stringify({
      realPlugin:"evo-object-extension",physicalClusters:3,
      stolenBusinessLoginCanForgeGuc:true,
      stolenBusinessLoginCannotMintOrReadHostPermit:true,
      validExistingD10TicketNotSufficient:true,
      hostSqlLoginDistinct:true,consumedValidPermitReplayDenied:true,
      perEffectPermitBoundToOwnerEvidence:true,
      orphanBusinessCommitWithoutOwnerEvidenceDenied:true,
      actualDomainTablesGuarded:3,actualBusinessOwnerRestrictedLogin:true,
      originalRawOwnerDeniedWithoutSource:true,
      originalRawOwnerDeniedEvenWithValidTicket:true,
      realGuardedOwnerAtomicBusinessAndEvidenceCommit:true,
      originalIndependentVerifierReused:true,
      receiptIdempotencyPreserved:true,
      ownerWithoutInvokingDenied:true,
      localFreezeRejectsNewDomainCommit:true,
      ordinaryBusinessRoleCannotDisableTrigger:true,
      privilegedTableOwnerCanStillDisableTrigger:true,
      productionWriteEnabled:false,realProductionDataMigrated:false,
      privilegedHostMachineCertified:false
    }));
  }finally{
    for(const x of [stolen,guarded,raw,privileged,issuer,gateway,authority])
      if(x)try{await x.close();}catch{}
    try{await db.unsafe("DROP SCHEMA IF EXISTS "+d+" CASCADE");}catch{}
    try{await db.unsafe("DROP SCHEMA IF EXISTS "+w+" CASCADE");}catch{}
    for(const role of [businessRole,workerRole,hostRole]){
      try{await db.unsafe('DROP OWNED BY "'+role+'"');}catch{}
      try{await db.unsafe('DROP ROLE IF EXISTS "'+role+'"');}catch{}
    }
    try{await central.unsafe("DROP SCHEMA IF EXISTS "+q(centralSchema)+" CASCADE");}catch{}
    await Promise.allSettled([central.end(),db.end(),b.end()]);
  }
});
