import type { AppActionHandler } from "../../actions/contracts.js";
import type { AppActionRouter } from "../../actions/router.js";
import { createLazyAppActionHandlerV010 } from "../../actions/lazy-handler.js";
import type { AuthorizationProviderV010 } from "../../contracts/platform-services.js";
import {
  PURCHASE_ATTENTION_COMMAND_V010,
  PURCHASE_ATTENTION_FEATURE_ID_V010,
  PURCHASE_ATTENTION_PACKAGE_ID_V010
} from "./package.js";

export { purchaseAttentionPackageV010 } from "./package.js";

/**
 * Plugin-owned opt-in Host composition, NOT an additional Agent registry.
 * Host startup loads this module only for trusted OPT_IN configuration.
 *
 * Registration is not installation. AppManager still requires an explicit
 * administrator install and the original Trading Reference dependency.
 * Both the source read and derived read enter the SAME live Action Router.
 */
export function createPurchaseAttentionHostActionHandlerV010(input: {
  resolveSourceRouter(): AppActionRouter;
  resolveAuthorizationProvider(): AuthorizationProviderV010 | undefined;
}): AppActionHandler {
  return createLazyAppActionHandlerV010({
    packageId: PURCHASE_ATTENTION_PACKAGE_ID_V010,
    featureId: PURCHASE_ATTENTION_FEATURE_ID_V010,
    commandCode: PURCHASE_ATTENTION_COMMAND_V010,
    async load() {
      const { createPurchaseAttentionActionHandlerV010 } =
        await import("./operation.js");
      return createPurchaseAttentionActionHandlerV010({
        sourceRouter: {
          execute(request, context) {
            // Must not call the Trading Reference service directly: its
            // Feature and live authorization gate are evaluated independently.
            return input.resolveSourceRouter().execute(request, context);
          }
        },
        resolveAuthorizationProvider: input.resolveAuthorizationProvider
      });
    }
  });
}
