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
  }]};
  const mapping=createDataImportMappingPageV010({
    job,schema,locale:"zh-CN",canCreateExtension:true
  });
  const batch=createObjectExtensionBatchImportPageV010({
    job,definitions:[],importableTargets:[],locale:"zh-CN",actorSubjectId:"owner"
  });
  assert.equal(mapping.title,"核对导入数据", "the review title should match the approved V3 prototype");
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
    const headingIndex=html.indexOf("<div data-eidos-page-heading>");
    const stepperIndex=html.indexOf("<ol data-eidos-form-task-steps>");
    const overviewIndex=html.indexOf('<div data-eidos-form-task-overview data-eidos-task-presentation="workbench">');
    assert.ok(headingIndex < stepperIndex && stepperIndex < overviewIndex,
      "V3 workflow steps must share the page-heading row, not add a separate vertical block");
    assert.match(html,/data-eidos-form-task-metrics/);
    assert.match(html,/data-eidos-form-review-table/);
    assert.match(html,/type="hidden" name="importJobId"[^>]*value="v3-human-review-fidelity"/);
    assert.doesNotMatch(html,/<label>当前文件<select/);
    assert.doesNotMatch(html,/<label>批量字段审核/);
    assert.match(html,/data-eidos-review-table-presentation="compact"/);
    assert.match(html,/data-eidos-review-table-choice-label/,
      "source identity is already the first column; compact select keeps an accessible label");
    assert.match(html,/data-eidos-form-review-table-filter/);
    assert.match(html,/name="importJobId"/,"Host job identity must remain in the form");
  }
  assert.equal(job.source.rows[0]["系统编码"],"EXT-001");
  assert.match(eidosProductiveWorkbenchCss,/data-eidos-task-presentation="workbench"/);
  assert.match(eidosProductiveWorkbenchCss,/data-eidos-page-heading\] > \[data-eidos-form-task-steps\]/);
  assert.match(eidosProductiveWorkbenchCss,/data-eidos-review-table-presentation="compact"/);
  assert.match(eidosProductiveWorkbenchCss,/data-eidos-form-task-issues/);
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
  assert.equal(validateUidl({...doc,reviewTask:{...doc.reviewTask,presentation:"hidden"}}).ok,false);
  const ordinary={...doc,reviewTask:{...doc.reviewTask,presentation:"full"}};
  const full=renderToHtml(ordinary);
  assert.doesNotMatch(full,/data-eidos-task-presentation="decision-first"/);
  assert.match(full,/data-eidos-form-task-overview/);
});
