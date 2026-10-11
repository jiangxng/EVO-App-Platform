#!/usr/bin/env node
/**
 * B9o: privacy-preserving offline *proxy* of crowded straight corridors.
 * This does NOT call Eidos orthogonal router and MUST NOT be named
 * "actual route-congested" count, collision-free guarantee or performance SLA.
 */
import {resolve} from "node:path";
import {pathToFileURL} from "node:url";
import {loadAuthorizedEnterpriseFixtureV010} from "./diagram-enterprise-fixture-intake-b9k.mjs";

const intersects=(a,b)=>a.x < b.x+b.width && a.x+a.width > b.x
 && a.y < b.y+b.height && a.y+a.height > b.y;
const center=(n)=>({x:n.x+n.width/2,y:n.y+n.height/2});

export function analyzeCorridorRiskV010(graph,{margin=16,budget=22}={}){
 if(!graph || !Array.isArray(graph.nodes) || !Array.isArray(graph.edges))
  throw new Error("requires validated preview2d");
 if(!(Number.isFinite(margin)&&margin>=0&&margin<=100) ||
    !(Number.isInteger(budget)&&budget>=1&&budget<=1000))
  throw new Error("invalid diagnostic options");
 const nodes=new Map(graph.nodes.map(n=>[n.id,n]));
 const bands={"0":0,"1-5":0,"6-22":0,"23+":0};
 let max=0,corridorsAboveBudget=0,selfLoops=0;
 // B9k bounds this to 1500 nodes × 5000 edges. Output aggregate only.
 for(const edge of graph.edges){
  const source=nodes.get(edge.source),target=nodes.get(edge.target);
  if(!source || !target)throw new Error("invalid relation topology");
  if(source===target){selfLoops++;continue;}
  const a=center(source),b=center(target);
  const region={x:Math.min(a.x,b.x)-margin,y:Math.min(a.y,b.y)-margin,
   width:Math.abs(a.x-b.x)+2*margin,height:Math.abs(a.y-b.y)+2*margin};
  let count=0;
  for(const n of graph.nodes){
   if(n.id!==source.id && n.id!==target.id && intersects(region,n))count++;
  }
  max=Math.max(max,count);
  if(count>budget)corridorsAboveBudget++;
  bands[count===0?"0":count<=5?"1-5":count<=22?"6-22":"23+"]++;
 }
 return {schema:"B9o-corridor-proxy-v0.1",nodes:graph.nodes.length,
  edges:graph.edges.length,selfLoops,corridorsChecked:graph.edges.length-selfLoops,
  corridorRiskBands:bands,corridorsAboveBudget,maxCorridorObstacleCount:max,
  diagnosticBudget:budget,diagnosticMargin:margin,
  evidenceLevel:"GEOMETRY_PROXY_ONLY; NOT actual Eidos route-congested, no router executed",
  disclosure:"Aggregate only; no business labels, IDs, relation names or coordinates"};
}

if(process.argv[1] && import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 try{
  const {summary,preview2d}=await loadAuthorizedEnterpriseFixtureV010(process.argv[2],{
   authorized:process.env.EVO_B9K_AUTHORIZED_QA==="1"
  });
  const result=analyzeCorridorRiskV010(preview2d);
  console.log("B9O_CORRIDOR_PROXY_RESULT="+JSON.stringify({
   process:summary.process,sha256:summary.sha256,...result
  }));
 }catch{
  console.error("B9O_ROUTE_PROXY_REJECTED (no input details logged)");
  process.exitCode=1;
 }
}
