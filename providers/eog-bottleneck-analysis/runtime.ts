import { createHash } from "node:crypto";
import type {
  EogAnalysisOverlayV020,
  EogAnalysisRequestV020,
  EogRuntimeFactV020,
  EnterpriseOperatingGraphAnalysisProviderV020
} from "../../contracts/enterprise-operating-graph-observatory.js";
import {
  EOG_BOTTLENECK_ANALYSIS_PROVIDER_ID
} from "./package.js";

function digest(value: unknown): string {
  return createHash("sha256")
    .update(JSON.stringify(value))
    .digest("hex");
}

function targetKey(fact: EogRuntimeFactV020): string {
  return fact.target.kind === "NODE"
    ? "NODE:" + fact.target.nodeId
    : "RELATION:" + fact.target.authority + ":" + fact.target.relationId;
}

function byTargetAndMetric(
  facts: readonly EogRuntimeFactV020[]
): Map<string, EogRuntimeFactV020> {
  const result = new Map<string, EogRuntimeFactV020>();
  for (const fact of facts) {
    const key = targetKey(fact) + "|" + fact.metric.code;
    if (!result.has(key)) result.set(key, fact);
  }
  return result;
}

function growth(current: number, previous: number): number {
  return (current - previous) / Math.max(Math.abs(previous), 1);
}

function overlay(input: {
  request: EogAnalysisRequestV020;
  target: { kind: "NODE"; nodeId: string };
  status: EogAnalysisOverlayV020["status"];
  severity: EogAnalysisOverlayV020["severity"];
  evidence: EogRuntimeFactV020[];
  score?: number;
  confidence?: number;
  details?: Record<string, string | number | boolean | null>;
}): EogAnalysisOverlayV020 {
  return {
    contractVersion: "0.2.0",
    overlayId: "bottleneck:" + digest({
      enterpriseId: input.request.enterpriseId,
      graphId: input.request.graphId,
      target: input.target,
      window: input.request.timeLens.primary,
      evidence: input.evidence.map(f => f.factId)
    }),
    enterpriseId: input.request.enterpriseId,
    graphId: input.request.graphId,
    target: input.target,
    analysisKind: "BOTTLENECK",
    status: input.status,
    severity: input.severity,
    ...(input.confidence === undefined ? {} : { confidence: input.confidence }),
    ...(input.score === undefined ? {} : { score: input.score }),
    window: structuredClone(input.request.timeLens.primary),
    evidenceFactIds: input.evidence.map(f => f.factId),
    derivedAt: input.request.timeLens.primary.endAt,
    source: {
      providerId: EOG_BOTTLENECK_ANALYSIS_PROVIDER_ID,
      analyzerRef: "evidence-backed-pressure-trend-v0.1"
    },
    ...(input.details ? { details: input.details } : {})
  };
}

export function createEogBottleneckAnalysisProviderV020():
EnterpriseOperatingGraphAnalysisProviderV020 {
  return {
    contractVersion: "0.2.0",
    providerId: EOG_BOTTLENECK_ANALYSIS_PROVIDER_ID,

    async analyze(request) {
      const current = byTargetAndMetric(request.primaryFacts);
      const previous = byTargetAndMetric(request.comparisonFacts);
      const nodeIds = [...new Set(
        request.primaryFacts
          .filter(f => f.target.kind === "NODE")
          .map(f => (f.target as { kind:"NODE"; nodeId:string }).nodeId)
      )].sort();

      const overlays: EogAnalysisOverlayV020[] = [];
      for (const nodeId of nodeIds) {
        const target = { kind: "NODE" as const, nodeId };
        const prefix = "NODE:" + nodeId + "|";
        const pressure =
          current.get(prefix + "flow.backlog")
          ?? current.get(prefix + "flow.wip")
          ?? current.get(prefix + "balance.quantity");
        const pressurePrev = pressure
          ? previous.get(prefix + pressure.metric.code)
          : undefined;
        const activity =
          current.get(prefix + "flow.throughput")
          ?? current.get(prefix + "event.frequency")
          ?? current.get(prefix + "event.count");
        const activityPrev = activity
          ? previous.get(prefix + activity.metric.code)
          : undefined;

        if (
          !pressure || !pressurePrev || !activity || !activityPrev
          || pressure.metric.unit !== pressurePrev.metric.unit
          || activity.metric.unit !== activityPrev.metric.unit
        ) {
          overlays.push(overlay({
            request,
            target,
            status: "INSUFFICIENT_EVIDENCE",
            severity: "INFO",
            evidence: [pressure, pressurePrev, activity, activityPrev]
              .filter((v): v is EogRuntimeFactV020 => Boolean(v)),
            details: {
              reason: "Requires comparable pressure and activity facts for both primary and previous periods."
            }
          }));
          continue;
        }

        const pressureGrowth = growth(pressure.value, pressurePrev.value);
        const activityGrowth = growth(activity.value, activityPrev.value);
        const score = pressureGrowth - activityGrowth;
        const observed = pressure.value > 0
          && pressureGrowth >= 0.10
          && score >= 0.15;
        const severity = !observed
          ? "INFO"
          : score >= 1
            ? "CRITICAL"
            : score >= 0.5
              ? "WARNING"
              : "WATCH";

        overlays.push(overlay({
          request,
          target,
          status: observed ? "OBSERVED" : "NOT_OBSERVED",
          severity,
          evidence: [pressure, pressurePrev, activity, activityPrev],
          score,
          confidence: 0.8,
          details: {
            pressureMetric: pressure.metric.code,
            pressureGrowth,
            activityMetric: activity.metric.code,
            activityGrowth,
            rule: "pressure grows materially faster than observed activity"
          }
        }));
      }

      return overlays;
    }
  };
}
