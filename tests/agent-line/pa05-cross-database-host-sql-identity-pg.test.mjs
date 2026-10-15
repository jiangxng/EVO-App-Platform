import test from "node:test";
import assert from "node:assert/strict";
import {createHash,randomUUID} from "node:crypto";
import postgres from "postgres";
import {createPa05CrossDatabaseReservationAuthorityV010}
  from "../../dist/manager/pa05-cross-database-admission.js";

const c=process.env.PA05_XDB_AUTHORITY_DATABASE_URL;
const a=process.env.PA05_XDB_WORKER_A_DATABASE_URL;
const b=process.env.PA05_XDB_WORKER_B_DATABASE_URL;
const sha=x=>createHash("sha256").update(x).digest("hex");
const as=(url,user,password)=>{
  const u=new URL(url);u.username=user;u.password=password;return u.toString();
};

test("PA05-04D13 three physical PG18: real central Host LOGIN, Worker ACL drift, SQL audit immutability and two-Host race",{
  skip:!c||!a||!b?"isolated 3-cluster PostgreSQL18 URLs required":false,
  timeout:90000
},async()=>{
  const suffix=randomUUID().replaceAll("-","").slice(0,12);
  const schema="pa05_d13_"+suffix,hostRole="pa05host_"+suffix;
  const roleA="pa05wa_"+suffix,roleB="pa05wb_"+suffix;
  const owner="pa05.d13.owner",otherOwner="pa05.d13.other";
  const pass="Test_"+randomUUID().replaceAll("-","");
  const q='"'+schema+'"';
  const admin=postgres(c,{max:3});
  const remoteA=postgres(a,{max:1}),remoteB=postgres(b,{max:1});
  const sessions=[];
  let host1,host2;
  const workers=[
    {workerId:"d13-worker-a",databaseId:"remote-worker-a",ownerPackageId:owner},
    {workerId:"d13-worker-b",databaseId:"remote-worker-b",ownerPackageId:owner},
    {workerId:"d13-other",databaseId:"remote-worker-b",ownerPackageId:otherOwner}
  ];
  const reserve=(reservationId)=>({
    packageId:owner,version:"1.0.0",workerId:"d13-worker-a",
    reservationId:sha(reservationId),effectDigest:sha("effect:"+reservationId)
  });
  const proof=()=>({outcome:"SUCCEEDED",receiptId:"owner:verified:d13",
    evidenceDigest:sha("independent-domain-owner-proof")});
  try{
    const systems=await Promise.all([admin,remoteA,remoteB].map(async db=>
      String((await db.unsafe("SELECT system_identifier::text AS id FROM pg_control_system()"))[0].id)));
    assert.equal(new Set(systems).size,3,"not just three Schemas in one DB");
    for(const role of [hostRole,roleA,roleB])
      await admin.unsafe('CREATE ROLE "'+role+'" LOGIN PASSWORD \''+pass+'\'');
    const dbname=String((await admin.unsafe("SELECT current_database() AS name"))[0].name);
    await admin.unsafe('GRANT CREATE ON DATABASE "'+dbname+'" TO "'+hostRole+'"');
    for(const [url,role] of [[c,hostRole],[c,hostRole],[c,roleA],[c,roleB]]){
      const cli=postgres(as(url,role,pass),{max:2});
      sessions.push(cli);
    }
    const setup={
      authorityConnectionString:as(c,hostRole,pass),authoritySchema:schema,
      trustedWorkers:workers,enforceCentralSqlIdentity:true,
      centralHostLoginRole:hostRole,
      centralWorkerLoginRoles:[roleA,roleB]
    };
    await assert.rejects(createPa05CrossDatabaseReservationAuthorityV010({
      ...setup,centralHostLoginRole:"pa05fake_"+suffix
    }),/PA05_XDB_CENTRAL_HOST_LOGIN_MISMATCH/);
    host1=await createPa05CrossDatabaseReservationAuthorityV010(setup);
    host2=await createPa05CrossDatabaseReservationAuthorityV010(setup);
    await host1.registerFrozenOwner(owner,"1.0.0");
    await host2.registerFrozenOwner(owner,"1.0.0");
    await host1.registerFrozenOwner(otherOwner,"1.0.0");
    assert.equal((await host2.getState(owner)).state,"FROZEN");
    // The two remote physical databases need not and cannot magically share
    // auth roles. These login identities are separately represented in the
    // CENTRAL database; this is NOT cross-DB identity attestation.
    await assert.rejects(sessions[2].unsafe("UPDATE "+q+
      ".pa05_xdb_owners SET state='ACTIVE'"),/permission denied/);
    await assert.rejects(sessions[3].unsafe("DELETE FROM "+q+
      ".pa05_xdb_reservations"),/permission denied/);

    await host1.reopenOwner({packageId:owner,version:"1.0.0",trustedOwnerReady:()=>true});
    // Two independent Host connections sharing one central Owner lock:
    // the order between freeze and admission may vary, but *either*
    // the admitted effect is counted by freeze OR no new effect is admitted.
    const raceRecord=reserve("race");
    const [tryReserve,doFreeze]=await Promise.allSettled([
      host1.reserve(raceRecord),host2.freeze(owner)
    ]);
    assert.equal(doFreeze.status,"fulfilled");
    assert.equal((await host1.getState(owner)).state,"FROZEN");
    const count=(await host1.getState(owner)).pendingCount;
    assert.equal(count,tryReserve.status==="fulfilled"?1:0);
    if(tryReserve.status==="rejected")
      assert.match(String(tryReserve.reason),/ADMISSION_FROZEN/);
    // Worker/Owner identity misbinding is never a permitted central grant.
    await assert.rejects(host1.reserve({...raceRecord,
      workerId:"d13-other",reservationId:sha("wrong-member")}),
      /ADMISSION_FROZEN/);
    if(count===1) {
      const attempt={...raceRecord,verifyOwnerTerminal:async()=>proof()};
      const outcomes=await Promise.all([
        host1.settleVerified(attempt),host2.settleVerified(attempt)]);
      assert.deepEqual(outcomes.map(x=>x.state).sort(),
        ["ALREADY_SETTLED","SETTLED"]);
      assert.equal((await host1.getState(owner)).pendingCount,0);
    }

    // Schema/table ownership is Host-only, but test actual GRANT drift and
    // SQL triggers: even accidentally GRANTed Worker UPDATE must NOT forge
    // a central terminal or open a gate.
    await admin.unsafe('GRANT USAGE ON SCHEMA '+q+' TO "'+roleA+'"');
    await admin.unsafe('GRANT UPDATE ON '+q+'.pa05_xdb_reservations TO "'+roleA+'"');
    await assert.rejects(host1.freeze(owner),
      /PA05_XDB_CENTRAL_WORKER_SQL_PRIVILEGE_DRIFT/);
    await assert.rejects(sessions[2].unsafe("UPDATE "+q+
      ".pa05_xdb_reservations SET state='SETTLED'"),
      /PA05_XDB_CENTRAL_WRONG_HOST_LOGIN/);
    await admin.unsafe('REVOKE UPDATE ON '+q+'.pa05_xdb_reservations FROM "'+roleA+'"');
    await host2.freeze(owner);
    await admin.unsafe('GRANT UPDATE ON '+q+'.pa05_xdb_owners TO "'+roleB+'"');
    await admin.unsafe('GRANT USAGE ON SCHEMA '+q+' TO "'+roleB+'"');
    await assert.rejects(sessions[3].unsafe("UPDATE "+q+
      ".pa05_xdb_owners SET state='ACTIVE'"),
      /PA05_XDB_CENTRAL_WRONG_HOST_LOGIN/);
    await assert.rejects(host2.getState(owner),
      /PA05_XDB_CENTRAL_WORKER_SQL_PRIVILEGE_DRIFT/);
    await admin.unsafe('REVOKE UPDATE ON '+q+'.pa05_xdb_owners FROM "'+roleB+'"');
    assert.equal((await host2.getState(owner)).state,"FROZEN");

    // A SQL superuser SET ROLE session does NOT become an authenticated
    // Host LOGIN. Only SESSION_USER is authoritative inside the trigger.
    await admin.begin(async tx=>{
      await tx.unsafe('SET LOCAL ROLE "'+hostRole+'"');
      await assert.rejects(tx.unsafe("INSERT INTO "+q+
        ".pa05_xdb_owners(owner_package_id,package_version,state) "+
        "VALUES('forged','1.0.0','ACTIVE')"),
        /PA05_XDB_CENTRAL_WRONG_HOST_LOGIN/);
    });

    // Fresh D13 row -> independent Host fence -> conservative settlement,
    // then even HOST table owner cannot edit settled audit using plain SQL.
    await host1.reopenOwner({packageId:owner,version:"1.0.0",trustedOwnerReady:()=>true});
    const value=reserve("immutable");
    await host1.reserve(value);
    assert.deepEqual(await host2.freeze(owner),{state:"FROZEN",pendingCount:1});
    const settlement={...value,verifyOwnerTerminal:async()=>proof()};
    const resolved=await Promise.all([
      host1.settleVerified(settlement),host2.settleVerified(settlement)
    ]);
    assert.deepEqual(resolved.map(x=>x.state).sort(),["ALREADY_SETTLED","SETTLED"]);
    await assert.rejects(sessions[0].unsafe("UPDATE "+q+
      ".pa05_xdb_reservations SET state='PENDING' WHERE reservation_id=$1",
      [value.reservationId]),/PA05_XDB_CENTRAL_SETTLED_IMMUTABLE/);
    await assert.rejects(sessions[0].unsafe("DELETE FROM "+q+
      ".pa05_xdb_reservations WHERE reservation_id=$1",
      [value.reservationId]),/PA05_XDB_CENTRAL_AUDIT_DELETE_DENIED/);
    await assert.rejects(sessions[0].unsafe("TRUNCATE "+q+
      ".pa05_xdb_reservations"),/PA05_XDB_CENTRAL_AUDIT_TRUNCATE_DENIED/);
    assert.equal((await host2.getState(owner)).pendingCount,0);
    await host2.reopenOwner({packageId:owner,version:"1.0.0",
      trustedOwnerReady:()=>true});
    await assert.rejects(host1.reserve(value),
      /PA05_XDB_SETTLED_RESERVATION_CANNOT_REOPEN/);
    const audit=await sessions[0].unsafe("SELECT state,terminal_receipt_id,"+
      "terminal_evidence_digest FROM "+q+
      ".pa05_xdb_reservations WHERE reservation_id=$1",[value.reservationId]);
    assert.equal(audit.length,1);
    assert.equal(audit[0].state,"SETTLED");
    assert.equal(audit[0].terminal_receipt_id,proof().receiptId);
    assert.equal(audit[0].terminal_evidence_digest,proof().evidenceDigest);
    console.log("PA05_XDB_CENTRAL_SQL_HOST_IDENTITY_PG="+JSON.stringify({
      postgres18:true,physicalClusters:3,
      twoSeparateHostSqlConnections:true,
      realNonSuperuserHostLogin:true,
      workerCredentialSqlDeny:true,
      centralWorkerRoleDriftFailClosed:true,
      setRoleCannotForgeSessionUser:true,
      centralFreezeReservationSerialized:true,
      parallelSettlementExactlyOneNewTransition:true,
      settledAuditSqlUpdateDeleteTruncateDenied:true,
      settledReservationCannotReopen:true,
      productionWriteEnabled:false,
      crossPhysicalDbIdentityAttested:false,
      productionHostPrivilegeCertified:false,
      partitionFailStopCertified:false
    }));
  }finally{
    for(const h of [host1,host2])if(h)try{await h.close();}catch{}
    for(const x of sessions)try{await x.end();}catch{}
    try{await admin.unsafe("DROP SCHEMA IF EXISTS "+'"'+schema+'"'+" CASCADE");}catch{}
    for(const role of [hostRole,roleA,roleB]){
      try{await admin.unsafe('DROP OWNED BY "'+role+'"');}catch{}
      try{await admin.unsafe('DROP ROLE IF EXISTS "'+role+'"');}catch{}
    }
    await Promise.allSettled([admin.end(),remoteA.end(),remoteB.end()]);
  }
});
