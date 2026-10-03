import type { JsonValue } from "../actions/contracts.js";

export const EVO_BUSINESS_DATA_ADAPTER_VERSION_V010 = "0.1.0" as const;

export interface EvoBusinessDataSubmissionV010 {
  contractVersion: typeof EVO_BUSINESS_DATA_ADAPTER_VERSION_V010;
  scopeKey: string;
  applicationId: string;
  businessDataType: string;
  businessObjectKey: string;
  effectiveAt: string;
  payload: Record<string, JsonValue>;
  correlationId: string;
  idempotencyKey: string;
  causationId?: string;
  expectedBusinessVersion?: string;
  postingPriority?: number;
}

export interface EvoBusinessDataSubmissionResultV010 {
  contractVersion: typeof EVO_BUSINESS_DATA_ADAPTER_VERSION_V010;
  businessDataId: string;
  businessObjectVersion: string;
  postingInputId: string;
  postingSequence: string;
  postingStatus: "QUEUED" | "BLOCKED_REPLAY_REQUIRED";
  retroactive: boolean;
  replayRequired: boolean;
  idempotentReplay: boolean;
}

export interface EvoBusinessDataAdapterV010 {
  submit(
    input: EvoBusinessDataSubmissionV010
  ): Promise<EvoBusinessDataSubmissionResultV010>;
}
