import test from "node:test";
import assert from "node:assert/strict";

import { createHostContextRegistryV010 } from "../../dist/manager/context-registry.js";
import { createEnterpriseAgentChatActionHandler } from "../../dist/agents/enterprise-agent/chat-action-handler.js";

const aliceSession = {
  contractVersion: "0.1.0",
  sessionId: "session:alice",
  principal: {
    contractVersion: "0.1.0",
    subjectId: "alice",
    actorType: "HUMAN",
    identityProviderId: "test.identity",
    displayName: "Alice"
  },
  issuedAt: "2026-09-26T00:00:00.000Z"
};

function registryWithEnterprise() {
  return createHostContextRegistryV010({
    personalContext: {
      contractVersion: "0.1.0",
      kind: "PERSONAL",
      contextId: "personal:alice",
      ownerSubjectId: "alice",
      displayName: "Alice"
    },
    enterpriseContexts: [{
      contractVersion: "0.1.0",
      kind: "ENTERPRISE",
      contextId: "enterprise:acme",
      enterpriseId: "acme",
      enterpriseProviderId: "test.enterprise-directory",
      displayName: "Acme"
    }]
  });
}

test("Person-first Host Context defaults to Personal Context", () => {
  const registry = registryWithEnterprise();
  const resolved = registry.resolve();

  assert.equal(resolved.activeContext.kind, "PERSONAL");
  assert.equal(resolved.activeContext.contextId, "personal:alice");
  assert.equal(resolved.personalContext.ownerSubjectId, "alice");
  assert.equal(resolved.enterpriseContext, undefined);
});

test("Host can resolve a registered Enterprise Context without changing Personal Agent identity", () => {
  const registry = registryWithEnterprise();
  const resolved = registry.resolve({
    contractVersion: "0.1.0",
    kind: "ENTERPRISE",
    contextId: "enterprise:acme",
    enterpriseId: "acme"
  });

  assert.equal(resolved.personalContext.contextId, "personal:alice");
  assert.equal(resolved.activeContext.kind, "ENTERPRISE");
  assert.equal(resolved.activeContext.contextId, "enterprise:acme");
  assert.equal(resolved.enterpriseContext.enterpriseId, "acme");
  assert.equal(resolved.enterpriseContext.contextId, "enterprise:acme");
});

test("unknown Enterprise Context selection fails closed", () => {
  const registry = registryWithEnterprise();

  assert.throws(
    () => registry.resolve({
      contractVersion: "0.1.0",
      kind: "ENTERPRISE",
      contextId: "enterprise:forged",
      enterpriseId: "forged"
    }),
    /CONTEXT_NOT_AVAILABLE/
  );
});

test("Personal Agent chat cannot manufacture an Enterprise Context from request values", async () => {
  const registry = createHostContextRegistryV010({
    personalContext: {
      contractVersion: "0.1.0",
      kind: "PERSONAL",
      contextId: "personal:default"
    }
  });

  const handler = createEnterpriseAgentChatActionHandler({
    resolveIdentitySession() {
      return aliceSession;
    },
    resolveContext(selection) {
      return registry.resolve(selection);
    },
    resolveLlmProvider() {
      throw new Error("LLM resolution must not run for a forged Context");
    },
    createToolCatalog() {
      throw new Error("Tool catalog must not be built for a forged Context");
    }
  });

  const result = await handler.execute({
    contractVersion: "0.1.0",
    type: "command",
    command: {
      code: "enterprise-agent.chat",
      inputVersion: "0.1.0"
    },
    values: {
      message: "帮我看看这家公司",
      activeContext: {
        kind: "ENTERPRISE",
        contextId: "enterprise:not-authorized",
        enterpriseId: "not-authorized"
      }
    },
    sourceInteractionId: "forged-context-test",
    actionId: "send",
    requiresConfirmation: false
  });

  assert.equal(result.ok, false);
  assert.equal(result.error.code, "CONTEXT_NOT_AVAILABLE");
});

test("registered Context references are the only selectable Contexts", () => {
  const registry = registryWithEnterprise();
  assert.deepEqual(registry.list(), [
    {
      contractVersion: "0.1.0",
      kind: "PERSONAL",
      contextId: "personal:alice"
    },
    {
      contractVersion: "0.1.0",
      kind: "ENTERPRISE",
      contextId: "enterprise:acme",
      enterpriseId: "acme"
    }
  ]);
});


test("Personal Agent accepts a Host-registered Enterprise Context and passes it into read-only reasoning", async () => {
  const registry = registryWithEnterprise();
  let toolContext;
  const handler = createEnterpriseAgentChatActionHandler({
    resolveIdentitySession() {
      return aliceSession;
    },
    resolveContext(selection) {
      return registry.resolve(selection);
    },
    resolveLlmProvider() {
      return {
        installedProviderIds: ["test"],
        provider: {
          providerId: "test",
          modelId: "test-model",
          async infer() {
            return {
              contractVersion: "0.1.0",
              providerId: "test",
              modelId: "test-model",
              text: "ok",
              toolCalls: [],
              usage: { inputTokens: 0, outputTokens: 0 },
              finishReason: "stop"
            };
          }
        }
      };
    },
    createToolCatalog(_locale, context, principal) {
      toolContext = context;
      assert.equal(principal.subjectId, "alice");
      return {
        list() { return []; },
        async invoke() {
          throw new Error("No tools expected");
        }
      };
    }
  });

  const result = await handler.execute({
    contractVersion: "0.1.0",
    type: "command",
    command: {
      code: "enterprise-agent.chat",
      inputVersion: "0.1.0"
    },
    values: {
      message: "Summarize this enterprise context",
      activeContext: {
        kind: "ENTERPRISE",
        contextId: "enterprise:acme",
        enterpriseId: "acme"
      }
    },
    sourceInteractionId: "registered-enterprise-context-test",
    actionId: "chat.send",
    requiresConfirmation: false
  });

  assert.equal(result.ok, true);
  assert.equal(toolContext.activeContext.kind, "ENTERPRISE");
  assert.equal(toolContext.enterpriseContext.enterpriseId, "acme");
  assert.equal(toolContext.enterpriseContext.displayName, "Acme");
  assert.equal(result.result.context.activeContext.contextId, "enterprise:acme");
});
