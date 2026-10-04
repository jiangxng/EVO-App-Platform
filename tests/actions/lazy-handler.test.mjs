import test from "node:test";
import assert from "node:assert/strict";

import {
  createLazyAppActionHandlerV010
} from "../../dist/actions/lazy-handler.js";
import {
  createAppActionRouter
} from "../../dist/actions/router.js";

const request = {
  contractVersion: "0.1.0",
  type: "command",
  command: {
    code: "plugin.lazy.test",
    inputVersion: "0.1.0"
  },
  values: {},
  sourceInteractionId: "test",
  actionId: "run",
  requiresConfirmation: false
};

test("inactive plugin action does not load its implementation", async () => {
  let loads = 0;
  let active = false;
  const handler = createLazyAppActionHandlerV010({
    packageId: "plugin.lazy",
    featureId: "plugin.lazy.default",
    commandCode: "plugin.lazy.test",
    async load() {
      loads += 1;
      return {
        packageId: "plugin.lazy",
        featureId: "plugin.lazy.default",
        commandCode: "plugin.lazy.test",
        async execute() {
          return { ok: true, result: { loaded: true } };
        }
      };
    }
  });
  const router = createAppActionRouter(
    [handler],
    featureId => active && featureId === "plugin.lazy.default"
  );

  const inactive = await router.execute(request);
  assert.equal(inactive.ok, false);
  assert.equal(inactive.error.code, "ACTION_FEATURE_NOT_ACTIVE");
  assert.equal(loads, 0);

  active = true;
  assert.equal((await router.execute(request)).ok, true);
  assert.equal((await router.execute(request)).ok, true);
  assert.equal(loads, 1);
});
