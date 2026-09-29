import type {
  EogCanonicalRefV010,
  EogNodeKindV010
} from "./enterprise-operating-graph.js";

export const EOG_OBSERVATORY_CONTRACT_VERSION_V020 = "0.2.0" as const;

export const EOG_RUNTIME_METRIC_CODES_V020 = {
  EVENT_COUNT: "event.count",
  EVENT_FREQUENCY: "event.frequency",
  THROUGHPUT: "flow.throughput",
  WIP: "flow.wip",
  BACKLOG: "flow.backlog",
  WAIT_TIME: "time.wait",
  LEAD_TIME: "time.lead",
  QUANTITY: "business.quantity",
  AMOUNT: "business.amount",
  BALANCE_QUANTITY: "balance.quantity",
  BALANCE_AMOUNT: "balance.amount"
} as const;

export type EogObservatoryTargetV020 =
  | {
      kind: "NODE";
      nodeId: string;
    }
  | {
      kind: "RELATION";
      authority: "GUIDANCE" | "ENTERPRISE";
      relationId: string;
    };

export interface EogResolvedNodeTargetV020 {
  target: {
    kind: "NODE";
    nodeId: string;
  };
  node: {
    nodeId: string;
    kind: EogNodeKindV010;
    semanticRef: EogCanonicalRefV010;
  };
}

export interface EogResolvedRelationTargetV020 {
  target: {
    kind: "RELATION";
    authority: "GUIDANCE" | "ENTERPRISE";
    relationId: string;
  };
  relation: {
    kind: "APPLICATION_LEDGER";
    application: {
      nodeId: string;
      semanticRef: EogCanonicalRefV010;
    };
    ledger: {
      nodeId: string;
      semanticRef: EogCanonicalRefV010;
    };
  };
}

export type EogResolvedObservatoryTargetV020 =
  | EogResolvedNodeTargetV020
  | EogResolvedRelationTargetV020;

export interface EogTimeWindowV020 {
  startAt: string;
  endAt: string;
}

export type EogTimeComparisonV020 =
  | {
      kind: "PREVIOUS_PERIOD";
    }
  | {
      kind: "EXPLICIT";
      window: EogTimeWindowV020;
    };

export interface EogTimeLensV020 {
  contractVersion: typeof EOG_OBSERVATORY_CONTRACT_VERSION_V020;
  primary: EogTimeWindowV020;
  comparison?: EogTimeComparisonV020;
}

export interface ResolvedEogTimeLensV020 {
  contractVersion: typeof EOG_OBSERVATORY_CONTRACT_VERSION_V020;
  primary: EogTimeWindowV020;
  comparison?: EogTimeWindowV020;
}

export type EogRuntimeMeasurementKindV020 =
  | "COUNT"
  | "QUANTITY"
  | "AMOUNT"
  | "DURATION"
  | "RATE"
  | "RATIO";

export interface EogRuntimeMetricV020 {
  code: string;
  kind: EogRuntimeMeasurementKindV020;
  unit: string;
}

export type EogRuntimeDimensionValueV020 =
  | string
  | number
  | boolean
  | null;

export interface EogRuntimeFactSourceV020 {
  providerId: string;
  sourceKind:
    | "EVO_RUNTIME"
    | "HOST_RUNTIME"
    | "EXTERNAL_PROVIDER"
    | "REFERENCE";
  sourceRef?: string;
  queryDigest?: string;
}

export interface EogRuntimeFactV020 {
  contractVersion: typeof EOG_OBSERVATORY_CONTRACT_VERSION_V020;
  factId: string;
  enterpriseId: string;
  graphId: string;
  target: EogObservatoryTargetV020;
  metric: EogRuntimeMetricV020;
  window: EogTimeWindowV020;
  value: number;
  sampleCount?: number;
  dimensions?: Record<string, EogRuntimeDimensionValueV020>;
  observedAt: string;
  source: EogRuntimeFactSourceV020;
}

export type EogAnalysisKindV020 =
  | "BOTTLENECK"
  | "SOP_CONFORMANCE"
  | "SOP_DEVIATION"
  | "ANOMALY";

export type EogAnalysisStatusV020 =
  | "OBSERVED"
  | "NOT_OBSERVED"
  | "INSUFFICIENT_EVIDENCE";

export type EogAnalysisSeverityV020 =
  | "INFO"
  | "WATCH"
  | "WARNING"
  | "CRITICAL";

export interface EogAnalysisSourceV020 {
  providerId: string;
  analyzerRef?: string;
  modelRef?: string;
}

export interface EogAnalysisOverlayV020 {
  contractVersion: typeof EOG_OBSERVATORY_CONTRACT_VERSION_V020;
  overlayId: string;
  enterpriseId: string;
  graphId: string;
  target: EogObservatoryTargetV020;
  analysisKind: EogAnalysisKindV020;
  status: EogAnalysisStatusV020;
  severity: EogAnalysisSeverityV020;
  confidence?: number;
  score?: number;
  window: EogTimeWindowV020;
  evidenceFactIds: string[];
  derivedAt: string;
  source: EogAnalysisSourceV020;
  details?: Record<string, EogRuntimeDimensionValueV020>;
}

export interface EogRuntimeFactQueryV020 {
  contractVersion: typeof EOG_OBSERVATORY_CONTRACT_VERSION_V020;
  enterpriseId: string;
  graphId: string;
  window: EogTimeWindowV020;
  /**
   * Explicit caller filter when one was supplied.
   * Omitted means graph-wide within Host-authorized semantic targets.
   */
  targets?: EogObservatoryTargetV020[];
  /**
   * Host-resolved canonical semantic bindings for the effective target scope.
   * Providers must use these bindings instead of inferring semantics from nodeId.
   */
  semanticTargets: EogResolvedObservatoryTargetV020[];
  metricCodes?: string[];
}

export interface EnterpriseOperatingGraphRuntimeFactProviderV020 {
  contractVersion: typeof EOG_OBSERVATORY_CONTRACT_VERSION_V020;
  providerId: string;
  query(
    request: EogRuntimeFactQueryV020
  ): Promise<EogRuntimeFactV020[]>;
}

export interface EogAnalysisRequestV020 {
  contractVersion: typeof EOG_OBSERVATORY_CONTRACT_VERSION_V020;
  enterpriseId: string;
  graphId: string;
  timeLens: ResolvedEogTimeLensV020;
  primaryFacts: EogRuntimeFactV020[];
  comparisonFacts: EogRuntimeFactV020[];
}

export interface EnterpriseOperatingGraphAnalysisProviderV020 {
  contractVersion: typeof EOG_OBSERVATORY_CONTRACT_VERSION_V020;
  providerId: string;
  analyze(
    request: EogAnalysisRequestV020
  ): Promise<EogAnalysisOverlayV020[]>;
}

export interface EogObservationSnapshotV020 {
  contractVersion: typeof EOG_OBSERVATORY_CONTRACT_VERSION_V020;
  enterpriseId: string;
  graphId: string;
  semanticRevision: number;
  timeLens: ResolvedEogTimeLensV020;
  primaryFacts: EogRuntimeFactV020[];
  comparisonFacts: EogRuntimeFactV020[];
}

export interface EogAnalysisSnapshotV020
  extends EogObservationSnapshotV020 {
  overlays: EogAnalysisOverlayV020[];
}
