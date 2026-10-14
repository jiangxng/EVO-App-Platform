#!/usr/bin/env python3
"""Real PA-02 OWNER_SANDBOX Chromium/HTTP/PG Run + Owner WRITE evidence.
No production credentials or actual supplier calls. This does not claim
to prove the separate ACK-loss/cancel-while-dispatching race gate.
"""
import json, time
from pathlib import Path
from datetime import datetime,timezone
from playwright.sync_api import sync_playwright, expect

OUT=Path('artifacts/agent-pa02-owner-browser')
fixture=json.loads((OUT/'fixture.json').read_text())
HOST,MOCK,CTX=fixture['hostUrl'],fixture['mockUrl'],fixture['contextId']
assert fixture['runMode']=='OWNER_SANDBOX'
assert not fixture['productionUsed']
assert HOST.startswith('http://127.0.0.1:') and MOCK.startswith('http://127.0.0.1:')
checks=[];observed=[]
def case(name,callback):
 try:
  data=callback()
  checks.append({'name':name,'status':'PASS','evidence':data})
  print('PA02_OWNER_BROWSER_PASS:'+name,flush=True)
 except Exception as error:
  checks.append({'name':name,'status':'FAIL','error':repr(error)})
  print('PA02_OWNER_BROWSER_FAIL:'+name+':'+repr(error),flush=True)
def action(code,values):
 return {'contractVersion':'0.1.0','type':'command',
  'command':{'code':code,'inputVersion':'0.1.0'},
  'values':values,'sourceInteractionId':'pa02-owner-chromium',
  'actionId':code,'requiresConfirmation':False}
with sync_playwright() as pw:
 browser=pw.chromium.launch(headless=True)
 profile=browser.new_context(viewport={'width':1360,'height':860},locale='en-US')
 profile.add_init_script(
  "(() => {if (location.origin === "+json.dumps(HOST)+"){"+
  "localStorage.setItem('evo.context.id',"+json.dumps(CTX)+");"+
  "localStorage.setItem('evo.locale','en');}})();"
 )
 api=profile.request
 headers={'x-evo-context-id':CTX,'content-type':'application/json'}
 def execute(code,values):
  response=api.post(HOST+'/v1/actions',headers=headers,data=action(code,values))
  answer=response.json()
  assert response.status==200 and answer['ok'],(code,response.status,answer)
  return answer['result']
 def stats():
  response=api.get(MOCK+'/__report')
  assert response.ok,response.text()
  return response.json()
 def until(predicate,label,timeout=60):
  start=time.monotonic()
  while time.monotonic()-start<timeout:
   if predicate():return
   page.wait_for_timeout(100)
  raise AssertionError(label+'; observed='+repr(observed[-6:]))
 def capture(response):
  try:
   if not response.url.startswith(HOST+'/v1/actions') or response.request.method!='POST':return
   raw=response.request.post_data_json
   if not isinstance(raw,dict):return
   code=raw.get('command',{}).get('code','')
   if not code.startswith('enterprise-agent.'):return
   body=response.json()
   observed.append({'code':code,'request':raw,'body':body,'status':response.status})
  except Exception as e:
   observed.append({'observerError':repr(e)})
 page=profile.new_page()
 page.on('response',capture)
 page.goto(HOST+'/?surface=desktop#/enterprise-agent',wait_until='domcontentloaded')
 composer=page.locator('[data-eidos-workspace-content] [data-eidos-chat-composer] textarea').first
 expect(composer).to_be_visible(timeout=30000)
 composer.fill('Create the authorized disposable Object Extension and show its verified receipt.')
 composer.press('Enter')
 def get_send():
  return next((x for x in observed if x.get('code')=='enterprise-agent.thread.send'
   and x.get('body',{}).get('ok')),None)
 until(lambda:get_send() is not None,'NO_GOVERNED_OWNER_SEND')
 first=get_send()
 result=first['body']['result']
 run=result['run']
 run_id=run['runId']
 def real_effect():
  s=stats()
  assert run['state']=='SUCCEEDED',run
  assert len(run['actionReceiptIds'])==1,run
  assert len(s['definitions'])==len(s['evidence'])==len(s['receipts'])==1,s
  assert s['definitions'][0]['extension_id']==fixture['extensionId'],s
  assert s['evidence'][0]['receipt_id']==run['actionReceiptIds'][0],s
  assert s['receipts'][0]['status']=='SUCCEEDED',s
  assert s['mockCalls']==2,s
  assert len(run['modelUsages'])==2,run
  assert all(u['status']=='REPORTED' for u in run['modelUsages']),run
  page.screenshot(path=str(OUT/'pa02-owner-workbench.png'),full_page=True)
  return {'runId':run_id,'receiptId':run['actionReceiptIds'][0],
   'businessRows':1,'immutableOwnerEvidenceRows':1,
   'agentReceiptRows':1,'modelCalls':2}
 case('workbench-to-fenced-run-to-governed-sql-owner-once',real_effect)
 def duplicate_turn():
  original=first['request']
  response=api.post(HOST+'/v1/actions',headers=headers,data=original)
  answer=response.json()
  assert response.status==200 and answer['ok'],(response.status,answer)
  assert answer['result']['run']['runId']==run_id,answer
  assert answer['result']['run']['actionReceiptIds']==run['actionReceiptIds'],answer
  s=stats()
  assert len(s['definitions'])==len(s['evidence'])==len(s['receipts'])==1,s
  assert s['mockCalls']==2,s
  return {'sameRun':True,'exactSameReceipt':True,'noSecondOwnerWrite':True}
 case('duplicate-http-turn-never-reissues-owner-write',duplicate_turn)
 def events():
  a=execute('enterprise-agent.run.events',{'runId':run_id,'limit':100})
  b=execute('enterprise-agent.run.events',{'runId':run_id,'limit':100})
  assert a['run']['state']=='SUCCEEDED' and a['run']['runId']==run_id,a
  ids=[x['eventId'] for x in a['events']]
  assert ids and ids==[x['eventId'] for x in b['events']],(a,b)
  assert a['run']['actionReceiptIds']==run['actionReceiptIds'],a
  s=stats();assert len(s['evidence'])==1 and s['mockCalls']==2,s
  return {'eventCount':len(ids),'duplicateReadsIdentical':True,'receiptStillPresent':True}
 case('duplicate-durable-outbox-read-retains-one-owner-receipt',events)
 def cursor_gap():
  g=execute('enterprise-agent.run.events',{'runId':run_id,
   'afterEventId':'not-a-real-event','limit':5})
  assert g['resetRequired'] is True,g
  assert g['run']['state']=='SUCCEEDED',g
  assert g['run']['actionReceiptIds']==run['actionReceiptIds'],g
  s=stats();assert len(s['evidence'])==1 and s['mockCalls']==2,s
  return {'resetRequired':True,'sameTerminalReceipt':True,'noReplay':True}
 case('http-gap-resets-to-authoritative-owner-receipt',cursor_gap)
 def browser_reload():
  sends=sum(x.get('code')=='enterprise-agent.thread.send' for x in observed)
  page.reload(wait_until='domcontentloaded')
  expect(composer).to_be_visible(timeout=30000)
  page.wait_for_timeout(650)
  assert sum(x.get('code')=='enterprise-agent.thread.send' for x in observed)==sends
  s=stats();assert len(s['evidence'])==1 and s['mockCalls']==2,s
  page.screenshot(path=str(OUT/'pa02-owner-reloaded.png'),full_page=True)
  return {'browserRefresh':True,'noNewHumanTurn':True,'noOwnerReplay':True}
 case('chromium-refresh-same-owner-run-no-resend',browser_reload)
 def wrong_scope():
  foreign={'x-evo-context-id':'personal:foreign-pa02-owner',
   'content-type':'application/json'}
  response=api.post(HOST+'/v1/actions',headers=foreign,
   data=action('enterprise-agent.run.events',{'runId':run_id,'limit':10}))
  answer=response.json()
  assert response.status in (403,404) and not answer['ok'],(response.status,answer)
  s=stats();assert len(s['evidence'])==1 and s['mockCalls']==2,s
  return {'scopeDenied':True,'httpStatus':response.status}
 case('foreign-context-cannot-read-or-replay-owner-run',wrong_scope)
 def cancelled_before_future_owner_dispatch():
  control=api.post(MOCK+'/__control',data={'mode':'hold-owner-tool'})
  assert control.ok,control.text()
  composer.fill('Propose a second authorized extension; the Human will cancel before tool execution.')
  composer.press('Enter')
  try:
   until(lambda:stats()['holdingModel'] is True,'SECOND_MODEL_TOOL_NOT_HELD',timeout=25)
   pending=[t['run_id'] for t in stats()['turns'] if t['run_id']!=run_id]
   assert len(pending)==1,pending
   second_run_id=pending[0]
   cancellation=execute('enterprise-agent.run.cancel',{
    'runId':second_run_id,'reason':'Human cancelled before the future SQL write'})
   assert cancellation['run']['runId']==second_run_id,cancellation
   assert cancellation['cancellationState'] in ('REQUESTED','CANCELLED'),cancellation
  finally:
   api.post(MOCK+'/__control',data={'mode':'release'})
  # Cancellation can initially return REQUESTED while the old Worker owns
  # the lease. Follow the existing PA02C contract: after the held model is
  # released, retry the formal Host cancel action to reconcile to CANCELLED.
  final_cancel=None
  for attempt in range(24):
   recheck=action('enterprise-agent.run.cancel',{'runId':second_run_id,
    'reason':'Reconcile cancellation after model reply was released'})
   recheck['actionId']='pa02-owner-reconcile-'+str(attempt)
   result=api.post(HOST+'/v1/actions',headers=headers,data=recheck)
   value=result.json()
   assert result.status==200 and value['ok'],(result.status,value)
   final_cancel=value['result']
   if final_cancel['cancellationState']=='CANCELLED':break
   page.wait_for_timeout(250)
  assert final_cancel['cancellationState']=='CANCELLED',final_cancel
  after=execute('enterprise-agent.run.get',{'runId':second_run_id})
  assert after['run']['state']=='CANCELLED',after
  assert not after['run']['actionReceiptIds'],after
  page.wait_for_timeout(350)
  s=stats()
  assert len(s['definitions'])==len(s['evidence'])==len(s['receipts'])==1,s
  assert s['mockCalls']==3,s
  return {'secondRunId':second_run_id,'state':'CANCELLED',
   'futureOwnerDispatchRejected':True,'businessRowsRemainOne':True}
 case('browser-cancel-inference-before-future-owner-write',cancelled_before_future_owner_dispatch)
 def committed_owner_effect_survives_browser_disconnect_and_cancel():
  baseline=stats()
  assert len(baseline['evidence'])==1 and baseline['mockCalls']==3,baseline
  known_runs={t['run_id'] for t in baseline['turns']}
  control=api.post(MOCK+'/__control',data={'mode':'owner-commit-hold-final'})
  assert control.ok,control.text()
  composer.fill('Commit one further isolated owner extension; disconnect before the final assistant response.')
  composer.press('Enter')
  third_run=None
  try:
   def owner_committed_and_model_held():
    state=stats()
    return len(state['evidence'])==2 and len(state['definitions'])==2 and state['holdingModel']
   until(owner_committed_and_model_held,'OWNER_COMMIT_NOT_VISIBLE_BEFORE_DISCONNECT',timeout=35)
   now=stats()
   new_runs=[x['run_id'] for x in now['turns'] if x['run_id'] not in known_runs]
   assert len(new_runs)==1,new_runs
   third_run=new_runs[0]
   assert now['mockCalls']==5,now
   # The actual browser client disappears while an existing durable Owner
   # receipt has committed and the Host awaits final provider completion.
   page.reload(wait_until='domcontentloaded')
   expect(composer).to_be_visible(timeout=30000)
   after_reload=stats()
   assert len(after_reload['evidence'])==2 and after_reload['mockCalls']==5,after_reload
   first_cancel=execute('enterprise-agent.run.cancel',{
    'runId':third_run,'reason':'Human disconnected after Owner business commit'})
   assert first_cancel['cancellationState'] in ('REQUESTED','CANCELLED'),first_cancel
  finally:
   api.post(MOCK+'/__control',data={'mode':'release'})
  final_cancel=None
  for attempt in range(32):
   request=action('enterprise-agent.run.cancel',{
    'runId':third_run,'reason':'Verify committed effect after disconnected client'})
   request['actionId']='pa02-owner-committed-cancel-'+str(attempt)
   response=api.post(HOST+'/v1/actions',headers=headers,data=request)
   result=response.json()
   assert response.status==200 and result['ok'],(response.status,result)
   final_cancel=result['result']
   if final_cancel['cancellationState']=='CANCELLED':break
   page.wait_for_timeout(200)
  assert final_cancel['cancellationState']=='CANCELLED',final_cancel
  terminal=execute('enterprise-agent.run.get',{'runId':third_run})['run']
  assert terminal['state']=='CANCELLED' and len(terminal['actionReceiptIds'])==1,terminal
  snapshot=execute('enterprise-agent.run.events',{
   'runId':third_run,'afterEventId':'gap-after-commit','limit':5})
  assert snapshot['resetRequired'] is True,snapshot
  assert snapshot['run']['state']=='CANCELLED',snapshot
  assert snapshot['run']['actionReceiptIds']==terminal['actionReceiptIds'],snapshot
  stable=stats()
  assert len(stable['definitions'])==len(stable['evidence'])==len(stable['receipts'])==2,stable
  assert any(x['receipt_id']==terminal['actionReceiptIds'][0]
   for x in stable['evidence']),stable
  assert stable['mockCalls']==5,stable
  page.screenshot(path=str(OUT/'pa02-owner-committed-cancel-recovered.png'),full_page=True)
  return {'cancelledRun':third_run,'cancellation':'CANCELLED',
   'committedReceiptRetained':terminal['actionReceiptIds'][0],
   'uniqueOwnerRows':2,'ownerReplay':False,'browserReloadBeforeFinalResponse':True}
 case('committed-owner-effect-retained-after-browser-disconnect-cancel',committed_owner_effect_survives_browser_disconnect_and_cancel)
 version=browser.version
 browser.close()
report={'dateUtc':datetime.now(timezone.utc).isoformat(),
 'browser':'Chromium '+version,'sourceHead':fixture['sourceHead'],
 'runId':run_id,'productionUsed':False,'businessWritesDispatched':True,
 'modelProvider':'LOOPBACK_RESPONSES_NOT_REAL_VENDOR',
 'realHost':True,'realHttp':True,'realPostgres18Owner':True,
 'passed':sum(c['status']=='PASS' for c in checks),'total':len(checks),
 'checks':checks}
(OUT/'owner-http-browser-report.json').write_text(json.dumps(report,indent=2,ensure_ascii=False))
print('PA02_OWNER_REAL_BROWSER='+json.dumps({
 'passed':report['passed'],'total':report['total'],'runId':run_id,
 'sqlOwner':True,'productionUsed':False}),flush=True)
assert report['passed']==report['total'],'Owner browser acceptance not all PASS'
