#!/usr/bin/env python3
"""PA-02 R09: real Chromium Workbench + real App Host HTTP + PostgreSQL Run.
No production credential, no production WRITE, no simulated browser transport.
The READ-only stage is not the final material Owner WRITE R04/R07/R08 signoff.
"""
import json, time
from pathlib import Path
from datetime import datetime, timezone
from playwright.sync_api import sync_playwright, expect

OUT=Path('artifacts/agent-pa02-chromium-read')
fixture=json.loads((OUT/'fixture.json').read_text())
HOST,MOCK,CTX=fixture['hostUrl'],fixture['mockUrl'],fixture['contextId']
assert all(v.startswith('http://127.0.0.1:') for v in (HOST,MOCK))
assert fixture['pa02Run']=='POSTGRES_FENCED_READ_ONLY'
observed=[];checks=[]
with sync_playwright() as playwright:
 browser=playwright.chromium.launch(headless=True)
 browser_context=browser.new_context(viewport={'width':1360,'height':860},locale='en-US')
 browser_context.add_init_script(
  "(() => {if (location.origin === "+json.dumps(HOST)+") {"
  +"localStorage.setItem('evo.context.id',"+json.dumps(CTX)+");"
  +"localStorage.setItem('evo.locale','en');}})();"
 )
 api=browser_context.request
 headers={'x-evo-context-id':CTX,'content-type':'application/json'}
 def action(code,values,source='pa02-chromium',aid=None):
  return {'contractVersion':'0.1.0','type':'command',
   'command':{'code':code,'inputVersion':'0.1.0'},'values':values,
   'sourceInteractionId':source,'actionId':aid or code,'requiresConfirmation':False}
 def exec_action(code,values,headers_override=None):
  res=api.post(HOST+'/v1/actions',headers=headers_override or headers,data=action(code,values))
  assert res.status==200,(res.status,res.text()[:900])
  return res.json()
 def model_calls():
  r=api.get(MOCK+'/__requests');assert r.ok,r.text()
  return r.json()['requests']
 def wait_until(check,message,timeout=60):
  start=time.monotonic()
  while time.monotonic()-start<timeout:
   if check():return
   page.wait_for_timeout(100)
  raise AssertionError(message+'; observed='+repr(observed[-5:]))
 def observer(resp):
  try:
   if not resp.url.startswith(HOST+'/v1/actions') or resp.request.method!='POST':return
   raw=resp.request.post_data_json
   if not isinstance(raw,dict):return
   code=raw.get('command',{}).get('code','')
   if not code.startswith('enterprise-agent.'):return
   result=resp.json()
   observed.append({'code':code,'clientTurnId':raw.get('values',{}).get('clientTurnId'),
    'ok':result.get('ok'),'result':result,'status':resp.status})
  except Exception as e:
   observed.append({'kind':'observer-error','error':repr(e)})
 def run(name,fn):
  try:
   o=fn();checks.append({'name':name,'status':'PASS','evidence':o})
   print('PA02_CHROMIUM_PASS:'+name,flush=True)
  except Exception as e:
   checks.append({'name':name,'status':'FAIL','error':repr(e)})
   print('PA02_CHROMIUM_FAIL:'+name+':'+repr(e),flush=True)
 page=browser_context.new_page()
 page.on('response',observer)
 page.goto(HOST+'/?surface=desktop#/enterprise-agent',wait_until='domcontentloaded')
 composer=page.locator('[data-eidos-workspace-content] [data-eidos-chat-composer] textarea').first
 expect(composer).to_be_visible(timeout=30000)
 before=len(model_calls())
 composer.fill('PA02 durable Browser fixture single inference; no business WRITE')
 composer.press('Enter')
 def get_send():
  return next((x for x in observed if x.get('code')=='enterprise-agent.thread.send'
    and x.get('ok')),None)
 wait_until(lambda: get_send() is not None,'HOST_PG_THREAD_SEND_NO_RESPONSE')
 send=get_send()['result']['result']
 run_id=send['run']['runId']
 assert run_id.startswith('agent-run:'),send
 assert send['run']['state']=='SUCCEEDED',send['run']
 assert send['run']['modelUsages'][0]['status']=='REPORTED',send['run']
 assert len(model_calls())==before+1,'MODEL_INFERENCE_NOT_EXACTLY_ONE'
 def browser_start():
  assert page.locator('[data-eidos-workspace-content]').count()>=1
  page.screenshot(path=str(OUT/'pa02-browser-workbench.png'),full_page=True)
  return {'runId':run_id,'state':send['run']['state'],
   'modelUsage':send['run']['modelUsages'][0]['usage'],
   'modelCalls':len(model_calls())-before}
 run('real-workbench-thread-send-pg-run-usage',browser_start)
 def events_and_duplicate():
  a=exec_action('enterprise-agent.run.events',{'runId':run_id,'limit':100})
  assert a['ok'],a
  r=a['result'];ev=r['events']
  assert r['run']['runId']==run_id and r['run']['state']=='SUCCEEDED',r
  assert ev and [x['ordinal'] for x in ev]==list(range(len(ev))),ev
  assert any(x['event']['type']=='MODEL_USAGE_RECORDED' for x in ev),ev
  c=exec_action('enterprise-agent.run.events',{'runId':run_id,'limit':100})
  assert c['ok'] and [x['eventId'] for x in c['result']['events']]==[x['eventId'] for x in ev]
  assert len(model_calls())==before+1,'OUTBOX_DUPLICATE_REISSUED_MODEL'
  return {'eventCount':len(ev),'ordinalsVerified':True,
   'actualUsageEvent':True,'sameRun':True,'duplicateReadNoInference':True}
 run('real-http-pg-outbox-cursor-and-duplicate',events_and_duplicate)
 def gap_snapshot():
  gap=exec_action('enterprise-agent.run.events',{'runId':run_id,
   'afterEventId':'nonexistent-event-id','limit':5})
  assert gap['ok'],gap
  r=gap['result'];assert r['resetRequired'] is True,r
  assert r['run']['state']=='SUCCEEDED' and r['run']['runId']==run_id,r
  assert len(model_calls())==before+1,'GAP_RESET_REISSUED_MODEL'
  return {'resetRequired':r['resetRequired'],'authoritativeTerminalSnapshot':True}
 run('real-http-pg-gap-reset-terminal-state',gap_snapshot)
 def browser_reload():
  sent_before=sum(x.get('code')=='enterprise-agent.thread.send' for x in observed)
  page.reload(wait_until='domcontentloaded')
  expect(composer).to_be_visible(timeout=30000)
  wait_until(lambda:any(x.get('code')=='enterprise-agent.thread.list'
    for x in observed),'WORKBENCH_MISSING_THREAD_RECOVERY')
  page.wait_for_timeout(600)
  assert len(model_calls())==before+1,'BROWSER_RELOAD_REISSUED_INFERENCE'
  assert sum(x.get('code')=='enterprise-agent.thread.send'
    for x in observed)==sent_before,'BROWSER_RELOAD_REPOSTED_HUMAN_TURN'
  page.screenshot(path=str(OUT/'pa02-browser-reloaded.png'),full_page=True)
  return {'restoredBrowser':True,'modelCallCountStable':True,
   'duplicateThreadSend':False}
 run('real-chromium-refresh-same-thread-without-resend',browser_reload)
 def other_scope():
  wrong={'x-evo-context-id':'personal:PA02-FOREIGN-CONTEXT',
    'content-type':'application/json'}
  answer=exec_action('enterprise-agent.run.events',{'runId':run_id,'limit':10},
    headers_override=wrong)
  assert not answer['ok'],answer
  assert len(model_calls())==before+1
  return {'crossContextDenied':True,'errorCode':answer.get('error',{}).get('code')}
 run('real-http-foreign-context-fails-closed',other_scope)
 browser_version=browser.version
 browser.close()
report={'dateUtc':datetime.now(timezone.utc).isoformat(),
 'browser':'Chromium '+browser_version,
 'sourceHead':fixture['sourceHead'],'realAppHost':True,
 'realHttpPostgreSQL':True,'realEidosWorkbench':True,
 'provider':'LOOPBACK_RESPONSES_NO_VENDOR_CHARGE',
 'productionUsed':False,'businessWritesDispatched':False,
 'passed':sum(x['status']=='PASS' for x in checks),
 'total':len(checks),'checks':checks,
 'observedActions':[{'code':x.get('code'),'ok':x.get('ok')}
   for x in observed if x.get('code')]}
(OUT/'r09-http-browser-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
print('PA02_REAL_CHROMIUM_R09='+json.dumps({'passed':report['passed'],
 'total':report['total'],'runId':run_id,
 'realHTTP':True,'realPG':True,'productionUsed':False}),flush=True)
assert report['passed']==report['total'],'PA02 Chromium proof did not pass all cases'
