import type {
  AppActionHandler
} from "./contracts.js";

export function createLazyAppActionHandlerV010(input: {
  packageId: string;
  featureId: string;
  commandCode: string;
  load(): Promise<AppActionHandler>;
}): AppActionHandler {
  let loaded: Promise<AppActionHandler> | undefined;

  const resolve = async (): Promise<AppActionHandler> => {
    loaded ??= input.load().then(handler => {
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
    });
    return loaded;
  };

  return {
    packageId: input.packageId,
    featureId: input.featureId,
    commandCode: input.commandCode,
    async execute(request, context) {
      const handler = await resolve();
      return handler.execute(request, context);
    }
  };
}
