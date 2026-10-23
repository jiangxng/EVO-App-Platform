import type {Pa05CrossDatabaseReservationAuthorityV010} from "./pa05-cross-database-admission.js";
import type {Pa05RemoteSqlAdmissionV010} from "./pa05-cross-database-remote-sql-admission.js";

/**
 * D14: host-controlled conservative STOP, not a distributed commit.
 * FROZEN is reported ONLY after every registered remote SQL gate has
 * durably frozen and the central Owner is frozen. A network partition
 * always returns an error; it never claims all remote processes stopped.
 *
 * The remote gate is monotone: no automatic ACTIVE reopening. A ticket
 * minted before freeze cannot begin INVOKING after remote freeze commits.
 * Already INVOKING domain effects can still finish or remain UNKNOWN.
 * Privileged database owners and direct domain Owner calls are out of scope.
 */
export async function freezePa05CrossDatabaseOwnerV010(input:{
  ownerPackageId:string;
  central:Pick<Pa05CrossDatabaseReservationAuthorityV010,
    "getTrustedWorkerIds"|"freeze">;
  remotes:readonly Pick<Pa05RemoteSqlAdmissionV010,
    "workerId"|"ownerPackageId"|"freezeRemote"|"getRemoteState">[];
}):Promise<{state:"FROZEN";pendingCount:number;remoteWorkerCount:number}>{
  const owner=input.ownerPackageId;
  if(typeof owner!=="string"||!/^[a-zA-Z][a-zA-Z0-9_.-]{0,127}$/.test(owner)||
     !input.central||!Array.isArray(input.remotes))
    throw Error("PA05_XDB_REMOTE_FREEZE_TRUSTED_PORTS_REQUIRED");

  // Do not trust caller-provided partial remote inventory: compare to the
  // frozen source of truth recorded in the central PostgreSQL database.
  let expected:string[];
  try {
    expected=await input.central.getTrustedWorkerIds(owner);
  } catch {
    throw Error("PA05_XDB_REMOTE_FREEZE_CENTRAL_INVENTORY_UNREACHABLE");
  }
  const remotes=[...input.remotes];
  const actual=remotes.map(x=>x.workerId).sort();
  if(expected.length!==remotes.length||
    JSON.stringify([...expected].sort())!==JSON.stringify(actual)||
    remotes.some(x=>x.ownerPackageId!==owner||
      typeof x.freezeRemote!=="function"||
      typeof x.getRemoteState!=="function"))
    throw Error("PA05_XDB_REMOTE_FREEZE_INVENTORY_MISMATCH");

  // Independently contact ALL physical business databases. Promise.allSettled
  // prevents one partition from silently omitting another remote.
  const stopped=await Promise.allSettled(remotes.map(r=>r.freezeRemote()));
  if(stopped.some(r=>r.status!=="fulfilled"||r.value.state!=="FROZEN")){
    // A partial freeze is NOT safe for lifecycle drain. Attempt central
    // freeze conservatively; never hide the failure or claim global STOP.
    try {await input.central.freeze(owner);} catch {}
    throw Error("PA05_XDB_REMOTE_FREEZE_PARTITION_UNVERIFIED");
  }

  // Only after every remote has durably stopped fresh SQL admission may the
  // shared central gate be marked FROZEN. This still does not mean PENDING=0.
  let center:{state:"FROZEN";pendingCount:number};
  try {center=await input.central.freeze(owner);}
  catch {throw Error("PA05_XDB_REMOTE_FREEZE_CENTRAL_UNREACHABLE");}

  // An unreachable remote after central freeze is UNKNOWN, never a PASS.
  const verified=await Promise.allSettled(remotes.map(r=>r.getRemoteState()));
  if(verified.some(r=>r.status!=="fulfilled"||r.value!=="FROZEN"))
    throw Error("PA05_XDB_REMOTE_FREEZE_POSTCHECK_UNVERIFIED");
  return {state:"FROZEN",pendingCount:center.pendingCount,
    remoteWorkerCount:remotes.length};
}
