import test from "node:test";
import assert from "node:assert/strict";
import {createHash,randomUUID} from "node:crypto";
import postgres from "postgres";
import {createPa05CrossDatabaseReservationAuthorityV010}
  from "../../dist/manager/pa05-cross-database-admission.js";
import {createPa05CrossDatabaseRemoteSqlAdmissionV010}
  from "../../dist/manager/pa05-cross-database-remote-sql-admission.js";
import {freezePa05CrossDatabaseOwnerV010}
  from "../../dist/manager/pa05-cross-database-freeze.js";

const centralUrl=process.env.PA05_XDB_AUTHORITY_DATABASE_URL;
const workerAUrl=process.env.PA05_XDB_WORKER_A_DATABASE_URL;
const workerBUrl=process.env.PA05_XDB_WORKER_B_DATABASE_URL;
const sha=v=>createHash("sha256").update(v).digest("hex");
const as=(url,role,pwd)=>{const u=new URL(url);u.username=role;u.password=pwd;return u.toString();};

test("PA05-04D14 real 3-PG18: local monotone SQL stop blocks old tickets, partial remote partition NEVER reports global freeze",{
  skip:!centralUrl||!workerAUrl||!workerBUrl?"requires three distinct PG18 clusters":false,
  timeout:90000
},async()=>{
  const suffix=randomUUID().replaceAll("-","").slice(0,11);
  const owner="pa05.d14.owner";
  const schemaA="pa05_d14a_"+suffix, schemaB="pa05_d14b_"+suffix;
  const schemaC="pa05_d14c_"+suffix;
  const roleA="pa05d14a_"+suffix,roleB="pa05d14b_"+suffix;
  const pass="Test_"+randomUUID().replaceAll("-","");
  const central=postgres(centralUrl,{max:2});
  const a=postgres(workerAUrl,{max:3}),b=postgres(workerBUrl,{max:3});
  const clients=[];
  let authority,admitA,admitB,admitARestart;
  const schemaQ=s=>'"'+s+'"';
  const make=(schema,which)=>({
    connectionString:which,workerSchema:schema,
    workerId:schema===schemaA?"remote-a":"remote-b",
    ownerPackageId:owner,ownerVersion:"1.0.0",
    workerLoginRole:schema===schemaA?roleA:roleB,authority
  });
  const seed=async(db,schema,effect)=>{
    await db.unsafe("INSERT INTO "+schemaQ(schema)+".pa02b_writes "+
      "(scope_key,effect_id,run_id,input_digest,fence,state) "+
      "VALUES($1,$2,$3,$4,1,'PREPARED')",
      ["tenant:d14",effect,"run:"+effect,sha(effect)]);
  };
  const start=(worker,schema,effect)=>worker.unsafe(
    "UPDATE "+schemaQ(schema)+".pa02b_writes SET state='INVOKING' "+
    "WHERE scope_key='tenant:d14' AND effect_id=$1 RETURNING state",[effect]);
  try {
    const physical=await Promise.all([central,a,b].map(async db=>
      String((await db.unsafe("SELECT system_identifier::text AS id FROM pg_control_system()"))[0].id)));
    assert.equal(new Set(physical).size,3);
    for(const [db,schema,role] of [[a,schemaA,roleA],[b,schemaB,roleB]]){
      const q=schemaQ(schema);
      await db.unsafe("CREATE SCHEMA "+q);
      await db.unsafe("CREATE TABLE "+q+".pa02b_writes ("+
        "scope_key text NOT NULL,effect_id text NOT NULL,run_id text NOT NULL,"+
        "input_digest text NOT NULL,fence bigint NOT NULL,state text NOT NULL,"+
        "PRIMARY KEY(scope_key,effect_id))");
      await db.unsafe('CREATE ROLE "'+role+'" LOGIN PASSWORD \''+pass+'\'');
      await db.unsafe('GRANT USAGE ON SCHEMA '+q+' TO "'+role+'"');
      await db.unsafe('GRANT SELECT,UPDATE ON '+q+'.pa02b_writes TO "'+role+'"');
      clients.push(postgres(as(db===a?workerAUrl:workerBUrl,role,pass),{max:1}));
    }
    const [workerA,workerB]=clients;
    authority=await createPa05CrossDatabaseReservationAuthorityV010({
      authorityConnectionString:centralUrl,authoritySchema:schemaC,
      trustedWorkers:[
        {workerId:"remote-a",databaseId:"worker-db-a",ownerPackageId:owner},
        {workerId:"remote-b",databaseId:"worker-db-b",ownerPackageId:owner}
      ]
    });
    await authority.registerFrozenOwner(owner,"1.0.0");
    await authority.reopenOwner({packageId:owner,version:"1.0.0",
      trustedOwnerReady:()=>true});
    admitA=await createPa05CrossDatabaseRemoteSqlAdmissionV010(make(schemaA,workerAUrl));
    admitB=await createPa05CrossDatabaseRemoteSqlAdmissionV010(make(schemaB,workerBUrl));
    assert.equal(await admitA.getRemoteState(),"ACTIVE");
    assert.equal(await admitB.getRemoteState(),"ACTIVE");

    // Central inventory prevents fake completion by omitting remote B.
    await assert.rejects(freezePa05CrossDatabaseOwnerV010({
      ownerPackageId:owner,central:authority,remotes:[admitA]
    }),/PA05_XDB_REMOTE_FREEZE_INVENTORY_MISMATCH/);
    assert.equal((await authority.getState(owner)).state,"ACTIVE");

    for(const eff of ["a-old","b-old","b-unconsumed"]){
      const aSide=eff.startsWith("a-");
      const db=aSide?a:b, schema=aSide?schemaA:schemaB;
      await seed(db,schema,eff);
      await (aSide?admitA:admitB).stagePreparedEffect({
        scopeKey:"tenant:d14",effectId:eff
      });
    }
    assert.equal((await authority.getState(owner)).pendingCount,3);

    // Freeze A without asking CENTRAL: an already staged A ticket cannot
    // begin INVOKING, even if the central connection is unreachable.
    assert.deepEqual(await admitA.freezeRemote(),{state:"FROZEN"});
    await assert.rejects(start(workerA,schemaA,"a-old"),
      /PA05_XDB_REMOTE_LOCALLY_FROZEN/);
    assert.equal((await a.unsafe("SELECT state FROM "+
      schemaQ(schemaA)+".pa02b_writes WHERE effect_id='a-old'"))[0].state,"PREPARED");

    // Even a mistakenly granted UPDATE cannot thaw local SQL gate.
    await a.unsafe('GRANT UPDATE ON '+schemaQ(schemaA)+
      '.pa05_xdb_remote_config TO "'+roleA+'"');
    await assert.rejects(workerA.unsafe("UPDATE "+schemaQ(schemaA)+
      ".pa05_xdb_remote_config SET state='ACTIVE'"),
      /PA05_XDB_REMOTE_CONFIG_WRONG_LOGIN/);
    await a.unsafe('REVOKE UPDATE ON '+schemaQ(schemaA)+
      '.pa05_xdb_remote_config FROM "'+roleA+'"');
    await assert.rejects(a.unsafe("UPDATE "+schemaQ(schemaA)+
      ".pa05_xdb_remote_config SET state='ACTIVE'"),
      /PA05_XDB_REMOTE_FROZEN_MONOTONE/);

    // Remote B unreachable: central is frozen conservatively, but B remains
    // ACTIVE and a pre-staged B effect MAY STILL BEGIN. That precisely
    // refutes an unsafe claim of global freeze after a partial partition.
    const bUnreachable={
      ownerPackageId:owner,workerId:"remote-b",
      async freezeRemote(){throw Error("NETWORK_PARTITION_REMOTE_B");},
      async getRemoteState(){throw Error("NETWORK_PARTITION_REMOTE_B");}
    };
    await assert.rejects(freezePa05CrossDatabaseOwnerV010({
      ownerPackageId:owner,central:authority,remotes:[admitA,bUnreachable]
    }),/PA05_XDB_REMOTE_FREEZE_PARTITION_UNVERIFIED/);
    assert.deepEqual(await authority.getState(owner),{
      state:"FROZEN",version:"1.0.0",pendingCount:3
    });
    assert.equal(await admitB.getRemoteState(),"ACTIVE");
    assert.equal((await start(workerB,schemaB,"b-old"))[0].state,"INVOKING");
    // No Host may claim a completed all-remote fence at this point.
    assert.equal(await admitA.getRemoteState(),"FROZEN");

    // Restore B connectivity, then finish every local SQL fence and attest
    // all remotes. Even pre-staged b-unconsumed cannot begin after fence.
    assert.deepEqual(await freezePa05CrossDatabaseOwnerV010({
      ownerPackageId:owner,central:authority,remotes:[admitA,admitB]
    }),{state:"FROZEN",pendingCount:3,remoteWorkerCount:2});
    await assert.rejects(start(workerB,schemaB,"b-unconsumed"),
      /PA05_XDB_REMOTE_LOCALLY_FROZEN/);
    assert.deepEqual(await admitB.freezeRemote(),{state:"FROZEN"});
    await assert.rejects(admitB.stagePreparedEffect({
      scopeKey:"tenant:d14",effectId:"b-unconsumed"
    }),/PA05_XDB_ADMISSION_FROZEN/);

    // Local FROZEN cannot reset to ACTIVE when Host process reconnects
    // and independently reinitializes the remote SQL gate.
    await admitA.close();admitA=null;
    admitARestart=await createPa05CrossDatabaseRemoteSqlAdmissionV010(
      make(schemaA,workerAUrl));
    assert.equal(await admitARestart.getRemoteState(),"FROZEN");
    await assert.rejects(start(workerA,schemaA,"a-old"),
      /PA05_XDB_REMOTE_LOCALLY_FROZEN/);
    assert.equal((await authority.getState(owner)).pendingCount,3);
    await assert.rejects(authority.reopenOwner({
      packageId:owner,version:"1.0.0",trustedOwnerReady:()=>true
    }),/PA05_XDB_PENDING_RESERVATIONS/);
    console.log("PA05_XDB_REMOTE_MONOTONE_FREEZE_PG="+JSON.stringify({
      physicalClusters:3,
      completeCentralWorkerInventoryRequired:true,
      previouslyStagedTicketDeniedAfterLocalFreeze:true,
      localFreezeSurvivesHostRestart:true,
      wrongWorkerSQLLoginCannotThaw:true,
      hostCannotThawMonotoneGate:true,
      remotePartitionCannotClaimGlobalFreeze:true,
      centralConservativelyFreezesOnPartialRemoteFailure:true,
      preStagedTicketCanExecuteOnUnreachableActiveRemote:true,
      twoRemoteDatabasesFencedBeforeGlobalSuccess:true,
      pendingOwnerCannotReopen:true,
      productionWriteEnabled:false,
      independentCrossDbHostIdentityCertified:false,
      fullDistributedFailStopCertified:false
    }));
  }finally{
    for(const client of clients)try{await client.end();}catch{}
    for(const x of [admitARestart,admitA,admitB,authority])
      if(x)try{await x.close();}catch{}
    for(const [db,schema,role] of [[a,schemaA,roleA],[b,schemaB,roleB]]){
      try{await db.unsafe("DROP SCHEMA IF EXISTS "+schemaQ(schema)+" CASCADE");}catch{}
      try{await db.unsafe('DROP OWNED BY "'+role+'"');}catch{}
      try{await db.unsafe('DROP ROLE IF EXISTS "'+role+'"');}catch{}
    }
    try{await central.unsafe("DROP SCHEMA IF EXISTS "+schemaQ(schemaC)+" CASCADE");}catch{}
    await Promise.allSettled([central.end(),a.end(),b.end()]);
  }
});
