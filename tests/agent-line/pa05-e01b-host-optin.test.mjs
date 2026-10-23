import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

import {createAppActionRouter} from "../../dist/actions/router.js";
import {createPackageCatalog} from "../../dist/catalog/catalog.js";
import {createAppManagerService} from "../../dist/manager/service.js";
import {createMemoryLifecycleStore} from "../../dist/manager/store.js";
import {createCapabilityOperationActionPreExecuteV010}
  from "../../dist/manager/capability-operation-access.js";
import {tradingReferencePackageV010}
  from "../../dist/apps/trading-reference/package.js";
import {createPurchaseOperationalReadActionHandlerV010}
  from "../../dist/apps/trading-reference/operational-actions.js";
import {createPurchaseOperationalProjectionServiceV010}
  from "../../dist/apps/trading-reference/operational-projection.js";
import {PURCHASE_OPERATIONS_READ_OPERATION_V010}
  from "../../dist/apps/trading-reference/constants.js";
import {createPurchaseAttentionHostActionHandlerV010,
  purchaseAttentionPackageV010}
  from "../../dist/apps/purchase-attention/host-optin.js";
import {PURCHASE_ATTENTION_COMMAND_V010,
  PURCHASE_ATTENTION_FEATURE_ID_V010,
  PURCHASE_ATTENTION_OPERATION_V010,
  PURCHASE_ATTENTION_PACKAGE_ID_V010}
  from "../../dist/apps/purchase-attention/package.js";

const ids={
  orderNo:"PO-E01B", supplierCounterpartyId:"supplier-e01b",
  itemId:"item-e01b", warehouseId:"warehouse-e01b"
};
const dims={
  order_no:ids.orderNo,supplier:ids.supplierCounterpartyId,
  product_id:ids.itemId,warehouse:ids.warehouseId
};
function request(){
  return {contractVersion:"0.1.0",type:"command",
    command:{code:PURCHASE_ATTENTION_COMMAND_V010,inputVersion:"0.1.0"},
    values:ids,sourceInteractionId:"pa05.e01b.host",actionId:"read",
    requiresConfirmation:false};
}
function principal(actor){
  const subjectId=actor==="HUMAN"?"human-e01b":"agent-e01b";
  return {
    contractVersion:"0.1.0",
    principal:{
      contractVersion:"0.1.0",subjectId,actorType:actor,
      identityProviderId:"pa05.e01b.fixture",sessionId:"fixture-"+actor
    },
    scope:{contractVersion:"0.1.0",enterpriseId:"host-e01b",userId:subjectId},
    context:{activeContext:{
      contractVersion:"0.1.0",kind:"ENTERPRISE",
      contextId:"enterprise:host-e01b",enterpriseId:"host-e01b"
    }},
    correlationId:"pa05-e01b-"+actor
  };
}
function composition(){
  // Real first-party package manifests, Host Router and business Owner
  // factories, but a deliberately deterministic Reader/identity adapter.
  // No live production data, sessions or Provider is claimed here.
  const manager=createAppManagerService(createPackageCatalog([
    tradingReferencePackageV010,purchaseAttentionPackageV010
  ]),createMemoryLifecycleStore());
  const state={targetDeny:false,sourceDeny:false,omitPolicy:false,
    sourceCalls:0,authorized:[]};
  const provider={
    providerId:"pa05.e01b.isolated-policy",
    async check(input){
      state.authorized.push([input.principal.actorType,input.action,input.resource.id]);
      const target=input.action===PURCHASE_ATTENTION_OPERATION_V010;
      const source=input.action===PURCHASE_OPERATIONS_READ_OPERATION_V010;
      const allowed=(target||source)&&input.scope.enterpriseId==="host-e01b"
        && (input.resource.id===undefined||input.resource.id===ids.orderNo)
        &&!(target&&state.targetDeny)&&!(source&&state.sourceDeny);
      return {contractVersion:"0.1.0",policyProviderId:this.providerId,
        allowed,reasonCodes:allowed?[]:["PA05_E01B_ACCESS_DENIED"]};
    }
  };
  const resolveAuthorizationProvider=()=>state.omitPolicy?undefined:provider;
  const sourceService=createPurchaseOperationalProjectionServiceV010({
    reader:{
      async listOpenWorkItems(e){
        state.sourceCalls++;
        assert.equal(e,"evo-e01b");
        return {complete:true,items:[
          {sourceLedgerCode:"pending_purchase",workType:"RECEIVE",
            dimensions:dims,quantity:3},
          {sourceLedgerCode:"payable",workType:"PAY",
            dimensions:{order_no:ids.orderNo,supplier:ids.supplierCounterpartyId,
              product_id:ids.itemId},amount:20}
        ]};
      },
      async readLedgerBalances(e,code,dimensions){
        state.sourceCalls++;
        assert.equal(e,"evo-e01b");
        return {complete:true,items:[{dimensions,
          quantity:code==="inventory"?1:code==="pending_purchase"?3:0,
          amount:code==="payable"?20:code==="inventory"?5:0}]};
      }
    },
    resolveAuthorizationProvider
  });
  const sourceHandler=createPurchaseOperationalReadActionHandlerV010({
    service:sourceService,
    resolveEvoEnterpriseId(ctx){
      if(ctx.scope.enterpriseId!=="host-e01b")
        throw Error("PA05_E01B_ENTERPRISE_BINDING_DENIED");
      return "evo-e01b";
    }
  });
  let router;
  const target=createPurchaseAttentionHostActionHandlerV010({
    resolveSourceRouter:()=>router,
    resolveAuthorizationProvider
  });
  router=createAppActionRouter([sourceHandler,target],featureId=>
    manager.listEffectiveCapabilityOperations().some(op=>op.featureId===featureId),
    createCapabilityOperationActionPreExecuteV010({
      manager,resolveAuthorizationProvider
    })
  );
  return {manager,router,state,target,sourceHandler};
}

test("E01B: Host opt-in adapter is real lazy and does not auto-install a package",async()=>{
  const f=composition();
  assert.equal(f.target.packageId,PURCHASE_ATTENTION_PACKAGE_ID_V010);
  assert.equal(f.target.featureId,PURCHASE_ATTENTION_FEATURE_ID_V010);
  const result=await f.router.execute(request(),principal("HUMAN"));
  assert.equal(result.ok,false);
  assert.equal(result.error.code,"ACTION_FEATURE_NOT_ACTIVE");
  assert.equal(f.state.sourceCalls,0);
  assert.equal(f.manager.listEffectiveCapabilityOperations()
    .some(x=>x.operationId===PURCHASE_ATTENTION_OPERATION_V010),false);
  assert.ok(f.manager.planInstall(PURCHASE_ATTENTION_PACKAGE_ID_V010)
    .installPackages.includes(tradingReferencePackageV010.packageId));
});

test("E01B: admin-installed opt-in plugin uses SAME Router, real source Owner, both Human and Agent",async()=>{
  const f=composition();
  f.manager.install(PURCHASE_ATTENTION_PACKAGE_ID_V010);
  const human=await f.router.execute(request(),principal("HUMAN"));
  const agent=await f.router.execute(request(),principal("AI"));
  assert.equal(human.ok,true,JSON.stringify(human.error));
  assert.equal(agent.ok,true,JSON.stringify(agent.error));
  assert.deepEqual(human.result,agent.result);
  assert.deepEqual(human.result.attentionFlags,["RECEIVE_PENDING","PAYMENT_PENDING"]);
  assert.equal(human.result.pendingPurchaseQuantity,3);
  assert.equal(human.result.payableAmount,20);
  for(const actor of ["HUMAN","AI"]){
    assert.ok(f.state.authorized.some(x=>x[0]===actor
      &&x[1]===PURCHASE_ATTENTION_OPERATION_V010));
    assert.ok(f.state.authorized.some(x=>x[0]===actor
      &&x[1]===PURCHASE_OPERATIONS_READ_OPERATION_V010));
  }
  assert.equal(f.state.sourceCalls,8);
});

test("E01B: source authorization denial cannot be bypassed by attention Handler",async()=>{
  const f=composition();
  f.manager.install(PURCHASE_ATTENTION_PACKAGE_ID_V010);
  f.state.sourceDeny=true;
  const result=await f.router.execute(request(),principal("AI"));
  assert.equal(result.ok,false);
  assert.equal(result.error.code,"PURCHASE_ATTENTION_SOURCE_UNAVAILABLE");
  assert.equal(f.state.sourceCalls,0);
  f.state.sourceDeny=false;
  f.state.targetDeny=true;
  const denied=await f.router.execute(request(),principal("HUMAN"));
  assert.equal(denied.ok,false);
  assert.equal(f.state.sourceCalls,0);
});

test("E01B: missing authorization Provider and disabled Feature both reject without owner read",async()=>{
  const f=composition();
  f.manager.install(PURCHASE_ATTENTION_PACKAGE_ID_V010);
  f.state.omitPolicy=true;
  const missing=await f.router.execute(request(),principal("HUMAN"));
  assert.equal(missing.ok,false);
  assert.equal(f.state.sourceCalls,0);
  f.state.omitPolicy=false;
  assert.ok(f.manager.planDisable(tradingReferencePackageV010.packageId)
    .blockers.some(x=>x.code==="ACTIVE_DEPENDENT_CAPABILITY"));
  f.manager.disable(PURCHASE_ATTENTION_PACKAGE_ID_V010);
  const disabled=await f.router.execute(request(),principal("AI"));
  assert.equal(disabled.ok,false);
  assert.equal(f.state.sourceCalls,0);
});

test("E01B: unsupported tenant is denied without crossing EVO reader boundary",async()=>{
  const f=composition();
  f.manager.install(PURCHASE_ATTENTION_PACKAGE_ID_V010);
  const altered=structuredClone(principal("HUMAN"));
  altered.scope.enterpriseId="another-enterprise";
  altered.context.activeContext.enterpriseId="another-enterprise";
  const result=await f.router.execute(request(),altered);
  assert.equal(result.ok,false);
  assert.equal(f.state.sourceCalls,0);
});

test("E01B: default Host remains unchanged; adapter only composes out of band",()=>{
  const source=readFileSync(new URL("../../manager/server.ts",import.meta.url),"utf8");
  // CI's lightweight-Host dependency ratchet rejects even a startup
  // conditional dynamic import. The real server must remain unchanged.
  assert.doesNotMatch(source,/APP_PLATFORM_PA05_E01_PURCHASE_ATTENTION_HOST/);
  assert.match(source,/pa05E01dAdminMode !== "OPT_IN"/);
  assert.match(source,/await import\("\.\.\/apps\/purchase-attention\/host-optin\.js"\)/);
  assert.doesNotMatch(source,/^import .*purchase-attention/m);
  assert.doesNotMatch(source,/installBusinessDefaultOnce\(PURCHASE_ATTENTION/);
  console.log("PA05_E01B_HOST_OPTIN="+JSON.stringify({
    defaultHostUnchanged:true,pluginOwnedLazyAdapterReady:true,
    sourceRouterReused:true,sourceAndTargetRightsIndependentlyChecked:true,
    installRemainsExplicit:true,realProductionInstallationVerified:false,
    liveHumanProviderCertified:false,productionWriteEnabled:false
  }));
});
