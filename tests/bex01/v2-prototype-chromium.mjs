#!/usr/bin/env node
// Browser acceptance for BEX-01 V2 *synthetic design prototype only*.
// Never connects to Host, customer data, Railway or real Import Job.
import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';
import process from 'node:process';

const root=process.cwd();
const pageFile=path.resolve(root,'docs/plans/foundation-list-experience/BEX-01-IMPORT-V2-HUMAN-REVIEW-PROTOTYPE-20261015.html');
const out=path.resolve(root,'artifacts/bex-v2-prototype-browser');
fs.mkdirSync(out,{recursive:true});
const url='file://'+pageFile;
const results=[];
const browserErrors=[];
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME || undefined,args:['--no-sandbox']});
const snapshot=async(page,name)=>{await page.screenshot({path:path.join(out,name+'.png'),fullPage:true});};
const test=async(name,fn)=>{
  try{const result=await fn();results.push({name,status:'PASS',detail:result||null});console.log('BEX_V2_CHROMIUM_PASS:'+name);}
  catch(e){results.push({name,status:'FAIL',error:String(e.stack||e)});console.error('BEX_V2_CHROMIUM_FAIL:'+name+':'+String(e));}
};
const makeContext=async({width=1280,height=820,phone=false}={})=>browser.newContext({
 viewport:{width,height},locale:'zh-CN',deviceScaleFactor:phone?2:1,isMobile:phone,hasTouch:phone
});
const fresh=async(context)=>{
 const page=await context.newPage();
 page.on('pageerror',error=>browserErrors.push(error.message));
 page.on('request',request=>{if(!request.url().startsWith('file://'))browserErrors.push('External request '+request.url());});
 await page.goto(url,{waitUntil:'load'});
 return page;
};
await test('desktop-layout-and-clear-synthetic-data-disclosure',async()=>{
 const context=await makeContext();try{
 const page=await fresh(context);
 await page.getByRole('heading',{name:'导入供应商'}).waitFor();
 const visible=await page.locator('#review').isVisible();
 const note=await page.locator('.banner').textContent();
 const count=await page.locator('.metrics .metric').count();
 const width=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,viewport:window.innerWidth}));
 if(!visible||!note.includes('7 列演示数据')||!note.includes('没有访问原 Import Job')||count!==4||width.scroll>width.viewport+2)throw Error(JSON.stringify({visible,count,width,note}));
 await snapshot(page,'01-desktop-initial');
 return {count,width,reviewVisible:visible};
 }finally{await context.close()}
});
await test('precheck-fail-closed-and-independent-schema-confirmation',async()=>{
 const context=await makeContext();try{
 const page=await fresh(context);
 await page.locator('#prepare').click();
 if(!await page.locator('#confirm').isVisible()||await page.locator('#precheck').isVisible())throw Error('Create schema confirmation missing');
 await snapshot(page,'02-schema-confirmation');
 await page.locator('#schemaConfirm').click();
 if(!await page.locator('#precheck').isVisible())throw Error('Precheck panel not shown');
 if(await page.locator('#submit').isEnabled())throw Error('Final commit enabled with two outstanding exception categories');
 const blockers=await page.locator('#blockers').textContent();
 if(!blockers.includes('开户银行')||!blockers.includes('3 行'))throw Error('Missing blocked reason '+blockers);
 await snapshot(page,'03-blocked-precheck');
 return {submitDisabled:true,blockers};
 }finally{await context.close()}
});
await test('correct-bank-and-three-types-then-final-explicit-commit',async()=>{
 const context=await makeContext();try{
 const page=await fresh(context);
 await page.locator('#bankToggle').click();
 if((await page.locator('#bankToggle').getAttribute('aria-expanded'))!=='true')throw Error('Bank disclosure aria not updated');
 await page.locator('#bank').selectOption('B');
 await page.locator('#typeToggle').click();
 for(const [id,val] of [['t1','ORG'],['t2','PERSON'],['t3','ORG']])await page.locator('#'+id).selectOption(val);
 if(await page.locator('#blockCount').textContent()!=='0')throw Error('Unresolved count should be 0');
 await page.locator('#allFields summary').click();
 if(await page.locator('#allFields table tbody tr').count()!==7)throw Error('Synthetic table missing 7 rows');
 await snapshot(page,'04-decisions-and-expanded-fields');
 await page.locator('#prepare').click();
 await page.locator('#schemaConfirm').click();
 if(!await page.locator('#submit').isEnabled())throw Error('Final action should be enabled only after passing simulated precheck');
 await snapshot(page,'05-passed-precheck');
 await page.locator('#submit').click();
 if(!await page.locator('#done').isVisible()||await page.locator('#precheck').isVisible())throw Error('Not on completed simulation state');
 await snapshot(page,'06-simulated-finish');
 return {manualOptions:4,commitExplicit:true};
 }finally{await context.close()}
});
await test('browser-local-demo-draft-refresh-and-edit-revalidation',async()=>{
 const context=await makeContext();try{
 const page=await fresh(context);
 await page.locator('#bankToggle').click();
 await page.locator('#bank').selectOption('A');
 await page.locator('#typeToggle').click();
 for(const id of ['t1','t2','t3'])await page.locator('#'+id).selectOption('ORG');
 const stored=await page.evaluate(()=>localStorage.getItem('bex-v2-demo-state-20261015'));
 if(!stored||!stored.includes('"bank":"A"'))throw Error('Did not store mock draft in browser');
 await page.reload({waitUntil:'load'});
 if(await page.locator('#bank').inputValue()!=='A')throw Error('Mock bank draft not recovered');
 if(await page.locator('#blockCount').textContent()!=='0')throw Error('Mock row corrections not recovered');
 await page.locator('#prepare').click();await page.locator('#schemaConfirm').click();
 if(!await page.locator('#submit').isEnabled())throw Error('Initially passed simulated dry-run');
 await page.locator('#checkBack').click();
 await page.locator('#bankToggle').click();
 await page.locator('#bank').selectOption('B');
 await page.locator('#prepare').click();
 if(!await page.locator('#precheck').isVisible())throw Error('Should reuse unchanged Schema confirmation, while recomputing precheck');
 if(!await page.locator('#submit').isEnabled())throw Error('Revalidated precheck should pass');
 await page.locator('#checkBack').click();
 await page.locator('#reset').click();
 await page.reload({waitUntil:'load'});
 if(await page.locator('#bank').inputValue()!=='')throw Error('Reset and reload should clear mock state');
 return {browserLocalOnly:true,oldDryRunInvalidatedByEditing:true};
 }finally{await context.close()}
});
await test('mobile-width-touch-and-disclosure',async()=>{
 const context=await makeContext({width:390,height:844,phone:true});try{
 const page=await fresh(context);
 const sizes=await page.evaluate(()=>{
   const all=[...document.querySelectorAll('button,summary')].filter(x=>!x.closest('[hidden]') && getComputedStyle(x).display!=='none');
   return {targets:all.map(x=>({name:x.id||x.tagName,h:Math.round(x.getBoundingClientRect().height)})),scroll:document.documentElement.scrollWidth,viewport:window.innerWidth};
 });
 if(sizes.scroll>sizes.viewport+2||sizes.targets.some(t=>t.h<44))throw Error('Mobile reflow/target issue '+JSON.stringify(sizes));
 await snapshot(page,'07-phone-review');
 await page.locator('#bankToggle').click();
 await page.locator('#typeToggle').click();
 await snapshot(page,'08-phone-expanded');
 return sizes;
 }finally{await context.close()}
});
await test('keyboard-enter-and-focus-style',async()=>{
 const context=await makeContext();try{
 const page=await fresh(context);
 await page.locator('#bankToggle').focus();
 const before=await page.locator('#bankBody').isVisible();
 await page.keyboard.press('Enter');
 const after=await page.locator('#bankBody').isVisible();
 const focus=await page.locator('#bankToggle').evaluate(x=>({active:document.activeElement===x,outline:getComputedStyle(x).outlineWidth}));
 if(before||!after||!focus.active||focus.outline==='0px')throw Error(JSON.stringify({before,after,focus}));
 return focus;
 }finally{await context.close()}
});
await test('two-hundred-percent-text-scale-review',async()=>{
 const context=await makeContext({width:1280,height:820});try{
 const page=await fresh(context);
 await page.evaluate(()=>document.body.style.zoom='200%');
 const layout=await page.evaluate(()=>({
 scroll:document.documentElement.scrollWidth,viewport:innerWidth,
 title:document.querySelector('h1').getBoundingClientRect().width,
 primary:document.querySelector('#prepare').getBoundingClientRect().width,
 bodyScrollHeight:document.body.scrollHeight
 }));
 await snapshot(page,'09-desktop-200pct-zoom');
 if(layout.scroll>layout.viewport+2)throw Error('Overflow at 200% CSS zoom: '+JSON.stringify(layout));
 return layout;
 }finally{await context.close()}
});
await browser.close();
fs.writeFileSync(path.join(out,'report.json'),JSON.stringify({artifact:'BEX-V2-static-prototype-only',sha:process.env.GITHUB_SHA||'local',results,browserErrors,notVerified:['real Host','original 22-source-column XLSX','authenticated Import Job','production Eidos rendering','Human acceptance','Railway']},null,2));
console.log('BEX_V2_BROWSER_SUMMARY='+JSON.stringify({passed:results.filter(x=>x.status==='PASS').length,failed:results.filter(x=>x.status==='FAIL').length,errors:browserErrors}));
if(results.some(r=>r.status==='FAIL')||browserErrors.length)process.exitCode=1;
