import type {
  AppActionExecutionResultV010,
  AppActionHandler,
  AppActionRequestV010,
  JsonValue
} from "../../actions/contracts.js";
import type {
  PlatformPrincipalV010,
  PlatformRequestContextV010
} from "../../contracts/platform-services.js";
import type {
  ItemKindV010
} from "./foundation-object.js";
import type {
  ItemRepositoryV010
} from "./repository.js";
import {
  ITEM_ARCHIVE_COMMAND,
  ITEM_CREATE_COMMAND,
  ITEM_DIRECTORY_ROUTE,
  ITEM_FEATURE_ID,
  ITEM_PACKAGE_ID,
  ITEM_UPDATE_COMMAND,
  itemDetailRouteV010
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
): { contextId: string } {
  const active = context?.context?.activeContext;
  if (!context || !active || active.kind !== "ENTERPRISE") {
    throw new Error("ITEM_ENTERPRISE_CONTEXT_REQUIRED");
  }
  return { contextId: active.contextId };
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
    throw new Error("ITEM_MANAGE_ROLE_REQUIRED");
  }
}

function itemKind(value: unknown): ItemKindV010 {
  const normalized = required(value, "ITEM_KIND_REQUIRED").toUpperCase();
  if (normalized !== "GOODS" && normalized !== "SERVICE") {
    throw new Error("ITEM_KIND_INVALID");
  }
  return normalized as ItemKindV010;
}

function failure(
  error: unknown,
  context?: PlatformRequestContextV010
): AppActionExecutionResultV010 {
  const code = error instanceof Error ? error.message : "ITEM_ACTION_FAILED";
  return {
    ok: false,
    ...(context?.correlationId
      ? { correlationId: context.correlationId }
      : {}),
    error: { code, message: code }
  };
}

export function createItemActionHandlersV010(input: {
  repository: ItemRepositoryV010;
  canManageEnterpriseContext(
    principal: PlatformPrincipalV010,
    contextId: string
  ): boolean;
  idFactory(): string;
  now?: () => Date;
}): AppActionHandler[] {
  const now = input.now ?? (() => new Date());

  const create: AppActionHandler = {
    packageId: ITEM_PACKAGE_ID,
    featureId: ITEM_FEATURE_ID,
    commandCode: ITEM_CREATE_COMMAND,
    async execute(request, context) {
      try {
        if (!context) throw new Error("REQUEST_CONTEXT_REQUIRED");
        const active = activeEnterpriseContext(context);
        ensureManage(
          context.principal,
          active.contextId,
          input.canManageEnterpriseContext
        );
        const saved = input.repository.save({
          contextId: active.contextId,
          item: {
            contractVersion: "0.1.0",
            itemId: input.idFactory(),
            code: required(request.values.code, "ITEM_CODE_REQUIRED"),
            displayName: required(
              request.values.displayName,
              "ITEM_DISPLAY_NAME_REQUIRED"
            ),
            itemKind: itemKind(request.values.itemKind),
            baseUomCode: required(
              request.values.baseUomCode,
              "ITEM_BASE_UOM_REQUIRED"
            ),
            ...(text(request.values.description)
              ? { description: text(request.values.description) }
              : {})
          },
          actorSubjectId: context.principal.subjectId,
          recordedAt: now().toISOString()
        });
        return {
          ok: true,
          correlationId: context.correlationId,
          result: JSON.parse(JSON.stringify({
            message: "Item created.",
            itemId: saved.itemId,
            navigateTo: itemDetailRouteV010(saved.itemId)
          })) as JsonValue
        };
      } catch (error) {
        return failure(error, context);
      }
    }
  };

  const update: AppActionHandler = {
    packageId: ITEM_PACKAGE_ID,
    featureId: ITEM_FEATURE_ID,
    commandCode: ITEM_UPDATE_COMMAND,
    async execute(request, context) {
      try {
        if (!context) throw new Error("REQUEST_CONTEXT_REQUIRED");
        const active = activeEnterpriseContext(context);
        ensureManage(
          context.principal,
          active.contextId,
          input.canManageEnterpriseContext
        );
        const itemId = required(request.values.itemId, "ITEM_ID_REQUIRED");
        const current = input.repository.get(active.contextId, itemId);
        if (!current) throw new Error("ITEM_NOT_FOUND");
        const saved = input.repository.save({
          contextId: active.contextId,
          item: {
            contractVersion: "0.1.0",
            itemId,
            code: required(request.values.code, "ITEM_CODE_REQUIRED"),
            displayName: required(
              request.values.displayName,
              "ITEM_DISPLAY_NAME_REQUIRED"
            ),
            itemKind: itemKind(request.values.itemKind),
            baseUomCode: required(
              request.values.baseUomCode,
              "ITEM_BASE_UOM_REQUIRED"
            ),
            ...(text(request.values.description)
              ? { description: text(request.values.description) }
              : {})
          },
          actorSubjectId: context.principal.subjectId,
          recordedAt: now().toISOString()
        });
        return {
          ok: true,
          correlationId: context.correlationId,
          result: JSON.parse(JSON.stringify({
            message: "Item updated.",
            itemId: saved.itemId,
            navigateTo: itemDetailRouteV010(saved.itemId)
          })) as JsonValue
        };
      } catch (error) {
        return failure(error, context);
      }
    }
  };

  const archive: AppActionHandler = {
    packageId: ITEM_PACKAGE_ID,
    featureId: ITEM_FEATURE_ID,
    commandCode: ITEM_ARCHIVE_COMMAND,
    async execute(request, context) {
      try {
        if (!context) throw new Error("REQUEST_CONTEXT_REQUIRED");
        const active = activeEnterpriseContext(context);
        ensureManage(
          context.principal,
          active.contextId,
          input.canManageEnterpriseContext
        );
        const itemId = required(request.values.itemId, "ITEM_ID_REQUIRED");
        input.repository.archive({
          contextId: active.contextId,
          itemId,
          actorSubjectId: context.principal.subjectId,
          recordedAt: now().toISOString()
        });
        return {
          ok: true,
          correlationId: context.correlationId,
          result: JSON.parse(JSON.stringify({
            message: "Item archived.",
            itemId,
            navigateTo: ITEM_DIRECTORY_ROUTE
          })) as JsonValue
        };
      } catch (error) {
        return failure(error, context);
      }
    }
  };

  return [create, update, archive];
}
