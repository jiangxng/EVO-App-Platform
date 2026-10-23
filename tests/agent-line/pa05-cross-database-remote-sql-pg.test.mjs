import test from "node:test";
import assert from "node:assert/strict";
import {createHash,randomUUID} from "node:crypto";
import postgres from "postgres";
import {createPa05CrossDatabaseReservationAuthorityV010}
  from "../../dist/manager/pa05-cross-database-admission.js";
import {createPa05CrossDatabaseRemoteSqlAdmissionV010}
  from "../../dist/manager/pa05-cross-database-remote-sql-admission.js";

const centralUrl=process.env.PA05_XDB_AUTHORITY_DATABASE_URL;
const workerAUrl=process.env.PA05_XDB_WORKER_A_DATABASE_URL;
const workerBUrl=process.env.PA05_XDB_WORKER_B_DATABASE_URL;
const digest=x=>createHash("sha256").update(x).digest("hex");
const owner="pa05.xdb.owner";
const workers=[
  {workerId:"host-a-worker",databaseId:"remote-worker-a",ownerPackageId:owner},
  {workerId:"host-b-worker",databaseId:"remote-worker-b",ownerPackageId:owner}
];
const uriAs=(uri,name,password)=>{
  const u=new URL(uri);u.username=name;u.password=password;return u.toString();
};
test("PA05-04D10 three PG18 clusters: authenticated SQL cannot bypass central reservation",{
  skip:!centralUrl||!workerAUrl||!workerBUrl?"three distinct real PG18 URLs required":false
},async()=>{
  const suffix=randomUUID().replaceAll("-","").slice(0,11);
  const centralSchema="pa05_d10_"+suffix;
  const remoteSchema="pa05_worker_"+suffix;
  const roleA="pa05a_"+suffix,roleB="pa05b_"+suffix,rogue="pa05rogue_"+suffix;
  const roles=[roleA,roleB,rogue];
  const password="Test_"+randomUUID().replaceAll("-","");
  const central=postgres(centralUrl,{max:2});
  const a=postgres(workerAUrl,{max:3});
  const b=postgres(workerBUrl,{max:3});
  const clients=[];
  let authority,admitA,admitB;
  const q='"'+remoteSchema+'"';
  const writeTable=q+".pa02b_writes";
  async function connect(url,role){
    const c=postgres(uriAs(url,role,password),{max:1});
    clients.push(c);
    return c;
  }
  async function seed(db,effect){
    await db.unsafe("INSERT INTO "+writeTable+
      "(scope_key,effect_id,run_id,input_digest,fence,state) "+
      "VALUES($1,$2,$3,$4,$5,'PREPARED')",
      ["enterprise:acme",effect,"run:"+effect,digest("payload:"+effect),1]);
  }
  const begin=(db,effect)=>db.unsafe("UPDATE "+writeTable+
    " SET state='INVOKING' WHERE scope_key=$1 AND effect_id=$2 RETURNING state",
    ["enterprise:acme",effect]);
  try {
    const clusters=await Promise.all([central,a,b].map(async db=>{
      const row=await db.unsafe("SELECT system_identifier::text AS sid FROM pg_control_system()");
      return row[0].sid;
    }));
    assert.equal(new Set(clusters).size,3);
    for(const db of [a,b]){
      await db.unsafe("CREATE SCHEMA "+q);
      await db.unsafe("CREATE TABLE "+writeTable+"("+
        "scope_key text NOT NULL,effect_id text NOT NULL,run_id text NOT NULL,"+
        "input_digest text NOT NULL,fence bigint NOT NULL,state text NOT NULL,"+
        "PRIMARY KEY(scope_key,effect_id))");
    }
    for(const [db,role] of [[a,roleA],[a,rogue],[b,roleB]]){
      await db.unsafe('CREATE ROLE "'+role+'" LOGIN PASSWORD \''+password+'\'');
      await db.unsafe('GRANT USAGE ON SCHEMA '+q+' TO "'+role+'"');
      await db.unsafe('GRANT SELECT,UPDATE ON '+writeTable+' TO "'+role+'"');
    }
    const workerA=await connect(workerAUrl,roleA);
    const workerB=await connect(workerBUrl,roleB);
    const attacker=await connect(workerAUrl,rogue);
    authority=await createPa05CrossDatabaseReservationAuthorityV010({
      authorityConnectionString:centralUrl,authoritySchema:centralSchema,
      trustedWorkers:workers
    });
    await authority.registerFrozenOwner(owner,"1.0.0");
    await authority.reopenOwner({packageId:owner,version:"1.0.0",
      trustedOwnerReady:()=>true});
    admitA=await createPa05CrossDatabaseRemoteSqlAdmissionV010({
      connectionString:workerAUrl,workerSchema:remoteSchema,
      workerId:"host-a-worker",ownerPackageId:owner,ownerVersion:"1.0.0",
      workerLoginRole:roleA,authority
    });
    admitB=await createPa05CrossDatabaseRemoteSqlAdmissionV010({
      connectionString:workerBUrl,workerSchema:remoteSchema,
      workerId:"host-b-worker",ownerPackageId:owner,ownerVersion:"1.0.0",
      workerLoginRole:roleB,authority
    });
    const first="write_"+suffix;
    await seed(a,first);
    await assert.rejects(begin(workerA,first),/PA05_XDB_REMOTE_CENTRAL_TICKET_REQUIRED/);
    // D14C: the real PA-02 run coordinator uses trusted HOST SQL,
    // not the restricted Worker LOGIN. Neither may skip a central ticket.
    await assert.rejects(begin(a,first),
      /PA05_XDB_REMOTE_CENTRAL_TICKET_REQUIRED/);
    assert.equal((await a.unsafe("SELECT state FROM "+writeTable+
      " WHERE effect_id=$1",[first]))[0].state,"PREPARED");
    await assert.rejects(workerA.unsafe("INSERT INTO "+q+
      ".pa05_xdb_remote_tickets(scope_key,effect_id,run_id,input_digest,fence,"+
      "reservation_id,effect_digest) VALUES('fake','fake','fake','fake',1,'fake','fake')"),
      /permission denied/);
    await assert.rejects(workerA.unsafe("DROP TRIGGER pa05_xdb_remote_admission ON "+
      writeTable),/permission denied|must be owner/);
    // A different authenticated login has the same UPDATE privilege, but
    // SESSION_USER cannot be forged by SET ROLE or an application field.
    await assert.rejects(begin(attacker,first),/PA05_XDB_REMOTE_WRONG_LOGIN/);

    // Remote Worker-B with an ACTIVE central Owner but an unreachable
    // central reservation port must never receive a new local ticket.
    const unavailable={
      reserve:async()=>{throw Error("PA05_TEST_CENTRAL_UNAVAILABLE");}
    };
    let disconnected=await createPa05CrossDatabaseRemoteSqlAdmissionV010({
      connectionString:workerBUrl,workerSchema:remoteSchema,
      workerId:"host-b-worker",ownerPackageId:owner,ownerVersion:"1.0.0",
      workerLoginRole:roleB,authority:unavailable
    });
    const unreserved="no_central_"+suffix;
    await seed(b,unreserved);
    await assert.rejects(disconnected.stagePreparedEffect({
      scopeKey:"enterprise:acme",effectId:unreserved
    }),/PA05_TEST_CENTRAL_UNAVAILABLE/);
    await assert.rejects(begin(workerB,unreserved),
      /PA05_XDB_REMOTE_CENTRAL_TICKET_REQUIRED/);
    await assert.rejects(begin(b,unreserved),
      /PA05_XDB_REMOTE_CENTRAL_TICKET_REQUIRED/);
    await disconnected.close();disconnected=null;

    const ticket=await admitA.stagePreparedEffect({
      scopeKey:"enterprise:acme",effectId:first
    });
    assert.match(ticket.reservationId,/^[0-9a-f]{64}$/);
    assert.equal((await authority.getState(owner)).pendingCount,1);
    assert.deepEqual((await admitA.stagePreparedEffect({
      scopeKey:"enterprise:acme",effectId:first
    })),ticket);
    await assert.rejects(attacker.unsafe("UPDATE "+writeTable+
      " SET state='INVOKING' WHERE effect_id=$1",[first]),
      /PA05_XDB_REMOTE_WRONG_LOGIN/);
    await assert.rejects(workerA.unsafe("UPDATE "+writeTable+
      " SET run_id=run_id||'_forged' WHERE effect_id=$1",[first]),
      /PA05_XDB_REMOTE_IMMUTABLE_EFFECT/);
    await assert.rejects(workerA.unsafe("UPDATE "+writeTable+
      " SET state='SUCCEEDED' WHERE effect_id=$1",[first]),
      /PA05_XDB_REMOTE_WORKER_STATE_DENIED/);
    // Re-attestation must refuse a swapped Worker LOGIN.
    await assert.rejects(createPa05CrossDatabaseRemoteSqlAdmissionV010({
      connectionString:workerAUrl,workerSchema:remoteSchema,
      workerId:"host-a-worker",ownerPackageId:owner,ownerVersion:"1.0.0",
      workerLoginRole:rogue,authority
    }),/PA05_XDB_REMOTE_CONFIG_RECERTIFICATION_REQUIRED/);

    // Both databases are physically independent. Freeze after ticket
    // staging retains a conservative central pending record, so lifecycle
    // drain is still blocked even if this Worker starts after freeze.
    assert.deepEqual(await authority.freeze(owner),{
      state:"FROZEN",pendingCount:1
    });
    const bEffect="frozen_"+suffix;
    await seed(b,bEffect);
    await assert.rejects(admitB.stagePreparedEffect({
      scopeKey:"enterprise:acme",effectId:bEffect
    }),/PA05_XDB_ADMISSION_FROZEN/);
    await assert.rejects(begin(workerB,bEffect),
      /PA05_XDB_REMOTE_CENTRAL_TICKET_REQUIRED/);
    assert.equal((await begin(workerA,first))[0].state,"INVOKING");
    await assert.rejects(workerA.unsafe("UPDATE "+writeTable+
      " SET state='SUCCEEDED' WHERE effect_id=$1",[first]),
      /PA05_XDB_REMOTE_WORKER_STATE_DENIED/);
    assert.equal((await authority.getState(owner)).pendingCount,1);
    await assert.rejects(authority.reopenOwner({packageId:owner,version:"1.0.0",
      trustedOwnerReady:()=>true}),/PA05_XDB_PENDING_RESERVATIONS/);

    // Worker table extra DELETE authority is unsafe at Host attestation,
    // even though the normal admission trigger still guards UPDATE.
    await a.unsafe('GRANT DELETE ON '+writeTable+' TO "'+roleA+'"');
    await assert.rejects(createPa05CrossDatabaseRemoteSqlAdmissionV010({
      connectionString:workerAUrl,workerSchema:remoteSchema,
      workerId:"host-a-worker",ownerPackageId:owner,ownerVersion:"1.0.0",
      workerLoginRole:roleA,authority
    }),/PA05_XDB_REMOTE_UNSAFE_WORKER_SQL_ROLE/);
    await a.unsafe('REVOKE DELETE ON '+writeTable+' FROM "'+roleA+'"');
    console.log("PA05_XDB_REMOTE_SQL_ADMISSION_PG="+JSON.stringify({
      actualPostgres18:true,physicalClusters:3,
      sqlAdmissionRequiresStagedCentralReservation:true,
      authenticatedWorkerLoginPinned:true,
      forgedTerminalDenied:true,provenanceImmutable:true,
      missingCentralPortDeniesNewTicket:true,
      crossDbFreezeRetainsPending:true,
      productionWriteEnabled:false,
      directBusinessOwnerBypassStillUnproven:true,
      existingTicketCanStartDuringPartition:true,
      ownerReconciliationImplemented:false
    }));
  }finally{
    for(const c of clients)try{await c.end();}catch{}
    if(admitA)await admitA.close();
    if(admitB)await admitB.close();
    if(authority)await authority.close();
    for(const db of [a,b]){
      try{await db.unsafe("DROP SCHEMA IF EXISTS "+q+" CASCADE");}catch{}
    }
    for(const [db,role] of [[a,roleA],[a,rogue],[b,roleB]]){
      try{await db.unsafe('DROP OWNED BY "'+role+'"');}catch{}
      try{await db.unsafe('DROP ROLE IF EXISTS "'+role+'"');}catch{}
    }
    try{await central.unsafe('DROP SCHEMA IF EXISTS "'+centralSchema+'" CASCADE');}catch{}
    await Promise.allSettled([central.end(),a.end(),b.end()]);
  }
});
