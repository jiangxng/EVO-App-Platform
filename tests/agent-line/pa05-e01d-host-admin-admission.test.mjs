import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createPackageCatalog} from "../../dist/catalog/catalog.js";
import {createAppManagerService} from "../../dist/manager/service.js";
import {createMemoryLifecycleStore} from "../../dist/manager/store.js";
import {createAppActionRouter} from "../../dist/actions/router.js";
import {createOnDemandHostReadAdmissionV010}
  from "../../dist/manager/on-demand-host-read-admission.js";
import {
  authenticateBootstrapAdministratorV010,
  authorizeProviderAdministrationV010
} from "../../dist/manager/provider-governance.js";
import {tradingReferencePackageV010}
  from "../../dist/apps/trading-reference/package.js";

const pkg="evo-purchase-attention";
const op="purchase.attention.read";
const action="host.plugin.read.admit";
const configuredToken="test-only-bootstrap-admin";
const resource={type:"plugin-package",id:pkg,
  attributes:{effect:"READ",admission:"REGISTER_ONLY"}};

function fixture(){
  const catalog=createPackageCatalog([tradingReferencePackageV010]);
  const manager=createAppManagerService(catalog,createMemoryLifecycleStore());
  const router=createAppActionRouter([],featureId=>
    manager.getSnapshot().activeFeatures.some(f=>f.featureId===featureId));
  let secret;
  let policyAllowed=true;
  let providerAvailable=true;
  let imports=0;
  let grants=0;
  const provider={providerId:"e01d-test-policy",async check(req){
    grants++;
    const allow=policyAllowed && req.action===action
      &&req.resource.type===resource.type &&req.resource.id===pkg
      &&req.resource.attributes?.admission==="REGISTER_ONLY"
      &&req.principal.subjectId==="bootstrap-admin";
    return {contractVersion:"0.1.0",allowed:allow,
      policyProviderId:this.providerId,
      reasonCodes:allow?[]:["HOST_OPERATOR_NOT_GRANTED"]};
  }};
  const decision=()=>authorizeProviderAdministrationV010(
    authenticateBootstrapAdministratorV010(secret,configuredToken),
    providerAvailable?provider:undefined,{action,resource});
  const gate=createOnDemandHostReadAdmissionV010({
    catalog,router,expectedPackageId:pkg,expectedOperationId:op,
    expectedCommandCode:op,
    async authorizeHostAdmission(){return (await decision()).allowed;},
    async load(){
      imports++;
      const x=await import("../../dist/apps/purchase-attention/host-optin.js");
      return {manifest:x.purchaseAttentionPackageV010,
        handler:x.createPurchaseAttentionHostActionHandlerV010({
          resolveSourceRouter:()=>router,
          resolveAuthorizationProvider:()=>provider
        })};
    }
  });
  return {catalog,manager,router,gate,decision,
    token(value){secret=value;},policy(value){policyAllowed=value;},
    provider(value){providerAvailable=value;},
    stats(){return {imports,grants}}};
}

test("E01D: no bootstrap token and wrong bearer token never load plugin",async()=>{
  const f=fixture();
  await assert.rejects(f.gate.admit(),/ON_DEMAND_HOST_ADMISSION_DENIED/);
  assert.equal((await f.decision()).reason,"PROVIDER_ADMIN_AUTH_REQUIRED");
  f.token("wrong");
  await assert.rejects(f.gate.admit(),/ON_DEMAND_HOST_ADMISSION_DENIED/);
  assert.equal((await f.decision()).reason,"PROVIDER_ADMIN_AUTH_INVALID");
  assert.equal(f.stats().imports,0);
  assert.equal(f.catalog.get(pkg),undefined);
});

test("E01D: token alone never substitutes missing Host policy and live Provider",async()=>{
  const f=fixture();f.token(configuredToken);
  f.policy(false);
  assert.equal((await f.decision()).allowed,false);
  await assert.rejects(f.gate.admit(),/ON_DEMAND_HOST_ADMISSION_DENIED/);
  f.policy(true);f.provider(false);
  assert.equal((await f.decision()).reason,"AUTHORIZATION_PROVIDER_UNAVAILABLE");
  await assert.rejects(f.gate.admit(),/ON_DEMAND_HOST_ADMISSION_DENIED/);
  assert.equal(f.stats().imports,0);
});

test("E01D: independent valid policy permits REGISTER_ONLY, not install or execution",async()=>{
  const f=fixture();f.token(configuredToken);
  assert.equal((await f.decision()).allowed,true);
  await f.gate.admit();
  assert.equal(f.stats().imports,1);
  assert.equal(f.catalog.get(pkg).packageId,pkg);
  assert.equal(f.router.hasHandler(op),true);
  assert.equal(f.manager.getSnapshot().installedPackages
    .some(x=>x.packageId===pkg),false);
  const plan=f.manager.planInstall(pkg);
  assert.deepEqual(plan.blockers,[]);
  assert.ok(plan.installPackages.includes(pkg));
  assert.ok(plan.installPackages.includes(tradingReferencePackageV010.packageId));
  await assert.rejects(f.gate.admit(),/ON_DEMAND_HOST_ALREADY_REGISTERED/);
});

test("E01D: Host policy revocation after approval and before import result fails closed",async()=>{
  const f=fixture();f.token(configuredToken);
  // Mirror authorized API: re-check in core after an asynchronously loaded
  // module; no package or handler can be visible after policy removal.
  let release;
  const waiting=new Promise(resolve=>release=resolve);
  let check=0;
  const second=createOnDemandHostReadAdmissionV010({
    catalog:f.catalog,router:f.router,
    expectedPackageId:pkg,expectedOperationId:op,
    expectedCommandCode:op,
    async authorizeHostAdmission(){
      check++;
      return (await f.decision()).allowed;
    },
    async load(){
      await waiting;
      const mod=await import("../../dist/apps/purchase-attention/host-optin.js");
      return {manifest:mod.purchaseAttentionPackageV010,
        handler:mod.createPurchaseAttentionHostActionHandlerV010({
          resolveSourceRouter:()=>f.router,resolveAuthorizationProvider:()=>undefined
        })};
    }
  });
  const pending=second.admit();await Promise.resolve();
  await new Promise(resolve=>setImmediate(resolve));
  f.policy(false);release();
  await assert.rejects(pending,/ON_DEMAND_HOST_ADMISSION_REVOKED|ON_DEMAND_HOST_ADMISSION_DENIED/);
  assert.equal(f.catalog.get(pkg),undefined);
  assert.equal(f.router.hasHandler(op),false);
  assert.ok(check>=2);
});

test("E01D: server entrypoint is opt-in, allowlisted, bounded and deferred",()=>{
  const host=readFileSync(new URL("../../manager/server.ts",import.meta.url),"utf8");
  assert.match(host,/APP_PLATFORM_PA05_E01D_ADMIN_READ_ADMISSION/);
  assert.match(host,/pa05E01dAdminMode !== "OPT_IN"/);
  assert.match(host,/PA05_E01D_ADMIN_MODE_INVALID/);
  assert.match(host,/\/v1\/admin\/pa05\/read-plugin\/admit/);
  assert.match(host,/authorizeHostAdministration\(/);
  assert.match(host,/"host\.plugin\.read\.admit"/);
  assert.match(host,/readJsonLimited\(request, 4096\)/);
  assert.match(host,/\.confirmed !== true/);
  assert.match(host,/await import\("\.\/on-demand-host-read-admission\.js"\)/);
  assert.match(host,/await import\("\.\.\/apps\/purchase-attention\/host-optin\.js"\)/);
  assert.match(host,/stage: "AVAILABLE_NOT_INSTALLED"/);
  assert.doesNotMatch(host,/bootstrapActivation\("INSTALL", "evo-purchase-attention"/);
  console.log("PA05_E01D_ADMIN_HOST_ADMISSION="+JSON.stringify({
    defaultEnabled:false,bootstrapTokenAndLiveAuthorizationRequired:true,
    boundedBodyAndExplicitConfirmation:true,allowlistedFirstPartyRead:true,
    deferredImportWithinAuthenticatedRequest:true,
    adminAdmissionOnlyNotInstallation:true,
    realProductionCredentialsOrHumanCertified:false,
    productionWriteEnabled:false
  }));
});
