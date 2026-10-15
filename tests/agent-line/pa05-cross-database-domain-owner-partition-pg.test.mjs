import test from "node:test";
import assert from "node:assert/strict";
import {createHash,randomUUID} from "node:crypto";
import postgres from "postgres";
import {createPa05CrossDatabaseReservationAuthorityV010}
  from "../../dist/manager/pa05-cross-database-admission.js";
import {createPa05CrossDatabaseRemoteSqlAdmissionV010}
  from "../../dist/manager/pa05-cross-database-remote-sql-admission.js";
import {installPa05DomainOwnerSqlFenceV010}
  from "../../dist/manager/pa05-cross-database-domain-owner-fence.js";
import {freezePa05CrossDatabaseOwnerV010}
  from "../../dist/manager/pa05-cross-database-freeze.js";

const urls=[process.env.PA05_XDB_AUTHORITY_DATABASE_URL,
  process.env.PA05_XDB_WORKER_A_DATABASE_URL,
  process.env.PA05_XDB_WORKER_B_DATABASE_URL];
const hash=s=>createHash("sha256").update(s).digest("hex");
const as=(url,role,pwd)=>{const u=new URL(url);u.username=role;u.password=pwd;return u.toString();};
const q=s=>'"'+s+'"';
test("PA05-04D14C: actual SQL business Owner bypass, physical restart, frozen domain insert and surviving remote-partition counterexample",{
  skip:urls.some(x=>!x)?"requires three physical PostgreSQL18 clusters":false,
  timeout:120000
},async()=>{
  const suffix=randomUUID().replaceAll("-","").slice(0,10);
  const schemaA="pa05_c_a_"+suffix,schemaB="pa05_c_b_"+suffix;
  const centralSchema="pa05_c_c_"+suffix,owner="pa05.d14c.owner";
  const pwd="Test_"+randomUUID().replaceAll("-","");
  const roleWorkerA="pa05_c_wa_"+suffix,roleWorkerB="pa05_c_wb_"+suffix;
  const roleOwnerA="pa05_c_oa_"+suffix,roleOwnerB="pa05_c_ob_"+suffix,
    rogue="pa05_c_rogue_"+suffix;
  const [center,dbA,dbB]=urls.map(url=>postgres(url,{max:5}));
  const sessions=[];
  let authority,remoteA,remoteB,domainA,domainB;
  async function makeDb(db,schema,worker,domainOwner,attacker){
    const t=q(schema);
    await db.unsafe("CREATE SCHEMA "+t);
    await db.unsafe("CREATE TABLE "+t+".pa02b_writes("+
      "scope_key text NOT NULL,effect_id text NOT NULL,run_id text NOT NULL,"+
      "input_digest text NOT NULL,fence bigint NOT NULL,state text NOT NULL,"+
      "PRIMARY KEY(scope_key,effect_id))");
    await db.unsafe("CREATE TABLE "+t+".owner_effects("+
      "scope_key text NOT NULL,effect_id text NOT NULL,run_id text NOT NULL,"+
      "input_digest text NOT NULL,fence bigint NOT NULL,payload text NOT NULL,"+
      "PRIMARY KEY(scope_key,effect_id))");
    for(const role of [worker,domainOwner,...(attacker?[attacker]:[])]){
      await db.unsafe('CREATE ROLE "'+role+'" LOGIN PASSWORD \''+pwd+'\'');
      await db.unsafe('GRANT USAGE ON SCHEMA '+t+' TO "'+role+'"');
    }
    await db.unsafe('GRANT SELECT,UPDATE ON '+t+'.pa02b_writes TO "'+worker+'"');
    await db.unsafe('GRANT INSERT ON '+t+'.owner_effects TO "'+domainOwner+'"');
    if(attacker)await db.unsafe('GRANT INSERT ON '+t+'.owner_effects TO "'+attacker+'"');
  }
  async function seed(db,schema,id){
    await db.unsafe("INSERT INTO "+q(schema)+".pa02b_writes"+
      "(scope_key,effect_id,run_id,input_digest,fence,state) "+
      "VALUES('tenant:c',$1,$2,$3,1,'PREPARED')",
      [id,"run:"+id,hash("payload:"+id)]);
  }
  const begin=(db,schema,id)=>db.unsafe("UPDATE "+q(schema)+
    ".pa02b_writes SET state='INVOKING' WHERE scope_key='tenant:c' "+
    "AND effect_id=$1 RETURNING state",[id]);
  const write=(db,schema,id)=>db.unsafe("INSERT INTO "+q(schema)+
    ".owner_effects(scope_key,effect_id,run_id,input_digest,fence,payload) "+
    "VALUES('tenant:c',$1,$2,$3,1,'sandbox')",
    [id,"run:"+id,hash("payload:"+id)]);
  try{
    const systems=await Promise.all([center,dbA,dbB].map(async db=>
      String((await db.unsafe("SELECT system_identifier::text AS id FROM pg_control_system()"))[0].id)));
    assert.equal(new Set(systems).size,3);
    await makeDb(dbA,schemaA,roleWorkerA,roleOwnerA,rogue);
    await makeDb(dbB,schemaB,roleWorkerB,roleOwnerB);
    const aOwner=postgres(as(urls[1],roleOwnerA,pwd),{max:1}),
      bOwner=postgres(as(urls[2],roleOwnerB,pwd),{max:1}),
      attacker=postgres(as(urls[1],rogue,pwd),{max:1});
    sessions.push(aOwner,bOwner,attacker);
    authority=await createPa05CrossDatabaseReservationAuthorityV010({
      authorityConnectionString:urls[0],authoritySchema:centralSchema,
      trustedWorkers:[
        {workerId:"remote-a",databaseId:"physical-a",ownerPackageId:owner},
        {workerId:"remote-b",databaseId:"physical-b",ownerPackageId:owner}
      ]
    });
    await authority.registerFrozenOwner(owner,"1.0.0");
    await authority.reopenOwner({packageId:owner,version:"1.0.0",
      trustedOwnerReady:()=>true});
    remoteA=await createPa05CrossDatabaseRemoteSqlAdmissionV010({
      connectionString:urls[1],workerSchema:schemaA,
      workerId:"remote-a",ownerPackageId:owner,ownerVersion:"1.0.0",
      workerLoginRole:roleWorkerA,authority
    });
    remoteB=await createPa05CrossDatabaseRemoteSqlAdmissionV010({
      connectionString:urls[2],workerSchema:schemaB,
      workerId:"remote-b",ownerPackageId:owner,ownerVersion:"1.0.0",
      workerLoginRole:roleWorkerB,authority
    });
    domainA=await installPa05DomainOwnerSqlFenceV010({
      connectionString:urls[1],workerSchema:schemaA,
      domainTable:"owner_effects",domainOwnerLoginRole:roleOwnerA
    });
    domainB=await installPa05DomainOwnerSqlFenceV010({
      connectionString:urls[2],workerSchema:schemaB,
      domainTable:"owner_effects",domainOwnerLoginRole:roleOwnerB
    });

    // A genuine Owner has INSERT permission but may not skip the PA-02
    // EXECUTING state or Host-staged central reservation.
    await seed(dbA,schemaA,"missing-ticket");
    await assert.rejects(begin(dbA,schemaA,"missing-ticket"),
      /PA05_XDB_REMOTE_CENTRAL_TICKET_REQUIRED/);
    await assert.rejects(write(aOwner,schemaA,"missing-ticket"),
      /PA05_XDB_DOMAIN_DURABLE_ADMISSION_REQUIRED/);
    await assert.rejects(write(dbA,schemaA,"missing-ticket"),
      /PA05_XDB_DOMAIN_WRONG_OWNER_LOGIN/);
    await assert.rejects(write(attacker,schemaA,"missing-ticket"),
      /PA05_XDB_DOMAIN_WRONG_OWNER_LOGIN/);
    await assert.rejects(aOwner.unsafe("TRUNCATE "+q(schemaA)+".owner_effects"),
      /permission denied|must be owner|PA05_XDB_DOMAIN_TRUNCATE_DENIED/);

    // Actual existing central D9 reserve -> remote D10 ticket -> Host
    // PA-02 beginWrite -> authenticated separate business Owner effect.
    await seed(dbA,schemaA,"legitimate");
    await remoteA.stagePreparedEffect({scopeKey:"tenant:c",effectId:"legitimate"});
    assert.equal((await begin(dbA,schemaA,"legitimate"))[0].state,"INVOKING");
    await write(aOwner,schemaA,"legitimate");
    assert.equal((await dbA.unsafe("SELECT count(*)::integer AS n FROM "+
      q(schemaA)+".owner_effects"))[0].n,1);

    // Wrong Owner login cannot consume a valid central reservation even
    // after an administrator accidentally GRANTs INSERT to a rogue.
    await assert.rejects(write(attacker,schemaA,"legitimate"),
      /PA05_XDB_DOMAIN_WRONG_OWNER_LOGIN/);

    // Deliberate pause after INVOKING, then local FROZEN: even a previously
    // started Owner cannot create NEW business effects after freeze commits.
    await seed(dbA,schemaA,"inflight-then-frozen");
    await remoteA.stagePreparedEffect({
      scopeKey:"tenant:c",effectId:"inflight-then-frozen"
    });
    await begin(dbA,schemaA,"inflight-then-frozen");
    await remoteA.freezeRemote();
    await assert.rejects(write(aOwner,schemaA,"inflight-then-frozen"),
      /PA05_XDB_DOMAIN_LOCALLY_FROZEN/);

    // Physical network loss alone cannot fake a successful remote freeze.
    // A separate, still-ACTIVE B database can execute a ticket *after* the
    // central authority was conservatively frozen due to remote failure.
    await seed(dbB,schemaB,"remote-old");
    await remoteB.stagePreparedEffect({
      scopeKey:"tenant:c",effectId:"remote-old"
    });
    const interrupted={
      ownerPackageId:owner,workerId:"remote-b",
      async freezeRemote(){throw Error("REMOTE_PARTITION_B");},
      async getRemoteState(){throw Error("REMOTE_PARTITION_B");}
    };
    await assert.rejects(freezePa05CrossDatabaseOwnerV010({
      ownerPackageId:owner,central:authority,remotes:[remoteA,interrupted]
    }),/PA05_XDB_REMOTE_FREEZE_PARTITION_UNVERIFIED/);
    assert.equal((await authority.getState(owner)).state,"FROZEN");
    assert.equal(await remoteB.getRemoteState(),"ACTIVE");
    assert.equal((await begin(dbB,schemaB,"remote-old"))[0].state,"INVOKING");
    await write(bOwner,schemaB,"remote-old");
    assert.equal((await dbB.unsafe("SELECT count(*)::integer AS n FROM "+
      q(schemaB)+".owner_effects"))[0].n,1);
    assert.deepEqual(await freezePa05CrossDatabaseOwnerV010({
      ownerPackageId:owner,central:authority,remotes:[remoteA,remoteB]
    }),{state:"FROZEN",pendingCount:3,remoteWorkerCount:2});
    // Confirm a real PostgreSQL backend is terminated, not only an in-memory
    // callback; the local persisted FROZEN gate survives a new connection.
    const victim=postgres(urls[2],{max:1});
    const pid=Number((await victim.unsafe("SELECT pg_backend_pid() AS pid"))[0].pid);
    assert.ok(pid>0);
    const ended=await dbB.unsafe("SELECT pg_terminate_backend($1) AS ended",[pid]);
    assert.equal(ended[0].ended,true);
    await victim.end().catch(()=>{});
    await remoteB.close();remoteB=null;
    remoteB=await createPa05CrossDatabaseRemoteSqlAdmissionV010({
      connectionString:urls[2],workerSchema:schemaB,
      workerId:"remote-b",ownerPackageId:owner,ownerVersion:"1.0.0",
      workerLoginRole:roleWorkerB,authority
    });
    assert.equal(await remoteB.getRemoteState(),"FROZEN");

    // A SQL privileged table OWNER can DISABLE the business trigger and
    // write directly. That is an intentionally recorded release blocker,
    // not a success claim of tamper-proof SQL.
    await dbA.unsafe("ALTER TABLE "+q(schemaA)+
      ".owner_effects DISABLE TRIGGER pa05_xdb_domain_write_gate");
    await write(dbA,schemaA,"admin-bypass");
    assert.equal((await dbA.unsafe("SELECT count(*)::integer AS n FROM "+
      q(schemaA)+".owner_effects WHERE effect_id='admin-bypass'"))[0].n,1);
    await dbA.unsafe("ALTER TABLE "+q(schemaA)+
      ".owner_effects ENABLE TRIGGER pa05_xdb_domain_write_gate");
    await assert.rejects(write(dbA,schemaA,"after-restored"),
      /PA05_XDB_DOMAIN_WRONG_OWNER_LOGIN/);
    assert.equal((await authority.getState(owner)).pendingCount,3);
    console.log("PA05_XDB_DOMAIN_OWNER_PARTITION_PG="+JSON.stringify({
      actualPostgres18:true,physicalClusters:3,
      hostUnticketedBeginWriteDenied:true,
      independentDomainOwnerRequiresDurableTicket:true,
      wrongSqlLoginCannotWriteDomain:true,
      authenticatedOwnerBusinessCommitAccepted:true,
      localFreezeDeniesAlreadyInvokingUncommittedBusinessEffect:true,
      remotePartitionNeverYieldsSafeGlobalFreeze:true,
      isolatedActiveRemoteOldTicketStillDangerous:true,
      localFreezePersistsAfterBackendTermination:true,
      privilegedTableOwnerCanDisableTrigger:true,
      defaultBusinessPluginsFenced:false,
      allNetworkPartitionsFailStopCertified:false,
      productionWriteEnabled:false
    }));
  }finally{
    for(const x of sessions)try{await x.end();}catch{}
    for(const x of [domainA,domainB,remoteA,remoteB,authority])
      if(x)try{await x.close();}catch{}
    for(const [db,schema,roles] of [
      [dbA,schemaA,[roleWorkerA,roleOwnerA,rogue]],
      [dbB,schemaB,[roleWorkerB,roleOwnerB]]
    ]){
      try{await db.unsafe("DROP SCHEMA IF EXISTS "+q(schema)+" CASCADE");}catch{}
      for(const role of roles){
        try{await db.unsafe('DROP OWNED BY "'+role+'"');}catch{}
        try{await db.unsafe('DROP ROLE IF EXISTS "'+role+'"');}catch{}
      }
    }
    try{await center.unsafe("DROP SCHEMA IF EXISTS "+q(centralSchema)+" CASCADE");}catch{}
    await Promise.allSettled([center.end(),dbA.end(),dbB.end()]);
  }
});
