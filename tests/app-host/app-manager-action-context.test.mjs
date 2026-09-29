import test from "node:test";
import assert from "node:assert/strict";

import {
  createAppManagerActionHost
} from "../../dist/vendor/eidos/src/app-host/app-manager-action-host.js";

test("AppManagerActionHost forwards page active Context as Host request header", async () => {
  let captured;
  const host = createAppManagerActionHost({
    baseUrl: "http://app-manager.test",
    fetchImpl: async (url, init) => {
      captured = { url: String(url), init };
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "content-type": "application/json" }
      });
    }
  });

  await host.execute({
    contractVersion: "0.1.0",
    type: "command",
    command: {
      code: "enterprise-operating-graph.observatory.view.get",
      inputVersion: "0.2.0"
    },
    values: {
      resourceId: "eog:primary",
      activeContext: {
        contractVersion: "0.1.0",
        kind: "ENTERPRISE",
        contextId: "enterprise:ent_preview",
        enterpriseId: "ent_preview"
      }
    },
    sourceInteractionId: "eog.observe",
    actionId: "read",
    requiresConfirmation: false
  });

  assert.equal(captured.url, "http://app-manager.test/v1/actions");
  assert.equal(
    captured.init.headers["x-evo-context-id"],
    "enterprise:ent_preview"
  );
});

test("AppManagerActionHost omits Context header without page active Context", async () => {
  let captured;
  const host = createAppManagerActionHost({
    baseUrl: "http://app-manager.test",
    fetchImpl: async (url, init) => {
      captured = { url: String(url), init };
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "content-type": "application/json" }
      });
    }
  });

  await host.execute({
    contractVersion: "0.1.0",
    type: "command",
    command: { code: "test.read", inputVersion: "0.1.0" },
    values: {},
    sourceInteractionId: "test",
    actionId: "read",
    requiresConfirmation: false
  });

  assert.equal(
    Object.prototype.hasOwnProperty.call(
      captured.init.headers,
      "x-evo-context-id"
    ),
    false
  );
});
