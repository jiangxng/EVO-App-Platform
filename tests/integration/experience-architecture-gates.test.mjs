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
  assert.equal(
    APP_PLATFORM_EXPERIENCE_ARCHITECTURE_AUTHORITY_V010.eidosSettingsJourneyCommit,
    "c6fb8bb99541dbda5d5e4957fdebac069299e573"
  );
  assert.equal(
    APP_PLATFORM_EXPERIENCE_ARCHITECTURE_AUTHORITY_V010.eidosChatMarkdownCommit,
    "2b0fc5aa80d1cacf6277535e715a3b9e6efb0e3f"
  );
  assert.equal(
    APP_PLATFORM_EXPERIENCE_ARCHITECTURE_AUTHORITY_V010
      .eidosCatalogBrowserDesignLanguageCommit,
    "7bf486cd6770f141e62d23a878bfde687751653d"
  );
  for (const id of [
    "evo-template-store",
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
