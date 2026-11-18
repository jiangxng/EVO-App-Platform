import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

export const CV05_LIVE_CONSENT = "I_ACCEPT_TEST_LLM_CHARGES";

/**
 * Fail closed. Never accept implicit production/provider credentials or a
 * configurable URL as an escape hatch from the isolated synthetic fixture.
 * Configuration values and failures must never echo the API key.
 */
export function validateCv05LiveEnvironment(env) {
  if (env.EVO_CV05_LIVE_LLM_CONSENT !== CV05_LIVE_CONSENT) {
    throw new Error("CV05_LIVE_EXPLICIT_CONSENT_REQUIRED");
  }
  const provider = env.EVO_CV05_LIVE_LLM_PROVIDER;
  if (provider !== "openai" && provider !== "deepseek") {
    throw new Error("CV05_LIVE_PROVIDER_NOT_ALLOWED");
  }
  const model = env.EVO_CV05_LIVE_LLM_MODEL;
  if (typeof model !== "string" || !/^[a-zA-Z0-9._:/-]{2,80}$/.test(model)
      || model.startsWith(".") || model.startsWith("/")
      || model.includes("..") || model.includes("://")) {
    throw new Error("CV05_LIVE_EXPLICIT_MODEL_REQUIRED");
  }
  if (typeof env.EVO_CV05_LIVE_LLM_TEST_API_KEY !== "string"
      || !env.EVO_CV05_LIVE_LLM_TEST_API_KEY.trim()) {
    throw new Error("CV05_LIVE_ISOLATED_TEST_KEY_REQUIRED");
  }
  if (env.EVO_CV05_LIVE_LLM_BASE_URL !== undefined) {
    throw new Error("CV05_LIVE_CUSTOM_ENDPOINT_FORBIDDEN");
  }
  return { provider, model };
}

const executable = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (executable) {
  try {
    const { provider, model } = validateCv05LiveEnvironment(process.env);
    console.log("CV05_LIVE_ISOLATED_GATE_PASS provider=" + provider + " model=" + model);
    const result = spawnSync(process.execPath, [
      "--test",
      "--test-name-pattern=CV05 LIVE",
      "tests/integration/cv02-personal-agent-authorized-collection.test.mjs"
    ], {
      cwd: resolve(fileURLToPath(new URL("../../", import.meta.url))),
      env: { ...process.env, EVO_CV05_LIVE_LLM_RUN: "1" },
      stdio: "inherit",
      timeout: 300_000
    });
    if (result.error) throw new Error("CV05_LIVE_TEST_RUNNER_FAILED");
    if (result.status !== 0) throw new Error("CV05_LIVE_ACCEPTANCE_NOT_PASSED");
    console.log("CV05_LIVE_ACCEPTANCE_PASS");
  } catch (error) {
    // No request/response bodies, source records, or credential values.
    console.error(error instanceof Error ? error.message : "CV05_LIVE_ACCEPTANCE_FAILED");
    process.exitCode = 1;
  }
}
