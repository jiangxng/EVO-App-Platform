import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
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


test("CV05 manual workflow protects QA key behind main-ref and consent admission",()=>{
  const source=readFileSync(new URL(
    "../../.github/workflows/cv05-live-llm-isolated-acceptance.yml",
    import.meta.url
  ),"utf8");
  assert.match(source,/^on:\s*\n\s+workflow_dispatch:/m);
  assert.doesNotMatch(source,/^\s+(?:pull_request|push|workflow_run):/m);
  assert.match(source,/^  admission:\s*$/m);
  const [admission,secretJob]=source.split(/^  isolated-real-inference:\s*$/m);
  assert.ok(secretJob,"CV05_LIVE_SEPARATE_SECRET_JOB_REQUIRED");
  assert.match(admission,/GITHUB_REF.*refs\/heads\/main/);
  assert.match(admission,/GITHUB_REF_PROTECTED/);
  assert.match(admission,/I_ACCEPT_TEST_LLM_CHARGES/);
  assert.doesNotMatch(admission,/secrets\./);
  assert.match(secretJob,/needs:\s*admission/);
  assert.match(secretJob,/if:\s*github\.ref == 'refs\/heads\/main' && github\.ref_protected/);
  assert.match(secretJob,/environment:\s*\n\s+name:\s*cv05-live-qa/);
  assert.match(secretJob,/secrets\.CV05_LIVE_QA_ENVIRONMENT_ONLY_API_KEY/);
  assert.doesNotMatch(source,/secrets\.CV05_LIVE_LLM_TEST_API_KEY/);
  assert.doesNotMatch(source,/(?:secrets\.OPENAI_API_KEY|secrets\.DEEPSEEK_API_KEY)/);
});
