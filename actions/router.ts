import type { PlatformRequestContextV010 } from "../contracts/platform-services.js";
import type {
  AppActionExecutionResultV010,
  AppActionHandler,
  AppActionRequestV010
} from "./contracts.js";

export interface AppActionRouter {
  execute(
    request: AppActionRequestV010,
    context?: PlatformRequestContextV010
  ): Promise<AppActionExecutionResultV010>;
}

export type AppActionPreExecuteV010 = (input: {
  handler: AppActionHandler;
  request: AppActionRequestV010;
  context?: PlatformRequestContextV010;
}) =>
  | Promise<AppActionExecutionResultV010 | undefined>
  | AppActionExecutionResultV010
  | undefined;

export function createAppActionRouter(
  handlers: readonly AppActionHandler[],
  isFeatureActive: (featureId: string) => boolean,
  preExecute?: AppActionPreExecuteV010
): AppActionRouter {
  const byCommand = new Map<string, AppActionHandler>();

  for (const handler of handlers) {
    if (byCommand.has(handler.commandCode)) {
      throw new Error(`DUPLICATE_ACTION_HANDLER: ${handler.commandCode}`);
    }
    byCommand.set(handler.commandCode, handler);
  }

  return {
    async execute(request, context) {
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

      const blocked = await preExecute?.({ handler, request, context });
      if (blocked) return blocked;

      return handler.execute(request, context);
    }
  };
}
