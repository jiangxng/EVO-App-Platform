import { randomUUID } from "node:crypto";
import type {
  AppActionExecutionResultV010,
  AppActionHandler,
  AppActionRequestV010,
  JsonValue
} from "../actions/contracts.js";
import type { PlatformRequestContextV010 } from "../contracts/platform-services.js";
import {
  ENTERPRISE_AGENT_FEATURE_ID,
  ENTERPRISE_AGENT_PACKAGE_ID
} from "../agents/enterprise-agent/package.js";
import type {
  PersonalAgentFollowUpStoreV010
} from "./personal-agent-follow-up-store.js";

export const PERSONAL_AGENT_FOLLOW_UP_COMPLETE_ACTION =
  "enterprise-agent.follow-up.complete";
export const PERSONAL_AGENT_FOLLOW_UP_DISMISS_ACTION =
  "enterprise-agent.follow-up.dismiss";

function errorResult(error: unknown): AppActionExecutionResultV010 {
  const message = error instanceof Error ? error.message : String(error);
  const [candidate] = message.split(":");
  return {
    ok: false,
    error: {
      code: candidate && /^[A-Z0-9_]+$/.test(candidate)
        ? candidate
        : "PERSONAL_AGENT_FOLLOW_UP_ACTION_FAILED",
      message
    }
  };
}

function stringValue(
  values: Record<string, JsonValue>,
  key: string
): string {
  const value = values[key];
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`PERSONAL_AGENT_FOLLOW_UP_FIELD_INVALID: ${key}`);
  }
  return value.trim();
}

function sameContext(
  a: { kind: string; contextId: string; enterpriseId?: string },
  b: { kind: string; contextId: string; enterpriseId?: string }
): boolean {
  return a.kind === b.kind
    && a.contextId === b.contextId
    && (
      a.kind !== "ENTERPRISE"
      || b.kind !== "ENTERPRISE"
      || a.enterpriseId === b.enterpriseId
    );
}

function handler(
  commandCode: string,
  state: "COMPLETED" | "DISMISSED",
  dependencies: {
    store: PersonalAgentFollowUpStoreV010;
    now: () => Date;
    id: () => string;
  }
): AppActionHandler {
  return {
    packageId: ENTERPRISE_AGENT_PACKAGE_ID,
    featureId: ENTERPRISE_AGENT_FEATURE_ID,
    commandCode,
    async execute(
      request: AppActionRequestV010,
      requestContext?: PlatformRequestContextV010
    ) {
      if (!requestContext) {
        return errorResult(new Error("REQUEST_CONTEXT_REQUIRED"));
      }
      try {
        if (requestContext.principal.actorType !== "HUMAN") {
          throw new Error("PERSONAL_AGENT_FOLLOW_UP_HUMAN_REQUIRED");
        }
        const context = requestContext.context?.activeContext;
        if (!context) {
          throw new Error("PERSONAL_AGENT_FOLLOW_UP_ACTIVE_CONTEXT_REQUIRED");
        }
        const followUpId = typeof request.values.itemId === "string"
          && request.values.itemId.trim()
          ? request.values.itemId.trim()
          : stringValue(request.values, "followUpId");
        const current = dependencies.store.get(followUpId);
        if (!current) {
          throw new Error("PERSONAL_AGENT_FOLLOW_UP_NOT_FOUND");
        }
        if (current.state !== "OPEN") {
          throw new Error("PERSONAL_AGENT_FOLLOW_UP_NOT_OPEN");
        }
        if (
          current.principalSubjectId !== requestContext.principal.subjectId
          || !sameContext(current.context, context)
        ) {
          throw new Error("PERSONAL_AGENT_FOLLOW_UP_SCOPE_MISMATCH");
        }

        dependencies.store.append({
          contractVersion: "0.1.0",
          eventId: `personal-agent-follow-up-state:${dependencies.id()}`,
          followUpId: current.followUpId,
          principalSubjectId: current.principalSubjectId,
          context: structuredClone(current.context),
          state,
          kind: current.kind,
          sourceType: current.sourceType,
          sourceId: current.sourceId,
          title: current.title,
          instruction: current.instruction,
          relatedMemoryIds: [...current.relatedMemoryIds],
          occurredAt: dependencies.now().toISOString(),
          actorSubjectId: requestContext.principal.subjectId
        });

        return {
          ok: true,
          correlationId: requestContext.correlationId,
          result: JSON.parse(JSON.stringify(dependencies.store.get(followUpId)))
        };
      } catch (error) {
        return errorResult(error);
      }
    }
  };
}

export function createPersonalAgentFollowUpActionHandlersV010(
  input: {
    store: PersonalAgentFollowUpStoreV010;
    now?: () => Date;
    id?: () => string;
  }
): AppActionHandler[] {
  const dependencies = {
    store: input.store,
    now: input.now ?? (() => new Date()),
    id: input.id ?? randomUUID
  };
  return [
    handler(PERSONAL_AGENT_FOLLOW_UP_COMPLETE_ACTION, "COMPLETED", dependencies),
    handler(PERSONAL_AGENT_FOLLOW_UP_DISMISS_ACTION, "DISMISSED", dependencies)
  ];
}
