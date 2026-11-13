import test from "node:test";
import assert from "node:assert/strict";
import {cpSync,mkdtempSync,mkdirSync,readFileSync,rmSync,writeFileSync} from "node:fs";
import {tmpdir} from "node:os";
import {dirname,resolve} from "node:path";
import {fileURLToPath} from "node:url";
import {spawnSync} from "node:child_process";
import {CV03_N105A_SOURCE_FILES} from
  "../../tools/cv03-n105a-authority-boundary-preflight.mjs";
import {CV03_N105C09_OWNER_GATE_SOURCE_FILES} from
  "../../tools/cv03-n105c09-owner-evidence-release-gate.mjs";
import {CV04_NEXT05_RELEASE_SOURCE_FILES,inspectCv04Next05ReleaseGate} from
  "../../tools/cv04-next05-production-authority-release-gate.mjs";

const root=resolve(dirname(fileURLToPath(import.meta.url)),"../..");
const tool=resolve(root,"tools/cv04-next05-production-authority-release-gate.mjs");
const liveShape=()=>({
  issue:{
    number:1212,state:"open",
    html_url:"https://github.com/jiangxng/EVO-App-Platform/issues/1212",
    body:"## Status: PENDING OWNER SIGNOFF — N1=NOT_CERTIFIED\n"+
      Array.from({length:5},(_,i)=>"- [x] Owner category "+(i+1)).join("\n")+
      "\nAPP_PLATFORM_CV03_HUMAN_SAVE_MODE=OFF\n"
  },
  managedDocsPr:{
    number:1184,state:"open",merged_at:null,
    html_url:"https://github.com/jiangxng/EVO-App-Platform/pull/1184"
  }
});
const makeSandbox=()=>{
  const tmp=mkdtempSync(resolve(tmpdir(),"cv04-next05-gate-"));
  for(const path of new Set([...CV03_N105A_SOURCE_FILES,
    ...CV03_N105C09_OWNER_GATE_SOURCE_FILES,
    ...CV04_NEXT05_RELEASE_SOURCE_FILES])){
    mkdirSync(dirname(resolve(tmp,path)),{recursive:true});
    cpSync(resolve(root,path),resolve(tmp,path));
  }
  return tmp;
};
const sabotage=(base,path,fn)=>{
  const name=resolve(base,path);
  writeFileSync(name,fn(readFileSync(name,"utf8")));
};
test("real issue shape: five checked boxes are NOT CV04 authority or KMS approval",()=>{
  const r=inspectCv04Next05ReleaseGate(liveShape(),{root});
  assert.equal(r.milestone,"CV04_NEXT05A");
  assert.equal(r.gateStatus,"EXPECTED_BLOCKED_BASELINE",JSON.stringify(r.checks));
  assert.equal(r.releaseDecision,
    "DENY_UNTIL_INDEPENDENT_OWNERS_AND_CANONICAL_PA05_T0_KMS");
  assert.equal(r.issueCheckedBoxes,5);
  assert.equal(r.checkedBoxesConstituteApproval,false);
  assert.equal(r.actualProductionAuthorityVerified,false);
  assert.equal(r.actualWorkloadSignerAndKmsVerified,false);
  assert.equal(r.productionExportEnabled,false);
  assert.ok(Object.values(r.checks).every(Boolean));
  console.log("CV04_NEXT05_OWNER_CHECKBOXES_NEVER_PRODUCTION_APPROVAL_PASS");
});
test("missing/closed/wrong Owner issue fails red, and PR1184 merge never certifies",()=>{
  for(const data of [
    {...liveShape(),issue:null},
    {...liveShape(),issue:{...liveShape().issue,state:"closed"}},
    {...liveShape(),issue:{...liveShape().issue,number:9999}},
    {...liveShape(),managedDocsPr:null}
  ])assert.equal(inspectCv04Next05ReleaseGate(data,{root}).gateStatus,
      "DRIFT_OR_UNVERIFIABLE_REVIEW_REQUIRED");
  const merged=liveShape();
  merged.managedDocsPr.state="closed";
  merged.managedDocsPr.merged_at="2026-11-12T00:00:00Z";
  const result=inspectCv04Next05ReleaseGate(merged,{root});
  assert.equal(result.gateStatus,"EXPECTED_BLOCKED_BASELINE");
  assert.equal(result.actualProductionAuthorityVerified,false);
  console.log("CV04_NEXT05_LIVE_DEPENDENCY_IDENTITY_FAILCLOSED_PASS");
});
test("formal Export registration or isolated Gateway/Owner/Worker mount trips RED",()=>{
  const scenarios=[
    // The isolated SQL gateway allows 'expire' as well as request/worker/
    // download. Reject this and any future unknown formal job operation.
    ["manager/server.ts",text=>text+
      "\n// unexpected formal expiry dictionary.collection.export.job.expire\n"],
    ["catalog/seed.ts",text=>text+
      "\n// unexpected formal expiry dictionary.collection.export.job.expire\n"],
    ["manager/server.ts",text=>text+
      "\n// future formal operation dictionary.collection.export.job.future-new-action\n"],
    ["catalog/seed.ts",text=>text+
      "\n// future formal operation dictionary.collection.export.job.future-new-action\n"],
    ["manager/server.ts",text=>text+
      "\n// unauthorized formal download dictionary.collection.export.job.download\n"],
    ["catalog/seed.ts",text=>text+
      "\n// unauthorized formal download dictionary.collection.export.job.download\n"],
    ["manager/server.ts",text=>text+
      '\nconst accidental="dictionary.collection.export.job.request";\n'],
    ["catalog/seed.ts",text=>text+
      '\n// accidental formal action dictionary.collection.export.job.worker\n'],
    ["manager/server.ts",text=>text+
      "\n// unauthorized mount cv04IsolatedSignedExportGatewaySqlV010\n"],
    ["manager/server.ts",text=>text+
      "\n// unauthorized lifecycle createIsolatedDictionaryExportPgPollingV010\n"]
  ];
  const temp=makeSandbox();
  try{
    for(const [path,inject] of scenarios){
      const name=resolve(temp,path),original=readFileSync(name,"utf8");
      sabotage(temp,path,inject);
      const r=inspectCv04Next05ReleaseGate(liveShape(),{root:temp});
      assert.equal(r.gateStatus,"DRIFT_OR_UNVERIFIABLE_REVIEW_REQUIRED",path);
      assert.equal(r.productionExportEnabled,false);
      writeFileSync(name,original);
    }
  }finally{rmSync(temp,{recursive:true,force:true});}
  console.log("CV04_NEXT05_UNREVIEWED_PRODUCT_ACTIVATION_RED_PASS");
});
test("weakened stage gates, absent SQL gateway and missing sources are RED",()=>{
  const scenarios=[
    ["apps/business-dictionary/export-jobs.ts",s=>
      s.replace('const testScope=input.isolatedTestOnly===true && process.env.NODE_ENV==="test"',
        "const testScope=true")],
    ["apps/business-dictionary/export-jobs.ts",s=>
      s.replace('const testScope=input.isolatedTestOnly===true && process.env.NODE_ENV==="test"',
        '/* const testScope=input.isolatedTestOnly===true && process.env.NODE_ENV==="test" */ const testScope=true')],
    ["apps/business-dictionary/export-job-pg-store.ts",s=>
      s.replace('process.env.NODE_ENV!=="test"||input.isolatedTestOnly!==true',"false")],
    ["apps/business-dictionary/export-job-pg-sql-lease.ts",s=>
      s.replace('process.env.NODE_ENV!=="test"||input.isolatedTestOnly!==true',"false")],
    ["apps/business-dictionary/export-job-pg-sql-lease.ts",s=>
      s.replace('process.env.NODE_ENV!=="test"||input.isolatedTestOnly!==true',
        '/* process.env.NODE_ENV!=="test"||input.isolatedTestOnly!==true */ false')],
    ["apps/business-dictionary/export-job-pg-dispatch.ts",s=>
      s.replace("CV04_EXPORT_POLL_PRODUCTION_DISABLED","CV04_EXPORT_POLL_ALLOWED")],
    ["apps/business-dictionary/export-job-pg-dispatch.ts",s=>
      s.replace('process.env.NODE_ENV!=="test"||input.isolatedTestOnly!==true',"false")],
    ["tools/cv04-isolated-signed-export-gateway.mjs",s=>
      s.replace("CV04_EXPORT_GATEWAY_ISOLATED_SCHEMA_REQUIRED","UNSAFE_PUBLIC_SCHEMA")]
  ];
  const temp=makeSandbox();
  try{
    for(const [path,mutate] of scenarios){
      const name=resolve(temp,path),original=readFileSync(name,"utf8");
      const next=mutate(original);
      assert.notEqual(next,original,path);
      writeFileSync(name,next);
      const r=inspectCv04Next05ReleaseGate(liveShape(),{root:temp});
      assert.equal(r.gateStatus,"DRIFT_OR_UNVERIFIABLE_REVIEW_REQUIRED",path);
      writeFileSync(name,original);
    }
    rmSync(resolve(temp,"apps/business-dictionary/export-jobs.ts"));
    assert.equal(inspectCv04Next05ReleaseGate(liveShape(),{root:temp}).gateStatus,
      "DRIFT_OR_UNVERIFIABLE_REVIEW_REQUIRED");
  }finally{rmSync(temp,{recursive:true,force:true});}
  console.log("CV04_NEXT05_STAGING_PRODUCTION_GUARDS_MUST_REMAIN_PASS");
});
test("CLI --check only accepts blocked baseline and never leaks Owner issue text",()=>{
  const temp=mkdtempSync(resolve(tmpdir(),"cv04-next05-cli-"));
  try{
    const input=resolve(temp,"data.json");
    writeFileSync(input,JSON.stringify(liveShape()));
    const child=spawnSync(process.execPath,[tool,"--check","--input",input],
      {cwd:root,encoding:"utf8"});
    assert.equal(child.status,0,child.stderr||child.stdout);
    const report=JSON.parse(child.stdout);
    assert.equal(report.gateStatus,"EXPECTED_BLOCKED_BASELINE");
    assert.ok(!child.stdout.includes("Owner category"));
    const closed=liveShape();closed.issue.state="closed";
    writeFileSync(input,JSON.stringify(closed));
    const rejected=spawnSync(process.execPath,[tool,"--check","--input",input],
      {cwd:root,encoding:"utf8"});
    assert.equal(rejected.status,1,rejected.stderr);
    assert.equal(JSON.parse(rejected.stdout).gateStatus,
      "DRIFT_OR_UNVERIFIABLE_REVIEW_REQUIRED");
  }finally{rmSync(temp,{recursive:true,force:true});}
  console.log("CV04_NEXT05_READONLY_LIVE_GITHUB_CHECK_ONLY_BLOCKED_GREEN_PASS");
});
test("cannot turn source guard into production certification or EXPORT enable",()=>{
  for(const argument of ["--certify","--enable","--release"]){
    const child=spawnSync(process.execPath,[tool,argument],
      {cwd:root,encoding:"utf8"});
    assert.equal(child.status,2);
    assert.match(child.stderr,/CV04_NEXT05_PRODUCTION_CERTIFICATION_FORBIDDEN/);
  }
  console.log("CV04_NEXT05_SOURCE_GATE_NEVER_CERTIFIES_EXPORT_PASS");
});
