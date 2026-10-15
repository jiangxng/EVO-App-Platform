import test from "node:test";
import assert from "node:assert/strict";
import {createHash,randomUUID} from "node:crypto";
import postgres from "postgres";
import {createPa05CrossDatabaseHostPrincipalV010}
  from "../../dist/manager/pa05-cross-database-host-principal.js";
import {createPa05CrossDatabaseReservationAuthorityV010}
  from "../../dist/manager/pa05-cross-database-admission.js";
import {createPa05CrossDatabaseRemoteSqlAdmissionV010}
  from "../../dist/manager/pa05-cross-database-remote-sql-admission.js";

const cUrl=process.env.PA05_XDB_AUTHORITY_DATABASE_URL;
const aUrl=process.env.PA05_XDB_WORKER_A_DATABASE_URL;
const bUrl=process.env.PA05_XDB_WORKER_B_DATABASE_URL;
const digest=x=>createHash("sha256").update(x).digest("hex");
const uri=(url,role,pwd)=>{
  const u=new URL(url);u.username=role;u.password=pwd;return u.toString();
};

test("PA05-04D14B1 actual 3 PG18: two credential-distinct Hosts, cross-DB identity manifests, revoke/rotation preflight and real D10 gating",{
  skip:!cUrl||!aUrl||!bUrl?"three physically independent PG18 URLs required":false,
  timeout:90000
},async()=>{
  const suffix=randomUUID().replaceAll("-","").slice(0,10);
  const centralSchema="pa05_d14bc_"+suffix;
  const remoteA="pa05_d14ba_"+suffix,remoteB="pa05_d14bb_"+suffix;
  const ownerSchema="pa05_d14bo_"+suffix;
  const owner="pa05.d14b.owner";
  const pass="Test_"+randomUUID().replaceAll("-","");
  const rotated="Rotated_"+randomUUID().replaceAll("-","");
  const profiles=[
    {id:"pa05-host-alpha",centralRole:"pa05ca_"+suffix,
      remoteA:"pa05aa_"+suffix,remoteB:"pa05ab_"+suffix},
    {id:"pa05-host-beta",centralRole:"pa05cb_"+suffix,
      remoteA:"pa05ba_"+suffix,remoteB:"pa05bb_"+suffix}
  ];
  const workerRole="pa05ww_"+suffix;
  const central=postgres(cUrl,{max:3});
  const a=postgres(aUrl,{max:3}),b=postgres(bUrl,{max:3});
  let authority,remoteGateway;
  const q=x=>'"'+x+'"';
  const name="pa05_xdb_host_identity_bindings";
  const t=s=>q(s)+"."+name;
  const systems=await Promise.all([central,a,b].map(async db=>
    String((await db.unsafe("SELECT system_identifier::text AS id FROM pg_control_system()"))[0].id)));
  assert.equal(new Set(systems).size,3);
  const [cs,as,bs]=systems;
  const identity=p=>createPa05CrossDatabaseHostPrincipalV010({
    hostId:p.id,revision:1,centralConnectionString:uri(cUrl,p.centralRole,pass),
    centralSchema,remoteDatabases:[
      {connectionString:uri(aUrl,p.remoteA,pass),schema:remoteA,workerId:"remote-a"},
      {connectionString:uri(bUrl,p.remoteB,pass),schema:remoteB,workerId:"remote-b"}
    ]
  });
  async function insert(db,table,host,worker,remoteLogin,remoteSystem){
    await db.unsafe("INSERT INTO "+table+
      "(host_id,revision,worker_id,central_login,central_system_id,"+
      "remote_login,remote_system_id,state) VALUES($1,1,$2,$3,$4,$5,$6,'ACTIVE')",
      [host.id,worker,host.centralRole,cs,remoteLogin,remoteSystem]);
  }
  try{
    // These manifests are provisioned solely with trusted administrative SQL,
    // not by the Host or any LLM action. Production credential provisioning
    // remains independently unsigned.
    for(const [db,schema] of [[central,centralSchema],[a,remoteA],[b,remoteB]]){
      await db.unsafe("CREATE SCHEMA "+q(schema));
      await db.unsafe("CREATE TABLE "+t(schema)+"("+
        "host_id text NOT NULL,revision integer NOT NULL,worker_id text NOT NULL,"+
        "central_login text NOT NULL,central_system_id text NOT NULL,"+
        "remote_login text NOT NULL,remote_system_id text NOT NULL,"+
        "state text NOT NULL CHECK(state IN ('ACTIVE','REVOKED')),"+
        "PRIMARY KEY(host_id,worker_id))");
    }
    for(const p of profiles) {
      for(const [db,role,schema] of [
        [central,p.centralRole,centralSchema],[a,p.remoteA,remoteA],[b,p.remoteB,remoteB]
      ]){
        await db.unsafe('CREATE ROLE "'+role+'" LOGIN PASSWORD \''+pass+'\'');
        await db.unsafe('GRANT USAGE ON SCHEMA '+q(schema)+' TO "'+role+'"');
        await db.unsafe('GRANT SELECT ON '+t(schema)+' TO "'+role+'"');
        await db.unsafe('GRANT EXECUTE ON FUNCTION pg_catalog.pg_control_system() TO "'+role+'"');
      }
      await insert(central,t(centralSchema),p,"remote-a",p.remoteA,as);
      await insert(central,t(centralSchema),p,"remote-b",p.remoteB,bs);
      await insert(a,t(remoteA),p,"remote-a",p.remoteA,as);
      await insert(b,t(remoteB),p,"remote-b",p.remoteB,bs);
    }
    const [alpha,beta]=profiles.map(identity);
    await alpha.assertActive();
    await beta.assertActive();
    assert.equal(alpha.hostId,"pa05-host-alpha");
    assert.equal(beta.hostId,"pa05-host-beta");

    // Alpha's central LOGIN cannot borrow Beta's remote SQL credential,
    // even though both are legitimate Host roles and point at the same DB.
    const borrowed=createPa05CrossDatabaseHostPrincipalV010({
      hostId:profiles[0].id,revision:1,
      centralConnectionString:uri(cUrl,profiles[0].centralRole,pass),
      centralSchema,remoteDatabases:[
        {connectionString:uri(aUrl,profiles[0].remoteA,pass),
          schema:remoteA,workerId:"remote-a"},
        {connectionString:uri(bUrl,profiles[1].remoteB,pass),
          schema:remoteB,workerId:"remote-b"}
      ]
    });
    await assert.rejects(borrowed.assertActive(),
      /PA05_XDB_HOST_IDENTITY_REMOTE_UNVERIFIED/);
    await beta.assertActive();

    // A physical-DB identifier mismatch is rejected, even when the SQL
    // principal and Host ID strings otherwise match.
    await a.unsafe("UPDATE "+t(remoteA)+
      " SET remote_system_id=$1 WHERE host_id=$2 AND worker_id='remote-a'",
      [cs,profiles[0].id]);
    await assert.rejects(alpha.assertActive(),
      /PA05_XDB_HOST_IDENTITY_REMOTE_UNVERIFIED/);
    await a.unsafe("UPDATE "+t(remoteA)+
      " SET remote_system_id=$1 WHERE host_id=$2 AND worker_id='remote-a'",
      [as,profiles[0].id]);
    await alpha.assertActive();

    // Bind that attestation to the ACTUAL D10 ticket-staging path, not only
    // an isolated helper. No new ticket while central Host is REVOKED.
    const rq=q(remoteA);
    await a.unsafe("CREATE TABLE "+rq+".pa02b_writes("+
      "scope_key text NOT NULL,effect_id text NOT NULL,run_id text NOT NULL,"+
      "input_digest text NOT NULL,fence bigint NOT NULL,state text NOT NULL,"+
      "PRIMARY KEY(scope_key,effect_id))");
    await a.unsafe('CREATE ROLE "'+workerRole+'" LOGIN PASSWORD \''+pass+'\'');
    await a.unsafe('GRANT USAGE ON SCHEMA '+rq+' TO "'+workerRole+'"');
    await a.unsafe('GRANT SELECT,UPDATE ON '+rq+
      '.pa02b_writes TO "'+workerRole+'"');
    authority=await createPa05CrossDatabaseReservationAuthorityV010({
      authorityConnectionString:cUrl,authoritySchema:ownerSchema,
      trustedWorkers:[{workerId:"remote-a",databaseId:"worker-a",ownerPackageId:owner}]
    });
    await authority.registerFrozenOwner(owner,"1.0.0");
    await authority.reopenOwner({
      packageId:owner,version:"1.0.0",trustedOwnerReady:()=>true
    });
    remoteGateway=await createPa05CrossDatabaseRemoteSqlAdmissionV010({
      connectionString:aUrl,workerSchema:remoteA,workerId:"remote-a",
      ownerPackageId:owner,ownerVersion:"1.0.0",
      workerLoginRole:workerRole,authority,hostPrincipal:alpha
    });
    for(const effect of ["first","revoked","unreachable","rotated"]){
      await a.unsafe("INSERT INTO "+rq+
        ".pa02b_writes(scope_key,effect_id,run_id,input_digest,fence,state) "+
        "VALUES('tenant:d14b',$1,$2,$3,1,'PREPARED')",
        [effect,"run:"+effect,digest("d14b:"+effect)]);
    }
    await remoteGateway.stagePreparedEffect({
      scopeKey:"tenant:d14b",effectId:"first"
    });
    assert.equal((await authority.getState(owner)).pendingCount,1);

    await central.unsafe("UPDATE "+t(centralSchema)+" SET state='REVOKED' "+
      "WHERE host_id=$1",[profiles[0].id]);
    await assert.rejects(remoteGateway.stagePreparedEffect({
      scopeKey:"tenant:d14b",effectId:"revoked"
    }),/PA05_XDB_HOST_IDENTITY_CENTRAL_BINDING_MISMATCH/);
    assert.equal((await authority.getState(owner)).pendingCount,1);
    await beta.assertActive();
    await central.unsafe("UPDATE "+t(centralSchema)+" SET state='ACTIVE' "+
      "WHERE host_id=$1",[profiles[0].id]);

    // Central DB unavailable => fresh attestation does not mint a ticket.
    const unreachable=createPa05CrossDatabaseHostPrincipalV010({
      hostId:profiles[0].id,revision:1,
      centralConnectionString:"postgres://invalid:invalid@127.0.0.1:1/missing",
      centralSchema,remoteDatabases:[
        {connectionString:uri(aUrl,profiles[0].remoteA,pass),
          schema:remoteA,workerId:"remote-a"},
        {connectionString:uri(bUrl,profiles[0].remoteB,pass),
          schema:remoteB,workerId:"remote-b"}
      ]
    });
    await assert.rejects(unreachable.assertActive(),
      /PA05_XDB_HOST_IDENTITY_CENTRAL_UNVERIFIED/);
    const bRevoked=await createPa05CrossDatabaseHostPrincipalV010({
      hostId:profiles[0].id,revision:1,
      centralConnectionString:uri(cUrl,profiles[0].centralRole,pass),
      centralSchema,remoteDatabases:[
        {connectionString:uri(aUrl,profiles[0].remoteA,pass),
          schema:remoteA,workerId:"remote-a"},
        {connectionString:"postgres://invalid:invalid@127.0.0.1:1/missing",
          schema:remoteB,workerId:"remote-b"}
      ]
    });
    await assert.rejects(bRevoked.assertActive(),
      /PA05_XDB_HOST_IDENTITY_REMOTE_UNVERIFIED/);
    assert.equal((await authority.getState(owner)).pendingCount,1);

    // PASSWORD rotation is checked using *fresh* physical sessions, not a
    // surviving pooled connection. Beta is unaffected by Alpha's rotation.
    await a.unsafe('ALTER ROLE "'+profiles[0].remoteA+
      '" PASSWORD \''+rotated+'\'');
    await assert.rejects(remoteGateway.stagePreparedEffect({
      scopeKey:"tenant:d14b",effectId:"rotated"
    }),/PA05_XDB_HOST_IDENTITY_REMOTE_UNVERIFIED/);
    await beta.assertActive();
    assert.equal((await authority.getState(owner)).pendingCount,1);

    // Previously minted ticket survives revocation: this proof does NOT
    // assert atomic central+remote token revocation or partition fail-stop.
    assert.equal((await a.unsafe("SELECT count(*)::integer AS n FROM "+
      rq+".pa05_xdb_remote_tickets"))[0].n,1);
    console.log("PA05_XDB_HOST_PRINCIPAL_BINDING_PG="+JSON.stringify({
      physicalClusters:3,distinctAuthenticatedHostPrincipals:2,
      centralAndBothRemoteLoginsReauthenticated:true,
      crossPhysicalDatabaseSystemIdentifiersPinned:true,
      wrongHostRemoteCredentialRejected:true,
      manifestMismatchFailClosed:true,
      centralManifestRevocationDeniesNextRealTicket:true,
      centralUnavailableDeniesAttestation:true,
      remoteUnavailableDeniesAttestation:true,
      rotatedPasswordDeniesNextRealTicket:true,
      otherHostRemainsAuthorized:true,
      previousTicketStillPendingAfterRevocation:true,
      productionWriteEnabled:false,
      atomicCrossDatabaseRevocationCertified:false,
      productionCredentialProvisioningCertified:false,
      privilegedHostBypassResolved:false
    }));
  }finally{
    if(remoteGateway)try{await remoteGateway.close();}catch{}
    if(authority)try{await authority.close();}catch{}
    try{await central.unsafe("DROP SCHEMA IF EXISTS "+q(ownerSchema)+" CASCADE");}catch{}
    for(const [db,schema] of [[central,centralSchema],[a,remoteA],[b,remoteB]])
      try{await db.unsafe("DROP SCHEMA IF EXISTS "+q(schema)+" CASCADE");}catch{}
    for(const [db,role] of [
      ...profiles.flatMap(p=>[[central,p.centralRole],[a,p.remoteA],[b,p.remoteB]]),
      [a,workerRole]
    ]){
      try{await db.unsafe('DROP OWNED BY "'+role+'"');}catch{}
      try{await db.unsafe('DROP ROLE IF EXISTS "'+role+'"');}catch{}
    }
    await Promise.allSettled([central.end(),a.end(),b.end()]);
  }
});
