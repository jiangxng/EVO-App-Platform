import type { TemplateProjectionGalleryV010 } from "./template-projection-gallery.js";
export const ENTERPRISE_BUSINESS_DEFINITION_CAPABILITY_V010 =
  "enterprise.business-definition.repository" as const;

export const ENTERPRISE_BUSINESS_DEFINITION_CONTRACT_V010 =
  "evo.enterprise.business-definition.repository" as const;

export const BUSINESS_DEFINITION_KIND_SOP_V010 = "SOP" as const;
export const BUSINESS_DEFINITION_KIND_ENTERPRISE_OPERATING_GRAPH_V010 =
  "ENTERPRISE_OPERATING_GRAPH" as const;

export type BusinessDefinitionStateV010 = "DRAFT" | "PUBLISHED";

export type BusinessDefinitionActorTypeV010 =
  | "HUMAN"
  | "AI"
  | "AUTOMATION"
  | "SERVICE";

export interface BusinessDefinitionAttributionV010 {
  actorType: BusinessDefinitionActorTypeV010;
  subjectId: string;
}

export interface BusinessDefinitionOriginV010 {
  type: "NATIVE" | "MIGRATED" | "TEMPLATE_COPY";
  sourceRef?: string;
  historyComplete: boolean;
}

export type BusinessDefinitionCreateOriginV010 =
  | { type: "NATIVE" }
  | { type: "TEMPLATE_COPY"; sourceRef: string };

export interface BusinessDefinitionRevisionV010 {
  contractVersion: "0.1.0";
  definitionId: string;
  enterpriseId: string;
  kind: string;
  revision: number;
  state: BusinessDefinitionStateV010;
  title: string;
  payload: Record<string, unknown>;
  projectionGallery?: TemplateProjectionGalleryV010;
  definitionCreatedAt: string;
  recordedAt: string;
  recordedBy: BusinessDefinitionAttributionV010;
  publishedAt?: string;
  publishedBySubjectId?: string;
  origin: BusinessDefinitionOriginV010;
}

export interface BusinessDefinitionRepositoryV010 {
  providerId: string;

  createDraft(input: {
    enterpriseId: string;
    definitionId: string;
    kind: string;
    title: string;
    payload: Record<string, unknown>;
    projectionGallery?: TemplateProjectionGalleryV010;
    actor: BusinessDefinitionAttributionV010;
    recordedAt?: string;
    origin?: BusinessDefinitionCreateOriginV010;
  }): BusinessDefinitionRevisionV010;

  reviseDraft(input: {
    enterpriseId: string;
    definitionId: string;
    expectedRevision: number;
    title: string;
    payload: Record<string, unknown>;
    projectionGallery?: TemplateProjectionGalleryV010;
    actor: BusinessDefinitionAttributionV010;
    recordedAt?: string;
  }): BusinessDefinitionRevisionV010;

  beginDraft(input: {
    enterpriseId: string;
    definitionId: string;
    expectedRevision: number;
    title: string;
    payload: Record<string, unknown>;
    projectionGallery?: TemplateProjectionGalleryV010;
    actor: BusinessDefinitionAttributionV010;
    recordedAt?: string;
  }): BusinessDefinitionRevisionV010;

  publish(input: {
    enterpriseId: string;
    definitionId: string;
    expectedRevision: number;
    actor: BusinessDefinitionAttributionV010;
    recordedAt?: string;
  }): BusinessDefinitionRevisionV010;

  getLatest(input: {
    enterpriseId: string;
    definitionId: string;
  }): BusinessDefinitionRevisionV010 | undefined;

  getEffective(input: {
    enterpriseId: string;
    definitionId: string;
  }): BusinessDefinitionRevisionV010 | undefined;

  listLatest(input: {
    enterpriseId: string;
    kind?: string;
  }): BusinessDefinitionRevisionV010[];

  listEffective(input: {
    enterpriseId: string;
    kind?: string;
  }): BusinessDefinitionRevisionV010[];

  listHistory(input: {
    enterpriseId: string;
    definitionId: string;
  }): BusinessDefinitionRevisionV010[];
}

export interface BusinessDefinitionRepositoryMigrationV010 {
  importRevision(
    revision: BusinessDefinitionRevisionV010
  ): BusinessDefinitionRevisionV010;
}
