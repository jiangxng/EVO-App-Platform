import { parseCounterpartyProjectionQueryV010 } from "./projection-query.js";
import type {
  AppActionExecutionResultV010,
  AppActionHandler,
  AppActionRequestV010,
  JsonValue
} from "../../actions/contracts.js";
import type {
  EnterpriseContextRelationshipKindV010,
  PlatformPrincipalV010,
  PlatformRequestContextV010
} from "../../contracts/platform-services.js";
import {
  COUNTERPARTY_FEATURE_ID,
  COUNTERPARTY_MY_CUSTOMERS_READ_COMMAND_V010,
  COUNTERPARTY_MY_SUPPLIERS_READ_COMMAND_V010,
  COUNTERPARTY_MY_CUSTOMERS_COLLECTION_QUERY_V010,
  COUNTERPARTY_MY_SUPPLIERS_COLLECTION_QUERY_V010,
  COUNTERPARTY_MY_CUSTOMERS_PAGE_CSV_EXPORT_V010,
  COUNTERPARTY_MY_SUPPLIERS_PAGE_CSV_EXPORT_V010,
  COUNTERPARTY_PACKAGE_ID
} from "./constants.js";
import {
  COUNTERPARTY_MY_CUSTOMER_PROJECTION_V010,
  COUNTERPARTY_MY_SUPPLIER_PROJECTION_V010,
  type CounterpartyProjectionIdV010
} from "./projections.js";
import type {
  CounterpartyProjectionServiceV010
} from "./projection-service.js";

function activeEnterpriseContext(
  context: PlatformRequestContextV010 | undefined
): { contextId: string } {
  const active = context?.context?.activeContext;
  if (!context || !active || active.kind !== "ENTERPRISE") {
    throw new Error("COUNTERPARTY_ENTERPRISE_CONTEXT_REQUIRED");
  }
  return { contextId: active.contextId };
}

function failure(
  error: unknown,
  context?: PlatformRequestContextV010
): AppActionExecutionResultV010 {
  const code = error instanceof Error
    ? error.message.split(":")[0]
    : "COUNTERPARTY_PROJECTION_READ_FAILED";
  return {
    ok: false,
    ...(context?.correlationId
      ? { correlationId: context.correlationId }
      : {}),
    error: {
      code,
      message: error instanceof Error ? error.message : String(error)
    }
  };
}

export function createCounterpartyProjectionActionHandlersV010(input: (
  { service: CounterpartyProjectionServiceV010 } |
  { resolveService(): Promise<CounterpartyProjectionServiceV010> }
) & {
  resolveEnterpriseRelationshipKind(
    principal: PlatformPrincipalV010,
    contextId: string
  ): EnterpriseContextRelationshipKindV010 | undefined;
}): AppActionHandler[] {
  const create = (
    commandCode: string,
    projectionId: CounterpartyProjectionIdV010,
    collectionQuery = false,
    exportCurrentPage = false
  ): AppActionHandler => ({
    packageId: COUNTERPARTY_PACKAGE_ID,
    featureId: COUNTERPARTY_FEATURE_ID,
    commandCode,
    async execute(
      request: AppActionRequestV010,
      context?: PlatformRequestContextV010
    ): Promise<AppActionExecutionResultV010> {
      try {
        if (!context) throw new Error("REQUEST_CONTEXT_REQUIRED");
        const active = activeEnterpriseContext(context);
        const relationship = input.resolveEnterpriseRelationshipKind(
          context.principal, active.contextId
        );
        // A stale browser action is not an authorization token. The export
        // checks the current Enterprise scope, relationship and owner again.
        if (exportCurrentPage && (
          !relationship
          || context.context?.activeContext.kind !== "ENTERPRISE"
          || context.scope.enterpriseId !== context.context.activeContext.enterpriseId
          || (context.scope.userId && context.scope.userId !== context.principal.subjectId)
        )) throw new Error("COUNTERPARTY_EXPORT_CONTEXT_DENIED");
        const { fieldIds, confirmed, ...exportQueryValues } = request.values;
        if (exportCurrentPage && (
          (confirmed !== undefined && confirmed !== false)
          || !Array.isArray(fieldIds) || fieldIds.length < 1 || fieldIds.length > 5
          || fieldIds.some(id => typeof id !== "string"
            || !["displayName","code","status","subjectType","countryOrRegion"].includes(id))
          || new Set(fieldIds).size !== fieldIds.length
        )) throw new Error("COUNTERPARTY_EXPORT_FIELDS_INVALID");
        // Validate the query before resolving/loading the domain service.
        const parsedQuery = collectionQuery || exportCurrentPage || Object.keys(request.values).length
          ? parseCounterpartyProjectionQueryV010(
              exportCurrentPage ? exportQueryValues : request.values
            ) : undefined;
        const service = "resolveService" in input ? await input.resolveService() : input.service;
        const result = await service.read({
          contextId: active.contextId,
          projectionId,
          ...(parsedQuery ? { query: parsedQuery } : {}),
          requestContext: context,
          enterpriseRelationshipKind: relationship
        });
        if (exportCurrentPage) {
          const collection = (await import("./collection-query.js"))
            .counterpartyProjectionCollectionResultV010(result);
          // The shared serializer rejects fields absent from fresh owner
          // readableFieldIds, even if a stale UI presents old columns.
          const csv = (await import("../../foundation/collection-query/page-csv.js"))
            .serializeAuthorizedCollectionPageCsvV010({
              page: collection, fieldIds: fieldIds as string[]
            });
          return {
            ok: true, correlationId: context.correlationId,
            result: {
              contractVersion: "0.1.0",
              message: "Current authorized page downloaded.",
              download: {
                fileName: (projectionId === COUNTERPARTY_MY_CUSTOMER_PROJECTION_V010
                  ? "my-customers" : "my-suppliers")
                  + "-page-" + (collection.pageInfo.page + 1) + ".csv",
                mediaType: "text/csv;charset=utf-8",
                content: "\uFEFF" + csv
              },
              pageInfo: {
                page: collection.pageInfo.page, rows: collection.rows.length,
                hasMore: collection.pageInfo.hasMore
              }
            }
          };
        }
        const output = collectionQuery
          ? (await import("./collection-query.js")).counterpartyProjectionCollectionResultV010(result)
          : result;
        return {
          ok: true,
          correlationId: context.correlationId,
          result: JSON.parse(JSON.stringify(output)) as JsonValue
        };
      } catch (error) {
        return failure(error, context);
      }
    }
  });

  return [
    create(
      COUNTERPARTY_MY_CUSTOMERS_READ_COMMAND_V010,
      COUNTERPARTY_MY_CUSTOMER_PROJECTION_V010
    ),
    create(
      COUNTERPARTY_MY_SUPPLIERS_READ_COMMAND_V010,
      COUNTERPARTY_MY_SUPPLIER_PROJECTION_V010
    ),
    create(
      COUNTERPARTY_MY_CUSTOMERS_COLLECTION_QUERY_V010,
      COUNTERPARTY_MY_CUSTOMER_PROJECTION_V010,
      true
    ),
    create(
      COUNTERPARTY_MY_SUPPLIERS_COLLECTION_QUERY_V010,
      COUNTERPARTY_MY_SUPPLIER_PROJECTION_V010,
      true
    ),
    create(
      COUNTERPARTY_MY_CUSTOMERS_PAGE_CSV_EXPORT_V010,
      COUNTERPARTY_MY_CUSTOMER_PROJECTION_V010,
      false, true
    ),
    create(
      COUNTERPARTY_MY_SUPPLIERS_PAGE_CSV_EXPORT_V010,
      COUNTERPARTY_MY_SUPPLIER_PROJECTION_V010,
      false, true
    )
  ];
}
