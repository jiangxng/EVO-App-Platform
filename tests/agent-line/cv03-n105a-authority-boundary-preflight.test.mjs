import test from "node:test";
import assert from "node:assert/strict";
import {cpSync,mkdtempSync,mkdirSync,readFileSync,rmSync,writeFileSync} from "node:fs";
import {tmpdir} from "node:os";
import {dirname,resolve} from "node:path";
import {fileURLToPath} from "node:url";
import {spawnSync} from "node:child_process";
import {
  CV03_N105A_SOURCE_FILES,inspectCv03N105aAuthorityBoundary
} from "../../tools/cv03-n105a-authority-boundary-preflight.mjs";

const root=resolve(dirname(fileURLToPath(import.meta.url)),"../..");
const preflight=resolve(root,"tools/cv03-n105a-authority-boundary-preflight.mjs");

test("N1-05a existing Host/PA05/Provider/PG source boundary is documented, never certified",()=>{
  const report=inspectCv03N105aAuthorityBoundary(root);
  assert.equal(report.certification,"NOT_CERTIFIED");
  assert.equal(report.ownerSignoff,"PENDING_EXTERNAL_OWNER_DECISION");
  assert.equal(report.sourceAnchorStatus,"BASELINE_MATCH",
    JSON.stringify(report.findings.filter(f=>!f.matched)));
  assert.ok(report.findings.length>=10);
  assert.ok(report.findings.every(f=>f.sourceGrade==="G_SOURCE_ANCHOR"&&f.sha256));
  assert.equal(report.blockers.length,4);
});

test("N1-05a check CLI succeeds only as a fail-closed baseline check, not a release",()=>{
  const child=spawnSync(process.execPath,[preflight,"--check"],{cwd:root,encoding:"utf8"});
  assert.equal(child.status,0,child.stderr||child.stdout);
  const report=JSON.parse(child.stdout);
  assert.equal(report.sourceAnchorStatus,"BASELINE_MATCH");
  assert.equal(report.certification,"NOT_CERTIFIED");
});

test("N1-05a changed production admission is reported as drift, never promoted",()=>{
  const temp=mkdtempSync(resolve(tmpdir(),"cv03-n105a-"));
  try{
    for(const path of CV03_N105A_SOURCE_FILES){
      const dest=resolve(temp,path);
      mkdirSync(dirname(dest),{recursive:true});
      cpSync(resolve(root,path),dest);
    }
    const path=resolve(temp,"manager/server.ts");
    const original=readFileSync(path,"utf8");
    assert.match(original,/assertCv03HumanSaveNotEnabledV010\(process\.env\)/);
    writeFileSync(path,original.replace(
      "assertCv03HumanSaveNotEnabledV010(process.env)",
      "/* deliberately removed in test fixture */"
    ));
    const report=inspectCv03N105aAuthorityBoundary(temp);
    assert.equal(report.certification,"NOT_CERTIFIED");
    assert.equal(report.sourceAnchorStatus,"DRIFT_REQUIRES_MANUAL_REVIEW");
    assert.ok(report.findings.some(f=>f.id==="HOST_STARTUP_WRITE_AND_RESTORE_GATES"&&!f.matched));
  }finally{rmSync(temp,{recursive:true,force:true});}
});
