import {createPa05SharedReadOwnerGateV010}
  from "../../../dist/manager/pa05-read-owner-shared-sql-gate.js";

const gate=await createPa05SharedReadOwnerGateV010({
  connectionString:process.env.PA05_E01J_AUTHORITY_URL,
  schema:process.env.PA05_E01J_SCHEMA,
  ownerPackageId:"evo-purchase-attention",
  trustedHostIds:["read-host-a","read-host-b"]
});
const send=(type,value={})=>process.send?.({type,...value});
let release;
send("ready",{pid:process.pid});
process.on("message",async msg=>{
  try{
    if(msg.type==="hold"){
      await gate.withReadAdmission({
        hostId:process.env.PA05_E01J_HOST_ID,
        expectedEpoch:msg.epoch,
        async perform(){
          send("held",{pid:process.pid});
          await new Promise(resolve=>{release=resolve;});
          return "HOST_READ_COMPLETED";
        }
      });
      send("holdDone");
    }else if(msg.type==="release"){
      release?.();
      send("released");
    }else if(msg.type==="revoke"){
      send("revokeStarted");
      const epoch=await gate.revoke(msg.epoch);
      send("revoked",{epoch});
    }else if(msg.type==="read"){
      const value=await gate.withReadAdmission({
        hostId:msg.hostId??process.env.PA05_E01J_HOST_ID,
        expectedEpoch:msg.epoch,
        async perform(){return "ALLOWED";}
      });
      send("readResult",{value});
    }else if(msg.type==="close"){
      await gate.close();
      send("closed");
      process.exit(0);
    }
  }catch(e){
    send("operationDenied",{operation:msg.type,code:e.message});
  }
});
