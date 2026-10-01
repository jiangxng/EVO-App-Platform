#!/usr/bin/env node
import { readFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);

async function text(path) {
  return readFile(new URL(path, root), "utf8");
}

const [manifestRaw, policyRaw, invariants, llm, authority] = await Promise.all([
  text("architecture.manifest.json"),
  text("architecture.boundary-policy.json"),
  text("INVARIANTS.md"),
  text("LLM.md"),
  text("docs/architecture/EXTENSION-BOUNDARY-CONSTITUTION-v0.1.md")
]);

const manifest = JSON.parse(manifestRaw);
const policy = JSON.parse(policyRaw);
const errors = [];

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

for (let id = 208; id <= 216; id += 1) {
  if (!invariants.includes("APP-" + id)) {
    errors.push("INVARIANTS.md missing APP-" + id);
  }
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
  decisionOrder: policy.decisionOrder
}, null, 2));
