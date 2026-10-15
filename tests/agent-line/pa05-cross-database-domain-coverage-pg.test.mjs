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
import {createPa05DomainOwnerCoverageV010}
  from "../../dist/manager/pa05-cross-database-domain-coverage.js";

const urls=[
  process.env.PA05_XDB_AUTHORITY_DATABASE_URL,
  process.env.PA05_XDB_WORKER_A_DATABASE_URL,
  process.env.PA05_XDB_WORKER_B_DATABASE_URL
];
const sha=v=>createHash("sha256").update(v).digest("hex");
const quote=v=>'"'+v+'"';
const passwordUrl=(u,role,pwd)=>{
  const x=new URL(u);x.username=role;x.password=pwd;return x.toString();
};

test("PA05-04D14C2 actual 3-PG18 Owner domain table coverage, privilege drift, disabled trigger and post-reservation fail-closed",{
  skip:urls.some(x=>!x)?"requires physically distinct PostgreSQL18 instances":false,
  timeout:120000
},async()=>{
  const suffix=randomUUID().replaceAll("-","").slice(0,10);
  const [central,a,b]=urls.map(x=>postgres(x,{max:4}));
  const [schemaA,schemaB,centerSchema]=[
    "pa05_c2a_"+suffix,"pa05_c2b_"+suffix,"pa05_c2c_"+suffix
  ];
  const [workerA,workerB,ownerA,ownerA2,ownerB,delegated]=[
    "pa05c2wa_"+suffix,"pa05c2wb_"+suffix,
    "pa05c2oa_"+suffix,"pa05c2ox_"+suffix,
    "pa05c2ob_"+suffix,"pa05c2dg_"+suffix
  ];
  const owner="pa05.c2.owner",password="Test_"+randomUUID().replaceAll("-","");
  const qA=quote(schemaA),qB=quote(schemaB);
  const ownerTablesA=[
    {domainTable:"sales_effects",domainOwnerLoginRole:ownerA},
    {domainTable:"purchase_effects",domainOwnerLoginRole:ownerA2}
  ];
  const ownerTablesB=[{domainTable:"warehouse_effects",domainOwnerLoginRole:ownerB}];
  const fences=[],audits=[],sqlUsers=[];
  let authority,gatewayA,gatewayB;
  async function schemaTables(db,schema,worker,owners){
    const q=quote(schema);
    await db.unsafe("CREATE SCHEMA "+q);
    await db.unsafe("CREATE TABLE "+q+".pa02b_writes("+
      "scope_key text NOT NULL,effect_id text NOT NULL,run_id text NOT NULL,"+
      "input_digest text NOT NULL,fence bigint NOT NULL,state text NOT NULL,"+
      "PRIMARY KEY(scope_key,effect_id))");
    await db.unsafe('CREATE ROLE "'+worker+'" LOGIN PASSWORD \''+password+'\'');
    await db.unsafe('GRANT USAGE ON SCHEMA '+q+' TO "'+worker+'"');
    await db.unsafe('GRANT SELECT,UPDATE ON '+q+'.pa02b_writes TO "'+worker+'"');
    for(const o of owners){
      await db.unsafe("CREATE TABLE "+q+"."+quote(o.domainTable)+"("+
        "scope_key text NOT NULL,effect_id text NOT NULL,run_id text NOT NULL,"+
        "input_digest text NOT NULL,fence bigint NOT NULL,"+
        "payload text NOT NULL,PRIMARY KEY(scope_key,effect_id))");
      await db.unsafe('CREATE ROLE "'+o.domainOwnerLoginRole+
        '" LOGIN PASSWORD \''+password+'\'');
      await db.unsafe('GRANT USAGE ON SCHEMA '+q+' TO "'+
        o.domainOwnerLoginRole+'"');
      await db.unsafe('GRANT INSERT ON '+q+"."+quote(o.domainTable)+
        ' TO "'+o.domainOwnerLoginRole+'"');
      sqlUsers.push(postgres(passwordUrl(db===a?urls[1]:urls[2],
        o.domainOwnerLoginRole,password),{max:1}));
    }
  }
  async function seed(db,schema,effect){
    await db.unsafe("INSERT INTO "+quote(schema)+
      ".pa02b_writes(scope_key,effect_id,run_id,input_digest,fence,state) "+
      "VALUES('enterprise:c2',$1,$2,$3,1,'PREPARED')",
      [effect,"run:"+effect,sha(effect)]);
  }
  try{
    const systems=await Promise.all([central,a,b].map(async db=>
      String((await db.unsafe("SELECT system_identifier::text AS id "+
        "FROM pg_control_system()"))[0].id)));
    assert.equal(new Set(systems).size,3);
    await schemaTables(a,schemaA,workerA,ownerTablesA);
    await schemaTables(b,schemaB,workerB,ownerTablesB);
    authority=await createPa05CrossDatabaseReservationAuthorityV010({
      authorityConnectionString:urls[0],authoritySchema:centerSchema,
      trustedWorkers:[
        {workerId:"c2-worker-a",databaseId:"db-a",ownerPackageId:owner},
        {workerId:"c2-worker-b",databaseId:"db-b",ownerPackageId:owner}
      ]
    });
    await authority.registerFrozenOwner(owner,"1.0.0");
    await authority.reopenOwner({packageId:owner,version:"1.0.0",
      trustedOwnerReady:()=>true});
    const info=(url,schema,workerId,workerRole)=>({
      connectionString:url,workerSchema:schema,workerId,
      workerLoginRole:workerRole,ownerPackageId:owner,
      ownerVersion:"1.0.0",authority
    });
    const aConfig=info(urls[1],schemaA,"c2-worker-a",workerA);
    const bConfig=info(urls[2],schemaB,"c2-worker-b",workerB);
    // Install the remote D10 coordinator and the individual domain gates.
    const bootstrapA=await createPa05CrossDatabaseRemoteSqlAdmissionV010(aConfig);
    const bootstrapB=await createPa05CrossDatabaseRemoteSqlAdmissionV010(bConfig);
    try{
      for(const c of ownerTablesA)
        fences.push(await installPa05DomainOwnerSqlFenceV010({
          connectionString:urls[1],workerSchema:schemaA,...c
        }));
      for(const c of ownerTablesB)
        fences.push(await installPa05DomainOwnerSqlFenceV010({
          connectionString:urls[2],workerSchema:schemaB,...c
        }));
    }finally{
      await Promise.all([bootstrapA.close(),bootstrapB.close()]);
    }
    // A missing registered table is not interpreted as an empty valid
    // protection set, nor may Host simply omit the second business Owner.
    await assert.rejects(createPa05DomainOwnerCoverageV010({
      connectionString:urls[1],workerSchema:schemaA,
      contracts:[...ownerTablesA,{
        domainTable:"absent_effects",domainOwnerLoginRole:ownerA
      }]
    }),/PA05_XDB_DOMAIN_COVERAGE_TABLE_MISSING/);
    const auditA=await createPa05DomainOwnerCoverageV010({
      connectionString:urls[1],workerSchema:schemaA,contracts:ownerTablesA
    });
    const auditB=await createPa05DomainOwnerCoverageV010({
      connectionString:urls[2],workerSchema:schemaB,contracts:ownerTablesB
    });
    audits.push(auditA,auditB);
    gatewayA=await createPa05CrossDatabaseRemoteSqlAdmissionV010({
      ...aConfig,domainCoverage:auditA
    });
    gatewayB=await createPa05CrossDatabaseRemoteSqlAdmissionV010({
      ...bConfig,domainCoverage:auditB
    });

    await seed(a,schemaA,"normal-a");
    await gatewayA.stagePreparedEffect({
      scopeKey:"enterprise:c2",effectId:"normal-a"
    });
    assert.equal((await authority.getState(owner)).pendingCount,1);
    // Deliberately disable only the PURCHASE trigger: a complete two-table
    // coverage certification must reject the next SALES ticket too.
    await seed(a,schemaA,"disabled-purchase");
    await a.unsafe("ALTER TABLE "+qA+
      ".purchase_effects DISABLE TRIGGER pa05_xdb_domain_write_gate");
    await assert.rejects(auditA.assertInstalled(),
      /PA05_XDB_DOMAIN_COVERAGE_TRIGGER_DISABLED_OR_CHANGED/);
    await assert.rejects(gatewayA.stagePreparedEffect({
      scopeKey:"enterprise:c2",effectId:"disabled-purchase"
    }),/PA05_XDB_DOMAIN_COVERAGE_TRIGGER_DISABLED_OR_CHANGED/);
    assert.equal((await authority.getState(owner)).pendingCount,1);
    await a.unsafe("ALTER TABLE "+qA+
      ".purchase_effects ENABLE TRIGGER pa05_xdb_domain_write_gate");
    await auditA.assertInstalled();

    await seed(b,schemaB,"normal-b");
    await gatewayB.stagePreparedEffect({
      scopeKey:"enterprise:c2",effectId:"normal-b"
    });
    assert.equal((await authority.getState(owner)).pendingCount,2);

    // Direct INSERT/UPDATE GRANT drift on either Owner is rejected before
    // minting central or remote tickets. Both tables must be checked.
    await seed(a,schemaA,"owner-grant");
    await a.unsafe('GRANT UPDATE ON '+qA+
      '.purchase_effects TO "'+ownerA2+'"');
    await assert.rejects(auditA.assertInstalled(),
      /PA05_XDB_DOMAIN_COVERAGE_OWNER_PRIVILEGE_DRIFT/);
    await assert.rejects(gatewayA.stagePreparedEffect({
      scopeKey:"enterprise:c2",effectId:"owner-grant"
    }),/PA05_XDB_DOMAIN_COVERAGE_OWNER_PRIVILEGE_DRIFT/);
    assert.equal((await authority.getState(owner)).pendingCount,2);
    await a.unsafe('REVOKE UPDATE ON '+qA+
      '.purchase_effects FROM "'+ownerA2+'"');
    await auditA.assertInstalled();

    // Prevent a sales Owner from gaining direct INSERT on purchases.
    await a.unsafe('GRANT INSERT ON '+qA+
      '.purchase_effects TO "'+ownerA+'"');
    await assert.rejects(auditA.assertInstalled(),
      /PA05_XDB_DOMAIN_COVERAGE_OWNER_PRIVILEGE_DRIFT/);
    await a.unsafe('REVOKE INSERT ON '+qA+
      '.purchase_effects FROM "'+ownerA+'"');
    await auditA.assertInstalled();

    // Non-inherited role membership may allow SET ROLE to obtain DELETE.
    await a.unsafe('CREATE ROLE "'+delegated+'" NOLOGIN');
    await a.unsafe('GRANT DELETE ON '+qA+
      '.sales_effects TO "'+delegated+'"');
    await a.unsafe('GRANT "'+delegated+'" TO "'+ownerA+
      '" WITH INHERIT FALSE');
    await assert.rejects(auditA.assertInstalled(),
      /PA05_XDB_DOMAIN_COVERAGE_OWNER_PRIVILEGE_DRIFT/);
    await a.unsafe('REVOKE "'+delegated+'" FROM "'+ownerA+'"');
    await auditA.assertInstalled();

    // A drift introduced after a valid PRECHECK and a central RESERVE must
    // still prevent *local ticket staging*. The central pending remains.
    await seed(a,schemaA,"drift-after-reserve");
    let seen=0;
    const withRace={
      async assertInstalled(){
        await auditA.assertInstalled();
        seen++;
        if(seen===2){
          await a.unsafe("ALTER TABLE "+qA+
            ".purchase_effects DISABLE TRIGGER pa05_xdb_domain_write_gate");
          await auditA.assertInstalled();
        }
      }
    };
    const raced=await createPa05CrossDatabaseRemoteSqlAdmissionV010({
      ...aConfig,domainCoverage:withRace
    });
    try{
      await assert.rejects(raced.stagePreparedEffect({
        scopeKey:"enterprise:c2",effectId:"drift-after-reserve"
      }),/PA05_XDB_DOMAIN_COVERAGE_TRIGGER_DISABLED_OR_CHANGED/);
    }finally{await raced.close();}
    assert.equal((await authority.getState(owner)).pendingCount,3);
    assert.equal((await a.unsafe("SELECT count(*)::integer AS n FROM "+
      qA+".pa05_xdb_remote_tickets WHERE effect_id='drift-after-reserve'"))[0].n,0);
    await a.unsafe("ALTER TABLE "+qA+
      ".purchase_effects ENABLE TRIGGER pa05_xdb_domain_write_gate");
    await auditA.assertInstalled();

    // The local monotone STOP survives reconnect. A complete inventory
    // certificate does NOT interpret FROZEN as permission to launch work.
    await gatewayA.freezeRemote();
    await gatewayB.freezeRemote();
    assert.equal(await gatewayA.getRemoteState(),"FROZEN");
    await assert.rejects(gatewayA.stagePreparedEffect({
      scopeKey:"enterprise:c2",effectId:"owner-grant"
    }),/PA05_XDB_REMOTE_LOCALLY_FROZEN|PA05_XDB_ADMISSION_FROZEN/);
    assert.equal((await authority.getState(owner)).pendingCount,3);
    console.log("PA05_XDB_DOMAIN_COVERAGE_PG="+JSON.stringify({
      physicalClusters:3,domainTablesProtected:3,
      independentBusinessOwners:3,remoteDatabases:2,
      missingRequiredTableFailsClosed:true,
      unrelatedDisabledOwnerTriggerBlocksNewTickets:true,
      directOwnerUpdatePrivilegeDriftRejected:true,
      crossBusinessOwnerInsertDriftRejected:true,
      nonInheritedDelegatedDeleteRejected:true,
      actualD10TicketMintDeniedOnCoverageDrift:true,
      postCentralReserveFailureLeavesPendingAndNoLocalTicket:true,
      frozenRemotesRemainDenied:true,
      privilegedOwnerCanStillDisableTrigger:true,
      coverageAuditDoesNotMakeRemotePartitionFailStop:true,
      productionWriteEnabled:false,
      existingBusinessPluginsAutoProtected:false
    }));
  }finally{
    for(const x of [gatewayA,gatewayB,...audits,...fences])
      if(x)try{await x.close();}catch{}
    for(const x of sqlUsers)try{await x.end();}catch{}
    if(authority)try{await authority.close();}catch{}
    for(const [db,schema,roles] of [
      [a,schemaA,[workerA,ownerA,ownerA2,delegated]],
      [b,schemaB,[workerB,ownerB]]
    ]){
      try{await db.unsafe("DROP SCHEMA IF EXISTS "+quote(schema)+" CASCADE");}catch{}
      for(const role of roles){
        try{await db.unsafe('DROP OWNED BY "'+role+'"');}catch{}
        try{await db.unsafe('DROP ROLE IF EXISTS "'+role+'"');}catch{}
      }
    }
    try{await central.unsafe("DROP SCHEMA IF EXISTS "+quote(centerSchema)+" CASCADE");}catch{}
    await Promise.allSettled([central.end(),a.end(),b.end()]);
  }
});
