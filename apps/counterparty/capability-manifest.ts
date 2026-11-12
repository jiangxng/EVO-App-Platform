import type {
  PlatformCapabilityOperationContributionV010
} from "../../contracts/package.js";
import {
  COUNTERPARTY_MY_CUSTOMERS_READ_COMMAND_V010,
  COUNTERPARTY_MY_CUSTOMERS_READ_OPERATION_V010,
  COUNTERPARTY_MY_SUPPLIERS_READ_COMMAND_V010,
  COUNTERPARTY_MY_SUPPLIERS_READ_OPERATION_V010,
  COUNTERPARTY_MY_CUSTOMERS_COLLECTION_QUERY_V010,
  COUNTERPARTY_MY_SUPPLIERS_COLLECTION_QUERY_V010,
  COUNTERPARTY_MY_CUSTOMERS_PAGE_CSV_EXPORT_V010,
  COUNTERPARTY_MY_SUPPLIERS_PAGE_CSV_EXPORT_V010,
  COUNTERPARTY_PROJECTION_CAPABILITY_V010
} from "./constants.js";
import {
  COUNTERPARTY_READ_ACTION_V010,
  COUNTERPARTY_READ_RESOURCE_V010
} from "./authorization.js";

const projectionOutputSchema = {
  type: "object",
  required: [
    "contractVersion",
    "projectionId",
    "route",
    "count",
    "counterparties",
    "readableFieldIds"
  ],
  properties: {
    contractVersion: { const: "0.1.0" },
    projectionId: { type: "string" },
    route: { type: "string" },
    count: { type: "integer", minimum: 0 },
    counterparties: { type: "array", items: { type: "object" } },
    readableFieldIds: { type: "array", items: { type: "string" } },
    pageInfo: { type: "object", required: ["page", "pageSize", "total", "hasMore"],
      properties: { page: { type: "integer" }, pageSize: { type: "integer" },
        total: { type: "integer" }, hasMore: { type: "boolean" } } }
  }
} as const;

const collectionOutputSchema = {
  type: "object",
  required: ["contractVersion", "collectionId", "schemaRef", "rows", "readableFieldIds", "pageInfo"],
  properties: {
    contractVersion: { const: "0.1.0" },
    collectionId: { type: "string" },
    schemaRef: { type: "string" },
    rows: { type: "array", items: { type: "object" } },
    readableFieldIds: { type: "array", items: { type: "string" } },
    pageInfo: { type: "object", required: ["page", "pageSize", "total", "hasMore", "countKind"] }
  }
} as const;

const pageCsvOutputSchema = {
  type: "object",
  required: ["contractVersion", "download", "pageInfo"],
  properties: {
    contractVersion: { const: "0.1.0" },
    download: { type: "object", required: ["fileName", "mediaType", "content"],
      properties: { fileName: { type: "string" }, mediaType: { const: "text/csv;charset=utf-8" },
        content: { type: "string" } } },
    pageInfo: { type: "object" }
  }
} as const;

function readOperation(input: {
  operationId: string;
  commandCode: string;
  title: string;
  description: string;
  collectionQuery?: boolean;
  pageCsvExport?: boolean;
}): PlatformCapabilityOperationContributionV010 {
  return {
    kind: "platform.capability-operation",
    operation: {
      contractVersion: "0.1.0",
      operationId: input.operationId,
      capability: COUNTERPARTY_PROJECTION_CAPABILITY_V010,
      operationVersion: "0.1.0",
      title: input.title,
      description: input.description,
      effect: "READ",
      dataScope: "ENTERPRISE",
      authorization: {
        action: COUNTERPARTY_READ_ACTION_V010,
        resource: {
          type: COUNTERPARTY_READ_RESOURCE_V010,
          idSource: "DATA_SCOPE"
        }
      },
      inputSchema: {
        type: "object",
        additionalProperties: false,
        properties: {
          search: { type: "string", maxLength: 120 },
          sort: { type: "string", enum: ["displayName", "code", "status"] },
          direction: { type: "string", enum: ["asc", "desc"] },
          page: { type: "integer", minimum: 0, maximum: 100000 },
          pageSize: { type: "integer", minimum: 1, maximum: 100 },
          ...(input.pageCsvExport ? {
            fieldIds: { type: "array", minItems: 1, maxItems: 5, uniqueItems: true,
              items: { type: "string",
                enum: ["displayName", "code", "status", "subjectType", "countryOrRegion"] } }
          } : {})
        },
        ...(input.pageCsvExport ? { required: ["fieldIds"] } : {})
      },
      outputSchema: input.pageCsvExport ? pageCsvOutputSchema
        : input.collectionQuery ? collectionOutputSchema : projectionOutputSchema,
      binding: {
        type: "ACTION_HOST",
        commandCode: input.commandCode,
        inputVersion: "0.1.0"
      },
      exposure: ["HUMAN", "PERSONAL_AGENT", "AUTOMATION"]
    }
  };
}

export const counterpartyProjectionCapabilityContributionsV010:
  PlatformCapabilityOperationContributionV010[] = [
    readOperation({
      operationId: COUNTERPARTY_MY_CUSTOMERS_READ_OPERATION_V010,
      commandCode: COUNTERPARTY_MY_CUSTOMERS_READ_COMMAND_V010,
      title: "Read My Customers",
      description:
        "Read the governed My Customers projection for the current Enterprise Context. The result is the same responsibility-scoped and authorization-filtered projection used by the Human Counterparty experience."
    }),
    readOperation({
      operationId: COUNTERPARTY_MY_SUPPLIERS_READ_OPERATION_V010,
      commandCode: COUNTERPARTY_MY_SUPPLIERS_READ_COMMAND_V010,
      title: "Read My Suppliers",
      description:
        "Read the governed My Suppliers projection for the current Enterprise Context. The result is the same responsibility-scoped and authorization-filtered projection used by the Human Counterparty experience."
    }),
    readOperation({
      operationId: COUNTERPARTY_MY_CUSTOMERS_COLLECTION_QUERY_V010,
      commandCode: COUNTERPARTY_MY_CUSTOMERS_COLLECTION_QUERY_V010,
      title: "Query My Customers Collection",
      description: "Read the existing authorized My Customers projection as a bounded data collection with stable row IDs and permitted fields.",
      collectionQuery: true
    }),
    readOperation({
      operationId: COUNTERPARTY_MY_SUPPLIERS_COLLECTION_QUERY_V010,
      commandCode: COUNTERPARTY_MY_SUPPLIERS_COLLECTION_QUERY_V010,
      title: "Query My Suppliers Collection",
      description: "Read the existing authorized My Suppliers projection as a bounded data collection with stable row IDs and permitted fields.",
      collectionQuery: true
    }),
    readOperation({
      operationId: COUNTERPARTY_MY_CUSTOMERS_PAGE_CSV_EXPORT_V010,
      commandCode: COUNTERPARTY_MY_CUSTOMERS_PAGE_CSV_EXPORT_V010,
      title: "Export My Customers Current Page CSV",
      description: "Download only the current bounded, responsibility-scoped and field-authorized My Customers page. Never all pages or hidden fields.",
      pageCsvExport: true
    }),
    readOperation({
      operationId: COUNTERPARTY_MY_SUPPLIERS_PAGE_CSV_EXPORT_V010,
      commandCode: COUNTERPARTY_MY_SUPPLIERS_PAGE_CSV_EXPORT_V010,
      title: "Export My Suppliers Current Page CSV",
      description: "Download only the current bounded, responsibility-scoped and field-authorized My Suppliers page. Never all pages or hidden fields.",
      pageCsvExport: true
    })
  ];
