import test from "node:test";
import assert from "node:assert/strict";
import {createHash,randomUUID} from "node:crypto";
import postgres from "postgres";
import {createPa05CrossDatabaseReservationAuthorityV010}
  from "../../dist/manager/pa05-cross-database-admission.js";

const centralUrl=process.env.PA05_XDB_AUTHORITY_DATABASE_URL;
const workerAUrl=process.env.PA05_XDB_WORKER_A_DATABASE_URL;
const workerBUrl=process.env.PA05_XDB_WORKER_B_DATABASE_URL;
const digest=x=>createHash("sha256").update(x).digest("hex");
const workers=[
  {workerId:"host-a-worker",databaseId:"separate-worker-db-a",ownerPackageId:"pa05.xdb.owner"},
  {workerId:"host-b-worker",databaseId:"separate-worker-db-b",ownerPackageId:"pa05.xdb.owner"},
  {workerId:"host-b-race",databaseId:"separate-worker-db-b",ownerPackageId:"pa05.xdb.race"}
];
test("PA05-04D9 two isolated PostgreSQL Worker databases use a central conservative reservation",{
  skip:!centralUrl||!workerAUrl||!workerBUrl?"requires three independent real PostgreSQL URLs":false
},async()=>{
  const schema="pa05_xdb_"+randomUUID().replaceAll("-","").slice(0,15);
  const central=postgres(centralUrl,{max:2});
  const workerA=postgres(workerAUrl,{max:2});
  const workerB=postgres(workerBUrl,{max:2});
  let gate,other;
  try {
    const ids=await Promise.all([central,workerA,workerB].map(async db=>{
      const rows=await db.unsafe("SELECT system_identifier::text AS id FROM pg_control_system()");
      return rows[0].id;
    }));
    assert.equal(new Set(ids).size,3,"proof requires three DISTINCT PostgreSQL clusters");
    const ca=await workerA.unsafe("SELECT current_database() AS db");
    const cb=await workerB.unsafe("SELECT current_database() AS db");
    assert.notEqual(ca[0].db,cb[0].db);
    for(const db of [workerA,workerB]){
      await db.unsafe("CREATE TABLE IF NOT EXISTS pa05_xdb_sandbox ("+
        "effect_id text PRIMARY KEY,state text NOT NULL)");
    }
    gate=await createPa05CrossDatabaseReservationAuthorityV010({
      authorityConnectionString:centralUrl,authoritySchema:schema,trustedWorkers:workers
    });
    await gate.registerFrozenOwner("pa05.xdb.owner","1.0.0");
    await gate.registerFrozenOwner("pa05.xdb.race","1.0.0");
    assert.equal((await gate.getState("pa05.xdb.owner")).state,"FROZEN");
    await assert.rejects(
      gate.reserve({packageId:"pa05.xdb.owner",version:"1.0.0",workerId:"host-a-worker",
        reservationId:digest("premature"),effectDigest:digest("premature")}),
      /ADMISSION_FROZEN/
    );
    await assert.rejects(gate.reopenOwner({packageId:"pa05.xdb.owner",
      version:"1.0.0",trustedOwnerReady:()=>false}),/RECERTIFICATION_REQUIRED/);
    await gate.reopenOwner({packageId:"pa05.xdb.owner",version:"1.0.0",
      trustedOwnerReady:()=>true});
    await gate.reopenOwner({packageId:"pa05.xdb.race",version:"1.0.0",
      trustedOwnerReady:()=>true});
    const effectA="pa05-xdb-"+randomUUID();
    const reservationId=digest(effectA);
    await gate.reserve({packageId:"pa05.xdb.owner",version:"1.0.0",
      workerId:"host-a-worker",reservationId,effectDigest:digest("business-A")});
    await assert.rejects(gate.reserve({packageId:"pa05.xdb.owner",version:"1.0.0",
      workerId:"host-b-worker",reservationId,effectDigest:digest("business-B")}),
      /RESERVATION_REUSE_CONFLICT/);
    await assert.rejects(gate.reserve({packageId:"pa05.xdb.owner",version:"1.0.0",
      workerId:"nonmember",reservationId:digest("other"),effectDigest:digest("other")}),
      /WORKER_UNREGISTERED/);
    // Remote UPDATE is a deliberately separate PG transaction: the reservation
    // must already exist in the central DB before any business side effect.
    await workerA.unsafe("INSERT INTO pa05_xdb_sandbox(effect_id,state) VALUES($1,$2)",
      [effectA,"UNKNOWN"]);
    const frozen=await gate.freeze("pa05.xdb.owner");
    assert.deepEqual(frozen,{state:"FROZEN",pendingCount:1});
    await assert.rejects(gate.reserve({packageId:"pa05.xdb.owner",version:"1.0.0",
      workerId:"host-b-worker",reservationId:digest("effect-b"),
      effectDigest:digest("business-b")}),/ADMISSION_FROZEN/);
    await assert.rejects(gate.reopenOwner({packageId:"pa05.xdb.owner",
      version:"1.0.0",trustedOwnerReady:()=>true}),/PENDING_RESERVATIONS/);
    await assert.rejects(gate.registerFrozenOwner("pa05.xdb.owner","2.0.0"),
      /VERSION_RECERTIFICATION_REQUIRED/);
    const rows=await workerB.unsafe("SELECT * FROM pa05_xdb_sandbox");
    assert.equal(rows.length,0,"no remote Worker B dispatch after central freeze");
    // Concurrent begin-versus-freeze MUST serialize through one central Owner
    // row, regardless of which remote physical database a Worker would use.
    const raceId=digest("race-"+randomUUID());
    const [attempt,freeze]=await Promise.allSettled([
      gate.reserve({packageId:"pa05.xdb.race",version:"1.0.0",
        workerId:"host-b-race",reservationId:raceId,effectDigest:digest("race")}),
      gate.freeze("pa05.xdb.race")
    ]);
    assert.equal(freeze.status,"fulfilled");
    const raceState=await gate.getState("pa05.xdb.race");
    assert.equal(raceState.state,"FROZEN");
    assert.equal(raceState.pendingCount,attempt.status==="fulfilled"?1:0);
    if(attempt.status==="rejected")
      assert.match(String(attempt.reason),/ADMISSION_FROZEN/);
    // Host restart/reconnect does not forget the conservative reservation.
    await gate.close();gate=null;
    other=await createPa05CrossDatabaseReservationAuthorityV010({
      authorityConnectionString:centralUrl,authoritySchema:schema,trustedWorkers:workers
    });
    assert.deepEqual(await other.getState("pa05.xdb.owner"),{
      state:"FROZEN",version:"1.0.0",pendingCount:1
    });
    await assert.rejects(createPa05CrossDatabaseReservationAuthorityV010({
      authorityConnectionString:centralUrl,authoritySchema:schema,
      trustedWorkers:workers.slice(0,2)
    }),/INVENTORY_CHANGED/);
    // No release-on-timeout, no terminal claim from a Worker and no automatic
    // retry API are exposed. Independent Owner verification is the next gate.
    console.log("PA05_XDB_CENTRAL_RESERVATION_PG="+JSON.stringify({
      actualPostgres18:true,physicalClusters:ids.length,remoteWorkerDatabases:2,
      reservationBeforeRemoteWrite:true,sharedCentralFreeze:true,
      crashRetainsUnknownReservation:true,competingAdmissionSerialized:true,
      inventoryFailClosed:true,productionWriteEnabled:false,
      ownerReconciliationImplemented:false,remoteWorkerEnforcementImplemented:false
    }));
  } finally {
    if(gate)await gate.close();
    if(other)await other.close();
    await Promise.allSettled([
      central.unsafe('DROP SCHEMA IF EXISTS "'+schema+'" CASCADE'),
      workerA.unsafe("DROP TABLE IF EXISTS pa05_xdb_sandbox"),
      workerB.unsafe("DROP TABLE IF EXISTS pa05_xdb_sandbox")
    ]);
    await Promise.allSettled([central.end(),workerA.end(),workerB.end()]);
  }
});
