#!/usr/bin/env node
import { loadHelpCorpusV010 } from "../dist/manager/help-system.js";

const corpus = loadHelpCorpusV010();
const required = new Set([
  "evo.workbench.overview",
  "evo.platform.package-feature-contribution",
  "evo.plugin.lifecycle",
  "evo.provider.model",
  "evo.provider.binding",
  "evo.provider.health",
  "evo.authorization.authentication-vs-authorization",
  "evo.extension-manager.overview",
  "evo.settings.secrets",
  "evo.troubleshooting.provider-ambiguous",
  "evo.troubleshooting.provider-unavailable",
  "evo.troubleshooting.authorization-denied",
  "evo.troubleshooting.plugin-integrity",
  "evo.troubleshooting.runtime-unavailable"
]);

const ids = new Set(corpus.filter(item => item.metadata.locale === "en").map(item => item.metadata.id));
const problems = [];

for (const id of required) {
  if (!ids.has(id)) problems.push(`missing required Help document: ${id}`);
}

for (const item of corpus) {
  if (!item.metadata.lastReviewedAt) {
    problems.push(`missing lastReviewedAt: ${item.metadata.id} [${item.metadata.locale}]`);
  }
  for (const related of item.metadata.related ?? []) {
    const exists = corpus.some(candidate =>
      candidate.metadata.id === related
      && (
        candidate.metadata.locale === item.metadata.locale
        || candidate.metadata.locale === "en"
      )
    );
    if (!exists) problems.push(`broken related reference: ${item.metadata.id} -> ${related}`);
  }
}

if (problems.length) {
  console.error("Platform Help validation failed:");
  for (const problem of problems) console.error(`- ${problem}`);
  process.exit(1);
}

const kinds = new Map();
for (const item of corpus) {
  kinds.set(item.metadata.kind, (kinds.get(item.metadata.kind) ?? 0) + 1);
}

console.log(JSON.stringify({
  ok: true,
  documents: corpus.length,
  locales: [...new Set(corpus.map(item => item.metadata.locale))].sort(),
  kinds: Object.fromEntries([...kinds.entries()].sort(([a], [b]) => a.localeCompare(b)))
}, null, 2));
