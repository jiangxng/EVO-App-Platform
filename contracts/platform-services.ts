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

export interface ContextMemoryReadRequestV010 {
  contractVersion: "0.1.0";
  context: ActiveContextRefV010;
  query?: string;
  kinds?: ContextMemoryKindV010[];
  limit?: number;
  cursor?: string;
}

export interface ContextMemoryItemV010 {
  contractVersion: "0.1.0";
  memoryId: string;
  context: ActiveContextRefV010;
  kind: ContextMemoryKindV010;
  summary: string;
  provenanceRefs?: string[];
  observedAt?: string;
  supersededBy?: string;
}

export interface ContextMemoryReadResultV010 {
  contractVersion: "0.1.0";
  items: ContextMemoryItemV010[];
  nextCursor?: string;
}

export interface ContextMemoryReaderV010 {
  providerId: string;
  read(
    input: ContextMemoryReadRequestV010
  ): Promise<ContextMemoryReadResultV010> | ContextMemoryReadResultV010;
}
