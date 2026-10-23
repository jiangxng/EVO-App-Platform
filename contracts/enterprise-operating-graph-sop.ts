export const EOG_EXPECTED_SOP_VERSION_V010 = "0.1.0" as const;

// Legacy command identities only. Keeping registration metadata here does not
// activate the deferred SOP Designer or change the current handler owner.
export const EOG_SOP_LIST_ACTION = "enterprise-operating-graph.sop.list";
export const EOG_SOP_CREATE_ACTION = "enterprise-operating-graph.sop.create";
export const EOG_SOP_REVISE_ACTION = "enterprise-operating-graph.sop.revise";
export const EOG_SOP_PUBLISH_ACTION = "enterprise-operating-graph.sop.publish";

export type EogExpectedSopStateV010 = "DRAFT" | "PUBLISHED";

export interface EogExpectedSopStepV010 {
  stepId: string;
  applicationNodeId: string;
}

export type EogExpectedSopTransitionKindV010 =
  | "EXPECTED"
  | "ALLOWED_ALTERNATIVE"
  | "ALLOWED_EXCEPTION";

export interface EogExpectedSopTransitionV010 {
  transitionId: string;
  fromApplicationNodeId: string;
  toApplicationNodeId: string;
  kind: EogExpectedSopTransitionKindV010;
  conditionRef?: string;
  exceptionCode?: string;
}

export interface EogExpectedSopTransitionInputV010 {
  fromApplicationNodeId: string;
  toApplicationNodeId: string;
  kind?: EogExpectedSopTransitionKindV010;
  conditionRef?: string;
  exceptionCode?: string;
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
  /**
   * Explicit allowed transition semantics.
   *
   * Legacy 0.1 snapshots may omit this field; readers must normalize them to
   * the former strict linear steps path as EXPECTED transitions.
   */
  transitions?: EogExpectedSopTransitionV010[];
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  publishedBySubjectId?: string;
}

export interface EogExpectedSopSnapshotV010 {
  contractVersion: typeof EOG_EXPECTED_SOP_VERSION_V010;
  sops: EogExpectedSopV010[];
}
