import type {
  AppActionExecutionResultV010,
  AppActionHandler,
  AppActionRequestV010,
  JsonValue
} from "../../actions/contracts.js";
import {
  ENTERPRISE_OBSERVATORY_2D_FEATURE_ID,
  ENTERPRISE_OBSERVATORY_PACKAGE_ID
} from "./package.js";
import type {
  EogAnalysisOverlayV020,
  EogAnalysisSnapshotV020,
  EogObservationSnapshotV020,
  EogRuntimeFactV020,
  EogTimeLensV020
} from "../../contracts/enterprise-operating-graph-observatory.js";
import {
  PRIMARY_ENTERPRISE_OPERATING_GRAPH_ID_V010,
  type EnterpriseOperatingGraphV010
} from "../../contracts/enterprise-operating-graph.js";
import type {
  ActiveContextRefV010,
  PlatformRequestContextV010
} from "../../contracts/platform-services.js";
import type {
  EntityInspectorMetricV010,
  EntityInspectorV010
} from "../../vendor/eidos/src/entity-inspector/contracts.js";
import type {
  EnterpriseOperatingGraphReadProviderV010
} from "../../contracts/enterprise-operating-graph-read.js";
import type {
  EnterpriseOperatingGraphObservatoryProviderResolverV020
} from "../../contracts/enterprise-operating-graph-observatory-runtime.js";
import {
  parseEogMetricCodesV020,
  parseEogTimeLensInputV020
} from "../../eog/observatory-input.js";

export const EOG_MOBILE_READ_PAGE_SOURCE =
  "app://evo-enterprise-operating-graph/pages/observatory-mobile-read";
export const EOG_MOBILE_READ_ROUTE =
  "/m/operating-graph/observe";
export const EOG_MOBILE_READ_GET_ACTION =
  "enterprise-operating-graph.observatory.mobile-read.get";

export interface MobileEntityInspectorReaderPageV010 {
  contractVersion: "0.1.0";
  kind: "entity-inspector-reader";
  id: string;
  title: string;
  resourceId: string;
  readCommand: {
    code: string;
    inputVersion: string;
  };
  requestValues: Record<string, JsonValue>;
}

function defaultTimeLens(now: Date): EogTimeLensV020 {
  return {
    contractVersion: "0.2.0",
    primary: {
      startAt: new Date(now.getTime() - 24 * 3_600_000).toISOString(),
      endAt: now.toISOString()
    },
    comparison: {
      kind: "PREVIOUS_PERIOD"
    }
  };
}

export function createEnterpriseOperatingGraphMobileReadPageV010(input: {
  activeContext: ActiveContextRefV010;
  now?: Date;
}): MobileEntityInspectorReaderPageV010 {
  return {
    contractVersion: "0.1.0",
    kind: "entity-inspector-reader",
    id: "evo-enterprise-operating-graph.observatory.mobile-read",
    title: "Enterprise Observatory",
    resourceId: PRIMARY_ENTERPRISE_OPERATING_GRAPH_ID_V010,
    readCommand: {
      code: EOG_MOBILE_READ_GET_ACTION,
      inputVersion: "0.1.0"
    },
    requestValues: {
      resourceId: PRIMARY_ENTERPRISE_OPERATING_GRAPH_ID_V010,
      activeContext: structuredClone(input.activeContext) as unknown as JsonValue,
      timeLens: defaultTimeLens(input.now ?? new Date()) as unknown as JsonValue,
      metricCodes: [
        "event.count",
        "event.frequency",
        "business.quantity",
        "business.amount",
        "balance.quantity",
        "balance.amount",
        "sop.transition.count",
        "sop.trace.transition",
        "sop.trace.coverage"
      ]
    }
  };
}

function text(locale: string | undefined) {
  const normalized = locale?.toLowerCase() ?? "en";
  if (normalized.startsWith("zh")) {
    return {
      title: "企业运行摘要",
      description: "当前企业运行图的只读 Runtime Facts 与分析证据。",
      empty: "当前运行图没有可查看的实体。",
      freshness: "Runtime Facts",
      providerUnavailable: "Runtime Fact Provider 尚不可用。",
      noGraph: "当前企业还没有运行图。",
      evidence: "运行证据",
      analysis: "分析",
      insufficient: "证据不足"
    };
  }
  return {
    title: "Enterprise runtime",
    description: "Read-only Runtime Facts and analysis evidence for the current Enterprise Operating Graph.",
    empty: "No observable entities are available.",
    freshness: "Runtime Facts",
    providerUnavailable: "Runtime Fact Provider is unavailable.",
    noGraph: "No Enterprise Operating Graph exists for this enterprise.",
    evidence: "Runtime evidence",
    analysis: "Analysis",
    insufficient: "Insufficient evidence"
  };
}

function enterpriseId(context: PlatformRequestContextV010): string {
  const active = context.context?.activeContext;
  if (
    active?.kind !== "ENTERPRISE"
    || !active.enterpriseId?.trim()
  ) {
    throw new Error("EOG_ENTERPRISE_CONTEXT_REQUIRED");
  }
  if (context.principal.actorType !== "HUMAN") {
    throw new Error("EOG_HUMAN_ACTION_REQUIRED");
  }
  return active.enterpriseId.trim();
}

function metricLabel(code: string): string {
  const labels: Record<string, string> = {
    "event.count": "Events",
    "event.frequency": "Frequency",
    "business.quantity": "Net quantity",
    "business.amount": "Net amount",
    "balance.quantity": "Balance qty",
    "balance.amount": "Balance amount",
    "sop.transition.count": "SOP transitions",
    "sop.trace.transition": "SOP trace",
    "sop.trace.coverage": "Trace coverage"
  };
  return labels[code] ?? code;
}

function metricValue(fact: EogRuntimeFactV020): {
  value: string;
  unit?: string;
} {
  return {
    value: new Intl.NumberFormat("en", {
      maximumFractionDigits: Math.abs(fact.value) >= 100 ? 0 : 2
    }).format(fact.value),
    ...(fact.metric.unit ? { unit: fact.metric.unit } : {})
  };
}

function targetNodeId(fact: EogRuntimeFactV020): string | undefined {
  return fact.target.kind === "NODE"
    ? fact.target.nodeId
    : undefined;
}

function overlaysForNode(
  snapshot: EogObservationSnapshotV020 | EogAnalysisSnapshotV020,
  nodeId: string
): EogAnalysisOverlayV020[] {
  return "overlays" in snapshot
    ? snapshot.overlays.filter(
        overlay => overlay.target.kind === "NODE"
          && overlay.target.nodeId === nodeId
      )
    : [];
}

function statusFor(
  overlays: readonly EogAnalysisOverlayV020[]
): string | undefined {
  const critical = overlays.find(
    overlay => overlay.status === "OBSERVED"
      && overlay.severity === "CRITICAL"
  );
  if (critical) return critical.analysisKind + ":CRITICAL";
  const warning = overlays.find(
    overlay => overlay.status === "OBSERVED"
      && overlay.severity === "WARNING"
  );
  if (warning) return warning.analysisKind + ":WARNING";
  const insufficient = overlays.find(
    overlay => overlay.status === "INSUFFICIENT_EVIDENCE"
  );
  if (insufficient) {
    return insufficient.analysisKind + ":INSUFFICIENT_EVIDENCE";
  }
  const observed = overlays.find(overlay => overlay.status === "OBSERVED");
  return observed
    ? observed.analysisKind + ":" + observed.severity
    : undefined;
}

export function projectEnterpriseOperatingGraphEntityInspectorV010(input: {
  graph: EnterpriseOperatingGraphV010;
  snapshot?: EogObservationSnapshotV020 | EogAnalysisSnapshotV020;
  providerAvailable: boolean;
  locale?: string;
}): EntityInspectorV010 {
  const copy = text(input.locale);
  const facts = input.snapshot?.primaryFacts ?? [];
  const observedTimes = facts
    .map(fact => Date.parse(fact.observedAt))
    .filter(Number.isFinite);
  const latestObservedAt = observedTimes.length
    ? new Date(Math.max(...observedTimes)).toISOString()
    : undefined;
  const window = input.snapshot?.timeLens.primary;

  return {
    contractVersion: "0.1.0",
    kind: "entity-inspector",
    id: "evo-enterprise-operating-graph.observatory.mobile-read",
    title: copy.title,
    description: input.providerAvailable
      ? copy.description
      : copy.providerUnavailable,
    freshness: {
      label: copy.freshness,
      ...(latestObservedAt ? { observedAt: latestObservedAt } : {}),
      ...(window
        ? {
            windowStartAt: window.startAt,
            windowEndAt: window.endAt
          }
        : {}),
      stale: !input.providerAvailable
    },
    items: input.graph.nodes.map(node => {
      const nodeFacts = facts.filter(fact => targetNodeId(fact) === node.nodeId);
      const overlays = input.snapshot
        ? overlaysForNode(input.snapshot, node.nodeId)
        : [];
      const metrics: EntityInspectorMetricV010[] = nodeFacts.map(fact => {
        const formatted = metricValue(fact);
        return {
          id: fact.metric.code,
          label: metricLabel(fact.metric.code),
          value: formatted.value,
          ...(formatted.unit ? { unit: formatted.unit } : {}),
          tone: "neutral",
          detail: fact.window.startAt + " → " + fact.window.endAt
        };
      });
      metrics.push(...overlays.map(overlay => ({
        id: "analysis:" + overlay.overlayId,
        label: overlay.analysisKind,
        value: overlay.status === "OBSERVED"
          ? overlay.severity
          : overlay.status,
        tone: overlay.status === "INSUFFICIENT_EVIDENCE"
          ? "warning" as const
          : overlay.severity === "CRITICAL"
            ? "danger" as const
            : overlay.severity === "WARNING"
              ? "warning" as const
              : "info" as const,
        detail: [
          overlay.source.analyzerRef,
          overlay.evidenceFactIds.length
            ? overlay.evidenceFactIds.length + " evidence facts"
            : undefined
        ].filter(Boolean).join(" · ")
      })));

      return {
        id: node.nodeId,
        title: node.semanticRef.refId,
        kind: node.kind,
        ...(statusFor(overlays) ? { status: statusFor(overlays)! } : {}),
        summary: node.semanticRef.authority + " · " + node.semanticRef.kind,
        metrics,
        evidence: [
          ...nodeFacts.map(fact => ({
            id: fact.factId,
            title: copy.evidence,
            source: fact.source.providerId,
            detail: [
              fact.source.sourceRef,
              fact.source.sourceKind,
              fact.metric.code
            ].filter(Boolean).join(" · "),
            observedAt: fact.observedAt
          })),
          ...overlays.map(overlay => ({
            id: overlay.overlayId,
            title: copy.analysis + " · " + overlay.analysisKind,
            source: overlay.source.providerId,
            detail: [
              overlay.source.analyzerRef,
              overlay.status,
              overlay.severity,
              overlay.evidenceFactIds.length
                ? "evidence=" + overlay.evidenceFactIds.join(",")
                : copy.insufficient
            ].filter(Boolean).join(" · "),
            observedAt: overlay.derivedAt
          }))
        ]
      };
    }),
    emptyMessage: input.graph.nodes.length ? undefined : copy.empty
  };
}

function success(
  request: AppActionRequestV010,
  value: unknown
): AppActionExecutionResultV010 {
  return {
    ok: true,
    correlationId: request.sourceInteractionId,
    result: JSON.parse(JSON.stringify(value))
  };
}

function failure(
  request: AppActionRequestV010,
  error: unknown
): AppActionExecutionResultV010 {
  const message = error instanceof Error ? error.message : String(error);
  const [candidate] = message.split(":");
  return {
    ok: false,
    correlationId: request.sourceInteractionId,
    error: {
      code: candidate && /^[A-Z0-9_]+$/u.test(candidate)
        ? candidate
        : "EOG_MOBILE_READ_FAILED",
      message
    }
  };
}

export function createEnterpriseOperatingGraphMobileReadActionHandlerV010(
  input: {
    graphService: EnterpriseOperatingGraphReadProviderV010;
    providers: EnterpriseOperatingGraphObservatoryProviderResolverV020;
    locale?: (context: PlatformRequestContextV010) => string | undefined;
  }
): AppActionHandler {
  return {
    packageId: ENTERPRISE_OBSERVATORY_PACKAGE_ID,
    featureId: ENTERPRISE_OBSERVATORY_2D_FEATURE_ID,
    commandCode: EOG_MOBILE_READ_GET_ACTION,
    async execute(request, context) {
      if (!context) {
        return failure(request, new Error("REQUEST_CONTEXT_REQUIRED"));
      }

      try {
        const scopedEnterpriseId = enterpriseId(context);
        const graphId = typeof request.values.resourceId === "string"
          ? request.values.resourceId.trim()
          : "";
        if (!graphId) throw new Error("EOG_GRAPH_ID_REQUIRED");

        let graph: EnterpriseOperatingGraphV010;
        try {
          graph = input.graphService.get({
            enterpriseId: scopedEnterpriseId,
            graphId
          });
        } catch (error) {
          if (
            error instanceof Error
            && error.message === "EOG_GRAPH_NOT_FOUND"
          ) {
            const copy = text(input.locale?.(context));
            return success(request, {
              contractVersion: "0.1.0",
              kind: "entity-inspector",
              id: "evo-enterprise-operating-graph.observatory.mobile-read",
              title: copy.title,
              description: copy.noGraph,
              freshness: {
                label: copy.freshness,
                stale: true
              },
              items: [],
              emptyMessage: copy.noGraph
            } satisfies EntityInspectorV010);
          }
          throw error;
        }

        if (!input.providers.hasRuntimeCandidate()) {
          return success(
            request,
            projectEnterpriseOperatingGraphEntityInspectorV010({
              graph,
              providerAvailable: false,
              locale: input.locale?.(context)
            })
          );
        }

        const timeLens = parseEogTimeLensInputV020(
          request.values.timeLens
        ) as EogTimeLensV020;
        const metricCodes = parseEogMetricCodesV020(
          request.values.metricCodes
        );
        const analysisAvailable = input.providers.hasAnalysisCandidate();
        const service = input.providers.createService({
          graphService: input.graphService,
          enterpriseId: scopedEnterpriseId,
          requireAnalysis: analysisAvailable
        });
        const snapshot = analysisAvailable
          ? await service.analyze({
              enterpriseId: scopedEnterpriseId,
              graphId,
              timeLens,
              ...(metricCodes?.length ? { metricCodes } : {})
            })
          : await service.observe({
              enterpriseId: scopedEnterpriseId,
              graphId,
              timeLens,
              ...(metricCodes?.length ? { metricCodes } : {})
            });

        return success(
          request,
          projectEnterpriseOperatingGraphEntityInspectorV010({
            graph,
            snapshot,
            providerAvailable: true,
            locale: input.locale?.(context)
          })
        );
      } catch (error) {
        return failure(request, error);
      }
    }
  };
}
