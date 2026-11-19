import test from "node:test";
import assert from "node:assert/strict";
import {
  createCv05DeepSeekLiveBudgetGuard,
  CV05_DEEPSEEK_MAX_USD,
  CV05_DEEPSEEK_MAX_OUTPUT_TOKENS
} from "../../tools/agent-line/cv05-deepseek-live-budget.mjs";

function body({
  model="deepseek-flash",
  maxOutput=CV05_DEEPSEEK_MAX_OUTPUT_TOKENS,
  extra="",
  tools=[{type:"function",name:"read",parameters:{type:"object"}}]
}={}) {
  return JSON.stringify({
    model,
    instructions:"Use current Host READ only.",
    input:[{role:"user",content:extra||"Show my authorized suppliers"}],
    tools,
    tool_choice:"auto",
    max_output_tokens:maxOutput
  });
}

test("CV05 DeepSeek budget reserves before HTTP and reports only totals",()=>{
  const guard=createCv05DeepSeekLiveBudgetGuard();
  guard.reserve(body());
  const receipt=guard.receipt();
  assert.equal(receipt.callsReserved,1);
  assert.equal(receipt.ceilingUsd,2);
  assert.equal(receipt.approvedModel,"deepseek-flash");
  assert.ok(receipt.conservativeEstimatedUsd>0);
  assert.ok(receipt.conservativeEstimatedUsd<CV05_DEEPSEEK_MAX_USD);
  assert.equal(JSON.stringify(receipt).includes("Show my authorized suppliers"),false);
});

test("CV05 DeepSeek budget rejects unsupported models, search tools and output ceiling",()=>{
  const cases=[
    body({model:"deepseek-v4-pro"}),
    body({model:"deepseek-v4-flash"}),
    body({maxOutput:701}),
    body({maxOutput:0}),
    body({tools:[{type:"web_search"}]}),
    "{invalid-json",
    "{}"
  ];
  for(const bad of cases){
    const guard=createCv05DeepSeekLiveBudgetGuard();
    assert.throws(()=>guard.reserve(bad),/CV05_LIVE_BUDGET_/);
    assert.equal(guard.receipt().callsReserved,0);
    assert.equal(guard.receipt().conservativeEstimatedUsd,0);
  }
});

test("CV05 DeepSeek budget rejects oversized request before network",()=>{
  const guard=createCv05DeepSeekLiveBudgetGuard();
  assert.throws(()=>guard.reserve(body({extra:"a".repeat(110_000)})),
    /CV05_LIVE_BUDGET_REQUEST_TOO_LARGE/);
  assert.equal(guard.receipt().callsReserved,0);
});

test("CV05 DeepSeek budget caps reserved cost regardless of missing usage or timeouts",()=>{
  const guard=createCv05DeepSeekLiveBudgetGuard();
  const input=body({extra:"x".repeat(88_000)});
  let stopped=false;
  for(let i=0;i<32;i++){
    try{
      guard.reserve(input);
    }catch(err){
      assert.match(String(err),/CV05_LIVE_BUDGET_USD_CEILING/);
      stopped=true;
      break;
    }
  }
  assert.equal(stopped,true);
  const receipt=guard.receipt();
  assert.ok(receipt.callsReserved>0&&receipt.callsReserved<32);
  assert.ok(receipt.conservativeEstimatedUsd<=CV05_DEEPSEEK_MAX_USD);
  assert.ok(receipt.requestBytes>0);
});

test("CV05 DeepSeek budget cannot be reset by returning a receipt",()=>{
  const guard=createCv05DeepSeekLiveBudgetGuard();
  const first=guard.receipt();
  assert.equal(Object.isFrozen(first),true);
  guard.reserve(body());
  assert.equal(first.callsReserved,0);
  assert.equal(guard.receipt().callsReserved,1);
});
