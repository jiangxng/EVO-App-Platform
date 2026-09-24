import { renderToHtml } from "../../vendor/eidos/src/renderers/html/index.js";

function eidosForm(document: unknown): string {
  return renderToHtml(document);
}

const installPlanForm = eidosForm({
  contractVersion: "0.1.1",
  kind: "form",
  id: "app-platform.install-plan",
  title: "1. 生成安装计划",
  purpose: "execute-command",
  command: { code: "app-platform.plan-install", inputVersion: "0.1.0" },
  fields: [],
  actions: [
    { id: "plan", label: "检查依赖并生成安装计划", type: "submit", command: "app-platform.plan-install", requiresConfirmation: false }
  ],
  metadata: { packageId: "evo-ledger-runtime-configurator" }
});

const installExecuteForm = eidosForm({
  contractVersion: "0.1.1",
  kind: "form",
  id: "app-platform.install-execute",
  title: "2. 安装 Package 并激活默认 Feature",
  purpose: "execute-command",
  command: { code: "app-platform.install-package", inputVersion: "0.1.0" },
  fields: [],
  actions: [
    { id: "install", label: "确认安装", type: "submit", command: "app-platform.install-package", requiresConfirmation: true }
  ],
  metadata: { packageId: "evo-ledger-runtime-configurator" }
});

const ruleEditorForm = eidosForm({
  contractVersion: "0.1.1",
  kind: "form",
  id: "ledger-runtime-configurator.rule-editor",
  title: "规则配置",
  purpose: "execute-command",
  command: { code: "evo-ledger-runtime-configurator.save-rule", inputVersion: "0.1.0" },
  fields: [
    { key: "applicationId", label: "应用", semanticType: "application-id", control: "select", required: true, options: [{ value: "__loading__", label: "加载中…" }] },
    { key: "ruleId", label: "规则", semanticType: "posting-rule-id", control: "select", required: true, options: [{ value: "__loading__", label: "加载中…" }] },
    { key: "direction", label: "方向", semanticType: "posting-direction", control: "text", required: true },
    { key: "condition", label: "条件表达式", semanticType: "evo-expression-source", control: "text", required: false },
    { key: "quantity", label: "数量公式", semanticType: "evo-expression-source", control: "text", required: false },
    { key: "amount", label: "金额公式", semanticType: "evo-expression-source", control: "text", required: false }
  ],
  actions: [
    { id: "save", label: "保存规则", type: "submit", command: "evo-ledger-runtime-configurator.save-rule", requiresConfirmation: false }
  ]
});

const validateForm = eidosForm({
  contractVersion: "0.1.1", kind: "form", id: "ledger-runtime-configurator.validate",
  title: "校验 / 编译 912 条规则", purpose: "execute-command",
  command: { code: "evo-ledger-runtime-configurator.validate", inputVersion: "0.1.0" },
  fields: [], actions: [{ id: "validate", label: "校验 / 编译", type: "submit", command: "evo-ledger-runtime-configurator.validate", requiresConfirmation: false }]
});

const burnForm = eidosForm({
  contractVersion: "0.1.1", kind: "form", id: "ledger-runtime-configurator.burn",
  title: "Burn 到 EVO Runtime", purpose: "execute-command",
  command: { code: "evo-ledger-runtime-configurator.burn", inputVersion: "0.1.0" },
  fields: [], actions: [{ id: "burn", label: "Burn 当前配置", type: "submit", command: "evo-ledger-runtime-configurator.burn", requiresConfirmation: true }]
});

const businessDataForm = eidosForm({
  contractVersion: "0.1.1",
  kind: "form",
  id: "ledger-runtime-configurator.business-data",
  title: "提交真实 BusinessData",
  purpose: "execute-command",
  command: { code: "evo-ledger-runtime-configurator.submit-business-data", inputVersion: "0.1.0" },
  fields: [
    { key: "applicationId", label: "应用", semanticType: "application-id", control: "select", required: true, options: [{ value: "__loading__", label: "加载中…" }] },
    { key: "businessObjectKey", label: "Business Object Key", semanticType: "business-object-key", control: "text", required: true },
    { key: "payload", label: "Payload JSON", semanticType: "json-object", control: "text", required: true }
  ],
  actions: [
    { id: "submit", label: "提交并执行 Posting", type: "submit", command: "evo-ledger-runtime-configurator.submit-business-data", requiresConfirmation: false }
  ]
});

const runtimeStatusForm = eidosForm({
  contractVersion: "0.1.1", kind: "form", id: "ledger-runtime-configurator.runtime-status",
  title: "读取 Runtime 状态", purpose: "execute-command",
  command: { code: "evo-ledger-runtime-configurator.runtime-status", inputVersion: "0.1.0" },
  fields: [], actions: [{ id: "status", label: "读取状态", type: "submit", command: "evo-ledger-runtime-configurator.runtime-status", requiresConfirmation: false }]
});

const sharedStyle = `
body{font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;margin:0;background:#f5f6f8;color:#15171a}
main{max-width:1180px;margin:0 auto;padding:28px}.hero{margin-bottom:20px}.hero h1{margin:0 0 8px}.sub,.muted{color:#60646c}
.badge{display:inline-block;border:1px solid #c9ccd2;border-radius:999px;padding:4px 9px;font-size:12px;margin:0 6px 8px 0;background:#fff}
.grid{display:grid;grid-template-columns:1fr 1fr;gap:16px}.card,form[data-eidos-id]{background:#fff;border:1px solid #d8dbe0;border-radius:12px;padding:16px;box-sizing:border-box}
form[data-eidos-id] h1{font-size:18px;margin:0 0 12px}form[data-eidos-id] label{display:block;font-size:13px;font-weight:600;margin:10px 0}
form[data-eidos-id] input,form[data-eidos-id] select{display:block;width:100%;box-sizing:border-box;padding:9px;margin-top:5px;border:1px solid #b9bec7;border-radius:8px;font:inherit}
button{font:inherit;padding:10px 14px;border:1px solid #aab0ba;border-radius:8px;background:#fff;cursor:pointer}button:disabled{opacity:.45;cursor:not-allowed}
pre{white-space:pre-wrap;word-break:break-word;background:#15171a;color:#f5f6f8;padding:12px;border-radius:8px;max-height:430px;overflow:auto}
a.primary{display:inline-block;padding:10px 14px;border-radius:8px;background:#15171a;color:white;text-decoration:none}
.step{margin-bottom:16px}.ok{color:#0a7137}.bad{color:#b42318}
@media(max-width:820px){.grid{grid-template-columns:1fr}}
`;

export const appManagerInstallerHtml = `<!doctype html>
<html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>EVO 插件安装验证</title><style>${sharedStyle}</style></head>
<body><main data-ui-runtime="eidos" data-eidos-contract="0.1.1">
<div class="hero"><h1>EVO 插件安装验证</h1>
<div class="sub">必须从未安装状态开始：Catalog → 安装计划 → 依赖解析 → Package 安装 → Feature 激活 → Eidos Experience 出现 → 进入业务验证。</div>
<span class="badge">Eidos UIDL 0.1.1</span><span class="badge">@eidos/reference</span><span class="badge">Installation-first validation</span></div>
<div class="grid"><section class="step">${installPlanForm}</section><section class="step">${installExecuteForm}</section></div>
<section class="card"><h2>生命周期证据</h2><div id="package"></div><pre id="result">加载 Catalog 与当前安装状态…</pre><div id="enter"></div></section>
</main><script>
const packageId='evo-ledger-runtime-configurator';
let planned=false;
const result=document.getElementById('result');
const enter=document.getElementById('enter');
const packageBox=document.getElementById('package');
function out(v,ok){result.textContent=typeof v==='string'?v:JSON.stringify(v,null,2);result.className=ok===false?'bad':'';}
async function j(url,opt){const r=await fetch(url,opt);const t=await r.text();let b;try{b=JSON.parse(t)}catch{b=t}if(!r.ok)throw new Error(typeof b==='string'?b:JSON.stringify(b,null,2));return b}
function form(id){return document.querySelector('form[data-eidos-id="'+id+'"]')}
function setInstallEnabled(v){const b=form('app-platform.install-execute').querySelector('button[type=submit]');b.disabled=!v}
async function refresh(){
 const catalog=await j('/v1/catalog');const snapshot=await j('/v1/platform/snapshot');
 const pkg=catalog.find(x=>x.packageId===packageId);const installed=snapshot.installedPackages.some(x=>x.packageId===packageId);
 packageBox.innerHTML='<p><strong>'+pkg.displayName+'</strong> · '+pkg.version+' · '+pkg.type+'</p><p class="'+(installed?'ok':'muted')+'">'+(installed?'已安装并可检查 Feature/Experience。':'当前未安装。请先生成安装计划。')+'</p>';
 if(installed){planned=true;setInstallEnabled(false);enter.innerHTML='<p class="ok">安装生命周期已完成。Eidos Experience 现在才允许进入。</p><a class="primary" href="/ledger-runtime-configurator">进入 Ledger Runtime Configurator</a>';}
 else {enter.innerHTML='';setInstallEnabled(planned);}
}
form('app-platform.install-plan').addEventListener('submit',async e=>{e.preventDefault();try{const plan=await j('/v1/install/plan',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({packageId})});planned=plan.blockers.length===0;setInstallEnabled(planned);out({stage:'INSTALL_PLAN',plan},plan.blockers.length===0)}catch(err){out(String(err),false)}});
form('app-platform.install-execute').addEventListener('submit',async e=>{e.preventDefault();if(!planned){out('必须先生成并检查安装计划。',false);return}try{const snapshot=await j('/v1/install',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({packageId})});const experiences=await j('/v1/experiences/effective');out({stage:'INSTALLED_AND_ACTIVATED',snapshot,effectiveExperiences:experiences},true);await refresh()}catch(err){out(String(err),false)}});
setInstallEnabled(false);refresh().catch(err=>out(String(err),false));
</script></body></html>`;

export const ledgerConfiguratorMvpHtml = `<!doctype html>
<html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>EVO Ledger Runtime Configurator</title><style>${sharedStyle}</style></head>
<body><main data-ui-runtime="eidos" data-eidos-contract="0.1.1">
<div class="hero"><h1>EVO Ledger Runtime Configurator</h1>
<div class="sub">已通过 App Platform 安装并激活。以下业务交互由 Eidos UIDL / public renderer 生成。</div>
<span class="badge">Eidos UIDL 0.1.1</span><span class="badge">912-rule corpus</span><a href="/">返回安装状态</a></div>
<div id="summary" class="card muted">加载 912 条规则配置…</div>
<div class="grid"><section>${ruleEditorForm}</section><section>${businessDataForm}</section></div>
<div class="grid"><section>${validateForm}</section><section>${burnForm}</section></div>
<section>${runtimeStatusForm}</section>
<section class="card"><h2>执行结果</h2><pre id="result">等待操作…</pre></section>
</main><script>
let config;
const result=document.getElementById('result');
const summary=document.getElementById('summary');
function out(v,ok){result.textContent=typeof v==='string'?v:JSON.stringify(v,null,2);result.className=ok===false?'bad':'';}
async function j(url,opt){const r=await fetch(url,opt);const t=await r.text();let b;try{b=JSON.parse(t)}catch{b=t}if(!r.ok)throw new Error(typeof b==='string'?b:JSON.stringify(b,null,2));return b}
function form(id){return document.querySelector('form[data-eidos-id="'+id+'"]')}
function field(formId,name){return form(formId).elements.namedItem(name)}
function option(value,label){const o=document.createElement('option');o.value=value;o.textContent=label;return o}
function setOptions(select,items){select.innerHTML='';items.forEach(x=>select.appendChild(option(x.value,x.label)))}
function rulesForApp(){return config.postingRules.filter(r=>r.applicationId===field('ledger-runtime-configurator.rule-editor','applicationId').value)}
function fillRule(){
 const r=rulesForApp().find(x=>String(x.sourceId)===field('ledger-runtime-configurator.rule-editor','ruleId').value);if(!r)return;
 field('ledger-runtime-configurator.rule-editor','direction').value=r.direction||'';
 field('ledger-runtime-configurator.rule-editor','condition').value=r.entryConditions||'';
 field('ledger-runtime-configurator.rule-editor','quantity').value=r.quantityFormula||'';
 field('ledger-runtime-configurator.rule-editor','amount').value=r.amountFormula||'';
}
function fillRules(){
 const rs=rulesForApp();setOptions(field('ledger-runtime-configurator.rule-editor','ruleId'),rs.map(r=>({value:String(r.sourceId),label:'#'+r.sourceId+' · '+(r.ledgerTitle||r.ledgerId)})));fillRule();
}
async function load(){
 const values=await Promise.all([j('/v1/ledger-runtime-configurator/summary'),j('/v1/ledger-runtime-configurator/configuration'),j('/v1/ledger-runtime-configurator/runtime-status').catch(()=>null)]);
 const s=values[0];config=values[1];const status=values[2];
 summary.textContent='科目 '+s.counts.accounts+' · 应用 '+s.counts.applications+' · 字典 '+s.counts.dictionaries+' · 规则 '+s.counts.postingRules+' · digest '+s.semanticDigest.slice(0,12)+'… · Runtime '+(status&&status.burned?'已 Burn':'未 Burn');
 const apps=config.applications.map(a=>({value:a.applicationId,label:a.title+' · '+a.applicationId}));
 const ruleApp=field('ledger-runtime-configurator.rule-editor','applicationId');setOptions(ruleApp,apps);
 const businessApp=field('ledger-runtime-configurator.business-data','applicationId');setOptions(businessApp,apps);
 const safeId='2185120d-ea18-42b9-bf55-6316af513a19';if(apps.some(a=>a.value===safeId)){ruleApp.value=safeId;businessApp.value=safeId}
 field('ledger-runtime-configurator.business-data','businessObjectKey').value='MANUAL-E2E-'+Date.now();
 field('ledger-runtime-configurator.business-data','payload').value='{"数量":12}';
 fillRules();
}
field('ledger-runtime-configurator.rule-editor','applicationId').addEventListener('change',fillRules);
field('ledger-runtime-configurator.rule-editor','ruleId').addEventListener('change',fillRule);
form('ledger-runtime-configurator.rule-editor').addEventListener('submit',async e=>{e.preventDefault();try{
 const r=config.postingRules.find(x=>String(x.sourceId)===field('ledger-runtime-configurator.rule-editor','ruleId').value);if(!r)return;
 r.direction=field('ledger-runtime-configurator.rule-editor','direction').value;
 r.entryConditions=field('ledger-runtime-configurator.rule-editor','condition').value||null;
 r.quantityFormula=field('ledger-runtime-configurator.rule-editor','quantity').value||null;
 r.amountFormula=field('ledger-runtime-configurator.rule-editor','amount').value||null;
 out(await j('/v1/ledger-runtime-configurator/import',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(config)}),true);await load();
}catch(err){out(String(err),false)}});
form('ledger-runtime-configurator.validate').addEventListener('submit',async e=>{e.preventDefault();try{out(await j('/v1/ledger-runtime-configurator/validate',{method:'POST',headers:{'content-type':'application/json'},body:'{}'}),true)}catch(err){out(String(err),false)}});
form('ledger-runtime-configurator.burn').addEventListener('submit',async e=>{e.preventDefault();try{out(await j('/v1/ledger-runtime-configurator/burn',{method:'POST'}),true);await load()}catch(err){out(String(err),false)}});
form('ledger-runtime-configurator.business-data').addEventListener('submit',async e=>{e.preventDefault();try{const body={applicationId:field('ledger-runtime-configurator.business-data','applicationId').value,businessObjectKey:field('ledger-runtime-configurator.business-data','businessObjectKey').value,payload:JSON.parse(field('ledger-runtime-configurator.business-data','payload').value)};out(await j('/v1/ledger-runtime-configurator/test-business-data',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)}),true)}catch(err){out(String(err),false)}});
form('ledger-runtime-configurator.runtime-status').addEventListener('submit',async e=>{e.preventDefault();try{out(await j('/v1/ledger-runtime-configurator/runtime-status'),true)}catch(err){out(String(err),false)}});
load().catch(err=>out(String(err),false));
</script></body></html>`;
