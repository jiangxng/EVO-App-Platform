import postgres from "postgres";

/**
 * PA05-05/E01J1 — opt-in central PostgreSQL READ owner fence.
 *
 * Not wired to the production Host, AppManager, or business READ handler.
 * It is intentionally a separate proof from the existing WRITE Owner gate.
 * AppManager JSON/in-memory state is NOT transactionally covered here.
 */
export interface Pa05SharedReadOwnerGateV010 {
  getEpoch(): Promise<{epoch: number; state: "FROZEN" | "ACTIVE"}>;
  certify(input: {
    expectedEpoch: number;
    trustedOperatorApproved: () => Promise<boolean>;
  }): Promise<number>;
  revoke(expectedEpoch: number): Promise<number>;
  withReadAdmission<T>(input: {
    hostId: string;
    expectedEpoch: number;
    perform(): Promise<T>;
  }): Promise<T>;
  close(): Promise<void>;
}

function identifier(s: string): string {
  if (!/^[a-z][a-z0-9_]{0,62}$/.test(s))
    throw Error("PA05_READ_SQL_SCHEMA_INVALID");
  return '"' + s + '"';
}
function hostIds(ids: readonly string[]): string[] {
  if (ids.length < 2 || ids.some(x =>
    !/^[a-z][a-z0-9_-]{1,80}$/.test(x)) ||
    new Set(ids).size !== ids.length)
    throw Error("PA05_READ_SQL_HOST_INVENTORY_INVALID");
  return [...ids].sort();
}
function expectedEpoch(n: number): number {
  if (!Number.isSafeInteger(n) || n < 1)
    throw Error("PA05_READ_SQL_EPOCH_INVALID");
  return n;
}
function validOwner(owner: string): string {
  if (owner !== "evo-purchase-attention")
    throw Error("PA05_READ_SQL_OWNER_NOT_ALLOWLISTED");
  return owner;
}

export async function createPa05SharedReadOwnerGateV010(input: {
  connectionString: string;
  schema: string;
  ownerPackageId: "evo-purchase-attention";
  trustedHostIds: readonly string[];
}): Promise<Pa05SharedReadOwnerGateV010> {
  const a = identifier(input.schema);
  const owner = validOwner(input.ownerPackageId);
  const declared = hostIds(input.trustedHostIds);
  if (typeof input.connectionString !== "string"
      || !input.connectionString.startsWith("postgres://")
      && !input.connectionString.startsWith("postgresql://"))
    throw Error("PA05_READ_SQL_AUTHORITY_URL_REQUIRED");
  const sql = postgres(input.connectionString, {
    max: 2, connect_timeout: 2, idle_timeout: 5
  });
  try {
    await sql.unsafe("CREATE SCHEMA IF NOT EXISTS " + a);
    await sql.unsafe("CREATE TABLE IF NOT EXISTS " + a +
      ".pa05_read_owner_epoch(" +
      "owner_package_id text PRIMARY KEY," +
      "epoch bigint NOT NULL CHECK(epoch>=1)," +
      "state text NOT NULL CHECK(state IN ('ACTIVE','FROZEN')))");
    await sql.unsafe("CREATE TABLE IF NOT EXISTS " + a +
      ".pa05_read_trusted_hosts(" +
      "owner_package_id text NOT NULL," +
      "host_id text NOT NULL," +
      "PRIMARY KEY(owner_package_id,host_id))");
    await sql.begin(async tx => {
      // Initialization is also serialized across independent Host processes.
      await tx.unsafe("INSERT INTO " + a +
        ".pa05_read_owner_epoch(owner_package_id,epoch,state) " +
        "VALUES($1,1,'FROZEN') ON CONFLICT DO NOTHING",[owner]);
      const rows=await tx.unsafe("SELECT epoch,state FROM "+a+
        ".pa05_read_owner_epoch WHERE owner_package_id=$1 FOR UPDATE",[owner]);
      if(rows.length!==1 || !["FROZEN","ACTIVE"].includes(rows[0].state))
        throw Error("PA05_READ_SQL_OWNER_STATE_INVALID");
      const actual=await tx.unsafe("SELECT host_id FROM "+a+
        ".pa05_read_trusted_hosts WHERE owner_package_id=$1 ORDER BY host_id",[owner]);
      if(!actual.length){
        for(const id of declared)
          await tx.unsafe("INSERT INTO "+a+
            ".pa05_read_trusted_hosts(owner_package_id,host_id) VALUES($1,$2)",
            [owner,id]);
      }else if(JSON.stringify(actual.map((x: {host_id: string})=>x.host_id)) !== JSON.stringify(declared)){
        throw Error("PA05_READ_SQL_HOST_INVENTORY_CHANGED");
      }
    });
  } catch(error) {
    await sql.end();
    throw error;
  }
  const row = async (tx: any, mode: "SHARE" | "UPDATE") => {
    const rows=await tx.unsafe("SELECT epoch,state FROM "+a+
      ".pa05_read_owner_epoch WHERE owner_package_id=$1 FOR "+mode,[owner]);
    if(rows.length!==1) throw Error("PA05_READ_SQL_OWNER_NOT_REGISTERED");
    return {epoch:Number(rows[0].epoch),
      state:String(rows[0].state) as "FROZEN" | "ACTIVE"};
  };
  const hosts = async (tx: any) => {
    const actual=await tx.unsafe("SELECT host_id FROM "+a+
      ".pa05_read_trusted_hosts WHERE owner_package_id=$1 ORDER BY host_id",[owner]);
    if(JSON.stringify(actual.map((x: {host_id: string})=>x.host_id)) !== JSON.stringify(declared))
      throw Error("PA05_READ_SQL_HOST_INVENTORY_CHANGED");
  };
  return {
    async getEpoch(){
      return sql.begin(async tx => {
        const current=await row(tx,"SHARE");
        await hosts(tx);
        return current;
      });
    },
    async certify({expectedEpoch: epoch,trustedOperatorApproved}){
      expectedEpoch(epoch);
      if(typeof trustedOperatorApproved!=="function" ||
         !(await trustedOperatorApproved()))
        throw Error("PA05_READ_SQL_OPERATOR_NOT_APPROVED");
      return sql.begin(async tx=>{
        const current=await row(tx,"UPDATE");
        await hosts(tx);
        if(current.epoch!==epoch || current.state!=="FROZEN")
          throw Error("PA05_READ_SQL_RECERTIFICATION_REQUIRED");
        // The real production operator/policy identity is NOT provided by
        // this isolated SQL proof. Never expose this method to agent tools.
        if(!(await trustedOperatorApproved()))
          throw Error("PA05_READ_SQL_OPERATOR_REVOKED");
        const next=epoch+1;
        await tx.unsafe("UPDATE "+a+
          ".pa05_read_owner_epoch SET epoch=$2,state='ACTIVE' " +
          "WHERE owner_package_id=$1",[owner,next]);
        return next;
      });
    },
    async revoke(epoch){
      expectedEpoch(epoch);
      return sql.begin(async tx=>{
        const current=await row(tx,"UPDATE");
        await hosts(tx);
        if(current.epoch!==epoch)
          throw Error("PA05_READ_SQL_EPOCH_CHANGED");
        const next=epoch+1;
        await tx.unsafe("UPDATE "+a+
          ".pa05_read_owner_epoch SET epoch=$2,state='FROZEN' "+
          "WHERE owner_package_id=$1",[owner,next]);
        return next;
      });
    },
    async withReadAdmission({hostId,expectedEpoch: epoch,perform}){
      expectedEpoch(epoch);
      if(!declared.includes(hostId) || typeof perform!=="function")
        throw Error("PA05_READ_SQL_HOST_NOT_TRUSTED");
      // The actual read callback runs INSIDE the PostgreSQL row-lock
      // transaction. A revoke on another Host cannot commit mid-callback.
      // This does NOT atomically bind an AppManager local install or the
      // currently unconnected business READ handler to PostgreSQL.
      const result = await sql.begin(async tx=>{
        const current=await row(tx,"SHARE");
        await hosts(tx);
        if(current.state!=="ACTIVE" || current.epoch!==epoch)
          throw Error("PA05_READ_SQL_ADMISSION_DENIED");
        // Wrap generic T to preserve postgres.js begin's return typing:
        // it normalizes bare arrays differently from normal value objects.
        return {value:await perform()};
      });
      return result.value as T;
    },
    async close(){await sql.end();}
  };
}
