import type {
  PlatformCapabilityOperationContributionV010
} from "../../contracts/package.js";
import {
  WAREHOUSE_DIRECTORY_READ_COMMAND_V010,
  WAREHOUSE_DIRECTORY_READ_OPERATION_V010,
  WAREHOUSE_MY_READ_COMMAND_V010,
  WAREHOUSE_MY_READ_OPERATION_V010,
  WAREHOUSE_PROJECTION_CAPABILITY_V010
} from "./constants.js";
import {
  WAREHOUSE_READ_ACTION_V010,
  WAREHOUSE_READ_RESOURCE_V010
} from "./authorization.js";

const projectionOutputSchema = {
  type: "object",
  required: [
    "contractVersion",
    "projectionId",
    "route",
    "count",
    "warehouses",
    "readableFieldIds"
  ],
  properties: {
    contractVersion: { const: "0.1.0" },
    projectionId: { type: "string" },
    route: { type: "string" },
    count: { type: "integer", minimum: 0 },
    warehouses: { type: "array", items: { type: "object" } },
    readableFieldIds: { type: "array", items: { type: "string" } }
  }
} as const;

function readOperation(input: {
  operationId: string;
  commandCode: string;
  title: string;
  description: string;
}): PlatformCapabilityOperationContributionV010 {
  return {
    kind: "platform.capability-operation",
    operation: {
      contractVersion: "0.1.0",
      operationId: input.operationId,
      capability: WAREHOUSE_PROJECTION_CAPABILITY_V010,
      operationVersion: "0.1.0",
      title: input.title,
      description: input.description,
      effect: "READ",
      dataScope: "ENTERPRISE",
      authorization: {
        action: WAREHOUSE_READ_ACTION_V010,
        resource: {
          type: WAREHOUSE_READ_RESOURCE_V010,
          idSource: "DATA_SCOPE"
        }
      },
      inputSchema: {
        type: "object",
        additionalProperties: false,
        properties: {}
      },
      outputSchema: projectionOutputSchema,
      binding: {
        type: "ACTION_HOST",
        commandCode: input.commandCode,
        inputVersion: "0.1.0"
      },
      exposure: ["HUMAN", "PERSONAL_AGENT", "AUTOMATION"]
    }
  };
}

export const warehouseProjectionCapabilityContributionsV010:
  PlatformCapabilityOperationContributionV010[] = [
    readOperation({
      operationId: WAREHOUSE_DIRECTORY_READ_OPERATION_V010,
      commandCode: WAREHOUSE_DIRECTORY_READ_COMMAND_V010,
      title: "Read Warehouses",
      description:
        "Read the governed Warehouse directory and structural location hierarchy for the current Enterprise Context."
    }),
    readOperation({
      operationId: WAREHOUSE_MY_READ_OPERATION_V010,
      commandCode: WAREHOUSE_MY_READ_COMMAND_V010,
      title: "Read My Warehouses",
      description:
        "Read Warehouses for which the current principal carries active WAREHOUSE_STEWARD responsibility, intersected with normal Warehouse authorization."
    })
  ];
}
