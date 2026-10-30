import type { FoundationObjectLocalizedTextV010 } from "../foundation-object/schema.js";

export const PERSONNEL_PACKAGE_ID_V010 = "evo-personnel" as const;
export const PERSONNEL_FEATURE_ID_V010 = "evo-personnel.default" as const;
export const PERSONNEL_CAPABILITY_V010 = "enterprise.personnel" as const;
export const PERSONNEL_LIST_COMMAND_V010 = "personnel.list" as const;
export const PERSONNEL_DRAFT_COMMAND_V010 = "personnel.draft.save" as const;
export const PERSONNEL_PUBLISH_COMMAND_V010 = "personnel.publish" as const;
export const PERSONNEL_RESOLVE_COMMAND_V010 = "personnel.resolve.batch" as const;

/** Business organization is independent from Host enterprise membership. */
export interface PersonnelAssignmentV010 {
  organizationId: string;
  unitId: string;
  /** Pinned to an already PUBLISHED organization snapshot. */
  organizationVersion: number;
  effectiveFrom?: string;
  effectiveTo?: string;
}

export interface BusinessPersonV010 {
  /** Immutable business identifier, never Host principal or displayName. */
  personId: string;
  /** Stable within (Enterprise Context, personnelDirectoryId). */
  code: string;
  displayName: FoundationObjectLocalizedTextV010;
  aliases?: string[];
  state: "ACTIVE" | "INACTIVE";
  assignments: PersonnelAssignmentV010[];
  /** Optional explicit association, not a permission or employment grant. */
  linkedPrincipalSubjectId?: string;
}

export interface PersonnelDirectorySnapshotV010 {
  contractVersion: "0.1.0";
  contextId: string;
  personnelDirectoryId: string;
  version: number;
  state: "DRAFT" | "PUBLISHED";
  persons: BusinessPersonV010[];
}

export type PersonnelResolveResultV010 =
  | { status: "RESOLVED"; personId: string; personnelVersion: number }
  | { status: "UNKNOWN" | "INACTIVE" | "AMBIGUOUS" | "VERSION_MISMATCH";
      personnelVersion: number; candidatePersonIds?: string[] };

export interface PersonnelResolveBatchRequestV010 {
  contextId: string;
  personnelDirectoryId: string;
  expectedVersion?: number;
  sourceValues: string[];
}

export interface PersonnelReadCapabilityV010 {
  resolveBatch(input: PersonnelResolveBatchRequestV010): PersonnelResolveResultV010[];
}
