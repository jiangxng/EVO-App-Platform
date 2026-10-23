import type {ActionExecutionResult,ActionHost} from "../adapters/ports.js";
import type {ActionRequestV010,JsonValue} from "../runtime/contracts.js";

export interface PersonalAgentRunRecoveryV010 {
  runId:string;
  state:"READY"|"RUNNING"|"PAUSED"|"BLOCKED"|"SUCCEEDED"|"FAILED"|"CANCELLED";
  lastEventId:string;
  actionReceiptIds:string[];
  eventIds:string[];
  resetRequired:boolean;
}
export type PersonalAgentOutboxRecoveryResultV010 =
  | {availability:"UNAVAILABLE"}
  | {availability:"ERROR";error:ActionExecutionResult}
  | {availability:"AVAILABLE";recovery:PersonalAgentRunRecoveryV010};

const states=new Set([
  "READY","RUNNING","PAUSED","BLOCKED","SUCCEEDED","FAILED","CANCELLED"
]);
function object(v:unknown):Record<string,unknown>|undefined{
  return v!==null&&typeof v==="object"&&!Array.isArray(v)
    ?v as Record<string,unknown>:undefined;
}
function failure(code:string):PersonalAgentOutboxRecoveryResultV010{
  return {availability:"ERROR",error:{ok:false,error:{
    code,message:"Durable Run event replay is inconsistent. No Agent work was reissued; refresh the same conversation to recover its authoritative state."
  }}};
}

/**
 * Eidos PA-02 R05/R06: consume the *existing* authenticated Host Run Outbox.
 * This helper is read-only, never issues run.start/run.resume/tool dispatch,
 * and never substitutes client event contents for authoritative Run state.
 * The caller decides whether it is safe to resume the SAME pending Thread.
 */
export async function recoverPersonalAgentRunEventsV010(input:{
  actionHost:ActionHost;
  request:ActionRequestV010;
  runId:string;
  maxPages?:number;
}):Promise<PersonalAgentOutboxRecoveryResultV010>{
  const runId=input.runId.trim(),maxPages=input.maxPages??16;
  if(!runId||!Number.isInteger(maxPages)||maxPages<1||maxPages>32)
    return failure("EIDOS_PA02_RUN_RECOVERY_REQUEST_INVALID");
  let afterEventId:string|undefined;
  let ordinal=-1;
  const seen=new Set<string>();
  for(let page=0;page<maxPages;page++){
    const values:Record<string,JsonValue>={
      runId,limit:100,
      ...(afterEventId?{afterEventId}:{})
    };
    for(const key of ["activeContext","locale"]){
      const value=input.request.values[key];
      if(value!==undefined)values[key]=structuredClone(value);
    }
    const response=await input.actionHost.execute({
      contractVersion:"0.1.0",type:"command",
      command:{code:"enterprise-agent.run.events",
        inputVersion:input.request.command.inputVersion},
      actionId:"chat.run.events:"+page,
      sourceInteractionId:input.request.sourceInteractionId,
      values,requiresConfirmation:false,
      ...(input.request.runtimeInstanceId
        ?{runtimeInstanceId:input.request.runtimeInstanceId}:{})
    });
    if(!response.ok){
      if(page===0&&[
        "ACTION_HANDLER_NOT_FOUND","ACTION_FEATURE_NOT_ACTIVE"
      ].includes(response.error?.code??""))
        return {availability:"UNAVAILABLE"};
      return {availability:"ERROR",error:response};
    }
    const result=object(response.result),run=object(result?.run);
    if(!result||!run||run.runId!==runId||
      typeof run.state!=="string"||!states.has(run.state)||
      typeof run.lastEventId!=="string"||!run.lastEventId||
      !Array.isArray(run.actionReceiptIds)||
      run.actionReceiptIds.some(id=>typeof id!=="string"||!id.trim())||
      !Array.isArray(result.events)||
      typeof result.resetRequired!=="boolean"||
      typeof result.hasMore!=="boolean")
      return failure("EIDOS_PA02_RUN_EVENT_RESPONSE_INVALID");
    const recovery:PersonalAgentRunRecoveryV010={
      runId,state:run.state as PersonalAgentRunRecoveryV010["state"],
      lastEventId:run.lastEventId,
      actionReceiptIds:[...new Set(run.actionReceiptIds as string[])],
      eventIds:[...seen],resetRequired:result.resetRequired
    };
    if(result.resetRequired){
      // Discard potentially partial deltas. The scoped snapshot above is the
      // sole authority, including its final status and committed receipts.
      return {availability:"AVAILABLE",recovery:{
        ...recovery,eventIds:[],resetRequired:true
      }};
    }
    for(const entry of result.events){
      const record=object(entry),event=object(record?.event);
      if(!record||!event||typeof record.eventId!=="string"||
        !record.eventId||event.eventId!==record.eventId||
        event.runId!==runId||!Number.isSafeInteger(record.ordinal)||
        (record.ordinal as number)<0)
        return failure("EIDOS_PA02_RUN_EVENT_RESPONSE_INVALID");
      if(seen.has(record.eventId))continue;
      if(record.ordinal!==ordinal+1)
        return {availability:"AVAILABLE",recovery:{
          ...recovery,eventIds:[],resetRequired:true
        }};
      ordinal=record.ordinal as number;
      seen.add(record.eventId);
    }
    if(!result.hasMore)
      return {availability:"AVAILABLE",recovery:{
        ...recovery,eventIds:[...seen]
      }};
    if(typeof result.nextCursor!=="string"||
      !result.nextCursor||result.nextCursor===afterEventId||
      !seen.has(result.nextCursor))
      return failure("EIDOS_PA02_RUN_EVENT_CURSOR_INVALID");
    afterEventId=result.nextCursor;
  }
  return failure("EIDOS_PA02_RUN_EVENT_REPLAY_LIMIT");
}
