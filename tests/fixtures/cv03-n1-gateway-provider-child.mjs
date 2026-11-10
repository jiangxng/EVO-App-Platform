/**
 * CI-ONLY N1-03 process fixture. Receives a synthetic signed envelope;
 * never gets the Host verifier key, administrative DSN, or production secrets.
 */
import {createPostgresConditionalResourceRepositoryV010}
  from "../../dist/providers/enterprise-context/resources-postgres.js";
const mode=process.argv[2];
const request=JSON.parse(Buffer.from(process.argv[3]??"","base64").toString("utf8"));
const url=process.env.CV03_N1_CHILD_RUNTIME_DATABASE_URL;
const schema=process.env.CV03_N1_CHILD_SCHEMA;
if(process.env.CV03_N1_ONLY_ISOLATED_GATEWAY_TEST!=="YES_CI_LOCAL" ||
   !url || !schema || !/^cv03_[a-z0-9_]{1,58}$/.test(schema)){
  process.send?.({type:"invalid-fixture"});process.exit(12);
}
const parsed=new URL(url);
if(!["localhost","127.0.0.1"].includes(parsed.hostname) ||
   parsed.pathname!=="/cv03proof"){
  process.send?.({type:"not-isolated"});process.exit(12);
}
const db=createPostgresConditionalResourceRepositoryV010({
  connectionString:url,schema,receiptWriteMode:"SQL_GATEWAY_ISOLATED_V010"
});
const doWork=async()=>{
  try{
    const saved=await db.putIfRevisionWithReceipt(request.input,request.signed);
    if(mode==="lost-ack")process.exit(19);
    process.send?.({type:"success",revision:saved.resource.revision,
      title:saved.resource.payload?.title,replayed:saved.replayed,
      receiptId:saved.receipt.receiptId});
    await db.close();process.exit(0);
  }catch(e){
    process.send?.({type:"rejected",code:String(e?.message??e)});
    await db.close();process.exit(2);
  }
};
if(mode==="barrier-write"){
  process.send?.({type:"ready"});
  process.on("message",m=>{if(m?.type==="start")void doWork();});
}else if(mode==="lost-ack"||mode==="write"){
  void doWork();
}else{
  await db.close();process.exit(12);
}
