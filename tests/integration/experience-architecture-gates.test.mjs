import test from "node:test";
import assert from "node:assert/strict";

import {
  APP_PLATFORM_EXPERIENCE_ARCHITECTURE_AUTHORITY_V010,
  appPlatformExperienceArchitectureKnownDebtV010,
  appPlatformExperienceArchitectureV010
} from "../../dist/manager/experience-architecture-registry.js";
import { validateExperienceArchitectureV010 } from "../../dist/vendor/eidos/src/experience-architecture/validate.js";

test("critical App Platform Experiences are registered under pinned Eidos experience authority", () => {
  assert.equal(
    APP_PLATFORM_EXPERIENCE_ARCHITECTURE_AUTHORITY_V010.eidosCommit,
    "9440d8c32b9f23eab2c55b0f58a8be711573da33"
  );
  assert.equal(
    APP_PLATFORM_EXPERIENCE_ARCHITECTURE_AUTHORITY_V010.eidosReviewDecisionCommit,
    "82dcea59abf14518394fd605faf5b741e57a7ef0"
  );
  assert.equal(
    APP_PLATFORM_EXPERIENCE_ARCHITECTURE_AUTHORITY_V010.eidosJourneyContinuationCommit,
    "b937d45e6149dc16bdd2f0f6141df468f9014bda"
  );
  assert.equal(
    APP_PLATFORM_EXPERIENCE_ARCHITECTURE_AUTHORITY_V010.eidosScopedJourneyContinuationCommit,
    "a2c2cf3380f1155c76dd405183abedec4e670cdc"
  );
  assert.equal(
    APP_PLATFORM_EXPERIENCE_ARCHITECTURE_AUTHORITY_V010.eidosRuntimeLocalizationCommit,
    "05fa28cfa2b1019fa22c9811eaf06d3278d344af"
  );
  for (const id of [
    "personal-agent.chat",
    "personal-agent.setup",
    "personal-agent.memory-review",
    "llm-provider.binding",
    "llm-provider.settings"
  ]) {
    assert.ok(appPlatformExperienceArchitectureV010.some(item => item.experienceId === id), id);
  }
});

test("Foundation UX Pass 1 leaves no accepted candidate Experience diagnostics", () => {
  assert.deepEqual(appPlatformExperienceArchitectureKnownDebtV010, {});
});

test("candidate Experience diagnostics equal the ratcheted known-debt baseline", () => {
  for (const descriptor of appPlatformExperienceArchitectureV010) {
    const result = validateExperienceArchitectureV010(descriptor);
    const actual = [...new Set(result.diagnostics.map(item => item.code))].sort();
    const expected = [...(appPlatformExperienceArchitectureKnownDebtV010[descriptor.experienceId] ?? [])].sort();
    assert.deepEqual(actual, expected, descriptor.experienceId);
  }
});

test("engineering evidence pages remain explicitly experimental until product gates are satisfied", () => {
  for (const id of [
    "personal-agent.quality",
    "personal-agent.quality-review",
    "personal-agent.follow-ups"
  ]) {
    const descriptor = appPlatformExperienceArchitectureV010.find(item => item.experienceId === id);
    assert.equal(descriptor?.maturity, "experimental", id);
  }
});

test("known-debt baseline cannot silently invent an unregistered Experience", () => {
  for (const id of Object.keys(appPlatformExperienceArchitectureKnownDebtV010)) {
    assert.ok(appPlatformExperienceArchitectureV010.some(item => item.experienceId === id), id);
  }
});
