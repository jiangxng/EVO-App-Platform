import { appendFileSync, existsSync, mkdirSync, readFileSync } from "node:fs";
import { dirname } from "node:path";
import type { ActiveContextRefV010 } from "../../contracts/platform-services.js";
import {
  evaluatePersonalAgentQualityV010,
  type PersonalAgentQualityEvaluationV010,
  type PersonalAgentQualityEvidenceV010
} from "./quality-evaluation.js";

export interface PersonalAgentQualityEvidenceEventV010 {
  contractVersion: "0.1.0";
  eventId: string;
  interactionId: string;
  occurredAt: string;
  principalSubjectId: string;
  context: ActiveContextRefV010;
  source: "HOST_OBSERVED" | "HUMAN_EVALUATED" | "LAB_EVALUATED";
  evidence: PersonalAgentQualityEvidenceV010;
  evaluation: PersonalAgentQualityEvaluationV010;
}

export interface PersonalAgentQualityEvidenceStoreV010 {
  list(): PersonalAgentQualityEvidenceEventV010[];
  append(event: PersonalAgentQualityEvidenceEventV010): void;
  aggregate(): {
    contractVersion: "0.1.0";
    interactions: number;
    observedToolCalls: number;
    successfulToolCalls: number;
    failedToolCalls: number;
    knownUnnecessaryClarifications: number;
    knownAvoidableChoiceMenus: number;
    knownExecutableStepsPushedToHuman: number;
    postAuthorizationContinuation: { pass: number; fail: number; unknown: number };
    verifiedCompletion: { pass: number; fail: number; unknown: number };
    correctionQuality: { pass: number; fail: number; unknown: number };
  };
}

function validate(event: PersonalAgentQualityEvidenceEventV010): PersonalAgentQualityEvidenceEventV010 {
  if (
    event.contractVersion !== "0.1.0"
    || !event.eventId.trim()
    || !event.interactionId.trim()
    || !event.principalSubjectId.trim()
    || !Number.isFinite(Date.parse(event.occurredAt))
    || !event.context?.contextId?.trim()
    || !["HOST_OBSERVED", "HUMAN_EVALUATED", "LAB_EVALUATED"].includes(event.source)
  ) throw new Error("PERSONAL_AGENT_QUALITY_EVIDENCE_EVENT_INVALID");
  if (event.evidence.interactionId !== event.interactionId) {
    throw new Error("PERSONAL_AGENT_QUALITY_EVIDENCE_INTERACTION_MISMATCH");
  }
  return structuredClone(event);
}

export function aggregatePersonalAgentQualityEvidenceV010(events: readonly PersonalAgentQualityEvidenceEventV010[]) {
  const latest = new Map<string, PersonalAgentQualityEvidenceEventV010>();
  for (const event of [...events].sort((a,b) =>
    a.occurredAt.localeCompare(b.occurredAt) || a.eventId.localeCompare(b.eventId)
  )) {
    const key = `${event.interactionId}:${event.source}`;
    latest.set(key, event);
  }
  const values = [...latest.values()];
  let toolCalls=0, success=0, failed=0, unnecessary=0, choices=0, pushed=0;
  const continuation={pass:0,fail:0,unknown:0};
  const completion={pass:0,fail:0,unknown:0};
  const correction={pass:0,fail:0,unknown:0};
  for (const event of values) {
    toolCalls += event.evidence.toolCalls;
    success += event.evidence.successfulToolCalls;
    failed += event.evidence.failedToolCalls;
    if (event.evaluation.metrics.unnecessaryClarifications === 1) unnecessary++;
    if (event.evaluation.metrics.avoidableChoiceMenus === 1) choices++;
    if (typeof event.evaluation.metrics.executableStepsPushedToHuman === "number") {
      pushed += event.evaluation.metrics.executableStepsPushedToHuman;
    }
    const p = event.evaluation.metrics.postAuthorizationContinuation;
    if (p === "PASS") continuation.pass++; else if (p === "FAIL") continuation.fail++; else if (p === "UNKNOWN") continuation.unknown++;
    const v = event.evaluation.metrics.verifiedCompletion;
    if (v === true) completion.pass++; else if (v === false) completion.fail++; else completion.unknown++;
    const q = event.evaluation.metrics.correctionQuality;
    if (q === "PASS") correction.pass++; else if (q === "FAIL") correction.fail++; else if (q === "UNKNOWN") correction.unknown++;
  }
  return {
    contractVersion: "0.1.0" as const,
    interactions: new Set(values.map(v=>v.interactionId)).size,
    observedToolCalls: toolCalls,
    successfulToolCalls: success,
    failedToolCalls: failed,
    knownUnnecessaryClarifications: unnecessary,
    knownAvoidableChoiceMenus: choices,
    knownExecutableStepsPushedToHuman: pushed,
    postAuthorizationContinuation: continuation,
    verifiedCompletion: completion,
    correctionQuality: correction
  };
}

export function createMemoryPersonalAgentQualityEvidenceStoreV010(): PersonalAgentQualityEvidenceStoreV010 {
  const events: PersonalAgentQualityEvidenceEventV010[] = [];
  return {
    list(){ return structuredClone(events); },
    append(event){
      if(events.some(v=>v.eventId===event.eventId)) throw new Error("PERSONAL_AGENT_QUALITY_EVIDENCE_DUPLICATE");
      events.push(validate(event));
    },
    aggregate(){ return aggregatePersonalAgentQualityEvidenceV010(events); }
  };
}

export function createJsonlPersonalAgentQualityEvidenceStoreV010(path:string): PersonalAgentQualityEvidenceStoreV010 {
  function read(): PersonalAgentQualityEvidenceEventV010[] {
    if(!existsSync(path)) return [];
    return readFileSync(path,"utf8").split("\n").map(v=>v.trim()).filter(Boolean).map(v=>validate(JSON.parse(v)));
  }
  return {
    list(){ return structuredClone(read()); },
    append(event){
      const valid=validate(event);
      if(read().some(v=>v.eventId===valid.eventId)) throw new Error("PERSONAL_AGENT_QUALITY_EVIDENCE_DUPLICATE");
      mkdirSync(dirname(path),{recursive:true});
      appendFileSync(path,JSON.stringify(valid)+"\n","utf8");
    },
    aggregate(){ return aggregatePersonalAgentQualityEvidenceV010(read()); }
  };
}

export function createHostObservedQualityEvidenceV010(input:{
  eventId:string;
  interactionId:string;
  occurredAt:string;
  principalSubjectId:string;
  context:ActiveContextRefV010;
  observations:Array<{ok:boolean}>;
}): PersonalAgentQualityEvidenceEventV010 {
  const successfulToolCalls=input.observations.filter(v=>v.ok).length;
  const failedToolCalls=input.observations.length-successfulToolCalls;
  const evidence: PersonalAgentQualityEvidenceV010 = {
    contractVersion:"0.1.0",
    interactionId:input.interactionId,
    toolCalls:input.observations.length,
    successfulToolCalls,
    failedToolCalls
  };
  return validate({
    contractVersion:"0.1.0",
    eventId:input.eventId,
    interactionId:input.interactionId,
    occurredAt:input.occurredAt,
    principalSubjectId:input.principalSubjectId,
    context:structuredClone(input.context),
    source:"HOST_OBSERVED",
    evidence,
    evaluation:evaluatePersonalAgentQualityV010(evidence)
  });
}
