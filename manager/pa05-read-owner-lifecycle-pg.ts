import postgres from "postgres";
import type {
  Pa05HostReadLifecycleAuthorityV010,
  Pa05ReadLifecycleRemovalV010
} from "./pa05-read-owner-host-lifecycle.js";

/**
 * PA05 E01J4D: opt-in pre-provisioned PostgreSQL authority.
 * The external administrator provisions tables, permissions and the dedicated
 * LOGIN role. Neither HTTP, the Worker SQL role nor this adapter performs DDL.
 * SQL session_user (not a client supplied Host ID) must be mapped by DBA.
 */
export function createPa05ReadLifecyclePgAuthorityV010(input: {
  connectionString: string;
  schema: string;
  hostId: string;
}): Pa05HostReadLifecycleAuthorityV010 & {close(): Promise<void>} {
  if (!input.connectionString?.trim()
      || !/^[a-z][a-z0-9_]{0,62}$/.test(input.schema)
      || !/^[a-z0-9][a-z0-9_-]{2,79}$/.test(input.hostId)) {
    throw new Error("PA05_READ_LIFECYCLE_SQL_CONFIGURATION_INVALID");
  }
  const db=postgres(input.connectionString,{max:1,prepare:false});
  const schema='"'+input.schema+'"';
  const owner="evo-purchase-attention";
  function checkArgs(ctx: {
    operationId:string; operation:Pa05ReadLifecycleRemovalV010; packageId:string;
  }) {
    if(ctx.packageId!==owner||!["DISABLE","UNINSTALL"].includes(ctx.operation))
      throw new Error("PA05_READ_LIFECYCLE_SQL_OPERATION_INVALID");
  }
  async function authorized(tx:typeof db) {
    const rows=await tx.unsafe(
      'SELECT host_id FROM '+schema+'.pa05_read_lifecycle_operators '+
      'WHERE login_role=session_user AND host_id=$1 AND enabled=true',
      [input.hostId]);
    if(rows.length!==1)throw Error("PA05_READ_LIFECYCLE_SQL_OPERATOR_NOT_TRUSTED");
  }
  async function getIntent(tx:typeof db,ctx:{
    operationId:string;operation:Pa05ReadLifecycleRemovalV010;packageId:string;
  }) {
    const rows=await tx.unsafe(
      'SELECT state,operation FROM '+schema+'.pa05_read_lifecycle_intents '+
      'WHERE operation_id=$1 AND host_id=$2 AND owner_package_id=$3',
      [ctx.operationId,input.hostId,owner]);
    if(rows.length!==1 || rows[0].operation!==ctx.operation
        || !["FENCED","COMPLETE"].includes(rows[0].state))
      throw Error("PA05_READ_LIFECYCLE_SQL_INTENT_MISMATCH");
    const approval=await tx.unsafe(
      'SELECT approved_epoch FROM '+schema+'.pa05_read_host_activation_epoch '+
      'WHERE owner_package_id=$1 AND host_id=$2 FOR SHARE',
      [owner,input.hostId]);
    if(approval.length!==1 || Number(approval[0].approved_epoch)!==0)
      throw Error("PA05_READ_LIFECYCLE_SQL_NOT_FENCED");
    return rows[0].state as "FENCED"|"COMPLETE";
  }
  return {
    async fence(ctx) {
      checkArgs(ctx);
      await db.begin(async tx=>{
        await authorized(tx as unknown as typeof db);
        const epochRows=await tx.unsafe(
          'SELECT epoch FROM '+schema+'.pa05_read_owner_epoch '+
          'WHERE owner_package_id=$1',[owner]);
        if(epochRows.length!==1)throw Error("PA05_READ_LIFECYCLE_SQL_NO_OWNER");
        const approval=await tx.unsafe(
          'SELECT approved_epoch FROM '+schema+'.pa05_read_host_activation_epoch '+
          'WHERE owner_package_id=$1 AND host_id=$2 FOR UPDATE',[owner,input.hostId]);
        if(approval.length!==1 || Number(approval[0].approved_epoch)!==Number(epochRows[0].epoch))
          throw Error("PA05_READ_LIFECYCLE_SQL_REATTEST_REQUIRED");
        await tx.unsafe(
          'INSERT INTO '+schema+'.pa05_read_lifecycle_intents '+
          '(operation_id,host_id,owner_package_id,expected_epoch,state,operation) '+
          'VALUES($1,$2,$3,$4,$5,$6)',[
            ctx.operationId,input.hostId,owner,epochRows[0].epoch,"FENCED",ctx.operation
          ]);
        const cut=await tx.unsafe(
          'UPDATE '+schema+'.pa05_read_host_activation_epoch SET approved_epoch=0 '+
          'WHERE owner_package_id=$1 AND host_id=$2 AND approved_epoch=$3 RETURNING host_id',
          [owner,input.hostId,epochRows[0].epoch]);
        if(cut.length!==1)throw Error("PA05_READ_LIFECYCLE_SQL_CUT_RACE");
      });
    },
    async assertFenced(ctx) {
      checkArgs(ctx);
      await db.begin(async tx=>{
        await authorized(tx as unknown as typeof db);
        await getIntent(tx as unknown as typeof db,ctx);
      });
    },
    async complete(ctx) {
      checkArgs(ctx);
      await db.begin(async tx=>{
        await authorized(tx as unknown as typeof db);
        const state=await getIntent(tx as unknown as typeof db,ctx);
        if(state==="COMPLETE")return;
        const rows=await tx.unsafe(
          'UPDATE '+schema+'.pa05_read_lifecycle_intents SET state=$1 '+
          'WHERE operation_id=$2 AND host_id=$3 AND owner_package_id=$4 '+
          'AND operation=$5 AND state=$6 RETURNING operation_id',
          ["COMPLETE",ctx.operationId,input.hostId,owner,ctx.operation,"FENCED"]);
        if(rows.length!==1)throw Error("PA05_READ_LIFECYCLE_SQL_COMPLETE_RACE");
      });
    },
    async close(){await db.end({timeout:2});}
  };
}
