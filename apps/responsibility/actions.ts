import type {
  AppActionExecutionResultV010,
  AppActionHandler,
  JsonValue
} from "../../actions/contracts.js";
import type {
  PlatformPrincipalV010,
  PlatformRequestContextV010
} from "../../contracts/platform-services.js";
import {
  RESPONSIBILITY_ARCHIVE_COMMAND_V010,
  RESPONSIBILITY_ASSIGN_COMMAND_V010,
  RESPONSIBILITY_FEATURE_ID,
  RESPONSIBILITY_PACKAGE_ID
} from "./constants.js";
import type {
  ResponsibilityRepositoryV010
} from "./repository.js";

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
    throw new Error("RESPONSIBILITY_ENTERPRISE_CONTEXT_REQUIRED");
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
    throw new Error("RESPONSIBILITY_MANAGE_ROLE_REQUIRED");
  }
}

function failure(
  error: unknown,
  context?: PlatformRequestContextV010
): AppActionExecutionResultV010 {
  const code = error instanceof Error
    ? error.message
    : "RESPONSIBILITY_ACTION_FAILED";
  return {
    ok: false,
    ...(context?.correlationId
      ? { correlationId: context.correlationId }
      : {}),
    error: { code, message: code }
  };
}

export function createResponsibilityActionHandlersV010(input: {
  repository: ResponsibilityRepositoryV010;
  canManageEnterpriseContext(
    principal: PlatformPrincipalV010,
    contextId: string
  ): boolean;
  now?: () => Date;
}): AppActionHandler[] {
  const now = input.now ?? (() => new Date());

  const assign: AppActionHandler = {
    packageId: RESPONSIBILITY_PACKAGE_ID,
    featureId: RESPONSIBILITY_FEATURE_ID,
    commandCode: RESPONSIBILITY_ASSIGN_COMMAND_V010,
    async execute(request, context) {
      try {
        if (!context) throw new Error("REQUEST_CONTEXT_REQUIRED");
        const active = activeEnterpriseContext(context);
        ensureManage(
          context.principal,
          active.contextId,
          input.canManageEnterpriseContext
        );
        const saved = input.repository.assign({
          contextId: active.contextId,
          targetRef: {
            objectType: required(
              request.values.targetObjectType,
              "RESPONSIBILITY_TARGET_OBJECT_TYPE_REQUIRED"
            ),
            objectId: required(
              request.values.targetObjectId,
              "RESPONSIBILITY_TARGET_OBJECT_ID_REQUIRED"
            )
          },
          responsibilityType: required(
            request.values.responsibilityType,
            "RESPONSIBILITY_TYPE_REQUIRED"
          ),
          assigneeRef: {
            kind: "PRINCIPAL",
            id: text(request.values.assigneeSubjectId)
              ?? context.principal.subjectId
          },
          effectiveFrom: now().toISOString(),
          actorSubjectId: context.principal.subjectId
        });
        return {
          ok: true,
          correlationId: context.correlationId,
          result: JSON.parse(JSON.stringify({
            contractVersion: "0.1.0",
            assignment: saved
          })) as JsonValue
        };
      } catch (error) {
        return failure(error, context);
      }
    }
  };

  const archive: AppActionHandler = {
    packageId: RESPONSIBILITY_PACKAGE_ID,
    featureId: RESPONSIBILITY_FEATURE_ID,
    commandCode: RESPONSIBILITY_ARCHIVE_COMMAND_V010,
    async execute(request, context) {
      try {
        if (!context) throw new Error("REQUEST_CONTEXT_REQUIRED");
        const active = activeEnterpriseContext(context);
        ensureManage(
          context.principal,
          active.contextId,
          input.canManageEnterpriseContext
        );
        const assignmentId = required(
          request.values.assignmentId,
          "RESPONSIBILITY_ASSIGNMENT_ID_REQUIRED"
        );
        input.repository.archive({
          contextId: active.contextId,
          assignmentId,
          actorSubjectId: context.principal.subjectId,
          recordedAt: now().toISOString()
        });
        return {
          ok: true,
          correlationId: context.correlationId,
          result: {
            contractVersion: "0.1.0",
            assignmentId,
            archived: true
          }
        };
      } catch (error) {
        return failure(error, context);
      }
    }
  };

  return [assign, archive];
}
