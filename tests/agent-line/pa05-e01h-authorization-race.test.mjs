import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createPackageCatalog} from "../../dist/catalog/catalog.js";
import {createAppManagerService} from "../../dist/manager/service.js";
import {createMemoryLifecycleStore} from "../../dist/manager/store.js";
import {tradingReferencePackageV010}
  from "../../dist/apps/trading-reference/package.js";
import {purchaseAttentionPackageV010}
  from "../../dist/apps/purchase-attention/package.js";
import {
  pa05ProtectedReadLifecycleImpactV010,
  pa05AuthorizeStableProtectedReadLifecycleV010
} from "../../dist/manager/pa05-protected-read-lifecycle-impact.js";

const protectedId="evo-purchase-attention";
const dependentId="evo-pa05-e01h-dependent-fixture";
function scenario(){
  const dependent=structuredClone(purchaseAttentionPackageV010);
  dependent.packageId=dependentId;
  dependent.features=[{
    ...dependent.features[0],
    packageId:dependentId,
    featureId:dependentId+".default",
    requiresCapabilities:["purchase.attention"],
    providesCapabilities:["pa05.e01h.fixture"],
    contributions:[]
  }];
  const manager=createAppManagerService(
    createPackageCatalog([
      tradingReferencePackageV010,purchaseAttentionPackageV010,dependent
    ]),
    createMemoryLifecycleStore()
  );
  const read=(packageId=dependentId,operation="INSTALL")=>
    pa05ProtectedReadLifecycleImpactV010({
      manager,requestedPackageId:packageId,protectedPackageId:protectedId,
      operation
    });
  return {manager,read};
}

test("E01H: revoked policy between first and second Host checks denies, no installed mutation",async()=>{
  const f=scenario();
  let approvals=0;
  const before=f.manager.getSnapshot();
  const allowed=await pa05AuthorizeStableProtectedReadLifecycleV010({
    readImpact:()=>f.read(),
    async authorize(){approvals++;return approvals===1;}
  });
  assert.equal(allowed,false);
  assert.equal(approvals,2);
  assert.deepEqual(f.manager.getSnapshot(),before);
});

test("E01H: real AppManager plan changed while FIRST policy await is pending fails closed",async()=>{
  const f=scenario();
  let release;
  const pending=new Promise(resolve=>{release=resolve;});
  let entered;
  const enteredPromise=new Promise(resolve=>{entered=resolve;});
  let approvals=0;
  const gate=pa05AuthorizeStableProtectedReadLifecycleV010({
    readImpact:()=>f.read(),
    async authorize(){
      approvals++;entered();
      await pending;
      return true;
    }
  });
  await enteredPromise;
  assert.equal(f.read(),"TRANSITIVE_INSTALL");
  f.manager.install(protectedId);
  f.manager.disable(protectedId);
  assert.equal(f.read(),"TRANSITIVE_ACTIVATION");
  release();
  assert.equal(await gate,false);
  assert.equal(approvals,1);
});

test("E01H: plan drifts during SECOND fresh policy decision also denies",async()=>{
  const f=scenario();
  let approvals=0;
  const allowed=await pa05AuthorizeStableProtectedReadLifecycleV010({
    readImpact:()=>f.read(),
    async authorize(){
      approvals++;
      if(approvals===2){
        f.manager.install(protectedId);
        f.manager.disable(protectedId);
      }
      return true;
    }
  });
  assert.equal(approvals,2);
  assert.equal(allowed,false);
});

test("E01H: stable direct and transitive approvals require exactly two independent grants",async()=>{
  const f=scenario();
  for(const [requested,operation,expected] of [
    [dependentId,"INSTALL","TRANSITIVE_INSTALL"],
    [protectedId,"DISABLE","DIRECT"]
  ]){
    let approvals=0;
    assert.equal(f.read(requested,operation),expected);
    const accepted=await pa05AuthorizeStableProtectedReadLifecycleV010({
      readImpact:()=>f.read(requested,operation),
      async authorize(){approvals++;return true;}
    });
    assert.equal(accepted,true);
    assert.equal(approvals,2);
  }
  assert.equal(f.manager.getSnapshot().installedPackages
    .some(x=>x.packageId===protectedId),false);
});

test("E01H: denied/throwing authorization and throwing plan fail closed; unaffected packages stay unblocked",async()=>{
  const f=scenario();
  let approvals=0;
  assert.equal(await pa05AuthorizeStableProtectedReadLifecycleV010({
    readImpact:()=>f.read(),
    async authorize(){approvals++;throw Error("provider unavailable");}
  }),false);
  assert.equal(approvals,1);
  assert.equal(await pa05AuthorizeStableProtectedReadLifecycleV010({
    readImpact:()=>{throw Error("stale catalog");},
    async authorize(){throw Error("must not run");}
  }),false);
  let irrelevantApprovals=0;
  assert.equal(await pa05AuthorizeStableProtectedReadLifecycleV010({
    readImpact:()=>f.read("other-plugin","INSTALL"),
    async authorize(){irrelevantApprovals++;return false;}
  }),true);
  assert.equal(irrelevantApprovals,0);
});

test("E01H: Host both policy and dependency are rechecked, without startup module import",()=>{
  const host=readFileSync(new URL("../../manager/server.ts",import.meta.url),"utf8");
  const helper=readFileSync(new URL(
    "../../manager/pa05-protected-read-lifecycle-impact.ts",import.meta.url),"utf8");
  assert.match(host,/pa05AuthorizeStableProtectedReadLifecycleV010/);
  assert.match(host,/await import\("\.\/pa05-protected-read-lifecycle-impact\.js"\)/);
  assert.match(host,/requestedPackageId: packageId/);
  assert.match(host,/authorizeHostAdministration\(/);
  assert.match(helper,/if \(input\.readImpact\(\) !== initial\) return false/);
  assert.match(helper,/return input\.readImpact\(\) === initial/);
  assert.doesNotMatch(host,/^import .*purchase-attention/m);
  console.log("PA05_E01H_AUTHORIZATION_RACE="+JSON.stringify({
    testedRevocationBetweenChecks:true,
    testedPlanDriftDuringFirstAndSecondAwait:true,
    originalAppManagerUsed:true,
    failClosedOnProviderError:true,
    preservedHostDeferredImport:true,
    crossWorkerAtomicityCertified:false,
    realProductionHumanCertified:false,
    productionWriteEnabled:false
  }));
});
