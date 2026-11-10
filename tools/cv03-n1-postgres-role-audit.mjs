/**
 * CV-03 N1 read-only PostgreSQL role/ACL inspection. NOT production certification.
 * The current Node Host verifies HMAC before SQL; direct SQL DML can bypass it.
 * Never supply a privileged migration account in place of the actual runtime.
 * This file only issues SELECT queries and never prints connection credentials.
 */
import postgres from "postgres";
import {pathToFileURL} from "node:url";

function validateSchema(value){
  if(typeof value!=="string"||!/^cv03_[a-z0-9_]{1,58}$/.test(value))
    throw Error("CV03_N1_ISOLATED_SCHEMA_REQUIRED");
  return value;
}
export async function auditCv03N1PostgresRuntimeRole({connectionString,schema}){
  const scope=validateSchema(schema);
  if(typeof connectionString!=="string"||!connectionString.trim())
    throw Error("CV03_N1_RUNTIME_DATABASE_URL_REQUIRED");
  const sql=postgres(connectionString,{max:1,connect_timeout:8,idle_timeout:5,prepare:false});
  try{
    const rows=await sql.unsafe(`
      SELECT current_user AS runtime_role,
        pg_is_in_recovery() AS standby,
        current_setting('transaction_read_only')::boolean AS read_only,
        r.rolsuper AS is_superuser,
        r.rolcreatedb AS can_create_database,
        r.rolcreaterole AS can_create_role,
        r.rolbypassrls AS bypasses_rls,
        COALESCE(has_schema_privilege(current_user,$1,'CREATE'),false)
          AS can_create_in_schema,
        COALESCE((SELECT pg_has_role(current_user,owner.rolname,'MEMBER')
          FROM pg_namespace n JOIN pg_roles owner ON owner.oid=n.nspowner
          WHERE n.nspname=$1),false) AS is_schema_owner_or_member,
        to_regclass($2) IS NOT NULL AS has_resource_table,
        to_regclass($3) IS NOT NULL AS has_receipt_table,
        COALESCE(has_table_privilege(current_user,to_regclass($2),'INSERT'),false)
          AS can_insert_resources,
        COALESCE(has_table_privilege(current_user,to_regclass($2),'UPDATE'),false)
          AS can_update_resources,
        COALESCE(has_table_privilege(current_user,to_regclass($3),'INSERT'),false)
          AS can_insert_receipts,
        COALESCE(has_table_privilege(current_user,to_regclass($3),'UPDATE'),false)
          AS can_update_receipts,
        COALESCE(has_table_privilege(current_user,to_regclass($3),'DELETE'),false)
          AS can_delete_receipts,
        COALESCE((SELECT pg_has_role(current_user,owner.rolname,'MEMBER')
          FROM pg_class c JOIN pg_roles owner ON owner.oid=c.relowner
          WHERE c.oid=to_regclass($3)),false)
          AS is_receipt_table_owner_or_member,
        EXISTS(SELECT 1 FROM pg_trigger t
          WHERE t.tgrelid=to_regclass($3)
            AND t.tgname='cv03_resource_receipts_immutable'
            AND t.tgenabled IN ('O','A')) AS immutable_trigger_enabled
      FROM pg_roles r WHERE r.rolname=current_user
    `,[scope,scope+".resources",scope+".cv03_resource_receipts"]);
    if(rows.length!==1)throw Error("CV03_N1_RUNTIME_ROLE_NOT_FOUND");
    const r=rows[0],blockers=[];
    const check=(condition,code)=>{if(condition)blockers.push(code);};
    check(r.standby||r.read_only,"CV03_N1_NOT_WRITABLE_PRIMARY");
    check(r.is_superuser,"CV03_N1_RUNTIME_SQL_SUPERUSER");
    check(r.can_create_database||r.can_create_role,"CV03_N1_RUNTIME_SQL_ADMIN_PRIVILEGES");
    check(r.bypasses_rls,"CV03_N1_RUNTIME_SQL_BYPASS_RLS");
    check(r.can_create_in_schema||r.is_schema_owner_or_member,
      "CV03_N1_RUNTIME_CAN_CHANGE_SCHEMA");
    check(!r.has_resource_table||!r.has_receipt_table,
      "CV03_N1_REQUIRED_TABLES_MISSING");
    check(r.is_receipt_table_owner_or_member,
      "CV03_N1_RUNTIME_CAN_ALTER_RECEIPT_TABLE");
    check(!r.immutable_trigger_enabled,
      "CV03_N1_RECEIPT_IMMUTABILITY_TRIGGER_MISSING");
    check(r.can_insert_resources||r.can_update_resources,
      "CV03_N1_RUNTIME_CAN_MUTATE_RESOURCE_WITHOUT_HOST_PROOF");
    check(r.can_insert_receipts||r.can_update_receipts||r.can_delete_receipts,
      "CV03_N1_RUNTIME_CAN_MUTATE_RECEIPT_WITHOUT_HOST_PROOF");
    // Neither role introspection nor a valid trigger proves that every
    // insert/update was authorized by a real Host-issued signature.
    blockers.push("CV03_N1_DB_ENFORCED_SIGNED_WRITE_GATEWAY_NOT_PROVEN");
    return {
      contractVersion:"0.1.0",state:"NOT_CERTIFIED",
      scope:"RUNTIME_ROLE_SQL_METADATA_ONLY",schema:scope,
      runtimeRole:r.runtime_role,
      evidence:{
        primaryWritable:!r.standby&&!r.read_only,
        resourceTablePresent:!!r.has_resource_table,
        receiptTablePresent:!!r.has_receipt_table,
        receiptImmutabilityTriggerEnabled:!!r.immutable_trigger_enabled,
        unrestrictedResourceDml:!!(r.can_insert_resources||r.can_update_resources),
        unrestrictedReceiptDml:!!(r.can_insert_receipts||r.can_update_receipts||r.can_delete_receipts)
      },blockers
    };
  }finally{
    await sql.end();
  }
}
// Opt-in operator read-only inspection; exit 2 deliberately never certifies WRITE.
if(process.argv[1] && import.meta.url===pathToFileURL(process.argv[1]).href){
  const connectionString=process.env.CV03_N1_RUNTIME_DATABASE_URL;
  const schema=process.env.CV03_N1_SCHEMA;
  if(!connectionString||!schema){
    console.log(JSON.stringify({state:"NOT_CERTIFIED",
      blockers:["CV03_N1_RUNTIME_CONNECTION_OR_SCHEMA_NOT_PROVIDED"]}));
    process.exitCode=2;
  }else{
    try{
      console.log(JSON.stringify(await auditCv03N1PostgresRuntimeRole({
        connectionString,schema
      }),null,2));
    }catch{
      console.log(JSON.stringify({state:"NOT_CERTIFIED",
        blockers:["CV03_N1_CONNECTION_OR_ROLE_INSPECTION_FAILED"]}));
    }
    process.exitCode=2;
  }
}
