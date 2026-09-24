import type {
  AppActionExecutionResultV010,
  AppActionHandler,
  AppActionRequestV010
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
      return {
        ok: validation.ok,
        correlationId: request.runtimeInstanceId ?? request.sourceInteractionId,
        result: {
          ...service.getSummary(),
          validation
        }
      };
    }
  };
}
