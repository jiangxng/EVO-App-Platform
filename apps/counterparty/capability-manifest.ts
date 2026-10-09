import type {
  PlatformCapabilityOperationContributionV010
} from "../../contracts/package.js";
import {
  COUNTERPARTY_MY_CUSTOMERS_READ_COMMAND_V010,
  COUNTERPARTY_MY_CUSTOMERS_READ_OPERATION_V010,
  COUNTERPARTY_MY_SUPPLIERS_READ_COMMAND_V010,
  COUNTERPARTY_MY_SUPPLIERS_READ_OPERATION_V010,
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
    })
  ];
