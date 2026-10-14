import {importFileObjectExtensionsToPostgresV010} from
  "../../../dist/apps/object-extension/agent-owner-migration.js";
const request=JSON.parse(Buffer.from(process.argv[2],"base64").toString("utf8"));
try{
  const result=await importFileObjectExtensionsToPostgresV010({
    ...request,connectionString:process.env.PA02A_PROOF_DATABASE_URL,
    schema:process.env.PA02_OBJECT_PG_SCHEMA,offlineSourceFrozen:true
  });
  process.send?.({result});
}catch(e){
  process.send?.({error:String(e?.message??e)});
  process.exitCode=1;
}
