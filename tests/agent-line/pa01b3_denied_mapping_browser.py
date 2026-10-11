#!/usr/bin/env python3
"""PA-01B3 negative browser: explicit AI DENY must prevent mapping changes."""
import base64,json,time
from pathlib import Path
from datetime import datetime,timezone
from urllib.parse import quote
from playwright.sync_api import sync_playwright,expect

OUT=Path('artifacts/agent-pa01b2-full-browser')
fx=json.loads((OUT/'fixture.json').read_text())
HOST=fx['hostUrl'];MOCK=fx['mockUrl'];CTX=fx['contextId']
assert HOST.startswith('http://127.0.0.1:') and MOCK.startswith('http://127.0.0.1:')
report={'level':'ISOLATED_DENY_BY_DEFAULT_BROWSER','realExternalLlm':False,'productionUsed':False,'status':'FAILED'}
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True)
 context=browser.new_context(viewport={'width':1280,'height':800})
 context.add_init_script("(()=>{if(location.origin==='http://127.0.0.1:41237')"
  +"{localStorage.setItem('evo.context.id',"+json.dumps(CTX)+");localStorage.setItem('evo.locale','en');}})();")
 api=context.request
 headers={'content-type':'application/json','x-evo-context-id':CTX}
 def command(name,values):
  return {'contractVersion':'0.1.0','type':'command','command':{'code':name,'inputVersion':'0.1.0'},
   'values':values,'sourceInteractionId':'pa01b3-negative','actionId':name,'requiresConfirmation':False}
 def execute(name,values):
  r=api.post(HOST+'/v1/actions',headers=headers,data=command(name,values))
  assert r.status==200,(name,r.status,r.text()[:500])
  body=r.json();assert body.get('ok') is True,(name,body)
  return body['result']
 csv='往来编码,往来名称,主体类型\nDENY0001,Unauthorized mapping attempt,ORGANIZATION'
 b=csv.encode('utf8')
 staged=execute('data-import.stage-file',{'targetId':'counterparty.subject',
   'file':{'name':'permission-denied.csv','mediaType':'text/csv','size':len(b),'contentBase64':base64.b64encode(b).decode()},
   'parameter__relationshipMode':'SUPPLIER'})
 job=staged['job']['importJobId']
 before=execute('data-import.get',{'importJobId':job})['job']
 control=api.post(MOCK+'/__control',data={'mode':'apply','importJobId':job})
 assert control.ok,control.text()
 page=context.new_page()
 thread=[]
 page.on('response',lambda resp: thread.append(resp.json()) if '/v1/actions' in resp.url
  and resp.request.method=='POST' and isinstance(resp.request.post_data_json,dict)
  and resp.request.post_data_json.get('command',{}).get('code','')=='enterprise-agent.thread.send'
  else None)
 path='/data-import/jobs/'+quote(job,safe='')+'/map'
 page.goto(HOST+'/?surface=desktop#'+path,wait_until='domcontentloaded')
 expect(page.locator('[data-eidos-agent-action="ai-auto-map"]')).to_be_visible(timeout=30000)
 page.locator('[data-eidos-agent-action="ai-auto-map"]').click()
 # The model fixture may return an HTTP 422 when no authorized write tool appears,
 # or an authorized catalog check may refuse the attempted operation.
 deadline=time.monotonic()+25
 while time.monotonic()<deadline:
  current=execute('data-import.get',{'importJobId':job})['job']
  if thread or not page.locator('[data-eidos-agent-action="ai-auto-map"]').is_disabled():
   break
  page.wait_for_timeout(100)
 page.wait_for_timeout(350)
 after=execute('data-import.get',{'importJobId':job})['job']
 assert after['mappingOrigin']==before['mappingOrigin'],(before,after)
 assert after['state']==before['state'],(before,after)
 assert after['mapping']==before['mapping'],(before,after)
 receipts=[]
 for resp in thread:
  x=resp.get('result',{})
  receipts.extend((x.get('assistanceResult') or {}).get('actionReceiptIds',[]))
 # A DENIED ActionReceipt is valid auditable evidence. No mutation is the invariant.
 assert after['mappingOrigin']!='AGENT','DENIED_AI_CHANGED_MAPPING'
 mock=api.get(MOCK+'/__requests').json()
 assert any(x['mode']=='apply' for x in mock['requests']),mock
 report.update({'status':'PASS','jobId':job,'beforeState':before['state'],'afterState':after['state'],
   'mappingOrigin':after['mappingOrigin'],'associatedReceiptIds':receipts,'mockModelCalls':len(mock['requests']),
   'threadResponseObserved':bool(thread),'test':'explicit AI DENY overrides default operation allowance; no business effect'})
 page.screenshot(path=str(OUT/'pa01b3-no-ai-write-grant.png'),full_page=True)
 browser.close()
report['completedAtUtc']=datetime.now(timezone.utc).isoformat()
(OUT/'pa01b3-denied-mapping-report.json').write_text(json.dumps(report,indent=2,ensure_ascii=False))
print('PA01B3_NEGATIVE_AUTHORIZATION='+json.dumps(report,ensure_ascii=False),flush=True)
assert report['status']=='PASS'
