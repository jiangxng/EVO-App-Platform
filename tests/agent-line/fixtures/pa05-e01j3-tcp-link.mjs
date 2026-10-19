import {createServer,connect} from "node:net";

/**
 * Disposable network fault harness: two real TCP sockets are forwarded
 * byte-for-byte to the actual central PostgreSQL18 listener.
 * Cut kills the transport while leaving the database service and separate
 * Host B / DBA connections alive. It is NOT an OS-level silent blackhole.
 */
export async function createPa05TcpCutLinkV010(authorityUrl) {
  const target=new URL(authorityUrl);
  if (!["127.0.0.1","localhost"].includes(target.hostname))
    throw Error("PA05_E01J3_TEST_NETWORK_TARGET_NOT_LOCAL");
  const connections=new Set();
  let available=true;
  let accepted=0;
  const server=createServer(client=>{
    if(!available){client.destroy();return;}
    accepted++;
    const upstream=connect({
      host:target.hostname,
      port:Number(target.port||5432)
    });
    const pair={client,upstream};
    connections.add(pair);
    const cleanup=()=>{
      connections.delete(pair);
      client.destroy();
      upstream.destroy();
    };
    client.on("error",cleanup);
    upstream.on("error",cleanup);
    client.on("close",cleanup);
    upstream.on("close",cleanup);
    client.pipe(upstream);
    upstream.pipe(client);
  });
  await new Promise((resolve,reject)=>{
    server.once("error",reject);
    server.listen(0,"127.0.0.1",resolve);
  });
  return {
    port:server.address().port,
    get accepted(){return accepted;},
    get active(){return connections.size;},
    cut(){
      available=false;
      const cutCount=connections.size;
      for(const {client,upstream} of [...connections]){
        client.destroy();
        upstream.destroy();
      }
      return cutCount;
    },
    restore(){available=true;},
    async close(){
      available=false;
      for(const {client,upstream} of [...connections]){
        client.destroy();
        upstream.destroy();
      }
      await new Promise(resolve=>server.close(resolve));
    }
  };
}
