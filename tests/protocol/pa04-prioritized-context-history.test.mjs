import test from "node:test";
import assert from "node:assert/strict";
import { fitCertifiedModelContextHistoryV010 } from
  "../../dist/agents/enterprise-agent/pa04-prioritized-context-history.js";

const providerId = "local-certified", modelId = "local-ctx-v1";
function fixture(size = 12) {
  const history = Array.from({ length: size }, (_, index) => ({
    role: index % 2 ? "assistant" : "user",
    content: "historic-" + index + " " + "past discourse ".repeat(25)
  }));
  const request = {
    contractVersion: "0.1.0",
    messages: [
      { role: "system", content: "SYSTEM: no unauthorized tools" },
      ...history,
      { role: "user", content: "CURRENT HUMAN: do not repeat completed work" },
      { role: "developer", content: "WORKING STATE: approved task, authorized Principal, receipts, outstanding decisions" }
    ],
    tools: [{
      name: "authorized_read",
      description: "Authorized Host capability",
      inputSchema: { type: "object", properties: { id: { type: "string" } } }
    }],
    maxOutputTokens: 200
  };
  return { history, request };
}
function policy(bound, overrides = {}) {
  return {
    providerId, modelId, contextWindowTokens: 2000,
    maxOutputTokens: 200,
    quoteInputUpperBound: async request => ({
      providerId, modelId, inputUpperBoundTokens: bound(request),
      sourceVersion: "isolated-complete-tokenizer-v1"
    }),
    ...overrides
  };
}
const fit = (request, history, port) =>
  fitCertifiedModelContextHistoryV010({
    providerId, modelId, request, history, port
  });
const countHistory = request => request.messages.length - 3;
const boundByHistory = request => 1500 + 50 * countHistory(request);

test("PA04 C01: fit long overflow by trimming old discourse only, keeping working state and newest turns", async () => {
  const { request, history } = fixture();
  const original = structuredClone(request);
  const quotes = [];
  const result = await fit(request, history, policy(async req => {
    quotes.push(structuredClone(req));
    return boundByHistory(req);
  }));
  assert.equal(result.removedOldHistoryMessages, 6);
  assert.equal(result.inputUpperBoundTokens, 1800);
  assert.deepEqual(result.request.messages, [
    original.messages[0], ...original.messages.slice(7, 13),
    ...original.messages.slice(-2)
  ]);
  assert.deepEqual(result.request.tools, original.tools);
  assert.equal(result.request.maxOutputTokens, 200);
  assert.equal(result.request.messages.at(-1).content,
    original.messages.at(-1).content);
  assert.deepEqual(result.request.messages.slice(-6, -2),
    original.messages.slice(-6, -2),
    "four most recent ordinary turns are retained");
  assert.equal(quotes.length, 4, "initial, 25%, 50%, then 75% fit");
  assert.deepEqual(request, original, "durable source/request never changes");
});

test("PA04 C01: if complete request fits, no conversation is removed", async () => {
  const { request, history } = fixture(6);
  const result = await fit(request, history, policy(() => 1700));
  assert.equal(result.removedOldHistoryMessages, 0);
  assert.strictEqual(result.request, request);
});

test("PA04 C01: protected system, Human goal, working state or tools alone over limit fails closed", async () => {
  const { request, history } = fixture(10);
  const seen = [];
  const guarded = policy(req => {
    seen.push(req);
    // Mandatory system/developer + current goal and tool schemas already
    // exceed the budget even after all eligible old discourse was trimmed.
    return 1900 + countHistory(req);
  });
  await assert.rejects(fit(request, history, guarded), {
    message: "PA04_CONTEXT_WINDOW_EXHAUSTED"
  });
  assert.equal(seen.length, 5, "max five certifications, no infinite retry");
  for (const r of seen) {
    assert.equal(r.messages[0].content, request.messages[0].content);
    assert.equal(r.messages.at(-2).content, request.messages.at(-2).content);
    assert.equal(r.messages.at(-1).content, request.messages.at(-1).content);
    assert.deepEqual(r.tools, request.tools);
    assert.ok(countHistory(r) >= 4);
  }
});

test("PA04 C01: stale/malformed history span fails closed instead of removing privileged blocks", async () => {
  const { request, history } = fixture(6);
  const malformed = structuredClone(request);
  malformed.messages[4] = { role: "developer", content: "SPOOFED" };
  await assert.rejects(fit(malformed, history, policy(() => 1000)), {
    message: "PA04_CONTEXT_WINDOW_HISTORY_MISMATCH"
  });
  const shifted = structuredClone(request);
  shifted.messages.splice(-2, 0, {
    role: "developer", content: "additional authoritative state"
  });
  await assert.rejects(fit(shifted, history, policy(() => 1000)), {
    message: "PA04_CONTEXT_WINDOW_HISTORY_MISMATCH"
  });
});

test("PA04 C01: unknown quote, model mismatch and output mismatch are never cured by trimming", async () => {
  const { request, history } = fixture(9);
  for (const p of [
    policy(() => undefined),
    policy(() => 1500, { modelId: "wrong" }),
    policy(() => 1500, { maxOutputTokens: 150 })
  ]) {
    await assert.rejects(fit(request, history, p),
      /PA04_CONTEXT_WINDOW_(INPUT_BOUND_UNVERIFIED|MODEL_MISMATCH|OUTPUT_RESERVE_MISMATCH)/);
  }
});

test("PA04 C01: short history cannot sacrifice its recent four-turn working continuity", async () => {
  const { request, history } = fixture(4);
  let quotes = 0;
  await assert.rejects(fit(request, history, policy(req => {
    quotes++;
    return boundByHistory(req) + 500;
  })), { message: "PA04_CONTEXT_WINDOW_EXHAUSTED" });
  assert.equal(quotes, 1);
});
