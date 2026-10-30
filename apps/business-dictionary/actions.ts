import type {
  AppActionHandler, AppActionExecutionResultV010, JsonValue
} from "../../actions/contracts.js";
import type {
  PlatformPrincipalV010, PlatformRequestContextV010
} from "../../contracts/platform-services.js";
import type { BusinessDictionaryOptionV010 } from "../../contracts/reference-data/dictionary.js";
import type { BusinessDictionaryRepositoryV010 } from "./repository.js";
import {
  BUSINESS_DICTIONARY_DRAFT_COMMAND_V010 as DRAFT,
  BUSINESS_DICTIONARY_LIST_COMMAND_V010 as LIST,
  BUSINESS_DICTIONARY_PUBLISH_COMMAND_V010 as PUBLISH,
  BUSINESS_DICTIONARY_RESOLVE_COMMAND_V010 as RESOLVE,
  BUSINESS_DICTIONARY_FEATURE_ID as FEATURE,
  BUSINESS_DICTIONARY_PACKAGE_ID as PACKAGE
} from "./constants.js";

function required(value: unknown, error: string): string {
  if (typeof value !== "string" || !value.trim()) throw new Error(error);
  return value.trim();
}
function integer(value: unknown, error: string): number {
  if (!Number.isSafeInteger(value) || (value as number) < 0) throw new Error(error);
  return value as number;
}
function activeContext(context: PlatformRequestContextV010 | undefined) {
  if (!context || context.context?.activeContext?.kind !== "ENTERPRISE"
      || !context.context.activeContext.contextId
      || !context.context.activeContext.enterpriseId
      || context.scope.enterpriseId !== context.context.activeContext.enterpriseId) {
    throw new Error("BUSINESS_DICTIONARY_ENTERPRISE_CONTEXT_REQUIRED");
  }
  return context.context.activeContext.contextId;
}
function failure(error: unknown, context?: PlatformRequestContextV010):
  AppActionExecutionResultV010 {
  const code = error instanceof Error ? error.message : "BUSINESS_DICTIONARY_ACTION_FAILED";
  return { ok: false, ...(context?.correlationId ? { correlationId: context.correlationId } : {}),
    error: { code, message: code } };
}

export function createBusinessDictionaryActionHandlersV010(input: ({
  repository: BusinessDictionaryRepositoryV010;
} | {
  resolveRepository(): Promise<BusinessDictionaryRepositoryV010>;
}) & {
  canRead(principal: PlatformPrincipalV010, contextId: string): boolean;
  canManage(principal: PlatformPrincipalV010, contextId: string): boolean;
  now?: () => Date;
}): AppActionHandler[] {
  const now = input.now ?? (() => new Date());
  const handler = (commandCode: string, writing: boolean,
    action: (repo: BusinessDictionaryRepositoryV010, context: PlatformRequestContextV010,
      contextId: string, values: Record<string, JsonValue>) => unknown): AppActionHandler => ({
    packageId: PACKAGE, featureId: FEATURE, commandCode,
    async execute(request, context) {
      try {
        const contextId = activeContext(context);
        const principal = context!.principal;
        const allowed = () => (writing ? input.canManage : input.canRead)(principal, contextId);
        if (!allowed()) throw new Error("BUSINESS_DICTIONARY_PERMISSION_DENIED");
        const repository = "resolveRepository" in input ? await input.resolveRepository() : input.repository;
        if (!allowed()) throw new Error("BUSINESS_DICTIONARY_PERMISSION_DENIED");
        const result = action(repository, context!, contextId, request.values);
        return { ok: true, correlationId: context!.correlationId,
          result: JSON.parse(JSON.stringify({ contractVersion: "0.1.0", data: result })) as JsonValue };
      } catch (error) {
        return failure(error, context);
      }
    }
  });
  return [
    handler(LIST, false, (repo, _ctx, contextId, values) =>
      values.dictionaryId
        ? repo.get(contextId, required(values.dictionaryId, "BUSINESS_DICTIONARY_ID_REQUIRED"))
        : repo.list(contextId)),
    handler(RESOLVE, false, (repo, _ctx, contextId, values) =>
      repo.resolveBatch({
        contextId, dictionaryId: required(values.dictionaryId, "BUSINESS_DICTIONARY_ID_REQUIRED"),
        ...(values.expectedVersion === undefined ? {} : {
          expectedVersion: integer(values.expectedVersion, "BUSINESS_DICTIONARY_VERSION_INVALID")
        }),
        sourceValues: Array.isArray(values.sourceValues) &&
          values.sourceValues.every(v => typeof v === "string")
          ? values.sourceValues as string[]
          : (() => { throw new Error("BUSINESS_DICTIONARY_VALUES_INVALID"); })()
      })),
    handler(DRAFT, true, (repo, context, contextId, values) =>
      repo.saveDraft({
        contextId, dictionaryId: required(values.dictionaryId, "BUSINESS_DICTIONARY_ID_REQUIRED"),
        expectedVersion: integer(values.expectedVersion, "BUSINESS_DICTIONARY_VERSION_INVALID"),
        options: Array.isArray(values.options)
          ? values.options as unknown as BusinessDictionaryOptionV010[]
          : (() => { throw new Error("BUSINESS_DICTIONARY_OPTIONS_REQUIRED"); })(),
        actorSubjectId: context.principal.subjectId, recordedAt: now().toISOString()
      })),
    handler(PUBLISH, true, (repo, context, contextId, values) => {
      if (context.principal.actorType !== "HUMAN") {
        throw new Error("BUSINESS_DICTIONARY_PUBLISH_HUMAN_REQUIRED");
      }
      return repo.publish({
        contextId, dictionaryId: required(values.dictionaryId, "BUSINESS_DICTIONARY_ID_REQUIRED"),
        expectedVersion: integer(values.expectedVersion, "BUSINESS_DICTIONARY_VERSION_INVALID"),
        actorSubjectId: context.principal.subjectId, actorType: "HUMAN",
        recordedAt: now().toISOString()
      });
    })
  ];
}
