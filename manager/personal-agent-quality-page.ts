import type { CatalogBrowserItemV010, CatalogBrowserV010 } from "../vendor/eidos/src/catalog-browser/contracts.js";
import type { ReviewQueueV010 } from "../vendor/eidos/src/review-queue/contracts.js";
import type { ActiveContextRefV010, PlatformPrincipalV010 } from "../contracts/platform-services.js";
import {
  aggregatePersonalAgentQualityEvidenceV010,
  type PersonalAgentQualityEvidenceStoreV010
} from "../agents/enterprise-agent/quality-evidence-store.js";

function sameContext(a: ActiveContextRefV010, b: ActiveContextRefV010): boolean {
  return a.kind === b.kind
    && a.contextId === b.contextId
    && (a.kind !== "ENTERPRISE" || b.kind !== "ENTERPRISE" || a.enterpriseId === b.enterpriseId);
}

export function createPersonalAgentQualityPageV010(input:{
  principal:PlatformPrincipalV010;
  context:ActiveContextRefV010;
  store:PersonalAgentQualityEvidenceStoreV010;
}): CatalogBrowserV010 {
  const events=input.store.list()
    .filter(event =>
      event.principalSubjectId===input.principal.subjectId
      && sameContext(event.context,input.context)
    )
    .sort((a,b)=>b.occurredAt.localeCompare(a.occurredAt));
  const aggregate=aggregatePersonalAgentQualityEvidenceV010(events);

  const summaryItems: CatalogBrowserItemV010[] = events.length === 0 ? [] : [
    {
      id:"quality:evaluate",
      title:"Evaluate recent interactions",
      category:"Human evaluation",
      summary:"Add explicit Human judgments for collaboration dimensions that the Host cannot infer reliably.",
      primaryAction:{
        id:"open-quality-review",
        label:"Review interactions",
        type:"navigate",
        route:"/enterprise-agent/quality/review"
      },
      metadata:{
        humanEvaluatedInteractions:aggregate.humanEvaluatedInteractions,
        labEvaluatedInteractions:aggregate.labEvaluatedInteractions
      }
    },
    {
      id:"quality:tool-success",
      title:"Tool execution evidence",
      category:"Objective",
      summary:`${aggregate.successfulToolCalls}/${aggregate.observedToolCalls} successful · ${aggregate.failedToolCalls} failed`,
      status:{
        label:aggregate.failedToolCalls===0 ? "Observed healthy" : "Failures observed",
        tone:aggregate.failedToolCalls===0 ? "positive" as const : "warning" as const
      },
      metadata:{
        interactions:aggregate.interactions,
        observedToolCalls:aggregate.observedToolCalls,
        successfulToolCalls:aggregate.successfulToolCalls,
        failedToolCalls:aggregate.failedToolCalls
      }
    },
    {
      id:"quality:human-load",
      title:"Human coordination load",
      category:"Evaluated evidence",
      summary:`known unnecessary clarifications=${aggregate.knownUnnecessaryClarifications} · known avoidable choice menus=${aggregate.knownAvoidableChoiceMenus} · known executable steps pushed to Human=${aggregate.knownExecutableStepsPushedToHuman}`,
      status:{
        label:"Unknown remains unknown",
        tone:"neutral" as const
      },
      metadata:{
        postAuthorizationPass:aggregate.postAuthorizationContinuation.pass,
        postAuthorizationFail:aggregate.postAuthorizationContinuation.fail,
        postAuthorizationUnknown:aggregate.postAuthorizationContinuation.unknown
      }
    },
    {
      id:"quality:verification",
      title:"Completion and correction evidence",
      category:"Evaluated evidence",
      summary:`verified completion pass=${aggregate.verifiedCompletion.pass} fail=${aggregate.verifiedCompletion.fail} unknown=${aggregate.verifiedCompletion.unknown} · correction pass=${aggregate.correctionQuality.pass} fail=${aggregate.correctionQuality.fail} unknown=${aggregate.correctionQuality.unknown}`,
      status:{
        label:"Evidence only",
        tone:"neutral" as const
      }
    }
  ];

  return {
    contractVersion:"0.1.0",
    kind:"catalog-browser",
    id:"personal-agent.quality",
    title:"Personal Agent Quality",
    description:`Evidence-backed collaboration quality for ${input.context.contextId}. Subjective dimensions remain UNKNOWN until explicitly evaluated.`,
    items:[
      ...summaryItems,
      ...events.slice(0,50).map(event=>({
        id:event.eventId,
        title:event.interactionId,
        category:event.source,
        summary:[
          `tool calls=${event.evidence.toolCalls}`,
          `success=${event.evidence.successfulToolCalls}`,
          `failed=${event.evidence.failedToolCalls}`,
          event.evaluation.signals.length ? `signals=${event.evaluation.signals.join(",")}` : "no negative observed signal"
        ].join(" · "),
        status:{
          label:event.evaluation.signals.length ? "Review evidence" : "Observed",
          tone:event.evaluation.signals.length ? "warning" as const : "positive" as const
        },
        metadata:{
          occurredAt:event.occurredAt,
          source:event.source
        }
      }))
    ],
    emptyMessage:"No real Personal Agent quality evidence exists for this Context yet. Use Personal Agent first; this surface does not fabricate sample metrics."
  };
}


function triOptions() {
  return [
    { label:"Unknown / not evaluated", value:"UNKNOWN" },
    { label:"Yes", value:"YES" },
    { label:"No", value:"NO" }
  ];
}

export function createPersonalAgentQualityReviewPageV010(input:{
  principal:PlatformPrincipalV010;
  context:ActiveContextRefV010;
  store:PersonalAgentQualityEvidenceStoreV010;
}):ReviewQueueV010{
  const all=input.store.list()
    .filter(event=>
      event.principalSubjectId===input.principal.subjectId
      && sameContext(event.context,input.context)
    );
  const latestHost=new Map<string,(typeof all)[number]>();
  const latestHuman=new Map<string,(typeof all)[number]>();
  const latestLab=new Map<string,(typeof all)[number]>();
  for(const event of [...all].sort((a,b)=>
    a.occurredAt.localeCompare(b.occurredAt)||a.eventId.localeCompare(b.eventId)
  )){
    if(event.source==="HOST_OBSERVED") latestHost.set(event.interactionId,event);
    else if(event.source==="HUMAN_EVALUATED") latestHuman.set(event.interactionId,event);
    else if(event.source==="LAB_EVALUATED") latestLab.set(event.interactionId,event);
  }

  const items=[...latestHost.values()]
    .sort((a,b)=>b.occurredAt.localeCompare(a.occurredAt))
    .slice(0,50)
    .map(host=>{
      const human=latestHuman.get(host.interactionId);
      const lab=latestLab.get(host.interactionId);
      const effective=human ?? lab;
      const evidence=effective?.evidence;
      const tri=(value:boolean|undefined)=>value===undefined ? "UNKNOWN" : value ? "YES" : "NO";
      return {
        id:host.interactionId,
        title:host.interactionId,
        summary:`Observed ${host.occurredAt} · tool calls=${host.evidence.toolCalls} · success=${host.evidence.successfulToolCalls} · failed=${host.evidence.failedToolCalls}`,
        state:human ? "accepted" as const : "pending" as const,
        statusLabel:human ? "Human evaluated" : lab ? "Lab evaluated; Human review available" : "Needs Human evaluation",
        metrics:[
          {id:"tool-success",label:"Tool success",value:host.evidence.toolCalls===0 ? "—" : `${host.evidence.successfulToolCalls}/${host.evidence.toolCalls}`},
          {id:"lab",label:"Lab evaluation",value:lab ? "Available" : "None"},
          {id:"human",label:"Human evaluation",value:human ? "Available" : "None"}
        ],
        fields:[
          {key:"evaluationSource",label:"Evaluation source",control:"select" as const,value:"HUMAN_EVALUATED",readOnly:true,options:[{label:"Human",value:"HUMAN_EVALUATED"}]},
          {key:"clarificationAsked",label:"Did the Agent ask a clarification?",control:"select" as const,value:tri(evidence?.clarificationAsked),options:triOptions()},
          {key:"clarificationWasNecessary",label:"Was that clarification necessary?",control:"select" as const,value:tri(evidence?.clarificationWasNecessary),options:triOptions()},
          {key:"presentedEquivalentOptionsWithoutRecommendation",label:"Did it present equivalent options without a recommendation?",control:"select" as const,value:tri(evidence?.presentedEquivalentOptionsWithoutRecommendation),options:triOptions()},
          {key:"executableStepsReturnedToHuman",label:"Executable steps pushed back to you (leave blank if unknown)",control:"text" as const,value:evidence?.executableStepsReturnedToHuman===undefined ? "" : String(evidence.executableStepsReturnedToHuman)},
          {key:"authorizationRequired",label:"Was Human authorization required?",control:"select" as const,value:tri(evidence?.authorizationRequired),options:triOptions()},
          {key:"authorizationGranted",label:"Was authorization granted?",control:"select" as const,value:tri(evidence?.authorizationGranted),options:triOptions()},
          {key:"continuedAfterAuthorization",label:"Did the Agent continue after authorization?",control:"select" as const,value:tri(evidence?.continuedAfterAuthorization),options:triOptions()},
          {key:"completionVerified",label:"Was completion actually verified?",control:"select" as const,value:tri(evidence?.completionVerified),options:triOptions()},
          {key:"correctedApproach",label:"Did the Agent correct the approach?",control:"select" as const,value:tri(evidence?.correctedApproach),options:triOptions()},
          {key:"correctionPreservedHumanGoal",label:"Did correction preserve your valid goal?",control:"select" as const,value:tri(evidence?.correctionPreservedHumanGoal),options:triOptions()}
        ],
        evidence:[
          {id:"host",title:"Host-observed evidence",source:"HOST_OBSERVED",detail:host.eventId},
          ...(lab ? [{id:"lab",title:"Latest Lab evaluation",source:"LAB_EVALUATED",detail:lab.eventId}] : []),
          ...(human ? [{id:"human",title:"Latest Human evaluation",source:"HUMAN_EVALUATED",detail:human.eventId}] : [])
        ],
        primaryAction:{
          id:"evaluate-quality",
          label:human ? "Update evaluation" : "Save evaluation",
          type:"command" as const,
          command:"enterprise-agent.quality.evaluate",
          inputVersion:"0.1.0",
          primary:true
        },
        metadata:{
          hostEvidenceEventId:host.eventId,
          humanEvaluationEventId:human?.eventId ?? null,
          labEvaluationEventId:lab?.eventId ?? null
        }
      };
    });

  return {
    contractVersion:"0.1.0",
    kind:"review-queue",
    id:"personal-agent.quality-review",
    title:"Personal Agent Quality Review",
    description:"Human evaluation adds explicit subjective evidence. It never rewrites Host-observed facts or grants the Agent authority.",
    items,
    emptyMessage:"No Host-observed Personal Agent interactions are available to evaluate.",
    metadata:{
      contextId:input.context.contextId,
      principalSubjectId:input.principal.subjectId
    }
  };
}
