import tls from 'node:tls';

/**
 * Read-only TLS peer-identity probe. PASS proves only this one handshake:
 * it does not prove ingress ACL, mTLS, OIDC, deployed workload or KMS.
 * No Bearer token, database credential or finance intent is transmitted.
 */
export async function probePrivateFinanceOwnerTls({host,port,serverName,
  caCertificate,timeoutMs=1500}={}){
  if(typeof host!=='string'||!/^[a-z0-9.:-]+$/iu.test(host)||
    typeof serverName!=='string'||
    !/^[a-z0-9-]+(?:\.[a-z0-9-]+)+$/iu.test(serverName)||
    !Number.isInteger(port)||port<1||port>65535||
    (!Buffer.isBuffer(caCertificate)&&typeof caCertificate!=='string')||
    !(timeoutMs>0&&timeoutMs<=10000))return{
      status:'DENIED',reason:'INVALID_TLS_PROBE_INPUT',
      productionCertification:'NOT_CERTIFIED',executionAllowed:false};
  try{
    await new Promise((resolve,reject)=>{
      const socket=tls.connect({host,port,servername:serverName,ca:caCertificate,
        rejectUnauthorized:true,checkServerIdentity:tls.checkServerIdentity},()=>{
        if(socket.authorized)resolve();else reject(Error('UNAUTHORIZED_PEER'));
        socket.end();
      });
      socket.setTimeout(timeoutMs,()=>socket.destroy(Error('TLS_TIMEOUT')));
      socket.once('error',reject);
    });
    return {status:'LOCAL_TLS_IDENTITY_PASS',certificateChainVerified:true,
      hostnameVerified:true,productionCertification:'NOT_CERTIFIED',executionAllowed:false};
  }catch{return {status:'DENIED',reason:'TLS_HANDSHAKE_OR_IDENTITY_FAILED',
    productionCertification:'NOT_CERTIFIED',executionAllowed:false};}
}
