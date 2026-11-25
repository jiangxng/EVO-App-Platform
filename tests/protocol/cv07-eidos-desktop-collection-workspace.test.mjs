import test from "node:test";
import assert from "node:assert/strict";

import {
  createBusinessDictionaryDirectoryPageV010
} from "../../dist/apps/business-dictionary/page.js";
import {
  parseBusinessDictionaryDirectoryRouteV010
} from "../../dist/apps/business-dictionary/directory-query.js";
import { renderCatalogBrowserToHtml }
  from "../../dist/vendor/eidos/src/catalog-browser/render.js";
import { eidosProductiveWorkbenchCss }
  from "../../dist/vendor/eidos/src/design-language/index.js";

function dictionaryPage(path = "/business-dictionaries", rows = []) {
  return createBusinessDictionaryDirectoryPageV010({
    dictionaries: rows,
    canManage: true,
    locale: "zh-CN",
    directorySelection: parseBusinessDictionaryDirectoryRouteV010(path)
  });
}

test("CV07 desktop Collection groups business view, presentation and bounded search into one Eidos work surface", () => {
  const page = dictionaryPage();
  const routes = page.table.views.map(x => x.route);
  const withModes = {
    ...page, presentation: "table",
    table: {...page.table, presentationViews: [
      { id:"table", label:"表格", route:"/business-dictionaries?presentation=table", selected:true },
      { id:"chart", label:"图表", route:"/business-dictionaries?presentation=chart" },
      { id:"board", label:"看板", route:"/business-dictionaries?presentation=board" }
    ]}
  };
  const html = renderCatalogBrowserToHtml(withModes);
  const workspaceIndex = html.indexOf("data-eidos-catalog-workspace-controls");
  const viewIndex = html.indexOf("data-eidos-catalog-view-navigation");
  const presentationIndex = html.indexOf("data-eidos-catalog-presentation-navigation");
  const searchIndex = html.indexOf("data-eidos-catalog-server-search");
  const columnsIndex = html.indexOf("data-eidos-catalog-column-controls");
  const tableIndex = html.indexOf("data-eidos-catalog-table-wrap");
  assert.ok(workspaceIndex >= 0
    && workspaceIndex < viewIndex
    && viewIndex < presentationIndex
    && presentationIndex < searchIndex
    && searchIndex < columnsIndex
    && columnsIndex < tableIndex, "one ordered toolbar before the table");
  assert.equal(html.match(/data-eidos-catalog-workspace-controls/g).length, 1);
  assert.equal(html.match(/data-eidos-catalog-workspace-switches/g).length, 1);
  assert.match(html, /data-eidos-catalog-action="create"[^>]+data-eidos-primary="true"/);
  assert.match(html, /placeholder="搜索字典名称或编码"/);
  assert.equal(page.table.views.map(x => x.route).join("||"), routes.join("||"),
    "presentation does not change Owner-authorized filter routes");
  assert.match(html, /data-eidos-catalog-table-empty/);
  assert.match(html, /当前企业还没有业务字典。/);
  assert.match(html, /colspan="5"/);
});

test("CV07 responsive Eidos CSS is desktop-productive without inheriting phone touch density", () => {
  const css = eidosProductiveWorkbenchCss;
  assert.match(css, /\[data-eidos-catalog-workspace-controls\]\{\s*display:flex;align-items:center;justify-content:space-between/);
  assert.match(css, /\[data-eidos-catalog-workspace-switches\]\{\s*display:flex;align-items:center;flex-wrap:wrap/);
  assert.match(css, /\[data-eidos-catalog-workspace-controls\] \[data-eidos-catalog-table-toolbar\]\{/);
  assert.match(css, /\[data-eidos-catalog-workspace-controls\] \[data-eidos-catalog-server-search\]\{[^}]*max-width:360px/);
  assert.match(css, /\[data-eidos-catalog-workspace-controls\] \[data-eidos-catalog-view-navigation\] button\{[^}]*min-height:var\(--eidos-touch-target\)/);
  assert.match(css, /@media\(max-width:700px\)\{\s*\[data-eidos-catalog-workspace-controls\]/);
  assert.match(css, /\[data-eidos-catalog-workspace-controls\] \[data-eidos-catalog-presentation-navigation\] button\{\s*min-height:44px/);
  assert.match(css, /\[data-eidos-catalog-table-empty\] td\{/);
});

test("CV07 Dictionary empty states distinguish zero enterprise records from filtered misses", () => {
  const base = dictionaryPage();
  const search = dictionaryPage("/business-dictionaries?search=missing");
  const draft = dictionaryPage("/business-dictionaries?view=draft");
  assert.equal(base.emptyMessage, "当前企业还没有业务字典。");
  assert.equal(search.emptyMessage, "没有符合当前筛选条件的业务字典。");
  assert.equal(draft.emptyMessage, "没有符合当前筛选条件的业务字典。");
  for (const page of [base, search, draft]) {
    const html=renderCatalogBrowserToHtml(page);
    assert.match(html, /data-eidos-catalog-table-empty/);
    assert.match(html, new RegExp(page.emptyMessage));
    assert.ok(page.table.pageInfo);
  }
});

test("CV07 nonempty desktop table retains action/navigation and no false empty panel", () => {
  const page = dictionaryPage("/business-dictionaries", [{
    contractVersion:"0.1.0", contextId:"enterprise:abc", dictionaryId:"customer.level",
    displayName:"客户等级", version:1,state:"DRAFT",options:[]
  }]);
  const html=renderCatalogBrowserToHtml(page);
  assert.match(html, /data-eidos-table-row="customer.level"/);
  assert.match(html, /data-eidos-catalog-table-toolbar/);
  assert.doesNotMatch(html, /data-eidos-catalog-table-empty/);
  assert.match(html, /data-eidos-catalog-action="import"|data-eidos-catalog-action="create"/);
});
