import {createPostgresObjectExtensionAtomicOwnerV010} from
  "../../../dist/apps/object-extension/agent-owner-postgres.js";

const [mode,encoded]=process.argv.slice(2);
const request=JSON.parse(Buffer.from(encoded,"base64").toString("utf8"));
const instance=createPostgresObjectExtensionAtomicOwnerV010({
  connectionString:process.env.PA02A_PROOF_DATABASE_URL,
  schema:process.env.PA02_OBJECT_PG_SCHEMA,
  ...(mode==="crash-after-domain-insert"?{
    testOnlyAfterBusinessInsert:()=>new Promise(()=>{
      process.send?.({checkpoint:"BUSINESS_INSERTED_UNCOMMITTED"});
    })
  }:{})
});
try{
  if(mode==="verify") {
    const proof=await instance.verifier.verify(request);
    process.send?.({proof});
  }else{
    await instance.owner.invoke(request);
    if(mode==="drop-ack") {
      // The simulated HTTP/IPC caller receives no Owner success after COMMIT.
      process.exitCode=19;
    }else{
      process.send?.({completed:true});
    }
  }
}catch(error){
  process.send?.({error:String(error?.message??error)});
  process.exitCode=1;
}finally{
  if(mode!=="crash-after-domain-insert")await instance.close();
}
