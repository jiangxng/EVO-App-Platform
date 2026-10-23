import {createPackageCatalog} from "../../../dist/catalog/catalog.js";
import {createAppManagerService} from "../../../dist/manager/service.js";
import {createFileLifecycleStore} from "../../../dist/manager/store.js";
import {tradingReferencePackageV010} from "../../../dist/apps/trading-reference/package.js";
import {purchaseAttentionPackageV010} from "../../../dist/apps/purchase-attention/package.js";
import {createPa05ReadLifecyclePgAuthorityV010}
  from "../../../dist/manager/pa05-read-owner-lifecycle-pg.js";
import {recoverPa05ReadOwnerPrestartupUninstallV010}
  from "../../../dist/manager/pa05-read-owner-prestartup-recovery.js";

/** E01J4F disposable OS operator simulation ONLY.
 * A test env flag does not certify actual production operator identity. */
const stateFile=process.env.PA05_J4F_TEST_STATE_FILE;
const dbUrl=process.env.PA05_J4F_TEST_DATABASE_URL;
const schema=process.env.PA05_J4F_TEST_SCHEMA;
const hostId=process.env.PA05_J4F_TEST_HOST_ID;
const manager=createAppManagerService(createPackageCatalog([
  tradingReferencePackageV010,purchaseAttentionPackageV010
]),createFileLifecycleStore(stateFile));
const authority=createPa05ReadLifecyclePgAuthorityV010({
  connectionString:dbUrl,schema,hostId
});
try{
  const recoveryAuthority=process.env.PA05_J4F_TEST_CRASH_BEFORE_COMPLETE
    ? {...authority,async complete(){
        process.kill(process.pid,"SIGKILL");
      }} : authority;
  const restored=await recoverPa05ReadOwnerPrestartupUninstallV010({
    manager,authority:recoveryAuthority,
    async authorizeHostOperator(){
      return process.env.PA05_J4F_TEST_AUTHORIZED==="explicit-test-only-yes";
    }
  });
  console.log("PA05_J4F_REPAIR_PROCESS="+JSON.stringify({
    installed:restored.installedPackages.some(x=>x.packageId==="evo-purchase-attention"),
    active:restored.activeFeatures.some(x=>x.packageId==="evo-purchase-attention"),
    simulatedOperatorOnly:true,productionIdentityCertified:false
  }));
}catch(e){
  console.error("PA05_J4F_REPAIR_DENIED:"+
    (e instanceof Error?e.message:String(e)));
  process.exitCode=1;
}finally{await authority.close();}
