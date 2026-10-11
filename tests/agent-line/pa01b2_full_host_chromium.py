#!/usr/bin/env python3
"""Actual isolated App Host + Workbench + thread/Run browser gates (not true LLM mapping)."""
import base64, json, time
from pathlib import Path
from urllib.parse import quote
from datetime import datetime, timezone
from playwright.sync_api import sync_playwright, expect

OUT=Path('artifacts/agent-pa01b2-full-browser')
fixture=json.loads((OUT/'fixture.json').read_text())
HOST=fixture['hostUrl']; MOCK=fixture['mockUrl']; CTX=fixture['contextId']
assert HOST.startswith('http://127.0.0.1:') and MOCK.startswith('http://127.0.0.1:')
checks=[];events=[]
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True)
 context=browser.new_context(viewport={'width':1280,'height':850},locale='en-US')
 context.add_init_script("(() => {if(location.origin === 'http://127.0.0.1:41237') {"
  +"localStorage.setItem('evo.context.id',"+json.dumps(CTX)+");"
  +"localStorage.setItem('evo.locale','en');}})();")
 api=context.request
 headers={'x-evo-context-id':CTX,'content-type':'application/json'}
 def control(mode):
  x=api.post(MOCK+'/__control',data={'mode':mode});assert x.ok,x.text();return x.json()
 def requests():return api.get(MOCK+'/__requests').json()
 def action(code,values):
  return {'contractVersion':'0.1.0','type':'command','command':{'code':code,'inputVersion':'0.1.0'},
    'values':values,'sourceInteractionId':'pa01b2-isolated-chromium','actionId':code,'requiresConfirmation':False}
 def execute(code,values):
  x=api.post(HOST+'/v1/actions',headers=headers,data=action(code,values))
  assert x.status==200,(x.status,x.text()[:1200])
  payload=x.json();assert payload.get('ok') is True,payload
  return payload['result']
 def stage(tag):
  csv='往来编码,往来名称,主体类型,备注\nFIVE'+tag+',Isolated Supplier '+tag+',ORGANIZATION,source note'
  data=csv.encode()
  return execute('data-import.stage-file',{'targetId':'counterparty.subject',
   'file':{'name':'fixture-'+tag+'.csv','mediaType':'text/csv','size':len(data),
    'contentBase64':base64.b64encode(data).decode()},'parameter__relationshipMode':'SUPPLIER'})
 def observe(response):
  try:
   if '/v1/experience-pages' in response.url:
    events.append({'kind':'page','url':response.url,'code':response.status,'at':time.time()})
   if '/v1/actions' in response.url and response.request.method=='POST':
    a=response.request.post_data_json
    if isinstance(a,dict) and a.get('command',{}).get('code','').startswith('enterprise-agent.thread'):
     values=a.get('values',{})
     events.append({'kind':'thread','code':a['command']['code'],'assistanceRequest':values.get('assistanceRequest'),
      'clientTurnId':values.get('clientTurnId'),'status':response.status,'at':time.time()})
  except Exception as e: events.append({'kind':'log-error','error':repr(e)})
 def observe_request(request):
  try:
   if '/v1/actions' not in request.url or request.method!='POST':return
   payload=request.post_data_json
   if not isinstance(payload,dict):return
   code=payload.get('command',{}).get('code','')
   if not code.startswith('enterprise-agent.thread'):return
   values=payload.get('values',{})
   events.append({'kind':'thread-request','code':code,
     'assistanceRequest':values.get('assistanceRequest'),
     'clientTurnId':values.get('clientTurnId'),'at':time.time()})
  except Exception as e:events.append({'kind':'request-log-error','error':repr(e)})
 def new_page(job):
  page=context.new_page()
  page.on('response',observe)
  page.on('request',observe_request)
  page.goto(HOST+'/?surface=desktop#/data-import/jobs/'+quote(job,safe='')+'/map',wait_until='domcontentloaded')
  expect(page.locator('[data-eidos-agent-action="ai-auto-map"]')).to_be_visible(timeout=30000)
  return page
 def page_reads(job):
  return sum(x['kind']=='page' and '/data-import/jobs/'+job+'/map' in x.get('url','') for x in events)
 def wait_until(condition,message,timeout=35):
  start=time.monotonic()
  while time.monotonic()-start<timeout:
   if condition():return
   # Pump Playwright's protocol event loop; time.sleep delays response callbacks.
   context.pages[-1].wait_for_timeout(100)
  raise AssertionError(message)
 def wait_response(old):
  wait_until(lambda:len(requests()['requests'])>old,'MOCK_MODEL_CALL_NOT_SEEN')
 def wait_thread(mark):
  wait_until(lambda:any(e.get('kind')=='thread-request' and e.get('code')=='enterprise-agent.thread.send' for e in events[mark:]),
   'REAL_THREAD_SEND_NOT_SEEN')
 def run(name,fn):
  try:
   observation=fn();checks.append({'case':name,'status':'PASS','observed':observation})
   print('PA01B2_FULL_BROWSER_PASS:'+name,flush=True)
  except Exception as e:
   checks.append({'case':name,'status':'FAIL','error':repr(e)})
   print('PA01B2_FULL_BROWSER_FAIL:'+name+':'+repr(e)+' RECENT='+repr(events[-8:]),flush=True)
 def bootstrap():
  page=new_page(fixture['jobId'])
  try:
   count=page.locator('[data-eidos-workspace-content] select').count()
   assert count>=2,count
   return {'realPage':True,'nativeSelects':count,'url':page.url}
  finally:page.close()
 run('real-import-workbench-mount',bootstrap)
 def clean():
  control('success');job=fixture['jobId'];page=new_page(job)
  try:
   before=page_reads(job);old=len(requests()['requests']);mark=len(events)
   page.locator('[data-eidos-agent-action="ai-auto-map"]').click()
   wait_response(old);wait_thread(mark)
   wait_until(lambda:page_reads(job)>before,'CLEAN_SOURCE_DID_NOT_REFRESH')
   sends=[x for x in events[mark:] if x.get('kind')=='thread-request' and x.get('code')=='enterprise-agent.thread.send']
   assert sends and sends[0]['assistanceRequest']['context']['importJobId']==job,sends
   assert sends[0]['assistanceRequest']['taskKind']=='data-import.mapping'
   return {'refreshReads':page_reads(job)-before,'correlatedJob':job,'threadSent':True}
  finally:page.close()
 run('clean-success-real-thread-run-refresh',clean)
 def existing():
  control('success');job=stage('EXIST')['job']['importJobId'];page=new_page(job)
  try:
   field=page.locator('[data-eidos-workspace-content] select[name="map_0"]')
   original=field.input_value();changed='__IGNORE__' if original!='__IGNORE__' else 'code'
   field.select_option(changed)
   before=page_reads(job);old=len(requests()['requests']);mark=len(events)
   page.locator('[data-eidos-agent-action="ai-auto-map"]').click()
   wait_response(old);wait_thread(mark)
   expect(page.locator('[data-eidos-status-bar]')).to_contain_text('unsaved',timeout=30000)
   assert field.input_value()==changed
   assert page_reads(job)==before
   page.screenshot(path=str(OUT/'real-existing-draft.png'),full_page=True)
   return {'sourceDraft':changed,'refreshDelta':0}
  finally:page.close()
 run('real-existing-form-edit-preserved',existing)
 def inflight():
  job=stage('WAIT')['job']['importJobId'];page=new_page(job)
  try:
   control('hold');old=len(requests()['requests'])
   before=page_reads(job);mark=len(events)
   page.locator('[data-eidos-agent-action="ai-auto-map"]').click()
   wait_response(old)
   wait_until(lambda:requests()['holding']>=1,'MOCK_NOT_HOLDING')
   field=page.locator('[data-eidos-workspace-content] select[name="map_0"]')
   new='__IGNORE__' if field.input_value()!='__IGNORE__' else 'code'
   field.select_option(new)
   control('release');control('success')
   wait_thread(mark)
   expect(page.locator('[data-eidos-status-bar]')).to_contain_text('unsaved',timeout=30000)
   assert field.input_value()==new
   assert page_reads(job)==before
   return {'editDuringModelHold':True,'refreshDelta':0}
  finally:control('release');page.close()
 run('real-inflight-edit-preserved',inflight)
 def remount():
  job=stage('RETURN')['job']['importJobId'];page=new_page(job)
  try:
   control('hold');old=len(requests()['requests'])
   page.locator('[data-eidos-agent-action="ai-auto-map"]').click()
   wait_response(old)
   page.evaluate("location.hash='/data-import'")
   expect(page.locator('[data-eidos-agent-action="ai-auto-map"]')).to_have_count(0,timeout=15000)
   page.evaluate("(r)=>location.hash=r",'/data-import/jobs/'+quote(job,safe='')+'/map')
   expect(page.locator('[data-eidos-agent-action="ai-auto-map"]')).to_be_visible(timeout=15000)
   before=page_reads(job)
   control('release');control('success');time.sleep(2)
   assert page_reads(job)==before
   return {'sameRouteRemounted':True,'staleRefreshDelta':0}
  finally:control('release');page.close()
 run('real-leave-return-same-path-ignored',remount)
 def failure():
  job=stage('FAIL')['job']['importJobId'];page=new_page(job)
  try:
   control('fail');old=len(requests()['requests']);before=page_reads(job)
   page.locator('[data-eidos-agent-action="ai-auto-map"]').click()
   wait_response(old)
   expect(page.locator('[data-eidos-agent-action="ai-auto-map"]')).to_be_enabled(timeout=30000)
   page.wait_for_timeout(500)
   assert page_reads(job)==before
   return {'provider503':True,'refreshDelta':0,'actionRestored':True}
  finally:control('success');page.close()
 run('real-provider-failure-no-refresh',failure)
 def ordinary():
  control('success');page=context.new_page();page.on('response',observe);page.on('request',observe_request)
  try:
   page.goto(HOST+'/?surface=desktop#/enterprise-agent',wait_until='domcontentloaded')
   composer=page.locator('[data-eidos-workspace-content] [data-eidos-chat-composer] textarea').first
   expect(composer).to_be_visible(timeout=30000)
   old=len(requests()['requests']);mark=len(events)
   composer.fill('Fixture ordinary conversation without task context')
   composer.press('Enter')
   wait_response(old);wait_thread(mark)
   sent=[x for x in events[mark:] if x.get('kind')=='thread-request' and x.get('code')=='enterprise-agent.thread.send']
   assert sent and sent[0]['assistanceRequest'] is None,sent
   return {'realThreadSend':True,'assistanceRequest':False}
  finally:page.close()
 run('ordinary-chat-real-transport-compatible',ordinary)
 def recipe():
  first=stage('RECIPE1');job=first['job']['importJobId']
  reviewed=execute('data-import.review',{'importJobId':job,'map_0':'code','map_1':'displayName',
   'map_2':'subjectType','map_3':'__IGNORE__'})
  assert reviewed['job']['state']=='DRY_RUN_READY',reviewed
  committed=execute('data-import.commit',{'importJobId':job})
  assert committed['job']['state']=='COMMITTED',committed
  second=stage('RECIPE2')
  assert second.get('mappingOrigin')=='RECIPE',second
  assert second['job']['state']=='DRY_RUN_READY',second
  assert '/review' in second['navigateTo'],second
  return {'firstCommittedJob':job,'secondRecipe':second.get('appliedRecipeId'),'secondState':'DRY_RUN_READY'}
 run('authorized-real-import-and-recipe-reuse',recipe)
 version=browser.version
 browser.close()
report={'dateUtc':datetime.now(timezone.utc).isoformat(),'browser':'Chromium '+version,'sourceHead':fixture['sourceHead'],
 'realAppHost':True,'realThreadAndRun':True,'realExternalModel':False,'productionUsed':False,
 'passed':sum(x['status']=='PASS' for x in checks),'total':len(checks),'results':checks,'transportEvidence':events}
(OUT/'full-browser-report.json').write_text(json.dumps(report,indent=2,ensure_ascii=False))
print('PA01B2_FULL_BROWSER_SUMMARY='+json.dumps({'passed':report['passed'],'total':report['total'],'browser':report['browser']}),flush=True)
assert report['passed']==report['total'],'Full Host browser proof failed: inspect workflow artifact'
