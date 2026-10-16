import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

import {createPackageCatalog} from "../../dist/catalog/catalog.js";
import {createAppManagerService} from "../../dist/manager/service.js";
import {createMemoryLifecycleStore} from "../../dist/manager/store.js";
import {createAppActionRouter} from "../../dist/actions/router.js";
import {createCapabilityOperationActionPreExecuteV010}
  from "../../dist/manager/capability-operation-access.js";
import {createOnDemandHostReadAdmissionV010}
  from "../../dist/manager/on-demand-host-read-admission.js";
import {tradingReferencePackageV010}
  from "../../dist/apps/trading-reference/package.js";
import {
  PURCHASE_OPERATIONS_READ_COMMAND_V010,
  PURCHASE_OPERATIONS_READ_OPERATION_V010,
  TRADING_REFERENCE_PACKAGE_ID_V010,
  TRADING_REFERENCE_FEATURE_ID_V010
} from "../../dist/apps/trading-reference/constants.js";

const targetId="evo-purchase-attention";
const operationId="purchase.attention.read";
const sourceId=PURCHASE_OPERATIONS_READ_COMMAND_V010;
const refs={orderNo:"PO-E01C",supplierCounterpartyId:"sup",
  itemId:"product",warehouseId:"wh"};
const context=(actor="HUMAN")=>({
  contractVersion:"0.1.0",
  principal:{contractVersion:"0.1.0",subjectId:"e01c-"+actor,
    actorType:actor,identityProviderId:"e01c-test",
    sessionId:"e01c-"+actor},
  scope:{contractVersion:"0.1.0",enterpriseId:"ent-e01c",
    userId:"e01c-"+actor},
  context:{activeContext:{kind:"ENTERPRISE",
    contextId:"enterprise:ent-e01c",enterpriseId:"ent-e01c"}},
  correlationId:"pa05-e01c"
});
const request=()=>({
  contractVersion:"0.1.0",type:"command",
  command:{code:operationId,inputVersion:"0.1.0"},
  values:refs,sourceInteractionId:"e01c",actionId:"read",
  requiresConfirmation:false
});
function setup() {
  let authorized=false;
  let modelLoads=0;
  let sourceCalls=0;
  let approvalCalls=0;
  let policyDenied=false;
  const catalog=createPackageCatalog([tradingReferencePackageV010]);
  const manager=createAppManagerService(catalog,createMemoryLifecycleStore());
  const policy={providerId:"pa05.e01c.test-policy",async check(x){
    const allowed=!policyDenied
      && x.scope.enterpriseId==="ent-e01c"
      && (x.action===operationId
        ||x.action===PURCHASE_OPERATIONS_READ_OPERATION_V010);
    return {contractVersion:"0.1.0",policyProviderId:this.providerId,
      allowed,reasonCodes:allowed?[]:["PA05_E01C_POLICY_DENIED"]};
  }};
  const sourceHandler={
    packageId:TRADING_REFERENCE_PACKAGE_ID_V010,
    featureId:TRADING_REFERENCE_FEATURE_ID_V010,
    commandCode:sourceId,
    async execute(req){
      sourceCalls++;
      return {ok:true,result:{
        contractVersion:"0.1.0",
        projectionId:"trading-reference.purchase-operations",
        enterpriseId:"evo-e01c",orderNo:req.values.orderNo,
        references:{
          supplierCounterpartyId:req.values.supplierCounterpartyId,
          itemId:req.values.itemId,warehouseId:req.values.warehouseId
        },
        pendingPurchaseQuantity:2,payableAmount:17,
        openWork:{receive:{quantity:2},pay:{amount:17}}
      }};
    }
  };
  const router=createAppActionRouter(
    [sourceHandler],
    featureId=>manager.getSnapshot().activeFeatures
      .some(f=>f.featureId===featureId),
    createCapabilityOperationActionPreExecuteV010({
      manager,resolveAuthorizationProvider:()=>policy
    })
  );
  const make=overrides=>createOnDemandHostReadAdmissionV010({
    catalog,router,expectedPackageId:targetId,
    expectedOperationId:operationId,expectedCommandCode:operationId,
    async authorizeHostAdmission(){approvalCalls++;return authorized;},
    async load(){
      modelLoads++;
      // Actual dynamic import is inside an invocation callback, not a
      // top-level Host dependency. The independent E01B Owner remains real.
      const mod=await import("../../dist/apps/purchase-attention/host-optin.js");
      return {manifest:mod.purchaseAttentionPackageV010,
        handler:mod.createPurchaseAttentionHostActionHandlerV010({
          resolveSourceRouter:()=>router,
          resolveAuthorizationProvider:()=>policy
        })};
    },...overrides
  });
  return {catalog,manager,router,make,
    allow(value){authorized=value;},
    denyPolicy(value){policyDenied=value;},
    counts(){return {modelLoads,sourceCalls,approvalCalls};},
    sourceHandler};
}

test("E01C: untrusted activation never invokes dynamic loader or changes catalog",async()=>{
  const f=setup(),a=f.make();
  await assert.rejects(a.admit(),/ON_DEMAND_HOST_ADMISSION_DENIED/);
  assert.equal(f.counts().modelLoads,0);
  assert.equal(f.catalog.get(targetId),undefined);
  assert.equal(f.router.hasHandler(operationId),false);
  assert.ok(f.manager.planInstall(targetId).blockers
    .some(b=>b.code==="PACKAGE_NOT_FOUND"));
});

test("E01C: authorized on-demand registration is not installation or execution",async()=>{
  const f=setup(),a=f.make();f.allow(true);
  await a.admit();
  assert.equal(f.counts().modelLoads,1);
  assert.equal(f.router.hasHandler(operationId),true);
  assert.equal(f.catalog.get(targetId).packageId,targetId);
  const denied=await f.router.execute(request(),context());
  assert.equal(denied.ok,false);
  assert.equal(denied.error.code,"ACTION_FEATURE_NOT_ACTIVE");
  assert.equal(f.counts().sourceCalls,0);
  assert.ok(f.manager.planInstall(targetId).installPackages.includes(targetId));
});

test("E01C: explicit install retains source dependency and Human/Agent actual Owner parity",async()=>{
  const f=setup(),a=f.make();f.allow(true);
  await a.admit();
  f.manager.install(targetId);
  const h=await f.router.execute(request(),context("HUMAN"));
  const ai=await f.router.execute(request(),context("AI"));
  assert.equal(h.ok,true,JSON.stringify(h.error));
  assert.equal(ai.ok,true,JSON.stringify(ai.error));
  assert.deepEqual(h.result,ai.result);
  assert.deepEqual(h.result.attentionFlags,["RECEIVE_PENDING","PAYMENT_PENDING"]);
  assert.equal(f.counts().sourceCalls,2);
  f.denyPolicy(true);
  const stopped=await f.router.execute(request(),context("AI"));
  assert.equal(stopped.ok,false);
  assert.equal(f.counts().sourceCalls,2);
  f.denyPolicy(false);
  f.manager.disable(targetId);
  const disabled=await f.router.execute(request(),context());
  assert.equal(disabled.error.code,"ACTION_FEATURE_NOT_ACTIVE");
  assert.equal(f.counts().sourceCalls,2);
});

test("E01C: revalidation after a delayed import blocks revoked Host authority",async()=>{
  const f=setup();f.allow(true);
  let unblock;
  const gate=new Promise(resolve=>{unblock=resolve;});
  const a=f.make({async load(){
    await gate;
    const mod=await import("../../dist/apps/purchase-attention/host-optin.js");
    return {manifest:mod.purchaseAttentionPackageV010,
      handler:mod.createPurchaseAttentionHostActionHandlerV010({
        resolveSourceRouter:()=>f.router,
        resolveAuthorizationProvider:()=>undefined
      })};
  }});
  const pending=a.admit();await Promise.resolve();f.allow(false);unblock();
  await assert.rejects(pending,/ON_DEMAND_HOST_ADMISSION_REVOKED|ON_DEMAND_HOST_ADMISSION_DENIED/);
  assert.equal(f.catalog.get(targetId),undefined);
  assert.equal(f.router.hasHandler(operationId),false);
});

test("E01C: forged handler and extra WRITE operation fail before any mutation",async()=>{
  const f=setup();f.allow(true);
  const mod=await import("../../dist/apps/purchase-attention/host-optin.js");
  const correct=()=>mod.createPurchaseAttentionHostActionHandlerV010({
    resolveSourceRouter:()=>f.router,resolveAuthorizationProvider:()=>undefined
  });
  const badHandler=f.make({load:async()=>({
    manifest:mod.purchaseAttentionPackageV010,
    handler:{...correct(),packageId:"evil-owner"}
  })});
  await assert.rejects(badHandler.admit(),
    /ON_DEMAND_HOST_OPERATION_HANDLER_REJECTED/);
  assert.equal(f.catalog.get(targetId),undefined);
  const added=structuredClone(mod.purchaseAttentionPackageV010);
  added.features[0].contributions.push(
    {...added.features[0].contributions[0],
      operation:{...added.features[0].contributions[0].operation,
        operationId:"malicious.write",effect:"WRITE",
        binding:{type:"ACTION_HOST",commandCode:"malicious.write",inputVersion:"0.1.0"}}}
  );
  const extra=f.make({load:async()=>({manifest:added,handler:correct()})});
  await assert.rejects(extra.admit(),
    /ON_DEMAND_HOST_OPERATION_HANDLER_REJECTED|ON_DEMAND_HOST_MANIFEST_REJECTED/);
  assert.equal(f.catalog.get(targetId),undefined);
});

test("E01C: collisions and repeat registration never replace trusted code",async()=>{
  const f=setup();f.allow(true);
  const existing=f.router.registerHandler;
  assert.throws(()=>f.router.registerHandler(f.sourceHandler),
    /DUPLICATE_ACTION_HANDLER/);
  const a=f.make();await a.admit();
  await assert.rejects(a.admit(),/ON_DEMAND_HOST_ALREADY_REGISTERED/);
  assert.equal(f.router.hasHandler(sourceId),true);
  assert.equal(f.router.hasHandler(operationId),true);
  assert.ok(existing);
});

test("E01C: concurrent caller authorization cannot ride another approved activation",async()=>{
  const f=setup();f.allow(true);
  let release;
  const waiting=new Promise(resolve=>release=resolve);
  const a=f.make({async load(){
    await waiting;
    const mod=await import("../../dist/apps/purchase-attention/host-optin.js");
    return {manifest:mod.purchaseAttentionPackageV010,
      handler:mod.createPurchaseAttentionHostActionHandlerV010({
        resolveSourceRouter:()=>f.router,resolveAuthorizationProvider:()=>undefined
      })};
  }});
  const trusted=a.admit();
  await Promise.resolve();
  f.allow(false);
  await assert.rejects(a.admit(),/ON_DEMAND_HOST_ADMISSION_DENIED/);
  f.allow(true);release();
  await trusted;
  assert.equal(f.catalog.get(targetId).packageId,targetId);
});

test("E01C: runtime addition has no production Host startup imports or signoff",()=>{
  const host=readFileSync(new URL("../../manager/server.ts",import.meta.url),"utf8");
  assert.equal(host.includes("on-demand-host-read-admission"),false);
  assert.equal(host.includes("purchaseAttentionPackageV010"),false);
  console.log("PA05_E01C_ON_DEMAND_HOST_ADMISSION="+JSON.stringify({
    trustedOperatorAdmissionRequired:true,
    loaderDeferredUntilApproval:true,revocationAfterLoadFailsClosed:true,
    actualCatalogAndOriginalRouterRuntimeRegistration:true,
    explicitAppManagerInstallationRequired:true,
    defaultHostUnchanged:true,productionHostWiring:false,
    liveHumanProviderCertified:false,productionWriteEnabled:false
  }));
});
