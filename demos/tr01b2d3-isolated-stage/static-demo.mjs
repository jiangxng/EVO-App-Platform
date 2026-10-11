/**
 * TR01B2D3 BROWSER-ONLY stage simulator.
 * Public static demo: WebCrypto Ed25519 real signature verification, local one-use jti.
 * NOT a server Owner / real DB / production auth / production security attestation.
 */
const encoder=new TextEncoder();
const pairPromise=()=>crypto.subtle.generateKey('Ed25519',true,['sign','verify']);
let pair;
const seen=new Set();
const expected=Object.freeze({
  hostEnterpriseId:'stage-enterprise-A',evoEnterpriseId:'stage-evo-A',
  contextId:'stage-context-A',installationId:'stage-install-01',
  issuer:'stage-demo-host',audience:'evo:trading-finance-owner:read-only:v0.1.0'
});
const fact=Object.freeze({
  classification:'SYNTHETIC_FIXTURE',salesOrder:'DEMO-SO-1001',
  shipment:'DEMO-SHIP-1001',receivable:'DEMO-AR-1001',
  receipt:'DEMO-REC-1001',amount:'188.00',currency:'USD',
  valuationPolicy:{id:'demo-fifo',version:1},
  allocationPolicy:{id:'demo-full-settlement',version:1},
  postingBoundary:'DEMO_ONLY'
});
const validNames=new Set(['verified','replay','revoked','cross_tenant','tampered','db_down']);
const result=(status,code,detail,extra={})=>({
  status,code,detail,verified:status==='VERIFIED_READONLY',executionAllowed:false,
  financeWrites:0,productionCertification:'NOT_CERTIFIED',
  demoOnly:true,executionEnvironment:'BROWSER_ONLY_NOT_PRODUCTION',
  ...extra
});
async function verifyLocally({payload,signature,claims},opts={}){
  if(!await crypto.subtle.verify('Ed25519',pair.publicKey,signature,payload))
    return result('DENIED','INVALID_SIGNATURE','Ed25519 签名验证失败');
  const now=Math.floor(Date.now()/1000);
  if(claims.exp<=now||claims.nbf>now||claims.exp-claims.iat>45)
    return result('DENIED','ASSERTION_EXPIRED','签名授权已过期');
  if(opts.revoked)return result('DENIED','SIGNING_KEY_REVOKED','撤销密钥后，即使签名有效也拒绝');
  if(claims.issuer!==expected.issuer||claims.audience!==expected.audience||
     claims.hostEnterpriseId!==expected.hostEnterpriseId||
     claims.evoEnterpriseId!==expected.evoEnterpriseId||
     claims.contextId!==expected.contextId||
     claims.installationId!==expected.installationId||
     claims.purpose!=='TR01B2D3_FINANCE_READONLY')
    return result('DENIED','ENTERPRISE_SCOPE_MISMATCH','不同企业和上下文不能混用委托');
  if(opts.dbAvailable===false)
    return result('DENIED','NONCE_AUTHORITY_UNAVAILABLE','模拟数据库不可用，拒绝放行');
  if(seen.has(claims.jti))
    return result('DENIED','NONCE_REPLAY','同一次委托被重复使用，予以拒绝');
  if(claims.intent.orderNo!==fact.salesOrder||
     claims.intent.valuationPolicy.version!==fact.valuationPolicy.version)
    return result('DENIED','PIN_MISMATCH','业务事实或规则版本不匹配');
  if(seen.size>5000)seen.clear(); // browser-only demo not DB-backed replay protection
  seen.add(claims.jti);
  return result('VERIFIED_READONLY','OWNER_FACTS_VERIFIED_NO_EXECUTION',
    '本地模拟只读核验通过，绝不生成财务写入',{assertionVerified:true,
      nonceConsumed:true,readOnlyFacts:fact});
}
export async function runSimulatedScenario(scenario){
  if(!validNames.has(scenario))throw Error('UNKNOWN_SCENARIO');
  pair??=await pairPromise();
  const now=Math.floor(Date.now()/1000);
  const claims={
    issuer:expected.issuer,audience:expected.audience,
    hostEnterpriseId:expected.hostEnterpriseId,evoEnterpriseId:expected.evoEnterpriseId,
    contextId:expected.contextId,installationId:expected.installationId,
    purpose:'TR01B2D3_FINANCE_READONLY',actor:'stage-demo-human',
    jti:crypto.randomUUID(),iat:now,nbf:now,exp:now+45,
    intent:{kind:'COST_VALUATION',orderNo:fact.salesOrder,valuationPolicy:fact.valuationPolicy}
  };
  if(scenario==='cross_tenant')claims.evoEnterpriseId='stage-evo-B';
  const original=encoder.encode(JSON.stringify(claims));
  const signature=await crypto.subtle.sign('Ed25519',pair.privateKey,original);
  const altered=scenario==='tampered'?
    encoder.encode(JSON.stringify({...claims,actor:'tampered'})):original;
  const assertion={payload:altered,signature,claims};
  if(scenario==='replay'){
    const first=await verifyLocally(assertion);
    const final=await verifyLocally(assertion);
    return {scenario,first,final,testOutcome:first.verified&&final.code==='NONCE_REPLAY'?
      'BROWSER_NEGATIVE_CONTROL_PASS':'TEST_FAILED'};
  }
  const final=await verifyLocally(assertion,{
    revoked:scenario==='revoked',dbAvailable:scenario!=='db_down'
  });
  return {scenario,final,testOutcome:
    final.status===(scenario==='verified'?'VERIFIED_READONLY':'DENIED')?
      'BROWSER_NEGATIVE_CONTROL_PASS':'TEST_FAILED'};
}
if(typeof document!=='undefined'){
  const buttons=[...document.querySelectorAll('.choice')];
  let current='verified';
  for(const b of buttons)b.addEventListener('click',()=>{
    current=b.dataset.kind;
    for(const c of buttons)c.classList.toggle('active',c===b);
  });
  const btn=document.getElementById('run');
  btn.addEventListener('click',async()=>{
    btn.disabled=true;btn.textContent='浏览器本地签名与验证中…';
    try{
      const data=await runSimulatedScenario(current);
      const v=data.final;
      const el=document.getElementById('result');el.classList.add('visible');
      const state=document.getElementById('state');
      state.textContent=v.verified?'本地只读核验通过':'模拟安全策略拒绝';
      state.className='state'+(v.verified?'':' denied');
      document.getElementById('headline').textContent=v.verified?'签名验证通过 · 无财务写入':'模拟安全负控生效';
      document.getElementById('result-code').textContent=v.code+' · '+data.testOutcome;
      document.getElementById('detail').textContent=v.detail+
        (data.first?'；相同 jti 的第二次核验被拒绝':'');
      document.getElementById('raw').textContent=JSON.stringify({
        scenario:data.scenario,
        first:data.first?{status:data.first.status,code:data.first.code}:undefined,
        final:{status:v.status,code:v.code,verified:v.verified,
          assertionVerified:v.assertionVerified===true,
          nonceConsumed:v.nonceConsumed===true,
          financeWrites:0,executionAllowed:false,
          productionCertification:v.productionCertification,
          executionEnvironment:'BROWSER_ONLY_NOT_PRODUCTION'},
        testOutcome:data.testOutcome,syntheticFacts:v.readOnlyFacts
      },null,2);
      el.scrollIntoView({behavior:'smooth',block:'nearest'});
    }catch(e){window.alert('浏览器暂不支持此演示功能：'+e.message)}
    finally{btn.disabled=false;btn.textContent='再次运行本地演示 →'}
  });
}
