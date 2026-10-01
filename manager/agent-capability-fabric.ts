import type {
  AppActionRequestV010,
  JsonValue
} from "../actions/contracts.js";
import type { AppActionRouter } from "../actions/router.js";
import type {
  EffectiveExternalAgentOAuthAccessV010
} from "../contracts/external-agent-oauth.js";
import type {
  CapabilityOperationEffectV010
} from "../contracts/package.js";
import type {
  PlatformRequestContextV010
} from "../contracts/platform-services.js";
import {
  capabilityOperationPublicMetadataV010,
  type EffectiveCapabilityOperationV010
} from "./capability-operation-access.js";
import {
  listEffectiveDelegatedCapabilityOperationsV010,
  resolveEffectiveDelegatedCapabilityOperationV010,
  type EffectiveDelegatedAuthorityDependenciesV010
} from "./external-agent-delegated-access.js";

export const AGENT_CAPABILITY_FABRIC_SEARCH = "evo.capabilities.search";
export const AGENT_CAPABILITY_FABRIC_DESCRIBE = "evo.capabilities.describe";
export const AGENT_CAPABILITY_FABRIC_INVOKE = "evo.capabilities.invoke";

export type AgentCapabilityFabricSupportedEffectV010 = "READ" | "PLAN";

export interface AgentCapabilityFabricSearchItemV010 {
  contractVersion: "0.1.0";
  operationId: string;
  capability: string;
  operationVersion: string;
  title: string;
  description: string;
  effect: AgentCapabilityFabricSupportedEffectV010;
  dataScope: string;
}

export interface AgentCapabilityFabricSearchResultV010 {
  contractVersion: "0.1.0";
  kind: "evo.agent-capability-fabric.search-result";
  query: string;
  matchedCount: number;
  returnedCount: number;
  truncated: boolean;
  items: AgentCapabilityFabricSearchItemV010[];
}

export interface AgentCapabilityFabricDescribeResultV010 {
  contractVersion: "0.1.0";
  kind: "evo.agent-capability-fabric.operation-description";
  operation: JsonValue;
}

export interface AgentCapabilityFabricInvokeResultV010 {
  contractVersion: "0.1.0";
  kind: "evo.agent-capability-fabric.invoke-result";
  operationId: string;
  correlationId: string;
  result?: JsonValue;
}

export interface AgentCapabilityFabricV010 {
  search(input: {
    access: EffectiveExternalAgentOAuthAccessV010;
    correlationId: string;
    query: string;
    capability?: string;
    effects?: AgentCapabilityFabricSupportedEffectV010[];
    limit?: number;
  }): Promise<AgentCapabilityFabricSearchResultV010>;
  describe(input: {
    access: EffectiveExternalAgentOAuthAccessV010;
    correlationId: string;
    operationId: string;
  }): Promise<AgentCapabilityFabricDescribeResultV010>;
  invoke(input: {
    access: EffectiveExternalAgentOAuthAccessV010;
    correlationId: string;
    operationId: string;
    values?: Record<string, unknown>;
  }): Promise<AgentCapabilityFabricInvokeResultV010>;
}

export interface AgentCapabilityFabricOptionsV010 {
  delegatedAuthority: EffectiveDelegatedAuthorityDependenciesV010;
  actionRouter: AppActionRouter;
}

function supportedEffect(
  effect: CapabilityOperationEffectV010
): effect is AgentCapabilityFabricSupportedEffectV010 {
  return effect === "READ" || effect === "PLAN";
}

function normalizedText(value: string): string {
  return value.normalize("NFKC").trim().toLocaleLowerCase("en-US");
}

function queryTokens(value: string): string[] {
  const normalized = normalizedText(value);
  if (!normalized || normalized.length > 240) {
    throw new Error("AGENT_CAPABILITY_FABRIC_QUERY_INVALID");
  }
  return Array.from(
    new Set(
      normalized
        .split(/[\s,.;:!?/\\()[\]{}"'~@#$%^&*+=<>|_-]+/u)
        .map(item => item.trim())
        .filter(Boolean)
    )
  ).slice(0, 16);
}

function normalizedOptional(value: string | undefined): string | undefined {
  if (value === undefined) return undefined;
  const normalized = normalizedText(value);
  if (!normalized || normalized.length > 160) {
    throw new Error("AGENT_CAPABILITY_FABRIC_FILTER_INVALID");
  }
  return normalized;
}

function boundedLimit(value: number | undefined): number {
  if (value === undefined) return 10;
  if (!Number.isInteger(value) || value < 1 || value > 20) {
    throw new Error("AGENT_CAPABILITY_FABRIC_LIMIT_INVALID");
  }
  return value;
}

function requestedEffects(
  effects: readonly AgentCapabilityFabricSupportedEffectV010[] | undefined
): Set<AgentCapabilityFabricSupportedEffectV010> {
  if (effects === undefined) return new Set(["READ", "PLAN"]);
  if (
    effects.length === 0
    || effects.some(effect => effect !== "READ" && effect !== "PLAN")
  ) {
    throw new Error("AGENT_CAPABILITY_FABRIC_EFFECT_FILTER_INVALID");
  }
  return new Set(effects);
}

function publicSummary(
  operation: EffectiveCapabilityOperationV010
): AgentCapabilityFabricSearchItemV010 {
  if (!supportedEffect(operation.effect)) {
    throw new Error("AGENT_CAPABILITY_FABRIC_EFFECT_UNSUPPORTED");
  }
  return {
    contractVersion: "0.1.0",
    operationId: operation.operationId,
    capability: operation.capability,
    operationVersion: operation.operationVersion,
    title: operation.title,
    description: operation.description,
    effect: operation.effect,
    dataScope: operation.dataScope
  };
}

function scoreOperation(
  operation: EffectiveCapabilityOperationV010,
  tokens: readonly string[]
): number {
  const operationId = normalizedText(operation.operationId);
  const capability = normalizedText(operation.capability);
  const title = normalizedText(operation.title);
  const description = normalizedText(operation.description);
  let score = 0;

  for (const token of tokens) {
    if (operationId === token) score += 120;
    else if (operationId.includes(token)) score += 40;

    if (capability === token) score += 90;
    else if (capability.includes(token)) score += 28;

    if (title === token) score += 60;
    else if (title.includes(token)) score += 18;

    if (description.includes(token)) score += 6;

    if (normalizedText(operation.effect) === token) score += 2;
    if (normalizedText(operation.dataScope) === token) score += 1;
  }

  return score;
}

function tokenBoundOperations(
  operations: readonly EffectiveCapabilityOperationV010[],
  access: EffectiveExternalAgentOAuthAccessV010
): EffectiveCapabilityOperationV010[] {
  const tokenOperationIds = new Set(access.operationIds);
  return operations.filter(operation =>
    tokenOperationIds.has(operation.operationId)
    && supportedEffect(operation.effect)
  );
}

function externalRequestContext(
  base: PlatformRequestContextV010,
  access: EffectiveExternalAgentOAuthAccessV010,
  correlationId: string
): PlatformRequestContextV010 {
  return {
    ...structuredClone(base),
    correlationId,
    delegatedActor: {
      contractVersion: "0.1.0",
      kind: "EXTERNAL_AGENT",
      agentId: access.agentId,
      clientId: access.clientId,
      grantId: access.grantId
    }
  };
}

function jsonObject(
  value: Record<string, unknown> | undefined
): Record<string, JsonValue> {
  if (value === undefined) return {};
  try {
    const cloned = JSON.parse(JSON.stringify(value)) as unknown;
    if (
      cloned === null
      || typeof cloned !== "object"
      || Array.isArray(cloned)
    ) {
      throw new Error("AGENT_CAPABILITY_FABRIC_INPUT_INVALID");
    }
    return cloned as Record<string, JsonValue>;
  } catch {
    throw new Error("AGENT_CAPABILITY_FABRIC_INPUT_INVALID");
  }
}

function requireOperationId(value: string): string {
  const normalized = value.trim();
  if (!normalized || normalized.length > 240) {
    throw new Error("AGENT_CAPABILITY_NOT_AVAILABLE");
  }
  return normalized;
}

export function createAgentCapabilityFabricV010(
  options: AgentCapabilityFabricOptionsV010
): AgentCapabilityFabricV010 {
  return {
    async search({
      access,
      correlationId,
      query,
      capability,
      effects,
      limit
    }) {
      const tokens = queryTokens(query);
      const capabilityFilter = normalizedOptional(capability);
      const effectFilter = requestedEffects(effects);
      const maxItems = boundedLimit(limit);

      const catalog = await listEffectiveDelegatedCapabilityOperationsV010({
        dependencies: options.delegatedAuthority,
        grantId: access.grantId,
        agentId: access.agentId,
        clientId: access.clientId,
        correlationId
      });
      if (!catalog.active) {
        throw new Error("AGENT_CAPABILITY_AUTHORITY_INACTIVE");
      }

      const ranked = tokenBoundOperations(catalog.operations, access)
        .filter(operation =>
          effectFilter.has(
            operation.effect as AgentCapabilityFabricSupportedEffectV010
          )
          && (
            capabilityFilter === undefined
            || normalizedText(operation.capability) === capabilityFilter
          )
        )
        .map(operation => ({
          operation,
          score: scoreOperation(operation, tokens)
        }))
        .filter(item => item.score > 0)
        .sort((a, b) =>
          b.score - a.score
          || a.operation.operationId.localeCompare(b.operation.operationId)
        );

      const items = ranked
        .slice(0, maxItems)
        .map(item => publicSummary(item.operation));

      return {
        contractVersion: "0.1.0",
        kind: "evo.agent-capability-fabric.search-result",
        query: query.trim(),
        matchedCount: ranked.length,
        returnedCount: items.length,
        truncated: ranked.length > items.length,
        items
      };
    },

    async describe({
      access,
      correlationId,
      operationId
    }) {
      const id = requireOperationId(operationId);
      const resolution =
        await resolveEffectiveDelegatedCapabilityOperationV010({
          dependencies: options.delegatedAuthority,
          grantId: access.grantId,
          agentId: access.agentId,
          clientId: access.clientId,
          operationId: id,
          correlationId
        });

      if (
        !resolution.allowed
        || !resolution.operation
        || !supportedEffect(resolution.operation.effect)
        || !access.operationIds.includes(resolution.operation.operationId)
      ) {
        throw new Error("AGENT_CAPABILITY_NOT_AVAILABLE");
      }

      return {
        contractVersion: "0.1.0",
        kind: "evo.agent-capability-fabric.operation-description",
        operation: capabilityOperationPublicMetadataV010(
          resolution.operation
        )
      };
    },

    async invoke({
      access,
      correlationId,
      operationId,
      values
    }) {
      const id = requireOperationId(operationId);
      const resolution =
        await resolveEffectiveDelegatedCapabilityOperationV010({
          dependencies: options.delegatedAuthority,
          grantId: access.grantId,
          agentId: access.agentId,
          clientId: access.clientId,
          operationId: id,
          correlationId
        });

      if (
        !resolution.allowed
        || !resolution.operation
        || !resolution.requestContext
        || !supportedEffect(resolution.operation.effect)
        || !access.operationIds.includes(resolution.operation.operationId)
        || resolution.operation.binding.type !== "ACTION_HOST"
      ) {
        throw new Error("AGENT_CAPABILITY_NOT_AVAILABLE");
      }

      const operation = resolution.operation;
      const request: AppActionRequestV010 = {
        contractVersion: "0.1.0",
        type: "command",
        command: {
          code: operation.binding.commandCode,
          inputVersion: operation.binding.inputVersion
        },
        values: jsonObject(values),
        sourceInteractionId: "agent-capability-fabric:" + correlationId,
        actionId: operation.operationId,
        requiresConfirmation: false
      };

      const context = externalRequestContext(
        resolution.requestContext,
        access,
        correlationId
      );
      const executed = await options.actionRouter.execute(
        request,
        context
      );

      if (!executed.ok) {
        throw new Error("AGENT_CAPABILITY_EXECUTION_FAILED");
      }

      return {
        contractVersion: "0.1.0",
        kind: "evo.agent-capability-fabric.invoke-result",
        operationId: operation.operationId,
        correlationId: executed.correlationId ?? correlationId,
        ...(executed.result === undefined
          ? {}
          : { result: structuredClone(executed.result) })
      };
    }
  };
}
