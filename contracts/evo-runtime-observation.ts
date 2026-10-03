export const EVO_RUNTIME_OBSERVATION_ADAPTER_VERSION_V010 =
  "0.1.0" as const;

export type EvoRuntimeObservationMetricCodeV010 =
  | "event.count"
  | "event.frequency"
  | "flow.net_quantity"
  | "flow.net_amount"
  | "balance.quantity"
  | "balance.amount";

export type EvoRuntimeObservationTargetV010 =
  | {
      kind: "APPLICATION_ANCHOR";
      applicationId: string;
    }
  | {
      kind: "LEDGER_DEFINITION";
      code: string;
    };

export interface EvoRuntimeObservationWindowV010 {
  startAt: string;
  endAt: string;
}

export interface EvoRuntimeObservationQueryV010 {
  contractVersion: typeof EVO_RUNTIME_OBSERVATION_ADAPTER_VERSION_V010;
  scopeKey: string;
  target: EvoRuntimeObservationTargetV010;
  window: EvoRuntimeObservationWindowV010;
  metricCodes: EvoRuntimeObservationMetricCodeV010[];
}

export interface EvoRuntimeObservationV010 {
  contractVersion: typeof EVO_RUNTIME_OBSERVATION_ADAPTER_VERSION_V010;
  scopeKey: string;
  target: EvoRuntimeObservationTargetV010;
  metricCode: EvoRuntimeObservationMetricCodeV010;
  kind: "COUNT" | "QUANTITY" | "AMOUNT" | "RATE";
  unit: string;
  value: number;
  sampleCount?: number;
  window: EvoRuntimeObservationWindowV010;
  observedAt: string;
  source?: {
    kind: string;
    ref: string;
  };
}

export interface EvoRuntimeObservationAdapterV010 {
  query(
    input: EvoRuntimeObservationQueryV010
  ): Promise<EvoRuntimeObservationV010[]>;
}
