import test from "node:test";
import assert from "node:assert/strict";
import {
  cpSync,mkdtempSync,mkdirSync,readFileSync,rmSync,writeFileSync
} from "node:fs";
import {tmpdir} from "node:os";
import {dirname,resolve} from "node:path";
import {fileURLToPath} from "node:url";
import {spawnSync} from "node:child_process";
import {CV03_N105A_SOURCE_FILES} from
  "../../tools/cv03-n105a-authority-boundary-preflight.mjs";
import {
  CV03_N105C09_OWNER_GATE_SOURCE_FILES,
  inspectCv03N105c09OwnerEvidenceGate
} from "../../tools/cv03-n105c09-owner-evidence-release-gate.mjs";

const root=resolve(dirname(fileURLToPath(import.meta.url)),"../..");
const executable=resolve(root,"tools/cv03-n105c09-owner-evidence-release-gate.mjs");
const fixture=()=>({
  issue:{
    number:1212,state:"open",
    html_url:"https://github.com/jiangxng/EVO-App-Platform/issues/1212",
    // All five boxes intentionally checked but NO named Owner signoff.
    body:"## Status: PENDING OWNER SIGNOFF — N1=NOT_CERTIFIED\n"+
      Array.from({length:5},(_,i)=>"- [x] Owner category "+(i+1)).join("\n")+
      "\nAPP_PLATFORM_CV03_HUMAN_SAVE_MODE=OFF\n"
  },
  managedDocsPr:{
    number:1184,state:"open",merged_at:null,
    html_url:"https://github.com/jiangxng/EVO-App-Platform/pull/1184"
  }
});
const tempDir=(prefix)=>mkdtempSync(resolve(tmpdir(),prefix));

test("checked Owner issue checkboxes must not count as production authority signoff",()=>{
  const result=inspectCv03N105c09OwnerEvidenceGate(fixture(),{root});
  assert.equal(result.gateStatus,"EXPECTED_BLOCKED_BASELINE",
    JSON.stringify(result.checks));
  assert.equal(result.certification,"NOT_CERTIFIED");
  assert.equal(result.releaseDecision,"DENY_NO_PRODUCTION_OWNER_APPROVED_INTEGRATION");
  assert.equal(result.checkedChecklistItems,5);
  assert.equal(result.uncheckedChecklistItems,0);
  assert.equal(result.checkedBoxesAreApproval,false);
  assert.equal(result.ownerDecision,"NOT_ATTESTED_BY_THIS_GATE");
  assert.equal(result.checks.optionalSqlAuthorityAndLifecycleSeamsUnmounted,true);
  assert.equal(result.checks.humanSaveAdmissionStillHardDenied,true);
});

test("missing or CLOSED Owner issue is drift, not evidence of production approval",()=>{
  const missing=inspectCv03N105c09OwnerEvidenceGate({
    issue:null,managedDocsPr:fixture().managedDocsPr
  },{root});
  assert.equal(missing.gateStatus,"DRIFT_OR_UNVERIFIABLE_REVIEW_REQUIRED");
  const closed=fixture();
  closed.issue.state="closed";
  assert.equal(inspectCv03N105c09OwnerEvidenceGate(closed,{root}).gateStatus,
    "DRIFT_OR_UNVERIFIABLE_REVIEW_REQUIRED");
});

test("parallel Owner documents PR changing state does not certify N1",()=>{
  const changed=fixture();
  changed.managedDocsPr.state="closed";
  changed.managedDocsPr.merged_at="2026-11-11T16:00:00Z";
  const result=inspectCv03N105c09OwnerEvidenceGate(changed,{root});
  assert.equal(result.managedPrState,"MERGED");
  assert.equal(result.gateStatus,"EXPECTED_BLOCKED_BASELINE");
  assert.equal(result.certification,"NOT_CERTIFIED");
});

test("unmounted authority seam mounted in real server must trip source drift",()=>{
  const temp=tempDir("cv03-n105c09-anchors-");
  try{
    for(const path of new Set([
      ...CV03_N105A_SOURCE_FILES,
      ...CV03_N105C09_OWNER_GATE_SOURCE_FILES
    ])){
      const dest=resolve(temp,path);
      mkdirSync(dirname(dest),{recursive:true});
      cpSync(resolve(root,path),dest);
    }
    const file=resolve(temp,"manager/server.ts");
    const original=readFileSync(file,"utf8");
    writeFileSync(file,original+
      "\n// simulated unexpected unsafe wiring\n"+
      "createCv03N105bDenyT0PgV010\n");
    const result=inspectCv03N105c09OwnerEvidenceGate(fixture(),{root:temp});
    assert.equal(result.certification,"NOT_CERTIFIED");
    assert.equal(result.checks.optionalSqlAuthorityAndLifecycleSeamsUnmounted,false);
    assert.equal(result.gateStatus,"DRIFT_OR_UNVERIFIABLE_REVIEW_REQUIRED");
  }finally{rmSync(temp,{recursive:true,force:true});}
});

test("actual tool CLI --check passes only for safe BLOCKED baseline",()=>{
  const temp=tempDir("cv03-n105c09-cli-");
  try{
    const input=resolve(temp,"input.json");
    writeFileSync(input,JSON.stringify(fixture()));
    const child=spawnSync(process.execPath,[executable,"--check","--input",input],
      {cwd:root,encoding:"utf8"});
    assert.equal(child.status,0,child.stderr||child.stdout);
    const report=JSON.parse(child.stdout);
    assert.equal(report.gateStatus,"EXPECTED_BLOCKED_BASELINE");
    assert.equal(report.releaseDecision,"DENY_NO_PRODUCTION_OWNER_APPROVED_INTEGRATION");
    assert.ok(!child.stdout.includes("Owner category"));
    const closed=fixture();
    closed.issue.state="closed";
    writeFileSync(input,JSON.stringify(closed));
    const failed=spawnSync(process.execPath,[executable,"--check","--input",input],
      {cwd:root,encoding:"utf8"});
    assert.equal(failed.status,1);
    assert.equal(JSON.parse(failed.stdout).gateStatus,
      "DRIFT_OR_UNVERIFIABLE_REVIEW_REQUIRED");
  }finally{rmSync(temp,{recursive:true,force:true});}
});

test("any attempt to use the source gate as release certification fails",()=>{
  const r=spawnSync(process.execPath,[executable,"--certify"],
    {cwd:root,encoding:"utf8"});
  assert.equal(r.status,2);
  assert.match(r.stderr,/CV03_N105C09_RELEASE_CERTIFICATION_FORBIDDEN/);
});
