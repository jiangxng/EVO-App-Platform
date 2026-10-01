import type { CapabilityOperationEffectV010 } from "./package.js";

export type ExternalAgentTrustLevelV010 =
  | "UNVERIFIED"
  | "REGISTERED"
  | "VERIFIED"
  | "ENTERPRISE_APPROVED"
  | "FIRST_PARTY";

export type ExternalAgentRegistrationStateV010 =
  | "ACTIVE"
  | "REVOKED";

export interface ExternalAgentRegistrationV010 {
  contractVersion: "0.1.0";
  agentId: string;
  displayName: string;
  publisherId?: string;
  trustLevel: ExternalAgentTrustLevelV010;
  state: ExternalAgentRegistrationStateV010;
  createdAt: string;
  createdBySubjectId: string;
  revokedAt?: string;
  revokedBySubjectId?: string;
  metadata?: Record<string, string | number | boolean | null>;
}

export type ExternalAgentClientKindV010 =
  | "PUBLIC"
  | "CONFIDENTIAL"
  | "WORKLOAD";

export type ExternalAgentProtocolV010 =
  | "MCP"
  | "OPENAPI"
  | "A2A";

export type ExternalAgentClientStateV010 =
  | "ACTIVE"
  | "REVOKED";

export interface ExternalAgentClientRegistrationV010 {
  contractVersion: "0.1.0";
  clientId: string;
  agentId: string;
  displayName: string;
  kind: ExternalAgentClientKindV010;
  protocols: ExternalAgentProtocolV010[];
  /**
   * OAuth client identifier used on the wire.
   * For MCP 2026-07-28 CIMD clients this is the HTTPS metadata-document URL.
   * It is distinct from EVO's internal clientId governance identity.
   */
  oauthClientId?: string;
  state: ExternalAgentClientStateV010;
  createdAt: string;
  createdBySubjectId: string;
  revokedAt?: string;
  revokedBySubjectId?: string;
  metadata?: Record<string, string | number | boolean | null>;
}

export type ExternalAgentAuthorityGrantStateV010 =
  | "ACTIVE"
  | "REVOKED";

export type ExternalAgentDelegableEffectV010 =
  | "READ"
  | "PLAN";

export interface ExternalAgentCapabilitySelectorV010 {
  contractVersion: "0.1.0";
  capability: string;
  effects: ExternalAgentDelegableEffectV010[];
}

export interface ExternalAgentAuthorityGrantV010 {
  contractVersion: "0.1.0";
  grantId: string;
  agentId: string;
  clientId: string;
  authorizingPrincipalSubjectId: string;
  contextId: string;
  /**
   * Explicit operation grants remain supported for precise delegation and
   * backwards compatibility. A Grant may use explicit ids, capability
   * selectors, or both.
   */
  allowedOperationIds: string[];
  /**
   * Capability-level authority selectors are dynamically resolved against the
   * current Human authorization, plugin lifecycle and External Agent exposure.
   * They never authorize WRITE in v0.2.
   */
  capabilitySelectors?: ExternalAgentCapabilitySelectorV010[];
  effectConstraints: CapabilityOperationEffectV010[];
  state: ExternalAgentAuthorityGrantStateV010;
  validFrom: string;
  validUntil: string;
  createdAt: string;
  createdBySubjectId: string;
  revokedAt?: string;
  revokedBySubjectId?: string;
  description?: string;
}

export type ExternalAgentGovernanceEventTypeV010 =
  | "AGENT_REGISTERED"
  | "AGENT_REVOKED"
  | "CLIENT_REGISTERED"
  | "CLIENT_REVOKED"
  | "GRANT_CREATED"
  | "GRANT_REVOKED";

export interface ExternalAgentGovernanceEventV010 {
  contractVersion: "0.1.0";
  eventId: string;
  type: ExternalAgentGovernanceEventTypeV010;
  occurredAt: string;
  actorSubjectId: string;
  agentId?: string;
  clientId?: string;
  grantId?: string;
  contextId?: string;
}

export interface ExternalAgentGovernanceSnapshotV010 {
  contractVersion: "0.1.0";
  agents: ExternalAgentRegistrationV010[];
  clients: ExternalAgentClientRegistrationV010[];
  grants: ExternalAgentAuthorityGrantV010[];
  events: ExternalAgentGovernanceEventV010[];
}

export interface ExternalAgentGovernanceStoreV010 {
  snapshot(): ExternalAgentGovernanceSnapshotV010;
  save(next: ExternalAgentGovernanceSnapshotV010): void;
}
