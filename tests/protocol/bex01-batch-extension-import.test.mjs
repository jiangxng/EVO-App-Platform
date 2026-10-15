import test from "node:test";
import assert from "node:assert/strict";
import { createMemoryEnterpriseResourceRepositoryV010 } from "../../dist/providers/enterprise-context/resources.js";
import { createObjectExtensionRepositoryV010 } from "../../dist/apps/object-extension/repository.js";
import { createObjectExtensionActionHandlersV010 } from "../../dist/apps/object-extension/actions.js";
import { createObjectExtensionBatchImportPageV010 } from "../../dist/apps/object-extension/batch-page.js";
import { OBJECT_EXTENSION_IMPORT_CREATE_COMMAND_V010 } from "../../dist/apps/object-extension/constants.js";

const contextId = "enterprise-context:bex-batch";
const columns = ["默认支付方式", "结算方式", "默认账期方式", "账期天数", "系统编码"];
function fixture() {
  return {
    contractVersion:"0.1.0",importJobId:"batch-bex-01",targetId:"counterparty.subject",
    targetParameters:{relationshipMode:"SUPPLIER"},state:"STAGED",
    source:{kind:"XLSX",name:"supplier.xlsx",headers:["编码","主体类型",...columns],
      rows:[{"编码":"S001","主体类型":null,"默认支付方式":"转账","结算方式":"月结",
        "默认账期方式":"月末","账期天数":30,"系统编码":"A100"},
        {"编码":"S002","主体类型":"ORGANIZATION","默认支付方式":"现付",
        "结算方式":"现结","默认账期方式":"当日","账期天数":0,"系统编码":"A101"}]},
    mapping:[{sourceColumn:"编码",targetFieldId:"code"},
      {sourceColumn:"主体类型",targetFieldId:"subjectType"}],
    mappingOrigin:"HUMAN"
  };
}
function ctx(kind="ENTERPRISE") {
  return {
    contractVersion:"0.1.0",
    principal:{contractVersion:"0.1.0",subjectId:"owner",actorType:"HUMAN",
      identityProviderId:"test",sessionId:"test"},
    scope:{contractVersion:"0.1.0",enterpriseId:"e"},
    context:{contractVersion:"0.1.0",
      activeContext:{contractVersion:"0.1.0",kind,contextId,enterpriseId:"e"}},
    correlationId:"bex-batch-proof"
  };
}
function request(job, choices) {
  const values={importJobId:job.importJobId,batchMode:"BATCH"};
  columns.forEach((column,index)=>{
    values["choice_"+index]=choices?.[index]??(index===4?"__IGNORE__":"__CREATE__");
    values["label_"+index]=column;
    values["type_"+index]=index===3?"NUMBER":"STRING";
  });
  return {contractVersion:"0.1.0",type:"command",
    command:{code:OBJECT_EXTENSION_IMPORT_CREATE_COMMAND_V010,inputVersion:"0.1.0"},
    actionId:"create-extension-batch",sourceInteractionId:"test",
    requiresConfirmation:true,values};
}
function setup(options={}) {
  const repo=createObjectExtensionRepositoryV010(createMemoryEnterpriseResourceRepositoryV010());
  let job=fixture(), failOnce=Boolean(options.failOnce), calls=0;
  const handlers=createObjectExtensionActionHandlersV010({
    repository:repo,canManageEnterpriseContext:()=>true,
    getImportJob:(_,id)=>id===job.importJobId?job:undefined,
    applyImportMapping:values=>{
      calls++;
      if(failOnce){failOnce=false;throw new Error("TRANSIENT_IMPORT_MAPPING_FAILURE");}
      job={...job,mapping:structuredClone(values.mapping),
        ignoredSourceColumns:structuredClone(values.ignoredSourceColumns ?? [])};
    }
  });
  const action=handlers.find(x=>x.commandCode===OBJECT_EXTENSION_IMPORT_CREATE_COMMAND_V010);
  assert.ok(action);
  return {repo,action,getJob:()=>job,getCalls:()=>calls};
}

test("BEX batch page provides one screen, review gating, type suggestions, and Agent-independent path",()=>{
  const job=fixture();
  const page=createObjectExtensionBatchImportPageV010({job,definitions:[],locale:"zh-CN"});
  assert.equal(page.id,"evo-object-extension.batch-import");
  assert.match(page.title,/集中审核/);
  assert.equal(page.fields.find(x=>x.key==="choice_0").initialValue,"__CREATE__");
  assert.equal(page.fields.find(x=>x.key==="choice_4").initialValue,"__REVIEW__");
  assert.equal(page.fields.find(x=>x.key==="type_3").initialValue,"NUMBER");
  assert.equal(page.fields.find(x=>x.key==="label_2").initialValue,"默认账期方式");
  assert.match(page.fields.find(x=>x.key==="sample_0").initialValue,/来源样本：转账 · 现付/);
  assert.equal(page.actions[0].requiresConfirmation,true);
  assert.equal(page.fields.filter(x=>x.semanticType==="object-extension-batch-action").length,5);
  assert.equal(page.fields.find(x=>x.key==="choice_0").exclusiveSelect.group,"bex-batch-targets");
});

test("BEX batch Human confirmation creates four extension fields, saves all mappings, but never imports or invents subjectType",async()=>{
  const x=setup();
  const before=structuredClone(x.getJob().source.rows);
  const result=await x.action.execute(request(x.getJob()),ctx());
  assert.equal(result.ok,true,JSON.stringify(result));
  assert.equal(result.result.state,"MAPPED");
  assert.equal(result.result.mapped.length,4);
  assert.equal(result.result.created.length,4);
  assert.equal(result.result.ignored[0],"系统编码");
  assert.equal(x.repo.list(contextId,"counterparty.subject").length,4);
  assert.equal(x.getJob().mapping.length,6);
  assert.deepEqual(x.getJob().ignoredSourceColumns,["系统编码"]);
  const afterPage=createObjectExtensionBatchImportPageV010({
    job:x.getJob(),definitions:x.repo.list(contextId,"counterparty.subject"),locale:"zh-CN"
  });
  assert.equal(afterPage.fields.find(x=>x.key==="choice_0").initialValue,"__IGNORE__");
  assert.deepEqual(x.getJob().source.rows,before);
  assert.equal(x.getJob().source.rows[0]["主体类型"],null);
  assert.equal(x.repo.list(contextId,"counterparty.subject")
    .find(x=>x.label.default==="账期天数").valueType,"NUMBER");
  assert.equal(x.getCalls(),1);
  assert.match(result.result.navigateTo,/\/map$/);
});

test("BEX batch does not write any field when review is unresolved or a target is repeated",async()=>{
  const x=setup();
  const unresolved=request(x.getJob());
  unresolved.values.choice_2="__REVIEW__";
  const invalid=await x.action.execute(unresolved,ctx());
  assert.equal(invalid.ok,false);
  assert.equal(invalid.error.code,"OBJECT_EXTENSION_BATCH_REVIEW_REQUIRED");
  assert.equal(x.repo.list(contextId,"counterparty.subject").length,0);
  const forbidden=await x.action.execute(request(x.getJob()),ctx("PERSONAL"));
  assert.equal(forbidden.ok,false);
  assert.equal(x.repo.list(contextId,"counterparty.subject").length,0);
});

test("BEX batch recovers from post-definition mapping failure without duplicate definitions",async()=>{
  const x=setup({failOnce:true});
  const first=await x.action.execute(request(x.getJob()),ctx());
  assert.equal(first.ok,true);
  assert.equal(first.result.state,"PARTIAL");
  assert.equal(first.result.created.length,4);
  assert.equal(x.repo.list(contextId,"counterparty.subject").length,4);
  assert.equal(x.getJob().mapping.length,2);
  const page=createObjectExtensionBatchImportPageV010({
    job:x.getJob(),definitions:x.repo.list(contextId,"counterparty.subject"),locale:"zh-CN"
  });
  const retry=request(x.getJob());
  for(let i=0;i<4;i++) {
    assert.notEqual(page.fields.find(y=>y.key==="choice_"+i).initialValue,"__CREATE__");
  }
  const second=await x.action.execute(request(x.getJob()),ctx());
  assert.equal(second.ok,true,JSON.stringify(second));
  assert.equal(second.result.state,"MAPPED");
  assert.equal(x.repo.list(contextId,"counterparty.subject").length,4);
  assert.equal(x.getJob().mapping.length,6);
  assert.equal(x.getCalls(),2);
});

test("BEX batch offers core targets first, and two same-name opening bank fields require Human review",()=>{
  const job=fixture();
  job.source.headers.push("开户银行");
  job.source.rows.forEach(row=>{row["开户银行"]="Test Bank";});
  const page=createObjectExtensionBatchImportPageV010({
    job,definitions:[],locale:"zh-CN",
    importableTargets:[
      {fieldId:"core_payment",label:"默认支付方式",valueType:"STRING"},
      {fieldId:"ext_bank_1",label:"开户银行",valueType:"STRING"},
      {fieldId:"ext_bank_2",label:"开户银行",valueType:"STRING"}
    ]
  });
  assert.equal(page.fields.find(x=>x.key==="choice_0").initialValue,"core_payment");
  assert.equal(page.fields.find(x=>x.key==="choice_5").initialValue,"__REVIEW__");
  assert.deepEqual(page.fields.find(x=>x.key==="choice_5").options
    .filter(x=>x.label.startsWith("开户银行")).map(x=>x.value),
    ["ext_bank_1","ext_bank_2"]);
});


test("BEX batch accepts ignore-only decisions and keeps every original cell for later correction",async()=>{
  const x=setup();
  const choices=columns.map(()=>"__IGNORE__");
  const original=structuredClone(x.getJob().source.rows);
  const result=await x.action.execute(request(x.getJob(),choices),ctx());
  assert.equal(result.ok,true,JSON.stringify(result));
  assert.equal(result.result.state,"MAPPED");
  assert.equal(result.result.created.length,0);
  assert.deepEqual(x.getJob().ignoredSourceColumns,columns);
  assert.deepEqual(x.getJob().source.rows,original);
  assert.equal(x.repo.list(contextId,"counterparty.subject").length,0);
  const page=createObjectExtensionBatchImportPageV010({
    job:x.getJob(),definitions:[],locale:"zh-CN"
  });
  assert.equal(page.fields.find(x=>x.key==="choice_0").initialValue,"__IGNORE__");
});

test("V3 same-label target comparison explains distinct purposes beside actual Excel samples, without choosing by name", () => {
  const job = fixture();
  job.source.headers.push("开户银行");
  job.source.rows[0]["开户银行"] = "香港银行 A";
  job.source.rows[1]["开户银行"] = "香港银行 B";
  const source = structuredClone(job.source);
  const fields = [
    {fieldId:"bank.receiving", label:"开户银行", valueType:"STRING",
      description:"收款时使用的银行账户，仅适用于客户回款"},
    {fieldId:"bank.settlement", label:"开户银行", valueType:"STRING",
      description:"付款时使用的银行账户，仅适用于供应商结算"},
    {fieldId:"supplier.primary",label:"默认支付方式",valueType:"STRING"}
  ];
  const page = createObjectExtensionBatchImportPageV010({
    job,definitions:[],importableTargets:fields,locale:"zh-CN"
  });
  const candidate = page.fields.find(x=>x.key==="candidate_5");
  assert.ok(candidate);
  assert.equal(candidate.readOnly,true);
  assert.match(candidate.initialValue,/bank\.receiving/);
  assert.match(candidate.initialValue,/bank\.settlement/);
  assert.match(candidate.initialValue,/收款时使用的银行账户/);
  assert.match(candidate.initialValue,/付款时使用的银行账户/);
  const select=page.fields.find(x=>x.key==="choice_5");
  assert.equal(select.initialValue,"__REVIEW__");
  assert.equal(select.exclusiveSelect.group,"bex-batch-targets");
  assert.deepEqual(select.options.filter(x=>x.value.startsWith("bank."))
    .map(x=>x.value),["bank.receiving","bank.settlement"]);
  assert.match(select.options.find(x=>x.value==="bank.receiving").label,/客户回款/);
  assert.match(select.options.find(x=>x.value==="bank.settlement").label,/供应商结算/);
  assert.match(page.fields.find(x=>x.key==="sample_5").initialValue,/香港银行 A · 香港银行 B/);
  assert.deepEqual(job.source,source,"Actual source rows and existing Recipe are never changed by candidate comparison");
});

test("V3 occupied candidate and undocumented same-name purpose remain explicit Human review, never auto-create",()=>{
  const job=fixture();
  job.source.headers.push("开户银行","往来银行");
  job.source.rows.forEach(row=>{
    row["开户银行"]="HK";
    row["往来银行"]="Other Bank";
  });
  job.mapping.push({sourceColumn:"往来银行",targetFieldId:"bank.receiving"});
  const page=createObjectExtensionBatchImportPageV010({
    job,definitions:[],locale:"zh-CN",
    importableTargets:[
      {fieldId:"bank.receiving",label:"开户银行",valueType:"STRING"},
      {fieldId:"bank.settlement",label:"开户银行",valueType:"STRING",
        description:"仅供应商结算使用"}
    ]
  });
  const compare=page.fields.find(x=>x.key==="candidate_5");
  assert.match(compare.initialValue,/用途尚未配置/);
  assert.match(compare.initialValue,/已用于来源列：往来银行/);
  assert.equal(page.fields.find(x=>x.key==="choice_5").initialValue,"__REVIEW__");
  assert.equal(page.fields.find(x=>x.key==="choice_5").options
    .some(x=>x.value==="bank.receiving"),false,
    "exclusive selection prevents reusing a reserved field even if it has the same name");
});
