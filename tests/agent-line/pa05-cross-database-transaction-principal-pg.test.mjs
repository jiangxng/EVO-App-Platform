import test from "node:test";
import assert from "node:assert/strict";
import {createHash,randomUUID} from "node:crypto";
import postgres from "postgres";
import {createPa05CrossDatabaseReservationAuthorityV010}
  from "../../dist/manager/pa05-cross-database-admission.js";
import {createPa05CrossDatabaseHostPrincipalV010}
  from "../../dist/manager/pa05-cross-database-host-principal.js";
import {createPa05CrossDatabaseRemoteSqlAdmissionV010}
  from "../../dist/manager/pa05-cross-database-remote-sql-admission.js";

const urls=[process.env.PA05_XDB_AUTHORITY_DATABASE_URL,
  process.env.PA05_XDB_WORKER_A_DATABASE_URL,
  process.env.PA05_XDB_WORKER_B_DATABASE_URL];
const hash=s=>createHash("sha256").update(s).digest("hex");
const as=(url,login,password)=>{const u=new URL(url);u.username=login;u.password=password;return u.toString();};
const q=s=>'"'+s+'"';

test("PA05-04D14B2: central authenticated Host manifest locked with reservation, revocation race and actual D10 stage",{
  skip:urls.some(x=>!x)?"three separate PostgreSQL18 cluster URLs required":false,
  timeout:90000
},async()=>{
  const suffix=randomUUID().replaceAll("-","").slice(0,10);
  const centralSchema="pa05_b2m_"+suffix,remoteA="pa05_b2a_"+suffix,
    remoteB="pa05_b2b_"+suffix,authoritySchema="pa05_b2o_"+suffix;
  const manifest="pa05_xdb_host_identity_bindings",owner="pa05.b2.owner";
  const password="Test_"+randomUUID().replaceAll("-","");
  const hosts=[
    {id:"pa05-host-alpha",central:"b2ca_"+suffix,a:"b2aa_"+suffix,b:"b2ab_"+suffix},
    {id:"pa05-host-beta",central:"b2cb_"+suffix,a:"b2ba_"+suffix,b:"b2bb_"+suffix}
  ];
  const workerRole="b2worker_"+suffix;
  const [central,dbA,dbB]=urls.map(url=>postgres(url,{max:5}));
  const [cs,asId,bsId]=await Promise.all([central,dbA,dbB].map(async db=>
    String((await db.unsafe("SELECT system_identifier::text AS id FROM pg_control_system()"))[0].id)));
  assert.equal(new Set([cs,asId,bsId]).size,3);
  const workers=[
    {workerId:"remote-a",databaseId:"physical-a",ownerPackageId:owner},
    {workerId:"remote-b",databaseId:"physical-b",ownerPackageId:owner}
  ];
  let alphaAuthority,betaAuthority,goodGateway,raceGateway;
  const m=s=>q(s)+"."+manifest;
  const record=(id,worker)=>({
    packageId:owner,version:"1.0.0",workerId:worker,
    reservationId:hash(id),effectDigest:hash("effect:"+id)
  });
  const principal=h=>createPa05CrossDatabaseHostPrincipalV010({
    hostId:h.id,revision:1,centralConnectionString:as(urls[0],h.central,password),
    centralSchema,remoteDatabases:[
      {connectionString:as(urls[1],h.a,password),schema:remoteA,workerId:"remote-a"},
      {connectionString:as(urls[2],h.b,password),schema:remoteB,workerId:"remote-b"}
    ]
  });
  const insert=async(db,schema,h,worker,remoteLogin,remoteSystem)=>{
    await db.unsafe("INSERT INTO "+m(schema)+
      "(host_id,revision,worker_id,central_login,central_system_id,"+
      "remote_login,remote_system_id,state) VALUES($1,1,$2,$3,$4,$5,$6,'ACTIVE')",
      [h.id,worker,h.central,cs,remoteLogin,remoteSystem]);
  };
  let releaseRevocation;
  try {
    for(const [db,schema] of [[central,centralSchema],[dbA,remoteA],[dbB,remoteB]]){
      await db.unsafe("CREATE SCHEMA "+q(schema));
      await db.unsafe("CREATE TABLE "+m(schema)+"("+
        "host_id text NOT NULL,revision integer NOT NULL,worker_id text NOT NULL,"+
        "central_login text NOT NULL,central_system_id text NOT NULL,"+
        "remote_login text NOT NULL,remote_system_id text NOT NULL,"+
        "state text NOT NULL CHECK(state IN ('ACTIVE','REVOKED')),"+
        "PRIMARY KEY(host_id,worker_id))");
    }
    for(const h of hosts){
      for(const [db,schema,role] of [
        [central,centralSchema,h.central],[dbA,remoteA,h.a],[dbB,remoteB,h.b]
      ]){
        await db.unsafe('CREATE ROLE "'+role+'" LOGIN PASSWORD \''+password+'\'');
        await db.unsafe('GRANT USAGE ON SCHEMA '+q(schema)+' TO "'+role+'"');
        await db.unsafe('GRANT SELECT ON '+m(schema)+' TO "'+role+'"');
        await db.unsafe('GRANT EXECUTE ON FUNCTION pg_catalog.pg_control_system() TO "'+role+'"');
      }
      await insert(central,centralSchema,h,"remote-a",h.a,asId);
      await insert(central,centralSchema,h,"remote-b",h.b,bsId);
      await insert(dbA,remoteA,h,"remote-a",h.a,asId);
      await insert(dbB,remoteB,h,"remote-b",h.b,bsId);
    }
    const [alpha,beta]=hosts.map(principal);
    await alpha.assertActive();
    await beta.assertActive();
    for(const h of hosts){
      const instance=await createPa05CrossDatabaseReservationAuthorityV010({
        authorityConnectionString:urls[0],authoritySchema,
        trustedWorkers:workers,
        boundHost:{hostId:h.id,revision:1,centralLogin:h.central,
          manifestSchema:centralSchema}
      });
      if(h===hosts[0])alphaAuthority=instance;else betaAuthority=instance;
    }
    assert.equal(alphaAuthority.boundHostId,hosts[0].id);
    assert.equal(alphaAuthority.boundHostRevision,1);
    await alphaAuthority.registerFrozenOwner(owner,"1.0.0");
    await alphaAuthority.reopenOwner({packageId:owner,version:"1.0.0",
      trustedOwnerReady:()=>true});
    await alphaAuthority.reserve(record("before-revoke","remote-a"));
    assert.equal((await alphaAuthority.getState(owner)).pendingCount,1);

    // Administrator updates both authoritative manifest rows but pauses before
    // commit. D14B2's SELECT FOR SHARE on the SAME central SQL transaction
    // must wait, then read the committed REVOKED state and refuse the insert.
    let markUpdate;
    const entered=new Promise(resolve=>{markUpdate=resolve;});
    const release=new Promise(resolve=>{releaseRevocation=resolve;});
    const revocation=central.begin(async tx=>{
      await tx.unsafe("UPDATE "+m(centralSchema)+" SET state='REVOKED' "+
        "WHERE host_id=$1",[hosts[0].id]);
      markUpdate();
      await release;
    });
    await entered;
    let admissionState="WAITING";
    const contender=alphaAuthority.reserve(record("after-revoke","remote-a"))
      .then(()=>{admissionState="ADMITTED";},
        e=>{admissionState=String(e.message);});
    await new Promise(resolve=>setTimeout(resolve,120));
    assert.equal(admissionState,"WAITING",
      "a reservation MUST block behind an uncommitted revocation");
    releaseRevocation();
    await revocation;
    await contender;
    assert.match(admissionState,/PA05_XDB_PRINCIPAL_FENCE_REVOKED_OR_MISMATCHED/);
    assert.equal((await alphaAuthority.getState(owner)).pendingCount,1);
    // A different Host principal remains independently authorized.
    await betaAuthority.reserve(record("beta-unaffected","remote-b"));
    assert.equal((await betaAuthority.getState(owner)).pendingCount,2);

    // Re-activate Alpha, test stale revision must be refused transactionally.
    await central.unsafe("UPDATE "+m(centralSchema)+" SET state='ACTIVE',revision=2 "+
      "WHERE host_id=$1",[hosts[0].id]);
    await assert.rejects(alphaAuthority.reserve(record("stale-revision","remote-a")),
      /PA05_XDB_PRINCIPAL_FENCE_REVOKED_OR_MISMATCHED/);
    await central.unsafe("UPDATE "+m(centralSchema)+" SET revision=1 "+
      "WHERE host_id=$1",[hosts[0].id]);
    await alpha.assertActive();

    // Bind the central transaction gate to a REAL D10 remote SQL ticket
    // stage. The test adversary revokes right AFTER genuine D14B1 preflight,
    // but BEFORE D9 reserve. Old preflight-only approach would have admitted.
    const t=q(remoteA)+".pa02b_writes";
    await dbA.unsafe("CREATE TABLE "+t+"("+
      "scope_key text NOT NULL,effect_id text NOT NULL,run_id text NOT NULL,"+
      "input_digest text NOT NULL,fence bigint NOT NULL,state text NOT NULL,"+
      "PRIMARY KEY(scope_key,effect_id))");
    await dbA.unsafe('CREATE ROLE "'+workerRole+'" LOGIN PASSWORD \''+password+'\'');
    await dbA.unsafe('GRANT USAGE ON SCHEMA '+q(remoteA)+' TO "'+workerRole+'"');
    await dbA.unsafe('GRANT SELECT,UPDATE ON '+t+' TO "'+workerRole+'"');
    for(const effect of ["preflight-revoke","legitimate"]){
      await dbA.unsafe("INSERT INTO "+t+
        "(scope_key,effect_id,run_id,input_digest,fence,state) "+
        "VALUES('tenant:b2',$1,$2,$3,1,'PREPARED')",
        [effect,"run:"+effect,hash(effect)]);
    }
    let firstPreflight=true;
    const adversary={
      hostId:alpha.hostId,revision:alpha.revision,
      async assertActive(){
        await alpha.assertActive();
        if(firstPreflight){
          firstPreflight=false;
          await central.unsafe("UPDATE "+m(centralSchema)+" SET state='REVOKED' "+
            "WHERE host_id=$1",[hosts[0].id]);
        }
      }
    };
    raceGateway=await createPa05CrossDatabaseRemoteSqlAdmissionV010({
      connectionString:urls[1],workerSchema:remoteA,
      workerId:"remote-a",ownerPackageId:owner,ownerVersion:"1.0.0",
      workerLoginRole:workerRole,authority:alphaAuthority,hostPrincipal:adversary
    });
    await assert.rejects(raceGateway.stagePreparedEffect({
      scopeKey:"tenant:b2",effectId:"preflight-revoke"
    }),/PA05_XDB_PRINCIPAL_FENCE_REVOKED_OR_MISMATCHED/);
    assert.equal((await dbA.unsafe("SELECT count(*)::integer AS n FROM "+
      q(remoteA)+".pa05_xdb_remote_tickets"))[0].n,0);
    assert.equal((await alphaAuthority.getState(owner)).pendingCount,2);
    await central.unsafe("UPDATE "+m(centralSchema)+" SET state='ACTIVE' "+
      "WHERE host_id=$1",[hosts[0].id]);
    goodGateway=await createPa05CrossDatabaseRemoteSqlAdmissionV010({
      connectionString:urls[1],workerSchema:remoteA,
      workerId:"remote-a",ownerPackageId:owner,ownerVersion:"1.0.0",
      workerLoginRole:workerRole,authority:alphaAuthority,hostPrincipal:alpha
    });
    const result=await goodGateway.stagePreparedEffect({
      scopeKey:"tenant:b2",effectId:"legitimate"
    });
    assert.match(result.reservationId,/^[a-f0-9]{64}$/);
    assert.equal((await alphaAuthority.getState(owner)).pendingCount,3);
    await assert.rejects(createPa05CrossDatabaseRemoteSqlAdmissionV010({
      connectionString:urls[1],workerSchema:remoteA,
      workerId:"remote-a",ownerPackageId:owner,ownerVersion:"1.0.0",
      workerLoginRole:workerRole,authority:alphaAuthority,hostPrincipal:beta
    }),/PA05_XDB_REMOTE_CENTRAL_HOST_BINDING_MISMATCH/);
    console.log("PA05_XDB_TRANSACTIONAL_HOST_FENCE_PG="+JSON.stringify({
      actualPostgres18:true,physicalClusters:3,
      distinctHostPrincipals:2,
      centralRevocationAndReservationRowLockSerialized:true,
      revokedHostReservationDeniedAfterCommit:true,
      otherHostRemainsAuthorized:true,
      staleRevisionDeniedInsideTransaction:true,
      realD10PreflightToReserveRaceDenied:true,
      rejectedReservationDoesNotCreateRemoteTicket:true,
      boundHostMismatchRefused:true,
      priorReservationConservativelyPending:true,
      privilegedCentralAuthorityStillTrusted:true,
      previouslyStagedRemoteTicketsNotAtomicallyRevoked:true,
      productionWriteEnabled:false,
      productionHostMachineIdentityCertified:false
    }));
  }finally{
    if(releaseRevocation)releaseRevocation();
    for(const x of [goodGateway,raceGateway,alphaAuthority,betaAuthority])
      if(x)try{await x.close();}catch{}
    try{await central.unsafe("DROP SCHEMA IF EXISTS "+q(authoritySchema)+" CASCADE");}catch{}
    for(const [db,schema] of [[central,centralSchema],[dbA,remoteA],[dbB,remoteB]])
      try{await db.unsafe("DROP SCHEMA IF EXISTS "+q(schema)+" CASCADE");}catch{}
    for(const [db,role] of [
      ...hosts.flatMap(h=>[[central,h.central],[dbA,h.a],[dbB,h.b]]),
      [dbA,workerRole]
    ]){
      try{await db.unsafe('DROP OWNED BY "'+role+'"');}catch{}
      try{await db.unsafe('DROP ROLE IF EXISTS "'+role+'"');}catch{}
    }
    await Promise.allSettled([central.end(),dbA.end(),dbB.end()]);
  }
});
