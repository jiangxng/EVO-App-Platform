import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import type {
  ActiveContextRefV010,
  ContextMemoryKindV010,
  ContextMemoryPrivacyClassV010
} from "../contracts/platform-services.js";
import type { ContextMemoryRetentionSimulationResultV010 } from "./context-memory-retention-simulation.js";

export type ContextMemoryRetentionDraftStateV010 =
  | "PREPARED"
  | "COMMITTED"
  | "DISCARDED";

export interface ContextMemoryRetentionDraftPolicyV010 {
  contractVersion: "0.1.0";
  policyId: string;
  retainForDays: number;
  kinds?: ContextMemoryKindV010[];
  privacyClasses?: ContextMemoryPrivacyClassV010[];
  reason?: string;
}

export interface ContextMemoryRetentionDraftEventV010 {
  contractVersion: "0.1.0";
  eventId: string;
  draftId: string;
  context: ActiveContextRefV010;
  state: ContextMemoryRetentionDraftStateV010;
  policy: ContextMemoryRetentionDraftPolicyV010;
  simulation: ContextMemoryRetentionSimulationResultV010;
  occurredAt: string;
  actorSubjectId: string;
  committedPolicyEventId?: string;
}

export interface ContextMemoryRetentionDraftSnapshotV010 {
  contractVersion: "0.1.0";
  events: ContextMemoryRetentionDraftEventV010[];
}

export interface ContextMemoryRetentionDraftV010
  extends Omit<ContextMemoryRetentionDraftEventV010, "eventId"> {
  effectiveEventId: string;
}

export interface ContextMemoryRetentionDraftStoreV010 {
  snapshot(): ContextMemoryRetentionDraftSnapshotV010;
  append(event: ContextMemoryRetentionDraftEventV010): void;
  get(draftId:string): ContextMemoryRetentionDraftV010 | undefined;
  listForContext(context:ActiveContextRefV010): ContextMemoryRetentionDraftV010[];
}

function sameContext(a:ActiveContextRefV010,b:ActiveContextRefV010){
  return a.kind===b.kind
    && a.contextId===b.contextId
    && (a.kind!=="ENTERPRISE" || b.kind!=="ENTERPRISE" || a.enterpriseId===b.enterpriseId);
}

function validate(snapshot:ContextMemoryRetentionDraftSnapshotV010){
  if(snapshot.contractVersion!=="0.1.0" || !Array.isArray(snapshot.events)){
    throw new Error("CONTEXT_MEMORY_RETENTION_DRAFT_STATE_INVALID");
  }
  const eventIds=new Set<string>();
  for(const event of snapshot.events){
    if(!event.eventId?.trim() || eventIds.has(event.eventId)) throw new Error("CONTEXT_MEMORY_RETENTION_DRAFT_EVENT_INVALID");
    eventIds.add(event.eventId);
    if(!event.draftId?.trim() || !event.context?.contextId?.trim()) throw new Error("CONTEXT_MEMORY_RETENTION_DRAFT_TARGET_INVALID");
    if(!["PREPARED","COMMITTED","DISCARDED"].includes(event.state)) throw new Error("CONTEXT_MEMORY_RETENTION_DRAFT_STATE_INVALID");
    if(!event.policy?.policyId?.trim() || !Number.isInteger(event.policy.retainForDays) || event.policy.retainForDays<1){
      throw new Error("CONTEXT_MEMORY_RETENTION_DRAFT_POLICY_INVALID");
    }
    if(!Number.isFinite(Date.parse(event.occurredAt))) throw new Error("CONTEXT_MEMORY_RETENTION_DRAFT_TIME_INVALID");
  }
  return structuredClone(snapshot);
}

function latest(events:readonly ContextMemoryRetentionDraftEventV010[]){
  const values=new Map<string,ContextMemoryRetentionDraftEventV010>();
  for(const event of [...events].sort((a,b)=>a.occurredAt.localeCompare(b.occurredAt)||a.eventId.localeCompare(b.eventId))){
    values.set(event.draftId,event);
  }
  return values;
}

function materialize(event:ContextMemoryRetentionDraftEventV010):ContextMemoryRetentionDraftV010{
  const {eventId,...rest}=event;
  return {...structuredClone(rest),effectiveEventId:eventId};
}

export function createMemoryContextMemoryRetentionDraftStoreV010(
  seed:ContextMemoryRetentionDraftSnapshotV010={contractVersion:"0.1.0",events:[]}
):ContextMemoryRetentionDraftStoreV010{
  let current=validate(seed);
  return {
    snapshot(){return structuredClone(current);},
    append(event){
      if(current.events.some(v=>v.eventId===event.eventId)) throw new Error("CONTEXT_MEMORY_RETENTION_DRAFT_EVENT_DUPLICATE");
      current=validate({contractVersion:"0.1.0",events:[...current.events,structuredClone(event)]});
    },
    get(draftId){
      const event=latest(current.events).get(draftId);
      return event ? materialize(event) : undefined;
    },
    listForContext(context){
      return [...latest(current.events).values()]
        .filter(event=>sameContext(event.context,context))
        .map(materialize)
        .sort((a,b)=>b.occurredAt.localeCompare(a.occurredAt)||a.draftId.localeCompare(b.draftId));
    }
  };
}

function read(path:string):ContextMemoryRetentionDraftSnapshotV010{
  if(!existsSync(path)) return {contractVersion:"0.1.0",events:[]};
  return JSON.parse(readFileSync(path,"utf8"));
}
function write(path:string,snapshot:ContextMemoryRetentionDraftSnapshotV010){
  mkdirSync(dirname(path),{recursive:true});
  const tmp=path+".tmp";
  writeFileSync(tmp,JSON.stringify(snapshot,null,2)+"\n","utf8");
  renameSync(tmp,path);
}

export function createFileContextMemoryRetentionDraftStoreV010(path:string):ContextMemoryRetentionDraftStoreV010{
  return {
    snapshot(){return createMemoryContextMemoryRetentionDraftStoreV010(read(path)).snapshot();},
    append(event){
      const store=createMemoryContextMemoryRetentionDraftStoreV010(read(path));
      store.append(event); write(path,store.snapshot());
    },
    get(draftId){return createMemoryContextMemoryRetentionDraftStoreV010(read(path)).get(draftId);},
    listForContext(context){return createMemoryContextMemoryRetentionDraftStoreV010(read(path)).listForContext(context);}
  };
}
