import test from "node:test";
import assert from "node:assert/strict";
import {spawn} from "node:child_process";
import {createServer} from "node:net";
import {mkdtempSync,rmSync} from "node:fs";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {
  assertCv03HumanSaveNotEnabledV010,
  isCv03HumanSaveFormSourceV010,
  cv03UnadmittedWriteDenialV010,
  CV03_HUMAN_SAVED_VIEW_FORM_SOURCE_V010,
  CV03_PERSONAL_SAVED_VIEW_SAVE_COMMAND_V010
} from "../../dist/manager/cv03-personal-saved-view-host-admission.js";

function command(code,actionId=code){
  return {contractVersion:"0.1.0",type:"command",
    command:{code,inputVersion:"0.1.0"},
    values:{},sourceInteractionId:"cv03-host-admission-test",
    actionId,requiresConfirmation:false};
}
test("CV03 production gate rejects every uncertified WRITE flag and targets only this operation",()=>{
  assert.doesNotThrow(()=>assertCv03HumanSaveNotEnabledV010({}));
  assert.doesNotThrow(()=>assertCv03HumanSaveNotEnabledV010(
    {APP_PLATFORM_CV03_HUMAN_SAVE_MODE:" off "}
  ));
  for (const mode of ["ON","SIGNED","STAGING","TEST_ONLY","READ_ONLY","ALLOW","0"]) {
    assert.throws(()=>assertCv03HumanSaveNotEnabledV010({
      APP_PLATFORM_CV03_HUMAN_SAVE_MODE:mode
    }),/CV03_HUMAN_SAVE_PRODUCTION_ADMISSION_REQUIRED/);
  }
  assert.equal(isCv03HumanSaveFormSourceV010(
    CV03_HUMAN_SAVED_VIEW_FORM_SOURCE_V010),true);
  assert.equal(isCv03HumanSaveFormSourceV010(
    "app://evo-business-dictionary/pages/option"),false);
  const denied=cv03UnadmittedWriteDenialV010(command(
    CV03_PERSONAL_SAVED_VIEW_SAVE_COMMAND_V010,"save-personal-view"
  ));
  assert.equal(denied.ok,false);
  assert.equal(denied.error.code,
    "CV03_HUMAN_SAVE_PRODUCTION_ADMISSION_REQUIRED");
  assert.equal(denied.correlationId,"cv03-host-admission-test");
  // Neither an invalid Eidos action ID nor a Personal Agent canonical ID
  // can bypass this explicit production admission wall.
  assert.equal(cv03UnadmittedWriteDenialV010(command(
    CV03_PERSONAL_SAVED_VIEW_SAVE_COMMAND_V010)).ok,false);
  for(const code of ["dictionary.collection.query","dictionary.draft.save",
    "app-platform.update-settings","other.app.action"]) {
    assert.equal(cv03UnadmittedWriteDenialV010(command(code)),undefined);
  }
});

const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function availablePort(){
  const probe=createServer();
  await new Promise((resolve,reject)=>probe.once("error",reject)
    .listen(0,"127.0.0.1",resolve));
  const port=probe.address().port;
  await new Promise(resolve=>probe.close(resolve));
  return port;
}
async function realHost(){
  const port=await availablePort(),dir=mkdtempSync(join(tmpdir(),"cv03-real-host-off-"));
  const child=spawn(process.execPath,["dist/manager/server.js"],{
    cwd:process.cwd(),env:{
      PATH:process.env.PATH??"",HOME:dir,PORT:String(port),
      NODE_ENV:"test",APP_PLATFORM_CV03_HUMAN_SAVE_MODE:"OFF"
    },stdio:["ignore","pipe","pipe"]
  });
  let logs="";
  for(const stream of [child.stdout,child.stderr]) {
    stream.on("data",chunk=>{logs=(logs+String(chunk)).slice(-15000);});
  }
  const base="http://127.0.0.1:"+port;
  let ready=false;
  for(let i=0;i<130;i++){
    if(child.exitCode!==null)break;
    try{
      const res=await fetch(base+"/v1/catalog",{
        signal:AbortSignal.timeout(650)
      });
      if(res.status===200){ready=true;break;}
    }catch{}
    await pause(130);
  }
  if(!ready){
    child.kill("SIGKILL");
    rmSync(dir,{recursive:true,force:true});
    throw Error("CV03_REAL_HOST_START_FAILED:"+logs.slice(-5000));
  }
  return {base,logs:()=>logs,async close(){
    if(child.exitCode===null){
      child.kill("SIGTERM");
      await Promise.race([
        new Promise(resolve=>child.once("exit",resolve)),
        pause(4500)
      ]);
      if(child.exitCode===null)child.kill("SIGKILL");
    }
    rmSync(dir,{recursive:true,force:true});
  }};
}
test("CV03 actual production-shaped Host HTTP stays OFF without intercepting unrelated actions",{
  timeout:45000
},async()=>{
  const host=await realHost();
  try{
    const source="/v1/experience-pages?source="+encodeURIComponent(
      CV03_HUMAN_SAVED_VIEW_FORM_SOURCE_V010
    )+"&route="+encodeURIComponent("/business-dictionaries?view=all");
    const get=await fetch(host.base+source,{signal:AbortSignal.timeout(2000)});
    assert.equal(get.status,404);
    assert.equal((await get.json()).code,"CV03_HUMAN_SAVE_PAGE_NOT_ADMITTED");
    const action=await fetch(host.base+"/v1/actions",{
      method:"POST",headers:{"content-type":"application/json"},
      body:JSON.stringify(command(CV03_PERSONAL_SAVED_VIEW_SAVE_COMMAND_V010,
        "save-personal-view")),
      signal:AbortSignal.timeout(2000)
    });
    assert.equal(action.status,403);
    const rejected=await action.json();
    assert.equal(rejected.error.code,
      "CV03_HUMAN_SAVE_PRODUCTION_ADMISSION_REQUIRED");
    // The isolated HTTP adapter must NEVER capture arbitrary Host actions.
    const unrelated=await fetch(host.base+"/v1/actions",{
      method:"POST",headers:{"content-type":"application/json"},
      body:JSON.stringify(command("not-a-cv03-command")),
      signal:AbortSignal.timeout(2000)
    });
    assert.notEqual(unrelated.status,404);
    const fallback=await unrelated.json();
    assert.notEqual(fallback.error?.code,
      "CV03_HUMAN_SAVE_PRODUCTION_ADMISSION_REQUIRED");
    const catalog=await fetch(host.base+"/v1/catalog",{
      signal:AbortSignal.timeout(2000)
    });
    assert.equal(catalog.status,200);
  }finally{await host.close();}
});
