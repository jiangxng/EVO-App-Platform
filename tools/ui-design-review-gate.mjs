#!/usr/bin/env node
// Process gate: require a task-specific, committed Eidos UI review when a PR changes Human UI source.
// A PASS is proof of review *presence*, not proof that visual experience or User acceptance passed.
import {execFileSync} from "node:child_process";
import {readFileSync} from "node:fs";
const headings=["目标与完成条件","流程与步骤","导航与信息架构","视觉与颜色","记忆与注意力","无障碍与跨年龄","安全与数据修复","证据与剩余问题"];
const noteRoot="docs/ui-design-reviews/";
function isUI(p){
  if (/^vendor\/eidos\/src\/(?:design-language|navigation|workbench|renderers|components|experience)\//.test(p)) return true;
  if (/^manager\//.test(p) && /(?:page|view|workbench|navigation|ui|form|shell|experience).*(?:\.tsx?|\.html|\.css)$/.test(p)) return true;
  if (/^apps\//.test(p) && /(?:page|pages|view|views|workbench|navigation|ui|form|designer|viewer|experience|front-end|display).*\.(?:tsx?|html|css)$/.test(p)) return true;
  if (/^help\/content\//.test(p) && /\.html$/.test(p)) return true;
  return false;
}
function check(files,read) {
  const changed=files.filter(isUI);
  if (!changed.length) return {ok:true,changed,message:"No recognized Platform Human UI changes."};
  const notes=files.filter(x=>x.startsWith(noteRoot)&&x.endsWith(".md"));
  if (!notes.length) return {ok:false,changed,message:"Missing same-PR docs/ui-design-reviews/*.md review artifact."};
  for(const path of notes){
    let body="";
    try{body=read(path)}catch{continue}
    if(body.length<500)continue;
    if(headings.every(h=>new RegExp("^##\\s+"+h+"\\s*$","m").test(body))
      && changed.some(x=>body.includes(x)))return {ok:true,changed,message:"Reviewed with "+path};
  }
  return {ok:false,changed,message:"Review artifact must include all eight headings and one exact modified UI source path; see .clinerules/03-human-ui-design-review.md."};
}
if(process.argv.includes("--self-test")){
  const demo=headings.map(x=>"## "+x+"\nTask-specific reasoning, scope, design evidence and recovery.").join("\n")+"\napps/data-import/page.ts";
  const must=(v,msg)=>{if(!v)throw Error("self-test: "+msg)};
  must(check(["docs/file.md"],()=>demo).ok,"docs-only change");
  must(!check(["apps/data-import/page.ts"],()=>demo).ok,"missing review must fail");
  must(check(["apps/data-import/page.ts","docs/ui-design-reviews/test.md"],()=>demo).ok,"review can pass");
  must(!check(["apps/data-import/page.ts","docs/ui-design-reviews/test.md"],()=>demo.replace("## 记忆与注意力","## OTHER")).ok,"missing cognition must fail");
  must(isUI("manager/app-host-shell.ts") && isUI("vendor/eidos/src/design-language/tokens.ts"),"UI coverage");
  console.log("Platform UI review gate self-test PASS");process.exit(0);
}
const [base,head]=process.argv.slice(2);
if(!base||!head){console.error("Usage: node tools/ui-design-review-gate.mjs <base-sha> <head-sha>");process.exit(2)}
const files=execFileSync("git",["diff","--name-only","--diff-filter=ACMR",base+"..."+head],{encoding:"utf8"}).trim().split("\n").filter(Boolean);
const result=check(files,p=>readFileSync(p,"utf8"));
console.log(JSON.stringify(result,null,2));if(!result.ok)process.exit(1);
