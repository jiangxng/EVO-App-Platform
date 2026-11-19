import type {
  PlatformCapabilityOperationContributionV010
} from "../../contracts/package.js";
import {
  ITEM_DIRECTORY_COLLECTION_QUERY_V010,
  ITEM_MY_ITEMS_COLLECTION_QUERY_V010,
  ITEM_DIRECTORY_READ_COMMAND_V010,
  ITEM_DIRECTORY_READ_OPERATION_V010,
  ITEM_MY_ITEMS_READ_COMMAND_V010,
  ITEM_MY_ITEMS_READ_OPERATION_V010,
  ITEM_PROJECTION_CAPABILITY_V010
} from "./constants.js";
import {
  ITEM_READ_ACTION_V010,
  ITEM_READ_RESOURCE_V010
} from "./authorization.js";

const projectionOutputSchema = {
  type: "object",
  required: [
    "contractVersion",
    "projectionId",
    "route",
    "count",
    "items",
    "readableFieldIds"
  ],
  properties: {
    contractVersion: { const: "0.1.0" },
    projectionId: { type: "string" },
    route: { type: "string" },
    count: { type: "integer", minimum: 0 },
    items: { type: "array", items: { type: "object" } },
    readableFieldIds: { type: "array", items: { type: "string" } }
  }
} as const;

const itemCollectionOutputSchema = {
  type: "object",
  required: [
    "contractVersion", "collectionId", "schemaRef",
    "rows", "readableFieldIds", "pageInfo"
  ],
  properties: {
    contractVersion: { const: "0.1.0" },
    collectionId: { type: "string" },
    schemaRef: { type: "string" },
    rows: { type: "array", items: { type: "object" } },
    readableFieldIds: { type: "array", items: { type: "string" } },
    pageInfo: {
      type: "object",
      required: ["page", "pageSize", "total", "hasMore", "countKind"],
      properties: {
        page: { type: "integer" },
        pageSize: { type: "integer" },
        total: { type: "integer" },
        hasMore: { type: "boolean" },
        countKind: { const: "EXACT" }
      }
    }
  }
} as const;

function readOperation(input: {
  operationId: string;
  commandCode: string;
  title: string;
  description: string;
  collectionQuery?: boolean;
}): PlatformCapabilityOperationContributionV010 {
  return {
    kind: "platform.capability-operation",
    operation: {
      contractVersion: "0.1.0",
      operationId: input.operationId,
      capability: ITEM_PROJECTION_CAPABILITY_V010,
      operationVersion: "0.1.0",
      title: input.title,
      description: input.description,
      effect: "READ",
      dataScope: "ENTERPRISE",
      authorization: {
        action: ITEM_READ_ACTION_V010,
        resource: {
          type: ITEM_READ_RESOURCE_V010,
          idSource: "DATA_SCOPE"
        }
      },
      inputSchema: {
        type: "object",
        additionalProperties: false,
        properties: input.collectionQuery ? {
          search: { type: "string", maxLength: 120 },
          sort: { type: "string", enum: ["displayName","code","itemKind","baseUomCode"] },
          direction: { type: "string", enum: ["asc","desc"] },
          page: { type: "integer", minimum: 0, maximum: 100000 },
          pageSize: { type: "integer", minimum: 1, maximum: 100 }
        } : {}
      },
      outputSchema: input.collectionQuery
        ? itemCollectionOutputSchema : projectionOutputSchema,
      binding: {
        type: "ACTION_HOST",
        commandCode: input.commandCode,
        inputVersion: "0.1.0"
      },
      exposure: ["HUMAN", "PERSONAL_AGENT", "AUTOMATION"]
    }
  };
}

export const itemProjectionCapabilityContributionsV010:
  PlatformCapabilityOperationContributionV010[] = [
    readOperation({
      operationId: ITEM_DIRECTORY_READ_OPERATION_V010,
      commandCode: ITEM_DIRECTORY_READ_COMMAND_V010,
      title: "Read Items",
      description:
        "Read the governed Item directory projection for the current Enterprise Context. Human and Personal Agent consumers share this derived projection authority."
    }),
    readOperation({
      operationId: ITEM_MY_ITEMS_READ_OPERATION_V010,
      commandCode: ITEM_MY_ITEMS_READ_COMMAND_V010,
      title: "Read My Items",
      description:
        "Read Items for which the current principal carries active ITEM_STEWARD responsibility, intersected with normal Item authorization."
    }),
    readOperation({
      operationId: ITEM_DIRECTORY_COLLECTION_QUERY_V010,
      commandCode: ITEM_DIRECTORY_COLLECTION_QUERY_V010,
      title: "Query Authorized Item Collection",
      description:
        "Search, sort and paginate the existing owner-authorized Item directory. The current Enterprise/Principal and field grants are checked by Item Owner."
      ,
      collectionQuery: true
    }),
    readOperation({
      operationId: ITEM_MY_ITEMS_COLLECTION_QUERY_V010,
      commandCode: ITEM_MY_ITEMS_COLLECTION_QUERY_V010,
      title: "Query My Items Collection",
      description:
        "Search, sort and paginate current owner-authorized Items intersected with active Item stewardship; no independent data rights are added.",
      collectionQuery: true
    })
  ];
