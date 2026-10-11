#!/usr/bin/env node
/** Compare repeated P01 cases from two builds measured on a single CI runner. */
import assert from "node:assert/strict";
import { readFileSync, appendFileSync } from "node:fs";
const [beforePath,afterPath]=process.argv.slice(2);
assert.ok(beforePath&&afterPath,"Usage: compare baseline.log optimized.log");
const parse=path=>{
  const line=readFileSync(path,"utf8").split("\n")
    .findLast(row=>row.startsWith("P01_BROWSER_RESULT="));
  assert.ok(line,"Missing final P01_BROWSER_RESULT in "+path);
  const result=JSON.parse(line.slice("P01_BROWSER_RESULT=".length));
  assert.equal(result.cases.length,2);
  return result;
};
const baseline=parse(beforePath), optimized=parse(afterPath);
const metrics=["mountMs","selectionMs","dragDispatchP50Ms","dragDispatchP95Ms"];
const comparison=baseline.cases.map((before,index)=>{
  const after=optimized.cases[index];
  assert.equal(after.nodes,before.nodes);
  assert.equal(after.edges,before.edges);
  assert.equal(before.samples,3);
  assert.equal(after.samples,3);
  const changes={};
  for(const key of metrics){
    const b=before[key],o=after[key];
    assert.ok(Number.isFinite(b)&&Number.isFinite(o)&&b>=0&&o>=0);
    changes[key]={
      original:b,optimized:o,
      deltaPercent:b>0?Math.round(10000*(o-b)/b)/100:null
    };
  }
  return {nodes:before.nodes,edges:before.edges,changes};
});
const report={browser:optimized.browser,sameRunner:true,
  warmupsPerBuild:2,repetitionsPerSize:3,comparison,
  interpretation:"Measured distributions on shared CI hardware, not a device FPS SLA; negative delta indicates faster."};
console.log("P01_COMPARE="+JSON.stringify(report));
const summary=process.env.GITHUB_STEP_SUMMARY;
if(summary){
  let md="\n### P01a — same-runner prewarmed benchmark\n\n"
    +"*Chrome "+optimized.browser+"; two prewarm cases per build, three measured cases per size. "
    +"A negative delta suggests lower latency in this run only.*\n\n"
    +"| Graph | Mount median | Selection median | Drag CDP p95 median |\n"
    +"|---|---:|---:|---:|\n";
  for(const row of comparison){
    const cell=k=>{
      const x=row.changes[k];return x.original+" → "+x.optimized+" ms ("+x.deltaPercent+"%)";
    };
    md+="| "+row.nodes+"/"+row.edges+" | "+cell("mountMs")
      +" | "+cell("selectionMs")+" | "+cell("dragDispatchP95Ms")+" |\n";
  }
  md+="\n**Important:** CDP input dispatch includes protocol overhead and is not a frame-rate measurement; native devices still require P01 acceptance.\n";
  appendFileSync(summary,md);
}
