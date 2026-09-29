import type { EnterpriseOperatingGraphHostServiceV010 } from "./enterprise-operating-graph-service.js";
import type { EogExpectedSopV010 } from "../contracts/enterprise-operating-graph-sop.js";
import type { EogExpectedSopStoreV010 } from "./enterprise-operating-graph-sop-store.js";

function req(v:string,c:string){if(typeof v!=="string"||!v.trim())throw new Error(c);return v.trim();}

export interface EogExpectedSopServiceV010 {
  create(input:{enterpriseId:string;graphId:string;sopId:string;title:string;applicationNodeIds:string[]}):EogExpectedSopV010;
  revise(input:{enterpriseId:string;graphId:string;sopId:string;expectedRevision:number;title?:string;applicationNodeIds?:string[]}):EogExpectedSopV010;
  publish(input:{enterpriseId:string;graphId:string;sopId:string;expectedRevision:number;subjectId:string}):EogExpectedSopV010;
  listPublished(input:{enterpriseId:string;graphId:string}):EogExpectedSopV010[];
}
export function createEogExpectedSopServiceV010(input:{store:EogExpectedSopStoreV010;graphService:EnterpriseOperatingGraphHostServiceV010;now?:()=>Date;}):EogExpectedSopServiceV010{
 const now=input.now??(()=>new Date());
 const apps=(enterpriseId:string,graphId:string,ids:string[])=>{
   const graph=input.graphService.get({enterpriseId,graphId});
   const uniq=[...new Set(ids.map(x=>req(x,"EOG_EXPECTED_SOP_APPLICATION_REQUIRED")))];
   if(uniq.length!==ids.length)throw new Error("EOG_EXPECTED_SOP_APPLICATION_DUPLICATE");
   for(const id of uniq){const n=graph.nodes.find(x=>x.nodeId===id);if(!n||n.kind!=="APPLICATION")throw new Error("EOG_EXPECTED_SOP_APPLICATION_NODE_REQUIRED");}
   return uniq;
 };
 return {
  create(r){const ts=now().toISOString();const ids=apps(r.enterpriseId,r.graphId,r.applicationNodeIds);return input.store.create({contractVersion:"0.1.0",sopId:req(r.sopId,"EOG_EXPECTED_SOP_ID_REQUIRED"),enterpriseId:req(r.enterpriseId,"EOG_ENTERPRISE_ID_REQUIRED"),graphId:req(r.graphId,"EOG_GRAPH_ID_REQUIRED"),title:req(r.title,"EOG_EXPECTED_SOP_TITLE_REQUIRED"),state:"DRAFT",revision:0,steps:ids.map((applicationNodeId,i)=>({stepId:"step:"+(i+1),applicationNodeId})),createdAt:ts,updatedAt:ts});},
  revise(r){const cur=input.store.get(r.sopId);if(!cur||cur.enterpriseId!==r.enterpriseId||cur.graphId!==r.graphId)throw new Error("EOG_EXPECTED_SOP_NOT_FOUND");if(cur.state!=="DRAFT")throw new Error("EOG_EXPECTED_SOP_PUBLISHED_IMMUTABLE");if(cur.revision!==r.expectedRevision)throw new Error("EOG_EXPECTED_SOP_REVISION_CONFLICT");const ids=r.applicationNodeIds?apps(r.enterpriseId,r.graphId,r.applicationNodeIds):cur.steps.map(s=>s.applicationNodeId);return input.store.replace({...cur,revision:cur.revision+1,title:r.title===undefined?cur.title:req(r.title,"EOG_EXPECTED_SOP_TITLE_REQUIRED"),steps:ids.map((applicationNodeId,i)=>({stepId:"step:"+(i+1),applicationNodeId})),updatedAt:now().toISOString()});},
  publish(r){const cur=input.store.get(r.sopId);if(!cur||cur.enterpriseId!==r.enterpriseId||cur.graphId!==r.graphId)throw new Error("EOG_EXPECTED_SOP_NOT_FOUND");if(cur.state!=="DRAFT")throw new Error("EOG_EXPECTED_SOP_PUBLISHED_IMMUTABLE");if(cur.revision!==r.expectedRevision)throw new Error("EOG_EXPECTED_SOP_REVISION_CONFLICT");if(cur.steps.length<2)throw new Error("EOG_EXPECTED_SOP_MINIMUM_PATH_REQUIRED");const ts=now().toISOString();return input.store.replace({...cur,state:"PUBLISHED",revision:cur.revision+1,publishedAt:ts,publishedBySubjectId:req(r.subjectId,"EOG_EXPECTED_SOP_PUBLISHER_REQUIRED"),updatedAt:ts});},
  listPublished(r){return input.store.listByGraph(r).filter(s=>s.state==="PUBLISHED");}
 };
}
