import test from "node:test";
import assert from "node:assert/strict";

import { createDataImportUploadPageV010 } from "../../dist/apps/data-import/page.js";
import { createCounterpartyImportTargetV010 } from "../../dist/apps/counterparty/import-target.js";
import { counterpartyProjectionQueryRouteV010 } from "../../dist/apps/counterparty/projection-query.js";
import {
  COUNTERPARTY_CUSTOMERS_ROUTE,
  COUNTERPARTY_SUPPLIERS_ROUTE
} from "../../dist/apps/counterparty/constants.js";
import { createMemoryEnterpriseResourceRepositoryV010 } from "../../dist/providers/enterprise-context/resources.js";
import { createCounterpartyRepositoryV010 } from "../../dist/apps/counterparty/repository.js";
import { createCounterpartyRoleRepositoryV010 } from "../../dist/apps/counterparty/roles.js";
import { createObjectExtensionRepositoryV010 } from "../../dist/apps/object-extension/repository.js";
import { createObjectExtensionValueRepositoryV010 } from "../../dist/apps/object-extension/values.js";
import { renderToHtml } from "../../dist/vendor/eidos/src/renderers/html/index.js";

function targetFixture() {
  const resources = createMemoryEnterpriseResourceRepositoryV010();
  const repository = createCounterpartyRepositoryV010(resources);
  return createCounterpartyImportTargetV010({
    resources,
    repository,
    roleRepository: createCounterpartyRoleRepositoryV010(resources, repository),
    extensionRepository: createObjectExtensionRepositoryV010(resources),
    extensionValueRepository: createObjectExtensionValueRepositoryV010(resources)
  });
}

function options(page) {
  return page.fields.find(field => field.key === "parameter__relationshipMode");
}

test("CV07 direct Import Center keeps all governed Counterparty relationship choices", () => {
  const page = createDataImportUploadPageV010({
    target: targetFixture(), locale: "zh-CN"
  });
  assert.deepEqual(options(page).options.map(option => option.value),
    ["NONE", "CUSTOMER", "SUPPLIER", "BOTH"]);
  assert.equal(options(page).initialValue, "NONE");
  assert.doesNotMatch(page.description, /已保留原列表的导入范围/);
  assert.deepEqual(page.contextNavigation.items.map(item => item.route),
    ["/counterparties", "/data-import", undefined]);
});

test("CV07 customer/supplier import only offers roles that preserve the original filtered worklist", () => {
  const target = targetFixture();
  for (const [route, role, opposite] of [
    [COUNTERPARTY_CUSTOMERS_ROUTE, "CUSTOMER", "SUPPLIER"],
    [COUNTERPARTY_SUPPLIERS_ROUTE, "SUPPLIER", "CUSTOMER"]
  ]) {
    const origin = counterpartyProjectionQueryRouteV010(route, {
      search: "Hong", sort: "displayName", direction: "desc", pageSize: 15
    }, 2);
    const page = createDataImportUploadPageV010({
      target, locale: "zh-CN",
      initialParameters: { relationshipMode: role },
      initialReturnTo: origin
    });
    const relationship = options(page);
    assert.deepEqual(relationship.options.map(option => option.value), [role],
      "The other role cannot be offered with this source list returnTo");
    assert.equal(relationship.initialValue, role);
    assert.equal(page.contextNavigation.items[0].route, origin);
    assert.equal(page.fields.find(field => field.key === "returnTo").initialValue, origin);
    assert.match(page.description, /已保留原列表的导入范围/);
    const html = renderToHtml(page);
    assert.match(html, /data-eidos-context-navigation/);
    assert.match(html, /type="file"/);
    assert.doesNotMatch(html, new RegExp('value="' + opposite + '"'),
      "The browser may not render an incompatible option");
  }
});

test("CV07 invalid or mismatched scoped returnTo still fails closed", () => {
  const target = targetFixture();
  const supplierRoute = counterpartyProjectionQueryRouteV010(
    COUNTERPARTY_SUPPLIERS_ROUTE, { search: "Hong", pageSize: 25 }, 0
  );
  assert.throws(() => createDataImportUploadPageV010({
    target, locale: "zh-CN",
    initialParameters: { relationshipMode: "CUSTOMER" },
    initialReturnTo: supplierRoute
  }), /DATA_IMPORT_RETURN_ROUTE_INVALID/);
  assert.throws(() => createDataImportUploadPageV010({
    target, locale: "zh-CN",
    initialParameters: { relationshipMode: "CUSTOMER" },
    initialReturnTo: "//malicious.example/import"
  }), /DATA_IMPORT_RETURN_ROUTE_INVALID/);
});
