import test from "node:test";
import assert from "node:assert/strict";
import { createMemoryEnterpriseResourceRepositoryV010 } from "../../dist/providers/enterprise-context/resources.js";
import { createObjectExtensionRepositoryV010 } from "../../dist/apps/object-extension/repository.js";
import { createObjectExtensionActionHandlersV010 } from "../../dist/apps/object-extension/actions.js";
import { createObjectExtensionBatchImportPageV010 } from "../../dist/apps/object-extension/batch-page.js";
import { OBJECT_EXTENSION_IMPORT_CREATE_COMMAND_V010, OBJECT_EXTENSION_IMPORT_DRAFT_SAVE_COMMAND_V010 } from "../../dist/apps/object-extension/constants.js";
import {assertDataImportJobV010} from "../../dist/apps/data-import/types.js";
import {createActionRequest} from "../../dist/vendor/eidos/src/runtime/action.js";
import {createDataImportActionHandlersV010} from "../../dist/apps/data-import/actions.js";
import {DATA_IMPORT_GET_COMMAND_V010,DATA_IMPORT_MAPPING_INSPECT_COMMAND_V010} from "../../dist/apps/data-import/constants.js";
import { validateUidl } from "../../dist/vendor/eidos/src/runtime/validate.js";
import { renderToHtml } from "../../dist/vendor/eidos/src/renderers/html/index.js";

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
  assert.equal(page.title,"集中审核 5 个未匹配字段");
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
  assert.equal(page.fields.find(x=>x.key==="choice_0").options
    .find(x=>x.value==="core_payment").label,"默认支付方式",
    "unique targets should not expose technical IDs");
  assert.equal(page.fields.find(x=>x.key==="choice_0").label,"默认支付方式",
    "the decision label should be a business field, not a verbose instruction");
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

test("BEX V3 real Host batch route uses an Eidos four-column decision table with actionable status", () => {
  const job=fixture();
  const original=structuredClone(job.source);
  const page=createObjectExtensionBatchImportPageV010({
    job,definitions:[],locale:"zh-CN"
  });
  assert.equal(validateUidl(page).ok,true,
    JSON.stringify(validateUidl(page).diagnostics));
  assert.equal(page.fields.find(x=>x.key==="importJobId").options[0].label,"supplier.xlsx");
  assert.equal(page.fields.find(x=>x.key==="importJobId").initialValue,job.importJobId);
  assert.equal(page.reviewGroups.length,5);
  assert.equal(page.reviewTable.columnLabels.subject,"来源列名");
  assert.equal(page.reviewTable.columnLabels.evidence,"示例值");
  assert.equal(page.reviewTable.columnLabels.decision,"对应系统字段");
  assert.equal(page.reviewTable.columnLabels.status,"状态");
  assert.equal(page.reviewTable.filter.selectedId,"needs");
  assert.ok(page.reviewTable.filter.options.find(x=>x.id==="all").statusKeys
    .includes("ignored"),"All must include statuses reachable by an unsaved choice");
  assert.equal(page.reviewTask.subject.title,"supplier.xlsx");
  assert.equal(page.reviewTask.metrics.find(x=>x.id==="proposed").value,"4");
  assert.equal(page.reviewTask.metrics.find(x=>x.id==="attention").value,"1");
  assert.equal(page.reviewTask.issues.length,1);
  assert.equal(page.reviewTask.issues[0].focusGroupId,"source-4");
  for(let i=0;i<5;i++){
    const group=page.reviewGroups[i];
    assert.equal(group.title,columns[i]);
    assert.equal(group.primaryFieldKey,"choice_"+i);
    assert.deepEqual(group.detailFieldKeys,["sample_"+i,"label_"+i,"type_"+i]);
    assert.ok(group.summary.length>0);
    assert.equal(group.reviewStatus.key,i===4?"attention":"proposed");
    assert.equal(group.statusByChoice.__CREATE__.key,"proposed");
    assert.equal(group.statusByChoice.__IGNORE__.key,"ignored");
    assert.equal(group.statusByChoice.__REVIEW__.key,"attention");
  }
  assert.equal(page.reviewGroups[4].defaultExpanded,true,
    "metadata-like source must remain explicit Human exception");
  assert.equal(page.reviewGroups[0].defaultExpanded,false);
  const html=renderToHtml(page);
  assert.equal((html.match(/data-eidos-form-review-table-row="source-/g)??[]).length,5);
  assert.equal((html.match(/data-eidos-review-table-choice/g)??[]).length,5);
  assert.equal((html.match(/data-eidos-review-group-detail/g)??[]).length,5);
  assert.match(html,/data-eidos-form-review-table-filter/);
  assert.match(html,/data-eidos-form-task-overview/);
  assert.match(html,/查看来源及候选字段用途/);
  assert.match(html,/需要校对/);
  assert.match(html,/待新增/);
  for(let i=0;i<5;i++){
    assert.equal((html.match(new RegExp('name="choice_'+i+'"','g'))??[]).length,1);
    assert.equal((html.match(new RegExp('name="label_'+i+'"','g'))??[]).length,1);
    assert.equal((html.match(new RegExp('name="sample_'+i+'"','g'))??[]).length,1);
  }
  assert.match(html,/来源样本/);
  assert.match(html,/data-eidos-exclusive-group="bex-batch-targets"/);
  assert.match(html,/data-eidos-action="create-extension-batch"/);
  assert.deepEqual(job.source,original,"review presentation must not rewrite original XLSX data");
});

test("BEX V3 same-name purposes are visible only as exact trusted data within Eidos field groups",()=>{
  const job=fixture();
  job.source.headers.push("开户银行");
  job.source.rows.forEach(row=>row["开户银行"]="香港银行");
  const page=createObjectExtensionBatchImportPageV010({
    job,definitions:[],locale:"zh-CN",
    importableTargets:[
      {fieldId:"bank.a",label:"开户银行",valueType:"STRING",description:"客户收款账户"},
      {fieldId:"bank.b",label:"开户银行",valueType:"STRING",description:"供应商付款账户"}
    ]
  });
  const group=page.reviewGroups[5];
  assert.equal(group.primaryFieldKey,"choice_5");
  assert.equal(group.defaultExpanded,true);
  assert.deepEqual(group.detailFieldKeys,
    ["candidate_5","sample_5","label_5","type_5"]);
  const html=renderToHtml(page);
  assert.match(html,/客户收款账户/);
  assert.match(html,/供应商付款账户/);
  assert.match(html,/value="__REVIEW__" selected/);
  assert.match(html,/name="choice_5"/);
  assert.equal(validateUidl(page).ok,true);
});

test("BEX V3 batch filter honors previous exclusions without falsely showing an approval",()=>{
  const job=fixture();
  job.ignoredSourceColumns=["默认支付方式"];
  const page=createObjectExtensionBatchImportPageV010({job,definitions:[],locale:"zh-CN"});
  assert.equal(page.reviewGroups[0].reviewStatus.key,"ignored");
  assert.equal(page.reviewTask.metrics.find(x=>x.id==="ignored").value,"1");
  assert.equal(page.reviewTask.metrics.find(x=>x.id==="proposed").value,"3");
  assert.equal(page.reviewTable.filter.options.find(x=>x.id==="needs").statusKeys
    .includes("ignored"),false);
  assert.equal(page.reviewTable.filter.options.find(x=>x.id==="all").statusKeys
    .includes("ignored"),true);
  assert.equal(page.fields.find(x=>x.key==="choice_0").initialValue,"__IGNORE__");
  assert.equal(validateUidl(page).ok,true);
});

test("BEX V3 restores a saved constant, never fabricates one from supplier role",()=>{
  const job=fixture();
  const absent=createObjectExtensionBatchImportPageV010({job,definitions:[],locale:"zh-CN"});
  assert.equal(absent.fields.some(x=>x.key==="batchSubjectType"),false,
    "a mapped source column is authoritative even if batch has a supplier role");
  job.mapping[1]={targetFieldId:"subjectType",
    transform:{kind:"CONSTANT",value:"ORGANIZATION"}};
  const saved=createObjectExtensionBatchImportPageV010({job,definitions:[],locale:"zh-CN"});
  const constant=saved.fields.find(x=>x.key==="batchSubjectType");
  assert.match(constant.label,/批次固定值 · 主体类型/);
  assert.equal(constant.initialValue,"ORGANIZATION");
  assert.equal(constant.control,"select");
  assert.equal(validateUidl(saved).ok,true);
});


test("V3 batch constant is not offered over a real source-column subject type", async()=>{
  const x=setup();
  const page=createObjectExtensionBatchImportPageV010({
    job:x.getJob(),definitions:[],locale:"zh-CN"
  });
  assert.equal(page.fields.some(f=>f.key==="batchSubjectType"),false);
  assert.match(page.fields.find(f=>f.key==="subjectTypeSourceNotice").initialValue,
    /不能用批次值覆盖/);
  const forged=request(x.getJob());
  forged.values.batchSubjectType="ORGANIZATION";
  const result=await x.action.execute(forged,ctx());
  assert.equal(result.ok,false);
  assert.equal(result.error.code,"OBJECT_EXTENSION_BATCH_SUBJECT_SOURCE_CONFLICT");
  assert.equal(x.repo.list(contextId,"counterparty.subject").length,0);
  assert.equal(x.getCalls(),0);
});

test("V3 explicit batch subject type persists as a true constant and restores without modifying source",async()=>{
  const x=setup();
  // This fixture has no authoritative subject type source column.
  const job=x.getJob();
  job.source.headers=job.source.headers.filter(h=>h!=="主体类型");
  job.source.rows=job.source.rows.map(row=>{
    const copy={...row};delete copy["主体类型"];return copy;
  });
  job.mapping=job.mapping.filter(item=>item.targetFieldId!=="subjectType");
  const before=structuredClone(job.source);
  let page=createObjectExtensionBatchImportPageV010({job,definitions:[],locale:"zh-CN"});
  assert.equal(page.fields.find(f=>f.key==="batchSubjectType").initialValue,"__KEEP__",
    "a supplier relationship does not imply ORGANIZATION");
  let req=request(job);
  req.values.batchSubjectType="ORGANIZATION";
  let result=await x.action.execute(req,ctx());
  assert.equal(result.ok,true,JSON.stringify(result));
  assert.equal(result.result.state,"MAPPED");
  const saved=x.getJob().mapping.find(item=>item.targetFieldId==="subjectType");
  assert.deepEqual(saved,{targetFieldId:"subjectType",
    transform:{kind:"CONSTANT",value:"ORGANIZATION"}});
  assert.deepEqual(x.getJob().source,before,"source file rows stay untouched");
  assert.equal(x.getJob().state,"STAGED");
  page=createObjectExtensionBatchImportPageV010({
    job:x.getJob(),definitions:x.repo.list(contextId,"counterparty.subject"),locale:"zh-CN"
  });
  assert.equal(page.fields.find(f=>f.key==="batchSubjectType").initialValue,"ORGANIZATION",
    "Human decision survives reopening");
});

test("V3 batch constant preflight rejects invalid enum before creating any field",async()=>{
  const x=setup();
  const job=x.getJob();
  job.mapping=job.mapping.filter(item=>item.targetFieldId!=="subjectType");
  let req=request(job);
  req.values.batchSubjectType="UNKNOWN";
  const result=await x.action.execute(req,ctx());
  assert.equal(result.ok,false);
  assert.equal(result.error.code,"OBJECT_EXTENSION_BATCH_SUBJECT_TYPE_INVALID");
  assert.equal(x.repo.list(contextId,"counterparty.subject").length,0);
  assert.equal(x.getCalls(),0);
});


test("V3 saved constant can be edited and cleared after every Excel column is mapped",async()=>{
  const x=setup();
  const job=x.getJob();
  job.source.headers=job.source.headers.filter(h=>h!=="主体类型");
  job.source.rows=job.source.rows.map(row=>{
    const copy={...row};delete copy["主体类型"];return copy;
  });
  job.mapping=job.mapping.filter(item=>item.targetFieldId!=="subjectType");
  const source=structuredClone(job.source);
  const initial=request(job,Array(5).fill("__CREATE__"));
  initial.values.batchSubjectType="ORGANIZATION";
  const first=await x.action.execute(initial,ctx());
  assert.equal(first.ok,true,JSON.stringify(first));
  assert.equal(x.getJob().mapping.length,7);
  const ownerFields=x.repo.list(contextId,"counterparty.subject").length;
  let page=createObjectExtensionBatchImportPageV010({
    job:x.getJob(),definitions:x.repo.list(contextId,"counterparty.subject"),locale:"zh-CN"
  });
  assert.equal(page.title,"修改本次导入的批次固定值");
  assert.equal(page.reviewTable,undefined);
  assert.equal(page.fields.find(f=>f.key==="batchSubjectType").initialValue,"ORGANIZATION");
  const savedChange={...request(x.getJob()),values:{
    importJobId:job.importJobId,batchMode:"BATCH",batchSubjectType:"PERSON"
  }};
  const updated=await x.action.execute(savedChange,ctx());
  assert.equal(updated.ok,true,JSON.stringify(updated));
  assert.equal(updated.result.state,"MAPPED");
  assert.equal(x.getJob().mapping.find(m=>m.targetFieldId==="subjectType").transform.value,"PERSON");
  assert.equal(x.repo.list(contextId,"counterparty.subject").length,ownerFields);
  assert.deepEqual(x.getJob().source,source);
  const clear={...request(x.getJob()),values:{
    importJobId:job.importJobId,batchMode:"BATCH",batchSubjectType:"__KEEP__"
  }};
  const result=await x.action.execute(clear,ctx());
  assert.equal(result.ok,true,JSON.stringify(result));
  assert.equal(x.getJob().mapping.some(m=>m.targetFieldId==="subjectType"),false);
  assert.equal(x.getJob().mapping.length,6);
  assert.deepEqual(x.getJob().source,source);
});

test("V3 batch approval plan is derived from every real option, not a static proposed-count mock",()=>{
  const job=fixture();
  const page=createObjectExtensionBatchImportPageV010({job,definitions:[],locale:"zh-CN"});
  assert.equal(page.reviewPlan.title,"本批字段处理方案预览");
  assert.deepEqual(page.reviewPlan.categories.map(x=>x.id),
    ["create","reuse","ignore","pending"]);
  assert.equal(page.reviewPlan.proposedFields.length,5);
  assert.equal(page.reviewPlan.proposedFields[0].groupId,"source-0");
  assert.equal(page.reviewPlan.proposedFields[0].labelFieldKey,"label_0");
  assert.equal(validateUidl(page).ok,true,JSON.stringify(validateUidl(page).diagnostics));
  const html=renderToHtml(page);
  assert.match(html,/data-eidos-form-review-plan/);
  assert.match(html,/data-eidos-review-plan-items/);
  assert.match(html,/data-eidos-plan-label-field="label_0"/);
  assert.match(html,/仅预览当前未保存的选择/);
  assert.equal((html.match(/data-eidos-form-review-table-row="source-/g)??[]).length,5,
    "same Host source rows and original choice_N are used by preview and submit");
});


test("V3 saved batch review choices are actor-scoped and never create enterprise fields",async()=>{
  const x=setup();
  const current=x.getJob();
  const untouched=structuredClone(current.source);
  const originalMappings=structuredClone(current.mapping);
  const before=createObjectExtensionBatchImportPageV010({
    job:current,definitions:[],actorSubjectId:"owner",locale:"zh-CN"
  });
  assert.equal(before.actions.length,2);
  assert.equal(before.actions[0].requiresConfirmation,true);
  assert.equal(before.actions[1].requiresConfirmation,false);
  assert.equal(before.actions[1].command,OBJECT_EXTENSION_IMPORT_DRAFT_SAVE_COMMAND_V010);
  assert.equal(validateUidl(before).ok,true,JSON.stringify(validateUidl(before).diagnostics));
  assert.match(renderToHtml(before),/data-eidos-action="save-review-draft"/);
  const values={...request(current).values};
  values.choice_0="__IGNORE__";values.label_1="月结业务方式";
  const draftRequest=createActionRequest(before,values,{actionId:"save-review-draft"});
  assert.equal(draftRequest.command.code,OBJECT_EXTENSION_IMPORT_DRAFT_SAVE_COMMAND_V010);
  assert.equal(draftRequest.requiresConfirmation,false);
  let saves=0,job=current;
  let lazyReaderResolutions=0;
  const handlers=createObjectExtensionActionHandlersV010({
    repository:x.repo,canManageEnterpriseContext:()=>true,
    resolveImportJobReader:async()=>{
      lazyReaderResolutions++;
      return (_,id)=>id===job.importJobId?job:undefined;
    },
    getImportableTargets:()=>[],
    saveBatchReviewDraft:input=>{
      saves++;job=assertDataImportJobV010({...job,
        stagedAt:"2026-10-16T00:00:00Z",stagedBySubjectId:"owner",
        batchReviewDrafts:[input.draft]});
    }
  });
  const save=handlers.find(x=>x.commandCode===OBJECT_EXTENSION_IMPORT_DRAFT_SAVE_COMMAND_V010);
  assert.ok(save);
  const result=await save.execute(draftRequest,ctx());
  assert.equal(result.ok,true,JSON.stringify(result));
  assert.equal(result.result.state,"DRAFT_SAVED");
  assert.equal(lazyReaderResolutions,1,"draft save must use lazy-resolved authoritative import reader");
  assert.equal(saves,1);
  assert.equal(x.repo.list(contextId,"counterparty.subject").length,0);
  assert.deepEqual(job.mapping,originalMappings);
  assert.deepEqual(job.source,untouched);
  const restored=createObjectExtensionBatchImportPageV010({
    job,definitions:[],actorSubjectId:"owner",locale:"zh-CN"
  });
  assert.equal(restored.fields.find(f=>f.key==="choice_0").initialValue,"__IGNORE__");
  assert.equal(restored.fields.find(f=>f.key==="label_1").initialValue,"月结业务方式");
  assert.match(restored.reviewTask.subject.statusLabel,/草稿已恢复/);
  const other=createObjectExtensionBatchImportPageV010({
    job,definitions:[],actorSubjectId:"another-owner",locale:"zh-CN"
  });
  assert.equal(other.fields.find(f=>f.key==="choice_0").initialValue,"__CREATE__");
  assert.doesNotMatch(other.reviewTask.subject.statusLabel,/草稿/);
  const forged={...draftRequest,values:{...draftRequest.values,choice_0:"unknown_target"}};
  const failed=await save.execute(forged,ctx());
  assert.equal(failed.ok,false);
  assert.equal(saves,1);
  assert.equal(x.repo.list(contextId,"counterparty.subject").length,0);
  assert.throws(()=>createActionRequest(before,values,{actionId:"forged-approval"}),
    /Selected submit action is not declared/);
});

test("V3 generic import Job and mapping-inspection responses expose only the calling Human's own draft",async()=>{
  const job=fixture();
  const draft=(actor,choice)=>({
    actorSubjectId:actor,recordedAt:"2026-10-19T00:00:00.000Z",
    columns:[{sourceColumn:columns[0],choice,label:columns[0],valueType:"STRING"}]
  });
  job.batchReviewDrafts=[
    draft("owner","__IGNORE__"),
    draft("other-owner","__CREATE__")
  ];
  const before=structuredClone(job);
  const handlers=createDataImportActionHandlersV010({
    service:{inspectMapping:()=>({contractVersion:"0.1.0",job,sourceColumns:[]})},
    repository:{get:(_,id)=>id===job.importJobId?job:undefined},
    canManageEnterpriseContext:()=>true,idFactory:()=>"_unused_"
  });
  const get=handlers.find(x=>x.commandCode===DATA_IMPORT_GET_COMMAND_V010);
  const inspect=handlers.find(x=>x.commandCode===DATA_IMPORT_MAPPING_INSPECT_COMMAND_V010);
  assert.ok(get);assert.ok(inspect);
  const req={contractVersion:"0.1.0",type:"command",
    values:{importJobId:job.importJobId}};
  const forActor=actor=>({...ctx(),principal:{...ctx().principal,subjectId:actor}});
  for(const actor of ["owner","other-owner","new-owner"]){
    const expected=before.batchReviewDrafts.filter(d=>d.actorSubjectId===actor);
    const read=await get.execute(req,forActor(actor));
    assert.equal(read.ok,true,JSON.stringify(read));
    assert.deepEqual(read.result.job.batchReviewDrafts??[],expected);
    const checked=await inspect.execute(req,forActor(actor));
    assert.equal(checked.ok,true,JSON.stringify(checked));
    assert.deepEqual(checked.result.job.batchReviewDrafts??[],expected);
  }
  assert.deepEqual(job,before,"read projection must not rewrite authoritative drafts or source rows");
});
