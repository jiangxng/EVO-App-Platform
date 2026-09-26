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
const requiredLocales = ["en", "zh-CN"];
const problems = [];

function stableMachineMetadata(item) {
  return JSON.stringify({
    ownerPackageId: item.metadata.ownerPackageId,
    ownerFeatureId: item.metadata.ownerFeatureId ?? null,
    kind: item.metadata.kind,
    audiences: [...item.metadata.audiences].sort(),
    appliesTo: item.metadata.appliesTo ?? null,
    contexts: item.metadata.contexts ?? null,
    related: [...(item.metadata.related ?? [])].sort()
  });
}

for (const locale of requiredLocales) {
  const ids = new Set(
    corpus
      .filter(item => item.metadata.locale === locale)
      .map(item => item.metadata.id)
  );
  for (const id of required) {
    if (!ids.has(id)) {
      problems.push("missing required Help translation: " + id + " [" + locale + "]");
    }
  }
}

for (const item of corpus) {
  try {
    const canonical = Intl.getCanonicalLocales(item.metadata.locale)[0];
    if (canonical !== item.metadata.locale) {
      problems.push("non-canonical locale: " + item.metadata.locale + " -> " + canonical);
    }
  } catch {
    problems.push("invalid locale: " + item.metadata.locale);
  }

  if (!item.metadata.lastReviewedAt) {
    problems.push("missing lastReviewedAt: " + item.metadata.id + " [" + item.metadata.locale + "]");
  }

  for (const related of item.metadata.related ?? []) {
    const exists = corpus.some(candidate =>
      candidate.metadata.id === related
      && (
        candidate.metadata.locale === item.metadata.locale
        || candidate.metadata.locale === "en"
      )
    );
    if (!exists) {
      problems.push(
        "broken related reference: "
        + item.metadata.id
        + " ["
        + item.metadata.locale
        + "] -> "
        + related
      );
    }
  }
}

for (const id of new Set(corpus.map(item => item.metadata.id))) {
  const variants = corpus.filter(item => item.metadata.id === id);
  const baseline = variants.find(item => item.metadata.locale === "en") ?? variants[0];
  const expected = stableMachineMetadata(baseline);
  for (const variant of variants) {
    if (stableMachineMetadata(variant) !== expected) {
      problems.push(
        "locale variant changed machine metadata: "
        + id
        + " ["
        + variant.metadata.locale
        + "]"
      );
    }
  }
}

if (problems.length) {
  console.error("Platform Help validation failed:");
  for (const problem of problems) console.error("- " + problem);
  process.exit(1);
}

const kinds = new Map();
for (const item of corpus) {
  kinds.set(item.metadata.kind, (kinds.get(item.metadata.kind) ?? 0) + 1);
}

const coverage = Object.fromEntries(
  requiredLocales.map(locale => [
    locale,
    corpus.filter(item => item.metadata.locale === locale).length
  ])
);

console.log(JSON.stringify({
  ok: true,
  documents: corpus.length,
  uniqueDocumentIds: new Set(corpus.map(item => item.metadata.id)).size,
  locales: [...new Set(corpus.map(item => item.metadata.locale))].sort(),
  requiredLocales,
  coverage,
  kinds: Object.fromEntries([...kinds.entries()].sort(([a], [b]) => a.localeCompare(b)))
}, null, 2));
