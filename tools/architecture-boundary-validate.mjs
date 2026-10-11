#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import {
  collectEvoRuntimeBoundarySourcesV010,
  inspectEvoRuntimeSingleOwnerV010
} from "./tr01-evo-runtime-single-owner-guard.mjs";
import {
  TR01_BUSINESS_GUARD_FILES_V010,
  inspectTr01BusinessPluginOwnershipV010
} from "./tr01-business-plugin-ownership-guard.mjs";

const root = new URL("../", import.meta.url);

async function text(path) {
  return readFile(new URL(path, root), "utf8");
}

const [
  manifestRaw,
  policyRaw,
  documentationPolicyRaw,
  invariants,
  llm,
  authority,
  documentationAuthority,
  ecosystemAuthority
] = await Promise.all([
  text("architecture.manifest.json"),
  text("architecture.boundary-policy.json"),
  text("documentation.policy.json"),
  text("INVARIANTS.md"),
  text("LLM.md"),
  text("docs/architecture/EXTENSION-BOUNDARY-CONSTITUTION-v0.1.md"),
  text("docs/architecture/DOCUMENTATION-LIFECYCLE-GOVERNANCE-v0.1.md"),
  text("docs/architecture/EVO-ECOSYSTEM-PROJECT-BOUNDARIES-v0.1.md")
]);

const manifest = JSON.parse(manifestRaw);
const policy = JSON.parse(policyRaw);
const documentationPolicy = JSON.parse(documentationPolicyRaw);
const errors = [];

// Reject a second EVO-owned Ledger/FIFO/Allocation engine in Platform source.
// This is a static tripwire; EVO itself remains the only authoritative runtime.
errors.push(...inspectEvoRuntimeSingleOwnerV010(
  collectEvoRuntimeBoundarySourcesV010(fileURLToPath(root))
));

const tr01Sources = {};
for (const path of TR01_BUSINESS_GUARD_FILES_V010) {
  try {
    tr01Sources[path] = await text(path);
  } catch (error) {
    errors.push("Unable to inspect TR-01 plugin owner: " + path
      + " (" + (error instanceof Error ? error.message : String(error)) + ")");
  }
}
errors.push(...inspectTr01BusinessPluginOwnershipV010({
  policy, files: tr01Sources
}));

const authorityPath = "docs/architecture/EXTENSION-BOUNDARY-CONSTITUTION-v0.1.md";
if (!manifest.architectureAuthorities?.includes(authorityPath)) {
  errors.push("architecture.manifest.json must register the Extension Boundary Constitution.");
}
if (manifest.boundaryPolicy !== "architecture.boundary-policy.json") {
  errors.push("architecture.manifest.json must point to architecture.boundary-policy.json.");
}
if (policy.authority !== authorityPath) {
  errors.push("architecture.boundary-policy.json authority mismatch.");
}

const ids = new Set((policy.classifications ?? []).map(item => item.id));
for (const id of ["CORE", "PLATFORM_PROVIDER", "APPLICATION", "INTEGRATION_ADAPTER", "EXPERIENCE"]) {
  if (!ids.has(id)) errors.push("Missing boundary classification: " + id);
}

const requiredOrder = [
  "reuse-existing-owner",
  "provider-if-replaceable-or-independent",
  "adapter-if-external-compatibility-only",
  "experience-if-human-facing",
  "application-if-domain-composition",
  "core-only-if-generic-host-mechanism"
];
if (JSON.stringify(policy.decisionOrder) !== JSON.stringify(requiredOrder)) {
  errors.push("Boundary decision order changed without updating the architecture validator.");
}

for (let id = 208; id <= 221; id += 1) {
  if (!invariants.includes("APP-" + id)) {
    errors.push("INVARIANTS.md missing APP-" + id);
  }
}


const documentationAuthorityPath =
  "docs/architecture/DOCUMENTATION-LIFECYCLE-GOVERNANCE-v0.1.md";
if (manifest.documentationPolicy !== "documentation.policy.json") {
  errors.push("architecture.manifest.json must point to documentation.policy.json.");
}
if (!manifest.architectureAuthorities?.includes(documentationAuthorityPath)) {
  errors.push("architecture.manifest.json must register Documentation Lifecycle Governance.");
}
if (documentationPolicy.authority !== documentationAuthorityPath) {
  errors.push("documentation.policy.json authority mismatch.");
}
for (const id of [
  "CURRENT_AUTHORITY",
  "DECISION_RECORD",
  "HISTORICAL_SNAPSHOT",
  "VERSIONED_CONTRACT",
  "LIVING_RUNBOOK",
  "GENERATED_CURRENT_VIEW",
  "CURRENT_STATUS"
]) {
  if (!(id in (documentationPolicy.classes ?? {}))) {
    errors.push("Missing documentation lifecycle class: " + id);
  }
}
if (!documentationAuthority.includes("Historical evidence must not be erased")) {
  errors.push("Documentation authority must preserve selective project history.");
}
if (!documentationAuthority.includes("current authority must be allowed to evolve")) {
  errors.push("Documentation authority must keep current truth editable.");
}

const ecosystemAuthorityPath =
  "docs/architecture/EVO-ECOSYSTEM-PROJECT-BOUNDARIES-v0.1.md";
if (manifest.ecosystemBoundary !== ecosystemAuthorityPath) {
  errors.push("architecture.manifest.json must point to the four-project ecosystem boundary.");
}
if (!manifest.architectureAuthorities?.includes(ecosystemAuthorityPath)) {
  errors.push("architecture.manifest.json must register the ecosystem boundary.");
}
for (const project of [
  "EVO-App-Platform",
  "EVO",
  "Eidos",
  "Experience-Compiler"
]) {
  if (!ecosystemAuthority.includes(project)) {
    errors.push("Ecosystem boundary missing current owner project: " + project);
  }
}
if (!ecosystemAuthority.includes("historical convergence evidence only")) {
  errors.push("Ecosystem boundary must mark the retired convergence repository as historical only.");
}

if (!llm.includes(authorityPath)) {
  errors.push("LLM.md must require the Extension Boundary Constitution.");
}
if (!llm.includes("Core, Provider, Application, Integration Adapter, or Experience")) {
  errors.push("LLM.md must preserve the pre-implementation ownership classification question.");
}

for (const phrase of [
  "independent supplier, lifecycle, replaceable implementation or deployment difference",
  "Human-facing UI belongs in the Experience layer",
  "Integration Adapter is an architectural role",
  "Designer output"
]) {
  if (!authority.includes(phrase)) {
    errors.push("Boundary authority missing required phrase: " + phrase);
  }
}

if (errors.length) {
  console.error("Extension Boundary Constitution validation FAILED.");
  for (const error of errors) console.error("- " + error);
  process.exit(1);
}

console.log(JSON.stringify({
  ok: true,
  authority: policy.authority,
  classifications: [...ids],
  decisionOrder: policy.decisionOrder,
  documentationAuthority: documentationPolicy.authority,
  ecosystemBoundary: manifest.ecosystemBoundary
}, null, 2));
