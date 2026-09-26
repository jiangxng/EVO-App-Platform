import { randomUUID } from "node:crypto";
import type {
  AppActionExecutionResultV010,
  AppActionHandler,
  AppActionRequestV010,
  JsonValue
} from "../actions/contracts.js";
import type {
  ActiveContextRefV010,
  AuthorizationProviderV010,
  ContextMemoryItemV010,
  ContextMemoryKindV010,
  ContextMemoryReaderV010,
  ContextMemoryWriterV010,
  EnterpriseContextRelationshipProviderV010,
  PlatformPrincipalV010,
  PlatformRequestContextV010
} from "../contracts/platform-services.js";
import {
  HOST_CONTEXT_MEMORY_FEATURE_ID,
  HOST_CONTEXT_MEMORY_PACKAGE_ID
} from "../providers/context-memory/package.js";
import { authorizeMaterialWriteV010 } from "./material-write-authorization.js";
import {
  requireContextMemoryWriteAuthorityV010,
  sameContextRefV010
} from "./context-memory-authority.js";

export const CONTEXT_MEMORY_RECORD_ACTION = "context.memory.record";
export const CONTEXT_MEMORY_PROMOTE_ACTION = "context.memory.promote";

export interface ContextMemoryActionDependenciesV010 {
  resolveAuthorizationProvider(): AuthorizationProviderV010 | undefined;
  resolveReader(): ContextMemoryReaderV010 | undefined;
  resolveWriter(): ContextMemoryWriterV010 | undefined;
  resolveRelationshipProvider(): EnterpriseContextRelationshipProviderV010 | undefined;
  listAvailableContexts(principal: PlatformPrincipalV010): ActiveContextRefV010[];
  now?: () => Date;
  id?: () => string;
}

function errorResult(error: unknown): AppActionExecutionResultV010 {
  const message = error instanceof Error ? error.message : String(error);
  const [candidate] = message.split(":");
  return {
    ok: false,
    error: {
      code: candidate && /^[A-Z0-9_]+$/.test(candidate)
        ? candidate
        : "CONTEXT_MEMORY_ACTION_FAILED",
      message
    }
  };
}

function handler(
  commandCode: string,
  execute: (
    request: AppActionRequestV010,
    context: PlatformRequestContextV010
  ) => Promise<AppActionExecutionResultV010>
): AppActionHandler {
  return {
    packageId: HOST_CONTEXT_MEMORY_PACKAGE_ID,
    featureId: HOST_CONTEXT_MEMORY_FEATURE_ID,
    commandCode,
    async execute(request, context) {
      if (!context) {
        return {
          ok: false,
          error: {
            code: "REQUEST_CONTEXT_REQUIRED",
            message: "Context Memory mutation requires a Host-resolved request context."
          }
        };
      }
      try {
        return await execute(request, context);
      } catch (error) {
        return errorResult(error);
      }
    }
  };
}

function stringValue(
  values: Record<string, JsonValue>,
  key: string,
  required = true
): string | undefined {
  const value = values[key];
  if (value === undefined && !required) return undefined;
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`CONTEXT_MEMORY_FIELD_INVALID: ${key}`);
  }
  return value.trim();
}

function memoryKind(values: Record<string, JsonValue>): ContextMemoryKindV010 {
  const value = stringValue(values, "kind")!;
  if (!["FACT", "CLAIM", "EXPERIENCE", "PRACTICE"].includes(value)) {
    throw new Error("CONTEXT_MEMORY_KIND_INVALID");
  }
  return value as ContextMemoryKindV010;
}

function stringArray(
  values: Record<string, JsonValue>,
  key: string
): string[] {
  const value = values[key];
  if (value === undefined) return [];
  if (!Array.isArray(value)) {
    throw new Error(`CONTEXT_MEMORY_FIELD_INVALID: ${key}`);
  }
  const result = value.map((item, index) => {
    if (typeof item !== "string" || !item.trim()) {
      throw new Error(`CONTEXT_MEMORY_FIELD_INVALID: ${key}[${index}]`);
    }
    return item.trim();
  });
  return [...new Set(result)];
}

function optionalIso(
  values: Record<string, JsonValue>,
  key: string
): string | undefined {
  const value = stringValue(values, key, false);
  if (!value) return undefined;
  const epoch = Date.parse(value);
  if (!Number.isFinite(epoch)) {
    throw new Error(`CONTEXT_MEMORY_FIELD_INVALID: ${key}`);
  }
  return new Date(epoch).toISOString();
}

function requireHuman(
  request: AppActionRequestV010,
  context: PlatformRequestContextV010
): void {
  if (context.principal.actorType !== "HUMAN") {
    throw new Error("CONTEXT_MEMORY_HUMAN_REQUIRED");
  }
  if (request.requiresConfirmation !== true) {
    throw new Error("MATERIAL_WRITE_CONFIRMATION_REQUIRED");
  }
}

function activeContext(context: PlatformRequestContextV010): ActiveContextRefV010 {
  const active = context.context?.activeContext;
  if (!active) throw new Error("CONTEXT_MEMORY_ACTIVE_CONTEXT_REQUIRED");
  return structuredClone(active);
}

function requireAvailableContext(
  dependencies: ContextMemoryActionDependenciesV010,
  requestContext: PlatformRequestContextV010,
  contextId: string
): ActiveContextRefV010 {
  const target = dependencies.listAvailableContexts(requestContext.principal)
    .find(item => item.contextId === contextId);
  if (!target) throw new Error(`CONTEXT_NOT_AVAILABLE: ${contextId}`);
  return structuredClone(target);
}

function reader(
  dependencies: ContextMemoryActionDependenciesV010
): ContextMemoryReaderV010 {
  const provider = dependencies.resolveReader();
  if (!provider) throw new Error("CONTEXT_MEMORY_READER_REQUIRED");
  return provider;
}

function writer(
  dependencies: ContextMemoryActionDependenciesV010
): ContextMemoryWriterV010 {
  const provider = dependencies.resolveWriter();
  if (!provider) throw new Error("CONTEXT_MEMORY_WRITER_REQUIRED");
  return provider;
}

async function exactMemory(
  dependencies: ContextMemoryActionDependenciesV010,
  context: ActiveContextRefV010,
  memoryId: string
): Promise<ContextMemoryItemV010 | undefined> {
  const result = await reader(dependencies).read({
    contractVersion: "0.1.0",
    context,
    memoryIds: [memoryId],
    limit: 2
  });
  return result.items.find(item => item.memoryId === memoryId);
}

async function authorize(
  dependencies: ContextMemoryActionDependenciesV010,
  requestContext: PlatformRequestContextV010,
  action: string,
  resource: {
    type: string;
    id?: string;
    attributes?: Record<string, string | number | boolean | null>;
  }
): Promise<void> {
  const decision = await authorizeMaterialWriteV010(
    dependencies.resolveAuthorizationProvider(),
    requestContext,
    { action, resource }
  );
  if (!decision.allowed) {
    throw new Error(
      `${decision.reasonCodes[0] ?? "MATERIAL_WRITE_DENIED"}: `
      + `denied by '${decision.policyProviderId}' ${decision.reasonCodes.join(", ")}`
    );
  }
}

export function createContextMemoryActionHandlersV010(
  dependencies: ContextMemoryActionDependenciesV010
): AppActionHandler[] {
  const now = dependencies.now ?? (() => new Date());
  const nextId = dependencies.id ?? randomUUID;

  const record = handler(
    CONTEXT_MEMORY_RECORD_ACTION,
    async (request, requestContext) => {
      requireHuman(request, requestContext);
      const context = activeContext(requestContext);
      requireContextMemoryWriteAuthorityV010({
        principal: requestContext.principal,
        personalContext: requestContext.context?.personalContext,
        targetContext: context,
        relationshipProvider: dependencies.resolveRelationshipProvider()
      });

      const kind = memoryKind(request.values);
      const summary = stringValue(request.values, "summary")!;
      const evidenceRefs = stringArray(request.values, "evidenceRefs");
      const observedAt = optionalIso(request.values, "observedAt");
      const supersedesMemoryId = stringValue(
        request.values,
        "supersedesMemoryId",
        false
      );

      if (supersedesMemoryId) {
        const superseded = await exactMemory(
          dependencies,
          context,
          supersedesMemoryId
        );
        if (!superseded) {
          throw new Error(
            `CONTEXT_MEMORY_SUPERSEDES_NOT_FOUND: ${supersedesMemoryId}`
          );
        }
      }

      await authorize(
        dependencies,
        requestContext,
        CONTEXT_MEMORY_RECORD_ACTION,
        {
          type: "context.memory",
          attributes: {
            contextId: context.contextId,
            contextKind: context.kind,
            kind,
            ...(supersedesMemoryId ? { supersedesMemoryId } : {})
          }
        }
      );

      const recordedAt = now().toISOString();
      const item: ContextMemoryItemV010 = {
        contractVersion: "0.1.0",
        memoryId: `memory:${nextId()}`,
        context,
        kind,
        summary,
        provenance: {
          contractVersion: "0.1.0",
          origin: "DIRECT",
          sourceContext: structuredClone(context),
          evidenceRefs
        },
        attribution: {
          contractVersion: "0.1.0",
          recordedBySubjectId: requestContext.principal.subjectId,
          recordedByActorType: requestContext.principal.actorType,
          recordedAt
        },
        ...(observedAt ? { observedAt } : {}),
        ...(supersedesMemoryId ? { supersedesMemoryId } : {}),
        ...(evidenceRefs.length > 0 ? { provenanceRefs: [...evidenceRefs] } : {})
      };

      const written = await writer(dependencies).write({
        contractVersion: "0.1.0",
        item
      });
      return {
        ok: true,
        correlationId: requestContext.correlationId,
        result: JSON.parse(JSON.stringify(written))
      };
    }
  );

  const promote = handler(
    CONTEXT_MEMORY_PROMOTE_ACTION,
    async (request, requestContext) => {
      requireHuman(request, requestContext);
      const sourceContext = activeContext(requestContext);
      requireContextMemoryWriteAuthorityV010({
        principal: requestContext.principal,
        personalContext: requestContext.context?.personalContext,
        targetContext: sourceContext,
        relationshipProvider: dependencies.resolveRelationshipProvider()
      });

      const sourceMemoryId = stringValue(request.values, "sourceMemoryId")!;
      const targetContextId = stringValue(request.values, "targetContextId")!;
      const targetContext = requireAvailableContext(
        dependencies,
        requestContext,
        targetContextId
      );
      if (sameContextRefV010(sourceContext, targetContext)) {
        throw new Error("CONTEXT_MEMORY_PROMOTION_CROSS_CONTEXT_REQUIRED");
      }
      requireContextMemoryWriteAuthorityV010({
        principal: requestContext.principal,
        personalContext: requestContext.context?.personalContext,
        targetContext,
        relationshipProvider: dependencies.resolveRelationshipProvider()
      });

      const source = await exactMemory(
        dependencies,
        sourceContext,
        sourceMemoryId
      );
      if (!source) {
        throw new Error(`CONTEXT_MEMORY_SOURCE_NOT_FOUND: ${sourceMemoryId}`);
      }

      await authorize(
        dependencies,
        requestContext,
        CONTEXT_MEMORY_PROMOTE_ACTION,
        {
          type: "context.memory.promotion",
          id: sourceMemoryId,
          attributes: {
            sourceContextId: sourceContext.contextId,
            sourceContextKind: sourceContext.kind,
            targetContextId: targetContext.contextId,
            targetContextKind: targetContext.kind
          }
        }
      );

      const item: ContextMemoryItemV010 = {
        contractVersion: "0.1.0",
        memoryId: `memory:${nextId()}`,
        context: targetContext,
        kind: source.kind,
        summary: source.summary,
        provenance: {
          contractVersion: "0.1.0",
          origin: "PROMOTED",
          sourceContext: structuredClone(sourceContext),
          sourceMemoryId: source.memoryId,
          evidenceRefs: [...source.provenance.evidenceRefs]
        },
        attribution: {
          contractVersion: "0.1.0",
          recordedBySubjectId: requestContext.principal.subjectId,
          recordedByActorType: requestContext.principal.actorType,
          recordedAt: now().toISOString()
        },
        ...(source.observedAt ? { observedAt: source.observedAt } : {}),
        ...(source.provenance.evidenceRefs.length > 0
          ? { provenanceRefs: [...source.provenance.evidenceRefs] }
          : {})
      };

      const written = await writer(dependencies).write({
        contractVersion: "0.1.0",
        item
      });
      return {
        ok: true,
        correlationId: requestContext.correlationId,
        result: JSON.parse(JSON.stringify(written))
      };
    }
  );

  return [record, promote];
}
