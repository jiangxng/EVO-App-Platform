import test from "node:test";
import assert from "node:assert/strict";
import {spawnSync} from "node:child_process";
import {randomUUID} from "node:crypto";
import {
  chmodSync, existsSync, mkdtempSync, readFileSync, rmSync, statSync, symlinkSync,
  writeFileSync
} from "node:fs";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {createPa05PrestartupAuditJournalV010}
  from "../../dist/manager/pa05-read-owner-prestartup-audit.js";

test("E01J4H fsynced non-secret audit retains authorization across OS SIGKILL and fails closed",{
  timeout:20000,skip:process.platform==="win32"?"POSIX filesystem guarantees required":false
}, async()=>{
  const dir=mkdtempSync(join(tmpdir(),"pa05-j4h-"));
  const file=join(dir,"prestart-events.jsonl");
  const hostId="read-host-a";
  const event={
    stage:"AUTHORIZED",principalId:"human:operator",
    sessionId:"operator-session",hostId,
    operation:"UNINSTALL",packageId:"evo-purchase-attention"
  };
  try{
    const code=`import {createPa05PrestartupAuditJournalV010} from "./dist/manager/pa05-read-owner-prestartup-audit.js";
const journal=createPa05PrestartupAuditJournalV010({filePath:process.env.PA05_TEST_AUDIT_PATH,hostId:"read-host-a"});
await journal.append({stage:"AUTHORIZED",principalId:"human:operator",sessionId:"operator-session",hostId:"read-host-a",operation:"UNINSTALL",packageId:"evo-purchase-attention"});
process.kill(process.pid,"SIGKILL");`;
    const child=spawnSync(process.execPath,["--input-type=module","-e",code],{
      cwd:process.cwd(),encoding:"utf8",timeout:12000,
      env:{...process.env,PA05_TEST_AUDIT_PATH:file}
    });
    assert.equal(child.signal,"SIGKILL",child.stderr);
    assert.equal(child.status,null,child.stderr);
    assert.equal(existsSync(file),true);
    assert.equal(statSync(file).mode&0o077,0);
    const lines=()=>readFileSync(file,"utf8").trim().split("\n").map(JSON.parse);
    const first=lines();
    assert.equal(first.length,1);
    assert.equal(first[0].stage,"AUTHORIZED");
    assert.match(first[0].eventId,/^[0-9a-f-]{36}$/);
    assert.equal(first[0].contractVersion,"0.1.0");
    // Fsynced first event survives process death, without a false COMPLETE.
    const fresh=createPa05PrestartupAuditJournalV010({filePath:file,hostId});
    await fresh.append({...event,stage:"COMPLETED"});
    const both=lines();
    assert.deepEqual(both.map(x=>x.stage),["AUTHORIZED","COMPLETED"]);
    assert.equal(new Set(both.map(x=>x.eventId)).size,2);
    const auditText=readFileSync(file,"utf8");
    assert.equal(auditText.includes("postgres://"),false);
    assert.equal(auditText.includes("Bearer "),false);
    assert.equal(auditText.includes("test-password"),false);
    await assert.rejects(fresh.append({...event,hostId:"wrong-host"}),
      /PA05_J4H_AUDIT_EVENT_INVALID/);
    await assert.rejects(fresh.append({...event,principalId:"postgres:\/\/password"}),
      /PA05_J4H_AUDIT_PRINCIPAL_INVALID/);
    assert.equal(lines().length,2);
    const symlinkPath=join(dir,"audit-link.jsonl");
    symlinkSync(file,symlinkPath);
    await assert.rejects(
      createPa05PrestartupAuditJournalV010({filePath:symlinkPath,hostId}).append(event),
      /PA05_J4H_AUDIT_UNAVAILABLE/);
    chmodSync(file,0o644);
    await assert.rejects(fresh.append(event),/PA05_J4H_AUDIT_UNAVAILABLE/);
    chmodSync(file,0o600);
    chmodSync(dir,0o777);
    await assert.rejects(fresh.append(event),/PA05_J4H_AUDIT_UNAVAILABLE/);
    chmodSync(dir,0o700);
    await fresh.append(event);
    assert.equal(lines().length,3);
    console.log("PA05_E01J4H_DURABLE_AUDIT="+JSON.stringify({
      actualOsCrash:true,authorizedEventSurvivesSigkill:true,
      completionNeverInferredFromAuthorization:true,
      completedEventDistinctAfterRestart:true,strictFile0600:true,
      symlinkDenied:true,unsafeFileAndDirectoryDenied:true,
      wrongHostAndFreeTextRejected:true,noSecretsRecorded:true,
      actualProductionOperatorIdentityCertified:false,
      centralDistributedAuditCertified:false,
      multiWorkerAtomicityCertified:false,pa05Signed:false
    }));
  }finally{chmodSync(dir,0o700);rmSync(dir,{recursive:true,force:true});}
});
