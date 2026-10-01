import { randomUUID } from "node:crypto";
import type {
  ExternalAgentAuthorityGrantV010,
  ExternalAgentCapabilitySelectorV010,
  ExternalAgentClientKindV010,
  ExternalAgentClientRegistrationV010,
  ExternalAgentGovernanceEventV010,
  ExternalAgentGovernanceStoreV010,
  ExternalAgentProtocolV010,
  ExternalAgentRegistrationV010
} from "../contracts/external-agent-access.js";
import type {
  AuthorizationProviderV010,
  PlatformRequestContextV010
} from "../contracts/platform-services.js";
import type { AppManagerService } from "./service.js";
import {
  legacyScopeFromRequestContextV010
} from "./material-write-authorization.js";
import {
  listAuthorizedCapabilityOperationsV010
} from "./capability-operation-access.js";

export const EXTERNAL_AGENT_REGISTER_ACTION =
  "external.agent.register";
export const EXTERNAL_AGENT_REVOKE_ACTION =
  "external.agent.revoke";
export const EXTERNAL_AGENT_CLIENT_REGISTER_ACTION =
  "external.agent.client.register";
export const EXTERNAL_AGENT_CLIENT_REVOKE_ACTION =
  "external.agent.client.revoke";
export const EXTERNAL_AGENT_GRANT_CREATE_ACTION =
  "external.agent.grant.create";
export const EXTERNAL_AGENT_GRANT_REVOKE_ACTION =
  "external.agent.grant.revoke";
export const EXTERNAL_AGENT_GOVERNANCE_READ_ACTION =
  "external.agent.governance.read";

export interface ExternalAgentGovernanceDependenciesV010 {
  store: ExternalAgentGovernanceStoreV010;
  manager: AppManagerService;
  resolveAuthorizationProvider(): AuthorizationProviderV010 | undefined;
  now?: () => Date;
  id?: () => string;
}

export interface RegisterExternalAgentInputV010 {
  displayName: string;
  publisherId?: string;
  metadata?: Record<string, string | number | boolean | null>;
}

export interface RegisterExternalAgentClientInputV010 {
  agentId: string;
  displayName: string;
  kind: ExternalAgentClientKindV010;
  protocols: ExternalAgentProtocolV010[];
  oauthClientId?: string;
  metadata?: Record<string, string | number | boolean | null>;
}

export interface CreateExternalAgentGrantInputV010 {
  agentId: string;
  clientId: string;
  allowedOperationIds?: string[];
  capabilitySelectors?: ExternalAgentCapabilitySelectorV010[];
  validUntil: string;
  description?: string;
}

export interface ExternalAgentGrantableOperationV010 {
  operationId: string;
  capability: string;
  title: string;
  description: string;
  effect: "READ" | "PLAN";
  dataScope: string;
}

export interface EnsureExternalAgentConsentClientInputV010 {
  oauthClientId: string;
  displayName: string;
}

export interface ExternalAgentGovernanceServiceV010 {
  registerAgent(
    context: PlatformRequestContextV010,
    input: RegisterExternalAgentInputV010
  ): Promise<ExternalAgentRegistrationV010>;
  revokeAgent(
    context: PlatformRequestContextV010,
    agentId: string
  ): Promise<ExternalAgentRegistrationV010>;
  registerClient(
    context: PlatformRequestContextV010,
    input: RegisterExternalAgentClientInputV010
  ): Promise<ExternalAgentClientRegistrationV010>;
  revokeClient(
    context: PlatformRequestContextV010,
    clientId: string
  ): Promise<ExternalAgentClientRegistrationV010>;
  ensurePublicCimdClient(
    context: PlatformRequestContextV010,
    input: EnsureExternalAgentConsentClientInputV010
  ): Promise<{
    agent: ExternalAgentRegistrationV010;
    client: ExternalAgentClientRegistrationV010;
    created: boolean;
  }>;
  listGrantableOperations(
    context: PlatformRequestContextV010
  ): Promise<ExternalAgentGrantableOperationV010[]>;
  createGrant(
    context: PlatformRequestContextV010,
    input: CreateExternalAgentGrantInputV010
  ): Promise<ExternalAgentAuthorityGrantV010>;
  revokeGrant(
    context: PlatformRequestContextV010,
    grantId: string
  ): Promise<ExternalAgentAuthorityGrantV010>;
  listForPrincipal(
    context: PlatformRequestContextV010
  ): Promise<{
    agents: ExternalAgentRegistrationV010[];
    clients: ExternalAgentClientRegistrationV010[];
    grants: ExternalAgentAuthorityGrantV010[];
  }>;
}

function requireHuman(context: PlatformRequestContextV010): void {
  if (context.principal.actorType !== "HUMAN") {
    throw new Error("EXTERNAL_AGENT_GOVERNANCE_HUMAN_REQUIRED");
  }
}

function activeContextId(context: PlatformRequestContextV010): string {
  const active = context.context?.activeContext;
  if (!active?.contextId || active.kind !== "ENTERPRISE") {
    throw new Error("EXTERNAL_AGENT_ENTERPRISE_CONTEXT_REQUIRED");
  }
  return active.contextId;
}

function normalizeText(value: string, code: string): string {
  const normalized = value.trim();
  if (!normalized) throw new Error(code);
  return normalized;
}

function normalizeOptionalText(value: string | undefined): string | undefined {
  const normalized = value?.trim();
  return normalized || undefined;
}

function uniqueSorted(values: readonly string[], code: string): string[] {
  const normalized = values.map(value => value.trim());
  if (normalized.some(value => !value)) throw new Error(code);
  const set = new Set(normalized);
  if (set.size !== normalized.length) throw new Error(code);
  return [...set].sort();
}


function normalizedCapabilitySelectors(
  selectors: readonly ExternalAgentCapabilitySelectorV010[] | undefined
): ExternalAgentCapabilitySelectorV010[] {
  if (selectors === undefined) return [];
  const normalized = selectors.map(selector => {
    const capability = normalizeText(
      selector.capability,
      "EXTERNAL_AGENT_GRANT_SELECTOR_CAPABILITY_REQUIRED"
    );
    const effects = uniqueSorted(
      selector.effects,
      "EXTERNAL_AGENT_GRANT_SELECTOR_EFFECT_INVALID"
    );
    if (
      effects.length === 0
      || effects.some(effect => effect !== "READ" && effect !== "PLAN")
    ) {
      throw new Error("EXTERNAL_AGENT_GRANT_SELECTOR_EFFECT_INVALID");
    }
    return {
      contractVersion: "0.1.0" as const,
      capability,
      effects: effects as Array<"READ" | "PLAN">
    };
  });
  const keys = normalized.map(
    selector => selector.capability + "::" + selector.effects.join(",")
  );
  if (new Set(keys).size !== keys.length) {
    throw new Error("EXTERNAL_AGENT_GRANT_SELECTOR_DUPLICATE");
  }
  return normalized.sort((a, b) =>
    a.capability.localeCompare(b.capability)
    || a.effects.join(",").localeCompare(b.effects.join(","))
  );
}

function event(
  type: ExternalAgentGovernanceEventV010["type"],
  input: {
    actorSubjectId: string;
    occurredAt: string;
    eventId: string;
    agentId?: string;
    clientId?: string;
    grantId?: string;
    contextId?: string;
  }
): ExternalAgentGovernanceEventV010 {
  return {
    contractVersion: "0.1.0",
    eventId: input.eventId,
    type,
    occurredAt: input.occurredAt,
    actorSubjectId: input.actorSubjectId,
    ...(input.agentId ? { agentId: input.agentId } : {}),
    ...(input.clientId ? { clientId: input.clientId } : {}),
    ...(input.grantId ? { grantId: input.grantId } : {}),
    ...(input.contextId ? { contextId: input.contextId } : {})
  };
}

async function authorize(
  dependencies: ExternalAgentGovernanceDependenciesV010,
  context: PlatformRequestContextV010,
  action: string,
  resource: {
    type: string;
    id?: string;
    attributes?: Record<string, string | number | boolean | null>;
  }
): Promise<void> {
  const provider = dependencies.resolveAuthorizationProvider();
  if (!provider) throw new Error("AUTHORIZATION_PROVIDER_REQUIRED");
  try {
    const active = context.context?.activeContext;
    const decision = await provider.check({
      contractVersion: "0.1.0",
      principal: context.principal,
      scope: legacyScopeFromRequestContextV010(context),
      action,
      resource,
      context: {
        correlationId: context.correlationId,
        ...(active ? {
          activeContextKind: active.kind,
          activeContextId: active.contextId
        } : {})
      }
    });
    if (!decision.allowed) {
      throw new Error(
        (decision.reasonCodes[0] ?? "EXTERNAL_AGENT_GOVERNANCE_DENIED")
        + ": denied by "
        + decision.policyProviderId
      );
    }
  } catch (error) {
    if (
      error instanceof Error
      && (
        error.message.startsWith("AUTHORIZATION_")
        || error.message.includes(": denied by ")
      )
    ) {
      throw error;
    }
    throw new Error("AUTHORIZATION_PROVIDER_ERROR");
  }
}

function nextStableId(
  prefix: string,
  used: Set<string>,
  id: () => string
): string {
  let candidate = prefix + id();
  while (used.has(candidate)) candidate = prefix + id();
  return candidate;
}

export function externalAgentGrantTimeActiveV010(
  grant: ExternalAgentAuthorityGrantV010,
  at: Date
): boolean {
  if (grant.state !== "ACTIVE") return false;
  const epoch = at.getTime();
  return Date.parse(grant.validFrom) <= epoch
    && epoch < Date.parse(grant.validUntil);
}

export type ExternalAgentGrantEffectiveReasonV010 =
  | "ACTIVE"
  | "GRANT_NOT_FOUND"
  | "GRANT_AGENT_MISMATCH"
  | "GRANT_CLIENT_MISMATCH"
  | "AGENT_NOT_ACTIVE"
  | "CLIENT_NOT_ACTIVE"
  | "CLIENT_AGENT_MISMATCH"
  | "GRANT_REVOKED"
  | "GRANT_NOT_YET_VALID"
  | "GRANT_EXPIRED";

export interface ExternalAgentGrantEffectiveStatusV010 {
  active: boolean;
  reason: ExternalAgentGrantEffectiveReasonV010;
  grant?: ExternalAgentAuthorityGrantV010;
}

export function resolveExternalAgentGrantEffectiveStatusV010(input: {
  store: ExternalAgentGovernanceStoreV010;
  grantId: string;
  agentId: string;
  clientId: string;
  at: Date;
}): ExternalAgentGrantEffectiveStatusV010 {
  const snapshot = input.store.snapshot();
  const grant = snapshot.grants.find(item => item.grantId === input.grantId);
  if (!grant) return { active: false, reason: "GRANT_NOT_FOUND" };
  if (grant.agentId !== input.agentId) {
    return { active: false, reason: "GRANT_AGENT_MISMATCH" };
  }
  if (grant.clientId !== input.clientId) {
    return { active: false, reason: "GRANT_CLIENT_MISMATCH" };
  }

  const agent = snapshot.agents.find(item => item.agentId === input.agentId);
  if (!agent || agent.state !== "ACTIVE") {
    return { active: false, reason: "AGENT_NOT_ACTIVE" };
  }
  const client = snapshot.clients.find(item => item.clientId === input.clientId);
  if (!client || client.state !== "ACTIVE") {
    return { active: false, reason: "CLIENT_NOT_ACTIVE" };
  }
  if (client.agentId !== input.agentId) {
    return { active: false, reason: "CLIENT_AGENT_MISMATCH" };
  }
  if (grant.state !== "ACTIVE") {
    return { active: false, reason: "GRANT_REVOKED" };
  }

  const epoch = input.at.getTime();
  if (epoch < Date.parse(grant.validFrom)) {
    return { active: false, reason: "GRANT_NOT_YET_VALID" };
  }
  if (epoch >= Date.parse(grant.validUntil)) {
    return { active: false, reason: "GRANT_EXPIRED" };
  }
  return {
    active: true,
    reason: "ACTIVE",
    grant: structuredClone(grant)
  };
}

export function createExternalAgentGovernanceServiceV010(
  dependencies: ExternalAgentGovernanceDependenciesV010
): ExternalAgentGovernanceServiceV010 {
  const now = dependencies.now ?? (() => new Date());
  const id = dependencies.id ?? randomUUID;

  return {
    async registerAgent(context, input) {
      requireHuman(context);
      const displayName = normalizeText(
        input.displayName,
        "EXTERNAL_AGENT_DISPLAY_NAME_REQUIRED"
      );
      await authorize(
        dependencies,
        context,
        EXTERNAL_AGENT_REGISTER_ACTION,
        {
          type: "external.agent",
          attributes: {
            displayName,
            ...(input.publisherId?.trim()
              ? { publisherId: input.publisherId.trim() }
              : {})
          }
        }
      );

      const snapshot = dependencies.store.snapshot();
      const used = new Set(snapshot.agents.map(item => item.agentId));
      const agentId = nextStableId("external-agent:", used, id);
      const occurredAt = now().toISOString();
      const agent: ExternalAgentRegistrationV010 = {
        contractVersion: "0.1.0",
        agentId,
        displayName,
        ...(normalizeOptionalText(input.publisherId)
          ? { publisherId: normalizeOptionalText(input.publisherId) }
          : {}),
        trustLevel: "REGISTERED",
        state: "ACTIVE",
        createdAt: occurredAt,
        createdBySubjectId: context.principal.subjectId,
        ...(input.metadata ? { metadata: structuredClone(input.metadata) } : {})
      };

      dependencies.store.save({
        ...snapshot,
        agents: [...snapshot.agents, agent],
        events: [
          ...snapshot.events,
          event("AGENT_REGISTERED", {
            actorSubjectId: context.principal.subjectId,
            occurredAt,
            eventId: "external-agent-event:" + id(),
            agentId
          })
        ]
      });
      return structuredClone(agent);
    },

    async revokeAgent(context, agentIdInput) {
      requireHuman(context);
      const agentId = normalizeText(
        agentIdInput,
        "EXTERNAL_AGENT_ID_REQUIRED"
      );
      const snapshot = dependencies.store.snapshot();
      const current = snapshot.agents.find(item => item.agentId === agentId);
      if (!current) throw new Error("EXTERNAL_AGENT_NOT_FOUND");
      if (current.state === "REVOKED") {
        throw new Error("EXTERNAL_AGENT_ALREADY_REVOKED");
      }
      await authorize(
        dependencies,
        context,
        EXTERNAL_AGENT_REVOKE_ACTION,
        { type: "external.agent", id: agentId }
      );

      const occurredAt = now().toISOString();
      const revoked: ExternalAgentRegistrationV010 = {
        ...current,
        state: "REVOKED",
        revokedAt: occurredAt,
        revokedBySubjectId: context.principal.subjectId
      };
      dependencies.store.save({
        ...snapshot,
        agents: snapshot.agents.map(item =>
          item.agentId === agentId ? revoked : item
        ),
        events: [
          ...snapshot.events,
          event("AGENT_REVOKED", {
            actorSubjectId: context.principal.subjectId,
            occurredAt,
            eventId: "external-agent-event:" + id(),
            agentId
          })
        ]
      });
      return structuredClone(revoked);
    },

    async registerClient(context, input) {
      requireHuman(context);
      const agentId = normalizeText(
        input.agentId,
        "EXTERNAL_AGENT_ID_REQUIRED"
      );
      const displayName = normalizeText(
        input.displayName,
        "EXTERNAL_AGENT_CLIENT_DISPLAY_NAME_REQUIRED"
      );
      const protocols = uniqueSorted(
        input.protocols,
        "EXTERNAL_AGENT_CLIENT_PROTOCOL_INVALID"
      ) as ExternalAgentProtocolV010[];
      if (
        protocols.some(protocol =>
          !["MCP", "OPENAPI", "A2A"].includes(protocol)
        )
      ) {
        throw new Error("EXTERNAL_AGENT_CLIENT_PROTOCOL_INVALID");
      }

      const oauthClientId = normalizeOptionalText(input.oauthClientId);
      if (oauthClientId) {
        let parsed: URL;
        try {
          parsed = new URL(oauthClientId);
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

      const snapshot = dependencies.store.snapshot();
      if (
        oauthClientId
        && snapshot.clients.some(item => item.oauthClientId === oauthClientId)
      ) {
        throw new Error("EXTERNAL_AGENT_OAUTH_CLIENT_ID_DUPLICATE");
      }
      const agent = snapshot.agents.find(item => item.agentId === agentId);
      if (!agent) throw new Error("EXTERNAL_AGENT_NOT_FOUND");
      if (agent.state !== "ACTIVE") throw new Error("EXTERNAL_AGENT_NOT_ACTIVE");

      await authorize(
        dependencies,
        context,
        EXTERNAL_AGENT_CLIENT_REGISTER_ACTION,
        {
          type: "external.agent.client",
          attributes: {
            agentId,
            kind: input.kind
          }
        }
      );

      const used = new Set(snapshot.clients.map(item => item.clientId));
      const clientId = nextStableId("external-client:", used, id);
      const occurredAt = now().toISOString();
      const client: ExternalAgentClientRegistrationV010 = {
        contractVersion: "0.1.0",
        clientId,
        agentId,
        displayName,
        kind: input.kind,
        protocols,
        ...(oauthClientId ? { oauthClientId } : {}),
        state: "ACTIVE",
        createdAt: occurredAt,
        createdBySubjectId: context.principal.subjectId,
        ...(input.metadata ? { metadata: structuredClone(input.metadata) } : {})
      };
      dependencies.store.save({
        ...snapshot,
        clients: [...snapshot.clients, client],
        events: [
          ...snapshot.events,
          event("CLIENT_REGISTERED", {
            actorSubjectId: context.principal.subjectId,
            occurredAt,
            eventId: "external-agent-event:" + id(),
            agentId,
            clientId
          })
        ]
      });
      return structuredClone(client);
    },

    async revokeClient(context, clientIdInput) {
      requireHuman(context);
      const clientId = normalizeText(
        clientIdInput,
        "EXTERNAL_AGENT_CLIENT_ID_REQUIRED"
      );
      const snapshot = dependencies.store.snapshot();
      const current = snapshot.clients.find(item => item.clientId === clientId);
      if (!current) throw new Error("EXTERNAL_AGENT_CLIENT_NOT_FOUND");
      if (current.state === "REVOKED") {
        throw new Error("EXTERNAL_AGENT_CLIENT_ALREADY_REVOKED");
      }

      await authorize(
        dependencies,
        context,
        EXTERNAL_AGENT_CLIENT_REVOKE_ACTION,
        { type: "external.agent.client", id: clientId }
      );

      const occurredAt = now().toISOString();
      const revoked: ExternalAgentClientRegistrationV010 = {
        ...current,
        state: "REVOKED",
        revokedAt: occurredAt,
        revokedBySubjectId: context.principal.subjectId
      };
      dependencies.store.save({
        ...snapshot,
        clients: snapshot.clients.map(item =>
          item.clientId === clientId ? revoked : item
        ),
        events: [
          ...snapshot.events,
          event("CLIENT_REVOKED", {
            actorSubjectId: context.principal.subjectId,
            occurredAt,
            eventId: "external-agent-event:" + id(),
            agentId: current.agentId,
            clientId
          })
        ]
      });
      return structuredClone(revoked);
    },

    async ensurePublicCimdClient(context, input) {
      requireHuman(context);
      const oauthClientId = normalizeText(
        input.oauthClientId,
        "EXTERNAL_AGENT_OAUTH_CLIENT_ID_INVALID"
      );
      let parsed: URL;
      try {
        parsed = new URL(oauthClientId);
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
      const displayName = normalizeText(
        input.displayName,
        "EXTERNAL_AGENT_CLIENT_DISPLAY_NAME_REQUIRED"
      );

      const before = dependencies.store.snapshot();
      const existingClient = before.clients.find(
        item => item.oauthClientId === oauthClientId
      );
      if (existingClient) {
        if (existingClient.state !== "ACTIVE") {
          throw new Error("EXTERNAL_AGENT_OAUTH_CLIENT_NOT_ACTIVE");
        }
        const existingAgent = before.agents.find(
          item => item.agentId === existingClient.agentId
        );
        if (!existingAgent || existingAgent.state !== "ACTIVE") {
          throw new Error("EXTERNAL_AGENT_OAUTH_AGENT_NOT_ACTIVE");
        }
        return {
          agent: structuredClone(existingAgent),
          client: structuredClone(existingClient),
          created: false
        };
      }

      await authorize(
        dependencies,
        context,
        EXTERNAL_AGENT_REGISTER_ACTION,
        {
          type: "external.agent",
          attributes: {
            displayName
          }
        }
      );
      await authorize(
        dependencies,
        context,
        EXTERNAL_AGENT_CLIENT_REGISTER_ACTION,
        {
          type: "external.agent.client",
          attributes: {
            kind: "PUBLIC"
          }
        }
      );

      const snapshot = dependencies.store.snapshot();
      const raced = snapshot.clients.find(
        item => item.oauthClientId === oauthClientId
      );
      if (raced) {
        if (raced.state !== "ACTIVE") {
          throw new Error("EXTERNAL_AGENT_OAUTH_CLIENT_NOT_ACTIVE");
        }
        const racedAgent = snapshot.agents.find(
          item => item.agentId === raced.agentId
        );
        if (!racedAgent || racedAgent.state !== "ACTIVE") {
          throw new Error("EXTERNAL_AGENT_OAUTH_AGENT_NOT_ACTIVE");
        }
        return {
          agent: structuredClone(racedAgent),
          client: structuredClone(raced),
          created: false
        };
      }

      const occurredAt = now().toISOString();
      const usedAgentIds = new Set(snapshot.agents.map(item => item.agentId));
      const agentId = nextStableId(
        "external-agent:",
        usedAgentIds,
        id
      );
      const agent: ExternalAgentRegistrationV010 = {
        contractVersion: "0.1.0",
        agentId,
        displayName,
        trustLevel: "REGISTERED",
        state: "ACTIVE",
        createdAt: occurredAt,
        createdBySubjectId: context.principal.subjectId,
        metadata: {
          onboarding: "OAUTH_HUMAN_CONSENT",
          oauthClientOrigin: parsed.origin
        }
      };

      const usedClientIds = new Set(snapshot.clients.map(item => item.clientId));
      const clientId = nextStableId(
        "external-client:",
        usedClientIds,
        id
      );
      const client: ExternalAgentClientRegistrationV010 = {
        contractVersion: "0.1.0",
        clientId,
        agentId,
        displayName,
        kind: "PUBLIC",
        protocols: ["MCP"],
        oauthClientId,
        state: "ACTIVE",
        createdAt: occurredAt,
        createdBySubjectId: context.principal.subjectId,
        metadata: {
          onboarding: "OAUTH_HUMAN_CONSENT"
        }
      };

      dependencies.store.save({
        ...snapshot,
        agents: [...snapshot.agents, agent],
        clients: [...snapshot.clients, client],
        events: [
          ...snapshot.events,
          event("AGENT_REGISTERED", {
            actorSubjectId: context.principal.subjectId,
            occurredAt,
            eventId: "external-agent-event:" + id(),
            agentId
          }),
          event("CLIENT_REGISTERED", {
            actorSubjectId: context.principal.subjectId,
            occurredAt,
            eventId: "external-agent-event:" + id(),
            agentId,
            clientId
          })
        ]
      });

      return {
        agent: structuredClone(agent),
        client: structuredClone(client),
        created: true
      };
    },

    async listGrantableOperations(context) {
      requireHuman(context);
      activeContextId(context);
      await authorize(
        dependencies,
        context,
        EXTERNAL_AGENT_GRANT_CREATE_ACTION,
        {
          type: "external.agent.authority-grant",
          attributes: {
            contextId: context.context!.activeContext.contextId,
            operationCount: 0
          }
        }
      );

      const humanCatalog = await listAuthorizedCapabilityOperationsV010({
        manager: dependencies.manager,
        authorizationProvider: dependencies.resolveAuthorizationProvider(),
        requestContext: context,
        audience: "HUMAN"
      });

      return humanCatalog.operations
        .flatMap(operation => {
          if (
            !operation.exposure.includes("EXTERNAL_AGENT")
            || (operation.effect !== "READ" && operation.effect !== "PLAN")
          ) {
            return [];
          }
          const item: ExternalAgentGrantableOperationV010 = {
            operationId: operation.operationId,
            capability: operation.capability,
            title: operation.title,
            description: operation.description,
            effect: operation.effect,
            dataScope: operation.dataScope
          };
          return [item];
        })
        .sort((a, b) => a.operationId.localeCompare(b.operationId));
    },

    async createGrant(context, input) {
      requireHuman(context);
      const contextId = activeContextId(context);
      const agentId = normalizeText(
        input.agentId,
        "EXTERNAL_AGENT_ID_REQUIRED"
      );
      const clientId = normalizeText(
        input.clientId,
        "EXTERNAL_AGENT_CLIENT_ID_REQUIRED"
      );
      const requestedOperations = uniqueSorted(
        input.allowedOperationIds ?? [],
        "EXTERNAL_AGENT_GRANT_OPERATION_INVALID"
      );
      const capabilitySelectors = normalizedCapabilitySelectors(
        input.capabilitySelectors
      );
      if (
        requestedOperations.length === 0
        && capabilitySelectors.length === 0
      ) {
        throw new Error("EXTERNAL_AGENT_GRANT_AUTHORITY_REQUIRED");
      }

      const validUntilEpoch = Date.parse(input.validUntil);
      const at = now();
      if (
        !Number.isFinite(validUntilEpoch)
        || new Date(validUntilEpoch).toISOString() !== input.validUntil
        || validUntilEpoch <= at.getTime()
      ) {
        throw new Error("EXTERNAL_AGENT_GRANT_VALID_UNTIL_INVALID");
      }

      const snapshot = dependencies.store.snapshot();
      const agent = snapshot.agents.find(item => item.agentId === agentId);
      const client = snapshot.clients.find(item => item.clientId === clientId);
      if (!agent) throw new Error("EXTERNAL_AGENT_NOT_FOUND");
      if (agent.state !== "ACTIVE") throw new Error("EXTERNAL_AGENT_NOT_ACTIVE");
      if (!client) throw new Error("EXTERNAL_AGENT_CLIENT_NOT_FOUND");
      if (client.state !== "ACTIVE") throw new Error("EXTERNAL_AGENT_CLIENT_NOT_ACTIVE");
      if (client.agentId !== agentId) {
        throw new Error("EXTERNAL_AGENT_CLIENT_AGENT_MISMATCH");
      }

      await authorize(
        dependencies,
        context,
        EXTERNAL_AGENT_GRANT_CREATE_ACTION,
        {
          type: "external.agent.authority-grant",
          attributes: {
            agentId,
            clientId,
            contextId,
            operationCount: requestedOperations.length,
            capabilitySelectorCount: capabilitySelectors.length
          }
        }
      );

      const humanCatalog = await listAuthorizedCapabilityOperationsV010({
        manager: dependencies.manager,
        authorizationProvider: dependencies.resolveAuthorizationProvider(),
        requestContext: context,
        audience: "HUMAN"
      });
      const grantable = new Map(
        humanCatalog.operations
          .filter(operation => operation.exposure.includes("EXTERNAL_AGENT"))
          .map(operation => [operation.operationId, operation])
      );

      const selected = requestedOperations.map(operationId => {
        const operation = grantable.get(operationId);
        if (!operation) {
          throw new Error(
            "EXTERNAL_AGENT_GRANT_OPERATION_NOT_AUTHORIZED: " + operationId
          );
        }
        if (operation.effect === "WRITE") {
          throw new Error(
            "EXTERNAL_AGENT_WRITE_NOT_ENABLED: " + operationId
          );
        }
        return operation;
      });

      for (const selector of capabilitySelectors) {
        for (const effect of selector.effects) {
          const matches = humanCatalog.operations.filter(operation =>
            operation.exposure.includes("EXTERNAL_AGENT")
            && operation.capability === selector.capability
            && operation.effect === effect
          );
          if (matches.length === 0) {
            throw new Error(
              "EXTERNAL_AGENT_GRANT_SELECTOR_NOT_AUTHORIZED: "
              + selector.capability
              + "::"
              + effect
            );
          }
        }
      }

      const effectConstraints = [
        ...new Set([
          ...selected.map(operation => operation.effect),
          ...capabilitySelectors.flatMap(selector => selector.effects)
        ])
      ].sort();

      const used = new Set(snapshot.grants.map(item => item.grantId));
      const grantId = nextStableId("external-grant:", used, id);
      const occurredAt = at.toISOString();
      const grant: ExternalAgentAuthorityGrantV010 = {
        contractVersion: "0.1.0",
        grantId,
        agentId,
        clientId,
        authorizingPrincipalSubjectId: context.principal.subjectId,
        contextId,
        allowedOperationIds: requestedOperations,
        ...(capabilitySelectors.length > 0
          ? { capabilitySelectors }
          : {}),
        effectConstraints,
        state: "ACTIVE",
        validFrom: occurredAt,
        validUntil: input.validUntil,
        createdAt: occurredAt,
        createdBySubjectId: context.principal.subjectId,
        ...(normalizeOptionalText(input.description)
          ? { description: normalizeOptionalText(input.description) }
          : {})
      };

      dependencies.store.save({
        ...snapshot,
        grants: [...snapshot.grants, grant],
        events: [
          ...snapshot.events,
          event("GRANT_CREATED", {
            actorSubjectId: context.principal.subjectId,
            occurredAt,
            eventId: "external-agent-event:" + id(),
            agentId,
            clientId,
            grantId,
            contextId
          })
        ]
      });
      return structuredClone(grant);
    },

    async revokeGrant(context, grantIdInput) {
      requireHuman(context);
      const grantId = normalizeText(
        grantIdInput,
        "EXTERNAL_AGENT_GRANT_ID_REQUIRED"
      );
      const snapshot = dependencies.store.snapshot();
      const current = snapshot.grants.find(item => item.grantId === grantId);
      if (!current) throw new Error("EXTERNAL_AGENT_GRANT_NOT_FOUND");
      if (current.state === "REVOKED") {
        throw new Error("EXTERNAL_AGENT_GRANT_ALREADY_REVOKED");
      }

      await authorize(
        dependencies,
        context,
        EXTERNAL_AGENT_GRANT_REVOKE_ACTION,
        {
          type: "external.agent.authority-grant",
          id: grantId,
          attributes: {
            agentId: current.agentId,
            clientId: current.clientId,
            contextId: current.contextId
          }
        }
      );

      const occurredAt = now().toISOString();
      const revoked: ExternalAgentAuthorityGrantV010 = {
        ...current,
        state: "REVOKED",
        revokedAt: occurredAt,
        revokedBySubjectId: context.principal.subjectId
      };
      dependencies.store.save({
        ...snapshot,
        grants: snapshot.grants.map(item =>
          item.grantId === grantId ? revoked : item
        ),
        events: [
          ...snapshot.events,
          event("GRANT_REVOKED", {
            actorSubjectId: context.principal.subjectId,
            occurredAt,
            eventId: "external-agent-event:" + id(),
            agentId: current.agentId,
            clientId: current.clientId,
            grantId,
            contextId: current.contextId
          })
        ]
      });
      return structuredClone(revoked);
    },

    async listForPrincipal(context) {
      requireHuman(context);
      await authorize(
        dependencies,
        context,
        EXTERNAL_AGENT_GOVERNANCE_READ_ACTION,
        {
          type: "external.agent.governance",
          attributes: {
            principalSubjectId: context.principal.subjectId
          }
        }
      );
      const snapshot = dependencies.store.snapshot();
      const grants = snapshot.grants.filter(
        item =>
          item.authorizingPrincipalSubjectId === context.principal.subjectId
      );
      const agentIds = new Set(grants.map(item => item.agentId));
      const clientIds = new Set(grants.map(item => item.clientId));
      return {
        agents: snapshot.agents
          .filter(item =>
            item.createdBySubjectId === context.principal.subjectId
            || agentIds.has(item.agentId)
          )
          .map(item => structuredClone(item)),
        clients: snapshot.clients
          .filter(item =>
            item.createdBySubjectId === context.principal.subjectId
            || clientIds.has(item.clientId)
          )
          .map(item => structuredClone(item)),
        grants: grants.map(item => structuredClone(item))
      };
    }
  };
}
