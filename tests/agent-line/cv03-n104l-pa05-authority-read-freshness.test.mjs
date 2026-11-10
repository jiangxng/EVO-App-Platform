/**
 * CV-03 N1-04l — real PA05 on-demand local lifecycle read freshness.
 * Exactly the normal FileLifecycleStore + Manager code paths, with an
 * independent child process for the grant/revoke conflict.
 * NOT a SQL authority, KMS, or distributed cross-Worker linearizability test.
 */
import test from "node:test";
import assert from "node:assert/strict";
import {mkdtempSync,mkdirSync,rmSync,readFileSync,writeFileSync}
  from "node:fs";
import {spawnSync} from "node:child_process";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {createFileLifecycleStore}
  from "../../dist/manager/store.js";
import {createAppManagerService}
  from "../../dist/manager/service.js";
import {createPackageCatalog}
  from "../../dist/catalog/catalog.js";
import {hostEnterpriseContextProviderPackage}
  from "../../dist/providers/enterprise-context/package.js";
import {personalSavedViewsOptInFeatureV010}
  from "../../dist/providers/enterprise-context/personal-saved-views.js";

const owner="cv03-n104l-fixture";
const featureId="cv03-n104l-fixture.default";
function fresh(){
  const dir=mkdtempSync(join(tmpdir(),"cv03-n104l-read-freshness-"));
  return {dir,path:join(dir,"lifecycle.json"),
    remove:()=>rmSync(dir,{recursive:true,force:true})};
}
const installed={packageId:owner,version:"0.1.0",
  installedAt:"2026-11-10T06:00:00.000Z"};
const feature={packageId:owner,featureId,
  activatedAt:"2026-11-10T06:00:00.000Z"};
function revokeInChild(path,featureId){
  const script=[
    "import {createFileLifecycleStore} from './dist/manager/store.js';",
    "createFileLifecycleStore(process.argv[1]).deleteActiveFeature(process.argv[2]);"
  ].join("\n");
  const child=spawnSync(process.execPath,[
    "--input-type=module","-e",script,path,featureId
  ],{cwd:process.cwd(),encoding:"utf8",timeout:12000,
    env:{HOME:tmpdir(),PATH:process.env.PATH??""}});
  assert.equal(child.status,0,child.stderr);
}

test("N1-04l separate process revoke immediately fences old Feature READ without writes",()=>{
  const f=fresh();
  try{
    const old=createFileLifecycleStore(f.path);
    old.saveInstalledPackage(installed);
    old.saveActiveFeature(feature);
    assert.equal(old.getActiveFeature(featureId).featureId,featureId);
    const byteBefore=readFileSync(f.path,"utf8");
    revokeInChild(f.path,featureId);
    assert.notEqual(readFileSync(f.path,"utf8"),byteBefore);
    assert.throws(()=>old.getActiveFeature(featureId),
      /LIFECYCLE_STATE_STALE_READER_REOPEN_REQUIRED/,
      "old read-side cached ALLOW is not acceptable after real disk revoke");
    assert.throws(()=>old.getInstalledPackage(owner),
      /LIFECYCLE_STATE_REOPEN_REQUIRED/,
      "entire old instance is quarantined, not just one Feature");
    assert.throws(()=>old.snapshot(),/LIFECYCLE_STATE_REOPEN_REQUIRED/);
    const reopened=createFileLifecycleStore(f.path);
    assert.equal(reopened.getActiveFeature(featureId),undefined);
    assert.equal(reopened.getInstalledPackage(owner).packageId,owner);
    console.log("CV03_N104L_CROSS_PROCESS_READ_SIDE_REVOKE_DENY=PASS");
  }finally{f.remove();}
});

test("N1-04l real PA05 Manager CapabilityOperation cannot read stale Feature after child revoke",()=>{
  const f=fresh();
  try{
    const hostPkg={...hostEnterpriseContextProviderPackage,
      features:[...hostEnterpriseContextProviderPackage.features,
        personalSavedViewsOptInFeatureV010]};
    const manager=createAppManagerService(createPackageCatalog([hostPkg]),
      createFileLifecycleStore(f.path));
    manager.install(hostPkg.packageId);
    const op="collection.saved-view.personal.save";
    assert.ok(manager.listEffectiveCapabilityOperations().some(x=>x.operationId===op));
    revokeInChild(f.path,personalSavedViewsOptInFeatureV010.featureId);
    assert.throws(()=>manager.listEffectiveCapabilityOperations(),
      /LIFECYCLE_STATE_STALE_READER_REOPEN_REQUIRED/,
      "real Manager must not serve a stale Capability Operation without writing");
    const restarted=createAppManagerService(createPackageCatalog([hostPkg]),
      createFileLifecycleStore(f.path));
    assert.ok(!restarted.listEffectiveCapabilityOperations()
      .some(x=>x.operationId===op));
    console.log("CV03_N104L_REAL_PA05_MANAGER_CAPABILITY_READ_DENY=PASS");
  }finally{f.remove();}
});

test("N1-04l held writer lock temporarily denies all reads without falsely changing state",()=>{
  const f=fresh();
  try{
    const old=createFileLifecycleStore(f.path);
    old.saveInstalledPackage(installed);
    old.saveActiveFeature(feature);
    const before=old.snapshot();
    mkdirSync(f.path+".lifecycle-write.lock");
    assert.throws(()=>old.getActiveFeature(featureId),
      /LIFECYCLE_STATE_READ_LOCKED_RETRY/);
    assert.throws(()=>old.getInstalledPackage(owner),
      /LIFECYCLE_STATE_READ_LOCKED_RETRY/);
    assert.throws(()=>old.snapshot(),/LIFECYCLE_STATE_READ_LOCKED_RETRY/);
    rmSync(f.path+".lifecycle-write.lock",{recursive:true,force:true});
    assert.deepEqual(old.snapshot(),before,
      "failed or completed no-op writer lock must not poison a still-fresh reader");
    console.log("CV03_N104L_INFLIGHT_WRITER_READ_FAIL_CLOSED=PASS");
  }finally{f.remove();}
});

test("N1-04l non-cooperating same-inode data edit is not missed by stat equality",()=>{
  const f=fresh();
  try{
    const old=createFileLifecycleStore(f.path);
    old.saveInstalledPackage(installed);
    old.saveActiveFeature(feature);
    const raw=readFileSync(f.path,"utf8");
    const modified=raw.replace('"0.1.0"','"0.2.0"');
    assert.equal(modified.length,raw.length);
    writeFileSync(f.path,modified,"utf8"); // same inode, no lock
    assert.throws(()=>old.snapshot(),/LIFECYCLE_STATE_STALE_READER_REOPEN_REQUIRED/);
    assert.throws(()=>old.getActiveFeature(featureId),
      /LIFECYCLE_STATE_REOPEN_REQUIRED/);
    console.log("CV03_N104L_SAME_INODE_CONTENT_CHANGE_FENCED=PASS");
  }finally{f.remove();}
});

test("N1-04l corrupt or deleted persisted authority cannot fall back to cached ALLOW",()=>{
  for(const mode of ["CORRUPT","MISSING"]){
    const f=fresh();
    try{
      const old=createFileLifecycleStore(f.path);
      old.saveInstalledPackage(installed);
      old.saveActiveFeature(feature);
      const prior=readFileSync(f.path,"utf8");
      if(mode==="CORRUPT") writeFileSync(f.path,"{bad json");
      else rmSync(f.path);
      assert.throws(()=>old.getActiveFeature(featureId),
        mode==="CORRUPT"?/LIFECYCLE_STATE_READ_UNAVAILABLE_REOPEN_REQUIRED/:
          /LIFECYCLE_STATE_STALE_READER_REOPEN_REQUIRED/);
      // Even if bytes are restored, a quarantined old Manager must reopen.
      writeFileSync(f.path,prior);
      assert.throws(()=>old.snapshot(),/LIFECYCLE_STATE_REOPEN_REQUIRED/);
      console.log("CV03_N104L_CORRUPT_OR_MISSING_AUTHORITY_"+mode+"=PASS");
    }finally{f.remove();}
  }
});
