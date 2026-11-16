import test from "node:test";
import assert from "node:assert/strict";
import {
  auditEcosystemSkipProofs,
  classifyPhysicalPgProof,
  BASELINE_SKIPPED_PHYSICAL_PG_V010
} from "../../tools/ecosystem-skip-proof-inventory.mjs";

function log(rows) {
  return [
    ...rows.map((item,i) => `ok ${i+1} - ${item.name} # SKIP ${item.reason}`),
    "ok 300 - ordinary unit regression",
    `# tests ${rows.length+1}`,
    "# pass 1",
    "# fail 0",
    `# skipped ${rows.length}`
  ].join("\n");
}
const proof = (name,reason="Requires isolated PostgreSQL18") => ({name,reason});

test("physical PostgreSQL skips are counted distinctly from passed suite cases",()=>{
  const report=auditEcosystemSkipProofs(log([
    proof("CV03 encrypted signed receipt"), proof("CV04 encrypted export"),
    proof("PA02 real Worker"), proof("PA04 tool guard"), proof("PA05 three PG SQL fence")
  ]));
  assert.deepEqual(report.groups,{CV03:1,CV04:1,PA02:1,PA04:1,PA05:1});
  assert.equal(report.passed,1);
  assert.equal(report.skipped,5);
  assert.match(report.warning,/NOT_PASSED_OR_PRODUCTION_CERTIFIED/);
  assert.equal(BASELINE_SKIPPED_PHYSICAL_PG_V010,127);
  assert.equal(classifyPhysicalPgProof("E01J4F startup quarantine"),"PA05");
});

test("generic suite may not hide a new non-PostgreSQL skipped assertion",()=>{
  assert.throws(()=>auditEcosystemSkipProofs(log([
    proof("PA02 host renderer","temporarily disabled for convenience")
  ])),/ECOSYSTEM_UNREVIEWED_SKIP/);
  assert.throws(()=>auditEcosystemSkipProofs(log([
    proof("Unknown new module","Requires PostgreSQL18")
  ])),/ECOSYSTEM_UNREVIEWED_SKIP/);
});

test("unreviewed skip count growth fails even when reason matches PG",()=>{
  assert.throws(()=>auditEcosystemSkipProofs(log(
    Array.from({length:128},()=>proof("PA02 new PG test"))
  )),/ECOSYSTEM_UNREVIEWED_SKIP_GROWTH/);
});

test("TAP summary mismatch and actual test failures remain fatal",()=>{
  assert.throws(()=>auditEcosystemSkipProofs("ok 1 - incomplete"),/ECOSYSTEM_TAP_SUMMARY_MISSING/);
  assert.throws(()=>auditEcosystemSkipProofs(log([proof("CV04 PG")]).replace(
    "# skipped 1","# skipped 0"
  )),/ECOSYSTEM_TAP_COUNTS_MISMATCH/);
  assert.throws(()=>auditEcosystemSkipProofs(log([]).replace(
    "# pass 1\n# fail 0","# pass 0\n# fail 1"
  )),/ECOSYSTEM_FULL_SUITE_FAILED/);
});

test("GitHub timestamp prefixes are accepted without changing proof accounting",()=>{
  const tap=log([proof("CV03 real signed SQL","Only run in explicit CI localhost/cv03proof")])
    .split("\n").map(line=>"2026-11-16T02:12:25.000Z "+line).join("\n");
  assert.deepEqual(auditEcosystemSkipProofs(tap).groups,
    {CV03:1,CV04:0,PA02:0,PA04:0,PA05:0});
});
