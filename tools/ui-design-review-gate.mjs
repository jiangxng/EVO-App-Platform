#!/usr/bin/env node
// Process gate: require a task-specific, committed Eidos UI review when a PR changes Human UI source.
// A PASS is proof of review *presence*, not proof that visual experience or User acceptance passed.
import {execFileSync} from "node:child_process";
import {readFileSync} from "node:fs";
const headings=["目标与完成条件","流程与步骤","导航与信息架构","视觉与颜色","记忆与注意力","无障碍与跨年龄","安全与数据修复","证据与剩余问题"];
const noteRoot="docs/ui-design-reviews/";
// Match actual Human-visible contributors. Package manifests and manager models
// are only treated as UI when their added diff contains an Experience contribution.
function addedHumanUI(p, patch = "") {
  if (!patch) return false;
  const additions = patch.split("\n")
    .filter(line => line.startsWith("+") && !line.startsWith("+++"))
    .map(line => line.slice(1)).join("\n");
  if (/^apps\/[^/]+\/package\.ts$/.test(p)) {
    return /\beidos\.(?:experience|localization-bundle)\b|(?:^|\n)\s*(?:pages|routes)\s*:/.test(additions)
      || /ENTERPRISE_CONTEXT_MY_PERMISSIONS_PAGE_(?:SOURCE|ID|ROUTE)/.test(additions);
  }
  if (/^manager\/[^/]+\.ts$/.test(p)) {
    return /\bcreate\w+PageV\d+\b|\bkind\s*:\s*["']catalog-browser["']/.test(additions);
  }
  return false;
}
function isUI(p, patch = "") {
  if (/^vendor\/eidos\/src\/(?:design-language|navigation|workbench|renderers|components|experience)\//.test(p)) return true;
  if (/^manager\//.test(p) && /(?:page|view|workbench|navigation|ui|form|shell|experience).*(?:\.tsx?|\.html|\.css)$/.test(p)) return true;
  if (/^apps\//.test(p) && /(?:page|pages|view|views|workbench|navigation|ui|form|designer|viewer|experience|front-end|display).*\.(?:tsx?|html|css)$/.test(p)) return true;
  if (/^help\/content\//.test(p) && /\.html$/.test(p)) return true;
  return addedHumanUI(p, patch);
}
const pluginPage = p => /^apps\/.+\/(?:[^/]*page[^/]*|[^/]*view[^/]*)\.(?:tsx?|html|css)$/.test(p);
const isPluginUI = (p,patch) => pluginPage(p)
  || (/^apps\/[^/]+\/package\.ts$/.test(p) && addedHumanUI(p,patch))
  || (/^manager\/[^/]+\.ts$/.test(p) && addedHumanUI(p,patch));
const extraHeadings = [
  "页面模式与导航归属", "功能、布局、颜色对照", "入口、退出与恢复矩阵", "浏览器与 Human 证据"
];
function hasPluginEvidence(body) {
  return extraHeadings.every(h => new RegExp("^##\\s+"+h+"\\s*$","m").test(body))
    && ["功能","布局","颜色","入口","退出","异常恢复","桌面","移动","Human"].every(k =>
      new RegExp("^(?:[-*]\\s*)?"+k+"\\s*[：:]\\s*\\S+","mi").test(body));
}
// A changed plugin route or contextual action is a journey, not an isolated button.
// Require a same-PR regression test instead of accepting a review document alone.
function changesHumanJourney(p, patch = "") {
  if (!isPluginUI(p, patch)) return false;
  return patch.split("\n").some(line =>
    line.startsWith("+") && !line.startsWith("+++")
    && /\b(?:contextNavigation|primaryAction|secondaryActions|navigateTo|routes|defaultRoute)\s*:|\broute\s*:/.test(line.slice(1)));
}
function addedRawEnum(p, patch = "") {
  if (!pluginPage(p)) return false;
  return patch.split("\n").some(line =>
    line.startsWith("+") && !line.startsWith("+++")
    && /\bcategory\s*:\s*["'](?:ACTION|NAVIGATION|RESOURCE|SYSTEM)["']/.test(line));
}
function check(files, read, readPatch = () => "") {
  const patches = new Map(files.map(p => [p, readPatch(p)]));
  const changed = files.filter(p => isUI(p, patches.get(p)));
  if (!changed.length) return {ok:true,changed,message:"No recognized Platform Human UI changes."};
  const enumLeaks = changed.filter(p => addedRawEnum(p,patches.get(p)));
  if (enumLeaks.length) return {ok:false,changed,message:"New raw technical category (ACTION/NAVIGATION/RESOURCE/SYSTEM) in plugin page source: "+enumLeaks.join(", ")+". Use Human-facing business language."};
  const pluginChanged = changed.filter(p => isPluginUI(p,patches.get(p)));
  const changedJourneys = pluginChanged.filter(p => changesHumanJourney(p, patches.get(p)));
  if (changedJourneys.length && !files.some(p => /^tests\/.*\.test\.[cm]?js$/.test(p))) {
    return {ok:false,changed,message:"Plugin navigation/primary-action change needs an updated same-PR tests/**/*.test.mjs journey regression proving entry → destination → parent/back and failure recovery. Changed routes: "+changedJourneys.join(", ")};
  }
  const notes = files.filter(x => x.startsWith(noteRoot) && x.endsWith(".md"));
  if (!notes.length) return {ok:false,changed,message:"Missing same-PR docs/ui-design-reviews/*.md review artifact."};
  for (const path of notes) {
    let body="";
    try { body=read(path); } catch { continue; }
    if (body.length < 500) continue;
    const validEight = headings.every(h => new RegExp("^##\\s+"+h+"\\s*$","m").test(body))
      && changed.some(x => body.includes(x));
    if (validEight && (!pluginChanged.length || hasPluginEvidence(body))) {
      return {ok:true,changed,message:"Reviewed with "+path+(pluginChanged.length ? " (plugin experience evidence present; not Human PASS)" : "")};
    }
  }
  return {ok:false,changed,message:"Review artifact needs eight Eidos headings and exact UI source path; plugin Experience pages need four extra headings including entry/exit/recovery matrix and distinct functionality, layout, color, desktop, mobile and Human status lines. Changed navigation/actions additionally require a regression test file. See docs/governance/PLUGIN-HUMAN-EXPERIENCE-DELIVERY-GATE-20261028.md."};
}
if(process.argv.includes("--self-test")){
  const base=headings.map(x=>"## "+x+"\nConcrete task, review evidence, recovery.").join("\n")+"\napps/data-import/page.ts";
  const extras=extraHeadings.map(x=>"## "+x+"\nSelection, existing authority, rationale.").join("\n")
    +"\n功能：待实测\n布局：待实测\n颜色：待实测\n入口：待测\n退出：待测\n异常恢复：待测\n桌面：未取得\n移动：未取得\nHuman：未签收";
  const must=(v,msg)=>{if(!v)throw Error("self-test: "+msg)};
  must(check(["docs/file.md"],()=>base).ok,"docs-only change");
  must(!check(["apps/data-import/page.ts"],()=>base).ok,"missing review must fail");
  must(!check(["apps/data-import/page.ts","docs/ui-design-reviews/test.md"],()=>base).ok,"old eight-section-only review must not pass for plugin UI");
  must(check(["apps/data-import/page.ts","docs/ui-design-reviews/test.md"],()=>base+"\n"+extras).ok,"plugin evidence review may pass without claiming Human PASS");
  must(!check(["apps/data-import/page.ts","docs/ui-design-reviews/test.md"],()=>base.replace("## 记忆与注意力","## OTHER")+"\n"+extras).ok,"missing cognition must fail");
  const manifestPatch="+      kind: \"eidos.experience\"\n+      pages: []";
  must(addedHumanUI("apps/example/package.ts",manifestPatch),"UI manifest diff must be detected");
  must(!addedHumanUI("apps/example/package.ts","+      requiresCapabilities: []"),"non-UI manifest diff must not be detected");
  must(!check(["apps/example/package.ts","docs/ui-design-reviews/test.md"],()=>base+"\n"+extras,()=>"+      category: \"ACTION\"").changed.length,"non-UI manifest not detected");
  must(!check(["apps/example/page.ts","docs/ui-design-reviews/test.md"],()=>base+"\n"+extras,()=>"+      category: \"ACTION\"").ok,"raw ACTION category in plugin page must fail");
  const navPatch="+      contextNavigation: { items: [] }\n+      primaryAction: { type: \"navigate\", route: \"/example\" }";
  const navReview = base+"\n"+extras+"\napps/example/page.ts";
  must(changesHumanJourney("apps/example/page.ts",navPatch),"added navigation should be detected");
  must(!check(["apps/example/page.ts","docs/ui-design-reviews/test.md"],()=>navReview,()=>navPatch).ok,"navigation change without actual test file must fail");
  must(check(["apps/example/page.ts","tests/protocol/example-human-journey.test.mjs","docs/ui-design-reviews/test.md"],()=>navReview,()=>navPatch).ok,"test + review enables navigation change");
  must(isUI("manager/app-host-shell.ts") && isUI("vendor/eidos/src/design-language/tokens.ts"),"existing UI coverage");
  console.log("Platform UI review gate self-test PASS"); process.exit(0);
}
const [base,head]=process.argv.slice(2);
if(!base||!head){console.error("Usage: node tools/ui-design-review-gate.mjs <base-sha> <head-sha>");process.exit(2)}
const files=execFileSync("git",["diff","--name-only","--diff-filter=ACMR",base+"..."+head],{encoding:"utf8"}).trim().split("\n").filter(Boolean);
const patch = p => execFileSync("git",["diff","--unified=0",base+"..."+head,"--",p],{encoding:"utf8"});
const result=check(files,p=>readFileSync(p,"utf8"),patch);
console.log(JSON.stringify(result,null,2));if(!result.ok)process.exit(1);
