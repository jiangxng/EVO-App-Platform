import test from "node:test";
import assert from "node:assert/strict";

import {
  admitCertifiedModelContextWindowV010
} from "../../dist/agents/enterprise-agent/pa04-certified-context-window.js";

const providerId = "host-certified-local", modelId = "local-model-v1";
function modelRequest() {
  return {
    contractVersion: "0.1.0",
    messages: [
      { role: "system", content: "Protected operating rules remain intact." },
      { role: "assistant", content: "Earlier thread working state." },
      { role: "user", content: "Current task and intent." },
      { role: "developer", content: "Authorized Principal / effective scope / observations." }
    ],
    tools: [{
      name: "read_authority",
      description: "Current permitted READ tool",
      inputSchema: { type: "object", properties: { id: { type: "string" } } }
    }],
    maxOutputTokens: 512
  };
}
function policy(quoteInputUpperBound, override = {}) {
  return {
    providerId, modelId, contextWindowTokens: 4096,
    maxOutputTokens: 512, quoteInputUpperBound, ...override
  };
}
function certificate(tokens, override = {}) {
  return {
    providerId, modelId, inputUpperBoundTokens: tokens,
    sourceVersion: "isolated-certified-tokenizer-fixture-v1", ...override
  };
}
const admit = (request, port) => admitCertifiedModelContextWindowV010({
  providerId, modelId, request, port
});

test("PA04 C01: a certified quote sees complete system, developer, history, tools, schema and output reserve", async () => {
  const request = modelRequest();
  let seen;
  const p = policy(async actual => {
    seen = actual;
    return certificate(2400);
  });
  const result = await admit(request, p);
  assert.deepEqual(seen, request);
  assert.deepEqual(seen.messages.map(m => m.role), [
    "system", "assistant", "user", "developer"
  ]);
  assert.match(JSON.stringify(seen.tools), /read_authority/);
  assert.match(JSON.stringify(seen.tools), /properties/);
  assert.match(seen.messages.at(-1).content, /observations/);
  assert.equal(seen.maxOutputTokens, 512);
  assert.deepEqual(result, {
    inputUpperBoundTokens: 2400, remainingInputTokens: 1184
  });
});

test("PA04 C01: exact prompt + completion boundary is allowed; one more token fails closed", async () => {
  const request = modelRequest();
  const exact = await admit(request, policy(async () => certificate(3584)));
  assert.equal(exact.remainingInputTokens, 0);
  await assert.rejects(
    admit(request, policy(async () => certificate(3585))),
    { message: "PA04_CONTEXT_WINDOW_EXHAUSTED" }
  );
});

test("PA04 C01: missing, partial, thrown or identity-mismatched certifications never pass", async () => {
  const request = modelRequest();
  const samples = [
    async () => undefined,
    async () => { throw Error("tokenizer unavailable"); },
    async () => certificate(1000, { modelId: "different-model" }),
    async () => certificate(1000, { providerId: "different-provider" }),
    async () => certificate(Number.NaN),
    async () => certificate(1000.2),
    async () => certificate(0),
    async () => certificate(1000, { sourceVersion: "" })
  ];
  for (const quote of samples) {
    await assert.rejects(admit(request, policy(quote)), {
      message: "PA04_CONTEXT_WINDOW_INPUT_BOUND_UNVERIFIED"
    });
  }
});

test("PA04 C01: output cannot be unreserved or raised by downstream inference", async () => {
  const request = modelRequest();
  delete request.maxOutputTokens;
  await assert.rejects(admit(request, policy(async () => certificate(100))), {
    message: "PA04_CONTEXT_WINDOW_OUTPUT_RESERVE_MISMATCH"
  });
  request.maxOutputTokens = 513;
  await assert.rejects(admit(request, policy(async () => certificate(100))), {
    message: "PA04_CONTEXT_WINDOW_OUTPUT_RESERVE_MISMATCH"
  });
});

test("PA04 C01: wrong provider/model or invalid model window is rejected before quote", async () => {
  const req = modelRequest();
  let calls = 0;
  const quote = async () => { calls++; return certificate(100); };
  await assert.rejects(admit(req, policy(quote, { modelId: "other" })), {
    message: "PA04_CONTEXT_WINDOW_MODEL_MISMATCH"
  });
  for (const config of [
    { contextWindowTokens: 0 }, { contextWindowTokens: 4095.5 },
    { maxOutputTokens: 4096 }, { maxOutputTokens: 0 }
  ]) {
    await assert.rejects(admit(req, policy(quote, config)), {
      message: "PA04_CONTEXT_WINDOW_CONFIG_INVALID"
    });
  }
  assert.equal(calls, 0);
});

test("PA04 C01: policy quotes a clone; a tokenizer cannot edit the inference request", async () => {
  const request = modelRequest();
  const original = structuredClone(request);
  await admit(request, policy(async actual => {
    actual.messages[0].content = "MUTATED";
    actual.tools[0].inputSchema = {};
    return certificate(200);
  }));
  assert.deepEqual(request, original);
});

test("PA04 C01: tools and observations may exhaust the window even with short Human text", async () => {
  const request = modelRequest();
  request.messages[3].content += " heavy observations ".repeat(400);
  request.tools[0].description += " complex schema ".repeat(300);
  const seen = [];
  await assert.rejects(admit(request, policy(async actual => {
    seen.push(actual.messages[3].content.length);
    seen.push(actual.tools[0].description.length);
    return certificate(3900);
  })), { message: "PA04_CONTEXT_WINDOW_EXHAUSTED" });
  assert.ok(seen[0] > 1000);
  assert.ok(seen[1] > 1000);
  assert.equal(request.messages[0].content, "Protected operating rules remain intact.");
});
