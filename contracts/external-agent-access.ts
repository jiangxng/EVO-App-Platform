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

export interface ExternalAgentAuthorityGrantV010 {
  contractVersion: "0.1.0";
  grantId: string;
  agentId: string;
  clientId: string;
  authorizingPrincipalSubjectId: string;
  contextId: string;
  allowedOperationIds: string[];
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
