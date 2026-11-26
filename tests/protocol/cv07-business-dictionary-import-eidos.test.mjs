import test from "node:test";
import assert from "node:assert/strict";
import {
  createMemoryEnterpriseResourceRepositoryV010
} from "../../dist/providers/enterprise-context/resources.js";
import {
  createBusinessDictionaryRepositoryV010
} from "../../dist/apps/business-dictionary/repository.js";
import {
  createBusinessDictionaryImportTargetV010,
  BUSINESS_DICTIONARY_IMPORT_TARGET_V010
} from "../../dist/apps/business-dictionary/import-target.js";
import {
  createDataImportServiceV010, suggestDataImportMappingV010
} from "../../dist/apps/data-import/service.js";
import {
  createDataImportRepositoryV010
} from "../../dist/apps/data-import/repository.js";
import {parseCsvSourceV010} from "../../dist/apps/data-import/csv.js";
import {
  dataImportUploadRouteV010
} from "../../dist/apps/data-import/constants.js";
import {
  createBusinessDictionaryDirectoryPageV010
} from "../../dist/apps/business-dictionary/page.js";
import {
  parseBusinessDictionaryDirectoryRouteV010
} from "../../dist/apps/business-dictionary/directory-query.js";
import {
  businessDictionaryPackage
} from "../../dist/catalog/seed.js";
import {
  renderCatalogBrowserToHtml
} from "../../dist/vendor/eidos/src/catalog-browser/render.js";
import {
  eidosProductiveWorkbenchCss
} from "../../dist/vendor/eidos/src/design-language/index.js";

const enterprise="enterprise:a";
const owner={actorSubjectId:"authorized-owner", recordedAt:"2026-11-25T02:00:00.000Z"};
const headers=[
  "字典编码","字典名称","选项编码","选项名称","选项状态","简体中文名称","来源别名（逗号分隔）"
];
const map=[
  "dictionaryId","displayName","optionCode","optionLabel","optionStatus",
  "optionLabelZh","optionAliases"
].map((field,index)=>({sourceColumn:headers[index],targetFieldId:field}));
function fixture(){
  const resources=createMemoryEnterpriseResourceRepositoryV010();
  const repository=createBusinessDictionaryRepositoryV010(resources);
  const target=createBusinessDictionaryImportTargetV010({resources,repository});
  const importRepository=createDataImportRepositoryV010(resources);
  const service=createDataImportServiceV010({repository:importRepository,targets:[target]});
  return {resources,repository,target,importRepository,service};
}
function source(lines){
  return parseCsvSourceV010({name:"dictionary.csv",csv:[
    headers.join(","),...lines
  ].join("\n")});
}
function stage(f,lines,jobId="import-dictionary"){
  const csv=source(lines);
  f.service.stage({contextId:enterprise,importJobId:jobId,
    targetId:BUSINESS_DICTIONARY_IMPORT_TARGET_V010,
    source:csv,mapping:map,...owner});
  return f.service.dryRun({contextId:enterprise,importJobId:jobId,locale:"zh-CN",...owner});
}
const rowA='customer.level,客户等级,A,重点客户,启用,重点客户,"重点,VIP"';
const rowB='customer.level,客户等级,B,一般客户,停用,一般客户,普通';
const rowC='sector.kind,行业分类,X,制造业,ACTIVE,制造业,工厂';

test("CV07 dictionary import reuses the registered Data Import Target and localized mapping",()=>{
  const f=fixture();
  const manifest=businessDictionaryPackage.features[0];
  assert.ok(manifest.contributions.some(c=>c.kind==="platform.data-import-target"
    && c.target.targetId===BUSINESS_DICTIONARY_IMPORT_TARGET_V010
    && c.target.binding.type==="HOST_FACTORY"));
  const schema=f.target.describe({contextId:enterprise,locale:"zh-CN"});
  assert.equal(schema.ownerPackageId,"evo-business-dictionary");
  assert.equal(schema.fields.length,headers.length + 1,
    "optional parentCode extends the Owner schema without changing legacy seven-column CSV");
  assert.ok(schema.fields.some(field=>field.fieldId==="parentCode" && !field.required));
  assert.ok(schema.fields.every(x=>x.writable&&x.surfaces.includes("IMPORT")));
  const suggestions=suggestDataImportMappingV010({schema,source:source([rowA])});
  assert.deepEqual(suggestions,map);
  const route=dataImportUploadRouteV010(BUSINESS_DICTIONARY_IMPORT_TARGET_V010);
  assert.equal(route,"/data-import/new/business-dictionary.option");
  assert.equal(f.target.completionNavigation({}).route,"/business-dictionaries");
  assert.equal(f.target.completionNavigation({
    originRoute:"/business-dictionaries?view=published&page=0&pageSize=25"
  }).route,"/business-dictionaries?view=published&page=0&pageSize=25");
  assert.throws(()=>f.target.completionNavigation({originRoute:"//foreign.example/path"}),
    /BUSINESS_DICTIONARY_DIRECTORY_ROUTE_INVALID/);
});

test("CV07 real Data Import CSV stage, mapping, dry-run and atomic commit create one draft per dictionary",()=>{
  const f=fixture();
  const dry=stage(f,[rowA,rowB,rowC]);
  assert.equal(dry.state,"DRY_RUN_READY");
  assert.equal(dry.dryRun.totalRows,3);
  assert.equal(dry.dryRun.invalidRows,0);
  const committed=f.service.commit({contextId:enterprise,importJobId:"import-dictionary",...owner});
  assert.equal(committed.state,"COMMITTED");
  assert.equal(committed.receipt.succeededRows,3);
  const customers=f.repository.get(enterprise,"customer.level");
  assert.equal(customers.version,1,"one atomic batch produces one revision");
  assert.equal(customers.state,"DRAFT","Import must never publish");
  assert.deepEqual(customers.options.map(x=>[x.code,x.status]),[
    ["A","ACTIVE"],["B","INACTIVE"]
  ]);
  assert.deepEqual(customers.options[0].aliases,["重点","VIP"]);
  assert.equal(customers.options[0].label.translations["zh-CN"],"重点客户");
  assert.equal(f.repository.get(enterprise,"sector.kind").state,"DRAFT");
  assert.equal(f.repository.getEffective(enterprise,"customer.level"),undefined);
  assert.equal(f.repository.get("enterprise:b","customer.level"),undefined,
    "Enterprise resource partition is preserved");
});

test("CV07 existing published revision remains effective; a later import only creates an unpublished draft",()=>{
  const f=fixture();
  f.repository.saveDraft({contextId:enterprise,dictionaryId:"customer.level",
    displayName:"客户等级",expectedVersion:0,options:[
      {code:"Z",label:{default:"Legacy"},status:"ACTIVE"}],...owner});
  f.repository.publish({contextId:enterprise,dictionaryId:"customer.level",
    expectedVersion:1,actorType:"HUMAN",...owner});
  const job="append-options";
  assert.equal(stage(f,[rowA,rowB],job).state,"DRY_RUN_READY");
  assert.equal(f.service.commit({contextId:enterprise,importJobId:job,...owner}).state,"COMMITTED");
  const latest=f.repository.get(enterprise,"customer.level");
  assert.equal(latest.version,2);
  assert.equal(latest.state,"DRAFT");
  assert.deepEqual(latest.options.map(x=>x.code),["Z","A","B"]);
  const published=f.repository.getEffective(enterprise,"customer.level");
  assert.equal(published.version,1);
  assert.deepEqual(published.options.map(x=>x.code),["Z"]);
});

test("CV07 duplicate codes in CSV and existing dictionary fail dry-run before any write",()=>{
  const f=fixture();
  const duplicate=stage(f,[rowA,rowA]);
  assert.equal(duplicate.state,"DRY_RUN_FAILED");
  assert.ok(duplicate.dryRun.rows.some(r=>r.issues.some(issue=>
    issue.code==="DATA_IMPORT_DUPLICATE_IN_BATCH")));
  assert.equal(f.repository.list(enterprise).length,0);
  f.repository.saveDraft({contextId:enterprise,dictionaryId:"customer.level",
    displayName:"客户等级",expectedVersion:0,options:[
      {code:"A",label:{default:"Existing"},status:"ACTIVE"}],...owner});
  const other=stage(f,[rowA],"duplicate-existing");
  assert.equal(other.state,"DRY_RUN_FAILED");
  assert.ok(other.dryRun.rows[0].issues.some(issue=>
    issue.code==="BUSINESS_DICTIONARY_IMPORT_OPTION_EXISTS"));
  assert.equal(f.repository.get(enterprise,"customer.level").version,1);
});

test("CV07 stale dry-run cannot partially commit: transaction rolls back all dictionaries",()=>{
  const f=fixture();
  assert.equal(stage(f,[rowA,rowC]).state,"DRY_RUN_READY");
  f.repository.saveDraft({contextId:enterprise,dictionaryId:"sector.kind",
    displayName:"行业分类",expectedVersion:0,options:[
      {code:"X",label:{default:"Concurrent"},status:"ACTIVE"}],...owner});
  const receipt=f.service.commit({contextId:enterprise,importJobId:"import-dictionary",...owner});
  assert.equal(receipt.state,"COMMITTED_WITH_ERRORS");
  assert.equal(receipt.receipt.failedRows,2);
  assert.equal(f.repository.get(enterprise,"customer.level"),undefined,
    "A later duplicate must roll back earlier group writes");
  assert.equal(f.repository.get(enterprise,"sector.kind").version,1);
});

test("CV07 malformed enum and cross-name collisions refuse the batch",()=>{
  const f=fixture();
  const invalid=stage(f,["customer.level,客户等级,A,重点,UNKNOWN,重点,"]);
  assert.equal(invalid.state,"DRY_RUN_FAILED");
  assert.ok(invalid.dryRun.rows[0].issues.some(x=>x.code==="DATA_IMPORT_VALUE_ENUM_INVALID"));
  assert.equal(f.repository.list(enterprise).length,0);
  const mismatch=stage(f,[rowA,"customer.level,不同名称,B,普通,ACTIVE,普通,"],"name-conflict");
  assert.equal(mismatch.state,"DRY_RUN_READY","per-row mapping cannot trust batch name consistency");
  const result=f.service.commit({contextId:enterprise,importJobId:"name-conflict",...owner});
  assert.equal(result.state,"COMMITTED_WITH_ERRORS");
  assert.equal(f.repository.list(enterprise).length,0);
});

test("CV07 Eidos view shows import only to managed audience and only when Host supplies active target route",()=>{
  const options={dictionaries:[],locale:"zh-CN",
    directorySelection:parseBusinessDictionaryDirectoryRouteV010("/business-dictionaries")};
  const route=dataImportUploadRouteV010(BUSINESS_DICTIONARY_IMPORT_TARGET_V010);
  const managed=createBusinessDictionaryDirectoryPageV010({...options,
    canManage:true,importRoute:route});
  assert.deepEqual(managed.actions.map(x=>x.id),["import","export-current-page","create"]);
  assert.equal(managed.actions[0].route,route);
  const html=renderCatalogBrowserToHtml(managed);
  assert.match(html,/data-eidos-catalog-table-toolbar/);
  assert.match(html,/data-eidos-catalog-column-controls/);
  assert.match(html,/data-eidos-catalog-action="import"/);
  assert.match(html,/导入 CSV \/ Excel/);
  const noTarget=createBusinessDictionaryDirectoryPageV010({...options,canManage:true});
  assert.ok(!noTarget.actions.some(x=>x.id==="import"));
  const readOnly=createBusinessDictionaryDirectoryPageV010({...options,
    canManage:false,importRoute:route});
  assert.ok(!readOnly.actions.some(x=>x.id==="import"));
  assert.match(eidosProductiveWorkbenchCss,/\[data-eidos-catalog-column-controls\] summary/);
  assert.match(eidosProductiveWorkbenchCss,/@media\(max-width:600px\)/);
  assert.match(eidosProductiveWorkbenchCss,/\[data-eidos-catalog-table-toolbar\]/);
});
