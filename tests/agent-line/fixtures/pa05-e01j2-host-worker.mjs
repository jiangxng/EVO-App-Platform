import {createPa05AuthenticatedReadHostV010}
  from "../../../dist/manager/pa05-read-owner-authenticated-host.js";
import {createAppActionRouter} from "../../../dist/actions/router.js";
import {createPackageCatalog} from "../../../dist/catalog/catalog.js";
import {createAppManagerService} from "../../../dist/manager/service.js";
import {createMemoryLifecycleStore} from "../../../dist/manager/store.js";
import {createCapabilityOperationActionPreExecuteV010}
  from "../../../dist/manager/capability-operation-access.js";
import {tradingReferencePackageV010}
  from "../../../dist/apps/trading-reference/package.js";
import {createPurchaseOperationalReadActionHandlerV010}
  from "../../../dist/apps/trading-reference/operational-actions.js";
import {createPurchaseOperationalProjectionServiceV010}
  from "../../../dist/apps/trading-reference/operational-projection.js";
import {createPurchaseAttentionHostActionHandlerV010,purchaseAttentionPackageV010}
  from "../../../dist/apps/purchase-attention/host-optin.js";

const gate=createPa05AuthenticatedReadHostV010({
  connectionString:process.env.PA05_E01J2_HOST_SQL_URL,
  schema:process.env.PA05_E01J2_SCHEMA
});
const send=(type,value={})=>process.send?.({type,...value});
const ids={orderNo:"PO-E01J2",supplierCounterpartyId:"supplier-j2",
  itemId:"item-j2",warehouseId:"warehouse-j2"};
const dims={order_no:ids.orderNo,supplier:ids.supplierCounterpartyId,
  product_id:ids.itemId,warehouse:ids.warehouseId};
const manager=createAppManagerService(createPackageCatalog([
  tradingReferencePackageV010,purchaseAttentionPackageV010
]),process.env.PA05_E01J4_STATE_FILE
  ? createFileLifecycleStore(process.env.PA05_E01J4_STATE_FILE)
  : createMemoryLifecycleStore());
if(!manager.getSnapshot().installedPackages.some(p=>p.packageId==="evo-purchase-attention")){
  // A disposable first launch only, never proof of production install consent.
  manager.install("evo-purchase-attention");
}
const auth={providerId:"pa05.e01j2.disposable-policy",async check(input){
  const allowed=input.scope.enterpriseId==="host-e01j2"
    && (input.resource.id===undefined || input.resource.id===ids.orderNo)
    && ["purchase.attention.read","trading-reference.purchase-operations.read"]
      .includes(input.action);
  return {contractVersion:"0.1.0",policyProviderId:this.providerId,
    allowed,reasonCodes:allowed?[]:["DENY"]};
}};
const resolveAuthorizationProvider=()=>auth;
let pauseSource=false,release,activePid=0,sourceCalls=0;
const service=createPurchaseOperationalProjectionServiceV010({
  reader:{
    async listOpenWorkItems(enterprise){
      sourceCalls++;
      if(enterprise!=="evo-e01j2")throw Error("WRONG_SOURCE_SCOPE");
      if(pauseSource){
        send("held",{pid:process.pid,backendPid:activePid});
        await new Promise(resolve=>{release=resolve;});
        pauseSource=false;
      }
      return {complete:true,items:[
        {sourceLedgerCode:"pending_purchase",workType:"RECEIVE",
          dimensions:dims,quantity:2},
        {sourceLedgerCode:"payable",workType:"PAY",
          dimensions:{order_no:ids.orderNo,supplier:ids.supplierCounterpartyId,
            product_id:ids.itemId},amount:15}
      ]};
    },
    async readLedgerBalances(enterprise,code,dimensions){
      sourceCalls++;
      if(enterprise!=="evo-e01j2")throw Error("WRONG_SOURCE_SCOPE");
      return {complete:true,items:[{dimensions,
        quantity:code==="pending_purchase"?2:0,
        amount:code==="payable"?15:0}]};
    }
  },resolveAuthorizationProvider
});
const sourceHandler=createPurchaseOperationalReadActionHandlerV010({
  service,resolveEvoEnterpriseId(ctx){
    if(ctx.scope.enterpriseId!=="host-e01j2")
      throw Error("WRONG_HOST_SCOPE");
    return "evo-e01j2";
  }
});
let router;
const target=createPurchaseAttentionHostActionHandlerV010({
  resolveSourceRouter:()=>router,resolveAuthorizationProvider
});
router=createAppActionRouter([sourceHandler,target],featureId=>
  manager.listEffectiveCapabilityOperations().some(x=>x.featureId===featureId),
  createCapabilityOperationActionPreExecuteV010({
    manager,resolveAuthorizationProvider
  })
);
const context={
  contractVersion:"0.1.0",
  principal:{contractVersion:"0.1.0",subjectId:"human-j2",
    actorType:"HUMAN",identityProviderId:"pa05.e01j2.disposable",
    sessionId:"disposable-j2"},
  scope:{contractVersion:"0.1.0",enterpriseId:"host-e01j2",userId:"human-j2"},
  context:{activeContext:{contractVersion:"0.1.0",kind:"ENTERPRISE",
    contextId:"enterprise:host-e01j2",enterpriseId:"host-e01j2"}},
  correlationId:"pa05-e01j2"
};
const request={
  contractVersion:"0.1.0",type:"command",
  command:{code:"purchase.attention.read",inputVersion:"0.1.0"},
  values:ids,sourceInteractionId:"pa05.e01j2.disposable",
  actionId:"purchase-attention.read",requiresConfirmation:false
};
send("ready",{pid:process.pid});
process.on("message",async msg=>{
  try{
    if(msg.type==="release"){
      release?.();
      return;
    }
    if(msg.type==="close"){
      release?.();
      await gate.close();
      send("closed");
      process.exit(0);
    }
    if(msg.type==="snapshot"){
      const snapshot=manager.getSnapshot();
      send("localState",{installed:snapshot.installedPackages.some(p=>
        p.packageId==="evo-purchase-attention"),active:snapshot.activeFeatures.some(f=>
        f.featureId==="evo-purchase-attention.default")});
      return;
    }
    if(msg.type==="enable"){
      manager.enable("evo-purchase-attention");
      send("enabled");
      return;
    }
    if(msg.type==="disable") {
      manager.disable("evo-purchase-attention");
      send("disabled");
      return;
    }
    if(msg.type==="read" || msg.type==="hold" || msg.type==="terminate"){
      pauseSource=msg.type!=="read";
      const value=await gate.withReadAdmission({
        expectedEpoch:msg.epoch,
        async perform(verifiedHostId,sqlBackendPid){
          activePid=sqlBackendPid;
          const answer=await router.execute(request,context);
          if(!answer.ok)throw Error(answer.error?.code??"ACTION_DENIED");
          return {verifiedHostId,sqlBackendPid,answer:answer.result};
        }
      });
      send("readResult",{value,sourceCalls});
    }
  }catch(e){
    send("readDenied",{message:String(e?.message??e),sourceCalls});
  }
});
