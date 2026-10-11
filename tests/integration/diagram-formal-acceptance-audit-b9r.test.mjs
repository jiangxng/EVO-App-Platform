import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {auditFormalAcceptanceMatrixV010 as audit} from "../../tools/diagram-formal-acceptance-audit-b9r.mjs";

const MATRIX="docs/architecture/DIAGRAM-COMMERCIAL-ACCEPTANCE-EVIDENCE-MATRIX-20261010.md";
test("B9r current historic §14 matrix has exactly 39 distinct formal NOT TESTED rows",async()=>{
 const matrix=await readFile(MATRIX,"utf8");
 const result=audit(matrix);
 assert.equal(result.total,39);
 assert.deepEqual(result.statuses,{"PASS":0,"FAIL":0,"NOT TESTED":39});
 assert.deepEqual(result.groups,{V:6,M:9,T:7,E:7,D:6,A:2,P:2});
 assert.equal(result.machineEvidenceNotAcceptance,true);
});
test("B9r duplicate, omitted, fabricated and malformed formal rows fail closed",async()=>{
 const matrix=await readFile(MATRIX,"utf8");
 const row=matrix.split("\n").find(x=>x.startsWith("| V01 |"));
 assert.ok(row);
 assert.throws(()=>audit(matrix+"\n"+row),/duplicate/);
 assert.throws(()=>audit(matrix.replace(row,"")),/missing/);
 assert.throws(()=>audit(matrix.replace("| V01 |","| X01 |")),/missing/);
 assert.throws(()=>audit(matrix.replace(row,row.replace("NOT TESTED","DONE"))),/malformed/);
});
test("B9r machine CI proof cannot silently upgrade a formal case to PASS",async()=>{
 const matrix=await readFile(MATRIX,"utf8");
 const row=matrix.split("\n").find(x=>x.startsWith("| M01 |"));
 const elevated=row.replace("NOT TESTED","PASS");
 assert.throws(()=>audit(matrix.replace(row,elevated)),/human sign-off/);
 const legitimate=elevated.replace(" | PASS |","; 人工验收人：QA角色与审核时间待实际填写 | PASS |");
 assert.equal(audit(matrix.replace(row,legitimate)).statuses.PASS,1);
});
