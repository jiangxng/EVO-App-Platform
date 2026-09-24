import type {
  AppActionExecutionResultV010,
  AppActionHandler,
  AppActionRequestV010,
  JsonValue
} from "../../actions/contracts.js";
import type { LedgerRuntimeConfiguratorService } from "./service.js";

export function createLedgerRuntimeConfiguratorActionHandler(
  service: LedgerRuntimeConfiguratorService
): AppActionHandler {
  return {
    packageId: "evo-ledger-runtime-configurator",
    featureId: "evo-ledger-runtime-configurator.default",
    commandCode: "evo-ledger-runtime-configurator.validate-default",
    async execute(request: AppActionRequestV010): Promise<AppActionExecutionResultV010> {
      const validation = service.validate();
      const result = JSON.parse(JSON.stringify({
        ...service.getSummary(),
        validation
      })) as JsonValue;

      return {
        ok: validation.ok,
        correlationId: request.runtimeInstanceId ?? request.sourceInteractionId,
        result
      };
    }
  };
}
