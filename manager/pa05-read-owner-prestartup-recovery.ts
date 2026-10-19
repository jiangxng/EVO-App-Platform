import type {AppManagerService} from "./service.js";
import type {PlatformSnapshotV010} from "../contracts/package.js";
import {createPa05HostReadLifecycleV010} from "./pa05-read-owner-host-lifecycle.js";
import type {Pa05HostReadLifecycleAuthorityV010}
  from "./pa05-read-owner-host-lifecycle.js";

/**
 * PA05/E01J4F: isolated pre-start *operator-led* repair, not a server route,
 * startup hook or a replacement for E01I. The calling trusted environment
 * must separately authenticate its operator and supply the PostgreSQL
 * credential with only the preprovisioned function EXECUTE privileges.
 *
 * Only an existing DBA-fenced UNINSTALL intent can clear a persisted
 * Purchase Attention installation. Fenced DISABLE leaves E01I quarantined.
 */
export async function recoverPa05ReadOwnerPrestartupUninstallV010(input:{
  manager:Pick<AppManagerService,
    "getSnapshot"|"planDisable"|"planUninstall"|"disable"|"uninstall">;
  authority: Pa05HostReadLifecycleAuthorityV010 & {
    pending():Promise<{operationId:string;operation:"DISABLE"|"UNINSTALL"}|null>;
  };
  authorizeHostOperator():Promise<boolean>;
}):Promise<PlatformSnapshotV010> {
  if(!input?.manager || !input.authority
     || typeof input.authority.pending!=="function"
     || typeof input.authorizeHostOperator!=="function")
    throw Error("PA05_READ_PRESTART_RECOVERY_CONFIGURATION_INVALID");
  // An external trusted caller must authorize before querying or modifying
  // persisted state; a local process environment flag is NOT Human identity.
  if(await input.authorizeHostOperator()!==true)
    throw Error("PA05_READ_PRESTART_RECOVERY_OPERATOR_DENIED");
  const snapshot=input.manager.getSnapshot();
  const owner="evo-purchase-attention";
  const installed=snapshot.installedPackages.some(p=>p.packageId===owner);
  const activated=snapshot.activeFeatures.some(f=>
    f.packageId===owner || f.featureId==="evo-purchase-attention.default");
  // Recovery also finishes a previously local-committed uninstall whose
  // process died before central COMPLETE. An orphan active Feature is unsafe.
  if(activated && !installed)
    throw Error("PA05_READ_PRESTART_RECOVERY_STATE_INVALID");
  const pending=await input.authority.pending();
  if(!pending)
    throw Error("PA05_READ_PRESTART_RECOVERY_NO_DB_FENCE");
  if(pending.operation!=="UNINSTALL")
    throw Error("PA05_READ_PRESTART_RECOVERY_UNINSTALL_REQUIRED");
  // J4C re-checks authorized operator, matching FENCED DB intent and
  // approval epoch before original AppManager JSON uninstall.
  const lifecycle=createPa05HostReadLifecycleV010({
    manager:input.manager,
    protectedPackageId:"evo-purchase-attention",
    authorizeHostOperator:async()=>await input.authorizeHostOperator(),
    authority:input.authority
  });
  const repaired=await lifecycle.recover("UNINSTALL",pending.operationId);
  if(repaired.installedPackages.some(p=>p.packageId===owner)
     || repaired.activeFeatures.some(f=>
       f.packageId===owner || f.featureId==="evo-purchase-attention.default"))
    throw Error("PA05_READ_PRESTART_RECOVERY_NOT_CLEAN");
  // The next real server startup still executes original E01I unmodified.
  return repaired;
}
