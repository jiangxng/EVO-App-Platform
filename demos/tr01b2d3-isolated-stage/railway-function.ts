/**
 * TR01B2D3 ONLINE STAGE SHOWCASE — DEMONSTRATION ONLY.
 * Standalone Railway Function, toy fixture, ephemeral Ed25519 keys and process-local nonces.
 * NO EVO/production/Postgres/Host/Operator credentials, NO ledger or finance writes.
 * Never a production Owner and never a security attestation.
 */
import { generateKeyPairSync, randomUUID, sign, verify } from 'node:crypto';

const { privateKey, publicKey } = generateKeyPairSync('ed25519');
const nonces = new Set();
const trust = Object.freeze({
  issuer: 'evo-stage-demo-host', installationId: 'stage-install-01',
  hostEnterpriseId: 'stage-enterprise-A', evoEnterpriseId: 'stage-evo-A',
  contextId: 'stage-context-A', keyId: 'stage-ephemeral-key'
});
const facts = Object.freeze({
  dataClass:'SYNTHETIC_NOT_ACTUAL_LEDGER',salesOrder:'DEMO-SO-1001',
  shipment:'DEMO-SHIP-1001',receivable:'DEMO-AR-1001',
  receipt:'DEMO-REC-1001',currency:'USD',salesAmount:'188.00',
  cashReceived:'188.00',costMethod:'FIFO',
  valuationPolicy:{id:'demo-fifo-policy',version:1},
  allocationPolicy:{id:'demo-full-settlement',version:1},
  postingBoundary:'demo-readonly-boundary'
});
const scenarios = new Set(['verified','replay','revoked','cross_tenant','tampered','db_down']);
const enc=x=>Buffer.from(JSON.stringify(x)).toString('base64url');
const dec=x=>JSON.parse(Buffer.from(x,'base64url').toString('utf8'));
function assertion(claims){
  const prefix=enc({alg:'Ed25519',typ:'evo-finance-delegation+jwt',kid:trust.keyId})+'.'+enc(claims);
  return prefix+'.'+sign(null,Buffer.from(prefix),privateKey).toString('base64url');
}
function claims(){
  const now=Math.floor(Date.now()/1000);
  return {iss:trust.issuer,aud:'evo:trading-finance-owner:read-only:v0.1.0',
    installationId:trust.installationId,hostEnterpriseId:trust.hostEnterpriseId,
    evoEnterpriseId:trust.evoEnterpriseId,contextId:trust.contextId,
    actorSubjectId:'stage-demo-user',actorType:'HUMAN',
    purpose:'TR01B2D3_FINANCE_READONLY',iat:now,nbf:now,exp:now+45,
    correlationId:randomUUID(),jti:randomUUID(),
    intent:{kind:'COST_VALUATION',orderNo:facts.salesOrder,
      valuationPolicy:facts.valuationPolicy,allocationPolicy:facts.allocationPolicy}};
}
const verdict=(status,code,detail,extra={})=>({
  contractVersion:'0.1.0',status,code,detail,verified:status==='VERIFIED_READONLY',
  verificationKind:'OWNER_DATABASE_READ_ONLY_SIMULATED',
  financeWrites:0,executionAllowed:false,productionCertification:'NOT_CERTIFIED',
  demoOnly:true,...extra
});
function check(asserted,{revoked=false,dbAvailable=true}={}){
  try{
    const p=asserted.split('.');
    if(p.length!==3) return verdict('DENIED','INVALID_ASSERTION','JWT 结构不正确');
    const header=dec(p[0]);const c=dec(p[1]);
    if(header.alg!=='Ed25519'||header.typ!=='evo-finance-delegation+jwt'||
       header.kid!==trust.keyId||
       !verify(null,Buffer.from(p[0]+'.'+p[1]),publicKey,Buffer.from(p[2],'base64url')))
      return verdict('DENIED','INVALID_SIGNATURE','签名无效，Owner 不接受');
    if(revoked) return verdict('DENIED','SIGNING_KEY_REVOKED','已撤销的签名密钥被拒绝');
    const now=Math.floor(Date.now()/1000);
    if(!Number.isInteger(c.exp)||now>=c.exp||c.nbf>now||
       c.exp-c.iat>45)return verdict('DENIED','ASSERTION_EXPIRED','时间窗口失效');
    if(c.iss!==trust.issuer||c.installationId!==trust.installationId||
       c.hostEnterpriseId!==trust.hostEnterpriseId||c.evoEnterpriseId!==trust.evoEnterpriseId||
       c.contextId!==trust.contextId||c.purpose!=='TR01B2D3_FINANCE_READONLY'||
       c.aud!=='evo:trading-finance-owner:read-only:v0.1.0')
      return verdict('DENIED','ENTERPRISE_SCOPE_MISMATCH','企业、上下文或委托范围不匹配');
    if(!dbAvailable)return verdict('DENIED','NONCE_AUTHORITY_UNAVAILABLE','Nonce 权威数据库不可用时拒绝新请求（模拟）');
    if(typeof c.jti!=='string'||nonces.has(c.jti))
      return verdict('DENIED','NONCE_REPLAY','同一 jti 不可重复使用');
    if(c.intent?.orderNo!==facts.salesOrder||
       c.intent?.valuationPolicy?.version!==facts.valuationPolicy.version)
      return verdict('DENIED','PIN_MISMATCH','经济事实与政策版本不匹配');
    if(nonces.size>=5000)nonces.clear(); // ephemeral DEMO only; never production proof
    nonces.add(c.jti);
    return verdict('VERIFIED_READONLY','OWNER_FACTS_VERIFIED_NO_EXECUTION',
      '模拟财务事实与版本固定点已验证；不允许记账、成本计算或资金分配',
      {readOnlyFacts:facts,nonceConsumed:true,assertionVerified:true});
  }catch{return verdict('DENIED','MALFORMED_ASSERTION','请求格式被拒绝')}
}
function evaluate(scenario){
  const c=claims();
  if(scenario==='cross_tenant')c.evoEnterpriseId='stage-evo-other';
  let token=assertion(c);
  if(scenario==='tampered'){const p=token.split('.');p[1]=enc({...c,actorSubjectId:'tampered'});token=p.join('.')}
  if(scenario==='replay'){
    const first=check(token);const second=check(token);
    return {scenario,first,final:second,testOutcome:
      first.verified&&second.code==='NONCE_REPLAY'?'NEGATIVE_CONTROL_PASS':'TEST_FAILED'};
  }
  const final=check(token,{
    revoked:scenario==='revoked',dbAvailable:scenario!=='db_down'});
  const expected=scenario==='verified'?'VERIFIED_READONLY':'DENIED';
  return {scenario,final,testOutcome:
    final.status===expected?'NEGATIVE_CONTROL_PASS':'TEST_FAILED'};
}
const html=String.raw`<!doctype html>
<html lang="zh-CN"><head><meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>EVO · 可信财务委托阶段演示</title>
<style>
:root{color-scheme:light;--ink:#15263e;--sub:#627087;--navy:#10305a;--accent:#285fc1;--line:#dbe4ee;--white:#fff;--bg:#f3f6fa;--green:#16744c;--red:#b43f3b}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font-family:ui-sans-serif,-apple-system,BlinkMacSystemFont,"Segoe UI","Microsoft YaHei",sans-serif;line-height:1.5}
header{background:#0f2747;color:white;border-bottom:1px solid #28466f;padding:18px max(22px,calc((100vw - 1120px)/2));display:flex;align-items:center;gap:14px;justify-content:space-between}
.logo{font-size:24px;letter-spacing:.045em;font-weight:800}.header-right{font-size:12px;color:#c9d7ec;letter-spacing:.08em}
main{max-width:1120px;padding:40px 22px 85px;margin:auto}.eyebrow{font-size:12px;color:#486b9e;font-weight:800;letter-spacing:.12em;text-transform:uppercase}
h1{font-size:clamp(27px,4vw,42px);margin:10px 0 10px;letter-spacing:-.03em;line-height:1.2}p{color:var(--sub);max-width:750px}
.warning{display:flex;align-items:flex-start;gap:10px;border:1px solid #e9cf9f;background:#fff7e7;padding:13px 17px;border-radius:12px;font-size:13px;color:#805921;margin:23px 0 30px}
.grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin:22px 0 32px}
.stage{background:white;border:1px solid var(--line);border-radius:14px;padding:18px;min-height:125px;position:relative}
.stage:after{content:"→";position:absolute;right:-14px;top:44px;z-index:2;font-size:20px;color:#8ea1ba}.stage:last-child:after{display:none}
.stage .num{color:#2f6ece;font-size:12px;font-weight:800;margin-bottom:12px}.stage strong{display:block;font-size:17px}.stage small{color:var(--sub);font-size:12px}
.panel{background:white;border:1px solid var(--line);border-radius:17px;padding:27px;margin-top:18px;box-shadow:0 8px 34px rgba(29,64,110,.04)}
.panel h2{font-size:20px;margin:0 0 5px}.panel .note{color:var(--sub);font-size:13px;margin-bottom:20px}
.options{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}.choice{cursor:pointer;border:1px solid #d8e2ed;background:#fbfcfe;color:var(--ink);padding:13px;text-align:left;border-radius:10px;font-size:13px;font-weight:650;transition:.2s}
.choice:hover{border-color:#83a5d8}.choice.active{border-color:#3069c8;background:#eef5ff;box-shadow:0 0 0 1px #3069c8 inset}.choice small{font-weight:400;display:block;color:var(--sub);margin-top:4px;font-size:11px}
.actions{display:flex;align-items:center;gap:18px;flex-wrap:wrap;margin-top:22px}.run{border:0;border-radius:10px;background:var(--accent);color:white;font-weight:800;font-size:14px;padding:13px 22px;cursor:pointer}.run:disabled{opacity:.5}
.micro{color:var(--sub);font-size:12px}.result{display:none;margin-top:24px;border:1px solid var(--line);background:#f7f9fc;border-radius:12px;padding:22px}
.result.visible{display:block}.result-top{display:flex;justify-content:space-between;flex-wrap:wrap;gap:12px;align-items:center}
.state{border:1px solid #cce5d7;background:#eaf7ee;border-radius:40px;color:var(--green);padding:5px 10px;font-weight:800;font-size:12px}
.state.denied{border-color:#f1d1cb;color:var(--red);background:#fff1ee}
.code{font-family:ui-monospace,SFMono-Regular,Consolas,monospace;font-size:12px;color:#456488;word-break:break-all}
pre{white-space:pre-wrap;word-break:break-word;font-size:12px;line-height:1.7;background:#10223c;color:#e1ecff;padding:16px;border-radius:10px;max-height:330px;overflow:auto}
.statline{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:13px;margin-top:24px}.stat{background:#f8fafc;border:1px solid var(--line);padding:15px;border-radius:12px}.stat b{display:block;font-size:19px}.stat span{display:block;font-size:11px;color:var(--sub)}
footer{color:var(--sub);font-size:12px;border-top:1px solid var(--line);padding:22px 0;margin-top:40px}
a{color:#2865be;text-decoration:none}a:hover{text-decoration:underline}
@media(max-width:780px){.grid{grid-template-columns:repeat(2,1fr)}.stage:nth-child(2):after{display:none}.options{grid-template-columns:repeat(2,1fr)}}
@media(max-width:520px){.grid,.options,.statline{grid-template-columns:1fr}.stage:after{display:none}.panel{padding:17px}main{padding:24px 16px 50px}}
</style></head><body>
<header><div class="logo">EVO <span style="font-weight:400;opacity:.7">/ Finance</span></div><div class="header-right">TR-01B2D3 · ISOLATED PREVIEW</div></header>
<main>
<div class="eyebrow">阶段验证 · 在线交互展示 · v0.1</div>
<h1>可信财务委托 / 只读验证</h1>
<p>演示一条从销售到收款的业务链路如何进行签名委托、事实固定点核验和安全拒绝。你可以切换不同的安全场景，看到服务端的实际判定结果。</p>
<div class="warning"><strong>演示边界</strong><span>本页面使用合成业务数据、临时签名密钥与单进程内存 Nonce。不是 EVO 生产数据库、正式 Finance Owner 或真实财务执行。生产认证 NOT_CERTIFIED，所有结果 executionAllowed=false。</span></div>
<div class="eyebrow">01 / Business facts · SYNTHETIC DATA</div>
<section class="grid">
<div class="stage"><div class="num">01 / SALES</div><strong>销售订单</strong><small>DEMO-SO-1001 · USD 188.00</small></div>
<div class="stage"><div class="num">02 / SHIPMENT</div><strong>出库发货</strong><small>DEMO-SHIP-1001 · 已履约</small></div>
<div class="stage"><div class="num">03 / RECEIVABLE</div><strong>应收确认</strong><small>DEMO-AR-1001 · 固定业务事实</small></div>
<div class="stage"><div class="num">04 / CASH</div><strong>收到款项</strong><small>DEMO-REC-1001 · USD 188.00</small></div>
</section>
<section class="panel">
<h2>02 / 可信委托安全场景</h2>
<div class="note">操作触发的是隔离演示服务器上的签名与核验代码，而非前端模拟一张结果图。每种场景均禁用财务写入。</div>
<div class="options" id="opts">
<button class="choice active" data-kind="verified">✓ 正常只读核验<small>Ed25519 签名、scope 与版本一致</small></button>
<button class="choice" data-kind="replay">↺ 重放攻击<small>同一签名委托使用两次</small></button>
<button class="choice" data-kind="revoked">⊘ 密钥已撤销<small>有效签名也必须拒绝</small></button>
<button class="choice" data-kind="cross_tenant">⇄ 跨企业越权<small>试图混用另一企业的事实</small></button>
<button class="choice" data-kind="tampered">✕ 签名被篡改<small>修改已签委托的 actor</small></button>
<button class="choice" data-kind="db_down">! Nonce 权威不可用<small>故障时默认拒绝，不降级</small></button>
</div>
<div class="actions"><button class="run" id="run">执行在线只读核验 →</button><span class="micro">仅演示数据 · 不连接生产 · 不产生财务记录</span></div>
<div class="result" id="result" aria-live="polite">
<div class="result-top"><div><b id="headline">结果</b><div class="code" id="result-code"></div></div><span class="state" id="state"></span></div>
<p id="detail" style="font-size:13px"></p>
<pre id="raw"></pre>
</div>
</section>
<div class="statline">
<div class="stat"><b>Ed25519</b><span>服务端临时密钥真实签名与验证</span></div>
<div class="stat"><b>0</b><span>财务写入次数 · 永久禁止</span></div>
<div class="stat"><b>OPEN</b><span>TR-01B2D3 未完成生产验收</span></div>
</div>
<footer>独立 Railway Preview 项目 · 不使用真实客户数据/密钥/账本。阶段源码与 GitHub CI 证据仅说明演示能力。正式阶段目标还包括 TLS、真实受限 PostgreSQL、OIDC、外部 KMS 和部署审计。<div style="margin-top:8px"><a href="https://github.com/jiangxng/EVO-App-Platform/pull/594" target="_blank" rel="noopener noreferrer">B2D3 工程主线 Draft PR ↗</a></div></footer>
</main>
<script>
(function(){
var current='verified';var buttons=Array.from(document.querySelectorAll('.choice'));
buttons.forEach(function(b){b.addEventListener('click',function(){current=b.dataset.kind;buttons.forEach(function(c){c.classList.toggle('active',c===b)})})});
var btn=document.getElementById('run');
btn.addEventListener('click',async function(){
 btn.disabled=true;btn.textContent='服务端核验中…';
 try{
  var response=await fetch('/api/demo/run',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({scenario:current}),cache:'no-store'});
  if(!response.ok)throw Error('HTTP '+response.status);
  var data=await response.json();var outcome=data.final;
  var el=document.getElementById('result');el.classList.add('visible');
  var state=document.getElementById('state');state.textContent=outcome.verified?'已完成只读核验':'按安全策略拒绝';
  state.className='state'+(outcome.verified?'':' denied');
  document.getElementById('headline').textContent=outcome.verified?'核验通过 · 不执行财务写入':'安全负控生效 · 请求拒绝';
  document.getElementById('result-code').textContent=outcome.code+' · '+data.testOutcome;
  document.getElementById('detail').textContent=outcome.detail+(data.first?'；第一次有效，第二次重放被拒绝':'');
  document.getElementById('raw').textContent=JSON.stringify({scenario:data.scenario,first:data.first?{status:data.first.status,code:data.first.code}:undefined,
    final:{status:outcome.status,code:outcome.code,verified:outcome.verified,
      signatureValidated:outcome.assertionVerified===true,nonceConsumed:outcome.nonceConsumed===true,
      executionAllowed:false,financeWrites:0,productionCertification:outcome.productionCertification},
    testOutcome:data.testOutcome,syntheticFacts:outcome.readOnlyFacts},null,2);
  el.scrollIntoView({behavior:'smooth',block:'nearest'});
 }catch(e){alert('预览环境暂不可用：'+e.message)}
 finally{btn.disabled=false;btn.textContent='再次执行在线只读核验 →'}
});
})();
</script></body></html>`;
const headers={'cache-control':'no-store','x-content-type-options':'nosniff',
  'referrer-policy':'no-referrer','x-robots-tag':'noindex, nofollow'};
const response=(data,status=200)=>new Response(JSON.stringify(data),
  {status,headers:{...headers,'content-type':'application/json; charset=utf-8'}});
Bun.serve({hostname:'0.0.0.0',port:Number(Bun.env.PORT||3000),
  async fetch(request){
    const u=new URL(request.url);
    if(request.method==='GET'&&u.pathname==='/')
      return new Response(html,{headers:{...headers,'content-type':'text/html; charset=utf-8'}});
    if(request.method==='GET'&&u.pathname==='/health')
      return response({status:'UP',stage:'ISOLATED_SYNTHETIC_PREVIEW',
        ownerProductionCertified:false,executionAllowed:false});
    if(request.method==='POST'&&u.pathname==='/api/demo/run'){
      const origin=request.headers.get('origin');
      if(origin&&origin!==u.origin)return response({error:'FOREIGN_ORIGIN_DENIED'},403);
      if(!request.headers.get('content-type')?.startsWith('application/json'))
        return response({error:'JSON_REQUIRED'},415);
      try{
        const body=await request.text();
        if(body.length>1024)return response({error:'PAYLOAD_TOO_LARGE'},413);
        const value=JSON.parse(body);
        if(!value||!scenarios.has(value.scenario))
          return response({error:'UNKNOWN_SCENARIO'},400);
        return response(evaluate(value.scenario));
      }catch{return response({error:'INVALID_REQUEST'},400)}
    }
    return response({error:'NOT_FOUND',executionAllowed:false},404);
  }
});