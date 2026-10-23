import type {
  AppActionExecutionResultV010,
  AppActionHandler,
  AppActionRequestV010,
  JsonValue
} from "../../actions/contracts.js";
import type { LedgerRuntimeConfiguratorService } from "./service.js";

/** Compatibility binding: retain the existing process-local draft across disable.
 * No sockets, timers or durable store are owned by this service. */
export function createLedgerRuntimeConfiguratorResolver(input: {
  isActive(): boolean;
  loadFactory?: () => Promise<() => LedgerRuntimeConfiguratorService>;
}): () => Promise<LedgerRuntimeConfiguratorService> {
  let pending: Promise<LedgerRuntimeConfiguratorService> | undefined;
  const requireActive = () => {
    if (!input.isActive()) throw new Error("LEDGER_CONFIGURATOR_NOT_ACTIVE");
  };
  return async () => {
    requireActive();
    pending ??= Promise.resolve().then(async () => {
      const factory = await (input.loadFactory
        ? input.loadFactory()
        : import("./service.js").then(module => module.createLedgerRuntimeConfiguratorService));
      // A disable while importing must not construct the late service.
      requireActive();
      return factory();
    }).catch(error => { pending = undefined; throw error; });
    const service = await pending;
    requireActive();
    return service;
  };
}

export function createLedgerRuntimeConfiguratorActionHandler(
  source: LedgerRuntimeConfiguratorService | (() => Promise<LedgerRuntimeConfiguratorService>)
): AppActionHandler {
  return {
    packageId: "evo-ledger-runtime-configurator",
    featureId: "evo-ledger-runtime-configurator.default",
    commandCode: "evo-ledger-runtime-configurator.validate-default",
    async execute(request: AppActionRequestV010): Promise<AppActionExecutionResultV010> {
      const service = typeof source === "function" ? await source() : source;
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
