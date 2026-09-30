import {
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  writeFileSync
} from "node:fs";
import { dirname } from "node:path";
import type {
  ExternalAgentAuthorityGrantV010,
  ExternalAgentClientRegistrationV010,
  ExternalAgentGovernanceEventV010,
  ExternalAgentGovernanceSnapshotV010,
  ExternalAgentGovernanceStoreV010,
  ExternalAgentRegistrationV010
} from "../contracts/external-agent-access.js";

function clone<T>(value: T): T {
  return structuredClone(value);
}

function empty(): ExternalAgentGovernanceSnapshotV010 {
  return {
    contractVersion: "0.1.0",
    agents: [],
    clients: [],
    grants: [],
    events: []
  };
}

function requireIso(value: string, code: string): number {
  const epoch = Date.parse(value);
  if (!Number.isFinite(epoch) || new Date(epoch).toISOString() !== value) {
    throw new Error(code);
  }
  return epoch;
}

function unique(values: readonly string[], code: string): void {
  const set = new Set<string>();
  for (const value of values) {
    if (set.has(value)) throw new Error(code + ": " + value);
    set.add(value);
  }
}

function validateAgent(agent: ExternalAgentRegistrationV010): void {
  if (
    agent.contractVersion !== "0.1.0"
    || !agent.agentId.trim()
    || !agent.displayName.trim()
    || !agent.createdBySubjectId.trim()
  ) {
    throw new Error("EXTERNAL_AGENT_REGISTRATION_INVALID");
  }
  requireIso(agent.createdAt, "EXTERNAL_AGENT_CREATED_AT_INVALID");
  if (agent.state === "REVOKED") {
    if (!agent.revokedAt || !agent.revokedBySubjectId?.trim()) {
      throw new Error("EXTERNAL_AGENT_REVOCATION_FACT_REQUIRED");
    }
    requireIso(agent.revokedAt, "EXTERNAL_AGENT_REVOKED_AT_INVALID");
  } else if (agent.revokedAt !== undefined || agent.revokedBySubjectId !== undefined) {
    throw new Error("EXTERNAL_AGENT_ACTIVE_REVOCATION_FACT_FORBIDDEN");
  }
}

function validateClient(
  client: ExternalAgentClientRegistrationV010,
  agents: Map<string, ExternalAgentRegistrationV010>
): void {
  if (
    client.contractVersion !== "0.1.0"
    || !client.clientId.trim()
    || !client.agentId.trim()
    || !client.displayName.trim()
    || !client.createdBySubjectId.trim()
    || client.protocols.length === 0
  ) {
    throw new Error("EXTERNAL_AGENT_CLIENT_INVALID");
  }
  if (!agents.has(client.agentId)) {
    throw new Error("EXTERNAL_AGENT_CLIENT_AGENT_NOT_FOUND: " + client.agentId);
  }
  unique(client.protocols, "EXTERNAL_AGENT_CLIENT_PROTOCOL_DUPLICATE");
  if (client.oauthClientId !== undefined) {
    let parsed: URL;
    try {
      parsed = new URL(client.oauthClientId);
    } catch {
      throw new Error("EXTERNAL_AGENT_OAUTH_CLIENT_ID_INVALID");
    }
    if (
      parsed.protocol !== "https:"
      || parsed.pathname === "/"
      || parsed.search
      || parsed.hash
    ) {
      throw new Error("EXTERNAL_AGENT_OAUTH_CLIENT_ID_INVALID");
    }
  }
  requireIso(client.createdAt, "EXTERNAL_AGENT_CLIENT_CREATED_AT_INVALID");
  if (client.state === "REVOKED") {
    if (!client.revokedAt || !client.revokedBySubjectId?.trim()) {
      throw new Error("EXTERNAL_AGENT_CLIENT_REVOCATION_FACT_REQUIRED");
    }
    requireIso(client.revokedAt, "EXTERNAL_AGENT_CLIENT_REVOKED_AT_INVALID");
  } else if (client.revokedAt !== undefined || client.revokedBySubjectId !== undefined) {
    throw new Error("EXTERNAL_AGENT_CLIENT_ACTIVE_REVOCATION_FACT_FORBIDDEN");
  }
}

function validateGrant(
  grant: ExternalAgentAuthorityGrantV010,
  agents: Map<string, ExternalAgentRegistrationV010>,
  clients: Map<string, ExternalAgentClientRegistrationV010>
): void {
  if (
    grant.contractVersion !== "0.1.0"
    || !grant.grantId.trim()
    || !grant.agentId.trim()
    || !grant.clientId.trim()
    || !grant.authorizingPrincipalSubjectId.trim()
    || !grant.contextId.trim()
    || !grant.createdBySubjectId.trim()
    || grant.allowedOperationIds.length === 0
    || grant.effectConstraints.length === 0
  ) {
    throw new Error("EXTERNAL_AGENT_AUTHORITY_GRANT_INVALID");
  }
  const agent = agents.get(grant.agentId);
  const client = clients.get(grant.clientId);
  if (!agent) {
    throw new Error("EXTERNAL_AGENT_GRANT_AGENT_NOT_FOUND: " + grant.agentId);
  }
  if (!client) {
    throw new Error("EXTERNAL_AGENT_GRANT_CLIENT_NOT_FOUND: " + grant.clientId);
  }
  if (client.agentId !== grant.agentId) {
    throw new Error("EXTERNAL_AGENT_GRANT_CLIENT_AGENT_MISMATCH");
  }
  if (grant.createdBySubjectId !== grant.authorizingPrincipalSubjectId) {
    throw new Error("EXTERNAL_AGENT_GRANT_AUTHOR_CREATOR_MISMATCH");
  }
  unique(
    grant.allowedOperationIds,
    "EXTERNAL_AGENT_GRANT_OPERATION_DUPLICATE"
  );
  unique(
    grant.effectConstraints,
    "EXTERNAL_AGENT_GRANT_EFFECT_DUPLICATE"
  );
  const validFrom = requireIso(
    grant.validFrom,
    "EXTERNAL_AGENT_GRANT_VALID_FROM_INVALID"
  );
  const validUntil = requireIso(
    grant.validUntil,
    "EXTERNAL_AGENT_GRANT_VALID_UNTIL_INVALID"
  );
  requireIso(grant.createdAt, "EXTERNAL_AGENT_GRANT_CREATED_AT_INVALID");
  if (validUntil <= validFrom) {
    throw new Error("EXTERNAL_AGENT_GRANT_VALIDITY_WINDOW_INVALID");
  }
  if (grant.state === "REVOKED") {
    if (!grant.revokedAt || !grant.revokedBySubjectId?.trim()) {
      throw new Error("EXTERNAL_AGENT_GRANT_REVOCATION_FACT_REQUIRED");
    }
    requireIso(grant.revokedAt, "EXTERNAL_AGENT_GRANT_REVOKED_AT_INVALID");
  } else if (grant.revokedAt !== undefined || grant.revokedBySubjectId !== undefined) {
    throw new Error("EXTERNAL_AGENT_GRANT_ACTIVE_REVOCATION_FACT_FORBIDDEN");
  }
}

function validateEvent(event: ExternalAgentGovernanceEventV010): void {
  if (
    event.contractVersion !== "0.1.0"
    || !event.eventId.trim()
    || !event.actorSubjectId.trim()
  ) {
    throw new Error("EXTERNAL_AGENT_GOVERNANCE_EVENT_INVALID");
  }
  requireIso(event.occurredAt, "EXTERNAL_AGENT_GOVERNANCE_EVENT_TIME_INVALID");
}

function validate(
  snapshot: ExternalAgentGovernanceSnapshotV010
): ExternalAgentGovernanceSnapshotV010 {
  if (snapshot.contractVersion !== "0.1.0") {
    throw new Error("EXTERNAL_AGENT_GOVERNANCE_CONTRACT_UNSUPPORTED");
  }
  unique(snapshot.agents.map(item => item.agentId), "EXTERNAL_AGENT_ID_DUPLICATE");
  unique(snapshot.clients.map(item => item.clientId), "EXTERNAL_AGENT_CLIENT_ID_DUPLICATE");
  unique(
    snapshot.clients
      .map(item => item.oauthClientId)
      .filter((value): value is string => value !== undefined),
    "EXTERNAL_AGENT_OAUTH_CLIENT_ID_DUPLICATE"
  );
  unique(snapshot.grants.map(item => item.grantId), "EXTERNAL_AGENT_GRANT_ID_DUPLICATE");
  unique(snapshot.events.map(item => item.eventId), "EXTERNAL_AGENT_EVENT_ID_DUPLICATE");

  const agents = new Map(snapshot.agents.map(item => [item.agentId, item]));
  for (const agent of snapshot.agents) validateAgent(agent);

  const clients = new Map(snapshot.clients.map(item => [item.clientId, item]));
  for (const client of snapshot.clients) validateClient(client, agents);
  for (const grant of snapshot.grants) validateGrant(grant, agents, clients);
  for (const event of snapshot.events) validateEvent(event);

  return clone(snapshot);
}

function requireUnchanged(
  code: string,
  id: string,
  before: Record<string, unknown>,
  after: Record<string, unknown>,
  fields: readonly string[]
): void {
  for (const field of fields) {
    if (JSON.stringify(before[field]) !== JSON.stringify(after[field])) {
      throw new Error(code + ": " + id + " field=" + field);
    }
  }
}

function validateAppendOnlyEvents(
  previous: ExternalAgentGovernanceEventV010[],
  next: ExternalAgentGovernanceEventV010[]
): void {
  if (next.length < previous.length) {
    throw new Error("EXTERNAL_AGENT_GOVERNANCE_EVENTS_APPEND_ONLY");
  }
  for (let i = 0; i < previous.length; i += 1) {
    if (JSON.stringify(previous[i]) !== JSON.stringify(next[i])) {
      throw new Error("EXTERNAL_AGENT_GOVERNANCE_EVENTS_APPEND_ONLY");
    }
  }
}

function validateTransition(
  previous: ExternalAgentGovernanceSnapshotV010,
  next: ExternalAgentGovernanceSnapshotV010
): void {
  const previousAgents = new Map(previous.agents.map(item => [item.agentId, item]));
  for (const agent of next.agents) {
    const existing = previousAgents.get(agent.agentId);
    if (!existing) continue;
    requireUnchanged(
      "EXTERNAL_AGENT_CREATION_FACT_IMMUTABLE",
      agent.agentId,
      existing as unknown as Record<string, unknown>,
      agent as unknown as Record<string, unknown>,
      [
        "agentId",
        "displayName",
        "publisherId",
        "trustLevel",
        "createdAt",
        "createdBySubjectId",
        "metadata"
      ]
    );
    if (existing.state === "REVOKED" && agent.state !== "REVOKED") {
      throw new Error("EXTERNAL_AGENT_REACTIVATION_FORBIDDEN: " + agent.agentId);
    }
  }

  const previousClients = new Map(
    previous.clients.map(item => [item.clientId, item])
  );
  for (const client of next.clients) {
    const existing = previousClients.get(client.clientId);
    if (!existing) continue;
    requireUnchanged(
      "EXTERNAL_AGENT_CLIENT_CREATION_FACT_IMMUTABLE",
      client.clientId,
      existing as unknown as Record<string, unknown>,
      client as unknown as Record<string, unknown>,
      [
        "clientId",
        "agentId",
        "displayName",
        "kind",
        "protocols",
        "oauthClientId",
        "createdAt",
        "createdBySubjectId",
        "metadata"
      ]
    );
    if (existing.state === "REVOKED" && client.state !== "REVOKED") {
      throw new Error(
        "EXTERNAL_AGENT_CLIENT_REACTIVATION_FORBIDDEN: " + client.clientId
      );
    }
  }

  const previousGrants = new Map(
    previous.grants.map(item => [item.grantId, item])
  );
  for (const grant of next.grants) {
    const existing = previousGrants.get(grant.grantId);
    if (!existing) continue;
    requireUnchanged(
      "EXTERNAL_AGENT_GRANT_CREATION_FACT_IMMUTABLE",
      grant.grantId,
      existing as unknown as Record<string, unknown>,
      grant as unknown as Record<string, unknown>,
      [
        "grantId",
        "agentId",
        "clientId",
        "authorizingPrincipalSubjectId",
        "contextId",
        "allowedOperationIds",
        "effectConstraints",
        "validFrom",
        "validUntil",
        "createdAt",
        "createdBySubjectId",
        "description"
      ]
    );
    if (existing.state === "REVOKED" && grant.state !== "REVOKED") {
      throw new Error("EXTERNAL_AGENT_GRANT_REACTIVATION_FORBIDDEN: " + grant.grantId);
    }
  }

  validateAppendOnlyEvents(previous.events, next.events);
}

export function createMemoryExternalAgentGovernanceStoreV010(
  seed: ExternalAgentGovernanceSnapshotV010 = empty()
): ExternalAgentGovernanceStoreV010 {
  let current = validate(seed);
  return {
    snapshot() {
      return clone(current);
    },
    save(next) {
      const valid = validate(next);
      validateTransition(current, valid);
      current = valid;
    }
  };
}

export function createFileExternalAgentGovernanceStoreV010(
  path: string
): ExternalAgentGovernanceStoreV010 {
  const load = (): ExternalAgentGovernanceSnapshotV010 => {
    if (!existsSync(path)) return empty();
    return validate(
      JSON.parse(readFileSync(path, "utf8")) as ExternalAgentGovernanceSnapshotV010
    );
  };

  return {
    snapshot: load,
    save(next) {
      const previous = load();
      const valid = validate(next);
      validateTransition(previous, valid);
      mkdirSync(dirname(path), { recursive: true });
      const temporary = path + ".tmp";
      writeFileSync(
        temporary,
        JSON.stringify(valid, null, 2) + "\n",
        "utf8"
      );
      renameSync(temporary, path);
    }
  };
}
