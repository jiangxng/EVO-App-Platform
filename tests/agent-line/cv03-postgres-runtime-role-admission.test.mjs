import test from "node:test";
import assert from "node:assert/strict";
import {randomUUID} from "node:crypto";
import postgres from "postgres";
import {preparePostgresConditionalResourceSchemaV010}
  from "../../dist/providers/enterprise-context/resources-postgres.js";
import {auditCv03N1PostgresRuntimeRole}
  from "../../tools/cv03-n1-postgres-role-audit.mjs";

const adminUrl=process.env.CV03_RESOURCE_PROOF_DATABASE_URL;
const requiresDB={skip:!adminUrl&&
  "CV03_RESOURCE_PROOF_DATABASE_URL required for isolated PG18 physical audit",
  timeout:60000};

test("CV03 N1 rejects unsafe schema before any SQL connection",async()=>{
  await assert.rejects(
    auditCv03N1PostgresRuntimeRole({
      connectionString:"postgres://invalid.invalid/test",
      schema:'cv03_ok";DROP TABLE resources'
    }),
    /CV03_N1_ISOLATED_SCHEMA_REQUIRED/
  );
});

/**
 * SECURITY NEGATIVE PROOF — isolated CI-only PG18 database.
 *
 * This test exposes an unclosed production boundary: grants that let the
 * existing Node adapter INSERT resources and receipts also let a compromised
 * SQL login bypass the Node-only Host signature verifier. SQL immutable
 * UPDATE/DELETE triggers alone cannot reject an unauthenticated INSERT.
 *
 * The test must PASS while reporting NOT_CERTIFIED; it never opens production
 * WRITE, changes a deployed role, or stores a real signing secret.
 */
test("CV03 N1 isolated real PG login: least DDL role still bypasses signed WRITE via direct DML",requiresDB,async()=>{
  const suffix=randomUUID().replaceAll("-","").slice(0,12);
  const schema="cv03_n1_"+suffix;
  const role="cv03_n1_writer_"+suffix;
  const password="CV03_TEST_"+randomUUID().replaceAll("-","");
  const qSchema='"'+schema+'"',qRole='"'+role+'"';
  const resource=qSchema+".resources";
  const receipt=qSchema+".cv03_resource_receipts";
  const admin=postgres(adminUrl,{max:2,connect_timeout:10,prepare:false});
  let writer;
  let roleCreated=false,schemaCreated=false;
  try{
    await preparePostgresConditionalResourceSchemaV010({
      connectionString:adminUrl,schema
    });
    schemaCreated=true;
    await admin.unsafe("CREATE ROLE "+qRole+
      " LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION PASSWORD '"+
      password+"'");
    roleCreated=true;
    await admin.unsafe("GRANT USAGE ON SCHEMA "+qSchema+" TO "+qRole);
    await admin.unsafe("GRANT SELECT,INSERT,UPDATE ON "+resource+" TO "+qRole);
    await admin.unsafe("GRANT SELECT,INSERT ON "+receipt+" TO "+qRole);
    const writerUrl=new URL(adminUrl);
    writerUrl.username=role;
    writerUrl.password=password;
    writer=postgres(writerUrl.toString(),{max:2,connect_timeout:10,prepare:false});
    const adminAudit=await auditCv03N1PostgresRuntimeRole({
      connectionString:adminUrl,schema
    });
    assert.equal(adminAudit.state,"NOT_CERTIFIED");
    assert.ok(adminAudit.blockers.includes("CV03_N1_RUNTIME_SQL_SUPERUSER"));

    const report=await auditCv03N1PostgresRuntimeRole({
      connectionString:writerUrl.toString(),schema
    });
    assert.equal(report.state,"NOT_CERTIFIED");
    assert.equal(report.runtimeRole,role);
    assert.equal(report.evidence.primaryWritable,true);
    assert.equal(report.evidence.receiptImmutabilityTriggerEnabled,true);
    assert.equal(report.evidence.unrestrictedResourceDml,true);
    assert.equal(report.evidence.unrestrictedReceiptDml,true);
    assert.ok(report.blockers.includes(
      "CV03_N1_RUNTIME_CAN_MUTATE_RESOURCE_WITHOUT_HOST_PROOF"));
    assert.ok(report.blockers.includes(
      "CV03_N1_RUNTIME_CAN_MUTATE_RECEIPT_WITHOUT_HOST_PROOF"));
    assert.ok(report.blockers.includes(
      "CV03_N1_DB_ENFORCED_SIGNED_WRITE_GATEWAY_NOT_PROVEN"));
    assert.ok(!report.blockers.includes("CV03_N1_RUNTIME_SQL_SUPERUSER"));
    assert.ok(!report.blockers.includes("CV03_N1_RUNTIME_CAN_CHANGE_SCHEMA"));

    await assert.rejects(
      writer.unsafe("ALTER TABLE "+receipt+
        " DISABLE TRIGGER cv03_resource_receipts_immutable"),
      /must be owner|permission denied/i
    );

    // An authorized runtime SQL principal can create a malformed "receipt"
    // without submitting a Host HMAC proof. SQL currently checks JSON object
    // shape, not signature. This is a test-only random namespace.
    await writer.unsafe("INSERT INTO "+resource+
      " (context_id,namespace,collection_id,resource_type,resource_id,"+
      " revision,resource) VALUES ($1,$2,$3,$4,$5,0,$6::text::jsonb)",
      ["n1-test-context","n1-test","n1-list","saved-collection-view",
        "unsigned",JSON.stringify({notHostValidated:true})]
    );
    await writer.unsafe("INSERT INTO "+receipt+
      " (context_id,idempotency_hash,receipt_id,approval_digest,"+
      " input_digest,receipt_digest,receipt,resource)"+
      " VALUES ($1,$2,$3,$4,$5,$6,$7::text::jsonb,$8::text::jsonb)",
      ["n1-test-context","not-signed","forged:test-only","not-signed",
        "not-signed","not-signed",JSON.stringify({status:"SUCCEEDED"}),
        JSON.stringify({notHostValidated:true})]
    );
    const existing=await writer.unsafe("SELECT receipt::text AS receipt"+
      " FROM "+receipt+" WHERE receipt_id=$1",["forged:test-only"]);
    assert.equal(existing.length,1,
      "a direct SQL INSERT bypassed Node-only HMAC proof");
    assert.equal(JSON.parse(existing[0].receipt).status,"SUCCEEDED");
    console.log("CV03_N1_PHYSICAL_SQL_UNSIGNED_INSERT_NEGATIVE_PROOF=PASS");
    console.log("CV03_N1_PRODUCTION_ADMISSION=NOT_CERTIFIED");
  }finally{
    if(writer)await writer.end();
    if(schemaCreated)await admin.unsafe("DROP SCHEMA "+qSchema+" CASCADE");
    if(roleCreated)await admin.unsafe("DROP ROLE "+qRole);
    await admin.end();
  }
});
