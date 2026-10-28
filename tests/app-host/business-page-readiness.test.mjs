import test from "node:test";
import assert from "node:assert/strict";
import { createBusinessPageReadinessFetchV010 } from "../../dist/manager/business-page-readiness-fetch.js";
import { createAppManagerExperienceSource } from "../../dist/vendor/eidos/src/app-host/app-manager-source.js";
import { renderCatalogBrowserToHtml } from "../../dist/vendor/eidos/src/catalog-browser/render.js";

const pageRef = {
  id: "evo-counterparty.customers",
  title: "Customers",
  source: "app://evo-counterparty/pages/customers"
};

function jsonResponse(body, status) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" }
  });
}

test("a visible installed application without enterprise has a useful page, never a blank workspace", async () => {
  const seen = [];
  const fetchImpl = async (input, init) => {
    seen.push([String(input), init?.method ?? "GET"]);
    return jsonResponse({
      code: "COUNTERPARTY_ENTERPRISE_CONTEXT_REQUIRED",
      message: "Select an Enterprise Context first."
    }, 409);
  };
  const adapted = createBusinessPageReadinessFetchV010(fetchImpl, () => "zh-CN");
  const source = createAppManagerExperienceSource({
    baseUrl: "https://evo.example",
    fetchImpl: adapted,
    locale: () => "zh-CN"
  });
  const page = await source.loadPage(pageRef);
  assert.equal(page.kind, "catalog-browser");
  assert.deepEqual(page.items, []);
  assert.match(page.description, /没有可用的企业业务环境/);
  const html = renderCatalogBrowserToHtml(page);
  assert.match(html, /当前应用尚未关联企业/);
  assert.match(html, /请先创建或关联企业/);
  assert.equal(seen.length, 1);
  assert.match(seen[0][0], /\/v1\/experience-pages\?/);
});

test("unavailable state is not cached as a valid business page after enterprise becomes available", async () => {
  let enterpriseReady = false;
  const fetchImpl = async () => enterpriseReady
    ? jsonResponse({
        contractVersion: "0.1.0",
        kind: "catalog-browser",
        id: "customers",
        title: "Customers",
        items: []
      }, 200)
    : jsonResponse({ code: "COUNTERPARTY_ENTERPRISE_CONTEXT_REQUIRED" }, 409);
  const source = createAppManagerExperienceSource({
    baseUrl: "https://evo.example",
    fetchImpl: createBusinessPageReadinessFetchV010(fetchImpl, () => "en"),
    locale: () => "en"
  });
  assert.match((await source.loadPage(pageRef)).title, /No enterprise/);
  enterpriseReady = true;
  assert.equal((await source.loadPage(pageRef)).title, "Customers");
});

test("platform does not transform authentication, permission, unrelated errors or successful plugin responses", async () => {
  for (const [status, body] of [
    [401, { code: "UNAUTHENTICATED" }],
    [403, { code: "FORBIDDEN" }],
    [409, { code: "PROVIDER_BINDING_UPDATE_REJECTED" }],
    [409, { code: "INVALID_BUSINESS_STATE" }],
    [200, { kind: "catalog-browser", items: [] }]
  ]) {
    const adapter = createBusinessPageReadinessFetchV010(
      async () => jsonResponse(body, status),
      () => "zh-CN"
    );
    const response = await adapter("https://evo.example/v1/experience-pages?source=app%3A%2F%2Fevo");
    assert.equal(response.status, status);
    assert.deepEqual(await response.json(), body);
  }
  const otherEndpoint = createBusinessPageReadinessFetchV010(
    async () => jsonResponse({ code: "COUNTERPARTY_ENTERPRISE_CONTEXT_REQUIRED" }, 409),
    () => "zh-CN"
  );
  const other = await otherEndpoint("https://evo.example/v1/actions");
  assert.equal(other.status, 409);
});

test("unbound enterprise page is localized and never claims that a backend binding was checked", async () => {
  const adapter = createBusinessPageReadinessFetchV010(
    async () => jsonResponse({ code: "DATA_IMPORT_ENTERPRISE_CONTEXT_REQUIRED" }, 409),
    () => "en-US"
  );
  const page = await (await adapter("https://evo.example/v1/experience-pages")).json();
  assert.equal(page.kind, "catalog-browser");
  assert.match(page.title, /No enterprise/);
  assert.match(page.emptyMessage, /confirm its app services/);
  assert.doesNotMatch(page.description, /backend unavailable|installed packages|uninstalled/i);
});
