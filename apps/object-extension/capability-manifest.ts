import type {
  PlatformCapabilityOperationContributionV010
} from "../../contracts/package.js";
import {
  OBJECT_EXTENSION_DEFINITION_ARCHIVE_COMMAND_V010,
  OBJECT_EXTENSION_DEFINITION_ARCHIVE_OPERATION_V010,
  OBJECT_EXTENSION_DEFINITION_AUTH_RESOURCE_V010,
  OBJECT_EXTENSION_DEFINITION_CAPABILITY_V010,
  OBJECT_EXTENSION_DEFINITION_LIST_COMMAND_V010,
  OBJECT_EXTENSION_DEFINITION_LIST_OPERATION_V010,
  OBJECT_EXTENSION_DEFINITION_READ_ACTION_V010,
  OBJECT_EXTENSION_DEFINITION_UPSERT_COMMAND_V010,
  OBJECT_EXTENSION_DEFINITION_UPSERT_OPERATION_V010,
  OBJECT_EXTENSION_DEFINITION_WRITE_ACTION_V010
} from "./constants.js";

const definitionSchema = {
  type: "object",
  additionalProperties: true,
  required: [
    "contractVersion",
    "extensionId",
    "targetObjectType",
    "targetSlot",
    "namespace",
    "fieldId",
    "semanticType",
    "valueType",
    "label",
    "required",
    "order",
    "surfaces"
  ],
  properties: {
    contractVersion: { const: "0.1.0" },
    extensionId: { type: "string", minLength: 1 },
    targetObjectType: { type: "string", minLength: 1 },
    targetSlot: { type: "string", minLength: 1 },
    namespace: { type: "string", minLength: 1 },
    fieldId: { type: "string", minLength: 1 },
    semanticType: { type: "string", minLength: 1 },
    valueType: {
      enum: ["STRING", "NUMBER", "BOOLEAN", "DATE", "ENUM"]
    },
    label: { type: "object" },
    description: { type: "object" },
    required: { type: "boolean" },
    order: { type: "number" },
    surfaces: { type: "array" }
  }
} as const;

export const objectExtensionCapabilityContributionsV010:
  PlatformCapabilityOperationContributionV010[] = [{
    kind: "platform.capability-operation",
    operation: {
      contractVersion: "0.1.0",
      operationId: OBJECT_EXTENSION_DEFINITION_LIST_OPERATION_V010,
      capability: OBJECT_EXTENSION_DEFINITION_CAPABILITY_V010,
      operationVersion: "0.1.0",
      title: "List enterprise Object Extension definitions",
      description:
        "Lists active enterprise-scoped Object Extension definitions, optionally filtered by Foundation Object type.",
      effect: "READ",
      dataScope: "ENTERPRISE",
      authorization: {
        action: OBJECT_EXTENSION_DEFINITION_READ_ACTION_V010,
        resource: {
          type: OBJECT_EXTENSION_DEFINITION_AUTH_RESOURCE_V010,
          idSource: "DATA_SCOPE"
        }
      },
      inputSchema: {
        type: "object",
        additionalProperties: false,
        properties: {
          targetObjectType: { type: "string", minLength: 1 }
        }
      },
      outputSchema: {
        type: "object",
        required: ["contractVersion", "definitions"],
        properties: {
          contractVersion: { const: "0.1.0" },
          definitions: {
            type: "array",
            items: definitionSchema
          }
        }
      },
      binding: {
        type: "ACTION_HOST",
        commandCode: OBJECT_EXTENSION_DEFINITION_LIST_COMMAND_V010,
        inputVersion: "0.1.0"
      },
      exposure: ["HUMAN", "PERSONAL_AGENT", "AUTOMATION"]
    }
  }, {
    kind: "platform.capability-operation",
    operation: {
      contractVersion: "0.1.0",
      operationId: OBJECT_EXTENSION_DEFINITION_UPSERT_OPERATION_V010,
      capability: OBJECT_EXTENSION_DEFINITION_CAPABILITY_V010,
      operationVersion: "0.1.0",
      title: "Create or update an enterprise Object Extension definition",
      description:
        "Validates and writes one enterprise-scoped Object Extension definition into the active Enterprise Context.",
      effect: "WRITE",
      dataScope: "ENTERPRISE",
      authorization: {
        action: OBJECT_EXTENSION_DEFINITION_WRITE_ACTION_V010,
        resource: {
          type: OBJECT_EXTENSION_DEFINITION_AUTH_RESOURCE_V010,
          idSource: "DATA_SCOPE"
        }
      },
      inputSchema: {
        type: "object",
        additionalProperties: false,
        required: ["definition"],
        properties: {
          definition: definitionSchema
        }
      },
      outputSchema: {
        type: "object",
        required: ["contractVersion", "definition"],
        properties: {
          contractVersion: { const: "0.1.0" },
          definition: definitionSchema
        }
      },
      binding: {
        type: "ACTION_HOST",
        commandCode: OBJECT_EXTENSION_DEFINITION_UPSERT_COMMAND_V010,
        inputVersion: "0.1.0"
      },
      exposure: ["HUMAN", "PERSONAL_AGENT", "AUTOMATION"],
      writeSafety: {
        idempotency: "HOST_REQUIRED",
        receipt: "HOST_REQUIRED"
      }
    }
  }, {
    kind: "platform.capability-operation",
    operation: {
      contractVersion: "0.1.0",
      operationId: OBJECT_EXTENSION_DEFINITION_ARCHIVE_OPERATION_V010,
      capability: OBJECT_EXTENSION_DEFINITION_CAPABILITY_V010,
      operationVersion: "0.1.0",
      title: "Archive an enterprise Object Extension definition",
      description:
        "Archives one Object Extension definition in the active Enterprise Context without deleting its resource evidence.",
      effect: "WRITE",
      dataScope: "ENTERPRISE",
      authorization: {
        action: OBJECT_EXTENSION_DEFINITION_WRITE_ACTION_V010,
        resource: {
          type: OBJECT_EXTENSION_DEFINITION_AUTH_RESOURCE_V010,
          idSource: "INPUT",
          inputKey: "extensionId"
        }
      },
      inputSchema: {
        type: "object",
        additionalProperties: false,
        required: ["extensionId"],
        properties: {
          extensionId: { type: "string", minLength: 1 }
        }
      },
      outputSchema: {
        type: "object",
        required: ["contractVersion", "extensionId", "archived"],
        properties: {
          contractVersion: { const: "0.1.0" },
          extensionId: { type: "string" },
          archived: { const: true }
        }
      },
      binding: {
        type: "ACTION_HOST",
        commandCode: OBJECT_EXTENSION_DEFINITION_ARCHIVE_COMMAND_V010,
        inputVersion: "0.1.0"
      },
      exposure: ["HUMAN", "PERSONAL_AGENT", "AUTOMATION"],
      writeSafety: {
        idempotency: "HOST_REQUIRED",
        receipt: "HOST_REQUIRED"
      }
    }
  }];



/** MD-02 remains owned by Object Extension. No parallel model capability. */
const modelCommandsV010 = [
  { code: "object-extension.model.propose", effect: "READ" as const,
    required: ["importJobId"],
    properties: { importJobId: { type: "string", minLength: 1 } } },
  { code: "object-extension.model.draft.get", effect: "READ" as const,
    required: ["modelDraftId"],
    properties: { modelDraftId: { type: "string", minLength: 1 } } },
  { code: "object-extension.model.draft.save", effect: "WRITE" as const,
    required: ["importJobId", "sourceColumn", "sourceRevision", "expectedVersion", "definition"],
    properties: {
      importJobId: { type: "string", minLength: 1 },
      sourceColumn: { type: "string", minLength: 1 },
      sourceRevision: { type: "string", minLength: 1 },
      expectedVersion: { type: "integer", minimum: 0 },
      definition: { type: "object" }
    } },
  { code: "object-extension.model.publish", effect: "WRITE" as const,
    required: ["modelDraftId", "expectedVersion"],
    properties: {
      modelDraftId: { type: "string", minLength: 1 },
      expectedVersion: { type: "integer", minimum: 1 }
    } }
];
export const objectExtensionModelCapabilityContributionsV010:
  PlatformCapabilityOperationContributionV010[] = modelCommandsV010.map(item => ({
  kind: "platform.capability-operation",
  operation: {
    contractVersion: "0.1.0", operationId: item.code,
    capability: OBJECT_EXTENSION_DEFINITION_CAPABILITY_V010,
    operationVersion: "0.1.0",
    title: item.code,
    description: "Review and publish an import-linked Object Extension field using existing enterprise resources",
    effect: item.effect, dataScope: "ENTERPRISE",
    authorization: {
      action: item.effect === "READ"
        ? OBJECT_EXTENSION_DEFINITION_READ_ACTION_V010
        : OBJECT_EXTENSION_DEFINITION_WRITE_ACTION_V010,
      resource: { type: OBJECT_EXTENSION_DEFINITION_AUTH_RESOURCE_V010, idSource: "DATA_SCOPE" }
    },
    inputSchema: {
      type: "object", additionalProperties: false,
      required: item.required, properties: item.properties
    },
    outputSchema: { type: "object" },
    binding: { type: "ACTION_HOST", commandCode: item.code, inputVersion: "0.1.0" },
    exposure: ["HUMAN"],
    ...(item.effect === "WRITE" ? { writeSafety: {
      idempotency: "HOST_REQUIRED" as const, receipt: "HOST_REQUIRED" as const
    } } : {})
  }
}));
