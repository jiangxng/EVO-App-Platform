import { executeObjectExtensionBatchImportV010 } from "./batch-action.js";
import type { BexImportTargetField } from "./batch-page.js";
import type { DataImportJobV010, DataImportMappingV010 } from "../data-import/types.js";
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

export interface ObjectExtensionImportServicesV010 {
  /** Recheck lifecycle after asynchronous loading and before mutation. */
  assertAvailable?(): void;
  applyImportMapping?(input: {
    contextId: string; importJobId: string; mapping: DataImportMappingV010[];
    ignoredSourceColumns?: string[];
    actorSubjectId: string; recordedAt: string;
  }): void;
  getImportableTargets?(contextId: string, job: DataImportJobV010): BexImportTargetField[];
}

export function createObjectExtensionActionHandlersV010(input: ({ repository: ObjectExtensionRepositoryV010 } | {
  resolveRepository(): Promise<ObjectExtensionRepositoryV010>;
}) & {
  canManageEnterpriseContext(
    principal: PlatformPrincipalV010,
    contextId: string
  ): boolean;
  now?: () => Date;
  getImportJob?(contextId: string, jobId: string): DataImportJobV010 | undefined;
  /** Resolve per authorized import request; never during ordinary definition CRUD. */
  resolveImportServices?(job: DataImportJobV010): Promise<ObjectExtensionImportServicesV010>;
  applyImportMapping?(input: {
    contextId: string; importJobId: string; mapping: DataImportMappingV010[];
    ignoredSourceColumns?: string[];
    actorSubjectId: string; recordedAt: string;
  }): void;
  getImportableTargets?(contextId: string, job: DataImportJobV010): BexImportTargetField[];
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
        const repository = "resolveRepository" in input ? await input.resolveRepository() : input.repository;
        ensureManage(context.principal, active.contextId, input.canManageEnterpriseContext);
        const targetObjectType = text(request.values.targetObjectType);
        const definitions = repository.list(
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
        const repository = "resolveRepository" in input ? await input.resolveRepository() : input.repository;
        ensureManage(context.principal, active.contextId, input.canManageEnterpriseContext);
        const saved = repository.save({
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
        const repository = "resolveRepository" in input ? await input.resolveRepository() : input.repository;
        ensureManage(context.principal, active.contextId, input.canManageEnterpriseContext);
        repository.archive({
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
        let job = input.getImportJob?.(active.contextId,jobId);
        if (!job || job.targetId !== "counterparty.subject") {
          throw new Error("OBJECT_EXTENSION_IMPORT_TARGET_INVALID");
        }
        const repository = "resolveRepository" in input ? await input.resolveRepository() : input.repository;
        ensureManage(context.principal, active.contextId, input.canManageEnterpriseContext);
        const importServices: ObjectExtensionImportServicesV010 = input.resolveImportServices
          ? await input.resolveImportServices(job)
          : input;
        ensureManage(context.principal, active.contextId, input.canManageEnterpriseContext);
        importServices.assertAvailable?.();
        // Loading yields: never apply a stale job snapshot after another request changed it.
        job = input.getImportJob?.(active.contextId,jobId);
        if (!job || job.targetId !== "counterparty.subject") {
          throw new Error("OBJECT_EXTENSION_IMPORT_TARGET_INVALID");
        }
        if (request.values.batchMode === "BATCH") {
          if (!importServices.applyImportMapping) {
            throw new Error("OBJECT_EXTENSION_BATCH_MAPPING_SERVICE_REQUIRED");
          }
          const result = executeObjectExtensionBatchImportV010({
            repository, job,
            contextId: active.contextId,
            actorSubjectId: context.principal.subjectId,
            recordedAt: now().toISOString(),
            values: request.values,
            importableTargets: importServices.getImportableTargets?.(active.contextId,job),
            getCurrentJob: () => input.getImportJob?.(active.contextId,jobId),
            applyMapping: importServices.applyImportMapping
          });
          return {
            ok: true, correlationId: context.correlationId, result
          };
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
        if (!importServices.applyImportMapping || !input.getImportJob) {
          // A field cannot be advertised as created-and-mapped if the
          // authoritative import owner is unavailable.
          throw new Error("OBJECT_EXTENSION_IMPORT_MAPPING_SERVICE_REQUIRED");
        }
        if (job.state === "COMMITTED" || job.state === "COMMITTED_WITH_ERRORS") {
          throw new Error("DATA_IMPORT_JOB_ALREADY_COMMITTED");
        }
        const { createHash } = await import("node:crypto");
        ensureManage(context.principal, active.contextId, input.canManageEnterpriseContext);
        importServices.assertAvailable?.();
        const fieldId = "ext_" + createHash("sha256")
          .update(job.targetId + "|" + column).digest("hex").slice(0,16);
        const mode = job.targetParameters?.relationshipMode;
        const role = mode === "SUPPLIER" ? "SUPPLIER"
          : mode === "CUSTOMER" ? "CUSTOMER" : undefined;
        const slot = role === "SUPPLIER" ? "counterparty.supplier-profile"
          : role === "CUSTOMER" ? "counterparty.customer-profile"
          : "counterparty.identity";
        const normalize = (value: string) => value.normalize("NFKC")
          .replace(/\\s+/gu, "").toLocaleLowerCase();
        const definitions = repository.list(active.contextId, job.targetId);
        const prior = definitions.find(item => item.fieldId === fieldId);
        const sameName = definitions.filter(item =>
          item.fieldId !== fieldId && item.targetSlot === slot
          && normalize(item.label.default) === normalize(label)
        );
        if (sameName.length) {
          // Preserve previously created duplicates and their values; do not
          // add a third one or silently choose by the visible label.
          throw new Error("OBJECT_EXTENSION_LABEL_ALREADY_EXISTS_CHOOSE_FIELD");
        }
        if (prior && (prior.targetSlot !== slot
          || normalize(prior.label.default) !== normalize(label)
          || prior.valueType !== valueType || !prior.importable
          || !prior.surfaces.includes("IMPORT"))) {
          throw new Error("OBJECT_EXTENSION_ALREADY_EXISTS_DIFFERENT_CONTRACT");
        }
        const recordedAt = now().toISOString();
        let saved = prior;
        if (!saved) {
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
          saved = repository.save({
            contextId:active.contextId,definition,
            actorSubjectId:context.principal.subjectId,recordedAt
          });
        }
        // Re-read the authoritative job after the definition write. A retry
        // must reuse the deterministic field rather than duplicating it.
        const latest = input.getImportJob(active.contextId,jobId);
        if (!latest || latest.targetId !== job.targetId
          || latest.source.headers.length !== job.source.headers.length
          || latest.source.headers.some((item,index) =>
            item !== job.source.headers[index])) {
          throw new Error("OBJECT_EXTENSION_IMPORT_JOB_CHANGED");
        }
        if (latest.state === "COMMITTED"
          || latest.state === "COMMITTED_WITH_ERRORS") {
          throw new Error("DATA_IMPORT_JOB_ALREADY_COMMITTED");
        }
        if (latest.mapping.some(item => item.sourceColumn === column
          || item.targetFieldId === fieldId)) {
          throw new Error("OBJECT_EXTENSION_SOURCE_OR_TARGET_ALREADY_MAPPED");
        }
        importServices.applyImportMapping({
          contextId:active.contextId,importJobId:jobId,
          mapping:[...latest.mapping,{sourceColumn:column,targetFieldId:fieldId}],
          ignoredSourceColumns:(latest.ignoredSourceColumns??[])
            .filter(item=>item!==column),
          actorSubjectId:context.principal.subjectId,recordedAt
        });
        const { dataImportMappingRouteV010 } =
          await import("../data-import/constants.js");
        return {
          ok:true,correlationId:context.correlationId,
          result:JSON.parse(JSON.stringify({
            contractVersion:"0.1.0",definition:saved,
            mappedSourceColumn:column,mappedTargetFieldId:fieldId,
            message:"Field saved and mapped. Review the saved mapping before validating.",
            navigateTo:dataImportMappingRouteV010(jobId)
          })) as JsonValue
        };
      } catch(error) { return failure(error,context); }
    }
  };

  return [list, upsert, archive, createFromImport];
}
