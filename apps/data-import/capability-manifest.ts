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
  DATA_IMPORT_MAPPING_APPLY_COMMAND_V010,
  DATA_IMPORT_MAPPING_APPLY_OPERATION_V010,
  DATA_IMPORT_MAPPING_INSPECT_COMMAND_V010,
  DATA_IMPORT_MAPPING_INSPECT_OPERATION_V010,
  DATA_IMPORT_READ_ACTION_V010,
  DATA_IMPORT_STAGE_CSV_COMMAND_V010,
  DATA_IMPORT_STAGE_CSV_OPERATION_V010,
  DATA_IMPORT_STAGE_FILE_COMMAND_V010,
  DATA_IMPORT_STAGE_FILE_OPERATION_V010,
  DATA_IMPORT_WRITE_ACTION_V010
} from "./constants.js";

const mappingSchema = {
  type: "array",
  items: {
    type: "object",
    additionalProperties: false,
    required: ["targetFieldId"],
    properties: {
      sourceColumn: { type: "string", minLength: 1 },
      targetFieldId: { type: "string", minLength: 1 },
      transform: {
        oneOf: [{
          type: "object",
          additionalProperties: false,
          required: ["kind", "entries"],
          properties: {
            kind: { const: "VALUE_MAP" },
            entries: {
              type: "array",
              minItems: 1,
              items: {
                type: "object",
                additionalProperties: false,
                required: ["source", "target"],
                properties: {
                  source: {},
                  target: {}
                }
              }
            }
          }
        }, {
          type: "object",
          additionalProperties: false,
          required: ["kind", "value"],
          properties: {
            kind: { const: "CONSTANT" },
            value: {}
          }
        }]
      }
    }
  }
} as const;

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
          mapping: mappingSchema
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
      operationId: DATA_IMPORT_STAGE_FILE_OPERATION_V010,
      capability: DATA_IMPORT_CAPABILITY_V010,
      operationVersion: "0.1.0",
      title: "Stage spreadsheet import",
      description: "Stages a CSV or XLSX file in the active Enterprise Context, suggests deterministic field mappings and requires Human review before dry-run/commit.",
      effect: "WRITE",
      dataScope: "ENTERPRISE",
      authorization: { action: DATA_IMPORT_WRITE_ACTION_V010, resource: { type: DATA_IMPORT_AUTH_RESOURCE_V010, idSource: "DATA_SCOPE" } },
      inputSchema: { type: "object", additionalProperties: true, required: ["targetId", "file"], properties: { targetId: { type: "string", minLength: 1 }, file: { type: "object", required: ["name", "mediaType", "size", "contentBase64"], properties: { name: { type: "string", minLength: 1 }, mediaType: { type: "string", minLength: 1 }, size: { type: "number" }, contentBase64: { type: "string", minLength: 1 } } } } },
      outputSchema: importJobOutputSchema,
      binding: { type: "ACTION_HOST", commandCode: DATA_IMPORT_STAGE_FILE_COMMAND_V010, inputVersion: "0.1.0" },
      exposure: ["HUMAN", "PERSONAL_AGENT"],
      writeSafety: { idempotency: "HOST_REQUIRED", receipt: "HOST_REQUIRED" }
    }
  }, {
    kind: "platform.capability-operation",
    operation: {
      contractVersion: "0.1.0",
      operationId: DATA_IMPORT_MAPPING_INSPECT_OPERATION_V010,
      capability: DATA_IMPORT_CAPABILITY_V010,
      operationVersion: "0.1.0",
      title: "Inspect staged import mapping",
      description:
        "Reads the current staged import, source columns with bounded sample values, current mapping, value transforms, effective target schema and unmapped columns. Raw staged row values remain preserved even when a column is not mapped.",
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
          importJobId: { type: "string", minLength: 1 },
          locale: { type: "string" },
          sampleLimit: {
            type: "integer",
            minimum: 1,
            maximum: 20
          }
        }
      },
      outputSchema: {
        type: "object",
        required: [
          "contractVersion",
          "job",
          "schema",
          "sourceColumns",
          "constantMappings",
          "unmappedColumns",
          "rawSourcePreserved"
        ],
        properties: {
          contractVersion: { const: "0.1.0" },
          job: { type: "object" },
          schema: { type: "object" },
          sourceColumns: { type: "array" },
          constantMappings: { type: "array" },
          unmappedColumns: {
            type: "array",
            items: { type: "string" }
          },
          rawSourcePreserved: { const: true }
        }
      },
      binding: {
        type: "ACTION_HOST",
        commandCode: DATA_IMPORT_MAPPING_INSPECT_COMMAND_V010,
        inputVersion: "0.1.0"
      },
      exposure: ["HUMAN", "PERSONAL_AGENT"]
    }
  }, {
    kind: "platform.capability-operation",
    operation: {
      contractVersion: "0.1.0",
      operationId: DATA_IMPORT_MAPPING_APPLY_OPERATION_V010,
      capability: DATA_IMPORT_CAPABILITY_V010,
      operationVersion: "0.1.0",
      title: "Apply staged import mapping",
      description:
        "Applies explicit source-to-target mappings, deterministic VALUE_MAP transforms, and target-wide CONSTANT values, then by default dry-runs the import. CONSTANT is for facts confirmed for the whole batch when no source column represents that target field; it must not be simulated by coercing an unrelated source column. Agent-origin enum normalization is limited to governed aliases declared by the target schema; semantically unrelated coercions are rejected for Human review. Dry-run alone does not make a mapping reusable: a successful confirmed commit promotes the mapping to an enterprise Import Recipe.",
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
        required: ["importJobId", "mapping"],
        properties: {
          importJobId: { type: "string", minLength: 1 },
          mapping: mappingSchema,
          dryRun: { type: "boolean", default: true },
          locale: { type: "string" }
        }
      },
      outputSchema: importJobOutputSchema,
      binding: {
        type: "ACTION_HOST",
        commandCode: DATA_IMPORT_MAPPING_APPLY_COMMAND_V010,
        inputVersion: "0.1.0"
      },
      exposure: ["HUMAN", "PERSONAL_AGENT"],
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
