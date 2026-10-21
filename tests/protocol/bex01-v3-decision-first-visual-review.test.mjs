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
    assert.doesNotMatch(html,/data-eidos-form-task-facts/,
      "V3 source totals belong in the compact file subtitle and task metrics, not a duplicate facts row");
    assert.match(html,/data-eidos-form-task-steps/);
    const headingIndex=html.indexOf("<div data-eidos-page-heading>");
    const stepperIndex=html.indexOf("<ol data-eidos-form-task-steps");
    const overviewIndex=html.indexOf('<div data-eidos-form-task-overview data-eidos-task-presentation="workbench">');
    assert.ok(headingIndex < stepperIndex && stepperIndex < overviewIndex,
      "V3 workflow steps must share the page-heading row, not add a separate vertical block");
    assert.match(html,/data-eidos-form-task-metrics/);
    assert.match(html,/data-eidos-form-review-table/);
    assert.match(html,/type="hidden" name="importJobId"[^>]*value="v3-human-review-fidelity"/);
    assert.doesNotMatch(html,/<label>当前文件<select/);
    assert.doesNotMatch(html,/<label>批量字段审核/);
    assert.match(html,/data-eidos-review-table-presentation="compact"/);
    assert.match(html,/data-eidos-review-table-evidence-layout="(inline-collapsed|stacked)"/);
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
  assert.match(eidosProductiveWorkbenchCss,/counter-reset:eidos-workbench-issue/);
  assert.match(eidosProductiveWorkbenchCss,/li::before/);
  assert.match(batch.reviewTask.subject.subtitle,/\d+ 列来源/);
  assert.match(batch.reviewTask.subject.subtitle,/\d+ 列待处理/);
  assert.match(mapping.description,/请核对字段对应关系/);
  assert.ok(mapping.description.length < 80,"mapping first-screen copy should be concise");
  const linkTask={...mapping.reviewTask,issues:[{id:"subject-rows",
    title:"3 条记录缺少主体类型",actionLabel:"查看记录",
    relatedRoutes:[{label:"第 165 行",route:"/data-import/jobs/test-job/fix/165/2"}]}]};
  const linkDoc={...mapping,reviewTask:linkTask};
  assert.equal(validateUidl(linkDoc).ok,true,
    "verified row correction links must work with original review-task contract");
  assert.match(renderToHtml(linkDoc),/data-eidos-form-task-issue-related/);
  assert.match(renderToHtml(linkDoc),/data-eidos-context-route="\/data-import\/jobs\/test-job\/fix\/165\/2"/);
  assert.equal(validateUidl({...linkDoc,reviewTask:{...linkTask,issues:[{
    ...linkTask.issues[0],relatedRoutes:[{label:"Unsafe",route:"https://outside.invalid"}]
  }]}}).ok,false,"row links must only allow Host-internal navigation");
  assert.equal(validateUidl({...linkDoc,reviewTask:{...linkTask,issues:[{
    ...linkTask.issues[0],relatedRoutes:[
      linkTask.issues[0].relatedRoutes[0],linkTask.issues[0].relatedRoutes[0]]
  }]}}).ok,false,"repeated row links must fail closed");
  assert.equal(mapping.reviewTable.evidenceLayout,"inline-collapsed");
  assert.equal(validateUidl({...mapping,reviewTable:{...mapping.reviewTable,
    evidenceLayout:"invalid"}}).ok,false);
  assert.equal(validateUidl({...mapping,reviewTable:{...mapping.reviewTable,
    presentation:"standard",evidenceLayout:"inline-collapsed"}}).ok,false);
  assert.match(renderToHtml({...mapping,reviewTable:{...mapping.reviewTable,
    evidenceLayout:undefined}}),/data-eidos-review-table-evidence-layout="stacked"/);
  assert.equal(mapping.reviewTable.utilityNavigation.label,"字段处理工具");
  assert.deepEqual(mapping.reviewTable.utilityNavigation.items.map(item=>item.id),
    ["batch-review","create-extension"]);
  assert.equal(mapping.contextNavigation.items.some(item=>item.id==="batch-review"
    || item.id==="create-extension"),false);
  const utilityHtml=renderToHtml(mapping);
  assert.match(utilityHtml,/data-eidos-form-review-table-utility-nav/);
  assert.match(utilityHtml,/data-eidos-form-review-table-utility-id="batch-review"/);
  assert.match(utilityHtml,/data-eidos-context-route="\/object-extensions\/from-import\?/);
  assert.equal(validateUidl({...mapping,reviewTable:{...mapping.reviewTable,
    utilityNavigation:{label:"Unsafe",items:[{id:"bad",label:"Unsafe",
      route:"https://example.invalid"}]}}}).ok,false);
  assert.equal(validateUidl({...mapping,reviewTable:{...mapping.reviewTable,
    utilityNavigation:{label:"Duplicate",items:[
      mapping.reviewTable.utilityNavigation.items[0],
      mapping.reviewTable.utilityNavigation.items[0]]}}}).ok,false);
  assert.equal(mapping.reviewTable.agentActionId,"ai-auto-map");
  const htmlWithAgent=renderToHtml(mapping);
  assert.match(htmlWithAgent,/data-eidos-review-table-agent-action/);
  assert.equal((htmlWithAgent.match(/data-eidos-agent-action="ai-auto-map"/g)??[]).length,1,
    "the existing Host Agent action must have exactly one real button");
  assert.doesNotMatch(htmlWithAgent.split("<footer data-eidos-form-actions>")[1],
    /data-eidos-agent-action="ai-auto-map"/,
    "AI mapping belongs beside mapping decisions rather than extra footer actions");
  assert.equal(validateUidl({...mapping,reviewTable:{...mapping.reviewTable,
    agentActionId:"nonexistent-agent-action"}}).ok,false,
    "inert toolbar buttons must be rejected rather than faked");
  assert.equal(mapping.reviewTable.heading.title,"字段对应关系");
  assert.match(mapping.reviewTable.toolbarHint,/优先显示需要确认/);
  assert.match(mapping.reviewTable.footnote,/原始文件内容仍会保留/);
  assert.match(renderToHtml(mapping),/data-eidos-form-review-table-toolbar-context/);
  assert.match(renderToHtml(mapping),/data-eidos-form-review-table-footnote/);
  assert.equal(validateUidl({...mapping,reviewTable:{...mapping.reviewTable,
    footnote:""}}).ok,false);
  assert.equal(validateUidl({...mapping,reviewTable:{...mapping.reviewTable,
    toolbarHint:"x".repeat(241)}}).ok,false);
  assert.ok(renderToHtml(mapping).includes("<h2>字段对应关系</h2>"));
  assert.equal(validateUidl({...mapping,reviewTable:{...mapping.reviewTable,
    heading:{title:""}}}).ok,false);
  assert.equal(mapping.reviewTask.issuesLayout,"connected");
  const continuousMarkup=renderToHtml(mapping);
  assert.match(continuousMarkup,/data-eidos-form-task-issues data-eidos-task-issues-layout="connected"/);
  assert.match(eidosProductiveWorkbenchCss,/data-eidos-task-issues-layout="connected"/);
  assert.equal(validateUidl({...mapping,reviewTask:{...mapping.reviewTask,
    issuesLayout:"unknown"}}).ok,false);
  assert.equal(validateUidl({...mapping,reviewTask:{...mapping.reviewTask,
    presentation:"decision-first",issuesLayout:"connected"}}).ok,false);
  assert.equal(validateUidl({...mapping,reviewTask:{...mapping.reviewTask,
    issues:[],issuesLayout:"connected",issuesCountSuffix:undefined}}).ok,false);
  const separateMarkup=renderToHtml({...mapping,reviewTask:{...mapping.reviewTask,
    issuesLayout:undefined}});
  assert.doesNotMatch(separateMarkup,/data-eidos-task-issues-layout/,
    "other Eidos workbenches retain their independent issue-card layout");
  assert.equal(mapping.reviewTask.issuesCountSuffix,"项待处理");
  assert.ok(renderToHtml(mapping).includes('data-eidos-task-steps-presentation="workbench"'));
  assert.ok(renderToHtml(mapping).includes('aria-current="step"'));
  assert.match(eidosProductiveWorkbenchCss,/counter-reset:eidos-workbench-step/);
  assert.equal(validateUidl({...mapping,reviewTask:{...mapping.reviewTask,
    issuesCountSuffix:""}}).ok,false);
  assert.equal(mapping.reviewTask.subject.statusTone,"positive",
    "real staged file status must be positive only after source evidence loaded");
  assert.match(renderToHtml(mapping),/data-eidos-form-task-source-status data-tone="positive">文件已读取/);
  assert.match(eidosProductiveWorkbenchCss,/data-eidos-form-task-metric\]\[data-tone="warning"\]/);
  // Exact source CSS in V3 #909; color/section fidelity is not a row-height test.
  assert.ok(eidosProductiveWorkbenchCss.includes('form[data-eidos-id="evo-data-import.mapping"]{\n  --eidos-fg:#172b44;'));
  for(const token of ["--eidos-bg-subtle:#f5f7fa","--eidos-primary:#2563a6",
    "--eidos-success:#18765a","--eidos-warning:#a66712",
    "--eidos-danger:#b54738","--eidos-border:#e3e9ef"]) {
    assert.ok(eidosProductiveWorkbenchCss.includes(token), "V3 prototype palette missing: "+token);
  }
  assert.ok(eidosProductiveWorkbenchCss.includes('[data-eidos-workspace-content]:has(form[data-eidos-id="evo-data-import.mapping"])'));
  assert.ok(eidosProductiveWorkbenchCss.includes('[data-eidos-form-task-metric][data-tone="warning"]{\n  background:#fffdfa;'));

  assert.equal(validateUidl({...mapping,reviewTask:{...mapping.reviewTask,
    subject:{...mapping.reviewTask.subject,statusTone:"danger"}}}).ok,false,
    "unknown source status tones must be rejected");
  assert.equal(validateUidl({...mapping,reviewTask:{...mapping.reviewTask,
    subject:{...mapping.reviewTask.subject,statusLabel:undefined}}}).ok,false,
    "semantic source tone may not appear without a visible status");
  assert.equal(mapping.reviewTask.subject.iconLabel,"XLSX");
  assert.match(renderToHtml(mapping),/data-eidos-form-task-icon aria-hidden="true">XLSX/);
  assert.ok(renderToHtml(mapping).includes('type="button" data-eidos-form-task-back data-eidos-context-route="/data-import"'),
    "Back to file list must be bound to real internal navigation");
  assert.match(renderToHtml(mapping),/type="reset" data-eidos-form-task-reset/);
  assert.match(eidosProductiveWorkbenchCss,/data-eidos-form-task-icon/);
  assert.equal(validateUidl({...mapping,reviewTask:{...mapping.reviewTask,
    footer:{...mapping.reviewTask.footer,back:{label:"Unsafe",route:"https://bad"}}}}).ok,false);
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
