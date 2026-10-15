import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import postgres from "postgres";

import { createPostgresHostAsyncReadExecutionV030 } from
  "../../dist/manager/agent-async-read-worker-runtime.js";
import { createPersonalAgentRunActionHandlersV010 } from
  "../../dist/agents/enterprise-agent/run-action-handlers.js";
import {
  createAgentRunStoreV010, createMemoryAgentRunEventStoreV010
} from "../../dist/manager/agent-run-store.js";

const url = process.env.PA02A_PROOF_DATABASE_URL;
const principal = {
  contractVersion: "0.1.0", subjectId: "pa04-c01-human",
  actorType: "HUMAN", identityProviderId: "isolated-fixture"
};
const context = {
  contractVersion: "0.1.0",
  personalContext: {
    contractVersion: "0.1.0", kind: "PERSONAL",
    contextId: "personal:pa04-c01-human",
    ownerSubjectId: principal.subjectId
  },
  activeContext: {
    contractVersion: "0.1.0", kind: "PERSONAL",
    contextId: "personal:pa04-c01-human"
  }
};
function handlerMap(runtime, provider, catalog) {
  return new Map(createPersonalAgentRunActionHandlersV010({
    runStore: createAgentRunStoreV010({
      eventStore: createMemoryAgentRunEventStoreV010(), eventId: randomUUID
    }),
    runExecutor: { resume() { throw Error("LEGACY_EXECUTOR_FORBIDDEN"); } },
    asyncRunRuntime: runtime,
    resolveLlmProvider: () => ({
      installedProviderIds: [provider.providerId], provider
    }),
    resolveIdentitySession: () => ({ contractVersion: "0.1.0", principal }),
    resolveContext: () => context,
    createToolCatalog: catalog,
    runId: randomUUID, now: () => new Date()
  }).map(handler => [handler.commandCode, handler]));
}
const action = (message, id) => ({
  contractVersion: "0.1.0", type: "command",
  command: { code: "enterprise-agent.run.start", inputVersion: "0.1.0" },
  values: { message }, sourceInteractionId: "pa04:c01:ui", actionId: id,
  requiresConfirmation: false
});

test("PA04 C01: real isolated Host/Worker/PG Run persists pre-inference budget denial; approved bound permits new Run", {
  skip: !url ? "Needs disposable PostgreSQL18" : false, timeout: 90000
}, async () => {
  const schema = "pa04_c01_" + randomUUID().replaceAll("-", "").slice(0, 12);
  const sql = postgres(url, { max: 2 });
  const provider = {
    providerId: "pa04-fixture-provider", modelId: "pa04-fixture-model",
    requests: [],
    async infer(request) {
      this.requests.push(structuredClone(request));
      return {
        contractVersion: "0.1.0", providerId: this.providerId,
        modelId: this.modelId, text: "Authorized bounded response",
        toolCalls: [], finishReason: "stop"
      };
    }
  };
  const seenQuotes = [];
  let inputBound = 3950;
  const certified = {
    providerId: provider.providerId, modelId: provider.modelId,
    contextWindowTokens: 4096, maxOutputTokens: 512,
    async quoteInputUpperBound(request) {
      seenQuotes.push(structuredClone(request));
      return {
        providerId: provider.providerId, modelId: provider.modelId,
        inputUpperBoundTokens: inputBound,
        sourceVersion: "isolated-tokenizer-quote-fixture-v1"
      };
    }
  };
  const catalog = () => ({
    list: () => [{
      contractVersion: "0.1.0", id: "test.read",
      modelName: "test_read", title: "Read authoritative facts",
      description: "READ only", effect: "READ",
      ownerPackageId: "isolated-fixture",
      inputSchema: { type: "object", properties: { id: { type: "string" } } }
    }],
    async invoke() { throw Error("NO_TOOL_DISPATCH_FOR_THIS_TEST"); }
  });
  let runtime;
  try {
    runtime = await createPostgresHostAsyncReadExecutionV030({
      connectionString: url, schema,
      deps: {
        resolveProvider: () => provider, createToolCatalog: catalog,
        contextWindow: certified
      }
    });
    const handlers = handlerMap(runtime, provider, catalog);
    const denied = await handlers.get("enterprise-agent.run.start").execute(
      action("small prompt but full tool/observations matter", "pa04:c01:deny"));
    assert.equal(denied.ok, true, JSON.stringify(denied.error));
    assert.equal(denied.result.run.state, "BLOCKED");
    assert.equal(denied.result.run.blocker.code,
      "PA04_CONTEXT_WINDOW_EXHAUSTED");
    assert.equal(provider.requests.length, 0, "no provider inference before admission");
    assert.equal(denied.result.run.modelFailureCount, 0,
      "deterministic context budget denial is not a transient model failure");
    assert.equal(seenQuotes.length, 1);
    assert.equal(seenQuotes[0].maxOutputTokens, 512);
    assert.ok(seenQuotes[0].messages.some(x => x.role === "system"));
    assert.ok(seenQuotes[0].messages.some(x => x.role === "developer"));
    assert.ok(seenQuotes[0].messages.some(x => x.role === "user"));
    assert.ok(seenQuotes[0].tools.some(x => x.name === "test_read"));
    const deniedId = denied.result.run.runId;
    await runtime.close(); runtime = undefined;
    runtime = await createPostgresHostAsyncReadExecutionV030({
      connectionString: url, schema,
      deps: {
        resolveProvider: () => provider, createToolCatalog: catalog,
        contextWindow: certified
      }
    });
    const recovered = await runtime.resume({
      runId: deniedId, principal, context
    });
    assert.equal(recovered.state, "BLOCKED");
    assert.equal(recovered.blocker.code, "PA04_CONTEXT_WINDOW_EXHAUSTED");
    assert.equal(provider.requests.length, 0);

    inputBound = 3000;
    const ok = await handlerMap(runtime, provider, catalog)
      .get("enterprise-agent.run.start").execute(
        action("another Run with certified headroom", "pa04:c01:allowed"));
    assert.equal(ok.ok, true, JSON.stringify(ok.error));
    assert.equal(ok.result.run.state, "SUCCEEDED");
    assert.equal(provider.requests.length, 1);
    assert.equal(provider.requests[0].maxOutputTokens, 512);

    console.log("PA04_C01_CERTIFIED_CONTEXT_WINDOW="+JSON.stringify({
      completeRequestQuoted:true,modelIdentityBound:true,
      outputReserved:true,overBudgetBlockedBeforeInference:true,
      blockedRunPersistsAcrossRestart:true,noUnapprovedProviderCalls:true,
      withinWindowAllowed:true,productionUsed:false
    }));
  } finally {
    await runtime?.close();
    try { await sql.unsafe('DROP SCHEMA IF EXISTS "' + schema + '" CASCADE'); }
    finally { await sql.end(); }
  }
});
