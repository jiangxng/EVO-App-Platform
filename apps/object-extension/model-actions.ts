import type { AppActionHandler, AppActionExecutionResultV010, JsonValue } from "../../actions/contracts.js";
import type { PlatformPrincipalV010, PlatformRequestContextV010 } from "../../contracts/platform-services.js";
import type { ObjectExtensionDefinitionV010 } from "../../contracts/foundation-object/extension.js";
import type { ObjectExtensionModelPublicationV010 } from "./model-publication.js";

export const OBJECT_MODEL_PROPOSE_COMMAND_V010 = "object-extension.model.propose" as const;
export const OBJECT_MODEL_GET_COMMAND_V010 = "object-extension.model.draft.get" as const;
export const OBJECT_MODEL_DRAFT_COMMAND_V010 = "object-extension.model.draft.save" as const;
export const OBJECT_MODEL_PUBLISH_COMMAND_V010 = "object-extension.model.publish" as const;

function required(v: unknown, error: string): string {
  if (typeof v !== "string" || !v.trim()) throw new Error(error);
  return v.trim();
}
function version(v: unknown): number {
  if (!Number.isSafeInteger(v) || (v as number) < 0) throw new Error("MODEL_VERSION_INVALID");
  return v as number;
}
function activeContext(context: PlatformRequestContextV010 | undefined) {
  const enterprise = context?.context?.activeContext;
  if (!context || enterprise?.kind !== "ENTERPRISE" || !enterprise.contextId
    || !enterprise.enterpriseId || context.scope.enterpriseId !== enterprise.enterpriseId) {
    throw new Error("MODEL_ENTERPRISE_CONTEXT_REQUIRED");
  }
  return enterprise.contextId;
}
function failure(error: unknown, context?: PlatformRequestContextV010): AppActionExecutionResultV010 {
  const code = error instanceof Error ? error.message : "MODEL_ACTION_FAILED";
  return { ok: false, ...(context?.correlationId ? { correlationId: context.correlationId } : {}),
    error: { code, message: code } };
}

/** The existing Object Extension plugin remains the only model publication owner. */
export function createObjectExtensionModelActionHandlersV010(input: {
  resolveModel(contextId: string): Promise<ObjectExtensionModelPublicationV010>;
  canManageEnterpriseContext(principal: PlatformPrincipalV010, contextId: string): boolean;
  now?: () => Date;
}): AppActionHandler[] {
  const now = input.now ?? (() => new Date());
  const handler = (commandCode: string, work: (
    model: ObjectExtensionModelPublicationV010,
    context: PlatformRequestContextV010,
    contextId: string,
    values: Record<string, JsonValue>
  ) => unknown): AppActionHandler => ({
    packageId: "evo-object-extension",
    featureId: "evo-object-extension.default",
    commandCode,
    async execute(request, context) {
      try {
        const contextId = activeContext(context);
        if (context!.principal.actorType !== "HUMAN") throw new Error("MODEL_HUMAN_REVIEW_REQUIRED");
        const mayManage = () => input.canManageEnterpriseContext(context!.principal, contextId);
        if (!mayManage()) throw new Error("MODEL_PERMISSION_DENIED");
        const model = await input.resolveModel(contextId);
        if (!mayManage()) throw new Error("MODEL_PERMISSION_DENIED");
        const result = work(model, context!, contextId, request.values);
        return { ok: true, correlationId: context!.correlationId,
          result: JSON.parse(JSON.stringify({ contractVersion: "0.1.0", data: result })) as JsonValue };
      } catch (error) { return failure(error, context); }
    }
  });
  return [
    handler(OBJECT_MODEL_PROPOSE_COMMAND_V010, (model, _ctx, contextId, values) =>
      model.propose(contextId, required(values.importJobId, "MODEL_IMPORT_JOB_REQUIRED"))),
    handler(OBJECT_MODEL_GET_COMMAND_V010, (model, _ctx, contextId, values) =>
      model.get(contextId, required(values.modelDraftId, "MODEL_DRAFT_ID_REQUIRED")) ?? null),
    handler(OBJECT_MODEL_DRAFT_COMMAND_V010, (model, ctx, contextId, values) => {
      if (!values.definition || typeof values.definition !== "object"
        || Array.isArray(values.definition)) throw new Error("MODEL_DEFINITION_REQUIRED");
      return model.saveDraft({
        contextId,
        importJobId: required(values.importJobId, "MODEL_IMPORT_JOB_REQUIRED"),
        sourceColumn: required(values.sourceColumn, "MODEL_SOURCE_COLUMN_REQUIRED"),
        sourceRevision: required(values.sourceRevision, "MODEL_SOURCE_REVISION_REQUIRED"),
        definition: values.definition as unknown as ObjectExtensionDefinitionV010,
        expectedVersion: version(values.expectedVersion),
        actorSubjectId: ctx.principal.subjectId,
        recordedAt: now().toISOString()
      });
    }),
    handler(OBJECT_MODEL_PUBLISH_COMMAND_V010, (model, ctx, contextId, values) =>
      model.publish({
        contextId,
        modelDraftId: required(values.modelDraftId, "MODEL_DRAFT_ID_REQUIRED"),
        expectedVersion: version(values.expectedVersion),
        actorSubjectId: ctx.principal.subjectId, actorType: "HUMAN",
        recordedAt: now().toISOString()
      }))
  ];
}
