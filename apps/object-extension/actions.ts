import type {
  AppActionExecutionResultV010,
  AppActionHandler,
  AppActionRequestV010,
  JsonValue
} from "../../actions/contracts.js";
import {
  assertObjectExtensionDefinitionV010,
  type ObjectExtensionDefinitionV010
} from "../../contracts/foundation-object/extension.js";
import type {
  PlatformPrincipalV010,
  PlatformRequestContextV010
} from "../../contracts/platform-services.js";
import type {
  ObjectExtensionRepositoryV010
} from "./repository.js";
import {
  OBJECT_EXTENSION_DEFINITION_ARCHIVE_COMMAND_V010,
  OBJECT_EXTENSION_DEFINITION_LIST_COMMAND_V010,
  OBJECT_EXTENSION_DEFINITION_UPSERT_COMMAND_V010,
  OBJECT_EXTENSION_FEATURE_ID,
  OBJECT_EXTENSION_PACKAGE_ID
} from "./constants.js";

function text(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const normalized = value.trim();
  return normalized || undefined;
}

function required(value: unknown, code: string): string {
  const normalized = text(value);
  if (!normalized) throw new Error(code);
  return normalized;
}

function activeEnterpriseContext(
  context: PlatformRequestContextV010 | undefined
): { contextId: string; enterpriseId: string } {
  const active = context?.context?.activeContext;
  if (
    !context
    || !active
    || active.kind !== "ENTERPRISE"
    || !active.contextId?.trim()
    || !active.enterpriseId?.trim()
  ) {
    throw new Error("OBJECT_EXTENSION_ENTERPRISE_CONTEXT_REQUIRED");
  }
  return {
    contextId: active.contextId.trim(),
    enterpriseId: active.enterpriseId.trim()
  };
}

function ensureManage(
  principal: PlatformPrincipalV010,
  contextId: string,
  canManageEnterpriseContext: (
    principal: PlatformPrincipalV010,
    contextId: string
  ) => boolean
): void {
  if (!canManageEnterpriseContext(principal, contextId)) {
    throw new Error("OBJECT_EXTENSION_MANAGE_ROLE_REQUIRED");
  }
}

function definitionFromJson(
  value: JsonValue | undefined
): ObjectExtensionDefinitionV010 {
  if (
    value === null
    || value === undefined
    || Array.isArray(value)
    || typeof value !== "object"
  ) {
    throw new Error("OBJECT_EXTENSION_DEFINITION_REQUIRED");
  }
  return assertObjectExtensionDefinitionV010(
    JSON.parse(JSON.stringify(value)) as ObjectExtensionDefinitionV010
  );
}

function failure(
  error: unknown,
  context?: PlatformRequestContextV010
): AppActionExecutionResultV010 {
  const code = error instanceof Error
    ? error.message
    : "OBJECT_EXTENSION_ACTION_FAILED";
  return {
    ok: false,
    ...(context?.correlationId
      ? { correlationId: context.correlationId }
      : {}),
    error: {
      code,
      message: code
    }
  };
}

export function createObjectExtensionActionHandlersV010(input: {
  repository: ObjectExtensionRepositoryV010;
  canManageEnterpriseContext(
    principal: PlatformPrincipalV010,
    contextId: string
  ): boolean;
  now?: () => Date;
}): AppActionHandler[] {
  const now = input.now ?? (() => new Date());

  const list: AppActionHandler = {
    packageId: OBJECT_EXTENSION_PACKAGE_ID,
    featureId: OBJECT_EXTENSION_FEATURE_ID,
    commandCode: OBJECT_EXTENSION_DEFINITION_LIST_COMMAND_V010,
    async execute(request, context) {
      try {
        if (!context) throw new Error("REQUEST_CONTEXT_REQUIRED");
        const active = activeEnterpriseContext(context);
        ensureManage(
          context.principal,
          active.contextId,
          input.canManageEnterpriseContext
        );
        const targetObjectType = text(request.values.targetObjectType);
        const definitions = input.repository.list(
          active.contextId,
          targetObjectType
        );
        return {
          ok: true,
          correlationId: context.correlationId,
          result: JSON.parse(JSON.stringify({
            contractVersion: "0.1.0",
            definitions
          })) as JsonValue
        };
      } catch (error) {
        return failure(error, context);
      }
    }
  };

  const upsert: AppActionHandler = {
    packageId: OBJECT_EXTENSION_PACKAGE_ID,
    featureId: OBJECT_EXTENSION_FEATURE_ID,
    commandCode: OBJECT_EXTENSION_DEFINITION_UPSERT_COMMAND_V010,
    async execute(request, context) {
      try {
        if (!context) throw new Error("REQUEST_CONTEXT_REQUIRED");
        const active = activeEnterpriseContext(context);
        ensureManage(
          context.principal,
          active.contextId,
          input.canManageEnterpriseContext
        );
        const definition = definitionFromJson(request.values.definition);
        const saved = input.repository.save({
          contextId: active.contextId,
          definition,
          actorSubjectId: context.principal.subjectId,
          recordedAt: now().toISOString()
        });
        return {
          ok: true,
          correlationId: context.correlationId,
          result: JSON.parse(JSON.stringify({
            contractVersion: "0.1.0",
            definition: saved
          })) as JsonValue
        };
      } catch (error) {
        return failure(error, context);
      }
    }
  };

  const archive: AppActionHandler = {
    packageId: OBJECT_EXTENSION_PACKAGE_ID,
    featureId: OBJECT_EXTENSION_FEATURE_ID,
    commandCode: OBJECT_EXTENSION_DEFINITION_ARCHIVE_COMMAND_V010,
    async execute(request, context) {
      try {
        if (!context) throw new Error("REQUEST_CONTEXT_REQUIRED");
        const active = activeEnterpriseContext(context);
        ensureManage(
          context.principal,
          active.contextId,
          input.canManageEnterpriseContext
        );
        const extensionId = required(
          request.values.extensionId,
          "OBJECT_EXTENSION_ID_REQUIRED"
        );
        input.repository.archive({
          contextId: active.contextId,
          extensionId,
          actorSubjectId: context.principal.subjectId,
          recordedAt: now().toISOString()
        });
        return {
          ok: true,
          correlationId: context.correlationId,
          result: {
            contractVersion: "0.1.0",
            extensionId,
            archived: true
          }
        };
      } catch (error) {
        return failure(error, context);
      }
    }
  };

  return [list, upsert, archive];
}
