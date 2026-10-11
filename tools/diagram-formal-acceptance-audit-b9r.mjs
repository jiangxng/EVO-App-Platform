#!/usr/bin/env node
/** B9r offline formal acceptance matrix structural audit, NOT a product PASS. */
import {readFile} from "node:fs/promises";
import {resolve} from "node:path";
import {pathToFileURL} from "node:url";

const EXPECTED={
 V:["01","02","03","04","05","06"],
 M:["01","02","03","04","05","06","07","08","09"],
 T:["01","02","03","04","05","06","07"],
 E:["01","02","03","04","05","06","07"],
 D:["01","02","03","04","05","06"],
 A:["01","02"],
 P:["01","02"]
};
const allowed=new Set(["PASS","FAIL","NOT TESTED"]);
export function auditFormalAcceptanceMatrixV010(markdown){
 if(typeof markdown!=="string")throw new Error("matrix text required");
 const rows=markdown.split(/\r?\n/).filter(line=>/^\|\s*[VMTEDAP]\d\d\s*\|/.test(line));
 const expected=new Set(Object.entries(EXPECTED).flatMap(([group,ns])=>ns.map(n=>group+n)));
 const seen=new Set(),counts={"PASS":0,"FAIL":0,"NOT TESTED":0};
 const categoryCounts=Object.fromEntries(Object.keys(EXPECTED).map(k=>[k,0]));
 for(const row of rows){
  const cells=row.split("|").slice(1,-1).map(cell=>cell.trim());
  if(cells.length!==4)throw new Error("formal row must have exactly four cells");
  const [key,scenario,reference,status]=cells;
  if(!expected.has(key)||seen.has(key)||!scenario||!reference||!allowed.has(status))
   throw new Error("unexpected, duplicate or malformed acceptance row");
  seen.add(key);counts[status]++;categoryCounts[key[0]]++;
  // Machine CI alone must never be silently converted to official signed PASS.
  if(status==="PASS" && !/human[- ]verified:|人工验收人[:：]/i.test(reference))
   throw new Error("formal PASS requires a human sign-off reference");
 }
 if(seen.size!==expected.size || [...expected].some(id=>!seen.has(id)))
  throw new Error("missing formal §14 row(s)");
 return {schema:"B9r-formal-matrix-audit-v0.1",total:rows.length,
  statuses:counts,groups:categoryCounts,
  machineEvidenceNotAcceptance:true,
  warning:"Matrix structure only; human sign-off authenticity and physical-device tests not independently verified"};
}
if(process.argv[1] && import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 try{
  const pathname=resolve(process.argv[2]??"docs/architecture/DIAGRAM-COMMERCIAL-ACCEPTANCE-EVIDENCE-MATRIX-20261010.md");
  const report=auditFormalAcceptanceMatrixV010(await readFile(pathname,"utf8"));
  console.log("B9R_FORMAL_MATRIX_RESULT="+JSON.stringify(report));
 }catch{
  console.error("B9R_FORMAL_MATRIX_INVALID");
  process.exitCode=1;
 }
}
