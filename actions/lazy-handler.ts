import type {
  AppActionExecutionResultV010,
  AppActionHandler,
  AppActionRequestV010
} from "./contracts.js";
import type {
  PlatformRequestContextV010
} from "../contracts/platform-services.js";

export function createLazyAppActionHandlerV010(input: {
  packageId: string;
  featureId: string;
  commandCode: string;
  guard?: (
    request: AppActionRequestV010,
    context?: PlatformRequestContextV010
  ) =>
    | AppActionExecutionResultV010
    | undefined
    | Promise<AppActionExecutionResultV010 | undefined>;
  load(): Promise<AppActionHandler>;
}): AppActionHandler {
  let loaded: Promise<AppActionHandler> | undefined;

  const resolve = async (): Promise<AppActionHandler> => {
    loaded ??= input.load()
      .then(handler => {
        if (
          handler.packageId !== input.packageId
          || handler.featureId !== input.featureId
          || handler.commandCode !== input.commandCode
        ) {
          throw new Error(
            "LAZY_ACTION_HANDLER_IDENTITY_MISMATCH: "
            + input.packageId + "/" + input.featureId + "/" + input.commandCode
          );
        }
        return handler;
      })
      .catch(error => {
        loaded = undefined;
        throw error;
      });
    return loaded;
  };

  return {
    packageId: input.packageId,
    featureId: input.featureId,
    commandCode: input.commandCode,
    async execute(request, context) {
      const blocked = await input.guard?.(request, context);
      if (blocked) return blocked;
      const handler = await resolve();
      return handler.execute(request, context);
    }
  };
}
