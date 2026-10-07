import type {
  PlatformCapabilityOperationContributionV010
} from "../../contracts/package.js";
import {
  DATA_IMPORT_AUTH_RESOURCE_V010,
  DATA_IMPORT_CAPABILITY_V010,
  DATA_IMPORT_COMMIT_COMMAND_V010,
  DATA_IMPORT_COMMIT_OPERATION_V010,
  DATA_IMPORT_DRY_RUN_COMMAND_V010,
  DATA_IMPORT_DRY_RUN_OPERATION_V010,
  DATA_IMPORT_ERROR_CSV_COMMAND_V010,
  DATA_IMPORT_ERROR_CSV_OPERATION_V010,
  DATA_IMPORT_GET_COMMAND_V010,
  DATA_IMPORT_GET_OPERATION_V010,
  DATA_IMPORT_READ_ACTION_V010,
  DATA_IMPORT_STAGE_CSV_COMMAND_V010,
  DATA_IMPORT_STAGE_CSV_OPERATION_V010,
  DATA_IMPORT_WRITE_ACTION_V010
} from "./constants.js";

const importJobOutputSchema = {
  type: "object",
  required: ["contractVersion", "job"],
  properties: {
    contractVersion: { const: "0.1.0" },
    job: { type: "object" }
  }
} as const;

export const dataImportCapabilityContributionsV010:
  PlatformCapabilityOperationContributionV010[] = [{
    kind: "platform.capability-operation",
    operation: {
      contractVersion: "0.1.0",
      operationId: DATA_IMPORT_STAGE_CSV_OPERATION_V010,
      capability: DATA_IMPORT_CAPABILITY_V010,
      operationVersion: "0.1.0",
      title: "Stage CSV import",
      description:
        "Stages a CSV dataset, explicit field mapping and target parameters into the active Enterprise Context without committing business objects.",
      effect: "WRITE",
      dataScope: "ENTERPRISE",
      authorization: {
        action: DATA_IMPORT_WRITE_ACTION_V010,
        resource: {
          type: DATA_IMPORT_AUTH_RESOURCE_V010,
          idSource: "DATA_SCOPE"
        }
      },
      inputSchema: {
        type: "object",
        additionalProperties: false,
        required: ["targetId", "csv", "mapping"],
        properties: {
          targetId: { type: "string", minLength: 1 },
          csv: { type: "string" },
          name: { type: "string" },
          targetParameters: { type: "object" },
          mapping: {
            type: "array",
            items: {
              type: "object",
              required: ["sourceColumn", "targetFieldId"],
              properties: {
                sourceColumn: { type: "string", minLength: 1 },
                targetFieldId: { type: "string", minLength: 1 }
              }
            }
          }
        }
      },
      outputSchema: importJobOutputSchema,
      binding: {
        type: "ACTION_HOST",
        commandCode: DATA_IMPORT_STAGE_CSV_COMMAND_V010,
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
      operationId: DATA_IMPORT_DRY_RUN_OPERATION_V010,
      capability: DATA_IMPORT_CAPABILITY_V010,
      operationVersion: "0.1.0",
      title: "Dry-run staged import",
      description:
        "Validates and normalizes all staged rows against the current effective target schema without committing business objects.",
      effect: "PLAN",
      dataScope: "ENTERPRISE",
      authorization: {
        action: DATA_IMPORT_WRITE_ACTION_V010,
        resource: {
          type: DATA_IMPORT_AUTH_RESOURCE_V010,
          idSource: "INPUT",
          inputKey: "importJobId"
        }
      },
      inputSchema: {
        type: "object",
        additionalProperties: false,
        required: ["importJobId"],
        properties: {
          importJobId: { type: "string", minLength: 1 },
          locale: { type: "string" }
        }
      },
      outputSchema: importJobOutputSchema,
      binding: {
        type: "ACTION_HOST",
        commandCode: DATA_IMPORT_DRY_RUN_COMMAND_V010,
        inputVersion: "0.1.0"
      },
      exposure: ["HUMAN", "PERSONAL_AGENT", "AUTOMATION"]
    }
  }, {
    kind: "platform.capability-operation",
    operation: {
      contractVersion: "0.1.0",
      operationId: DATA_IMPORT_COMMIT_OPERATION_V010,
      capability: DATA_IMPORT_CAPABILITY_V010,
      operationVersion: "0.1.0",
      title: "Commit staged import",
      description:
        "Commits a dry-run-ready import through its public target adapter and records a row-level receipt.",
      effect: "WRITE",
      dataScope: "ENTERPRISE",
      authorization: {
        action: DATA_IMPORT_WRITE_ACTION_V010,
        resource: {
          type: DATA_IMPORT_AUTH_RESOURCE_V010,
          idSource: "INPUT",
          inputKey: "importJobId"
        }
      },
      inputSchema: {
        type: "object",
        additionalProperties: false,
        required: ["importJobId"],
        properties: {
          importJobId: { type: "string", minLength: 1 }
        }
      },
      outputSchema: importJobOutputSchema,
      binding: {
        type: "ACTION_HOST",
        commandCode: DATA_IMPORT_COMMIT_COMMAND_V010,
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
      operationId: DATA_IMPORT_GET_OPERATION_V010,
      capability: DATA_IMPORT_CAPABILITY_V010,
      operationVersion: "0.1.0",
      title: "Read import job",
      description:
        "Reads one enterprise-scoped Data Import job, including dry-run and commit receipt when available.",
      effect: "READ",
      dataScope: "ENTERPRISE",
      authorization: {
        action: DATA_IMPORT_READ_ACTION_V010,
        resource: {
          type: DATA_IMPORT_AUTH_RESOURCE_V010,
          idSource: "INPUT",
          inputKey: "importJobId"
        }
      },
      inputSchema: {
        type: "object",
        additionalProperties: false,
        required: ["importJobId"],
        properties: {
          importJobId: { type: "string", minLength: 1 }
        }
      },
      outputSchema: importJobOutputSchema,
      binding: {
        type: "ACTION_HOST",
        commandCode: DATA_IMPORT_GET_COMMAND_V010,
        inputVersion: "0.1.0"
      },
      exposure: ["HUMAN", "PERSONAL_AGENT", "AUTOMATION"]
    }
  }, {
    kind: "platform.capability-operation",
    operation: {
      contractVersion: "0.1.0",
      operationId: DATA_IMPORT_ERROR_CSV_OPERATION_V010,
      capability: DATA_IMPORT_CAPABILITY_V010,
      operationVersion: "0.1.0",
      title: "Export import validation errors as CSV",
      description:
        "Returns a compact CSV of row-level dry-run errors for correction and re-import.",
      effect: "READ",
      dataScope: "ENTERPRISE",
      authorization: {
        action: DATA_IMPORT_READ_ACTION_V010,
        resource: {
          type: DATA_IMPORT_AUTH_RESOURCE_V010,
          idSource: "INPUT",
          inputKey: "importJobId"
        }
      },
      inputSchema: {
        type: "object",
        additionalProperties: false,
        required: ["importJobId"],
        properties: {
          importJobId: { type: "string", minLength: 1 }
        }
      },
      outputSchema: {
        type: "object",
        required: ["contractVersion", "csv"],
        properties: {
          contractVersion: { const: "0.1.0" },
          csv: { type: "string" }
        }
      },
      binding: {
        type: "ACTION_HOST",
        commandCode: DATA_IMPORT_ERROR_CSV_COMMAND_V010,
        inputVersion: "0.1.0"
      },
      exposure: ["HUMAN", "PERSONAL_AGENT", "AUTOMATION"]
    }
  }];
