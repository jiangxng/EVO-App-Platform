#!/usr/bin/env node
// Automated browser review of a self-contained, synthetic high-fidelity product page.
// This does NOT access real customer records, Host, Railway or a production Import Job.
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const output=path.resolve('artifacts/bex-v2-prototype-browser');
fs.mkdirSync(output,{recursive:true});
const url='file://'+path.resolve('docs/plans/foundation-list-experience/BEX-01-IMPORT-V2-HUMAN-REVIEW-PROTOTYPE-20261015.html');
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME||undefined,args:['--no-sandbox']});
const checks=[],errors=[];
const context=async(options={})=>browser.newContext({viewport:{width:1280,height:850},locale:'zh-CN',...options});
const pageFor=async ctx=>{const page=await ctx.newPage();page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(!r.url().startsWith('file://'))errors.push('Unexpected external request: '+r.url());});await page.goto(url,{waitUntil:'load'});return page;};
const snap=async(page,name)=>page.screenshot({path:path.join(output,name+'.png'),fullPage:true});
const run=async(name,fn)=>{try{const detail=await fn();checks.push({name,status:'PASS',detail:detail||null});console.log('BEX_V2_CHROMIUM_PASS:'+name)}catch(e){checks.push({name,status:'FAIL',error:String(e.stack||e)});console.error('BEX_V2_CHROMIUM_FAIL:'+name+':'+String(e))}};
const choose=async page=>{await page.locator('#bankToggle').click();await page.locator('#bank').selectOption('BANK_SETTLEMENT');await page.locator('#typeToggle').click();for(const [id,v] of [['type_0','ORG'],['type_1','ORG'],['type_2','PERSON']])await page.locator('#'+id).selectOption(v);await page.locator('#metaToggle').click();await page.locator('#map_systemCode').selectOption('__IGNORE__');};
await run('real-product-copy-no-developer-or-prototype-labels',async()=>{
 const ctx=await context();try{const page=await pageFor(ctx),text=await page.locator('body').innerText();
 for(const bad of ['演示选择','模拟问题','非 Host','DEMO-','模拟数据','原型','Schema','请在真实','暂不支持'])if(text.includes(bad))throw Error('Developer text leaked into UI: '+bad);
 if(!text.includes('核对导入数据')||!text.includes('供应商资料_2026年10月.xlsx')||!text.includes('22 列')||!text.includes('172 条记录'))throw Error('Unconvincing application context');
 await snap(page,'01-desktop-overview');return {userFacing:true,fileSummary:true};
 }finally{await ctx.close();}
});
await run('clear-exceptions-first-and-row-level-subject-correction',async()=>{
 const ctx=await context();try{const page=await pageFor(ctx);
 if(await page.locator('#issueCount').textContent()!=='3')throw Error('Unexpected initial issues');
 await page.locator('#typeToggle').click();
 if(await page.locator('#recordRows .recordgrid').count()!==3)throw Error('Missing three distinct problem records');
 if(!await page.locator('#type_1').isVisible())throw Error('Correction UI not visible');
 await page.locator('#type_0').selectOption('ORG');
 if(!await page.locator('#subjectStatus').innerText().then(x=>x.includes('2 条')))throw Error('Live remaining-count not refreshed');
 await snap(page,'02-record-corrections');return {threeDistinctRecords:true,liveRemainingCount:true};
 }finally{await ctx.close();}
});
await run('twenty-two-source-columns-and-realistic-preview',async()=>{
 const ctx=await context();try{const page=await pageFor(ctx);
 await page.locator('#toggleAll').click();
 const rows=await page.locator('#mappingRows tr').count();
 if(rows!==22)throw Error('Expected 22 distinct source columns, saw '+rows);
 const sample=await page.locator('#mappingRows').innerText();
 if(!sample.includes('银行账号')||!sample.includes('账期天数')||!sample.includes('默认支付方式')||!sample.includes('GYS-0001'))throw Error('Missing real-looking business data');
 await snap(page,'03-complete-field-table');return {rows};
 }finally{await ctx.close();}
});
await run('ambiguous-bank-must-choose-business-usage',async()=>{
 const ctx=await context();try{const page=await pageFor(ctx);
 await page.locator('#bankToggle').click();const options=await page.locator('#bank option').allTextContents();
 if(!options.some(x=>x.includes('结算资料'))||!options.some(x=>x.includes('财务归档')))throw Error('Missing business context for same-name candidates');
 await page.locator('#bank').selectOption('BANK_SETTLEMENT');
 if(!await page.locator('#bankStatus').innerText().then(x=>x.includes('已选择')))throw Error('Bank decision not reflected');
 return {choices:options};
 }finally{await ctx.close();}
});
await run('metadata-intentional-exclusion-can-be-reverted',async()=>{
 const ctx=await context();try{const page=await pageFor(ctx);
 await page.locator('#metaToggle').click();
 if(await page.locator('#map_systemCode').inputValue()!=='__PENDING__')throw Error('Unclear metadata silently ignored');
 await page.locator('#map_systemCode').selectOption('__IGNORE__');
 if(await page.locator('#skipCount').textContent()!=='1')throw Error('Ignore count incorrect');
 await page.locator('#map_systemCode').selectOption('__PENDING__');
 if(await page.locator('#skipCount').textContent()!=='0')throw Error('Exclusion not reversible');
 await page.locator('#map_systemCode').selectOption('__IGNORE__');
 await snap(page,'04-source-field-decision');return {reversible:true};
 }finally{await ctx.close();}
});
await run('existing-mapping-one-target-one-column',async()=>{
 const ctx=await context();try{const page=await pageFor(ctx);
 await page.locator('#toggleAll').click();
 const occupied=page.locator('#map_pay option[value="code"]');
 if(!await occupied.isDisabled())throw Error('Second Excel column can claim existing code field');
 const payment=page.locator('#map_pay');await payment.selectOption('payExisting');
 if(await page.locator('#createCount').textContent()!=='3')throw Error('Already-existing field reuse did not shrink creation list');
 if(!await page.locator('#map_settle option[value="payExisting"]').isDisabled())throw Error('Same mapped target not exclusive');
 return {exclusivity:true,reuse:true};
 }finally{await ctx.close();}
});
await run('fail-closed-precheck-with-unresolved-issues',async()=>{
 const ctx=await context();try{const page=await pageFor(ctx);
 await page.locator('#prepare').click();
 if(!await page.locator('#precheck').isVisible()||await page.locator('#submit').isEnabled())throw Error('Precheck not blocking unresolved records');
 const notice=await page.locator('#checkNotice').innerText();
 if(!notice.includes('问题需要处理'))throw Error('Natural blocker missing');
 await snap(page,'05-validation-blocked');return {blocked:true,notice};
 }finally{await ctx.close();}
});
await run('batch-schema-approval-is-distinct-from-final-import',async()=>{
 const ctx=await context();try{const page=await pageFor(ctx);await choose(page);
 if(await page.locator('#issueCount').textContent()!=='0')throw Error('All record and field issues should be resolved');
 await page.locator('#prepare').click();
 if(!await page.locator('#confirm').isVisible()||await page.locator('#precheck').isVisible())throw Error('Batch field confirmation bypassed');
 if(await page.locator('#schemaRows tr').count()!==4)throw Error('Expected four proposed new fields');
 await snap(page,'06-create-fields-review');
 await page.locator('#schemaConfirm').click();
 if(!await page.locator('#precheck').isVisible()||!await page.locator('#submit').isEnabled())throw Error('Precheck not passed after approval');
 await snap(page,'07-validated');
 await page.locator('#submit').click();
 if(!await page.locator('#done').isVisible())throw Error('Final import requires explicit separate action');
 await snap(page,'08-import-completed');return {createdCount:4,finalActionSeparate:true};
 }finally{await ctx.close();}
});
await run('changing-create-list-invalidates-earlier-approval',async()=>{
 const ctx=await context();try{const page=await pageFor(ctx);await choose(page);
 await page.locator('#prepare').click();await page.locator('#schemaConfirm').click();
 if(!await page.locator('#submit').isEnabled())throw Error('Expected passed initial precheck');
 await page.locator('#checkBack').click();await page.locator('#tableFilter').selectOption('all');
 await page.locator('#map_pay').selectOption('__IGNORE__');
 await page.locator('#prepare').click();
 if(!await page.locator('#confirm').isVisible())throw Error('Changed schema must require new approval');
 if(await page.locator('#schemaRows tr').count()!==3)throw Error('Changed fields not reflected in approval');
 await page.locator('#schemaConfirm').click();
 if(!await page.locator('#submit').isEnabled())throw Error('Reapproved schema should pass');
 await snap(page,'09-reapproved-three-fields');return {invalidated:true,reapproved:true};
 }finally{await ctx.close();}
});
await run('no-schema-creations-skip-only-the-creation-confirmation',async()=>{
 const ctx=await context();try{const page=await pageFor(ctx);await choose(page);await page.locator('#tableFilter').selectOption('all');
 for(const id of ['pay','settle','term','days'])await page.locator('#map_'+id).selectOption('__IGNORE__');
 if(await page.locator('#createCount').textContent()!=='0')throw Error('Unexpected creation proposal remaining');
 await page.locator('#prepare').click();
 if(!await page.locator('#precheck').isVisible()||await page.locator('#confirm').isVisible())throw Error('Unneeded creation confirmation');
 if(!await page.locator('#submit').isEnabled())throw Error('Precheck must still be explicitly passed');
 return {noCreateApprovalNeeded:true,finalImportStillRequiresButton:true};
 }finally{await ctx.close();}
});
await run('session-refresh-preserves-field-intent-and-invalidates-dryrun',async()=>{
 const ctx=await context();try{const page=await pageFor(ctx);await choose(page);
 await page.locator('#prepare').click();await page.locator('#schemaConfirm').click();
 await page.locator('#checkBack').click();await page.reload({waitUntil:'load'});
 await page.locator('#bankToggle').click();
 if(await page.locator('#bank').inputValue()!=='BANK_SETTLEMENT')throw Error('Bank choice not recovered');
 await page.locator('#typeToggle').click();
 if(await page.locator('#type_2').inputValue()!=='PERSON')throw Error('Row correction not recovered');
 await page.locator('#metaToggle').click();
 if(await page.locator('#map_systemCode').inputValue()!=='__IGNORE__')throw Error('Explicit ignore not recovered');
 await page.locator('#prepare').click();
 if(!await page.locator('#precheck').isVisible()||!await page.locator('#submit').isEnabled())throw Error('Same approved creation plan was not reused');
 await page.locator('#checkBack').click();if(!await page.locator('#bankBody').isVisible())await page.locator('#bankToggle').click();await page.locator('#bank').selectOption('BANK_ARCHIVE');
 await page.locator('#prepare').click();
 if(!await page.locator('#precheck').isVisible()||!await page.locator('#submit').isEnabled())throw Error('Edited bank mapping not rechecked');
 return {draftRecovered:true,dryrunRechecked:true};
 }finally{await ctx.close();}
});
await run('core-column-rule-blocks-invalid-mapping',async()=>{
 const ctx=await context();try{const page=await pageFor(ctx);await choose(page);await page.locator('#tableFilter').selectOption('all');
 await page.locator('#map_code').selectOption('__IGNORE__');
 await page.locator('#prepare').click();
 if(!await page.locator('#precheck').isVisible()||await page.locator('#submit').isEnabled())throw Error('Core source field incorrectly accepted');
 if(!await page.locator('#blockers').innerText().then(s=>s.includes('编码或名称')))throw Error('Missing meaningful core error');
 return {criticalFieldFailClosed:true};
 }finally{await ctx.close();}
});
await run('phone-reflow-and-visible-touch-targets',async()=>{
 const ctx=await context({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:2});try{const page=await pageFor(ctx);
 await snap(page,'10-mobile-overview');
 const dom=await page.evaluate(()=>({pageWidth:document.documentElement.scrollWidth,viewWidth:innerWidth,buttons:[...document.querySelectorAll('button')].filter(x=>getComputedStyle(x).display!=='none'&&!x.closest('[hidden]')).map(x=>({id:x.id,h:Math.round(x.getBoundingClientRect().height)}))}));
 if(dom.pageWidth>dom.viewWidth+2)throw Error('Mobile page overflow: '+JSON.stringify(dom));
 if(dom.buttons.some(b=>b.h<36))throw Error('Touch buttons too small: '+JSON.stringify(dom.buttons));
 await page.locator('#typeToggle').click();await snap(page,'11-mobile-record-fix');
 return dom;
 }finally{await ctx.close();}
});
await run('keyboard-and-two-hundred-percent-zoom',async()=>{
 const ctx=await context();try{const page=await pageFor(ctx);await page.locator('#bankToggle').focus();await page.keyboard.press('Enter');
 if(!await page.locator('#bankBody').isVisible())throw Error('Cannot open disclosure by keyboard');
 const focus=await page.locator('#bankToggle').evaluate(el=>getComputedStyle(el).outlineWidth);
 if(focus==='0px')throw Error('Keyboard focus not visible');
 await page.evaluate(()=>document.body.style.zoom='200%');
 const lay=await page.evaluate(()=>({width:document.documentElement.scrollWidth,viewport:innerWidth}));
 if(lay.width>lay.viewport+2)throw Error('Zoom produced document overflow');
 await snap(page,'12-desktop-200-percent');return lay;
 }finally{await ctx.close();}
});
await browser.close();
fs.writeFileSync(path.join(output,'report.json'),JSON.stringify({label:'High-fidelity UX prototype; synthetic fixture, not production',sha:process.env.GITHUB_SHA||'local',checks,errors,unverified:['real original 22-column workbook','actual counterparty identity','Host authorization and persisted drafts','actual Owner field creation','real dry-run and import commit','manual Human visual approval','screen-reader support','Railway deployment']},null,2));
console.log('BEX_V2_BROWSER_SUMMARY='+JSON.stringify({passed:checks.filter(x=>x.status==='PASS').length,failed:checks.filter(x=>x.status==='FAIL').length,errors}));
if(checks.some(x=>x.status==='FAIL')||errors.length)process.exitCode=1;
