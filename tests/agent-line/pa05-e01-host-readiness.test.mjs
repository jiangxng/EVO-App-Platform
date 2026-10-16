import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

import {createPackageCatalog} from "../../dist/catalog/catalog.js";
import {createAppManagerService} from "../../dist/manager/service.js";
import {createMemoryLifecycleStore} from "../../dist/manager/store.js";
import {createAppActionRouter} from "../../dist/actions/router.js";
import {tradingReferencePackageV010}
  from "../../dist/apps/trading-reference/package.js";
import {createPurchaseOperationalReadActionHandlerV010}
  from "../../dist/apps/trading-reference/operational-actions.js";
import {PURCHASE_OPERATIONS_READ_OPERATION_V010}
  from "../../dist/apps/trading-reference/constants.js";
import {purchaseAttentionPackageV010,
  PURCHASE_ATTENTION_OPERATION_V010}
  from "../../dist/apps/purchase-attention/package.js";
import {createPurchaseAttentionActionHandlerV010}
  from "../../dist/apps/purchase-attention/operation.js";
import {inspectPa05E01HostReadinessV010}
  from "../../certification/pa05-e01-host-readiness.mjs";

function fixture(){
  const catalog=createPackageCatalog([
    tradingReferencePackageV010,purchaseAttentionPackageV010
  ]);
  const manager=createAppManagerService(catalog,createMemoryLifecycleStore());
  // These are the ACTUAL first-party action factories. No business READ is
  // executed: an isolated fake source is not evidence of production data.
  const sourceHandler=createPurchaseOperationalReadActionHandlerV010({
    service:{async read(){throw Error("PA05_E01_REAL_DATA_NOT_CONFIGURED");}},
    resolveEvoEnterpriseId:()=>{throw Error("PA05_E01_REAL_TENANT_NOT_CONFIGURED");}
  });
  const sourceRouter=createAppActionRouter([sourceHandler],()=>true);
  const attentionHandler=createPurchaseAttentionActionHandlerV010({
    sourceRouter,resolveAuthorizationProvider:()=>undefined
  });
  const inspect=(handlers=[])=>inspectPa05E01HostReadinessV010({
    manager,hostActionHandlers:handlers,
    targetPackageId:purchaseAttentionPackageV010.packageId,
    targetOperationId:PURCHASE_ATTENTION_OPERATION_V010,
    sourcePackageId:tradingReferencePackageV010.packageId,
    sourceOperationId:PURCHASE_OPERATIONS_READ_OPERATION_V010
  });
  return {manager,sourceHandler,attentionHandler,inspect};
}

test("E01A: package manifest alone does not mean actual installation",()=>{
  const f=fixture();
  const report=f.inspect();
  assert.equal(report.hostCompositionReady,false);
  assert.ok(report.blockers.includes("TARGET_OPERATION_NOT_ACTIVE_OR_OWNER_MISMATCH"));
  assert.ok(report.blockers.includes("SOURCE_OPERATION_NOT_ACTIVE_OR_OWNER_MISMATCH"));
  assert.equal(report.e01ProductionCertified,false);
  assert.equal(report.pa05Signed,false);
});

test("E01A: actual manager install activates dependency but does NOT register a Host Action handler",()=>{
  const f=fixture();
  const plan=f.manager.planInstall(purchaseAttentionPackageV010.packageId);
  assert.deepEqual(plan.blockers,[]);
  assert.ok(plan.installPackages.includes(tradingReferencePackageV010.packageId));
  f.manager.install(purchaseAttentionPackageV010.packageId);
  assert.ok(f.manager.listEffectiveCapabilityOperations().some(op=>
    op.operationId===PURCHASE_ATTENTION_OPERATION_V010));
  const report=f.inspect();
  assert.equal(report.hostCompositionReady,false);
  assert.deepEqual(report.blockers,[
    "TARGET_ACTION_HANDLER_NOT_REGISTERED",
    "SOURCE_ACTION_HANDLER_NOT_REGISTERED"
  ]);
  assert.equal(report.productionWriteEnabled,false);
});

test("E01A: missing source handler and mismatched/duplicate ownership never count as integrated",()=>{
  const f=fixture();
  f.manager.install(purchaseAttentionPackageV010.packageId);
  const onlyTarget=f.inspect([f.attentionHandler]);
  assert.deepEqual(onlyTarget.blockers,["SOURCE_ACTION_HANDLER_NOT_REGISTERED"]);
  const wrongOwner=f.inspect([
    f.attentionHandler,
    {...f.sourceHandler,packageId:"an-untrusted-package"}
  ]);
  assert.deepEqual(wrongOwner.blockers,["SOURCE_ACTION_HANDLER_OWNER_MISMATCH"]);
  const duplicates=f.inspect([
    f.attentionHandler,f.attentionHandler,f.sourceHandler
  ]);
  assert.deepEqual(duplicates.blockers,["TARGET_ACTION_HANDLER_CONFLICT"]);
});

test("E01A: two real owner handler factories in isolated Host composition still cannot sign production",()=>{
  const f=fixture();
  f.manager.install(purchaseAttentionPackageV010.packageId);
  const ready=f.inspect([f.attentionHandler,f.sourceHandler]);
  assert.equal(ready.hostCompositionReady,true);
  assert.deepEqual(ready.blockers,[]);
  assert.equal(ready.e01ProductionCertified,false);
  assert.equal(ready.pa05Signed,false);
  assert.equal(ready.productionWriteEnabled,false);
  assert.ok(ready.outstandingRealEnvironmentGates.includes(
    "TWO_INDEPENDENT_AUTHENTICATED_PRINCIPALS"));
  assert.ok(ready.outstandingRealEnvironmentGates.includes(
    "REAL_ENTERPRISE_DATA_AND_TENANT_BINDING"));
  f.manager.disable(purchaseAttentionPackageV010.packageId);
  const disabled=f.inspect([f.attentionHandler,f.sourceHandler]);
  assert.equal(disabled.hostCompositionReady,false);
  assert.ok(disabled.blockers.includes(
    "TARGET_OPERATION_NOT_ACTIVE_OR_OWNER_MISMATCH"));
});

test("E01A: current actual production Host source does not wire purchase-attention",()=>{
  // A source-level negative audit of the precisely versioned Host code.
  // It does NOT inspect Railway, authenticated browser or persisted installs.
  const host=readFileSync(new URL("../../manager/server.ts",import.meta.url),"utf8");
  // E01B adds an explicitly gated, lazy Host registration path. The
  // default remains OFF: catalog exposure alone does not install a plugin.
  assert.ok(host.includes('process.env.APP_PLATFORM_PA05_E01_PURCHASE_ATTENTION_HOST'));
  assert.ok(host.includes('pa05PurchaseAttentionMode === "OPT_IN"'));
  assert.ok(host.includes('optionalPa05PurchaseAttentionHost.createPurchaseAttentionHostActionHandlerV010'));
  assert.equal(host.includes("installBusinessDefaultOnce(PURCHASE_ATTENTION"),false);
  const f=fixture();
  f.manager.install(purchaseAttentionPackageV010.packageId);
  const isolated=f.inspect([f.attentionHandler,f.sourceHandler]);
  console.log("PA05_E01_HOST_COMPOSITION_PREFLIGHT="+JSON.stringify({
    targetPackageId:purchaseAttentionPackageV010.packageId,
    actualOwnerFactoriesInIsolatedFixture:true,
    defaultHostPackageCatalogIncludesTarget:false,
    defaultHostHandlerRegistered:false,
    isolatedHostCompositionReady:isolated.hostCompositionReady,
    e01ProductionCertified:isolated.e01ProductionCertified,
    pa05Signed:isolated.pa05Signed,
    productionWriteEnabled:isolated.productionWriteEnabled
  }));
});

test("E01A: fails closed on untrusted/invalid composition input",()=>{
  const f=fixture();
  assert.throws(()=>inspectPa05E01HostReadinessV010({manager:f.manager,
    hostActionHandlers:null,targetPackageId:"target"}),
    /PA05_E01_PREFLIGHT_TRUSTED_INPUT_REQUIRED/);
  assert.throws(()=>inspectPa05E01HostReadinessV010({manager:f.manager,
    hostActionHandlers:[],targetPackageId:"same",sourcePackageId:"same",
    targetOperationId:"read-a",sourceOperationId:"read-b"}),
    /PA05_E01_PREFLIGHT_SEPARATE_BUSINESS_OWNERS_REQUIRED/);
});
