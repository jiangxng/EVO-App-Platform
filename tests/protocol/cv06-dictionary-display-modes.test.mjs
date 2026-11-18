import test from "node:test";
import assert from "node:assert/strict";
import {
  createBusinessDictionaryDirectoryPageV010,
  withBusinessDictionaryDisplayModesV010,
  parseBusinessDictionaryRouteV010
} from "../../dist/apps/business-dictionary/page.js";
import {
  businessDictionaryDirectoryQueryRouteV010,
  parseBusinessDictionaryDirectoryRouteV010 as parseRoute
} from "../../dist/apps/business-dictionary/directory-query.js";
import {renderCatalogBrowserToHtml} from "../../dist/vendor/eidos/src/catalog-browser/render.js";

const contextId="enterprise:mvp-board";
const dictionaries=[
  ["h-a","Hong Alpha","DRAFT"],
  ["h-b","Hong Beta","PUBLISHED"],
  ["h-c","Hong Charlie","DRAFT"],
  ["h-d","Hong Delta","PUBLISHED"],
  ["n-e","Other Enterprise","PUBLISHED"]
].map(([dictionaryId,displayName,state])=>({
  contractVersion:"0.1.0",contextId,dictionaryId,displayName,state,version:1,
  options:[{code:"SECRET",label:{default:"PRIVATE VALUE MUST NOT LEAK"},status:"ACTIVE"}]
}));
const route="/business-dictionaries?view=all&presentation=board&search=Hong"+
  "&sort=displayName&direction=asc&columns=displayName%2Cstate"+
  "&page=1&pageSize=2";
function pageFrom(routeValue,authorizedChart){
  const selection=parseRoute(routeValue);
  const base=createBusinessDictionaryDirectoryPageV010({
    dictionaries,canManage:false,locale:"zh-CN",directorySelection:selection
  });
  const adapted=authorizedChart ? {...base,authorizedChart} : base;
  return withBusinessDictionaryDisplayModesV010({
    page:adapted,directorySelection:selection,locale:"zh-CN"
  });
}

test("CV06 Owner Dictionary board partitions only the current authorized page and preserves query",()=>{
  const page=pageFrom(route);
  assert.equal(page.presentation,"board");
  assert.equal(page.table.pageInfo.total,4);
  assert.equal(page.table.pageInfo.page,1);
  assert.deepEqual(page.table.rows.map(row=>row.itemId),["h-c","h-d"]);
  assert.equal(page.readOnlyKanban.scope,"AUTHORIZED_CURRENT_PAGE");
  assert.equal(page.readOnlyKanban.scopeLabel.includes("3–4 / 4"),true);
  assert.deepEqual(page.readOnlyKanban.groups.map(g=>[g.id,g.itemIds]),[
    ["DRAFT",["h-c"]],["PUBLISHED",["h-d"]]
  ]);
  const boardMode=page.table.presentationViews.find(v=>v.id==="board");
  assert.equal(boardMode.selected,true);
  assert.deepEqual(page.table.presentationViews.map(v=>v.id),["table","board"]);
  const tableMode=page.table.presentationViews.find(v=>v.id==="table");
  const parsedTable=parseRoute(tableMode.route);
  assert.equal(parsedTable.presentation,undefined);
  assert.equal(parsedTable.query.search,"Hong");
  assert.equal(parsedTable.query.sort,"displayName");
  assert.equal(parsedTable.query.direction,"asc");
  assert.deepEqual(parsedTable.columns,["displayName","state"]);
  assert.equal(parsedTable.query.page,1);
  assert.equal(parsedTable.query.pageSize,2);
  assert.equal(page.table.pageInfo.previousRoute.includes("presentation=board"),true);
  const detail=parseBusinessDictionaryRouteV010(page.items[0].primaryAction.route,"detail");
  assert.equal(parseRoute(detail.returnTo).presentation,"board");
  assert.equal(parseRoute(detail.returnTo).query.page,1);
  const html=renderCatalogBrowserToHtml(page);
  assert.match(html,/data-eidos-read-only-kanban/);
  assert.match(html,/data-eidos-board-column="DRAFT"/);
  assert.match(html,/data-eidos-board-column="PUBLISHED"/);
  assert.match(html,/data-eidos-catalog-presentation-navigation/);
  assert.match(html,/data-eidos-route="\/business-dictionaries\?view=all/);
  assert.doesNotMatch(html,/data-eidos-catalog-table-wrap/);
  assert.doesNotMatch(html,/PRIVATE VALUE MUST NOT LEAK/);
  assert.doesNotMatch(html,/data-eidos-authorized-aggregate-bars/);
});

test("CV06 display transition stays in one allowlisted query, invalid modes fail closed",()=>{
  const toTable=businessDictionaryDirectoryQueryRouteV010({
    ...parseRoute(route),presentation:"table"
  },1);
  const table=pageFrom(toTable);
  assert.equal(table.presentation,"table");
  assert.match(renderCatalogBrowserToHtml(table),/data-eidos-catalog-table-wrap/);
  assert.doesNotMatch(renderCatalogBrowserToHtml(table),/data-eidos-read-only-kanban/);
  for(const value of ["kanban","../admin","CHART","", "true"]){
    assert.throws(()=>parseRoute("/business-dictionaries?presentation="+
      encodeURIComponent(value)),/BUSINESS_DICTIONARY_DIRECTORY_PRESENTATION_INVALID/);
  }
  assert.throws(()=>parseRoute(
    "/business-dictionaries?presentation=board&presentation=chart"
  ),/BUSINESS_DICTIONARY_DIRECTORY_PARAMETER_DUPLICATE/);
  assert.throws(()=>parseRoute(
    "https://external.test/business-dictionaries?presentation=board"
  ),/BUSINESS_DICTIONARY_DIRECTORY_ROUTE_INVALID/);
  const withoutHostChart=pageFrom(route.replace("presentation=board","presentation=chart"));
  assert.equal(withoutHostChart.presentation,"table");
  assert.equal(withoutHostChart.table.presentationViews.some(x=>x.id==="chart"),false);
  assert.doesNotMatch(renderCatalogBrowserToHtml(withoutHostChart),
    /data-eidos-authorized-aggregate-bars/);
});

test("CV06 separately authorized all-matching chart replaces board without fabricating counts",()=>{
  const authorizedChart={
    contractVersion:"0.1.0",kind:"authorized-aggregate-bars",
    title:"Dictionary state counts",metricId:"dictionary.count.by-state",
    dimensionFieldId:"state",schemaRef:"evo.business-dictionary.directory/0.1.0",
    unit:"dictionary",asOf:"2026-11-18T04:00:00.000Z",
    scope:"AUTHORIZED_ALL_MATCHING_ROWS",total:null,countKind:"SUPPRESSED",
    buckets:[
      {key:"DRAFT",label:"草稿",count:null,countKind:"SUPPRESSED"},
      {key:"PUBLISHED",label:"已发布",count:null,countKind:"SUPPRESSED"}
    ],
    suppressedLabel:"少于 3 条（已隐藏）",totalLabel:"授权总数",asOfLabel:"读取时间"
  };
  const requested=route.replace("presentation=board","presentation=chart");
  const page=pageFrom(requested,authorizedChart);
  assert.equal(page.presentation,"chart");
  assert.deepEqual(page.table.presentationViews.map(x=>x.id),["table","chart","board"]);
  assert.equal(page.table.presentationViews.filter(x=>x.selected).length,1);
  const html=renderCatalogBrowserToHtml(page);
  assert.match(html,/data-eidos-authorized-aggregate-bars/);
  assert.match(html,/data-eidos-chart-scope="AUTHORIZED_ALL_MATCHING_ROWS"/);
  assert.doesNotMatch(html,/data-eidos-read-only-kanban/);
  assert.doesNotMatch(html,/data-eidos-catalog-table-wrap/);
  assert.doesNotMatch(html,/data-eidos-catalog-pagination/);
  assert.doesNotMatch(html,/data-eidos-authorized-bar-count>2</);
  const back=page.table.presentationViews.find(x=>x.id==="board");
  assert.equal(parseRoute(back.route).presentation,"board");
  assert.equal(parseRoute(back.route).query.page,1);
});

test("CV06 board is independent of Saved View WRITE and honors current readable-field admission",()=>{
  const selection=parseRoute(route.replace("presentation=board","presentation=board&personalViewId=forged-view"));
  const page=createBusinessDictionaryDirectoryPageV010({
    dictionaries,directorySelection:selection,canManage:false,locale:"zh-CN"
  });
  assert.ok(page.readOnlyKanban);
  const display=withBusinessDictionaryDisplayModesV010({
    page,directorySelection:selection,locale:"zh-CN"
  });
  assert.equal(display.presentation,"board");
  assert.equal(display.table.presentationViews.some(x=>x.id==="chart"),false);
  assert.equal(display.table.views.some(x=>x.id==="personal:forged-view"),false);
  assert.equal(display.actions.some(x=>x.id==="save-view"),false);
});
