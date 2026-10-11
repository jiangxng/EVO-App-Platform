import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  createLedgerRuntimeConfiguratorService
} from "../../dist/apps/ledger-runtime-configurator/service.js";
import {
  describeLedgerRuntimeConfigurationV010,
  readLedgerRuntimeConfigurationSectionV010
} from "../../dist/apps/ledger-runtime-configurator/capability-operations.js";
import {
  createTemplateStorePageV010
} from "../../dist/apps/template-store/experience-assets.js";
import {
  renderCatalogBrowserToHtml
} from "../../dist/vendor/eidos/src/catalog-browser/render.js";

test("Legacy ledger capability handlers converge on modern, paginated package-owned reads", () => {
  const service = createLedgerRuntimeConfiguratorService();
  const description = describeLedgerRuntimeConfigurationV010(service);
  assert.equal(description.kind, "evo.ledger-runtime.configuration-description");
  assert.equal(description.counts.postingRules, 912);
  assert.equal(description.sections.length, 4);
  const page = readLedgerRuntimeConfigurationSectionV010(service, {
    section: "postingRules", pageSize: 2
  });
  assert.equal(page.items.length, 2);
  assert.equal(page.total, 912);
  assert.equal(page.offset, 0);
  const next = readLedgerRuntimeConfigurationSectionV010(service, {
    section: "postingRules", pageSize: 2, cursor: page.nextCursor
  });
  assert.equal(next.offset, 2);
  assert.equal(next.semanticDigest, page.semanticDigest);
});

test("Template Store legacy Eidos compliance converges on a current catalog-browser", () => {
  const page = createTemplateStorePageV010(undefined, { locale: "zh-CN" });
  assert.equal(page.kind, "catalog-browser");
  assert.equal(page.title, "模板商店");
  assert.ok(page.items.length > 0);
  assert.equal(page.items[0].primaryAction.requiresConfirmation, true);
  const html = renderCatalogBrowserToHtml(page);
  assert.match(html, /模板商店/);
  assert.doesNotMatch(html, /<script/i);
});

test("EVO observation contract uses enterprise authority and never restores legacy scopeKey authority", () => {
  const source = readFileSync("contracts/evo-runtime-observation.ts", "utf8");
  assert.match(source, /enterpriseId: string/);
  assert.match(source, /EVO_RUNTIME_OBSERVATION_CONTRACT_VERSION_V010/);
  assert.doesNotMatch(source, /scopeKey: string/);
  assert.match(source, /EVO_LEDGER_RUNTIME/);
  const adapter = readFileSync("manager/server.ts", "utf8");
  assert.match(adapter, /createLedgerRuntimeConfiguratorCapabilityActionHandlers/);
  const workflow = readFileSync(".github/workflows/cross-project-trading-lite-browser-evo.yml", "utf8");
  assert.match(workflow, /EVO/);
});
