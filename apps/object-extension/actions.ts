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
  OBJECT_EXTENSION_PACKAGE_ID,
  OBJECT_EXTENSION_IMPORT_CREATE_COMMAND_V010
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
  getImportJob?(contextId: string, jobId: string): {
    targetId: string;
    targetParameters?: Record<string,string | number | boolean | string[] | undefined>;
    source: { headers: string[] };
    mapping: Array<{sourceColumn?: string}>;
  } | undefined;
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


  const createFromImport: AppActionHandler = {
    packageId: OBJECT_EXTENSION_PACKAGE_ID,
    featureId: OBJECT_EXTENSION_FEATURE_ID,
    commandCode: OBJECT_EXTENSION_IMPORT_CREATE_COMMAND_V010,
    async execute(request, context) {
      try {
        if (!context) throw new Error("REQUEST_CONTEXT_REQUIRED");
        const active = activeEnterpriseContext(context);
        ensureManage(context.principal, active.contextId, input.canManageEnterpriseContext);
        const jobId = required(request.values.importJobId,"OBJECT_EXTENSION_IMPORT_JOB_REQUIRED");
        const job = input.getImportJob?.(active.contextId,jobId);
        if (!job || job.targetId !== "counterparty.subject") {
          throw new Error("OBJECT_EXTENSION_IMPORT_TARGET_INVALID");
        }
        const column = required(request.values.sourceColumn,"OBJECT_EXTENSION_SOURCE_REQUIRED");
        if (!job.source.headers.includes(column)
          || job.mapping.some(x=>x.sourceColumn===column)) {
          throw new Error("OBJECT_EXTENSION_SOURCE_NOT_UNMAPPED");
        }
        const label = required(request.values.label,"OBJECT_EXTENSION_LABEL_REQUIRED");
        if (label.length > 80) throw new Error("OBJECT_EXTENSION_LABEL_TOO_LONG");
        const valueType = required(request.values.valueType,"OBJECT_EXTENSION_TYPE_REQUIRED");
        if (!["STRING","NUMBER","BOOLEAN","DATE"].includes(valueType)) {
          throw new Error("OBJECT_EXTENSION_TYPE_INVALID");
        }
        const { createHash } = await import("node:crypto");
        const fieldId = "ext_" + createHash("sha256")
          .update(job.targetId+"|"+column).digest("hex").slice(0,16);
        if (input.repository.list(active.contextId,job.targetId)
          .some(x=>x.fieldId===fieldId)) {
          throw new Error("OBJECT_EXTENSION_ALREADY_EXISTS_REMAP_FIELD");
        }
        const mode=job.targetParameters?.relationshipMode;
        const role=mode==="SUPPLIER"?"SUPPLIER":mode==="CUSTOMER"?"CUSTOMER":undefined;
        const slot=role==="SUPPLIER"?"counterparty.supplier-profile"
          :role==="CUSTOMER"?"counterparty.customer-profile"
          :"counterparty.identity";
        const definition = assertObjectExtensionDefinitionV010({
          contractVersion:"0.1.0",
          extensionId:"import."+fieldId,
          targetObjectType:"counterparty.subject",
          targetSlot:slot,
          namespace:"enterprise.counterparty",
          fieldId,semanticType:"enterprise-custom-"+fieldId,
          valueType:valueType as "STRING"|"NUMBER"|"BOOLEAN"|"DATE",
          label:{default:label},
          required:false,order:1000,
          ...(role?{applicability:{relationshipRoles:[role]}}:{}),
          surfaces:["DETAIL","EDIT","IMPORT"],
          importable:true,exportable:true,
          agentReadable:false,agentWritable:false
        });
        const saved=input.repository.save({
          contextId:active.contextId,definition,
          actorSubjectId:context.principal.subjectId,recordedAt:now().toISOString()
        });
        const { dataImportMappingRouteV010 } =
          await import("../data-import/constants.js");
        return {
          ok:true,correlationId:context.correlationId,
          result:JSON.parse(JSON.stringify({
            contractVersion:"0.1.0",definition:saved,
            navigateTo:dataImportMappingRouteV010(jobId)
          })) as JsonValue
        };
      } catch(error) { return failure(error,context); }
    }
  };

  return [list, upsert, archive, createFromImport];
}
