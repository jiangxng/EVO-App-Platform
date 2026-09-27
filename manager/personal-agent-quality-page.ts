import type { CatalogBrowserV010 } from "../vendor/eidos/src/catalog-browser/contracts.js";
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

  const summaryItems = events.length === 0 ? [] : [
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
