import {
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  writeFileSync
} from "node:fs";
import { dirname } from "node:path";
import type {
  EogExpectedSopSnapshotV010,
  EogExpectedSopV010
} from "../contracts/enterprise-operating-graph-sop.js";

export interface EogExpectedSopStoreV010 {
  create(sop: EogExpectedSopV010): EogExpectedSopV010;
  replace(sop: EogExpectedSopV010): EogExpectedSopV010;
  get(sopId: string): EogExpectedSopV010 | undefined;
  listByGraph(input: { enterpriseId: string; graphId: string }): EogExpectedSopV010[];
  snapshot(): EogExpectedSopSnapshotV010;
}

function clone<T>(value:T):T{return structuredClone(value);}
function required(v:string,code:string){if(typeof v!=="string"||!v.trim())throw new Error(code);return v.trim();}
function validate(s:EogExpectedSopV010):void{
  if(s.contractVersion!=="0.1.0"||!Number.isInteger(s.revision)||s.revision<0||!Array.isArray(s.steps)||!Number.isFinite(Date.parse(s.createdAt))||!Number.isFinite(Date.parse(s.updatedAt)))throw new Error("EOG_EXPECTED_SOP_INVALID");
  required(s.sopId,"EOG_EXPECTED_SOP_INVALID"); required(s.enterpriseId,"EOG_EXPECTED_SOP_INVALID"); required(s.graphId,"EOG_EXPECTED_SOP_INVALID"); required(s.title,"EOG_EXPECTED_SOP_INVALID");
  const ids=new Set<string>(), nodes=new Set<string>();
  for(const step of s.steps){
    required(step.stepId,"EOG_EXPECTED_SOP_INVALID"); required(step.applicationNodeId,"EOG_EXPECTED_SOP_INVALID");
    if(ids.has(step.stepId))throw new Error("EOG_EXPECTED_SOP_STEP_ID_DUPLICATE");
    ids.add(step.stepId);
    if(nodes.has(step.applicationNodeId))throw new Error("EOG_EXPECTED_SOP_APPLICATION_DUPLICATE");
    nodes.add(step.applicationNodeId);
  }
  if(s.state==="PUBLISHED"){
    if(s.steps.length<2||!s.publishedAt||!Number.isFinite(Date.parse(s.publishedAt))||!s.publishedBySubjectId?.trim())throw new Error("EOG_EXPECTED_SOP_PUBLISHED_INVALID");
  }
}
function createStore(read:()=>EogExpectedSopSnapshotV010,write:(s:EogExpectedSopSnapshotV010)=>void):EogExpectedSopStoreV010{
 return {
  create(sop){validate(sop);const cur=read();if(cur.sops.some(x=>x.sopId===sop.sopId))throw new Error("EOG_EXPECTED_SOP_ALREADY_EXISTS");const next={contractVersion:"0.1.0" as const,sops:[...cur.sops,clone(sop)]};write(next);return clone(sop);},
  replace(sop){validate(sop);const cur=read();const old=cur.sops.find(x=>x.sopId===sop.sopId);if(!old)throw new Error("EOG_EXPECTED_SOP_NOT_FOUND");if(old.enterpriseId!==sop.enterpriseId||old.graphId!==sop.graphId||old.createdAt!==sop.createdAt)throw new Error("EOG_EXPECTED_SOP_IDENTITY_IMMUTABLE");if(sop.revision!==old.revision+1)throw new Error("EOG_EXPECTED_SOP_REVISION_INVALID");const next={contractVersion:"0.1.0" as const,sops:cur.sops.map(x=>x.sopId===sop.sopId?clone(sop):x)};write(next);return clone(sop);},
  get(id){const x=read().sops.find(s=>s.sopId===id);return x?clone(x):undefined;},
  listByGraph(input){return read().sops.filter(s=>s.enterpriseId===input.enterpriseId&&s.graphId===input.graphId).sort((a,b)=>a.sopId.localeCompare(b.sopId)).map(clone);},
  snapshot(){return clone(read());}
 };
}
function validSnapshot(s:EogExpectedSopSnapshotV010){if(s.contractVersion!=="0.1.0"||!Array.isArray(s.sops))throw new Error("EOG_EXPECTED_SOP_SNAPSHOT_INVALID");const ids=new Set<string>();for(const x of s.sops){validate(x);if(ids.has(x.sopId))throw new Error("EOG_EXPECTED_SOP_ID_DUPLICATE");ids.add(x.sopId);}return s;}
export function createMemoryEogExpectedSopStoreV010(seed:EogExpectedSopSnapshotV010={contractVersion:"0.1.0",sops:[]}):EogExpectedSopStoreV010{let snap=clone(validSnapshot(seed));return createStore(()=>clone(snap),n=>{snap=clone(validSnapshot(n));});}
export function createFileEogExpectedSopStoreV010(path:string):EogExpectedSopStoreV010{
 const read=()=>existsSync(path)?clone(validSnapshot(JSON.parse(readFileSync(path,"utf8")) as EogExpectedSopSnapshotV010)):{contractVersion:"0.1.0" as const,sops:[]};
 const write=(s:EogExpectedSopSnapshotV010)=>{const v=validSnapshot(s);mkdirSync(dirname(path),{recursive:true});const tmp=path+".tmp";writeFileSync(tmp,JSON.stringify(v,null,2)+"\n","utf8");renameSync(tmp,path);};
 return createStore(read,write);
}
