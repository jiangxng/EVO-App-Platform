#!/usr/bin/env node
/**
 * B9k: offline, fail-closed intake for owner-authorized, de-identified
 * enterprise S2C/P2P preview2d graphs. No network or storage write.
 * This is a safety/shape preflight, NOT proof of authorization or anonymization.
 */
import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {lstat,readFile} from "node:fs/promises";
import {relative,resolve,sep} from "node:path";
import {pathToFileURL} from "node:url";

const MAX_BYTES=2*1024*1024;
const MAX_NODES=1500;
const MAX_EDGES=5000;
const NODE_FIELDS=new Set(["id","kind","label","shape","x","y","width","height"]);
const EDGE_FIELDS=new Set(["id","source","target","kind","label","arrow","style"]);
const EMAIL=/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;
const error=(message)=>{throw new Error(message);};
const object=(value)=>value!==null && typeof value==="object" && !Array.isArray(value);
const id=(value)=>typeof value==="string" && value.length>0 && value.length<=200;
const text=(value)=>typeof value==="string" && value.length>0 && value.length<=4000;
const finite=(value)=>typeof value==="number" && Number.isFinite(value);
const clean=(value)=>!EMAIL.test(value);
const fields=(value,allowed)=>Object.keys(value).every(key=>allowed.has(key));

export function validateAuthorizedEnterpriseFixtureV010(input){
 if(!object(input))error("fixture must be a JSON object");
 if(input.contractVersion!=="0.1.0" || input.purpose!=="diagram-commercial-local-qa")
  error("unsupported fixture contract or purpose");
 if(input.process!=="S2C" && input.process!=="P2P")
  error("process must be S2C or P2P");
 if(input.deidentified!==true || input.ownerApprovedForLocalQa!==true)
  error("explicit de-identification and owner authorization attestations required");
 if(Object.keys(input).some(key=>!["contractVersion","purpose","process","deidentified",
  "ownerApprovedForLocalQa","preview2d"].includes(key)))
  error("unexpected top-level field; use a narrow, de-identified export");
 const graph=input.preview2d;
 if(!object(graph) || graph.contractVersion!=="0.1.0" ||
    !Array.isArray(graph.nodes) || !Array.isArray(graph.edges))
  error("preview2d must have contractVersion, nodes and edges");
 if(!fields(graph,new Set(["contractVersion","nodes","edges"])))
  error("unexpected preview2d field");
 if(graph.nodes.length<2 || graph.nodes.length>MAX_NODES ||
    graph.edges.length<1 || graph.edges.length>MAX_EDGES)
  error("node or edge count outside the supported offline QA limits");
 const nodeIds=new Set();
 let minX=Infinity,minY=Infinity,maxX=-Infinity,maxY=-Infinity;
 for(const node of graph.nodes){
  if(!object(node) || !fields(node,NODE_FIELDS) || !id(node.id) ||
    !text(node.label) || !id(node.kind) ||
    !finite(node.x) || !finite(node.y) ||
    !finite(node.width) || !finite(node.height) ||
    node.width<=0 || node.height<=0 ||
    (node.shape!==undefined && !id(node.shape)))
   error("invalid node fields or geometry");
  if(!clean(node.id) || !clean(node.label))error("potential email in node identifier/label");
  if(nodeIds.has(node.id))error("duplicate node identifier");
  nodeIds.add(node.id);
  minX=Math.min(minX,node.x);minY=Math.min(minY,node.y);
  maxX=Math.max(maxX,node.x+node.width);
  maxY=Math.max(maxY,node.y+node.height);
 }
 const edgeIds=new Set();
 let selfLoops=0;
 for(const edge of graph.edges){
  if(!object(edge) || !fields(edge,EDGE_FIELDS) || !id(edge.id) ||
    !id(edge.source) || !id(edge.target) || !id(edge.kind) ||
    (edge.label!==undefined && !text(edge.label)) ||
    (edge.arrow!==undefined && !id(edge.arrow)) ||
    (edge.style!==undefined && !id(edge.style)))
   error("invalid relation fields");
  if(!clean(edge.id) || (edge.label && !clean(edge.label)))
   error("potential email in relation identifier/label");
  if(edgeIds.has(edge.id))error("duplicate relation identifier");
  if(!nodeIds.has(edge.source) || !nodeIds.has(edge.target))
   error("relation endpoint is missing from preview2d");
  edgeIds.add(edge.id);
  if(edge.source===edge.target)selfLoops++;
 }
 // Never log preview2d itself: even de-identified labels may be proprietary.
 const fingerprint=createHash("sha256").update(JSON.stringify({
  process:input.process,preview2d:graph
 })).digest("hex");
 return {
  contractVersion:"0.1.0",stage:"B9k-offline-intake-only",
  process:input.process,nodes:graph.nodes.length,edges:graph.edges.length,
  selfLoops,bounds:{width:maxX-minX,height:maxY-minY},
  sha256:fingerprint,
  caution:"Attestations are not independently verified. No Chrome, CAS, Viewer, production DB, identity or physical-device acceptance."
 };
}

export async function readAuthorizedEnterpriseFixtureV010(filename,{
 repositoryRoot=process.cwd(),authorized=false
}={}){
 if(authorized!==true)error("EVO_B9K_AUTHORIZED_QA=1 is required");
 if(!id(filename))error("a local fixture path is required");
 const absolute=resolve(filename);
 const location=relative(resolve(repositoryRoot),absolute);
 if(location==="" || (!location.startsWith(".."+sep) && location!==".." && !location.startsWith("..")))
  error("customer fixture must stay outside the Git checkout");
 const info=await lstat(absolute);
 if(!info.isFile() || info.size>MAX_BYTES)
  error("fixture must be a regular JSON file no larger than 2 MiB");
 const raw=await readFile(absolute,"utf8");
 let data;
 try{data=JSON.parse(raw);}catch{error("invalid JSON fixture");}
 // The raw input is returned to the caller only when explicitly requested by
 // future, separate test harness code; this preflight deliberately returns no raw data.
 return validateAuthorizedEnterpriseFixtureV010(data);
}

if(process.argv[1] && import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 try{
  const summary=await readAuthorizedEnterpriseFixtureV010(process.argv[2],{
   authorized:process.env.EVO_B9K_AUTHORIZED_QA==="1"
  });
  console.log("B9K_ENTERPRISE_INTAKE_RESULT="+JSON.stringify(summary));
 }catch{
  // Do not echo file paths, labels, parser snippets, or exception details.
  console.error("B9K_INTAKE_REJECTED (check local consent, data shape and privacy)");
  process.exitCode=1;
 }
}
