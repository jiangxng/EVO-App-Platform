#!/usr/bin/env node
import {
  APP_PLATFORM_EXPERIENCE_ARCHITECTURE_AUTHORITY_V010,
  appPlatformExperienceArchitectureKnownDebtV010,
  appPlatformExperienceArchitectureV010
} from "../dist/manager/experience-architecture-registry.js";
import {
  validateExperienceArchitectureV010
} from "../dist/vendor/eidos/src/experience-architecture/validate.js";

const actual = {};
let unexpected = false;

for (const descriptor of appPlatformExperienceArchitectureV010) {
  const result = validateExperienceArchitectureV010(descriptor);
  const codes = [...new Set(result.diagnostics.map(item => item.code))].sort();
  actual[descriptor.experienceId] = codes;

  const expected = [...(appPlatformExperienceArchitectureKnownDebtV010[descriptor.experienceId] ?? [])].sort();
  if (JSON.stringify(codes) !== JSON.stringify(expected)) {
    unexpected = true;
    console.error("Experience Architecture baseline mismatch:", descriptor.experienceId);
    console.error("  expected:", expected);
    console.error("  actual:  ", codes);
    for (const diagnostic of result.diagnostics) {
      console.error("  -", diagnostic.code, diagnostic.path, diagnostic.message);
    }
  }
}

for (const id of Object.keys(appPlatformExperienceArchitectureKnownDebtV010)) {
  if (!appPlatformExperienceArchitectureV010.some(item => item.experienceId === id)) {
    unexpected = true;
    console.error("Known-debt baseline references an unregistered Experience:", id);
  }
}

if (unexpected) {
  console.error("Eidos Experience Architecture validation FAILED.");
  console.error("Known-debt baseline may shrink as issues are fixed. Expanding it requires explicit Human approval.");
  process.exit(1);
}

console.log(JSON.stringify({
  ok: true,
  authority: APP_PLATFORM_EXPERIENCE_ARCHITECTURE_AUTHORITY_V010,
  registeredExperiences: appPlatformExperienceArchitectureV010.length,
  knownDebt: actual
}, null, 2));
