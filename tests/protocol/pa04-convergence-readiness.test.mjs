import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root=resolve(fileURLToPath(new URL("../../", import.meta.url)));
const manifest=JSON.parse(readFileSync(resolve(root,
  "docs/agent-line/PA04-C01-C06-READINESS-LEDGER.json"),"utf8"));
const expected=["C01","C02","C03","C04","C05","C06"];

function validate(ledger) {
  assert.equal(ledger.contractVersion,"0.1.0");
  assert.equal(ledger.phase,"PA-04");
  assert.deepEqual(ledger.gates.map(g=>g.id),expected,
    "never drop or renumber original C01-C06 acceptance obligations");
  for(const gate of ledger.gates) {
    assert.ok(["ISOLATED_PROVEN","IN_PROGRESS","NOT_STARTED"].includes(
      gate.engineering));
    assert.equal(typeof gate.signed,"boolean");
    assert.ok(gate.mergedPRs.length>0 && gate.mergedPRs.every(Number.isSafeInteger));
    assert.ok(Array.isArray(gate.proofPaths)&&gate.proofPaths.length>0);
    assert.ok(Array.isArray(gate.missingEvidence));
    assert.ok(gate.owner?.trim());
    assert.ok(gate.executionStage?.trim());
    for(const path of gate.proofPaths) {
      assert.match(path,new RegExp("^tests/(?:agent-line|protocol)/[a-z0-9-]+[.]test[.]mjs$"));
      assert.ok(existsSync(resolve(root,path)),"Missing proof file: "+path);
    }
    if(gate.signed) {
      assert.deepEqual(gate.missingEvidence,[],
        "a signed gate may not hide unfulfilled acceptance obligations");
      assert.ok(gate.signOff?.authorizedHumanReviewer?.trim());
      assert.ok(gate.signOff?.environment?.trim());
      assert.ok(gate.signOff?.evidenceUrl?.startsWith("https://"));
      assert.ok(gate.signOff?.sourceVersion?.trim());
    }
  }
  const allSigned=ledger.gates.every(g=>g.signed);
  assert.equal(ledger.phaseSigned,allSigned,
    "isolated successes cannot silently become a signed PA-04 phase");
  if(ledger.phaseSigned) {
    assert.equal(ledger.phaseStatus,"SIGNED");
    // PA-02 R10 is a separate, deferred monetary release gate. Even an
    // accepted PA-04 engineering phase must not auto-close it.
    assert.equal(ledger.releaseEligibility,"NOT_APPROVED",
      "PA-04 signoff never independently grants production release");
  } else {
    assert.equal(ledger.phaseStatus,"IN_PROGRESS");
  }
}

test("PA04 convergence: fixed six-gate evidence inventory and valid state",()=>{
  validate(manifest);
});
test("PA04 convergence: current engineering evidence is distinct from Human/business production signature",()=>{
  assert.ok(manifest.gates.every(g=>g.engineering==="ISOLATED_PROVEN"));
  assert.ok(manifest.gates.every(g=>!g.signed && g.missingEvidence.length>0));
  assert.equal(manifest.phaseSigned,false);
  assert.match(manifest.fixedDependencies.pa02MonetaryR10,/OPEN/);
  assert.equal(manifest.fixedDependencies.productionWriteEnabled,false);
  assert.match(manifest.fixedDependencies.pa03BexImport,/PARALLEL/);
  assert.ok(manifest.gates.some(g=>g.missingEvidence.join(" ").includes("tokenizer")));
});
test("PA04 convergence: fabricated approval is rejected even when individual tests exist",()=>{
  const forged=structuredClone(manifest);
  forged.gates[4].signed=true;
  assert.throws(()=>validate(forged),/acceptance obligations|authorizedHumanReviewer/);
  const fakePhase=structuredClone(manifest);
  fakePhase.phaseSigned=true;
  assert.throws(()=>validate(fakePhase),/isolated successes cannot silently/);
});
test("PA04 convergence: every listed proof path is present and unique per gate",()=>{
  for(const g of manifest.gates){
    assert.equal(new Set(g.proofPaths).size,g.proofPaths.length);
  }
  assert.equal(new Set(manifest.gates.flatMap(g=>g.proofPaths)).size,9,
    "C01-C06 composite CI must run all nine independent evidence suites");
});
