import test from "node:test";
import assert from "node:assert/strict";
import {createMemoryEnterpriseResourceRepositoryV010}
  from "../../dist/providers/enterprise-context/resources.js";
import {createBusinessDictionaryRepositoryV010}
  from "../../dist/apps/business-dictionary/repository.js";
import {createBusinessDictionaryActionHandlersV010}
  from "../../dist/apps/business-dictionary/actions.js";
import {createBusinessDictionaryImportTargetV010}
  from "../../dist/apps/business-dictionary/import-target.js";
import {createDataImportServiceV010,suggestDataImportMappingV010}
  from "../../dist/apps/data-import/service.js";
import {createDataImportRepositoryV010}
  from "../../dist/apps/data-import/repository.js";
import {parseCsvSourceV010}
  from "../../dist/apps/data-import/csv.js";
import {createBusinessDictionaryDetailPageV010,createBusinessDictionaryOptionPageV010,
  businessDictionaryOptionRouteV010,businessDictionaryDefinitionEditRouteV010,
  parseBusinessDictionaryRouteV010}
  from "../../dist/apps/business-dictionary/page.js";
import {createDataImportMappingPageV010}
  from "../../dist/apps/data-import/page.js";

const id="enterprise:cv07";
const actor={actorSubjectId:"owner",recordedAt:"2026-11-26T00:00:00Z"};
const root={code:"BANK",label:{default:"Bank transfer"},status:"ACTIVE"};
const child={code:"TT",label:{default:"Telegraphic transfer"},parentCode:"BANK",status:"ACTIVE"};
const leaf={code:"TT_HK",label:{default:"Hong Kong TT"},parentCode:"TT",status:"ACTIVE"};
function setup(){
  const resources=createMemoryEnterpriseResourceRepositoryV010();
  const repository=createBusinessDictionaryRepositoryV010(resources);
  return {resources,repository};
}
function save(repository,options=[root,child,leaf],extra={}){
  return repository.saveDraft({contextId:id,dictionaryId:"payment_method",
    displayName:"付款方式",expectedVersion:repository.get(id,"payment_method")?.version ?? 0,
    options,...actor,...extra});
}
test("CV07 hierarchical dictionary preserves stable parent codes and published history",()=>{
  const {repository}=setup();
  const draft=save(repository);
  assert.deepEqual(draft.options.map(x=>x.parentCode),[undefined,"BANK","TT"]);
  const published=repository.publish({contextId:id,dictionaryId:"payment_method",
    expectedVersion:1,actorSubjectId:"owner",actorType:"HUMAN",
    recordedAt:"2026-11-26T00:01:00Z"});
  assert.equal(published.state,"PUBLISHED");
  const next=save(repository,[root,{...child,label:{default:"Updated TT"}},leaf]);
  assert.equal(next.state,"DRAFT");
  assert.equal(repository.getEffective(id,"payment_method").options[1].label.default,
    "Telegraphic transfer","published parent/child snapshot stays unchanged");
  assert.equal(next.options[2].parentCode,"TT");
});
test("CV07 rejects orphan parents, self reference, and longer cycles before writes",()=>{
  const {repository}=setup();
  for(const [options,code] of [
    [[root,{...child,parentCode:"MISSING"}],"BUSINESS_DICTIONARY_PARENT_NOT_FOUND"],
    [[{...root,parentCode:"BANK"}],"BUSINESS_DICTIONARY_PARENT_SELF"],
    [[{...root,parentCode:"TT"},child],"BUSINESS_DICTIONARY_PARENT_CYCLE"],
    [[{...root,parentCode:"TT"}, {...child,parentCode:"TT_HK"},leaf],
      "BUSINESS_DICTIONARY_PARENT_CYCLE"]
  ]){
    assert.throws(()=>save(repository,options),{message:code});
    assert.equal(repository.get(id,"payment_method"),undefined);
  }
});
test("CV07 hierarchy page offers contextual add-child and separate dictionary edit",()=>{
  const {repository}=setup();const dictionary=save(repository);
  const detail=createBusinessDictionaryDetailPageV010({dictionary,canManage:true,locale:"zh-CN"});
  assert.ok(detail.actions.some(x=>x.id==="edit-definition"));
  const names=detail.items.map(x=>x.title);
  assert.ok(names[1].includes("↳"));
  assert.ok(names[2].includes("↳ ↳"));
  assert.ok(detail.items[0].secondaryActions.some(x=>x.id==="add-child"));
  const route=businessDictionaryOptionRouteV010("payment_method",undefined,"BANK");
  assert.deepEqual(parseBusinessDictionaryRouteV010(route,"option"),
    {dictionaryId:"payment_method",parentCode:"BANK"});
  const option=createBusinessDictionaryOptionPageV010({
    dictionary,parentCode:"BANK",locale:"zh-CN"
  });
  assert.equal(option.fields.find(x=>x.key==="optionParentCode").initialValue,"BANK");
  assert.ok(option.fields.find(x=>x.key==="optionParentCode").options
    .some(x=>x.value===""));
  const editRoute=businessDictionaryDefinitionEditRouteV010("payment_method");
  assert.deepEqual(parseBusinessDictionaryRouteV010(editRoute,"option"),
    {dictionaryId:"payment_method",definitionOnly:true});
  const editor=createBusinessDictionaryOptionPageV010({
    dictionary,definitionOnly:true,locale:"zh-CN"
  });
  assert.ok(editor.fields.some(x=>x.key==="definitionOnly"));
  assert.ok(!editor.fields.some(x=>x.key==="optionCode"));
  assert.ok(!createBusinessDictionaryDetailPageV010({dictionary,canManage:false}).actions.length);
  assert.equal(parseBusinessDictionaryRouteV010(
    "/business-dictionaries/option?dictionaryId=payment_method&mode=other","option"),undefined);
});
test("CV07 Owner edits definition/name without silently losing unchanged options",async()=>{
  const {repository}=setup();save(repository);
  const principal={contractVersion:"0.1.0",subjectId:"owner",
    identityProviderId:"test",sessionId:"s",actorType:"HUMAN"};
  const context={contractVersion:"0.1.0",principal,
    scope:{contractVersion:"0.1.0",enterpriseId:"ent"},
    context:{contractVersion:"0.1.0",
      activeContext:{contractVersion:"0.1.0",kind:"ENTERPRISE",contextId:id,enterpriseId:"ent"}},
    correlationId:"test"};
  const handlers=createBusinessDictionaryActionHandlersV010({
    repository,canManage:()=>true,canRead:()=>true});
  const handler=handlers.find(x=>x.commandCode==="dictionary.option.draft.save");
  assert.ok(handler);
  const request=(values)=>({contractVersion:"0.1.0",type:"command",
    command:{code:"dictionary.option.draft.save",inputVersion:"0.1.0"},
    values,actionId:"save",sourceInteractionId:"test",requiresConfirmation:false});
  const rename=await handler.execute(request({dictionaryId:"payment_method",
    displayName:"支付方式",expectedVersion:1,definitionOnly:"definition"}),context);
  assert.equal(rename.ok,true,JSON.stringify(rename));
  assert.equal(repository.get(id,"payment_method").displayName,"支付方式");
  assert.equal(repository.get(id,"payment_method").options.length,3);
  const childEdit=await handler.execute(request({dictionaryId:"payment_method",
    displayName:"支付方式",expectedVersion:2,originalCode:"TT",optionCode:"TT",
    optionLabel:"Bank transfer - TT",optionStatus:"ACTIVE",optionParentCode:"",
    optionLabelZh:"电汇",optionAliases:"TT,电汇"}),context);
  assert.equal(childEdit.ok,true,JSON.stringify(childEdit));
  const current=repository.get(id,"payment_method");
  assert.equal(current.options.find(x=>x.code==="TT").parentCode,undefined);
  assert.equal(current.options.find(x=>x.code==="TT").label.translations["zh-CN"],"电汇");
  assert.equal(repository.getEffective(id,"payment_method"),undefined);
  const denied=createBusinessDictionaryActionHandlersV010({
    repository,canManage:()=>false,canRead:()=>true})
    .find(x=>x.commandCode==="dictionary.option.draft.save");
  const rejection=await denied.execute(request({dictionaryId:"payment_method",
    displayName:"Oops",expectedVersion:3,definitionOnly:"definition"}),context);
  assert.equal(rejection.ok,false);
  assert.equal(repository.get(id,"payment_method").displayName,"支付方式");
});
test("CV07 uploaded source aliases are mapped, but composite primary key is not guessed",()=>{
  const {resources,repository}=setup();
  const target=createBusinessDictionaryImportTargetV010({resources,repository});
  const csv=parseCsvSourceV010({name:"dictionary.csv",
    csv:"选项主键,字典编码,字典名称,选项编码,选项名称,来源别名,状态,父选项编码\n"+
      "payment_method/BANK,payment_method,付款方式,BANK,银行转账,银行转帐,ACTIVE,\n"+
      "payment_method/TT,payment_method,付款方式,TT,电汇,电汇款,ACTIVE,BANK"});
  const schema=target.describe({contextId:id,locale:"zh-CN"});
  const mapping=suggestDataImportMappingV010({source:csv,schema});
  assert.equal(mapping.find(x=>x.sourceColumn==="选项主键"),undefined,
    "composite key is evidence, not an ungoverned writable field");
  assert.equal(mapping.find(x=>x.sourceColumn==="来源别名")?.targetFieldId,"optionAliases");
  assert.equal(mapping.find(x=>x.sourceColumn==="状态")?.targetFieldId,"optionStatus");
  assert.equal(mapping.find(x=>x.sourceColumn==="父选项编码")?.targetFieldId,"parentCode");
  const service=createDataImportServiceV010({
    repository:createDataImportRepositoryV010(resources),targets:[target]});
  const staged=service.stage({contextId:id,importJobId:"hierarchical-csv",
    targetId:target.targetId,source:csv,mapping,
    ignoredSourceColumns:["选项主键"],...actor});
  const mappingPage=createDataImportMappingPageV010({
    job:staged,schema,target,locale:"zh-CN"
  });
  assert.deepEqual(mappingPage.reviewTask.steps.map(s=>[s.id,s.state]),[
    ["source","complete"],["mapping","current"],["commit","upcoming"]
  ]);
  assert.match(mappingPage.description,/第 2 步（共 3 步）/);
  assert.ok(mappingPage.actions.some(a=>a.id==="review"
    && a.label.includes("预检查")));
  const checked=service.dryRun({contextId:id,importJobId:"hierarchical-csv",...actor});
  assert.equal(checked.state,"DRY_RUN_READY",JSON.stringify(checked.dryRun?.rows));
  const committed=service.commit({contextId:id,importJobId:"hierarchical-csv",...actor});
  assert.equal(committed.state,"COMMITTED",JSON.stringify(committed.receipt));
  assert.equal(repository.get(id,"payment_method").options[1].parentCode,"BANK");
  assert.equal(repository.get(id,"payment_method").state,"DRAFT");
});

test("CV07 import precheck flags orphan and cyclic parent options without committing",()=>{
  const {resources,repository}=setup();
  const target=createBusinessDictionaryImportTargetV010({resources,repository});
  const service=createDataImportServiceV010({
    repository:createDataImportRepositoryV010(resources),targets:[target]});
  const columns=["字典编码","字典名称","选项编码","选项名称","选项状态","父选项编码"];
  const ids=["dictionaryId","displayName","optionCode","optionLabel","optionStatus","parentCode"];
  const mapping=ids.map((targetFieldId,index)=>({
    sourceColumn:columns[index],targetFieldId
  }));
  const stage=(jobId,lines)=>{
    const source=parseCsvSourceV010({name:"hierarchy.csv",
      csv:[columns.join(","),...lines].join("\n")});
    service.stage({contextId:id,importJobId:jobId,targetId:target.targetId,
      source,mapping,...actor});
    return service.dryRun({contextId:id,importJobId:jobId,...actor});
  };
  const orphan=stage("orphan",["payment_method,付款方式,TT,电汇,ACTIVE,UNKNOWN"]);
  assert.equal(orphan.state,"DRY_RUN_FAILED");
  assert.ok(orphan.dryRun.rows[0].issues.some(x=>
    x.code==="BUSINESS_DICTIONARY_PARENT_NOT_FOUND"));
  const cycle=stage("cycle",[
    "payment_method,付款方式,BANK,转账,ACTIVE,TT",
    "payment_method,付款方式,TT,电汇,ACTIVE,BANK"
  ]);
  assert.equal(cycle.state,"DRY_RUN_FAILED");
  assert.ok(cycle.dryRun.rows.some(row=>row.issues.some(x=>
    x.code==="BUSINESS_DICTIONARY_PARENT_CYCLE")));
  assert.equal(repository.list(id).length,0,"no domain side effects in preflight");
});


test("CV07 dictionary editor and publish preserve validated directory context and reject forged routes before writes",async()=>{
  const {repository}=setup();const dictionary=save(repository);
  const returnTo="/business-dictionaries?view=draft&search=payment&sort=dictionaryId&direction=desc&page=2&pageSize=10";
  const detail=createBusinessDictionaryDetailPageV010({dictionary,canManage:true,returnTo});
  for(const action of [...detail.actions.filter(x=>x.type==="navigate"),
    detail.items[0].primaryAction, ...detail.items[0].secondaryActions]){
    const parsed=parseBusinessDictionaryRouteV010(action.route,"option");
    assert.equal(parsed.returnTo,returnTo);
    const form=createBusinessDictionaryOptionPageV010({dictionary,...parsed});
    assert.equal(form.fields.find(x=>x.key==="returnTo").initialValue,returnTo);
    assert.equal(form.contextNavigation.items[0].route,returnTo);
    assert.equal(parseBusinessDictionaryRouteV010(form.contextNavigation.items[1].route,"detail").returnTo,returnTo);
  }
  const context={contractVersion:"0.1.0",principal:{contractVersion:"0.1.0",
    subjectId:"owner",identityProviderId:"test",sessionId:"s",actorType:"HUMAN"},
    scope:{contractVersion:"0.1.0",enterpriseId:"ent"},
    context:{contractVersion:"0.1.0",activeContext:{contractVersion:"0.1.0",
      kind:"ENTERPRISE",contextId:id,enterpriseId:"ent"}},correlationId:"route-test"};
  const handlers=createBusinessDictionaryActionHandlersV010({repository,canManage:()=>true,canRead:()=>true});
  const run=(commandCode,values)=>handlers.find(x=>x.commandCode===commandCode).execute({
    contractVersion:"0.1.0",type:"command",command:{code:commandCode,inputVersion:"0.1.0"},
    values,sourceInteractionId:"test",actionId:"save",requiresConfirmation:false
  },context);
  const values={dictionaryId:"payment_method",displayName:"支付方式",expectedVersion:1,definitionOnly:"definition"};
  for(const invalid of ["//foreign.example/path","/business-dictionaries?unknown=1","/business-dictionaries?page=1&page=2"]){
    const result=await run("dictionary.option.draft.save",{...values,returnTo:invalid});
    assert.equal(result.ok,false);
    assert.equal(repository.get(id,"payment_method").version,1);
    assert.equal(parseBusinessDictionaryRouteV010("/business-dictionaries/option?dictionaryId=payment_method&returnTo="+encodeURIComponent(invalid),"option"),undefined);
  }
  const saved=await run("dictionary.option.draft.save",{...values,returnTo});
  assert.equal(saved.ok,true,JSON.stringify(saved));
  assert.equal(parseBusinessDictionaryRouteV010(saved.result.navigateTo,"detail").returnTo,returnTo);
  const publish=detail.actions.find(x=>x.id==="publish");
  assert.equal(publish.values.returnTo,returnTo);
  const published=await run(publish.command,{...publish.values,expectedVersion:2});
  assert.equal(published.ok,true,JSON.stringify(published));
  assert.equal(parseBusinessDictionaryRouteV010(published.result.navigateTo,"detail").returnTo,returnTo);
  assert.equal(repository.getEffective(id,"payment_method").state,"PUBLISHED");
});
