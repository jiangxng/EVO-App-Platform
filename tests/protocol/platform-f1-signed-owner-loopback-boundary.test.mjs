/**
 * F1/F2 source-only recovery: real Host Ed25519 signing over loopback HTTP.
 * This server deliberately has NO EVO finance facts, DB, Owner plugin or writes.
 * It is a transport/deny regression, NOT a Finance Owner certification.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {generateKeyPairSync,verify as verifySignature} from 'node:crypto';
import {
  createTrustedRemoteFinanceOwnerPreflightV010,
  FINANCE_OWNER_PATH_V010,
  FINANCE_OWNER_AUDIENCE_V010,
  FINANCE_OWNER_TYP_V010
} from '../../dist/apps/trading-reference/finance-owner-remote.js';

const privateAndPublic=()=>generateKeyPairSync('ed25519',{
  privateKeyEncoding:{type:'pkcs8',format:'pem'},
  publicKeyEncoding:{type:'spki',format:'pem'}
});
const makeInput=()=>({
  hostEnterpriseId:'host-f1',contextId:'ctx-f1',evoEnterpriseId:'evo-f1',
  actorSubjectId:'human-f1',actorType:'HUMAN',correlationId:'trace-f1',
  intent:{contractVersion:'0.1.0',kind:'COST_VALUATION',orderNo:'SO-F1',
    customerCounterpartyId:'cp-f1',itemId:'item-f1',warehouseId:'wh-f1',
    idempotencyKey:'idem-f1',shipmentBusinessDataId:'sh-f1',
    costMethod:'FIFO',valuationPolicy:{id:'v',version:1},
    allocationPolicy:{id:'a',version:1},
    shipmentValuationRule:{id:'r',version:1},boundarySequence:'11'}
});
async function withIsolatedMockOwner(run) {
  // This local stub validates the cryptographic transport only, not business facts.
  const key=privateAndPublic();
  const assertions=[];
  let behavior='valid',requests=0;
  const server=createServer(async(req,res)=>{
    requests++;
    const chunks=[];
    for await(const chunk of req)chunks.push(chunk);
    let payload;
    try {payload=JSON.parse(Buffer.concat(chunks).toString('utf8'));}
    catch {res.writeHead(400).end();return;}
    const assertion=payload?.assertion;
    const parts=typeof assertion==='string'?assertion.split('.'):[];
    let header,claims,signatureValid=false;
    try {
      header=JSON.parse(Buffer.from(parts[0],'base64url').toString('utf8'));
      claims=JSON.parse(Buffer.from(parts[1],'base64url').toString('utf8'));
      signatureValid=parts.length===3&&verifySignature(null,
        Buffer.from(parts[0]+'.'+parts[1]),key.publicKey,
        Buffer.from(parts[2],'base64url'));
    }catch {}
    assertions.push({method:req.method,path:req.url,header,claims,signatureValid,
      rawBodyKeys:Object.keys(payload??{})});
    if(!signatureValid){res.writeHead(401).end();return;}
    if(behavior==='remote-denied'){res.writeHead(403).end();return;}
    const body={
      contractVersion:'0.1.0',verified:true,executionAllowed:false,
      verificationKind:'OWNER_DATABASE_READ_ONLY',evoEnterpriseId:claims.evoEnterpriseId,
      orderNo:claims.intent.orderNo,reasonCodes:[]
    };
    if(behavior==='write-enabled')body.executionAllowed=true;
    if(behavior==='foreign-tenant')body.evoEnterpriseId='evo-foreign';
    if(behavior==='foreign-order')body.orderNo='SO-FOREIGN';
    if(behavior==='forged-kind')body.verificationKind='MOCK_FINANCE_EXECUTION';
    if(behavior==='nonempty-reasons')body.reasonCodes=['UNTRUSTED'];
    if(behavior==='invalid-json'){res.writeHead(200,{'content-type':'application/json'}).end('not-json');return;}
    res.writeHead(200,{'content-type':'application/json'}).end(JSON.stringify(body));
  });
  await new Promise((resolve,reject)=>server.listen(0,'127.0.0.1',resolve).once('error',reject));
  const endpoint='http://127.0.0.1:'+server.address().port+FINANCE_OWNER_PATH_V010;
  const install={
    installationId:'install-f1',issuer:'host-f1-issuer',keyId:'signing-f1',
    endpoint,hostEnterpriseId:'host-f1',contextId:'ctx-f1',
    evoEnterpriseId:'evo-f1',active:true
  };
  const secretLookups=[];
  const createClient=(overrides={})=>createTrustedRemoteFinanceOwnerPreflightV010({
    resolveInstallation:()=>install,
    resolveSigningPrivateKey:(id,kid)=>{
      secretLookups.push([id,kid]);return key.privateKey;
    },
    allowLoopbackHttpInTest:true,now:()=>1780000000,...overrides
  });
  try {
    await run({key,install,createClient,assertions,secretLookups,
      getRequests:()=>requests,setBehavior:v=>behavior=v});
  }finally{
    await new Promise(resolve=>server.close(resolve));
  }
}

test('F1 signing client sends a real Ed25519 bound assertion to local socket, never finance execution',async()=>{
  const previous=process.env.NODE_ENV;
  process.env.NODE_ENV='test';
  try{
    await withIsolatedMockOwner(async({createClient,install,assertions,secretLookups,getRequests})=>{
      const client=createClient();
      const accepted=await client.verify(makeInput());
      assert.equal(accepted.verified,true);
      assert.equal(accepted.evoEnterpriseId,'evo-f1');
      assert.equal('executionAllowed' in accepted,false,
        'positive response is verification only, not an execution permit');
      await client.verify({...makeInput(),correlationId:'trace-next'});
      assert.equal(getRequests(),2);
      assert.deepEqual(secretLookups,[
        [install.installationId,install.keyId],
        [install.installationId,install.keyId]
      ]);
      assert.ok(assertions.every(x=>x.signatureValid),'real Ed25519 signed bytes');
      assert.ok(assertions.every(x=>x.method==='POST'&&x.path===FINANCE_OWNER_PATH_V010));
      assert.ok(assertions.every(x=>x.header.alg==='Ed25519'&&
        x.header.typ===FINANCE_OWNER_TYP_V010&&x.header.kid===install.keyId));
      assert.ok(assertions.every(x=>x.claims.iss===install.issuer &&
        x.claims.aud===FINANCE_OWNER_AUDIENCE_V010&&
        x.claims.purpose==='TR01B2D3_FINANCE_READONLY'&&
        x.claims.actorSubjectId==='human-f1'&&
        x.claims.actorType==='HUMAN'&&
        x.claims.hostEnterpriseId==='host-f1'&&x.claims.contextId==='ctx-f1'&&
        x.claims.evoEnterpriseId==='evo-f1'&&x.claims.intent.orderNo==='SO-F1'));
      assert.deepEqual(assertions[0].rawBodyKeys,['assertion'],
        'private key, principal, and tenant are never separately supplied in HTTP JSON');
      assert.notEqual(assertions[0].claims.jti,assertions[1].claims.jti);
      assert.equal(assertions[0].claims.exp-assertions[0].claims.iat,45);
      assert.equal(assertions[0].claims.nbf,assertions[0].claims.iat);
      assert.equal(assertions[1].claims.correlationId,'trace-next');
    });
  }finally{
    if(previous===undefined)delete process.env.NODE_ENV;
    else process.env.NODE_ENV=previous;
  }
});

test('F1 Host denies missing install, cross-enterprise, untrusted endpoint and invalid key before network',async()=>{
  const previous=process.env.NODE_ENV;
  process.env.NODE_ENV='test';
  try{
    await withIsolatedMockOwner(async({install,createClient,getRequests,secretLookups})=>{
      const samples=[
        [()=>createClient({resolveInstallation:()=>undefined}),makeInput(),'INSTALLATION_NOT_ACTIVE'],
        [()=>createClient(),{...makeInput(),hostEnterpriseId:'host-other'},'INSTALLATION_SCOPE_MISMATCH'],
        [()=>createClient({resolveInstallation:()=>({...install,endpoint:'http://public.example.org'+FINANCE_OWNER_PATH_V010})}),
          makeInput(),'ENDPOINT_NOT_TRUSTED'],
        [()=>createClient({resolveInstallation:()=>({...install,endpoint:install.endpoint+'?insecure=1'})}),
          makeInput(),'ENDPOINT_NOT_TRUSTED'],
        [()=>createClient({resolveInstallation:()=>({...install,endpoint:install.endpoint.replace('/api/v1/','/api/private/')})}),
          makeInput(),'ENDPOINT_NOT_TRUSTED'],
        [()=>createClient({allowLoopbackHttpInTest:false}),makeInput(),'ENDPOINT_NOT_TRUSTED'],
        [()=>createClient({resolveSigningPrivateKey:()=>generateKeyPairSync('rsa',{
          modulusLength:2048,privateKeyEncoding:{type:'pkcs8',format:'pem'},
          publicKeyEncoding:{type:'spki',format:'pem'}}).privateKey}),
          makeInput(),'SIGNING_KEY_INVALID'],
        [()=>createClient(),{...makeInput(),actorSubjectId:''},'HOST_IDENTITY_INVALID']
      ];
      for(const [factory,input,code] of samples)
        await assert.rejects(factory().verify(input),new RegExp('TR01B2D3_OWNER_'+code));
      assert.equal(getRequests(),0,'preflight denial must never send HTTP');
      assert.equal(secretLookups.length,1,'secret resolution only after all scope/endpoint checks');
    });
  }finally{
    if(previous===undefined)delete process.env.NODE_ENV;
    else process.env.NODE_ENV=previous;
  }
});

test('F1 Host rejects denial, foreign facts, attempts to enable writes and malformed replies',async()=>{
  const previous=process.env.NODE_ENV;
  process.env.NODE_ENV='test';
  try{
    await withIsolatedMockOwner(async({createClient,setBehavior,assertions})=>{
      const cases=[
        ['remote-denied','TR01B2D3_OWNER_REMOTE_DENIED_403'],
        ['write-enabled','TR01B2D3_OWNER_RESPONSE_INVALID'],
        ['foreign-tenant','TR01B2D3_OWNER_RESPONSE_INVALID'],
        ['foreign-order','TR01B2D3_OWNER_RESPONSE_INVALID'],
        ['forged-kind','TR01B2D3_OWNER_RESPONSE_INVALID'],
        ['nonempty-reasons','TR01B2D3_OWNER_RESPONSE_INVALID'],
        ['invalid-json','SyntaxError']
      ];
      for(const [mode,code] of cases){
        setBehavior(mode);
        await assert.rejects(createClient().verify(makeInput()),error=>
          code==='SyntaxError'?error instanceof SyntaxError:
          error?.message===code,mode);
      }
      assert.equal(assertions.length,cases.length);
      assert.ok(assertions.every(a=>a.signatureValid),
        'denials occur AFTER a correctly signed transport request');
    });
  }finally{
    if(previous===undefined)delete process.env.NODE_ENV;
    else process.env.NODE_ENV=previous;
  }
});
