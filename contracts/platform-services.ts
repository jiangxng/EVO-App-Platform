export type PlatformActorType =
  | "HUMAN"
  | "AI"
  | "AUTOMATION"
  | "SERVICE";

export interface PlatformPrincipalV010 {
  contractVersion: "0.1.0";
  subjectId: string;
  actorType: PlatformActorType;
  identityProviderId: string;
  sessionId?: string;
  displayName?: string;
  claims?: Record<string, string | number | boolean | null>;
}

/**
 * Legacy hierarchical scope retained for compatibility while the platform
 * migrates to the Person-first Context model.
 *
 * New Personal Agent code should prefer ResolvedContextSetV010 / ActiveContextRefV010.
 */
export interface PlatformScopeV010 {
  contractVersion: "0.1.0";
  enterpriseId?: string;
  companyId?: string;
  workspaceId?: string;
  userId?: string;
}

export interface PersonalContextV010 {
  contractVersion: "0.1.0";
  kind: "PERSONAL";
  contextId: string;
  ownerSubjectId?: string;
  displayName?: string;
  attributes?: Record<string, string | number | boolean | null>;
}

export type EnterpriseContextLifecycleStateV010 =
  | "CREATING"
  | "ACTIVE"
  | "SUSPENDED"
  | "ARCHIVED";

export interface EnterpriseContextV010 {
  contractVersion: "0.1.0";
  enterpriseId: string;
  enterpriseProviderId: string;
  /**
   * Stable Context identity. Optional only for compatibility with the earlier
   * enterprise-service contract; new Context-aware code should provide it.
   */
  contextId?: string;
  kind?: "ENTERPRISE";
  displayName?: string;
  companyId?: string;
  workspaceId?: string;
  membershipId?: string;
  lifecycleState?: EnterpriseContextLifecycleStateV010;
  createdBySubjectId?: string;
  createdAt?: string;
  attributes?: Record<string, string | number | boolean | null>;
}

export type ActiveContextRefV010 =
  | {
      contractVersion: "0.1.0";
      kind: "PERSONAL";
      contextId: string;
    }
  | {
      contractVersion: "0.1.0";
      kind: "ENTERPRISE";
      contextId: string;
      enterpriseId: string;
    };

export interface ResolvedContextSetV010 {
  contractVersion: "0.1.0";
  personalContext: PersonalContextV010;
  activeContext: ActiveContextRefV010;
  enterpriseContext?: EnterpriseContextV010;
}

export interface EnterpriseContextProviderV010 {
  providerId: string;
  list(): EnterpriseContextV010[];
}

export interface PlatformRequestContextV010 {
  contractVersion: "0.1.0";
  principal: PlatformPrincipalV010;
  /**
   * Legacy compatibility projection. New Person-first code should use context.
   */
  scope: PlatformScopeV010;
  /**
   * Person-first Context resolution. Optional during the compatibility phase.
   */
  context?: ResolvedContextSetV010;
  correlationId: string;
  locale?: string;
}

export interface AuthorizationCheckV010 {
  contractVersion: "0.1.0";
  principal: PlatformPrincipalV010;
  scope: PlatformScopeV010;
  action: string;
  resource: {
    type: string;
    id?: string;
    attributes?: Record<string, string | number | boolean | null>;
  };
  context?: Record<string, string | number | boolean | null>;
}

export interface AuthorizationDecisionV010 {
  contractVersion: "0.1.0";
  allowed: boolean;
  policyProviderId: string;
  reasonCodes: string[];
  obligations?: Array<{
    type: string;
    value?: string | number | boolean | null;
  }>;
}

export interface AuthorizationProviderV010 {
  providerId: string;
  check(
    input: AuthorizationCheckV010
  ): Promise<AuthorizationDecisionV010> | AuthorizationDecisionV010;
}

export interface IdentityAuthenticationStartV010 {
  contractVersion: "0.1.0";
  callbackUrl: string;
  returnTo: string;
  locale?: string;
}

export interface IdentityAuthenticationStartResultV010 {
  contractVersion: "0.1.0";
  redirectUrl: string;
}

export interface IdentityAuthenticationCallbackV010 {
  contractVersion: "0.1.0";
  callbackUrl: string;
}

export interface IdentityAuthenticationResultV010 {
  contractVersion: "0.1.0";
  principal: PlatformPrincipalV010;
  assurance?: string[];
  returnTo?: string;
}

export interface IdentityAuthenticationProviderV010 {
  providerId: string;
  begin(
    input: IdentityAuthenticationStartV010
  ): Promise<IdentityAuthenticationStartResultV010> | IdentityAuthenticationStartResultV010;
  complete(
    input: IdentityAuthenticationCallbackV010
  ): Promise<IdentityAuthenticationResultV010> | IdentityAuthenticationResultV010;
}

export interface IdentitySessionV010 {
  contractVersion: "0.1.0";
  sessionId: string;
  principal: PlatformPrincipalV010;
  issuedAt: string;
  expiresAt?: string;
  assurance?: string[];
}

export interface IdentitySessionProviderV010 {
  providerId: string;
  current(): IdentitySessionV010 | undefined;
}

export interface IdentitySessionRequestV010 {
  contractVersion: "0.1.0";
  bearerToken?: string;
  /**
   * Opaque Host-managed browser Session credential, normally transported
   * through an HttpOnly cookie. This is not the public sessionId.
   */
  sessionToken?: string;
  sessionId?: string;
}

export interface RequestIdentitySessionProviderV010 {
  providerId: string;
  resolve(input: IdentitySessionRequestV010): IdentitySessionV010 | undefined;
}

export interface EnterpriseContextGrantV010 {
  contractVersion: "0.1.0";
  grantId: string;
  subjectId: string;
  contextId: string;
  relationship?: string;
  state?: "ACTIVE" | "REVOKED";
  createdAt?: string;
  createdBySubjectId?: string;
  revokedAt?: string;
  revokedBySubjectId?: string;
  attributes?: Record<string, string | number | boolean | null>;
}

export interface EnterpriseContextGrantProviderV010 {
  providerId: string;
  listForPrincipal(
    principal: PlatformPrincipalV010
  ): EnterpriseContextGrantV010[];
}

export type EnterpriseContextRelationshipKindV010 =
  | "OWNER"
  | "ADMIN"
  | "MEMBER"
  | "AUDITOR";

export interface EnterpriseContextRelationshipV010 {
  contractVersion: "0.1.0";
  relationshipId: string;
  subjectId: string;
  contextId: string;
  kind: EnterpriseContextRelationshipKindV010;
  state: "ACTIVE" | "REVOKED";
  createdAt: string;
  createdBySubjectId: string;
  revokedAt?: string;
  revokedBySubjectId?: string;
}

export interface EnterpriseContextRelationshipProviderV010 {
  providerId: string;
  listForPrincipal(
    principal: PlatformPrincipalV010
  ): EnterpriseContextRelationshipV010[];
  listForContext(contextId: string): EnterpriseContextRelationshipV010[];
}

export type EnterpriseRelationshipInvitationKindV010 =
  | "ADMIN"
  | "MEMBER"
  | "AUDITOR";

export type EnterpriseRelationshipInvitationStateV010 =
  | "PENDING"
  | "ACCEPTED"
  | "DECLINED"
  | "REVOKED"
  | "EXPIRED";

export interface EnterpriseRelationshipInvitationV010 {
  contractVersion: "0.1.0";
  invitationId: string;
  contextId: string;
  targetSubjectId: string;
  kind: EnterpriseRelationshipInvitationKindV010;
  state: EnterpriseRelationshipInvitationStateV010;
  invitedBySubjectId: string;
  createdAt: string;
  expiresAt?: string;
  respondedAt?: string;
  respondedBySubjectId?: string;
}

export type EnterpriseOwnershipTransferStateV010 =
  | "PENDING"
  | "ACCEPTED"
  | "DECLINED"
  | "CANCELLED"
  | "EXPIRED";

export interface EnterpriseOwnershipTransferV010 {
  contractVersion: "0.1.0";
  transferId: string;
  contextId: string;
  fromOwnerSubjectId: string;
  toSubjectId: string;
  state: EnterpriseOwnershipTransferStateV010;
  createdAt: string;
  expiresAt?: string;
  respondedAt?: string;
  respondedBySubjectId?: string;
}

export interface SecretReferenceV010 {
  contractVersion: "0.1.0";
  namespace: string;
  key: string;
  scope: "SYSTEM" | "INSTALLATION" | "ENTERPRISE" | "COMPANY" | "WORKSPACE" | "USER";
  scopeId?: string;
}

export interface SecretDescriptorV010 {
  contractVersion: "0.1.0";
  reference: SecretReferenceV010;
  configured: boolean;
  updatedAt?: string;
}

export interface SecretsResolverV010 {
  providerId: string;
  resolve(reference: SecretReferenceV010): Promise<string> | string;
  describe(reference: SecretReferenceV010): Promise<SecretDescriptorV010> | SecretDescriptorV010;
}

export interface ManagedSecretsProviderV010 extends SecretsResolverV010 {
  put(reference: SecretReferenceV010, value: string): Promise<SecretDescriptorV010> | SecretDescriptorV010;
  remove(reference: SecretReferenceV010): Promise<void> | void;
}

export interface ServiceProviderRefV010 {
  contractVersion: "0.1.0";
  providerId: string;
  capability: string;
  providerContract: string;
  providerContractVersion: string;
}

export interface LlmExecutionContextV010 {
  contractVersion: "0.1.0";
  provider: ServiceProviderRefV010;
  modelId?: string;
  principal?: PlatformPrincipalV010;
  scope?: PlatformScopeV010;
  policyTags?: string[];
}

export const RESERVED_PLATFORM_CAPABILITIES = [
  "identity.authenticate",
  "identity.session",
  "identity.session.request",
  "identity.user-directory",
  "authorization.check",
  "authorization.policy",
  "enterprise.directory",
  "enterprise.organization",
  "enterprise.membership",
  "enterprise.relationship",
  "enterprise.scope",
  "enterprise.business-definition.repository",
  "context.memory.read",
  "context.memory.write",
  "context.memory.governance",
  "context.memory.semantic-retrieval",
  "context.memory.retention-policy",
  "context.memory.legal-hold",
  "context.memory.dlp-classification",
  "context.memory.operations",
  "context.memory.intake-source",
  "context.memory.evidence-source",
  "llm.inference",
  "llm.streaming",
  "llm.embedding",
  "llm.structured-output",
  "llm.tool-calling",
  "llm.model-catalog",
  "audit.write",
  "audit.query",
  "secrets.resolve"
] as const;

export type ReservedPlatformCapability =
  typeof RESERVED_PLATFORM_CAPABILITIES[number];

export type ContextMemoryKindV010 =
  | "FACT"
  | "CLAIM"
  | "EXPERIENCE"
  | "PRACTICE";

export type ContextMemoryRetrievalStrategyV010 =
  | "LEXICAL"
  | "SEMANTIC"
  | "HYBRID";

export interface ContextMemoryReadRequestV010 {
  contractVersion: "0.1.0";
  context: ActiveContextRefV010;
  query?: string;
  memoryIds?: string[];
  kinds?: ContextMemoryKindV010[];
  strategy?: ContextMemoryRetrievalStrategyV010;
  limit?: number;
  cursor?: string;
}

export type ContextMemoryOriginKindV010 =
  | "DIRECT"
  | "PROMOTED";

export interface ContextMemoryProvenanceV010 {
  contractVersion: "0.1.0";
  origin: ContextMemoryOriginKindV010;
  sourceContext: ActiveContextRefV010;
  sourceMemoryId?: string;
  evidenceRefs: string[];
  evidenceSources?: ContextMemoryEvidenceSourceV010[];
}

export interface ContextMemoryAttributionV010 {
  contractVersion: "0.1.0";
  recordedBySubjectId: string;
  recordedByActorType: PlatformActorType;
  recordedAt: string;
}

export interface ContextMemoryItemV010 {
  contractVersion: "0.1.0";
  memoryId: string;
  context: ActiveContextRefV010;
  kind: ContextMemoryKindV010;
  summary: string;
  provenance: ContextMemoryProvenanceV010;
  attribution: ContextMemoryAttributionV010;
  observedAt?: string;
  supersedesMemoryId?: string;
  /** @deprecated Compatibility projection; new code uses provenance.evidenceRefs. */
  provenanceRefs?: string[];
  /** @deprecated Derived compatibility field; records are not mutated in P0.9. */
  supersededBy?: string;
}

export interface ContextMemoryRetrievalScoreV010 {
  contractVersion: "0.1.0";
  memoryId: string;
  score: number;
  signals: string[];
}

export interface ContextMemoryReadResultV010 {
  contractVersion: "0.1.0";
  items: ContextMemoryItemV010[];
  strategyUsed?: ContextMemoryRetrievalStrategyV010;
  ranking?: ContextMemoryRetrievalScoreV010[];
  nextCursor?: string;
}

export interface ContextMemoryReaderV010 {
  providerId: string;
  read(
    input: ContextMemoryReadRequestV010
  ): Promise<ContextMemoryReadResultV010> | ContextMemoryReadResultV010;
}

export type ContextMemoryInventoryHistoricalReasonV010 =
  | "SUPERSEDED"
  | "CANONICALIZED_DUPLICATE";

export interface ContextMemoryInventoryItemV010 {
  contractVersion: "0.1.0";
  memory: ContextMemoryItemV010;
  effective: boolean;
  historicalReasons: ContextMemoryInventoryHistoricalReasonV010[];
  supersededByMemoryIds: string[];
  canonicalizedToMemoryId?: string;
  governance?: ContextMemoryGovernanceDecisionV010;
}

export interface ContextMemoryInventoryRequestV010 {
  contractVersion: "0.1.0";
  context: ActiveContextRefV010;
  kinds?: ContextMemoryKindV010[];
  includeHistorical?: boolean;
  limit?: number;
  cursor?: string;
}

export interface ContextMemoryInventoryResultV010 {
  contractVersion: "0.1.0";
  items: ContextMemoryInventoryItemV010[];
  totalCount: number;
  complete: boolean;
  order: "RECORDED_AT_ASC_MEMORY_ID_ASC";
  scope: "READER_VISIBLE_CURRENT_CONTEXT";
  snapshotDigest: string;
  nextCursor?: string;
}

export interface ContextMemoryInventoryReaderV010 {
  providerId: string;
  list(
    input: ContextMemoryInventoryRequestV010
  ): Promise<ContextMemoryInventoryResultV010> | ContextMemoryInventoryResultV010;
}

export interface ContextMemoryWriteRequestV010 {
  contractVersion: "0.1.0";
  item: ContextMemoryItemV010;
}

export interface ContextMemoryWriterV010 {
  providerId: string;
  write(
    input: ContextMemoryWriteRequestV010
  ): Promise<ContextMemoryItemV010> | ContextMemoryItemV010;
}


export type ContextMemoryEvidenceTrustLevelV010 =
  | "UNVERIFIED"
  | "DECLARED"
  | "HOST_VERIFIED";

export type ContextMemoryEvidenceSourceTypeV010 =
  | "HUMAN"
  | "APPLICATION"
  | "DOCUMENT"
  | "EXTERNAL_SYSTEM"
  | "EXPERIENCE_COMPILER";

export interface ContextMemoryEvidenceSourceV010 {
  contractVersion: "0.1.0";
  sourceId: string;
  sourceType: ContextMemoryEvidenceSourceTypeV010;
  displayName?: string;
  trustLevel: ContextMemoryEvidenceTrustLevelV010;
  trustPolicyId?: string;
  verifiedAt?: string;
  attributes?: Record<string, string | number | boolean | null>;
}

export interface ContextMemoryEvidenceSourceProviderV010 {
  providerId: string;
  describe(sourceId: string): ContextMemoryEvidenceSourceV010 | undefined;
  list(): ContextMemoryEvidenceSourceV010[];
}

export interface ContextMemoryIntakeRecordV010 {
  contractVersion: "0.1.0";
  sourceId: string;
  sourceRecordId: string;
  context: ActiveContextRefV010;
  kind: ContextMemoryKindV010;
  summary: string;
  evidenceRefs: string[];
  observedAt?: string;
  proposedConfidence?: number;
  supersedesMemoryId?: string;
  potentialContradictionMemoryIds?: string[];
  attributes?: Record<string, string | number | boolean | null>;
}

export interface ContextMemoryIntakePullRequestV010 {
  contractVersion: "0.1.0";
  context: ActiveContextRefV010;
  cursor?: string;
  limit?: number;
}

export interface ContextMemoryIntakePullResultV010 {
  contractVersion: "0.1.0";
  records: ContextMemoryIntakeRecordV010[];
  nextCursor?: string;
}

export interface ContextMemoryIntakeSourceAdapterV010 {
  providerId: string;
  sourceId: string;
  pull(
    input: ContextMemoryIntakePullRequestV010
  ): Promise<ContextMemoryIntakePullResultV010> | ContextMemoryIntakePullResultV010;
}


export type ContextMemoryGovernanceStateV010 =
  | "ACTIVE"
  | "RESTRICTED"
  | "EXPIRED";

export type ContextMemoryPrivacyClassV010 =
  | "STANDARD"
  | "SENSITIVE"
  | "RESTRICTED";

export type ContextMemoryGovernanceEventOriginV010 =
  | "HUMAN"
  | "RETENTION_POLICY"
  | "DLP_PROVIDER";

export interface ContextMemoryGovernanceEventV010 {
  contractVersion: "0.1.0";
  eventId: string;
  memoryId: string;
  context: ActiveContextRefV010;
  state: ContextMemoryGovernanceStateV010;
  privacyClass: ContextMemoryPrivacyClassV010;
  origin?: ContextMemoryGovernanceEventOriginV010;
  reason?: string;
  retainUntil?: string;
  occurredAt: string;
  actorSubjectId: string;
}

export interface ContextMemoryGovernanceDecisionV010 {
  contractVersion: "0.1.0";
  memoryId: string;
  context: ActiveContextRefV010;
  state: ContextMemoryGovernanceStateV010;
  privacyClass: ContextMemoryPrivacyClassV010;
  retainUntil?: string;
  effectiveEventId?: string;
}

export interface ContextMemoryGovernanceProviderV010 {
  providerId: string;
  get(memoryId: string): ContextMemoryGovernanceDecisionV010 | undefined;
  listForContext(context: ActiveContextRefV010): ContextMemoryGovernanceDecisionV010[];
}

export interface ContextMemorySemanticCandidateV010 {
  contractVersion: "0.1.0";
  memoryId: string;
  summary: string;
  kind: ContextMemoryKindV010;
  evidenceRefs: string[];
}

export interface ContextMemorySemanticSearchRequestV010 {
  contractVersion: "0.1.0";
  context: ActiveContextRefV010;
  query: string;
  candidates: ContextMemorySemanticCandidateV010[];
  limit: number;
}

export interface ContextMemorySemanticSearchResultV010 {
  contractVersion: "0.1.0";
  ranking: ContextMemoryRetrievalScoreV010[];
}

export interface ContextMemorySemanticRetrieverV010 {
  providerId: string;
  search(
    input: ContextMemorySemanticSearchRequestV010
  ):
    | Promise<ContextMemorySemanticSearchResultV010>
    | ContextMemorySemanticSearchResultV010;
}


export type ContextMemoryRetentionPolicyStateV010 = "ACTIVE" | "RETIRED";

export interface ContextMemoryRetentionPolicyEventV010 {
  contractVersion: "0.1.0";
  eventId: string;
  policyId: string;
  context: ActiveContextRefV010;
  state: ContextMemoryRetentionPolicyStateV010;
  retainForDays: number;
  kinds?: ContextMemoryKindV010[];
  privacyClasses?: ContextMemoryPrivacyClassV010[];
  reason?: string;
  occurredAt: string;
  actorSubjectId: string;
}

export interface ContextMemoryRetentionPolicyV010 {
  contractVersion: "0.1.0";
  policyId: string;
  context: ActiveContextRefV010;
  state: ContextMemoryRetentionPolicyStateV010;
  retainForDays: number;
  kinds?: ContextMemoryKindV010[];
  privacyClasses?: ContextMemoryPrivacyClassV010[];
  reason?: string;
  effectiveEventId: string;
}

export type ContextMemoryLegalHoldStateV010 = "PLACED" | "RELEASED";

export interface ContextMemoryLegalHoldEventV010 {
  contractVersion: "0.1.0";
  eventId: string;
  holdId: string;
  memoryId: string;
  context: ActiveContextRefV010;
  state: ContextMemoryLegalHoldStateV010;
  reason: string;
  occurredAt: string;
  actorSubjectId: string;
}

export interface ContextMemoryLegalHoldDecisionV010 {
  contractVersion: "0.1.0";
  holdId: string;
  memoryId: string;
  context: ActiveContextRefV010;
  held: boolean;
  reason: string;
  effectiveEventId: string;
}

export interface ContextMemoryDlpClassificationRequestV010 {
  contractVersion: "0.1.0";
  context: ActiveContextRefV010;
  memoryId?: string;
  kind: ContextMemoryKindV010;
  summary: string;
}

export interface ContextMemoryDlpClassificationResultV010 {
  contractVersion: "0.1.0";
  privacyClass: ContextMemoryPrivacyClassV010;
  labels: string[];
  confidence?: number;
  reasonCodes: string[];
}

export interface ContextMemoryDlpClassifierV010 {
  providerId: string;
  classify(
    input: ContextMemoryDlpClassificationRequestV010
  ):
    | Promise<ContextMemoryDlpClassificationResultV010>
    | ContextMemoryDlpClassificationResultV010;
}

export type ContextMemoryOperationKindV010 =
  | "RETENTION_EVALUATION"
  | "DLP_RECLASSIFICATION"
  | "SOURCE_INTAKE";

export type ContextMemoryOperationStateV010 =
  | "SUCCEEDED"
  | "FAILED"
  | "SKIPPED";

export interface ContextMemoryOperationEventV010 {
  contractVersion: "0.1.0";
  operationId: string;
  kind: ContextMemoryOperationKindV010;
  context: ActiveContextRefV010;
  state: ContextMemoryOperationStateV010;
  startedAt: string;
  completedAt: string;
  examined: number;
  changed: number;
  skipped: number;
  failureCode?: string;
  message?: string;
}
