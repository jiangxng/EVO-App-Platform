import type {
  AppActionExecutionResultV010,
  AppActionHandler,
  AppActionRequestV010,
  JsonValue
} from "../actions/contracts.js";
import type {
  ExternalAgentClientKindV010,
  ExternalAgentProtocolV010
} from "../contracts/external-agent-access.js";
import type { PlatformRequestContextV010 } from "../contracts/platform-services.js";
import {
  EXTERNAL_AGENT_CLIENT_REGISTER_ACTION,
  EXTERNAL_AGENT_CLIENT_REVOKE_ACTION,
  EXTERNAL_AGENT_GOVERNANCE_READ_ACTION,
  EXTERNAL_AGENT_GRANT_CREATE_ACTION,
  EXTERNAL_AGENT_GRANT_REVOKE_ACTION,
  EXTERNAL_AGENT_REGISTER_ACTION,
  EXTERNAL_AGENT_REVOKE_ACTION,
  type ExternalAgentGovernanceServiceV010
} from "./external-agent-governance-service.js";
import {
  EXTERNAL_AGENT_GOVERNANCE_FEATURE_ID,
  EXTERNAL_AGENT_GOVERNANCE_PACKAGE_ID
} from "./external-agent-governance-package.js";

export interface ExternalAgentGovernanceActionDependenciesV010 {
  service: ExternalAgentGovernanceServiceV010;
}

function errorResult(error: unknown): AppActionExecutionResultV010 {
  const message = error instanceof Error ? error.message : String(error);
  const [candidate] = message.split(":");
  return {
    ok: false,
    error: {
      code: candidate && /^[A-Z0-9_]+$/.test(candidate)
        ? candidate
        : "EXTERNAL_AGENT_GOVERNANCE_ACTION_FAILED",
      message
    }
  };
}

function requireContext(
  requestContext: PlatformRequestContextV010 | undefined
): PlatformRequestContextV010 {
  if (!requestContext) throw new Error("REQUEST_CONTEXT_REQUIRED");
  return requestContext;
}

function requireConfirmation(request: AppActionRequestV010): void {
  if (request.requiresConfirmation !== true) {
    throw new Error("MATERIAL_WRITE_CONFIRMATION_REQUIRED");
  }
}

function stringValue(
  values: Record<string, JsonValue>,
  key: string,
  required = true
): string | undefined {
  const value = values[key];
  if (value === undefined && !required) return undefined;
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`EXTERNAL_AGENT_GOVERNANCE_FIELD_INVALID: ${key}`);
  }
  return value.trim();
}

function stringArrayValue(
  values: Record<string, JsonValue>,
  key: string
): string[] {
  const value = values[key];
  if (!Array.isArray(value) || value.length === 0) {
    throw new Error(`EXTERNAL_AGENT_GOVERNANCE_FIELD_INVALID: ${key}`);
  }
  const normalized = value.map(item =>
    typeof item === "string" ? item.trim() : ""
  );
  if (normalized.some(item => !item)) {
    throw new Error(`EXTERNAL_AGENT_GOVERNANCE_FIELD_INVALID: ${key}`);
  }
  return normalized;
}

function clientKind(
  values: Record<string, JsonValue>
): ExternalAgentClientKindV010 {
  const value = stringValue(values, "kind")!;
  if (!["PUBLIC", "CONFIDENTIAL", "WORKLOAD"].includes(value)) {
    throw new Error("EXTERNAL_AGENT_CLIENT_KIND_INVALID");
  }
  return value as ExternalAgentClientKindV010;
}

function protocols(
  values: Record<string, JsonValue>
): ExternalAgentProtocolV010[] {
  const valuesList = stringArrayValue(values, "protocols");
  if (valuesList.some(item => !["MCP", "OPENAPI", "A2A"].includes(item))) {
    throw new Error("EXTERNAL_AGENT_CLIENT_PROTOCOL_INVALID");
  }
  return valuesList as ExternalAgentProtocolV010[];
}

function handler(
  commandCode: string,
  execute: (
    request: AppActionRequestV010,
    context: PlatformRequestContextV010
  ) => Promise<AppActionExecutionResultV010>
): AppActionHandler {
  return {
    packageId: EXTERNAL_AGENT_GOVERNANCE_PACKAGE_ID,
    featureId: EXTERNAL_AGENT_GOVERNANCE_FEATURE_ID,
    commandCode,
    async execute(request, context) {
      try {
        return await execute(request, requireContext(context));
      } catch (error) {
        return errorResult(error);
      }
    }
  };
}

function result(
  context: PlatformRequestContextV010,
  value: unknown
): AppActionExecutionResultV010 {
  return {
    ok: true,
    correlationId: context.correlationId,
    result: JSON.parse(JSON.stringify(value)) as JsonValue
  };
}

export function createExternalAgentGovernanceActionHandlersV010(
  dependencies: ExternalAgentGovernanceActionDependenciesV010
): AppActionHandler[] {
  return [
    handler(EXTERNAL_AGENT_REGISTER_ACTION, async (request, context) => {
      requireConfirmation(request);
      const agent = await dependencies.service.registerAgent(context, {
        displayName: stringValue(request.values, "displayName")!,
        ...(stringValue(request.values, "publisherId", false)
          ? { publisherId: stringValue(request.values, "publisherId", false) }
          : {})
      });
      return result(context, { agent });
    }),

    handler(EXTERNAL_AGENT_REVOKE_ACTION, async (request, context) => {
      requireConfirmation(request);
      const agent = await dependencies.service.revokeAgent(
        context,
        stringValue(request.values, "agentId")!
      );
      return result(context, { agent });
    }),

    handler(EXTERNAL_AGENT_CLIENT_REGISTER_ACTION, async (request, context) => {
      requireConfirmation(request);
      const client = await dependencies.service.registerClient(context, {
        agentId: stringValue(request.values, "agentId")!,
        displayName: stringValue(request.values, "displayName")!,
        kind: clientKind(request.values),
        protocols: protocols(request.values),
        ...(stringValue(request.values, "oauthClientId", false)
          ? { oauthClientId: stringValue(request.values, "oauthClientId", false) }
          : {})
      });
      return result(context, { client });
    }),

    handler(EXTERNAL_AGENT_CLIENT_REVOKE_ACTION, async (request, context) => {
      requireConfirmation(request);
      const client = await dependencies.service.revokeClient(
        context,
        stringValue(request.values, "clientId")!
      );
      return result(context, { client });
    }),

    handler(EXTERNAL_AGENT_GRANT_CREATE_ACTION, async (request, context) => {
      requireConfirmation(request);
      const grant = await dependencies.service.createGrant(context, {
        agentId: stringValue(request.values, "agentId")!,
        clientId: stringValue(request.values, "clientId")!,
        allowedOperationIds: stringArrayValue(
          request.values,
          "allowedOperationIds"
        ),
        validUntil: stringValue(request.values, "validUntil")!,
        ...(stringValue(request.values, "description", false)
          ? { description: stringValue(request.values, "description", false) }
          : {})
      });
      return result(context, { grant });
    }),

    handler(EXTERNAL_AGENT_GRANT_REVOKE_ACTION, async (request, context) => {
      requireConfirmation(request);
      const grant = await dependencies.service.revokeGrant(
        context,
        stringValue(request.values, "grantId")!
      );
      return result(context, { grant });
    }),

    handler(EXTERNAL_AGENT_GOVERNANCE_READ_ACTION, async (_request, context) => {
      const governance = await dependencies.service.listForPrincipal(context);
      return result(context, governance);
    })
  ];
}
