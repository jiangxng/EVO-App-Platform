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
  CounterpartyRepositoryV010,
  CounterpartySubjectTypeV010
} from "./repository.js";
import type {
  CounterpartyRelationshipRoleCodeV010,
  CounterpartyRoleRepositoryV010
} from "./roles.js";
import {
  COUNTERPARTY_ARCHIVE_COMMAND,
  COUNTERPARTY_ASSIGN_ROLE_COMMAND,
  COUNTERPARTY_CREATE_COMMAND,
  COUNTERPARTY_REMOVE_ROLE_COMMAND,
  COUNTERPARTY_UPDATE_COMMAND,
  COUNTERPARTY_DIRECTORY_ROUTE,
  COUNTERPARTY_FEATURE_ID,
  COUNTERPARTY_PACKAGE_ID,
  counterpartyDetailRouteV010
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

function relationshipRoleCode(
  value: unknown
): CounterpartyRelationshipRoleCodeV010 {
  const normalized = required(
    value,
    "COUNTERPARTY_ROLE_CODE_REQUIRED"
  ).toUpperCase();
  if (!["CUSTOMER", "SUPPLIER"].includes(normalized)) {
    throw new Error("COUNTERPARTY_ROLE_CODE_INVALID");
  }
  return normalized as CounterpartyRelationshipRoleCodeV010;
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
    throw new Error("COUNTERPARTY_ENTERPRISE_CONTEXT_REQUIRED");
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
    throw new Error("COUNTERPARTY_MANAGE_ROLE_REQUIRED");
  }
}

function failure(
  error: unknown,
  context?: PlatformRequestContextV010
): AppActionExecutionResultV010 {
  const code = error instanceof Error ? error.message : "COUNTERPARTY_ACTION_FAILED";
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

export function createCounterpartyActionHandlersV010(input: {
  repository: CounterpartyRepositoryV010;
  roleRepository: CounterpartyRoleRepositoryV010;
  canManageEnterpriseContext(
    principal: PlatformPrincipalV010,
    contextId: string
  ): boolean;
  idFactory(): string;
  now?: () => Date;
}): AppActionHandler[] {
  const now = input.now ?? (() => new Date());

  const create: AppActionHandler = {
    packageId: COUNTERPARTY_PACKAGE_ID,
    featureId: COUNTERPARTY_FEATURE_ID,
    commandCode: COUNTERPARTY_CREATE_COMMAND,
    async execute(
      request: AppActionRequestV010,
      context?: PlatformRequestContextV010
    ): Promise<AppActionExecutionResultV010> {
      try {
        if (!context) throw new Error("REQUEST_CONTEXT_REQUIRED");
        const active = activeEnterpriseContext(context);
        ensureManage(
          context.principal,
          active.contextId,
          input.canManageEnterpriseContext
        );

        const subjectType = required(
          request.values.subjectType,
          "COUNTERPARTY_SUBJECT_TYPE_REQUIRED"
        ) as CounterpartySubjectTypeV010;
        if (!["ORGANIZATION", "PERSON"].includes(subjectType)) {
          throw new Error("COUNTERPARTY_SUBJECT_TYPE_INVALID");
        }

        const saved = input.repository.save({
          contextId: active.contextId,
          subject: {
            contractVersion: "0.1.0",
            counterpartyId: input.idFactory(),
            code: required(
              request.values.code,
              "COUNTERPARTY_CODE_REQUIRED"
            ),
            displayName: required(
              request.values.displayName,
              "COUNTERPARTY_DISPLAY_NAME_REQUIRED"
            ),
            subjectType,
            status: "ACTIVE",
            ...(text(request.values.legalName)
              ? { legalName: text(request.values.legalName) }
              : {}),
            ...(text(request.values.taxIdentifier)
              ? { taxIdentifier: text(request.values.taxIdentifier) }
              : {}),
            ...(text(request.values.countryOrRegion)
              ? { countryOrRegion: text(request.values.countryOrRegion) }
              : {}),
            ...(text(request.values.phone)
              ? { phone: text(request.values.phone) }
              : {}),
            ...(text(request.values.email)
              ? { email: text(request.values.email) }
              : {}),
            ...(text(request.values.notes)
              ? { notes: text(request.values.notes) }
              : {})
          },
          actorSubjectId: context.principal.subjectId,
          recordedAt: now().toISOString()
        });

        return {
          ok: true,
          correlationId: context.correlationId,
          result: JSON.parse(JSON.stringify({
            message: "Counterparty created.",
            counterpartyId: saved.counterpartyId,
            navigateTo: counterpartyDetailRouteV010(
              saved.counterpartyId
            )
          })) as JsonValue
        };
      } catch (error) {
        return failure(error, context);
      }
    }
  };

  const update: AppActionHandler = {
    packageId: COUNTERPARTY_PACKAGE_ID,
    featureId: COUNTERPARTY_FEATURE_ID,
    commandCode: COUNTERPARTY_UPDATE_COMMAND,
    async execute(
      request: AppActionRequestV010,
      context?: PlatformRequestContextV010
    ): Promise<AppActionExecutionResultV010> {
      try {
        if (!context) throw new Error("REQUEST_CONTEXT_REQUIRED");
        const active = activeEnterpriseContext(context);
        ensureManage(
          context.principal,
          active.contextId,
          input.canManageEnterpriseContext
        );
        const counterpartyId = required(
          request.values.counterpartyId,
          "COUNTERPARTY_ID_REQUIRED"
        );
        const current = input.repository.get(
          active.contextId,
          counterpartyId
        );
        if (!current) throw new Error("COUNTERPARTY_NOT_FOUND");

        const subjectType = required(
          request.values.subjectType,
          "COUNTERPARTY_SUBJECT_TYPE_REQUIRED"
        ) as CounterpartySubjectTypeV010;
        if (!["ORGANIZATION", "PERSON"].includes(subjectType)) {
          throw new Error("COUNTERPARTY_SUBJECT_TYPE_INVALID");
        }

        const saved = input.repository.save({
          contextId: active.contextId,
          subject: {
            contractVersion: "0.1.0",
            counterpartyId,
            code: required(
              request.values.code,
              "COUNTERPARTY_CODE_REQUIRED"
            ),
            displayName: required(
              request.values.displayName,
              "COUNTERPARTY_DISPLAY_NAME_REQUIRED"
            ),
            subjectType,
            status: current.status,
            ...(text(request.values.legalName)
              ? { legalName: text(request.values.legalName) }
              : {}),
            ...(text(request.values.taxIdentifier)
              ? { taxIdentifier: text(request.values.taxIdentifier) }
              : {}),
            ...(text(request.values.countryOrRegion)
              ? { countryOrRegion: text(request.values.countryOrRegion) }
              : {}),
            ...(text(request.values.phone)
              ? { phone: text(request.values.phone) }
              : {}),
            ...(text(request.values.email)
              ? { email: text(request.values.email) }
              : {}),
            ...(text(request.values.notes)
              ? { notes: text(request.values.notes) }
              : {})
          },
          actorSubjectId: context.principal.subjectId,
          recordedAt: now().toISOString()
        });

        return {
          ok: true,
          correlationId: context.correlationId,
          result: JSON.parse(JSON.stringify({
            message: "Counterparty updated.",
            counterpartyId: saved.counterpartyId,
            navigateTo: counterpartyDetailRouteV010(
              saved.counterpartyId
            )
          })) as JsonValue
        };
      } catch (error) {
        return failure(error, context);
      }
    }
  };

  const archive: AppActionHandler = {
    packageId: COUNTERPARTY_PACKAGE_ID,
    featureId: COUNTERPARTY_FEATURE_ID,
    commandCode: COUNTERPARTY_ARCHIVE_COMMAND,
    async execute(
      request: AppActionRequestV010,
      context?: PlatformRequestContextV010
    ): Promise<AppActionExecutionResultV010> {
      try {
        if (!context) throw new Error("REQUEST_CONTEXT_REQUIRED");
        const active = activeEnterpriseContext(context);
        ensureManage(
          context.principal,
          active.contextId,
          input.canManageEnterpriseContext
        );
        const counterpartyId = required(
          request.values.counterpartyId,
          "COUNTERPARTY_ID_REQUIRED"
        );
        input.repository.archive({
          contextId: active.contextId,
          counterpartyId,
          actorSubjectId: context.principal.subjectId,
          recordedAt: now().toISOString()
        });
        return {
          ok: true,
          correlationId: context.correlationId,
          result: JSON.parse(JSON.stringify({
            message: "Counterparty archived.",
            counterpartyId,
            navigateTo: COUNTERPARTY_DIRECTORY_ROUTE
          })) as JsonValue
        };
      } catch (error) {
        return failure(error, context);
      }
    }
  };

  const assignRole: AppActionHandler = {
    packageId: COUNTERPARTY_PACKAGE_ID,
    featureId: COUNTERPARTY_FEATURE_ID,
    commandCode: COUNTERPARTY_ASSIGN_ROLE_COMMAND,
    async execute(
      request: AppActionRequestV010,
      context?: PlatformRequestContextV010
    ): Promise<AppActionExecutionResultV010> {
      try {
        if (!context) throw new Error("REQUEST_CONTEXT_REQUIRED");
        const active = activeEnterpriseContext(context);
        ensureManage(
          context.principal,
          active.contextId,
          input.canManageEnterpriseContext
        );
        const counterpartyId = required(
          request.values.counterpartyId,
          "COUNTERPARTY_ID_REQUIRED"
        );
        const roleCode = relationshipRoleCode(request.values.roleCode);
        input.roleRepository.assign({
          contextId: active.contextId,
          counterpartyId,
          roleCode,
          actorSubjectId: context.principal.subjectId,
          recordedAt: now().toISOString()
        });
        return {
          ok: true,
          correlationId: context.correlationId,
          result: JSON.parse(JSON.stringify({
            message: "Counterparty relationship role assigned.",
            counterpartyId,
            roleCode,
            navigateTo: counterpartyDetailRouteV010(counterpartyId)
          })) as JsonValue
        };
      } catch (error) {
        return failure(error, context);
      }
    }
  };

  const removeRole: AppActionHandler = {
    packageId: COUNTERPARTY_PACKAGE_ID,
    featureId: COUNTERPARTY_FEATURE_ID,
    commandCode: COUNTERPARTY_REMOVE_ROLE_COMMAND,
    async execute(
      request: AppActionRequestV010,
      context?: PlatformRequestContextV010
    ): Promise<AppActionExecutionResultV010> {
      try {
        if (!context) throw new Error("REQUEST_CONTEXT_REQUIRED");
        const active = activeEnterpriseContext(context);
        ensureManage(
          context.principal,
          active.contextId,
          input.canManageEnterpriseContext
        );
        const counterpartyId = required(
          request.values.counterpartyId,
          "COUNTERPARTY_ID_REQUIRED"
        );
        const roleCode = relationshipRoleCode(request.values.roleCode);
        input.roleRepository.archive({
          contextId: active.contextId,
          counterpartyId,
          roleCode,
          actorSubjectId: context.principal.subjectId,
          recordedAt: now().toISOString()
        });
        return {
          ok: true,
          correlationId: context.correlationId,
          result: JSON.parse(JSON.stringify({
            message: "Counterparty relationship role removed.",
            counterpartyId,
            roleCode,
            navigateTo: counterpartyDetailRouteV010(counterpartyId)
          })) as JsonValue
        };
      } catch (error) {
        return failure(error, context);
      }
    }
  };

  return [create, update, archive, assignRole, removeRole];
}
