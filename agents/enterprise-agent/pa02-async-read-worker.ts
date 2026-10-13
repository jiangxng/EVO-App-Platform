import type { LlmInferenceProvider } from "../../contracts/llm.js";
import type { AgentRunEventV010, AgentRunV010 } from "../../contracts/agent-run.js";
import type {
  PlatformPrincipalV010, ResolvedContextSetV010, PlatformRequestContextV010
} from "../../contracts/platform-services.js";
import type {
  AgentToolCatalogV010, AgentToolDescriptorV010, AgentToolObservation,
  AgentModelDecision
} from "./contracts.js";
import type { FencedAgentRunAuthorityV030 } from "./pa02b-fenced-run-authority.js";
import { hostResolvedAgentDurabilityScopeV020 } from "../../manager/agent-durability-host-bridge.js";
import { createProviderBackedAgentModel } from "./provider-model.js";

interface ResumeInputV030 {
  runId: string;
  workerId: string;
  principal: PlatformPrincipalV010;
  context: ResolvedContextSetV010;
  requestContext?: PlatformRequestContextV010;
}
interface ResumeResultV030 {
  run: AgentRunV010;
  advanced: boolean;
  claimed: boolean;
  writeDeferred: boolean;
}
export interface ReadOnlyFencedAgentWorkerV030 {
  resumeOnce(input:ResumeInputV030):Promise<ResumeResultV030>;
}
export interface ReadOnlyFencedWorkerDependenciesV030 {
  authority:FencedAgentRunAuthorityV030;
  resolveProvider():LlmInferenceProvider|undefined;
  createToolCatalog(
    run:AgentRunV010,
    principal:PlatformPrincipalV010,
    context:ResolvedContextSetV010,
    requestContext:PlatformRequestContextV010|undefined,
    interaction:{sourceInteractionId:string;sourceActionId:string}
  ):AgentToolCatalogV010;
  eventId():string;
  sliceId():string;
  now?:()=>Date;
  ttlSeconds?:number;
  /** Enable only for a Host Worker that intentionally yields after each slice. */
  releaseOnReturn?:boolean;
}
function required(s:unknown):string {
  if(typeof s!=="string"||!s.trim())throw Error("PA02_WORKER_ID_REQUIRED");
  return s.trim();
}
function errorCode(e:unknown):string {
  const message=e instanceof Error?e.message:String(e);
  return /^[A-Z0-9_]+$/.test(message.split(":")[0])?message.split(":")[0]:"PA02_WORKER_READ_FAILED";
}
function stable(value:unknown):unknown {
  if(Array.isArray(value))return value.map(stable);
  if(value!==null&&typeof value==="object")
    return Object.fromEntries(Object.entries(value as Record<string,unknown>)
      .sort(([a],[b])=>a.localeCompare(b)).map(([k,v])=>[k,stable(v)]));
  return value;
}
function signature(tool:string,args:unknown) {
  return tool+":"+JSON.stringify(stable(args));
}

/**
 * Staged worker actually drives a Run with a real Host-resolved Principal and
 * V010 model/tool contracts. READ only: no business WRITE is dispatched here.
 *
 * Every transition uses a scoped PostgreSQL lease/fencing token + Run CAS.
 * Crash between READ dispatch/observation can repeat READ (by contract).
 * Crash after a durable WRITE decision does NOT dispatch it; only the
 * separately governed Owner/receipt port can supply a WRITE execution path.
 *
 * NOT registered in production manager/server.ts.
 */
export function createReadOnlyFencedAgentWorkerV030(
  deps:ReadOnlyFencedWorkerDependenciesV030
):ReadOnlyFencedAgentWorkerV030 {
  const time=()=> (deps.now?.()??new Date()).toISOString();
  const ttl=deps.ttlSeconds??180;
  return {
    async resumeOnce(input) {
      const runId=required(input.runId),workerId=required(input.workerId);
      const scope=hostResolvedAgentDurabilityScopeV020({
        principal:input.principal,context:input.context
      });
      const lease=await deps.authority.claim({
        scope,runId,workerId,ttlSeconds:ttl
      });
      if(!lease) {
        const state=await deps.authority.read({scope,runId});
        if(!state)throw Error("AGENT_RUN_NOT_FOUND");
        return {run:state.run,advanced:false,claimed:false,writeDeferred:false};
      }
      try {
      let current=await deps.authority.read({scope,runId});
      if(!current)throw Error("PA02_WORKER_RUN_MISSING_AFTER_CLAIM");
      const append=async (
        type:Exclude<AgentRunEventV010["type"],"RUN_CREATED"|"RUN_CANCELLED">,
        payload:Record<string,unknown>,
        sliceId?:string
      )=>{
        const event:AgentRunEventV010={
          contractVersion:"0.1.0",eventId:"agent-run-event:"+deps.eventId(),
          runId,type,occurredAt:time(),payload,...(sliceId?{sliceId}:{})
        };
        current=await deps.authority.append({
          scope,lease,expectedRevision:current!.revision,event
        });
        return current.run;
      };
      const output=(advanced:boolean,writeDeferred=false):ResumeResultV030=>({
        run:current!.run,advanced,claimed:true,writeDeferred
      });
      let run=current.run;
      if(["SUCCEEDED","FAILED","BLOCKED","CANCELLED"].includes(run.state))
        return output(false);

      // Crash after durable READ observation but before SLICE_PAUSED.
      if(run.state==="PAUSED"&&run.activeSliceId) {
        await append("SLICE_PAUSED",{},run.activeSliceId);
        return output(true);
      }
      const pending=[...run.decisions].reverse().find(d=>
        d.decision.type==="tool" && d.observation===undefined
      );
      const pendingFinal=run.state==="RUNNING" &&
        run.decisions[run.decisions.length-1]?.decision.type==="final"
        ? run.decisions[run.decisions.length-1] : undefined;
      if(pendingFinal?.decision.type==="final") {
        await append("RUN_SUCCEEDED",{message:pendingFinal.decision.message});
        return output(true);
      }
      const catalog=deps.createToolCatalog(
        run,input.principal,input.context,input.requestContext,
        {sourceInteractionId:run.runId,sourceActionId:
          pending?.decisionEventId??"agent-run-read-list:"+run.activeSliceId}
      );
      const allTools=await catalog.list();
      const reads=allTools.filter(t=>t.effect==="READ");

      const observe=async (
        decisionRecord:AgentRunV010["decisions"][number],
        descriptor:AgentToolDescriptorV010|undefined
      )=>{
        if(decisionRecord.decision.type!=="tool")
          throw Error("PA02_WORKER_TOOL_DECISION_REQUIRED");
        const call=decisionRecord.decision.call;
        if(!descriptor||descriptor.effect!=="READ") {
          await append("RUN_BLOCKED",{
            code:"PA02_WORKER_WRITE_REQUIRES_OWNER_PORT",
            reason:"This staged Worker cannot replay or invoke a material WRITE."
          });
          return output(true,true);
        }
        const stillOwned=await deps.authority.renew({scope,lease,ttlSeconds:ttl});
        if(!stillOwned) {
          // Cancellation or lease loss. Never invoke the READ after losing owner
          // status and never report a terminal state on this stale worker.
          return output(false);
        }
        const alreadyRead=run.decisions.some(d=>
          d.decision.type==="tool" &&
          d.observation?.ok &&
          signature(d.decision.call.tool,d.decision.call.arguments)===
            signature(call.tool,call.arguments)
        );
        let observation:AgentToolObservation;
        if(alreadyRead) {
          observation={tool:call.tool,ok:false,error:{
            code:"AGENT_READ_REPEAT_SUPPRESSED",
            message:"Identical READ already succeeded in this durable Run."
          }};
        } else {
          try {
            observation=await catalog.invoke(call,run.observations);
          } catch(e) {
            observation={tool:call.tool,ok:false,error:{
              code:errorCode(e),message:e instanceof Error?e.message:String(e)
            }};
          }
        }
        // A crashed worker can lose its fence after the READ; the observation
        // is then discarded, and a replacement can safely issue a new READ.
        run=await append("TOOL_OBSERVATION_RECORDED",{
          observation,decisionEventId:decisionRecord.decisionEventId
        },decisionRecord.sliceId);
        await append("SLICE_PAUSED",{},decisionRecord.sliceId);
        return output(true);
      };

      if(pending) {
        return observe(pending,allTools.find(t=>
          pending.decision.type==="tool"&&t.id===pending.decision.call.tool
        ));
      }
      const provider=deps.resolveProvider();
      if(!provider||provider.providerId!==run.input.providerId||
        provider.modelId!==run.input.modelId) {
        await append("RUN_BLOCKED",{code:"AGENT_RUN_PROVIDER_UNAVAILABLE",
          reason:"The original Provider/model is not available to resume."});
        return output(true);
      }
      const sliceId=run.state==="RUNNING"&&run.activeSliceId
        ?run.activeSliceId:"agent-run-slice:"+deps.sliceId();
      if(!(run.state==="RUNNING"&&run.activeSliceId))
        run=await append("SLICE_STARTED",{},sliceId);
      let decision:AgentModelDecision;
      try{
        decision=await createProviderBackedAgentModel(provider).decide({
          userMessage:run.input.message,
          ...(run.input.conversationHistory.length?{
            conversationHistory:structuredClone(run.input.conversationHistory)
          }:{}),
          ...(run.input.interactionContext?{
            interactionContext:structuredClone(run.input.interactionContext)
          }:{}),
          tools:structuredClone(reads),
          observations:structuredClone(run.observations),
          principal:structuredClone(input.principal),
          context:structuredClone(input.context)
        });
      }catch(e){
        await append("RUN_FAILED",{code:errorCode(e),
          reason:e instanceof Error?e.message:String(e)});
        return output(true);
      }
      run=await append("MODEL_DECISION_RECORDED",{decision},sliceId);
      if(decision.type==="final") {
        await append("RUN_SUCCEEDED",{message:decision.message});
        return output(true);
      }
      return observe(run.decisions[run.decisions.length-1],
        allTools.find(t=>t.id===decision.call.tool));
      } finally {
        if(deps.releaseOnReturn) {
          // On a clean yield, allow another Worker to claim without waiting
          // the TTL. An expired or superseded Worker cannot free its successor.
          await deps.authority.release({scope,lease});
        }
      }
    }
  };
}
