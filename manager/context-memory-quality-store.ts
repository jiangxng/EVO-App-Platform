import {
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  writeFileSync
} from "node:fs";
import { dirname } from "node:path";
import type {
  ActiveContextRefV010,
  ContextMemoryItemV010
} from "../contracts/platform-services.js";

export type ContextMemoryContradictionStateV010 =
  | "OPEN"
  | "RESOLVED"
  | "DISMISSED";

export type ContextMemoryContradictionResolutionV010 =
  | "PREFER_LEFT"
  | "PREFER_RIGHT"
  | "BOTH_VALID"
  | "OTHER";

export interface ContextMemoryContradictionEventV010 {
  contractVersion:"0.1.0";
  eventId:string;
  contradictionId:string;
  context:ActiveContextRefV010;
  leftMemoryId:string;
  rightMemoryId:string;
  state:ContextMemoryContradictionStateV010;
  origin:"PROPOSAL_REVIEW"|"HUMAN";
  resolution?:ContextMemoryContradictionResolutionV010;
  reason?:string;
  occurredAt:string;
  actorSubjectId:string;
}

export interface ContextMemoryContradictionDecisionV010
  extends Omit<ContextMemoryContradictionEventV010,"eventId">{
  effectiveEventId:string;
}

export interface ContextMemoryQualitySnapshotV010 {
  contractVersion:"0.1.0";
  contradictionEvents:ContextMemoryContradictionEventV010[];
}

export interface ContextMemoryQualityStoreV010 {
  snapshot():ContextMemoryQualitySnapshotV010;
  append(event:ContextMemoryContradictionEventV010):void;
  contradiction(contradictionId:string):ContextMemoryContradictionDecisionV010|undefined;
  listContradictionsForContext(context:ActiveContextRefV010):ContextMemoryContradictionDecisionV010[];
  listOpenForMemory(memoryId:string):ContextMemoryContradictionDecisionV010[];
  findByPair(
    context:ActiveContextRefV010,
    leftMemoryId:string,
    rightMemoryId:string
  ):ContextMemoryContradictionDecisionV010|undefined;
}

export interface ContextMemoryQualityEvaluationV010 {
  contractVersion:"0.1.0";
  memoryId:string;
  evidence:{
    referenceCount:number;
    sourceCount:number;
    hostVerifiedSources:number;
    declaredSources:number;
    unverifiedSources:number;
    trust:"HOST_VERIFIED"|"DECLARED"|"UNVERIFIED"|"UNKNOWN";
  };
  freshness:{
    state:"FRESH"|"STALE"|"UNKNOWN";
    observedAt?:string;
    ageDays?:number;
    freshnessWindowDays:number;
  };
  contradictions:{
    openCount:number;
    contradictionIds:string[];
  };
  signals:string[];
}

function sameContext(
  a:ActiveContextRefV010,
  b:ActiveContextRefV010
):boolean{
  return a.kind===b.kind
    && a.contextId===b.contextId
    && (a.kind!=="ENTERPRISE" || b.kind!=="ENTERPRISE" || a.enterpriseId===b.enterpriseId);
}

function canonicalPair(left:string,right:string):[string,string]{
  const a=left.trim(),b=right.trim();
  if(!a || !b || a===b) throw new Error("CONTEXT_MEMORY_CONTRADICTION_PAIR_INVALID");
  return a.localeCompare(b)<=0 ? [a,b] : [b,a];
}

function validate(snapshot:ContextMemoryQualitySnapshotV010):ContextMemoryQualitySnapshotV010{
  if(snapshot.contractVersion!=="0.1.0" || !Array.isArray(snapshot.contradictionEvents)){
    throw new Error("CONTEXT_MEMORY_QUALITY_STATE_INVALID");
  }
  const eventIds=new Set<string>();
  for(const event of snapshot.contradictionEvents){
    if(event.contractVersion!=="0.1.0" || !event.eventId?.trim() || eventIds.has(event.eventId)){
      throw new Error("CONTEXT_MEMORY_CONTRADICTION_EVENT_INVALID");
    }
    eventIds.add(event.eventId);
    if(!event.contradictionId?.trim() || !event.context?.contextId?.trim()){
      throw new Error("CONTEXT_MEMORY_CONTRADICTION_TARGET_INVALID");
    }
    canonicalPair(event.leftMemoryId,event.rightMemoryId);
    if(!["OPEN","RESOLVED","DISMISSED"].includes(event.state)){
      throw new Error("CONTEXT_MEMORY_CONTRADICTION_STATE_INVALID");
    }
    if(!["PROPOSAL_REVIEW","HUMAN"].includes(event.origin)){
      throw new Error("CONTEXT_MEMORY_CONTRADICTION_ORIGIN_INVALID");
    }
    if(
      event.resolution!==undefined
      && !["PREFER_LEFT","PREFER_RIGHT","BOTH_VALID","OTHER"].includes(event.resolution)
    ){
      throw new Error("CONTEXT_MEMORY_CONTRADICTION_RESOLUTION_INVALID");
    }
    if(event.state==="OPEN" && event.resolution!==undefined){
      throw new Error("CONTEXT_MEMORY_CONTRADICTION_OPEN_RESOLUTION_FORBIDDEN");
    }
    if(event.state==="RESOLVED" && event.resolution===undefined){
      throw new Error("CONTEXT_MEMORY_CONTRADICTION_RESOLUTION_REQUIRED");
    }
    if(!Number.isFinite(Date.parse(event.occurredAt)) || !event.actorSubjectId?.trim()){
      throw new Error("CONTEXT_MEMORY_CONTRADICTION_ATTRIBUTION_INVALID");
    }
  }
  return structuredClone(snapshot);
}

function latestMap(events:readonly ContextMemoryContradictionEventV010[]){
  const map=new Map<string,ContextMemoryContradictionEventV010>();
  for(const event of [...events].sort((a,b)=>
    a.occurredAt.localeCompare(b.occurredAt)||a.eventId.localeCompare(b.eventId)
  )) map.set(event.contradictionId,event);
  return map;
}

function materialize(
  event:ContextMemoryContradictionEventV010
):ContextMemoryContradictionDecisionV010{
  const {eventId,...rest}=event;
  return {...structuredClone(rest),effectiveEventId:eventId};
}

export function createMemoryContextMemoryQualityStoreV010(
  seed:ContextMemoryQualitySnapshotV010={
    contractVersion:"0.1.0",
    contradictionEvents:[]
  }
):ContextMemoryQualityStoreV010{
  let current=validate(seed);
  return {
    snapshot(){return structuredClone(current);},
    append(event){
      if(current.contradictionEvents.some(v=>v.eventId===event.eventId)){
        throw new Error("CONTEXT_MEMORY_CONTRADICTION_EVENT_DUPLICATE");
      }
      const previous=latestMap(current.contradictionEvents).get(event.contradictionId);
      if(previous){
        const [pl,pr]=canonicalPair(previous.leftMemoryId,previous.rightMemoryId);
        const [nl,nr]=canonicalPair(event.leftMemoryId,event.rightMemoryId);
        if(!sameContext(previous.context,event.context) || pl!==nl || pr!==nr){
          throw new Error("CONTEXT_MEMORY_CONTRADICTION_ID_IMMUTABLE");
        }
        if(previous.state!=="OPEN"){
          throw new Error("CONTEXT_MEMORY_CONTRADICTION_TERMINAL_IMMUTABLE");
        }
        if(event.state==="OPEN"){
          throw new Error("CONTEXT_MEMORY_CONTRADICTION_OPEN_DUPLICATE");
        }
      }else if(event.state!=="OPEN"){
        throw new Error("CONTEXT_MEMORY_CONTRADICTION_OPEN_REQUIRED");
      }
      current=validate({
        contractVersion:"0.1.0",
        contradictionEvents:[...current.contradictionEvents,structuredClone(event)]
      });
    },
    contradiction(contradictionId){
      const value=latestMap(current.contradictionEvents).get(contradictionId);
      return value ? materialize(value) : undefined;
    },
    listContradictionsForContext(context){
      return [...latestMap(current.contradictionEvents).values()]
        .filter(event=>sameContext(event.context,context))
        .map(materialize)
        .sort((a,b)=>b.occurredAt.localeCompare(a.occurredAt)||a.contradictionId.localeCompare(b.contradictionId));
    },
    listOpenForMemory(memoryId){
      return [...latestMap(current.contradictionEvents).values()]
        .filter(event=>
          event.state==="OPEN"
          && (event.leftMemoryId===memoryId || event.rightMemoryId===memoryId)
        )
        .map(materialize)
        .sort((a,b)=>a.contradictionId.localeCompare(b.contradictionId));
    },
    findByPair(context,leftMemoryId,rightMemoryId){
      const [left,right]=canonicalPair(leftMemoryId,rightMemoryId);
      const value=[...latestMap(current.contradictionEvents).values()]
        .find(event=>{
          if(!sameContext(event.context,context)) return false;
          const [a,b]=canonicalPair(event.leftMemoryId,event.rightMemoryId);
          return a===left && b===right;
        });
      return value ? materialize(value) : undefined;
    }
  };
}

function load(path:string):ContextMemoryQualitySnapshotV010{
  if(!existsSync(path)){
    return {contractVersion:"0.1.0",contradictionEvents:[]};
  }
  return validate(JSON.parse(readFileSync(path,"utf8")) as ContextMemoryQualitySnapshotV010);
}

function persist(path:string,snapshot:ContextMemoryQualitySnapshotV010){
  mkdirSync(dirname(path),{recursive:true});
  const tmp=`${path}.tmp`;
  writeFileSync(tmp,JSON.stringify(snapshot,null,2)+"\n","utf8");
  renameSync(tmp,path);
}

export function createFileContextMemoryQualityStoreV010(
  path:string
):ContextMemoryQualityStoreV010{
  return {
    snapshot(){return load(path);},
    append(event){
      const store=createMemoryContextMemoryQualityStoreV010(load(path));
      store.append(event);
      persist(path,store.snapshot());
    },
    contradiction(id){
      return createMemoryContextMemoryQualityStoreV010(load(path)).contradiction(id);
    },
    listContradictionsForContext(context){
      return createMemoryContextMemoryQualityStoreV010(load(path)).listContradictionsForContext(context);
    },
    listOpenForMemory(memoryId){
      return createMemoryContextMemoryQualityStoreV010(load(path)).listOpenForMemory(memoryId);
    },
    findByPair(context,left,right){
      return createMemoryContextMemoryQualityStoreV010(load(path)).findByPair(context,left,right);
    }
  };
}

export function evaluateContextMemoryQualityV010(input:{
  memory:ContextMemoryItemV010;
  qualityStore:ContextMemoryQualityStoreV010;
  now?:Date;
  freshnessWindowDays?:number;
}):ContextMemoryQualityEvaluationV010{
  const now=input.now ?? new Date();
  const freshnessWindowDays=input.freshnessWindowDays ?? 180;
  if(!Number.isInteger(freshnessWindowDays) || freshnessWindowDays<1){
    throw new Error("CONTEXT_MEMORY_FRESHNESS_WINDOW_INVALID");
  }

  const sources=input.memory.provenance.evidenceSources ?? [];
  const hostVerifiedSources=sources.filter(v=>v.trustLevel==="HOST_VERIFIED").length;
  const declaredSources=sources.filter(v=>v.trustLevel==="DECLARED").length;
  const unverifiedSources=sources.filter(v=>v.trustLevel==="UNVERIFIED").length;
  const trust=sources.length===0
    ? "UNKNOWN"
    : unverifiedSources>0
      ? "UNVERIFIED"
      : declaredSources>0
        ? "DECLARED"
        : "HOST_VERIFIED";

  let freshness:ContextMemoryQualityEvaluationV010["freshness"];
  if(!input.memory.observedAt){
    freshness={state:"UNKNOWN",freshnessWindowDays};
  }else{
    const observed=Date.parse(input.memory.observedAt);
    if(!Number.isFinite(observed)) throw new Error("CONTEXT_MEMORY_OBSERVED_AT_INVALID");
    const ageDays=Math.max(0,Math.floor((now.getTime()-observed)/86_400_000));
    freshness={
      state:ageDays>freshnessWindowDays ? "STALE" : "FRESH",
      observedAt:input.memory.observedAt,
      ageDays,
      freshnessWindowDays
    };
  }

  const open=input.qualityStore.listOpenForMemory(input.memory.memoryId)
    .filter(event=>sameContext(event.context,input.memory.context));
  const signals:string[]=[];
  if(input.memory.provenance.evidenceRefs.length===0) signals.push("EVIDENCE_REFS_MISSING");
  if(sources.length===0) signals.push("EVIDENCE_SOURCE_METADATA_MISSING");
  if(unverifiedSources>0) signals.push("EVIDENCE_SOURCE_UNVERIFIED");
  if(freshness.state==="UNKNOWN") signals.push("OBSERVATION_TIME_MISSING");
  if(freshness.state==="STALE") signals.push("OBSERVATION_STALE");
  if(open.length>0) signals.push("OPEN_CONTRADICTION");

  return {
    contractVersion:"0.1.0",
    memoryId:input.memory.memoryId,
    evidence:{
      referenceCount:input.memory.provenance.evidenceRefs.length,
      sourceCount:sources.length,
      hostVerifiedSources,
      declaredSources,
      unverifiedSources,
      trust
    },
    freshness,
    contradictions:{
      openCount:open.length,
      contradictionIds:open.map(v=>v.contradictionId).sort()
    },
    signals
  };
}
