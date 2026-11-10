/**
 * N1-04i: real PA05 FileLifecycleStore single-operation disk failure
 * atomicity, independent of deprecated legacy Manager fixture assertions.
 * No PostgreSQL connection or production migration.
 */
import test from "node:test";
import assert from "node:assert/strict";
import {mkdtempSync,mkdirSync,rmSync,readFileSync} from "node:fs";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {createFileLifecycleStore}
  from "../../dist/manager/store.js";

test("N1-04i PA05 file lifecycle I/O failure preserves live and reopened state",()=>{
  const dir=mkdtempSync(join(tmpdir(),"cv03-n104i-file-atomic-"));
  const file=join(dir,"lifecycle.json");
  const installed={packageId:"cv03-n104i-fixture",version:"0.1.0",
    installedAt:"2026-11-10T05:00:00.000Z"};
  const feature={featureId:"cv03-n104i-fixture.default",
    packageId:installed.packageId,version:"0.1.0",
    activatedAt:"2026-11-10T05:00:00.000Z"};
  try{
    const store=createFileLifecycleStore(file);
    store.saveInstalledPackage(installed);
    store.saveActiveFeature(feature);
    const before=store.snapshot(),durable=readFileSync(file,"utf8");
    // A crash-orphaned cooperating-writer lock must fail closed. It must
    // never be silently stolen or treated as an authorization override.
    mkdirSync(file+".lifecycle-write.lock");
    const changes=[
      ()=>store.saveInstalledPackage({...installed,version:"0.2.0"}),
      ()=>store.deleteInstalledPackage(installed.packageId),
      ()=>store.saveActiveFeature({...feature,version:"0.2.0"}),
      ()=>store.deleteActiveFeature(feature.featureId)
    ];
    for(const change of changes){
      assert.throws(change,/LIFECYCLE_STATE_WRITE_LOCKED/);
      assert.deepEqual(store.snapshot(),before,
        "live Manager must not observe a failed file commit");
      assert.equal(readFileSync(file,"utf8"),durable,
        "original durable file must remain byte-identical");
      assert.deepEqual(createFileLifecycleStore(file).snapshot(),before,
        "a new Host process must see exactly the original state");
    }
    rmSync(file+".lifecycle-write.lock",{recursive:true,force:true});
    store.deleteActiveFeature(feature.featureId);
    assert.equal(store.getActiveFeature(feature.featureId),undefined);
    assert.equal(createFileLifecycleStore(file).getActiveFeature(feature.featureId),
      undefined,"successful removal survives Host restart");
    console.log("CV03_N104I_FILE_LIFECYCLE_IO_ROLLBACK_AND_RESTART=PASS");
  }finally{rmSync(dir,{recursive:true,force:true});}
});
