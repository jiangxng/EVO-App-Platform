import type {AppManagerService} from "./service.js";
import type {PlatformSnapshotV010} from "../contracts/package.js";
import type {Cv03N105bPackageFenceAuthorityV010} from
  "./cv03-n105b-authority-t0-pg.js";
import {HOST_ENTERPRISE_CONTEXT_PACKAGE_ID}
  from "../providers/enterprise-context/package.js";
import {CV03_UNCERTIFIED_SAVED_VIEW_FEATURE_ID_V010}
  from "./cv03-personal-saved-view-host-admission.js";

/**
 * N1-05b/02: UNMOUNTED PA05 Host composition, not an HTTP/Agent handler.
 * Protects the actual AppManagerService disable()/uninstall() boundary by
 * requiring a package-wide PostgreSQL T0 DENY fence first. It does NOT
 * certify the future DBA-owned SQL function, AuthProvider, or producer identity.
 *
 * Real Host startup still refuses this uncertified Saved View Feature.
 * The current real enterprise-context Package is SHARED: its default
 * Feature provides required business infrastructure. Whole-package
 * disable/uninstall is therefore hard DENIED before any T0 call, even
 * when only the Saved View Feature remains active. This adapter applies
 * only to a separately scoped single-Feature test manifest until the
 * existing Manager gains approved feature-level lifecycle semantics.
 * Only a trusted Host operator (using its existing admin/Provider check) may
 * construct the input and choose the operation key/generation; neither can
 * come from Human/Agent JSON. The DB must independently authenticate those.
 */
export type Cv03N105bHostRemovalV010 = "DISABLE"|"UNINSTALL";
type Manager = Pick<AppManagerService,
  "listCatalog"|"getSnapshot"|"planDisable"|"planUninstall"|"disable"|"uninstall">;

export function createCv03N105bPa05HostLifecycleBarrierV010(input:{
  manager:Manager;
  authority:Cv03N105bPackageFenceAuthorityV010;
  /** Real Host operator authorization, including current Provider decision. */
  authorizeHostOperator(operation:Cv03N105bHostRemovalV010):
    Promise<boolean>;
  /** Trusted current Owner generation (not a client-provided revision). */
  sourceGeneration:string;
}):{
  apply(operation:Cv03N105bHostRemovalV010,operationKey:string):
    Promise<PlatformSnapshotV010>;
  recover(operation:Cv03N105bHostRemovalV010,operationKey:string):
    Promise<PlatformSnapshotV010>;
}{
  if(!input?.manager||!input?.authority ||
     typeof input.authority.fencePackage!=="function"||
     typeof input.manager.listCatalog!=="function"||
     typeof input.manager.getSnapshot!=="function"||
     typeof input.manager.planDisable!=="function"||
     typeof input.manager.planUninstall!=="function"||
     typeof input.manager.disable!=="function"||
     typeof input.manager.uninstall!=="function"||
     typeof input.authorizeHostOperator!=="function"||
     typeof input.sourceGeneration!=="string"||
     !/^[a-zA-Z0-9][a-zA-Z0-9_-]{5,127}$/.test(input.sourceGeneration))
    throw Error("CV03_N105B_HOST_LIFECYCLE_CONFIGURATION_INVALID");
  const packageId=HOST_ENTERPRISE_CONTEXT_PACKAGE_ID;
  const featureId=CV03_UNCERTIFIED_SAVED_VIEW_FEATURE_ID_V010;
  let busy=false;
  async function execute(operation:Cv03N105bHostRemovalV010,
    operationKey:string,recovery:boolean):Promise<PlatformSnapshotV010>{
    if(operation!=="DISABLE"&&operation!=="UNINSTALL"||
       typeof operationKey!=="string"||
       !/^[a-zA-Z0-9][a-zA-Z0-9_-]{7,99}$/.test(operationKey))
      throw Error("CV03_N105B_HOST_LIFECYCLE_REQUEST_INVALID");
    if(busy)throw Error("CV03_N105B_HOST_LIFECYCLE_IN_FLIGHT");
    busy=true;
    try{
      // Host operator check occurs before ANY authority or Manager mutation.
      // A missing/throwing Provider is a denial, never a fallback to ALLOW.
      if(await input.authorizeHostOperator(operation)!==true)
        throw Error("CV03_N105B_HOST_LIFECYCLE_OPERATOR_DENIED");
      // The real Host package contains DEFAULT enterprise-context, resource,
      // definitions and template providers *besides* optional Saved Views.
      // AppManagerService.disable/uninstall() affects the WHOLE package, not
      // one Feature. Never let a Saved View-specific DENY cut destroy those
      // unrelated platform abilities, even if the defaults are inactive.
      const manifests=input.manager.listCatalog().filter(x=>x.packageId===packageId);
      if(manifests.length!==1||manifests[0].features.length!==1||
         manifests[0].features[0]?.featureId!==featureId)
        throw Error("CV03_N105B_HOST_LIFECYCLE_SHARED_PACKAGE_UNSAFE");
      const before=input.manager.getSnapshot();
      const beforeInstalled=before.installedPackages.find(x=>x.packageId===packageId);
      const beforeFeatures=before.activeFeatures.filter(x=>x.packageId===packageId)
        .map(x=>x.featureId).sort();
      if(beforeFeatures.some(id=>id!==featureId))
        throw Error("CV03_N105B_HOST_LIFECYCLE_SHARED_PACKAGE_UNSAFE");
      const installed=before.installedPackages.some(x=>x.packageId===packageId);
      const active=before.activeFeatures.some(x=>
        x.packageId===packageId&&x.featureId===featureId);
      if(!recovery&&(!installed||!active))
        throw Error("CV03_N105B_HOST_LIFECYCLE_UNADMITTED_FEATURE");
      // Only the exact Saved View Feature may use this opt-in removal.
      // For disable, if it is already absent after a crash, no local work
      // is needed; uninstall still removes any remaining package metadata.
      const needsMutation=operation==="DISABLE"?active:installed;
      if(needsMutation){
        const plan=operation==="DISABLE"?
          input.manager.planDisable(packageId):
          input.manager.planUninstall(packageId);
        if(plan.blockers.length)
          throw Error("CV03_N105B_HOST_LIFECYCLE_PLAN_BLOCKED");
        if(plan.deactivateFeatures.length!==1||
           plan.deactivateFeatures[0]!==featureId||
           (operation==="UNINSTALL"&&
             (plan.uninstallPackages.length!==1||
              plan.uninstallPackages[0]!==packageId)))
          throw Error("CV03_N105B_HOST_LIFECYCLE_SHARED_PACKAGE_UNSAFE");
      }
      // Exactly ONE DB transaction must revoke the complete authority scope.
      // Failure or partial/tampered result MUST NOT invoke local Manager.
      const receipt=await input.authority.fencePackage({
        operationKey,sourceGeneration:input.sourceGeneration,operation
      });
      if(!receipt||receipt.sourceGeneration!==input.sourceGeneration||
         typeof receipt.outboxBatchId!=="string"||
         receipt.outboxBatchId.length<8||
         typeof receipt.fenceId!=="string"||receipt.fenceId.length<8||
         !Number.isSafeInteger(receipt.scopesFenced)||
         receipt.scopesFenced<0||typeof receipt.replayed!=="boolean")
        throw Error("CV03_N105B_HOST_LIFECYCLE_FENCE_UNVERIFIABLE");
      // A concurrent local lifecycle change needs independent reconciliation.
      // DB DENY is persistent; NEVER roll it back if Manager fails.
      const after=input.manager.getSnapshot();
      const afterInstalled=after.installedPackages.find(x=>x.packageId===packageId);
      const afterFeatures=after.activeFeatures.filter(x=>x.packageId===packageId)
        .map(x=>x.featureId).sort();
      if(JSON.stringify(afterInstalled)!==JSON.stringify(beforeInstalled)||
         JSON.stringify(afterFeatures)!==JSON.stringify(beforeFeatures))
        throw Error("CV03_N105B_HOST_LIFECYCLE_LOCAL_DRIFT");
      if(needsMutation){
        if(operation==="DISABLE")input.manager.disable(packageId);
        else input.manager.uninstall(packageId);
      }
      return input.manager.getSnapshot();
    }finally{busy=false;}
  }
  return {
    apply:(operation,key)=>execute(operation,key,false),
    recover:(operation,key)=>execute(operation,key,true)
  };
}
