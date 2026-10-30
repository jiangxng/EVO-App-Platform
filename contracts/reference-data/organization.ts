import type { FoundationObjectLocalizedTextV010 } from "../foundation-object/schema.js";

export const ORGANIZATION_PACKAGE_ID_V010 = "evo-organization" as const;
export const ORGANIZATION_FEATURE_ID_V010 = "evo-organization.default" as const;
export const ORGANIZATION_CAPABILITY_V010 = "enterprise.organization" as const;
export const ORGANIZATION_LIST_COMMAND_V010 = "organization.list" as const;
export const ORGANIZATION_DRAFT_COMMAND_V010 = "organization.draft.save" as const;
export const ORGANIZATION_PUBLISH_COMMAND_V010 = "organization.publish" as const;
export const ORGANIZATION_RESOLVE_COMMAND_V010 = "organization.resolve.batch" as const;

export interface OrganizationUnitV010 {
  /** Stable business identity, not a display name or Host login identity. */
  unitId: string;
  /** Stable business code in one (contextId, organizationId) namespace. */
  code: string;
  displayName: FoundationObjectLocalizedTextV010;
  kind: "DEPARTMENT" | "DIVISION" | "TEAM" | "OTHER";
  parentUnitId?: string;
  /** Human-governed source-system equivalents; never fuzzy infer. */
  aliases?: string[];
  status: "ACTIVE" | "INACTIVE";
  effectiveFrom?: string;
  effectiveTo?: string;
}
export interface OrganizationSnapshotV010 {
  contractVersion: "0.1.0";
  contextId: string;
  organizationId: string;
  version: number;
  state: "DRAFT" | "PUBLISHED";
  /** A forest. Multiple organization collections may exist per Enterprise. */
  units: OrganizationUnitV010[];
}
export type OrganizationResolutionV010 =
  | { status: "RESOLVED"; unitId: string; organizationVersion: number }
  | { status: "UNKNOWN" | "INACTIVE" | "AMBIGUOUS" | "VERSION_MISMATCH" | "NOT_PUBLISHED";
      organizationVersion: number; candidateUnitIds?: string[] };
export interface OrganizationResolveBatchV010 {
  contextId: string;
  organizationId: string;
  expectedVersion?: number;
  sourceValues: string[];
  effectiveAt?: string;
}
export interface OrganizationReadCapabilityV010 {
  resolveBatch(input: OrganizationResolveBatchV010): OrganizationResolutionV010[];
}
