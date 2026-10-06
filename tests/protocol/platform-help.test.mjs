import test from "node:test";
import assert from "node:assert/strict";

import {
  compileHelpSourceV010,
  createHelpExperienceManifestV010,
  createHelpIndexPageV010,
  loadHelpCorpusV010,
  materializeHelpDocumentV010,
  resolveHelpDocumentsV010,
  searchHelpV010
} from "../../dist/manager/help-system.js";
import { renderAppHostPageToHtml } from "../../dist/vendor/eidos/src/app-host/index.js";

test("Platform Help source compiler turns JSON-frontmatter Markdown into safe Eidos blocks", () => {
  const compiled = compileHelpSourceV010(`---
{
  "helpVersion": "0.1.0",
  "id": "test.help",
  "ownerPackageId": "test-package",
  "locale": "en",
  "kind": "how-to",
  "title": "Test Help",
  "audiences": ["user"],
  "contexts": { "errorCodes": ["TEST_ERROR"] },
  "lastReviewedAt": "2026-09-26"
}
---
Intro paragraph.

## Steps

1. First
2. Second

> [!WARNING] Important
> Do not bypass policy.

\`\`\`text
TEST_ERROR
\`\`\`
`, "memory.md");

  assert.equal(compiled.metadata.id, "test.help");
  assert.equal(compiled.blocks.some(block => block.type === "steps"), true);
  assert.equal(compiled.blocks.some(block => block.type === "callout"), true);
  assert.match(compiled.searchableText, /test_error/);
});

test("seed Help corpus is unique, searchable and context-addressable", () => {
  const corpus = loadHelpCorpusV010();
  assert.ok(corpus.length >= 14);

  const textResults = searchHelpV010(corpus, "provider binding");
  assert.equal(textResults[0]?.id, "evo.provider.binding");

  const contextResults = searchHelpV010(corpus, "", "en", {
    errorCodes: ["PROVIDER_RESOLUTION_AMBIGUOUS"]
  });
  assert.equal(contextResults[0]?.id, "evo.troubleshooting.provider-ambiguous");
  assert.ok(contextResults.some(item => item.id === "evo.provider.binding"));
});

test("Help index is an Eidos searchable catalog and Help documents render through Eidos", () => {
  const corpus = loadHelpCorpusV010();
  const index = createHelpIndexPageV010(corpus);
  assert.equal(index.kind, "catalog-browser");
  assert.equal(index.search?.placeholder, "Search help…");
  assert.ok(index.items.some(item => item.id === "evo.provider.binding"));
  assert.equal(
    index.items.every(item => item.metadata === undefined),
    true
  );

  const document = materializeHelpDocumentV010(corpus, "evo.provider.binding");
  assert.equal(document?.kind, "help-document");
  assert.equal(document?.owner.packageId, "evo-app-platform");

  const html = renderAppHostPageToHtml({
    experienceId: "evo-help",
    packageId: "evo-app-platform",
    featureId: "evo-help.system",
    route: {
      id: "evo-help.evo.provider.binding",
      path: "/help/evo.provider.binding",
      pageId: "evo-help.evo.provider.binding"
    },
    page: {
      id: "evo-help.evo.provider.binding",
      source: "app://evo-app-platform/pages/help/evo.provider.binding"
    },
    definition: document
  });
  assert.match(html, /data-eidos-help-document="evo\.provider\.binding"/);
});

test("Help experience manifest exposes the index and stable document routes", () => {
  const manifest = createHelpExperienceManifestV010(loadHelpCorpusV010());
  assert.equal(manifest.defaultRoute, "/help");
  assert.ok(manifest.routes.some(route => route.path === "/help/evo.provider.binding"));
});


test("Help locale selection is per-document with deterministic English fallback", () => {
  const corpus = loadHelpCorpusV010();
  const partial = corpus.filter(item =>
    !(item.metadata.id === "evo.provider.health" && item.metadata.locale === "zh-CN")
  );

  const documents = resolveHelpDocumentsV010(partial, "zh-CN");
  const binding = documents.find(item => item.metadata.id === "evo.provider.binding");
  const health = documents.find(item => item.metadata.id === "evo.provider.health");

  assert.equal(binding?.metadata.locale, "zh-CN");
  assert.equal(binding?.metadata.title, "配置 Provider 绑定");
  assert.equal(health?.metadata.locale, "en");
  assert.equal(health?.metadata.title, "Provider health states");
  assert.equal(documents.length, new Set(partial.map(item => item.metadata.id)).size);
});

test("zh-CN Help corpus preserves stable IDs and routes while localizing content", () => {
  const corpus = loadHelpCorpusV010();
  const enManifest = createHelpExperienceManifestV010(corpus, "en");
  const zhManifest = createHelpExperienceManifestV010(corpus, "zh-CN");

  assert.deepEqual(
    zhManifest.routes.map(route => route.path),
    enManifest.routes.map(route => route.path)
  );

  const zhIndex = createHelpIndexPageV010(corpus, "zh-CN");
  assert.equal(zhIndex.title, "帮助");
  assert.equal(zhIndex.search?.placeholder, "搜索帮助…");
  assert.equal(zhIndex.description, "查找产品使用方法、概念说明和常见问题。");
  const zhBinding = zhIndex.items.find(item => item.id === "evo.provider.binding");
  assert.equal(zhBinding?.title, "配置 Provider 绑定");
  assert.equal(zhBinding?.category, "操作指南");
  assert.ok(zhBinding?.badges.includes("管理员"));

  const zhDocument = materializeHelpDocumentV010(corpus, "evo.provider.binding", "zh-CN");
  assert.equal(zhDocument?.locale, "zh-CN");
  assert.equal(zhDocument?.title, "配置 Provider 绑定");
  assert.equal(zhDocument?.breadcrumbs[0].label, "帮助");

  const fallback = materializeHelpDocumentV010(corpus, "evo.provider.binding", "ja-JP");
  assert.equal(fallback?.locale, "en");
  assert.equal(fallback?.title, "Configure a Provider binding");
});
