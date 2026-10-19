import test from "node:test";
import assert from "node:assert/strict";
import {mkdtempSync,writeFileSync,chmodSync,symlinkSync,existsSync,
  unlinkSync,rmSync,readFileSync} from "node:fs";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {createPackageCatalog} from "../../dist/catalog/catalog.js";
import {purchaseAttentionPackageV010}
  from "../../dist/apps/purchase-attention/package.js";
import {recoverPa05OneShotHostPrestartupV010}
  from "../../dist/manager/pa05-read-owner-one-shot-prestartup.js";

test("E01J4I original file, opt-in and exclusive one-shot gate deny before Secrets/SQL",{
  skip:process.platform==="win32"?"POSIX-only one-shot audit filesystem":false
},async()=>{
  const priorUmask=process.umask(0o077);
  const dir=mkdtempSync(join(tmpdir(),"pa05-j4i-"));
  const stateFile=join(dir,"state.json");
  const auditFile=join(dir,"audit.jsonl");
  const lockFile=stateFile+".pa05-one-shot.lock";
  let secretCalls=0, policyCalls=0, authCalls=0;
  const params={
    mode:"OPT_IN",hostId:"read-host-a",schema:"pa05_isolated",
    catalog:createPackageCatalog([purchaseAttentionPackageV010]),
    stateFile,auditFile,bearerToken:"expired-or-unknown",
    sessionProvider:{providerId:"reference-session",resolve(){
      authCalls++;return undefined;
    }},
    authorizationProvider:{providerId:"policy-provider",check(){
      policyCalls++;throw Error("never");
    }},
    secretsProvider:{providerId:"secrets-provider",resolve(){
      secretCalls++;throw Error("postgres://secret-operator");
    },describe(){return {configured:false};}}
  };
  const original=JSON.stringify({
    contractVersion:"0.1.0",installedPackages:[],activeFeatures:[]
  })+"\n";
  async function denied(override={},code="PA05_J4I_PRESTART_DENIED_OR_UNKNOWN"){
    await assert.rejects(recoverPa05OneShotHostPrestartupV010({
      ...params,...override
    }),err=>{
      assert.equal(err.message,code);
      assert.equal(err.message.includes("postgres://"),false);
      assert.equal(err.message.includes(stateFile),false);
      return true;
    });
  }
  try{
    await denied({mode:"OFF"},"PA05_J4I_PRESTART_CONFIGURATION_INVALID");
    process.umask(0o022);
    await denied({},"PA05_J4I_PRESTART_CONFIGURATION_INVALID");
    process.umask(0o077);
    await denied({auditFile:join(tmpdir(),"other-file.jsonl")},
      "PA05_J4I_PRESTART_CONFIGURATION_INVALID");
    await denied(); // No existing durable state: never create an empty one.
    assert.equal(existsSync(stateFile),false);
    assert.equal(existsSync(lockFile),false);
    writeFileSync(stateFile,original,{mode:0o600});
    chmodSync(stateFile,0o644);
    await denied();
    chmodSync(stateFile,0o600);
    chmodSync(dir,0o777);
    await denied();
    chmodSync(dir,0o700);
    writeFileSync(lockFile,"held",{mode:0o600});
    await denied();
    assert.equal(readFileSync(lockFile,"utf8"),"held");
    unlinkSync(lockFile);
    await denied(); // Fails on unknown bearer, before secrets or mutation.
    assert.equal(authCalls,1);
    assert.equal(policyCalls,0);
    assert.equal(secretCalls,0);
    assert.equal(existsSync(lockFile),false);
    assert.equal(existsSync(auditFile),false);
    assert.equal(readFileSync(stateFile,"utf8"),original);
    const alias=join(dir,"state-link.json");
    symlinkSync(stateFile,alias);
    await denied({stateFile:alias});
    assert.equal(existsSync(alias+".pa05-one-shot.lock"),false);
    assert.equal(readFileSync(stateFile,"utf8"),original);
    writeFileSync(stateFile,"{not json");
    await denied();
    assert.equal(existsSync(lockFile),false);
    assert.equal(secretCalls,0);
    console.log("PA05_E01J4I_ONE_SHOT_DENIAL="+JSON.stringify({
      defaultUnwired:true,missingPersistedStateDenied:true,
      worldReadableStateDenied:true,insecureDirectoryDenied:true,
      concurrentLockDenied:true,symlinkStateDenied:true,
      corruptStateDenied:true,invalidOperatorBeforeSqlDenied:true,
      noSecretResolutionOnFailure:true,noAuditBeforeOperatorProof:true,
      noServerOrAgentRoute:true,productionOperatorIdpCertified:false,
      operatorMaintenanceCliDelivered:false,
      distributedHostOfflineCertified:false,pa05Signed:false
    }));
  }finally{
    process.umask(priorUmask);
    chmodSync(dir,0o700);
    rmSync(dir,{recursive:true,force:true});
  }
});
