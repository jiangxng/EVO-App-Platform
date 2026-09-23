import type {
  AppActionExecutionResultV010,
  AppActionHandler,
  AppActionRequestV010
} from "./contracts.js";

export interface AppActionRouter {
  execute(request: AppActionRequestV010): Promise<AppActionExecutionResultV010>;
}

export function createAppActionRouter(
  handlers: readonly AppActionHandler[],
  isFeatureActive: (featureId: string) => boolean
): AppActionRouter {
  const byCommand = new Map<string, AppActionHandler>();

  for (const handler of handlers) {
    if (byCommand.has(handler.commandCode)) {
      throw new Error(`DUPLICATE_ACTION_HANDLER: ${handler.commandCode}`);
    }
    byCommand.set(handler.commandCode, handler);
  }

  return {
    async execute(request) {
      if (request.contractVersion !== "0.1.0" || request.type !== "command") {
        return {
          ok: false,
          error: {
            code: "ACTION_REQUEST_UNSUPPORTED",
            message: "Only command ActionRequest contract 0.1.0 is supported."
          }
        };
      }

      const handler = byCommand.get(request.command.code);
      if (!handler) {
        return {
          ok: false,
          error: {
            code: "ACTION_HANDLER_NOT_FOUND",
            message: `No active application handler is registered for '${request.command.code}'.`
          }
        };
      }

      if (!isFeatureActive(handler.featureId)) {
        return {
          ok: false,
          error: {
            code: "ACTION_FEATURE_NOT_ACTIVE",
            message: `Feature '${handler.featureId}' is not active.`
          }
        };
      }

      return handler.execute(request);
    }
  };
}
