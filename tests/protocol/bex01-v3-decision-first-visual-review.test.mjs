import test from "node:test";
import assert from "node:assert/strict";

import {validateUidl} from "../../dist/vendor/eidos/src/runtime/validate.js";
import {renderToHtml} from "../../dist/vendor/eidos/src/renderers/html/index.js";
import {eidosProductiveWorkbenchCss} from "../../dist/vendor/eidos/src/design-language/productive-workbench-css.js";
import {createDataImportMappingPageV010} from "../../dist/apps/data-import/page.js";
import {createObjectExtensionBatchImportPageV010} from "../../dist/apps/object-extension/batch-page.js";

const job={
  contractVersion:"0.1.0",importJobId:"v3-human-review-fidelity",
  targetId:"counterparty.subject",targetParameters:{relationshipMode:"SUPPLIER"},
  state:"STAGED",mappingOrigin:"HUMAN",
  source:{kind:"XLSX",name:"authorized-supplier-example.xlsx",
    headers:["供应商编码","系统编码"],
    rows:[{"供应商编码":"S001","系统编码":"EXT-001"},
      {"供应商编码":"S002","系统编码":"EXT-002"}]},
  mapping:[{sourceColumn:"供应商编码",targetFieldId:"code"}],
  stagedAt:"2026-10-19T00:00:00.000Z",stagedBySubjectId:"owner"
};

test("V3 real Host mapping and batch forms visibly present real source and issues before decisions",()=>{
  const schema={fields:[{
    fieldId:"code",resolvedLabel:"供应商编码",readable:true,writable:true,
    surfaces:["IMPORT"],valueType:"STRING",required:true,semanticType:"counterparty-code"
  },{
    fieldId:"bankAccountName",resolvedLabel:"开户银行",resolvedDescription:"银行名称",readable:true,writable:true,
    surfaces:["IMPORT"],valueType:"STRING",required:false,semanticType:"counterparty-bank-name"
  },{
    fieldId:"bankAccountNumber",resolvedLabel:"开户银行",resolvedDescription:"银行账户号码",readable:true,writable:true,
    surfaces:["IMPORT"],valueType:"STRING",required:false,semanticType:"counterparty-bank-account"
  },{
    fieldId:"subjectType",resolvedLabel:"主体类型",readable:true,writable:true,
    surfaces:["IMPORT"],valueType:"STRING",required:true,semanticType:"counterparty-subject-type"
  }]};
  const mapping=createDataImportMappingPageV010({
    job,schema,locale:"zh-CN",canCreateExtension:true
  });
  const batch=createObjectExtensionBatchImportPageV010({
    job,definitions:[],importableTargets:[],locale:"zh-CN",actorSubjectId:"owner"
  });
  for(const form of [mapping,batch]){
    assert.equal(form.reviewTask.presentation,"workbench");
    const validated=validateUidl(form);
    assert.equal(validated.ok,true,JSON.stringify(validated.diagnostics));
    const html=renderToHtml(form);
    assert.match(html,/data-eidos-task-presentation="workbench"/);
    assert.doesNotMatch(html,/<details data-eidos-form-task-details>/);
    assert.ok(html.indexOf("data-eidos-form-task-metrics")<html.indexOf("data-eidos-form-review-table"),
      "visible file and task metrics must precede review decisions");
    assert.match(html,/authorized-supplier-example\.xlsx/);
    assert.match(html,/data-eidos-form-task-steps/);
    assert.match(html,/data-eidos-form-task-metrics/);
    assert.match(html,/data-eidos-form-review-table/);
    assert.match(html,/data-eidos-review-table-presentation="compact"/);
    assert.match(html,/data-eidos-review-table-choice-label/,
      "source identity is already the first column; compact select keeps an accessible label");
    assert.match(html,/data-eidos-form-review-table-filter/);
    assert.match(html,/name="importJobId"/,"Host job identity must remain in the form");
  }
  assert.equal(mapping.title,"核对导入数据");
  assert.equal(mapping.reviewTask.subject.badgeLabel,"XLSX");
  assert.equal(mapping.reviewTask.steps.length,2);
  assert.equal(mapping.reviewTask.issues.length,3);
  assert.match(mapping.reviewTask.issues.map(issue=>issue.title).join(" "),/开户银行存在多个对应字段/);
  assert.match(mapping.reviewTask.issues.map(issue=>issue.title).join(" "),/2 条记录缺少主体类型/);
  assert.match(mapping.reviewTask.issues.map(issue=>issue.title).join(" "),/系统编码尚未选择处理方式/);
  const mappingHtml=renderToHtml(mapping);
  assert.match(mappingHtml,/核对导入数据/);
  assert.match(mappingHtml,/字段对应关系/);
  assert.match(mappingHtml,/data-eidos-form-task-file-kind>XLSX/);
  assert.match(mappingHtml,/data-eidos-review-table-show-all/);
  assert.match(mappingHtml,/data-eidos-review-table-link="batch-review"/);
  assert.match(mappingHtml,/data-eidos-agent-action="ai-auto-map"/);
  assert.ok(mappingHtml.indexOf("data-eidos-agent-action")<mappingHtml.indexOf("data-eidos-form-actions"),
    "AI assistance remains available beside mapping choices without displacing the prototype footer");
  assert.match(mappingHtml,/data-eidos-action="back-to-file" data-eidos-context-route="\/data-import"/);
  assert.match(mappingHtml,/type="reset" data-eidos-action="restore-initial" data-eidos-form-reset/);
  assert.match(mappingHtml,/预检查并继续/);
  assert.doesNotMatch(mappingHtml,/data-eidos-form-field><label>当前文件/);
  assert.equal(job.source.rows[0]["系统编码"],"EXT-001");
  assert.match(eidosProductiveWorkbenchCss,/data-eidos-task-presentation="workbench"/);
  assert.match(eidosProductiveWorkbenchCss,/data-eidos-review-table-presentation="compact"/);
  assert.match(eidosProductiveWorkbenchCss,/data-eidos-form-task-issues/);
  assert.match(eidosProductiveWorkbenchCss,/data-eidos-form-task-file-kind/);
  assert.match(eidosProductiveWorkbenchCss,/data-eidos-form-review-table-heading/);
});

test("Eidos disclosure is opt-in; unknown modes fail closed",()=>{
  const doc={
    contractVersion:"0.1.1",kind:"form",id:"v3-safe-decision",title:"Review",
    purpose:"execute-command",command:{code:"test.review",inputVersion:"0.1.0"},
    fields:[{key:"choice",label:"Choice",semanticType:"test-choice",
      control:"select",required:true,initialValue:"keep",options:[{value:"keep",label:"Keep"}]}],
    actions:[{id:"confirm",type:"submit",label:"Confirm",command:"test.review"}],
    reviewTask:{
      presentation:"decision-first",
      subject:{title:"Supplier & Source <safe>",facts:[{id:"rows",label:"Rows",value:"172"}]},
      steps:[{id:"review",label:"Review",state:"current"}],
      metrics:[{id:"needs",label:"Needs review",value:"2"}],
      issuesTitle:"Needs review",
      issues:[{id:"bank",title:"Bank requires Human",focusGroupId:undefined}],
      helpText:"No supplier data committed."
    }
  };
  assert.equal(validateUidl(doc).ok,true);
  const html=renderToHtml(doc);
  assert.match(html,/Supplier &amp; Source &lt;safe&gt;/);
  assert.match(html,/data-eidos-form-task-issue="bank"/);
  assert.match(html,/No supplier data committed/);
  const cancelActions = {...doc,actions:[
    ...doc.actions,
    {id:"back",type:"cancel",label:"Back to files",route:"/data-import"},
    {id:"reset",type:"cancel",label:"Restore initial choices",resetForm:true}
  ]};
  assert.equal(validateUidl(cancelActions).ok,true);
  assert.equal(validateUidl({...cancelActions,actions:[
    ...cancelActions.actions.slice(0,-2),
    {id:"bad-route",type:"cancel",label:"Unsafe",route:"//example.com"}
  ]}).ok,false);
  assert.equal(validateUidl({...cancelActions,actions:[
    ...cancelActions.actions.slice(0,-2),
    {id:"bad-reset",type:"submit",label:"Bad reset",command:"test.review",resetForm:true}
  ]}).ok,false);
  assert.equal(validateUidl({...doc,reviewTask:{...doc.reviewTask,presentation:"hidden"}}).ok,false);
  const ordinary={...doc,reviewTask:{...doc.reviewTask,presentation:"full"}};
  const full=renderToHtml(ordinary);
  assert.doesNotMatch(full,/data-eidos-task-presentation="decision-first"/);
  assert.match(full,/data-eidos-form-task-overview/);
});
