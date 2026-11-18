import test from "node:test";
import assert from "node:assert/strict";
import {
  CV05_LIVE_CONSENT,
  validateCv05LiveEnvironment
} from "../../tools/agent-line/cv05-live-llm-acceptance.mjs";

const valid = {
  EVO_CV05_LIVE_LLM_CONSENT: CV05_LIVE_CONSENT,
  EVO_CV05_LIVE_LLM_PROVIDER: "openai",
  EVO_CV05_LIVE_LLM_MODEL: "gpt-test-model",
  EVO_CV05_LIVE_LLM_TEST_API_KEY: "synthetic-test-only"
};

test("CV05 online quality gate refuses runs without distinct explicit cost consent",()=>{
  for(const consent of [undefined,"yes","1",""]) {
    assert.throws(()=>validateCv05LiveEnvironment({
      ...valid,EVO_CV05_LIVE_LLM_CONSENT:consent
    }),/CV05_LIVE_EXPLICIT_CONSENT_REQUIRED/);
  }
});

test("CV05 live evaluation never falls back to inherited OPENAI_API_KEY or DEEPSEEK_API_KEY",()=>{
  assert.throws(()=>validateCv05LiveEnvironment({
    ...valid,EVO_CV05_LIVE_LLM_TEST_API_KEY:undefined,
    OPENAI_API_KEY:"production-placeholder",
    DEEPSEEK_API_KEY:"production-placeholder"
  }),/CV05_LIVE_ISOLATED_TEST_KEY_REQUIRED/);
});

test("CV05 live evaluation accepts only supported Provider and explicit model",()=>{
  for(const provider of [undefined,"","custom","localhost"]) {
    assert.throws(()=>validateCv05LiveEnvironment({
      ...valid,EVO_CV05_LIVE_LLM_PROVIDER:provider
    }),/CV05_LIVE_PROVIDER_NOT_ALLOWED/);
  }
  for(const model of [undefined,"","../../etc/passwd","model with spaces"]) {
    assert.throws(()=>validateCv05LiveEnvironment({
      ...valid,EVO_CV05_LIVE_LLM_MODEL:model
    }),/CV05_LIVE_EXPLICIT_MODEL_REQUIRED/);
  }
  assert.deepEqual(validateCv05LiveEnvironment(valid),{
    provider:"openai",model:"gpt-test-model"
  });
  assert.deepEqual(validateCv05LiveEnvironment({
    ...valid,EVO_CV05_LIVE_LLM_PROVIDER:"deepseek",
    EVO_CV05_LIVE_LLM_MODEL:"deepseek-chat"
  }),{provider:"deepseek",model:"deepseek-chat"});
});

test("CV05 live provider test forbids arbitrary HTTP endpoints and never returns keys",()=>{
  assert.throws(()=>validateCv05LiveEnvironment({
    ...valid,EVO_CV05_LIVE_LLM_BASE_URL:"https://untrusted.example"
  }),/CV05_LIVE_CUSTOM_ENDPOINT_FORBIDDEN/);
  assert.equal(JSON.stringify(validateCv05LiveEnvironment(valid))
    .includes(valid.EVO_CV05_LIVE_LLM_TEST_API_KEY),false);
});
