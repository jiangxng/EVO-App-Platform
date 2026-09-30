import type {
  AppActionExecutionResultV010,
  AppActionHandler,
  AppActionRequestV010,
  JsonValue
} from "../../actions/contracts.js";
import {
  describeLedgerRuntimeConfigurationV010,
  readLedgerRuntimeConfigurationSectionV010,
  type LedgerRuntimeConfigurationSectionV010
} from "./capability-operations.js";
import type { LedgerRuntimeConfiguratorService } from "./service.js";

export const LEDGER_RUNTIME_CONFIGURATION_DESCRIBE_COMMAND =
  "evo-ledger-runtime-configurator.describe-runtime-configuration";
export const LEDGER_RUNTIME_CONFIGURATION_SECTION_READ_COMMAND =
  "evo-ledger-runtime-configurator.read-runtime-configuration-section";

function jsonValue(value: unknown): JsonValue {
  return JSON.parse(JSON.stringify(value)) as JsonValue;
}

function errorResult(
  request: AppActionRequestV010,
  error: unknown
): AppActionExecutionResultV010 {
  const message = error instanceof Error ? error.message : String(error);
  const known = new Set([
    "LEDGER_CONFIGURATION_SECTION_INVALID",
    "LEDGER_CONFIGURATION_PAGE_SIZE_INVALID",
    "LEDGER_CONFIGURATION_CURSOR_INVALID",
    "LEDGER_CONFIGURATION_CURSOR_SECTION_MISMATCH",
    "LEDGER_CONFIGURATION_CURSOR_STALE",
    "LEDGER_CONFIGURATION_CURSOR_OFFSET_INVALID",
    "LEDGER_RUNTIME_CONFIGURATION_INPUT_VERSION_UNSUPPORTED"
  ]);
  return {
    ok: false,
    correlationId: request.runtimeInstanceId ?? request.sourceInteractionId,
    error: {
      code: known.has(message)
        ? message
        : "LEDGER_RUNTIME_CONFIGURATION_READ_FAILED",
      message
    }
  };
}

function sectionValue(
  value: JsonValue | undefined
): LedgerRuntimeConfigurationSectionV010 | undefined {
  return typeof value === "string"
    ? value as LedgerRuntimeConfigurationSectionV010
    : undefined;
}

export function createLedgerRuntimeConfiguratorCapabilityActionHandlers(
  service: LedgerRuntimeConfiguratorService
): AppActionHandler[] {
  const describe: AppActionHandler = {
    packageId: "evo-ledger-runtime-configurator",
    featureId: "evo-ledger-runtime-configurator.default",
    commandCode: LEDGER_RUNTIME_CONFIGURATION_DESCRIBE_COMMAND,
    async execute(request) {
      try {
        if (request.command.inputVersion !== "0.1.0") {
          throw new Error(
            "LEDGER_RUNTIME_CONFIGURATION_INPUT_VERSION_UNSUPPORTED"
          );
        }
        return {
          ok: true,
          correlationId:
            request.runtimeInstanceId ?? request.sourceInteractionId,
          result: jsonValue(describeLedgerRuntimeConfigurationV010(service))
        };
      } catch (error) {
        return errorResult(request, error);
      }
    }
  };

  const readSection: AppActionHandler = {
    packageId: "evo-ledger-runtime-configurator",
    featureId: "evo-ledger-runtime-configurator.default",
    commandCode: LEDGER_RUNTIME_CONFIGURATION_SECTION_READ_COMMAND,
    async execute(request) {
      try {
        if (request.command.inputVersion !== "0.1.0") {
          throw new Error(
            "LEDGER_RUNTIME_CONFIGURATION_INPUT_VERSION_UNSUPPORTED"
          );
        }
        const section = sectionValue(request.values.section);
        if (!section) {
          throw new Error("LEDGER_CONFIGURATION_SECTION_INVALID");
        }
        const pageSizeValue = request.values.pageSize;
        const cursorValue = request.values.cursor;
        if (
          pageSizeValue !== undefined
          && typeof pageSizeValue !== "number"
        ) {
          throw new Error("LEDGER_CONFIGURATION_PAGE_SIZE_INVALID");
        }
        if (
          cursorValue !== undefined
          && typeof cursorValue !== "string"
        ) {
          throw new Error("LEDGER_CONFIGURATION_CURSOR_INVALID");
        }
        const pageSize = pageSizeValue as number | undefined;
        const cursor = cursorValue as string | undefined;

        return {
          ok: true,
          correlationId:
            request.runtimeInstanceId ?? request.sourceInteractionId,
          result: jsonValue(
            readLedgerRuntimeConfigurationSectionV010(service, {
              section,
              ...(pageSize === undefined ? {} : { pageSize }),
              ...(cursor === undefined ? {} : { cursor })
            })
          )
        };
      } catch (error) {
        return errorResult(request, error);
      }
    }
  };

  return [describe, readSection];
}
