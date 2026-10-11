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
  ActiveContextRefV010,
  PlatformRequestContextV010
} from "../../contracts/platform-services.js";
import type {
  EogAnalysisSnapshotV020,
  EogObservationSnapshotV020,
  EogRuntimeFactV020,
  EogTimeLensV020
} from "../../contracts/enterprise-operating-graph-observatory.js";
import {
  PRIMARY_EOG_DIAGRAM_VIEW_ID_V010
} from "../../contracts/enterprise-operating-graph-view.js";
import type {
  DiagramWorkspacePageV010,
  DiagramWorkspaceStateV010,
  DiagramWorkspaceObservationBadgeV010
} from "../../vendor/eidos/src/2d/index.js";
import {
  PRIMARY_ENTERPRISE_OPERATING_GRAPH_ID_V010
} from "../../contracts/enterprise-operating-graph.js";
import {
  projectEnterpriseOperatingGraphDiagramBaseV010
} from "../../eog/diagram-projection.js";
import type {
  EnterpriseOperatingGraphReadProviderV010
} from "../../contracts/enterprise-operating-graph-read.js";
import type {
  EnterpriseOperatingGraphViewStateProviderV010
} from "../../contracts/enterprise-operating-graph-view-state.js";
import type {
  EnterpriseOperatingGraphObservatoryProviderResolverV020
} from "../../contracts/enterprise-operating-graph-observatory-runtime.js";
import {
  parseEogMetricCodesV020,
  parseEogTimeLensInputV020
} from "../../eog/observatory-input.js";
import {
  EOG_MOBILE_READ_PAGE_SOURCE,
  EOG_MOBILE_READ_ROUTE
} from "./mobile-read-page.js";

export const EOG_OBSERVATORY_PAGE_SOURCE =
  "app://evo-enterprise-operating-graph/pages/observatory";
export const EOG_OBSERVATORY_ROUTE =
  "/operating-graph/observe";
export const EOG_OBSERVATORY_VIEW_GET_ACTION =
  "enterprise-operating-graph.observatory.view.get";
export const EOG_OBSERVATORY_VIEW_OPERATION_ACTION =
  "enterprise-operating-graph.observatory.view.operation";

export function createEnterpriseOperatingGraphObservatoryExperienceManifestV020() {
  const semanticId = "evo-enterprise-operating-graph.observatory";
  const desktopSurfaceId = "evo-eog-observatory.desktop";
  const mobileTaskSurfaceId = "evo-eog-observatory.mobile-task";
  const mobileReadSurfaceId = "evo-eog-observatory.mobile-read";

  return {
    contractVersion: "0.1.0" as const,
    experienceId: "evo-enterprise-operating-graph-observatory",
    packageId: ENTERPRISE_OBSERVATORY_PACKAGE_ID,
    featureId: ENTERPRISE_OBSERVATORY_2D_FEATURE_ID,
    defaultRoute: EOG_OBSERVATORY_ROUTE,
    pages: [
      {
        id: "evo-enterprise-operating-graph.observatory",
        title: "Enterprise Observatory",
        source: EOG_OBSERVATORY_PAGE_SOURCE
      },
      {
        id: "evo-enterprise-operating-graph.observatory.mobile-read",
        title: "Enterprise Observatory",
        source: EOG_MOBILE_READ_PAGE_SOURCE
      }
    ],
    routes: [
      {
        id: "evo-enterprise-operating-graph.observatory",
        semanticId,
        surfaceId: desktopSurfaceId,
        path: EOG_OBSERVATORY_ROUTE,
        pageId: "evo-enterprise-operating-graph.observatory"
      },
      {
        id: "evo-enterprise-operating-graph.observatory.mobile-read",
        semanticId,
        surfaceId: mobileReadSurfaceId,
        path: EOG_MOBILE_READ_ROUTE,
        pageId: "evo-enterprise-operating-graph.observatory.mobile-read"
      }
    ],
    navigation: [
      {
        id: "evo-enterprise-operating-graph.observatory.nav",
        label: "Observe",
        route: EOG_OBSERVATORY_ROUTE,
        order: 16,
        surfaceIds: [desktopSurfaceId]
      }
    ],
    surfaces: [
      {
        id: desktopSurfaceId,
        target: "DESKTOP_WORKBENCH" as const,
        support: "FULL" as const,
        entryRoute: EOG_OBSERVATORY_ROUTE
      },
      {
        id: mobileTaskSurfaceId,
        target: "MOBILE_TASK" as const,
        support: "UNSUPPORTED" as const,
        fallbackSurfaceId: mobileReadSurfaceId
      },
      {
        id: mobileReadSurfaceId,
        target: "MOBILE_READ" as const,
        support: "READ_ONLY" as const,
        entryRoute: EOG_MOBILE_READ_ROUTE
      }
    ]
  };
}

function localizedText(locale: string | undefined) {
  const normalized = locale?.toLowerCase() ?? "en";
  if (normalized.startsWith("zh")) {
    return {
      title: "企业运行观测",
      empty: "选择一个应用、账本或关系查看运行数据。",
      ready: "真实 Runtime Facts 叠加在同一个企业运行图上；观测数据不改变企业语义。",
      unavailable: "企业运行模型可见，但尚未连接 Runtime Fact Provider。",
      noGraph: "当前企业还没有运行图。请先在企业运行图编辑器中建立并确认模型。",
      eventCount: "事件",
      eventFrequency: "频率",
      quantity: "净数量",
      amount: "净金额",
      balanceQuantity: "余额数量",
      balanceAmount: "余额金额",
      delta: "较前期"
    };
  }
  if (normalized.startsWith("ja")) {
    return {
      title: "Enterprise Observatory",
      empty: "アプリケーション、台帳、または関係を選択してください。",
      ready: "Real Runtime Facts are overlaid on the same Enterprise Operating Graph without changing semantic truth.",
      unavailable: "The enterprise model is visible, but no Runtime Fact Provider is connected.",
      noGraph: "No Enterprise Operating Graph exists yet. Create and confirm the model in the editor first.",
      eventCount: "Events",
      eventFrequency: "Frequency",
      quantity: "Net quantity",
      amount: "Net amount",
      balanceQuantity: "Balance qty",
      balanceAmount: "Balance amount",
      delta: "vs previous"
    };
  }
  return {
    title: "Enterprise Observatory",
    empty: "Select an Application, Ledger or relation to inspect runtime observations.",
    ready: "Real Runtime Facts are overlaid on the same Enterprise Operating Graph without changing semantic truth.",
    unavailable: "The enterprise model is visible, but no Runtime Fact Provider is connected.",
    noGraph: "No Enterprise Operating Graph exists yet. Create and confirm the model in the editor first.",
    eventCount: "Events",
    eventFrequency: "Frequency",
    quantity: "Net quantity",
    amount: "Net amount",
    balanceQuantity: "Balance qty",
    balanceAmount: "Balance amount",
    delta: "vs previous"
  };
}

function preset(
  id: string,
  label: string,
  hours: number,
  now: Date
) {
  const end = now.getTime();
  const start = end - hours * 3_600_000;
  return {
    id,
    label,
    values: {
      timeLens: {
        contractVersion: "0.2.0",
        primary: {
          startAt: new Date(start).toISOString(),
          endAt: new Date(end).toISOString()
        },
        comparison: {
          kind: "PREVIOUS_PERIOD"
        }
      },
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
    } as Record<string, JsonValue>
  };
}

export function createEnterpriseOperatingGraphObservatoryPageV020(input: {
  activeContext: ActiveContextRefV010;
  locale?: string;
  now?: Date;
}): DiagramWorkspacePageV010 {
  const text = localizedText(input.locale);
  const now = input.now ?? new Date();
  return {
    contractVersion: "0.1.0",
    kind: "diagram-editor",
    id: "evo-enterprise-operating-graph.observatory",
    title: text.title,
    resourceId: PRIMARY_ENTERPRISE_OPERATING_GRAPH_ID_V010,
    readCommand: {
      code: EOG_OBSERVATORY_VIEW_GET_ACTION,
      inputVersion: "0.2.0"
    },
    operationCommand: {
      code: EOG_OBSERVATORY_VIEW_OPERATION_ACTION,
      inputVersion: "0.1.0"
    },
    requestValues: {
      activeContext: structuredClone(input.activeContext) as unknown as JsonValue
    },
    readPresets: [
      preset("4h", "4h", 4, now),
      preset("24h", "24h", 24, now),
      preset("7d", "7d", 24 * 7, now),
      preset("1h", "1h", 1, now)
    ],
    emptyMessage: text.empty
  };
}

function numberText(
  value: number,
  locale: string | undefined
): string {
  return new Intl.NumberFormat(locale || "en", {
    maximumFractionDigits: Math.abs(value) >= 100 ? 0 : 2
  }).format(value);
}

function metricLabel(
  code: string,
  locale: string | undefined
): string {
  const text = localizedText(locale);
  switch (code) {
    case "event.count":
      return text.eventCount;
    case "event.frequency":
      return text.eventFrequency;
    case "business.quantity":
      return text.quantity;
    case "business.amount":
      return text.amount;
    case "balance.quantity":
      return text.balanceQuantity;
    case "balance.amount":
      return text.balanceAmount;
    default:
      return code;
  }
}

function metricValue(
  fact: EogRuntimeFactV020,
  locale: string | undefined
): string {
  const value = numberText(fact.value, locale);
  if (fact.metric.unit === "events") return value;
  if (fact.metric.unit === "events/hour") return value + "/h";
  return value + " " + fact.metric.unit;
}

function targetKey(fact: EogRuntimeFactV020): string {
  return fact.target.kind === "NODE"
    ? "NODE:" + fact.target.nodeId
    : "RELATION:" + fact.target.authority + ":" + fact.target.relationId;
}

function factIndex(
  facts: readonly EogRuntimeFactV020[]
): Map<string, EogRuntimeFactV020[]> {
  const result = new Map<string, EogRuntimeFactV020[]>();
  for (const fact of facts) {
    const key = targetKey(fact) + "|" + fact.metric.code;
    const values = result.get(key) ?? [];
    values.push(fact);
    result.set(key, values);
  }
  return result;
}

function oneFact(
  index: Map<string, EogRuntimeFactV020[]>,
  target: string,
  metricCode: string
): EogRuntimeFactV020 | undefined {
  const values = index.get(target + "|" + metricCode);
  return values?.length === 1 ? values[0] : undefined;
}

function observationBadges(
  target: string,
  snapshot: EogObservationSnapshotV020,
  locale?: string
): DiagramWorkspaceObservationBadgeV010[] {
  const primary = factIndex(snapshot.primaryFacts);
  const comparison = factIndex(snapshot.comparisonFacts);
  const order = [
    "event.frequency",
    "event.count",
    "balance.quantity",
    "balance.amount",
    "business.quantity",
    "business.amount"
  ];
  const text = localizedText(locale);
  const result: DiagramWorkspaceObservationBadgeV010[] = [];

  for (const metricCode of order) {
    const fact = oneFact(primary, target, metricCode);
    if (!fact) continue;
    const previous = oneFact(comparison, target, metricCode);
    const comparable = previous
      && previous.metric.unit === fact.metric.unit
      && previous.metric.kind === fact.metric.kind;
    const delta = comparable
      ? fact.value - previous.value
      : undefined;
    const detail = [
      fact.window.startAt + " → " + fact.window.endAt,
      fact.source.sourceRef,
      delta === undefined
        ? undefined
        : text.delta
          + ": "
          + (delta > 0 ? "+" : "")
          + numberText(delta, locale)
          + (fact.metric.unit === "events"
            ? ""
            : fact.metric.unit === "events/hour"
              ? "/h"
              : " " + fact.metric.unit)
    ].filter(Boolean).join(" · ");

    result.push({
      id: fact.factId,
      label: metricLabel(metricCode, locale),
      value: metricValue(fact, locale),
      ...(detail ? { detail } : {})
    });
  }
  return result;
}


function overlayTargetKey(
  target: EogAnalysisSnapshotV020["overlays"][number]["target"]
): string {
  return target.kind === "NODE"
    ? "NODE:" + target.nodeId
    : "RELATION:" + target.authority + ":" + target.relationId;
}

function analysisBadges(
  target: string,
  snapshot: EogObservationSnapshotV020 | EogAnalysisSnapshotV020,
  locale?: string
): DiagramWorkspaceObservationBadgeV010[] {
  if (!("overlays" in snapshot)) return [];
  return snapshot.overlays
    .filter(overlay => overlayTargetKey(overlay.target) === target)
    .map(overlay => {
      const label = overlay.analysisKind === "BOTTLENECK"
        ? "Bottleneck"
        : overlay.analysisKind === "SOP_CONFORMANCE"
          ? "SOP"
          : overlay.analysisKind === "SOP_EXCEPTION"
            ? "SOP exception"
            : overlay.analysisKind === "SOP_DEVIATION"
              ? "SOP deviation"
              : overlay.analysisKind;
      const value = overlay.analysisKind === "SOP_CONFORMANCE"
        && typeof overlay.score === "number"
        ? numberText(overlay.score * 100, locale) + "%"
        : overlay.status === "OBSERVED"
          ? overlay.severity
          : overlay.status;
      return {
        id: overlay.overlayId,
        label,
        value,
        detail: [
          overlay.source.analyzerRef,
          overlay.evidenceFactIds.length
            ? overlay.evidenceFactIds.length + " evidence facts"
            : undefined
        ].filter(Boolean).join(" · ")
      };
    });
}

export function projectEnterpriseOperatingGraphObservatoryStateV020(input: {
  base: DiagramWorkspaceStateV010;
  snapshot?: EogObservationSnapshotV020 | EogAnalysisSnapshotV020;
  locale?: string;
  providerAvailable: boolean;
}): DiagramWorkspaceStateV010 {
  const text = localizedText(input.locale);
  const snapshot = input.snapshot;

  return {
    ...structuredClone(input.base),
    lifecycleState: "OBSERVATORY",
    nodes: input.base.nodes.map(node => {
      const observations = snapshot
        ? [
            ...observationBadges(
              "NODE:" + node.id,
              snapshot,
              input.locale
            ),
            ...analysisBadges(
              "NODE:" + node.id,
              snapshot,
              input.locale
            )
          ]
        : [];
      return {
        ...structuredClone(node),
        readOnly: true,
        height: Math.max(
          node.height,
          68 + observations.length * 18
        ),
        ...(observations.length ? { observations } : {})
      };
    }),
    edges: input.base.edges.map(edge => {
      const relation = edge.id.startsWith("guidance-edge:")
        ? {
            authority: "GUIDANCE",
            relationId: edge.id.slice("guidance-edge:".length)
          }
        : edge.id.startsWith("enterprise-edge:")
          ? {
              authority: "ENTERPRISE",
              relationId: edge.id.slice("enterprise-edge:".length)
            }
          : undefined;
      const observations = snapshot && relation
        ? [
            ...observationBadges(
              "RELATION:"
                + relation.authority
                + ":"
                + relation.relationId,
              snapshot,
              input.locale
            ),
            ...analysisBadges(
              "RELATION:"
                + relation.authority
                + ":"
                + relation.relationId,
              snapshot,
              input.locale
            )
          ]
        : [];
      return {
        ...structuredClone(edge),
        ...(observations.length ? { observations } : {})
      };
    }),
    actions: [],
    notice: input.providerAvailable ? text.ready : text.unavailable
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
  const message = error instanceof Error
    ? error.message
    : String(error);
  const [candidate] = message.split(":");
  return {
    ok: false,
    correlationId: request.sourceInteractionId,
    error: {
      code: candidate && /^[A-Z0-9_]+$/u.test(candidate)
        ? candidate
        : "EOG_OBSERVATORY_VIEW_FAILED",
      message
    }
  };
}

function enterpriseId(
  context: PlatformRequestContextV010
): string {
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

export function createEnterpriseOperatingGraphObservatoryViewActionHandlerV020(
  input: {
    graphService: EnterpriseOperatingGraphReadProviderV010;
    viewService: EnterpriseOperatingGraphViewStateProviderV010;
    providers: EnterpriseOperatingGraphObservatoryProviderResolverV020;
    locale?: (context: PlatformRequestContextV010) => string | undefined;
  }
): AppActionHandler {
  return {
    packageId: ENTERPRISE_OBSERVATORY_PACKAGE_ID,
    featureId: ENTERPRISE_OBSERVATORY_2D_FEATURE_ID,
    commandCode: EOG_OBSERVATORY_VIEW_GET_ACTION,

    async execute(request, context) {
      if (!context) {
        return failure(
          request,
          new Error("REQUEST_CONTEXT_REQUIRED")
        );
      }

      try {
        const scopedEnterpriseId = enterpriseId(context);
        const graphId = typeof request.values.resourceId === "string"
          ? request.values.resourceId.trim()
          : "";
        if (!graphId) throw new Error("EOG_GRAPH_ID_REQUIRED");

        let graph;
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
            return success(
              request,
              {
                contractVersion: "0.1.0",
                resourceId: graphId,
                revision: 0,
                lifecycleState: "OBSERVATORY",
                nodes: [],
                edges: [],
                actions: [],
                notice: localizedText(
                  input.locale?.(context)
                ).noGraph
              }
            );
          }
          throw error;
        }

        const view = input.viewService.ensure({
          enterpriseId: scopedEnterpriseId,
          graphId,
          viewId: PRIMARY_EOG_DIAGRAM_VIEW_ID_V010,
          kind: "DIAGRAM_2D"
        });
        const base =
          projectEnterpriseOperatingGraphDiagramBaseV010({
            graph,
            view,
            locale: input.locale?.(context),
            readOnly: true
          });

        if (!input.providers.hasRuntimeCandidate()) {
          return success(
            request,
            projectEnterpriseOperatingGraphObservatoryStateV020({
              base,
              locale: input.locale?.(context),
              providerAvailable: false
            })
          );
        }

        const timeLens = parseEogTimeLensInputV020(
          request.values.timeLens
        ) as EogTimeLensV020;
        const metricCodes = parseEogMetricCodesV020(
          request.values.metricCodes
        );
        const analysisAvailable =
          input.providers.hasAnalysisCandidate();
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
          projectEnterpriseOperatingGraphObservatoryStateV020({
            base,
            snapshot,
            locale: input.locale?.(context),
            providerAvailable: true
          })
        );
      } catch (error) {
        return failure(request, error);
      }
    }
  };
}


export function createEnterpriseOperatingGraphObservatoryViewOperationActionHandlerV020(): AppActionHandler {
  return {
    packageId: ENTERPRISE_OBSERVATORY_PACKAGE_ID,
    featureId: ENTERPRISE_OBSERVATORY_2D_FEATURE_ID,
    commandCode: EOG_OBSERVATORY_VIEW_OPERATION_ACTION,
    async execute(request) {
      return failure(
        request,
        new Error("EOG_2D_VIEWER_READ_ONLY")
      );
    }
  };
}
