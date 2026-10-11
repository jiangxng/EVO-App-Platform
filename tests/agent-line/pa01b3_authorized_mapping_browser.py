#!/usr/bin/env python3
"""PA-01B3: genuine Host capability WRITE & ActionReceipt via deterministic mock function-call.
Bounded isolated enterprise and model fixture; no external LLM and no production access.
"""
import base64,json,time
from datetime import datetime,timezone
from pathlib import Path
from urllib.parse import quote,unquote
from playwright.sync_api import sync_playwright,expect

OUT=Path('artifacts/agent-pa01b2-full-browser')
fixture=json.loads((OUT/'fixture.json').read_text())
host=fixture['hostUrl']; mock=fixture['mockUrl']; context_id=fixture['contextId']
assert host.startswith('http://127.0.0.1:') and mock.startswith('http://127.0.0.1:')
evidence={'source':'isolated-pa01b3','completedAtUtc':None,'browser':None,'positiveWrite':None,
 'realLlm':False,'productionAccess':False}
try:
 with sync_playwright() as p:
  browser=p.chromium.launch(headless=True)
  session=browser.new_context(viewport={'width':1360,'height':900})
  session.add_init_script("(()=>{if(location.origin==='http://127.0.0.1:41237'){"
   +"localStorage.setItem('evo.context.id',"+json.dumps(context_id)+");"
   +"localStorage.setItem('evo.locale','en');}})();")
  api=session.request
  headers={'content-type':'application/json','x-evo-context-id':context_id}
  def cmd(name,values):
   return {'contractVersion':'0.1.0','type':'command','command':{'code':name,'inputVersion':'0.1.0'},
    'values':values,'sourceInteractionId':'isolated-pa01b3-capability','actionId':name,'requiresConfirmation':False}
  def execute(name,values):
   r=api.post(host+'/v1/actions',headers=headers,data=cmd(name,values))
   assert r.status==200,(r.status,r.text()[:1500])
   result=r.json()
   assert result.get('ok') is True,result
   return result['result']
  def wait(condition,message,seconds=40):
   deadline=time.monotonic()+seconds
   while time.monotonic()<deadline:
    if condition():return
    page.wait_for_timeout(100)
   raise AssertionError(message)
  csv='往来编码,往来名称,主体类型,备注\nFIVEAI01,Controlled Agent Mapping,ORGANIZATION,raw source must remain'
  data=csv.encode('utf8')
  stage=execute('data-import.stage-file',{'targetId':'counterparty.subject',
   'file':{'name':'agent-write.csv','mediaType':'text/csv','size':len(data),'contentBase64':base64.b64encode(data).decode()},
   'parameter__relationshipMode':'SUPPLIER'})
  job_id=stage['job']['importJobId']
  assert stage['job']['mappingOrigin']!='AGENT',stage
  r=api.post(mock+'/__control',data={'mode':'apply','importJobId':job_id})
  assert r.ok,r.text()
  page=session.new_page()
  route='/data-import/jobs/'+quote(job_id,safe='')+'/map'
  page_loads=[]
  responses=[]
  page.on('response',lambda response: (
    page_loads.append(response.url) if '/v1/experience-pages' in response.url else None,
    responses.append(response) if '/v1/actions' in response.url and response.request.method=='POST'
     and isinstance(response.request.post_data_json,dict)
     and response.request.post_data_json.get('command',{}).get('code','').startswith('enterprise-agent.thread.') else None
  ))
  page.goto(host+'/?surface=desktop#'+route,wait_until='domcontentloaded')
  expect(page.locator('[data-eidos-agent-action="ai-auto-map"]')).to_be_visible(timeout=30000)
  initial=sum(route in unquote(url) for url in page_loads)
  page.locator('[data-eidos-agent-action="ai-auto-map"]').click()
  def current():
   try:return execute('data-import.get',{'importJobId':job_id})['job']
   except Exception:return {}
  wait(lambda:current().get('mappingOrigin')=='AGENT','AGENT_MAPPING_APPLY_NOT_OBSERVED')
  job=current()
  assert job['state']=='DRY_RUN_READY',job
  assert len(job['mapping'])==3,job['mapping']
  wait(lambda:sum(route in unquote(url) for url in page_loads)>initial,'AGENT_MAPPED_PAGE_NOT_REFRESHED')
  page.wait_for_timeout(300)
  refresh=sum(route in unquote(url) for url in page_loads)-initial
  assert refresh==1,'AGENT_MAPPING_REFRESH_NOT_EXACTLY_ONCE:'+str(refresh)
  receipts=[]
  for resp in responses:
   try:
    payload=resp.json()
    result=payload.get('result',{})
    assist=result.get('assistanceResult') or {}
    run=result.get('run') or {}
    if assist.get('requestId') and assist.get('runState')=='SUCCEEDED' and run.get('state')=='SUCCEEDED':
     receipts.extend(assist.get('actionReceiptIds',[]))
   except Exception:pass
  assert receipts,'ACTION_RECEIPT_IDS_MISSING_FROM_STRUCTURED_ASSISTANCE_RESULT'
  assert len(set(receipts))==len(receipts),'DUPLICATED_ACTION_RECEIPTS'
  page.screenshot(path=str(OUT/'real-agent-capability-mapping.png'),full_page=True)
  evidence['positiveWrite']={'jobId':job_id,'mappingOrigin':job['mappingOrigin'],
   'jobState':job['state'],'mappedColumns':[x['sourceColumn'] for x in job['mapping']],
   'browserSourceRefresh':refresh,'actionReceiptIds':receipts,'realHostCapabilityInvoke':True}
  evidence['browser']='Chromium '+browser.version
  browser.close()
  print('PA01B3_AUTHORIZED_REAL_CAPABILITY_WRITE_PASS='+json.dumps(evidence['positiveWrite']),flush=True)
except Exception as exc:
 evidence['error']=repr(exc)
 print('PA01B3_AUTHORIZED_REAL_CAPABILITY_WRITE_FAIL='+repr(exc),flush=True)
 raise
finally:
 evidence['completedAtUtc']=datetime.now(timezone.utc).isoformat()
 (OUT/'pa01b3-mapping-capability-report.json').write_text(json.dumps(evidence,indent=2,ensure_ascii=False))
