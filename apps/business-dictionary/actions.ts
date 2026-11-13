import type {
  AppActionHandler, AppActionExecutionResultV010, JsonValue
} from "../../actions/contracts.js";
import type {
  PlatformPrincipalV010, PlatformRequestContextV010
} from "../../contracts/platform-services.js";
import type { BusinessDictionaryOptionV010 } from "../../contracts/reference-data/dictionary.js";
import type { BusinessDictionaryRepositoryV010 } from "./repository.js";
import { queryBusinessDictionaryCollectionV010 } from "./collection-query.js";
import { aggregateBusinessDictionaryStatesV010 } from "./collection-aggregate.js";
import { serializeAuthorizedCollectionPageCsvV010 } from "../../foundation/collection-query/page-csv.js";
import {
  BUSINESS_DICTIONARY_DRAFT_COMMAND_V010 as DRAFT,
  BUSINESS_DICTIONARY_OPTION_SAVE_COMMAND_V010 as OPTION_SAVE,
  BUSINESS_DICTIONARY_LIST_COMMAND_V010 as LIST,
  BUSINESS_DICTIONARY_COLLECTION_QUERY_COMMAND_V010 as COLLECTION_QUERY,
  BUSINESS_DICTIONARY_COLLECTION_STATE_AGGREGATE_COMMAND_V010 as STATE_AGGREGATE,
  BUSINESS_DICTIONARY_PAGE_CSV_EXPORT_COMMAND_V010 as PAGE_CSV_EXPORT,
  BUSINESS_DICTIONARY_PUBLISH_COMMAND_V010 as PUBLISH,
  BUSINESS_DICTIONARY_RESOLVE_COMMAND_V010 as RESOLVE,
  BUSINESS_DICTIONARY_FEATURE_ID as FEATURE,
  BUSINESS_DICTIONARY_PACKAGE_ID as PACKAGE
} from "./constants.js";
import { businessDictionaryDetailRouteV010 } from "./page.js";

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
        const navigateTo = commandCode === OPTION_SAVE || commandCode === PUBLISH
          ? businessDictionaryDetailRouteV010(required(request.values.dictionaryId,
            "BUSINESS_DICTIONARY_ID_REQUIRED")) : undefined;
        return { ok: true, correlationId: context!.correlationId,
          result: JSON.parse(JSON.stringify({ contractVersion: "0.1.0", data: result,
            ...(navigateTo ? { navigateTo } : {}) })) as JsonValue };
      } catch (error) {
        return failure(error, context);
      }
    }
  });
  // Unlike list/query (which return {data}), Eidos handles a top-level
  // download envelope natively. The Plugin/Host still reauthorizes every call.
  const exportCurrentPage: AppActionHandler = {
    packageId: PACKAGE, featureId: FEATURE, commandCode: PAGE_CSV_EXPORT,
    async execute(request, context) {
      try {
        const contextId = activeContext(context);
        const principal = context!.principal;
        if (!input.canRead(principal, contextId)) {
          throw new Error("BUSINESS_DICTIONARY_PERMISSION_DENIED");
        }
        const repository = "resolveRepository" in input
          ? await input.resolveRepository() : input.repository;
        if (!input.canRead(principal, contextId)) {
          throw new Error("BUSINESS_DICTIONARY_PERMISSION_DENIED");
        }
        const { fieldIds, confirmed, ...query } = request.values;
        // The browser action executor contributes confirmed:false. It is not
        // a query parameter, nor can caller values authorize an export.
        if (confirmed !== undefined && confirmed !== false) {
          throw new Error("BUSINESS_DICTIONARY_CSV_INPUT_INVALID");
        }
        if (!Array.isArray(fieldIds) || !fieldIds.every(field => typeof field === "string")) {
          throw new Error("COLLECTION_CSV_FIELDS_INVALID");
        }
        const result = queryBusinessDictionaryCollectionV010({
          dictionaries: repository.list(contextId), query
        });
        const csv = serializeAuthorizedCollectionPageCsvV010({page: result, fieldIds});
        return {
          ok: true, correlationId: context!.correlationId,
          result: {
            contractVersion: "0.1.0",
            message: "Current authorized page downloaded.",
            download: {
              fileName: "business-dictionaries-page-" + (result.pageInfo.page + 1) + ".csv",
              mediaType: "text/csv;charset=utf-8",
              content: "\uFEFF" + csv
            },
            pageInfo: { page: result.pageInfo.page, rows: result.rows.length,
              hasMore: result.pageInfo.hasMore }
          }
        };
      } catch (error) {
        return failure(error, context);
      }
    }
  };
  return [
    exportCurrentPage,
    handler(LIST, false, (repo, _ctx, contextId, values) =>
      values.dictionaryId
        ? repo.get(contextId, required(values.dictionaryId, "BUSINESS_DICTIONARY_ID_REQUIRED"))
        : repo.list(contextId)),
    handler(COLLECTION_QUERY, false, (repo, _ctx, contextId, values) =>
      queryBusinessDictionaryCollectionV010({
        dictionaries: repo.list(contextId), query: values
      })),
    handler(STATE_AGGREGATE, false, (repo, _ctx, contextId, values) =>
      aggregateBusinessDictionaryStatesV010({
        dictionaries: repo.list(contextId), contextId, query: values, now: now()
      })),
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
        ...(typeof values.displayName === "string" && values.displayName.trim()
          ? { displayName: values.displayName.trim() } : {}),
        options: Array.isArray(values.options)
          ? values.options as unknown as BusinessDictionaryOptionV010[]
          : (() => { throw new Error("BUSINESS_DICTIONARY_OPTIONS_REQUIRED"); })(),
        actorSubjectId: context.principal.subjectId, recordedAt: now().toISOString()
      })),
    handler(OPTION_SAVE, true, (repo, context, contextId, values) => {
      const dictionaryId = required(values.dictionaryId, "BUSINESS_DICTIONARY_ID_REQUIRED");
      const displayName = required(values.displayName, "BUSINESS_DICTIONARY_NAME_REQUIRED");
      const expectedVersion = integer(values.expectedVersion, "BUSINESS_DICTIONARY_VERSION_INVALID");
      const optionCode = required(values.optionCode, "BUSINESS_DICTIONARY_CODE_REQUIRED");
      const originalCode = typeof values.originalCode === "string" ? values.originalCode.trim() : "";
      const optionLabel = required(values.optionLabel, "BUSINESS_DICTIONARY_LABEL_REQUIRED");
      const status = values.optionStatus;
      if (status !== "ACTIVE" && status !== "INACTIVE") {
        throw new Error("BUSINESS_DICTIONARY_STATUS_INVALID");
      }
      const current = repo.get(contextId, dictionaryId);
      if ((current?.version ?? 0) !== expectedVersion) {
        throw new Error("BUSINESS_DICTIONARY_VERSION_CONFLICT");
      }
      if (originalCode && originalCode !== optionCode) {
        throw new Error("BUSINESS_DICTIONARY_CODE_IMMUTABLE");
      }
      const existingIndex = current?.options.findIndex(option => option.code === optionCode) ?? -1;
      if (originalCode && existingIndex < 0) throw new Error("BUSINESS_DICTIONARY_OPTION_NOT_FOUND");
      if (!originalCode && existingIndex >= 0) throw new Error("BUSINESS_DICTIONARY_OPTION_EXISTS");
      const previousOption = existingIndex >= 0 ? current!.options[existingIndex] : undefined;
      const rawAliases = typeof values.optionAliases === "string" ? values.optionAliases : "";
      const aliases = previousOption?.aliases?.join("，") === rawAliases
        ? previousOption.aliases ?? []
        : [...new Set(rawAliases.split(/[,，]/u).map(value => value.trim()).filter(Boolean))];
      const translations = { ...(previousOption?.label.translations ?? {}) };
      if (typeof values.optionLabelZh === "string") {
        const chinese = values.optionLabelZh.trim();
        if (chinese) translations["zh-CN"] = chinese;
        else delete translations["zh-CN"];
      }
      const option: BusinessDictionaryOptionV010 = {
        code: optionCode, label: { default: optionLabel,
          ...(Object.keys(translations).length ? { translations } : {}) },
        ...(aliases.length ? { aliases } : {}), status
      };
      const options = current ? [...current.options] : [];
      if (existingIndex >= 0) options[existingIndex] = option;
      else options.push(option);
      return repo.saveDraft({ contextId, dictionaryId, displayName, expectedVersion,
        options, actorSubjectId: context.principal.subjectId, recordedAt: now().toISOString() });
    }),
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
