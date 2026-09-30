import type {
  PlatformCapabilityOperationContributionV010
} from "../../contracts/package.js";

export const LEDGER_RUNTIME_CONFIGURATION_CAPABILITY =
  "ledger.runtime.configuration";

export const LEDGER_RUNTIME_CONFIGURATION_DESCRIBE_OPERATION =
  "ledger.runtime.configuration.describe";

export const LEDGER_RUNTIME_CONFIGURATION_SECTION_READ_OPERATION =
  "ledger.runtime.configuration.section.read";

export const LEDGER_RUNTIME_CONFIGURATION_READ_ACTION =
  "ledger.runtime.configuration.read";

export const LEDGER_RUNTIME_CONFIGURATION_RESOURCE_TYPE =
  "ledger.runtime.configuration";

export const ledgerRuntimeConfigurationCapabilityContributionsV010:
  PlatformCapabilityOperationContributionV010[] = [
    {
      kind: "platform.capability-operation",
      operation: {
        contractVersion: "0.1.0",
        operationId: LEDGER_RUNTIME_CONFIGURATION_DESCRIBE_OPERATION,
        capability: LEDGER_RUNTIME_CONFIGURATION_CAPABILITY,
        operationVersion: "1.0.0",
        title: "Describe Ledger Runtime Configuration",
        description:
          "Returns the current Ledger Runtime template identity, semantic digest, configuration counts, source libraries, burn compatibility and readable sections without returning the entire configuration.",
        effect: "READ",
        dataScope: "INSTALLATION",
        authorization: {
          action: LEDGER_RUNTIME_CONFIGURATION_READ_ACTION,
          resource: {
            type: LEDGER_RUNTIME_CONFIGURATION_RESOURCE_TYPE,
            idSource: "NONE"
          }
        },
        inputSchema: {
          type: "object",
          additionalProperties: false,
          properties: {}
        },
        outputSchema: {
          type: "object",
          required: [
            "contractVersion",
            "kind",
            "template",
            "counts",
            "sourceLibraries",
            "compatibility",
            "sections"
          ],
          properties: {
            contractVersion: { const: "0.1.0" },
            kind: {
              const: "evo.ledger-runtime.configuration-description"
            },
            template: { type: "object" },
            counts: { type: "object" },
            sourceLibraries: { type: "array" },
            compatibility: { type: "object" },
            sections: { type: "array" }
          }
        },
        binding: {
          type: "ACTION_HOST",
          commandCode:
            "evo-ledger-runtime-configurator.describe-runtime-configuration",
          inputVersion: "0.1.0"
        },
        exposure: [
          "HUMAN",
          "PERSONAL_AGENT",
          "EXTERNAL_AGENT",
          "AUTOMATION"
        ]
      }
    },
    {
      kind: "platform.capability-operation",
      operation: {
        contractVersion: "0.1.0",
        operationId: LEDGER_RUNTIME_CONFIGURATION_SECTION_READ_OPERATION,
        capability: LEDGER_RUNTIME_CONFIGURATION_CAPABILITY,
        operationVersion: "1.0.0",
        title: "Read Ledger Runtime Configuration Section",
        description:
          "Reads one bounded page from the current Ledger Runtime configuration. Supported sections are accounts, applications, dictionaries and postingRules. Pagination cursors are bound to the current semantic digest.",
        effect: "READ",
        dataScope: "INSTALLATION",
        authorization: {
          action: LEDGER_RUNTIME_CONFIGURATION_READ_ACTION,
          resource: {
            type: LEDGER_RUNTIME_CONFIGURATION_RESOURCE_TYPE,
            idSource: "NONE"
          }
        },
        inputSchema: {
          type: "object",
          additionalProperties: false,
          required: ["section"],
          properties: {
            section: {
              enum: [
                "accounts",
                "applications",
                "dictionaries",
                "postingRules"
              ]
            },
            pageSize: {
              type: "integer",
              minimum: 1,
              maximum: 100
            },
            cursor: {
              type: "string",
              minLength: 1
            }
          }
        },
        outputSchema: {
          type: "object",
          required: [
            "contractVersion",
            "kind",
            "templateId",
            "semanticDigest",
            "section",
            "offset",
            "pageSize",
            "total",
            "items",
            "nextCursor"
          ],
          properties: {
            contractVersion: { const: "0.1.0" },
            kind: {
              const: "evo.ledger-runtime.configuration-section-page"
            },
            templateId: { type: "string" },
            semanticDigest: { type: "string" },
            section: {
              enum: [
                "accounts",
                "applications",
                "dictionaries",
                "postingRules"
              ]
            },
            offset: { type: "integer", minimum: 0 },
            pageSize: { type: "integer", minimum: 1, maximum: 100 },
            total: { type: "integer", minimum: 0 },
            items: { type: "array" },
            nextCursor: {
              type: ["string", "null"]
            }
          }
        },
        binding: {
          type: "ACTION_HOST",
          commandCode:
            "evo-ledger-runtime-configurator.read-runtime-configuration-section",
          inputVersion: "0.1.0"
        },
        exposure: [
          "HUMAN",
          "PERSONAL_AGENT",
          "EXTERNAL_AGENT",
          "AUTOMATION"
        ]
      }
    }
  ];
