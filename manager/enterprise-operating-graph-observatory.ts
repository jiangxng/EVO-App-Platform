import { createHash } from "node:crypto";
import type {
  EogAnalysisOverlayV020,
  EogAnalysisSnapshotV020,
  EogObservationSnapshotV020,
  EogObservatoryTargetV020,
  EogResolvedObservatoryTargetV020,
  EogRuntimeFactV020,
  EogTimeLensV020,
  EogTimeWindowV020,
  EnterpriseOperatingGraphAnalysisProviderV020,
  EnterpriseOperatingGraphRuntimeFactProviderV020,
  ResolvedEogTimeLensV020
} from "../contracts/enterprise-operating-graph-observatory.js";
import type {
  EnterpriseOperatingGraphV010
} from "../contracts/enterprise-operating-graph.js";
import type {
  EnterpriseOperatingGraphReadProviderV010
} from "../contracts/enterprise-operating-graph-read.js";

function nonEmpty(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function instant(value: string, code: string): number {
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) throw new Error(code);
  return parsed;
}

function validateWindow(
  window: EogTimeWindowV020,
  code = "EOG_TIME_WINDOW_INVALID"
): { start: number; end: number } {
  if (!window || typeof window !== "object") throw new Error(code);
  const start = instant(window.startAt, code);
  const end = instant(window.endAt, code);
  if (start >= end) throw new Error(code);
  return { start, end };
}

export function resolveEogTimeLensV020(
  lens: EogTimeLensV020
): ResolvedEogTimeLensV020 {
  if (lens.contractVersion !== "0.2.0") {
    throw new Error("EOG_TIME_LENS_VERSION_UNSUPPORTED");
  }
  const primary = validateWindow(lens.primary);
  let comparison: EogTimeWindowV020 | undefined;

  if (lens.comparison?.kind === "PREVIOUS_PERIOD") {
    const duration = primary.end - primary.start;
    comparison = {
      startAt: new Date(primary.start - duration).toISOString(),
      endAt: new Date(primary.start).toISOString()
    };
  } else if (lens.comparison?.kind === "EXPLICIT") {
    validateWindow(lens.comparison.window, "EOG_COMPARISON_WINDOW_INVALID");
    comparison = structuredClone(lens.comparison.window);
  } else if (lens.comparison !== undefined) {
    throw new Error("EOG_TIME_COMPARISON_INVALID");
  }

  return {
    contractVersion: "0.2.0",
    primary: structuredClone(lens.primary),
    ...(comparison ? { comparison } : {})
  };
}

function targetKey(target: EogObservatoryTargetV020): string {
  return target.kind === "NODE"
    ? "NODE:" + target.nodeId
    : "RELATION:" + target.authority + ":" + target.relationId;
}

function assertTarget(
  graph: EnterpriseOperatingGraphV010,
  target: EogObservatoryTargetV020
): void {
  if (target.kind === "NODE") {
    if (
      !nonEmpty(target.nodeId)
      || !graph.nodes.some(node => node.nodeId === target.nodeId)
    ) {
      throw new Error("EOG_OBSERVATORY_TARGET_NOT_FOUND");
    }
    return;
  }

  if (
    target.kind !== "RELATION"
    || !nonEmpty(target.relationId)
    || (
      target.authority !== "GUIDANCE"
      && target.authority !== "ENTERPRISE"
    )
  ) {
    throw new Error("EOG_OBSERVATORY_TARGET_INVALID");
  }
  const exists = target.authority === "GUIDANCE"
    ? graph.guidanceRelations.some(
        relation => relation.relationId === target.relationId
      )
    : graph.enterpriseRelations.some(
        relation => relation.relationId === target.relationId
      );
  if (!exists) throw new Error("EOG_OBSERVATORY_TARGET_NOT_FOUND");
}

function resolvedTarget(
  graph: EnterpriseOperatingGraphV010,
  target: EogObservatoryTargetV020
): EogResolvedObservatoryTargetV020 {
  assertTarget(graph, target);

  if (target.kind === "NODE") {
    const node = graph.nodes.find(
      item => item.nodeId === target.nodeId
    )!;
    return {
      target: structuredClone(target),
      node: structuredClone(node)
    };
  }

  const relation = target.authority === "GUIDANCE"
    ? graph.guidanceRelations.find(
        item => item.relationId === target.relationId
      )!
    : graph.enterpriseRelations.find(
        item => item.relationId === target.relationId
      )!;
  const application = graph.nodes.find(
    item => item.nodeId === relation.applicationNodeId
  );
  const ledger = graph.nodes.find(
    item => item.nodeId === relation.ledgerNodeId
  );
  if (!application || !ledger) {
    throw new Error("EOG_OBSERVATORY_RELATION_ENDPOINT_NOT_FOUND");
  }

  return {
    target: structuredClone(target),
    relation: {
      kind: "APPLICATION_LEDGER",
      application: {
        nodeId: application.nodeId,
        semanticRef: structuredClone(application.semanticRef)
      },
      ledger: {
        nodeId: ledger.nodeId,
        semanticRef: structuredClone(ledger.semanticRef)
      }
    }
  };
}

function graphTargets(
  graph: EnterpriseOperatingGraphV010
): EogObservatoryTargetV020[] {
  return [
    ...graph.nodes.map(node => ({
      kind: "NODE" as const,
      nodeId: node.nodeId
    })),
    ...graph.guidanceRelations.map(relation => ({
      kind: "RELATION" as const,
      authority: "GUIDANCE" as const,
      relationId: relation.relationId
    })),
    ...graph.enterpriseRelations.map(relation => ({
      kind: "RELATION" as const,
      authority: "ENTERPRISE" as const,
      relationId: relation.relationId
    }))
  ].sort((a, b) => targetKey(a).localeCompare(targetKey(b)));
}

function assertWindowContained(
  inner: EogTimeWindowV020,
  outer: EogTimeWindowV020
): void {
  const i = validateWindow(inner, "EOG_RUNTIME_FACT_WINDOW_INVALID");
  const o = validateWindow(outer);
  if (i.start < o.start || i.end > o.end) {
    throw new Error("EOG_RUNTIME_FACT_OUTSIDE_TIME_LENS");
  }
}

function validateFact(
  graph: EnterpriseOperatingGraphV010,
  requestedWindow: EogTimeWindowV020,
  fact: EogRuntimeFactV020,
  providerId: string
): EogRuntimeFactV020 {
  if (
    fact.contractVersion !== "0.2.0"
    || !nonEmpty(fact.factId)
    || fact.enterpriseId !== graph.enterpriseId
    || fact.graphId !== graph.graphId
    || !nonEmpty(fact.metric?.code)
    || !nonEmpty(fact.metric?.unit)
    || ![
      "COUNT",
      "QUANTITY",
      "AMOUNT",
      "DURATION",
      "RATE",
      "RATIO"
    ].includes(fact.metric?.kind)
    || typeof fact.value !== "number"
    || !Number.isFinite(fact.value)
    || (
      fact.sampleCount !== undefined
      && (
        !Number.isInteger(fact.sampleCount)
        || fact.sampleCount < 0
      )
    )
    || !Number.isFinite(Date.parse(fact.observedAt))
    || !nonEmpty(fact.source?.providerId)
    || fact.source.providerId !== providerId
    || ![
      "EVO_RUNTIME",
      "HOST_RUNTIME",
      "EXTERNAL_PROVIDER",
      "REFERENCE"
    ].includes(fact.source.sourceKind)
    || (
      fact.source.sourceRef !== undefined
      && !nonEmpty(fact.source.sourceRef)
    )
    || (
      fact.source.queryDigest !== undefined
      && !nonEmpty(fact.source.queryDigest)
    )
  ) {
    throw new Error("EOG_RUNTIME_FACT_INVALID");
  }

  if (
    (fact.metric.kind === "COUNT" || fact.metric.kind === "DURATION")
    && fact.value < 0
  ) {
    throw new Error("EOG_RUNTIME_FACT_NEGATIVE_INVALID");
  }

  assertTarget(graph, fact.target);
  assertWindowContained(fact.window, requestedWindow);

  if (fact.dimensions !== undefined) {
    for (const [key, value] of Object.entries(fact.dimensions)) {
      if (
        !nonEmpty(key)
        || (
          value !== null
          && typeof value !== "string"
          && typeof value !== "number"
          && typeof value !== "boolean"
        )
      ) {
        throw new Error("EOG_RUNTIME_FACT_DIMENSION_INVALID");
      }
    }
  }

  return structuredClone(fact);
}

function factSortKey(fact: EogRuntimeFactV020): string {
  return [
    targetKey(fact.target),
    fact.metric.code,
    fact.window.startAt,
    fact.window.endAt,
    fact.factId
  ].join("|");
}

function validateOverlay(
  graph: EnterpriseOperatingGraphV010,
  lens: ResolvedEogTimeLensV020,
  facts: readonly EogRuntimeFactV020[],
  overlay: EogAnalysisOverlayV020,
  providerId: string
): EogAnalysisOverlayV020 {
  if (
    overlay.contractVersion !== "0.2.0"
    || !nonEmpty(overlay.overlayId)
    || overlay.enterpriseId !== graph.enterpriseId
    || overlay.graphId !== graph.graphId
    || ![
      "BOTTLENECK",
      "SOP_CONFORMANCE",
      "SOP_DEVIATION",
      "ANOMALY"
    ].includes(overlay.analysisKind)
    || ![
      "OBSERVED",
      "NOT_OBSERVED",
      "INSUFFICIENT_EVIDENCE"
    ].includes(overlay.status)
    || ![
      "INFO",
      "WATCH",
      "WARNING",
      "CRITICAL"
    ].includes(overlay.severity)
    || (
      overlay.confidence !== undefined
      && (
        !Number.isFinite(overlay.confidence)
        || overlay.confidence < 0
        || overlay.confidence > 1
      )
    )
    || (
      overlay.score !== undefined
      && !Number.isFinite(overlay.score)
    )
    || !Array.isArray(overlay.evidenceFactIds)
    || !Number.isFinite(Date.parse(overlay.derivedAt))
    || overlay.source?.providerId !== providerId
    || (
      overlay.source.analyzerRef !== undefined
      && !nonEmpty(overlay.source.analyzerRef)
    )
    || (
      overlay.source.modelRef !== undefined
      && !nonEmpty(overlay.source.modelRef)
    )
  ) {
    throw new Error("EOG_ANALYSIS_OVERLAY_INVALID");
  }

  assertTarget(graph, overlay.target);
  assertWindowContained(overlay.window, lens.primary);

  const factIds = new Set(facts.map(fact => fact.factId));
  if (
    overlay.evidenceFactIds.some(id =>
      !nonEmpty(id) || !factIds.has(id)
    )
  ) {
    throw new Error("EOG_ANALYSIS_EVIDENCE_NOT_FOUND");
  }
  if (
    overlay.status !== "INSUFFICIENT_EVIDENCE"
    && overlay.evidenceFactIds.length === 0
  ) {
    throw new Error("EOG_ANALYSIS_EVIDENCE_REQUIRED");
  }

  if (overlay.details !== undefined) {
    for (const [key, value] of Object.entries(overlay.details)) {
      if (
        !nonEmpty(key)
        || (
          value !== null
          && typeof value !== "string"
          && typeof value !== "number"
          && typeof value !== "boolean"
        )
      ) {
        throw new Error("EOG_ANALYSIS_DETAILS_INVALID");
      }
    }
  }

  return structuredClone(overlay);
}

function queryDigest(input: unknown): string {
  return createHash("sha256")
    .update(JSON.stringify(input))
    .digest("hex");
}

export interface EnterpriseOperatingGraphObservatoryServiceV020 {
  observe(input: {
    enterpriseId: string;
    graphId: string;
    timeLens: EogTimeLensV020;
    targets?: EogObservatoryTargetV020[];
    metricCodes?: string[];
  }): Promise<EogObservationSnapshotV020>;
  analyze(input: {
    enterpriseId: string;
    graphId: string;
    timeLens: EogTimeLensV020;
    targets?: EogObservatoryTargetV020[];
    metricCodes?: string[];
  }): Promise<EogAnalysisSnapshotV020>;
}

export function createEnterpriseOperatingGraphObservatoryServiceV020(input: {
  graphService: EnterpriseOperatingGraphReadProviderV010;
  runtimeProvider: EnterpriseOperatingGraphRuntimeFactProviderV020;
  analysisProvider?: EnterpriseOperatingGraphAnalysisProviderV020;
}): EnterpriseOperatingGraphObservatoryServiceV020 {
  if (
    input.runtimeProvider.contractVersion !== "0.2.0"
    || !nonEmpty(input.runtimeProvider.providerId)
  ) {
    throw new Error("EOG_RUNTIME_PROVIDER_INVALID");
  }
  if (
    input.analysisProvider
    && (
      input.analysisProvider.contractVersion !== "0.2.0"
      || !nonEmpty(input.analysisProvider.providerId)
    )
  ) {
    throw new Error("EOG_ANALYSIS_PROVIDER_INVALID");
  }

  const observeWindow = async (
    graph: EnterpriseOperatingGraphV010,
    window: EogTimeWindowV020,
    targets?: EogObservatoryTargetV020[],
    metricCodes?: string[]
  ): Promise<EogRuntimeFactV020[]> => {
    targets?.forEach(target => assertTarget(graph, target));
    if (metricCodes?.some(code => !nonEmpty(code))) {
      throw new Error("EOG_RUNTIME_METRIC_FILTER_INVALID");
    }

    const effectiveTargets = targets?.length
      ? structuredClone(targets)
      : graphTargets(graph);
    const semanticTargets = effectiveTargets.map(
      target => resolvedTarget(graph, target)
    );

    const request = {
      contractVersion: "0.2.0" as const,
      enterpriseId: graph.enterpriseId,
      graphId: graph.graphId,
      window: structuredClone(window),
      ...(targets?.length
        ? { targets: structuredClone(targets) }
        : {}),
      semanticTargets,
      ...(metricCodes?.length
        ? { metricCodes: [...metricCodes] }
        : {})
    };
    const facts = await input.runtimeProvider.query(request);
    if (!Array.isArray(facts)) {
      throw new Error("EOG_RUNTIME_PROVIDER_RESULT_INVALID");
    }
    const requestedTargets = targets?.length
      ? new Set(targets.map(targetKey))
      : undefined;
    const requestedMetrics = metricCodes?.length
      ? new Set(metricCodes)
      : undefined;

    const validated = facts.map(fact => validateFact(
      graph,
      window,
      fact,
      input.runtimeProvider.providerId
    ));

    for (const fact of validated) {
      if (
        (requestedTargets && !requestedTargets.has(targetKey(fact.target)))
        || (requestedMetrics && !requestedMetrics.has(fact.metric.code))
      ) {
        throw new Error("EOG_RUNTIME_PROVIDER_SCOPE_VIOLATION");
      }
    }

    const ids = new Set<string>();
    for (const fact of validated) {
      if (ids.has(fact.factId)) {
        throw new Error("EOG_RUNTIME_FACT_ID_DUPLICATE");
      }
      ids.add(fact.factId);
    }

    return validated.sort((a, b) =>
      factSortKey(a).localeCompare(factSortKey(b))
    );
  };

  const observe = async (request: {
    enterpriseId: string;
    graphId: string;
    timeLens: EogTimeLensV020;
    targets?: EogObservatoryTargetV020[];
    metricCodes?: string[];
  }): Promise<EogObservationSnapshotV020> => {
    const graph = input.graphService.get({
      enterpriseId: request.enterpriseId,
      graphId: request.graphId
    });
    const timeLens = resolveEogTimeLensV020(request.timeLens);
    const primaryFacts = await observeWindow(
      graph,
      timeLens.primary,
      request.targets,
      request.metricCodes
    );
    const comparisonFacts = timeLens.comparison
      ? await observeWindow(
          graph,
          timeLens.comparison,
          request.targets,
          request.metricCodes
        )
      : [];

    const allFactIds = new Set<string>();
    for (const fact of [...primaryFacts, ...comparisonFacts]) {
      if (allFactIds.has(fact.factId)) {
        throw new Error("EOG_RUNTIME_FACT_ID_DUPLICATE");
      }
      allFactIds.add(fact.factId);
    }

    return {
      contractVersion: "0.2.0",
      enterpriseId: graph.enterpriseId,
      graphId: graph.graphId,
      semanticRevision: graph.revision,
      timeLens,
      primaryFacts,
      comparisonFacts
    };
  };

  return {
    observe,

    async analyze(request) {
      if (!input.analysisProvider) {
        throw new Error("EOG_ANALYSIS_PROVIDER_REQUIRED");
      }
      const observation = await observe(request);
      const overlays = await input.analysisProvider.analyze({
        contractVersion: "0.2.0",
        enterpriseId: observation.enterpriseId,
        graphId: observation.graphId,
        timeLens: observation.timeLens,
        primaryFacts: structuredClone(observation.primaryFacts),
        comparisonFacts: structuredClone(observation.comparisonFacts)
      });
      if (!Array.isArray(overlays)) {
        throw new Error("EOG_ANALYSIS_PROVIDER_RESULT_INVALID");
      }

      const allFacts = [
        ...observation.primaryFacts,
        ...observation.comparisonFacts
      ];
      const seen = new Set<string>();
      const validated = overlays.map(overlay => {
        if (seen.has(overlay.overlayId)) {
          throw new Error("EOG_ANALYSIS_OVERLAY_ID_DUPLICATE");
        }
        seen.add(overlay.overlayId);
        return validateOverlay(
          input.graphService.get({
            enterpriseId: observation.enterpriseId,
            graphId: observation.graphId
          }),
          observation.timeLens,
          allFacts,
          overlay,
          input.analysisProvider!.providerId
        );
      }).sort((a, b) => [
        targetKey(a.target),
        a.analysisKind,
        a.overlayId
      ].join("|").localeCompare([
        targetKey(b.target),
        b.analysisKind,
        b.overlayId
      ].join("|")));

      return {
        ...observation,
        overlays: validated
      };
    }
  };
}

export function eogObservatoryQueryDigestV020(input: unknown): string {
  return queryDigest(input);
}
