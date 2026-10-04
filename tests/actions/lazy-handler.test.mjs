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


test("lazy handler guard blocks dependent plugin loading", async () => {
  let loads = 0;
  let dependencyActive = false;
  const handler = createLazyAppActionHandlerV010({
    packageId: "plugin.viewer",
    featureId: "plugin.viewer.default",
    commandCode: "plugin.viewer.preview",
    guard() {
      return dependencyActive
        ? undefined
        : {
            ok: false,
            error: {
              code: "DEPENDENCY_NOT_ACTIVE",
              message: "Dependency is not active."
            }
          };
    },
    async load() {
      loads += 1;
      return {
        packageId: "plugin.viewer",
        featureId: "plugin.viewer.default",
        commandCode: "plugin.viewer.preview",
        async execute() {
          return { ok: true };
        }
      };
    }
  });
  const router = createAppActionRouter([handler], () => true);

  const blocked = await router.execute({
    ...request,
    command: {
      code: "plugin.viewer.preview",
      inputVersion: "0.1.0"
    }
  });
  assert.equal(blocked.ok, false);
  assert.equal(blocked.error.code, "DEPENDENCY_NOT_ACTIVE");
  assert.equal(loads, 0);

  dependencyActive = true;
  const allowed = await router.execute({
    ...request,
    command: {
      code: "plugin.viewer.preview",
      inputVersion: "0.1.0"
    }
  });
  assert.equal(allowed.ok, true);
  assert.equal(loads, 1);
});
