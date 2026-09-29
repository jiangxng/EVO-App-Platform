export const EOG_EXPECTED_SOP_VERSION_V010 = "0.1.0" as const;

export type EogExpectedSopStateV010 = "DRAFT" | "PUBLISHED";

export interface EogExpectedSopStepV010 {
  stepId: string;
  applicationNodeId: string;
}

export interface EogExpectedSopV010 {
  contractVersion: typeof EOG_EXPECTED_SOP_VERSION_V010;
  sopId: string;
  enterpriseId: string;
  graphId: string;
  title: string;
  state: EogExpectedSopStateV010;
  revision: number;
  steps: EogExpectedSopStepV010[];
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  publishedBySubjectId?: string;
}

export interface EogExpectedSopSnapshotV010 {
  contractVersion: typeof EOG_EXPECTED_SOP_VERSION_V010;
  sops: EogExpectedSopV010[];
}
