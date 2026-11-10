/**
 * CV03 N1-04k: real FileLifecycleStore cooperative writer fencing.
 *
 * This tests actual disk + a separate Node child process. It does not
 * provide or certify a distributed PostgreSQL/PA05 authorization authority.
 */
import test from "node:test";
import assert from "node:assert/strict";
import {
  mkdtempSync,readFileSync,writeFileSync,rmSync,symlinkSync,
  existsSync,lstatSync
} from "node:fs";
import {spawnSync} from "node:child_process";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {createFileLifecycleStore}
  from "../../dist/manager/store.js";

const saved={packageId:"cv03-n104k-owner",version:"0.1.0",
  installedAt:"2026-11-10T06:00:00.000Z"};
const active={featureId:"cv03-n104k-owner.default",
  packageId:saved.packageId,version:"0.1.0",
  activatedAt:"2026-11-10T06:00:00.000Z"};
function fixture(){
  const dir=mkdtempSync(join(tmpdir(),"cv03-n104k-coop-"));
  return {dir,file:join(dir,"lifecycle.json"),
    dispose:()=>rmSync(dir,{recursive:true,force:true})};
}

test("N1-04k cooperating instances refuse stale Feature ALLOW after another revokes",()=>{
  const f=fixture();
  try {
    const a=createFileLifecycleStore(f.file);
    a.saveInstalledPackage(saved);
    a.saveActiveFeature(active);
    const b=createFileLifecycleStore(f.file);
    const before=readFileSync(f.file,"utf8");
    a.deleteActiveFeature(active.featureId);
    assert.equal(a.getActiveFeature(active.featureId),undefined);
    assert.notEqual(readFileSync(f.file,"utf8"),before);
    assert.throws(()=>b.saveActiveFeature(active),
      /LIFECYCLE_STATE_STALE_WRITER_REOPEN_REQUIRED/,
      "stale writer must not resurrect a revoked Feature");
    assert.throws(()=>b.snapshot(),/LIFECYCLE_STATE_REOPEN_REQUIRED/,
      "stale instance must stop serving cached lifecycle authority");
    assert.equal(createFileLifecycleStore(f.file)
      .getActiveFeature(active.featureId),undefined);
    assert.equal(existsSync(f.file+".lifecycle-write.lock"),false,
      "a normal transaction releases its own cooperative writer lock");
    console.log("CV03_N104K_STALE_FEATURE_ALLOW_REPLAY_DENIED=PASS");
  }finally{f.dispose();}
});

test("N1-04k separate Node process revoke fences already-open parent writer",()=>{
  const f=fixture();
  try{
    const parent=createFileLifecycleStore(f.file);
    parent.saveInstalledPackage(saved);
    parent.saveActiveFeature(active);
    const script=[
      "import {createFileLifecycleStore} from './dist/manager/store.js';",
      "const store=createFileLifecycleStore(process.argv[1]);",
      "store.deleteActiveFeature(process.argv[2]);"
    ].join("\n");
    const child=spawnSync(process.execPath,["--input-type=module",
      "-e",script,f.file,active.featureId],{
      cwd:process.cwd(),encoding:"utf8",timeout:12000,
      env:{PATH:process.env.PATH??"",HOME:f.dir}
    });
    assert.equal(child.status,0,
      "isolated child process must perform real file-backed revocation");
    assert.equal(createFileLifecycleStore(f.file)
      .getActiveFeature(active.featureId),undefined);
    assert.throws(()=>parent.saveActiveFeature(active),
      /LIFECYCLE_STATE_STALE_WRITER_REOPEN_REQUIRED/);
    assert.throws(()=>parent.getActiveFeature(active.featureId),
      /LIFECYCLE_STATE_REOPEN_REQUIRED/);
    console.log("CV03_N104K_CROSS_PROCESS_STALE_WRITER_FENCED=PASS");
  }finally{f.dispose();}
});

test("N1-04k legacy .tmp symlink cannot overwrite unrelated file",()=>{
  const f=fixture();
  try{
    const store=createFileLifecycleStore(f.file);
    store.saveInstalledPackage(saved);
    const victim=join(f.dir,"victim-untouched.txt");
    writeFileSync(victim,"DO_NOT_OVERWRITE");
    // The previous fixed <state>.tmp path was vulnerable to following a
    // preplaced symlink. New exclusive random staging never opens this path.
    symlinkSync(victim,f.file+".tmp");
    store.saveActiveFeature(active);
    assert.equal(readFileSync(victim,"utf8"),"DO_NOT_OVERWRITE");
    assert.ok(lstatSync(f.file+".tmp").isSymbolicLink(),
      "the preexisting legacy symlink must not be touched or followed");
    assert.equal(createFileLifecycleStore(f.file)
      .getActiveFeature(active.featureId).featureId,active.featureId);
    console.log("CV03_N104K_EXCLUSIVE_RANDOM_STAGE_SYMLINK_SAFE=PASS");
  }finally{f.dispose();}
});

test("N1-04k symlinked cooperative lock fails closed without touching target",()=>{
  const f=fixture();
  try{
    const store=createFileLifecycleStore(f.file);
    store.saveInstalledPackage(saved);
    const victim=join(f.dir,"target.txt");
    writeFileSync(victim,"DO_NOT_TOUCH");
    symlinkSync(victim,f.file+".lifecycle-write.lock");
    const before=readFileSync(f.file,"utf8");
    assert.throws(()=>store.deleteInstalledPackage(saved.packageId),
      /LIFECYCLE_STATE_WRITE_LOCKED/);
    assert.equal(readFileSync(victim,"utf8"),"DO_NOT_TOUCH");
    assert.equal(readFileSync(f.file,"utf8"),before);
    assert.throws(()=>store.getInstalledPackage(saved.packageId),
      /LIFECYCLE_STATE_READ_LOCKED_RETRY/,
      "a malicious/orphaned writer lock must not allow stale cached permissions");
    assert.ok(lstatSync(f.file+".lifecycle-write.lock").isSymbolicLink());
    rmSync(f.file+".lifecycle-write.lock");
    assert.ok(store.getInstalledPackage(saved.packageId),
      "a verified unaffected snapshot becomes readable after lock removal");
    console.log("CV03_N104K_LOCK_SYMLINK_FAIL_CLOSED=PASS");
  }finally{f.dispose();}
});

test("N1-04k symlinked authority file cannot be loaded as Host state",()=>{
  const f=fixture();
  try{
    const victim=join(f.dir,"target.json");
    writeFileSync(victim,JSON.stringify({
      contractVersion:"0.1.0",installedPackages:[saved],
      activeFeatures:[active]
    }));
    symlinkSync(victim,f.file);
    assert.throws(()=>createFileLifecycleStore(f.file),
      /ELOOP|EACCES|EPERM|LIFECYCLE_STATE_UNTRUSTED_FILE/,
      "do not allow swapped Host lifecycle symlink to impersonate authority");
    assert.ok(lstatSync(f.file).isSymbolicLink());
    console.log("CV03_N104K_SYMLINKED_AUTHORITY_FILE_DENIED=PASS");
  }finally{f.dispose();}
});
