export const ledgerConfiguratorMvpHtml = `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>EVO Ledger Runtime Configurator MVP</title>
<style>
body{font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;margin:0;background:#f6f7f9;color:#111}
main{max-width:1180px;margin:0 auto;padding:28px}
h1{margin:0 0 8px}.sub{color:#555;margin-bottom:22px}
.grid{display:grid;grid-template-columns:1fr 1fr;gap:16px}.card{background:white;border:1px solid #ddd;border-radius:12px;padding:16px}
label{display:block;font-size:13px;font-weight:600;margin:10px 0 5px}
select,input,textarea,button{font:inherit}select,input,textarea{width:100%;box-sizing:border-box;padding:9px;border:1px solid #bbb;border-radius:8px}
textarea{min-height:105px;font-family:ui-monospace,SFMono-Regular,Consolas,monospace}
button{padding:10px 14px;border:1px solid #aaa;border-radius:8px;background:#fff;cursor:pointer;margin:6px 6px 0 0}button.primary{background:#111;color:#fff;border-color:#111}
pre{white-space:pre-wrap;word-break:break-word;background:#111;color:#eee;padding:12px;border-radius:8px;max-height:360px;overflow:auto}
.ok{color:#08752f}.bad{color:#b42318}.muted{color:#666;font-size:13px}
@media(max-width:800px){.grid{grid-template-columns:1fr}}
</style>
</head>
<body><main>
<h1>EVO Ledger Runtime Configurator MVP</h1>
<div class="sub">Bookkeeping legacy source → EVO Expression IR → Burn → real PostingService → LedgerEntry / Balance</div>
<div class="grid">
<section class="card">
<h2>1. 配置</h2>
<div id="summary" class="muted">加载中…</div>
<label>应用</label><select id="app"></select>
<label>规则</label><select id="rule"></select>
<label>方向</label><input id="direction">
<label>条件</label><textarea id="condition"></textarea>
<label>数量公式</label><input id="quantity">
<label>金额公式</label><input id="amount">
<button id="save">保存修改</button>
<button id="validate">校验 / 编译</button>
<button id="burn" class="primary">Burn 到 EVO</button>
</section>
<section class="card">
<h2>2. 提交 BusinessData</h2>
<div class="muted">建议先选择不依赖成本 Built-in 的规则做第一次验证。</div>
<label>Business Object Key</label><input id="objectKey" value="RAILWAY-MVP-001">
<label>Payload JSON</label>
<textarea id="payload">{
  "物料属性": "原料",
  "数量": 12,
  "金额": "1200",
  "含税金额": "1200",
  "不含税金额": "1061.95",
  "发票类型": "专用发票",
  "changeTag": "out"
}</textarea>
<button id="submit" class="primary">提交并执行 Posting</button>
<button id="status">读取 Runtime 状态</button>
<h3>结果</h3><pre id="result">等待操作…</pre>
</section>
</div>
</main>
<script>
let config;
const $=id=>document.getElementById(id);
const out=(x,ok=true)=>{ $("result").textContent=typeof x==="string"?x:JSON.stringify(x,null,2); $("result").className=ok?"":"bad"; };
async function j(url,opt){const r=await fetch(url,opt);const t=await r.text();let b;try{b=JSON.parse(t)}catch{b=t}if(!r.ok)throw new Error(typeof b==="string"?b:JSON.stringify(b,null,2));return b}
function rulesForApp(){return config.postingRules.filter(r=>r.applicationId===$("app").value)}
function fillRule(){
 const r=rulesForApp().find(x=>String(x.sourceId)===$("rule").value); if(!r)return;
 $("direction").value=r.direction??"";$("condition").value=r.entryConditions??"";$("quantity").value=r.quantityFormula??"";$("amount").value=r.amountFormula??"";
}
function fillRules(){
 const rs=rulesForApp();$("rule").innerHTML=rs.map(r=>`<option value="${r.sourceId}">#${r.sourceId} · ${r.ledgerTitle??r.ledgerId}</option>`).join("");fillRule();
}
async function load(){
 const [s,c]=await Promise.all([j("/v1/ledger-runtime-configurator/summary"),j("/v1/ledger-runtime-configurator/configuration")]);config=c;
 $("summary").textContent=`科目 ${s.counts.accounts} · 应用 ${s.counts.applications} · 字典 ${s.counts.dictionaries} · 规则 ${s.counts.postingRules} · digest ${s.semanticDigest.slice(0,12)}…`;
 $("app").innerHTML=config.applications.map(a=>`<option value="${a.applicationId}">${a.title} · ${a.applicationId}</option>`).join("");fillRules();
}
$("app").onchange=fillRules;$("rule").onchange=fillRule;
$("save").onclick=async()=>{
 const r=config.postingRules.find(x=>String(x.sourceId)===$("rule").value);if(!r)return;
 r.direction=$("direction").value;r.entryConditions=$("condition").value||null;r.quantityFormula=$("quantity").value||null;r.amountFormula=$("amount").value||null;
 const res=await j("/v1/ledger-runtime-configurator/import",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(config)});out(res,res.ok);await load();
};
$("validate").onclick=async()=>{try{out(await j("/v1/ledger-runtime-configurator/validate",{method:"POST",headers:{"content-type":"application/json"},body:"{}"}))}catch(e){out(String(e),false)}};
$("burn").onclick=async()=>{try{out(await j("/v1/ledger-runtime-configurator/burn",{method:"POST"}))}catch(e){out(String(e),false)}};
$("submit").onclick=async()=>{try{
 const body={applicationId:$("app").value,businessObjectKey:$("objectKey").value,payload:JSON.parse($("payload").value)};
 out(await j("/v1/ledger-runtime-configurator/test-business-data",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(body)}));
}catch(e){out(String(e),false)}};
$("status").onclick=async()=>{try{out(await j("/v1/ledger-runtime-configurator/runtime-status"))}catch(e){out(String(e),false)}};
load().catch(e=>out(String(e),false));
</script>
</body></html>`;
