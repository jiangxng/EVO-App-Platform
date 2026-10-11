import test from 'node:test';
import assert from 'node:assert/strict';
import tls from 'node:tls';
import {execFileSync} from 'node:child_process';
import {mkdtempSync,readFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {probePrivateFinanceOwnerTls} from '../../tools/tr01b2d3-private-tls-probe.mjs';

test('PRIVATE_TLS: real certificate chain, hostname mismatch, untrusted CA and closed port',async()=>{
  const dir=mkdtempSync(join(tmpdir(),'tr01b2d3-railway-tls-'));
  let server;
  try{
    const crt=join(dir,'server.crt'),key=join(dir,'server.key');
    execFileSync('openssl',['req','-x509','-newkey','rsa:2048','-nodes',
      '-keyout',key,'-out',crt,'-days','1',
      '-subj','/CN=finance-owner.railway.internal',
      '-addext','subjectAltName=DNS:finance-owner.railway.internal'],{stdio:'ignore'});
    server=tls.createServer({key:readFileSync(key),cert:readFileSync(crt)},sock=>sock.end());
    await new Promise((resolve,reject)=>
      server.listen(0,'127.0.0.1',resolve).once('error',reject));
    const positive={host:'127.0.0.1',port:server.address().port,
      serverName:'finance-owner.railway.internal',caCertificate:readFileSync(crt)};
    const good=await probePrivateFinanceOwnerTls(positive);
    assert.equal(good.status,'LOCAL_TLS_IDENTITY_PASS',JSON.stringify(good));
    assert.equal(good.productionCertification,'NOT_CERTIFIED');
    assert.equal(good.executionAllowed,false);
    const wrong=await probePrivateFinanceOwnerTls({
      ...positive,serverName:'imposter.railway.internal'});
    assert.equal(wrong.status,'DENIED');
    const unknownCA=await probePrivateFinanceOwnerTls({...positive,caCertificate:'UNTRUSTED'});
    assert.equal(unknownCA.status,'DENIED');
    const missingCA=await probePrivateFinanceOwnerTls({...positive,caCertificate:null});
    assert.equal(missingCA.status,'DENIED');
    const unavailable=await probePrivateFinanceOwnerTls({...positive,port:1,timeoutMs:500});
    assert.equal(unavailable.status,'DENIED');
  }finally{
    if(server)await new Promise(resolve=>server.close(resolve));
    rmSync(dir,{recursive:true,force:true});
  }
});
