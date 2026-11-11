import type {AppManagerService} from "./service.js";
import type {PlatformSnapshotV010} from "../contracts/package.js";
import type {Cv03N105bPackageFenceAuthorityV010} from
  "./cv03-n105b-authority-t0-pg.js";
import {HOST_ENTERPRISE_CONTEXT_PACKAGE_ID}
  from "../providers/enterprise-context/package.js";
import {CV03_UNCERTIFIED_SAVED_VIEW_FEATURE_ID_V010}
  from "./cv03-personal-saved-view-host-admission.js";

/**
 * N1-05b/04: UNMOUNTED Host-only Feature lifecycle adapter.
 * Preserve the SHARED enterprise-context Package/default providers. A
 * future DBA-owned T0 must persist full-scope Feature DENY + outbox before
 * local Manager.deactivateFeature(), including offline/future subjects.
 * Never wire this to production Host or user/Agent action without Owners.
 * "UNINSTALL" cannot be relabeled as mere Feature deactivation.
 */
export type Cv03N105bHostRemovalV010="DISABLE"|"UNINSTALL";
type Manager=Pick<AppManagerService,
  "listCatalog"|"getSnapshot"|"planDeactivateFeature"|"deactivateFeature">;

export function createCv03N105bPa05HostLifecycleBarrierV010(input:{
  manager:Manager;
  authority:Cv03N105bPackageFenceAuthorityV010;
  authorizeHostOperator(operation:Cv03N105bHostRemovalV010):Promise<boolean>;
  sourceGeneration:string;
}):{
  apply(operation:Cv03N105bHostRemovalV010,operationKey:string):
    Promise<PlatformSnapshotV010>;
  recover(operation:Cv03N105bHostRemovalV010,operationKey:string):
    Promise<PlatformSnapshotV010>;
}{
  if(!input?.manager||!input?.authority||
     typeof input.authority.fencePackage!=="function"||
     typeof input.manager.listCatalog!=="function"||
     typeof input.manager.getSnapshot!=="function"||
     typeof input.manager.planDeactivateFeature!=="function"||
     typeof input.manager.deactivateFeature!=="function"||
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
    if(operation==="UNINSTALL")
      throw Error("CV03_N105B_HOST_FEATURE_UNINSTALL_UNSUPPORTED");
    if(busy)throw Error("CV03_N105B_HOST_LIFECYCLE_IN_FLIGHT");
    busy=true;
    try{
      if(await input.authorizeHostOperator(operation)!==true)
        throw Error("CV03_N105B_HOST_LIFECYCLE_OPERATOR_DENIED");
      const manifests=input.manager.listCatalog()
        .filter(x=>x.packageId===packageId);
      if(manifests.length!==1||
         !manifests[0].features.some(x=>x.featureId===featureId))
        throw Error("CV03_N105B_HOST_LIFECYCLE_FEATURE_MANIFEST_MISSING");
      const before=input.manager.getSnapshot();
      const beforeInstalled=before.installedPackages.find(x=>x.packageId===packageId);
      const beforeFeatures=before.activeFeatures.filter(x=>x.packageId===packageId)
        .map(x=>x.featureId).sort();
      const active=before.activeFeatures.some(x=>
        x.packageId===packageId&&x.featureId===featureId);
      if(!recovery&&(!beforeInstalled||!active))
        throw Error("CV03_N105B_HOST_LIFECYCLE_UNADMITTED_FEATURE");
      if(active){
        const plan=input.manager.planDeactivateFeature(featureId);
        if(plan.blockers.length||plan.packageId!==packageId||
           plan.featureId!==featureId||
           plan.deactivateFeatures.length!==1||
           plan.deactivateFeatures[0]!==featureId)
          throw Error("CV03_N105B_HOST_LIFECYCLE_PLAN_BLOCKED");
      }
      // One proposed OWNER function call, not per-actor partial DENY loops.
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
      // Freeze is durable in the proposed DB; do not revert if local
      // deactivation throws. Reject any same-Package drift after the T0.
      const after=input.manager.getSnapshot();
      const afterInstalled=after.installedPackages.find(x=>x.packageId===packageId);
      const afterFeatures=after.activeFeatures.filter(x=>x.packageId===packageId)
        .map(x=>x.featureId).sort();
      if(JSON.stringify(beforeInstalled)!==JSON.stringify(afterInstalled)||
         JSON.stringify(beforeFeatures)!==JSON.stringify(afterFeatures))
        throw Error("CV03_N105B_HOST_LIFECYCLE_LOCAL_DRIFT");
      if(active)input.manager.deactivateFeature(featureId);
      return input.manager.getSnapshot();
    }finally{busy=false;}
  }
  return {
    apply:(op,key)=>execute(op,key,false),
    recover:(op,key)=>execute(op,key,true)
  };
}
