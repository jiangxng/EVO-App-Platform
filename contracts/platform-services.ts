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

export interface PlatformScopeV010 {
  contractVersion: "0.1.0";
  enterpriseId?: string;
  companyId?: string;
  workspaceId?: string;
  userId?: string;
}

export interface PlatformRequestContextV010 {
  contractVersion: "0.1.0";
  principal: PlatformPrincipalV010;
  scope: PlatformScopeV010;
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

export interface IdentitySessionV010 {
  contractVersion: "0.1.0";
  sessionId: string;
  principal: PlatformPrincipalV010;
  issuedAt: string;
  expiresAt?: string;
  assurance?: string[];
}

export interface EnterpriseContextV010 {
  contractVersion: "0.1.0";
  enterpriseId: string;
  enterpriseProviderId: string;
  companyId?: string;
  workspaceId?: string;
  membershipId?: string;
  attributes?: Record<string, string | number | boolean | null>;
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
  "identity.user-directory",
  "authorization.check",
  "authorization.policy",
  "enterprise.directory",
  "enterprise.organization",
  "enterprise.membership",
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
