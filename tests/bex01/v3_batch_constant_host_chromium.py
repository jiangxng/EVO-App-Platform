#!/usr/bin/env python3
"""V3 real isolated Host: explicit, persisted subject-type batch constant.

All data is generated for the isolated local Host. Never a customer workbook,
Railway production session, or a Human visual signoff.
"""
import json
from pathlib import Path
from playwright.sync_api import sync_playwright,expect

OUT=Path("artifacts/bex01-browser")
fixture=json.loads((OUT/"fixture.json").read_text(encoding="utf8"))
HOST=fixture["hostUrl"];CTX=fixture["contextId"]
assert HOST.startswith("http://127.0.0.1:") and fixture["isolated"]
assert not fixture["productionUsed"]
SOURCE="往来编码,往来名称,批次核对专用字段\nBEX-CST-001,Constant Test Supplier A,Plan A\nBEX-CST-002,Constant Test Supplier B,Plan B"
# An explicit omission: there is NO source column for subjectType.
assert "主体类型" not in SOURCE
with sync_playwright() as p:
    api=p.request.new_context(base_url=HOST,extra_http_headers={
        "x-evo-context-id":CTX,"content-type":"application/json","accept":"application/json"
    })
    def command(code,values,confirmation=False):
        payload={"contractVersion":"0.1.0","type":"command",
          "command":{"code":code,"inputVersion":"0.1.0"},
          "actionId":code,"sourceInteractionId":"bex01-v3-constant-isolated",
          "requiresConfirmation":confirmation,"values":values}
        response=api.post("/v1/actions",data=json.dumps(payload,ensure_ascii=False))
        body=response.json()
        assert response.status==200 and body.get("ok"), (
          code,response.status,json.dumps(body,ensure_ascii=False)[:1600])
        return body["result"]

    result=command("data-import.stage-csv",{
      "targetId":"counterparty.subject",
      "targetParameters":{"relationshipMode":"SUPPLIER"},
      "name":"BEX-V3-batch-constant-synthetic.csv",
      "csv":SOURCE,
      "mapping":[
        {"sourceColumn":"往来编码","targetFieldId":"code"},
        {"sourceColumn":"往来名称","targetFieldId":"displayName"}
      ]
    })
    job=result["job"];job_id=job["importJobId"]
    assert len(job["source"]["headers"])==3
    assert len(job["source"]["rows"])==2
    assert not any(x["targetFieldId"]=="subjectType" for x in job["mapping"])
    original=job["source"]
    batch="/object-extensions/from-import?job="+job_id+"&mode=batch"

    browser=p.chromium.launch(headless=True)
    desktop=browser.new_context(viewport={"width":1280,"height":900},locale="zh-CN")
    desktop.add_init_script("""
      if(location.origin===%s){
        localStorage.setItem("evo.context.id",%s);
        localStorage.setItem("evo.locale","zh-CN");
      }
    """ % (json.dumps(HOST),json.dumps(CTX)))
    page=desktop.new_page()
    page.on("dialog",lambda dialog:dialog.accept())
    page.goto(HOST+"/?surface=desktop#"+batch,wait_until="domcontentloaded")
    form=page.locator('form[data-eidos-id="evo-object-extension.batch-import"]')
    expect(form).to_be_visible(timeout=30000)
    subject=form.locator('select[name="batchSubjectType"]')
    expect(subject).to_be_visible()
    expect(subject).to_have_value("__KEEP__")
    expect(subject.locator("option")).to_have_count(3)
    assert "应用于所有导入记录" in form.inner_text()
    expect(form.locator('[data-eidos-form-review-table-row]')).to_have_count(1)
    expect(form.locator('select[name="choice_0"]')).to_have_value("__CREATE__")
    subject.select_option("ORGANIZATION")
    page.screenshot(path=str(OUT/"v3-batch-constant-before-confirm-desktop.png"),full_page=True)
    # Target the governed approval action, not an independent draft-save action.
    approval=form.locator('button[data-eidos-action="create-extension-batch"]')
    expect(approval).to_have_count(1)
    approval.click()
    mapping=page.locator('form[data-eidos-id="evo-data-import.mapping"]')
    expect(mapping).to_be_visible(timeout=30000)
    saved=command("data-import.get",{"importJobId":job_id})["job"]
    constant=[x for x in saved["mapping"] if x["targetFieldId"]=="subjectType"]
    assert constant==[{"targetFieldId":"subjectType",
      "transform":{"kind":"CONSTANT","value":"ORGANIZATION"}}],constant
    assert saved["state"]=="STAGED",saved["state"]
    assert saved["source"]==original,"MUST_NOT_REWRITE_STAGED_CSV_SOURCE"
    assert saved.get("dryRun") is None
    # The user can directly reopen the saved batch review, with no hidden
    # dependence on browser localStorage for the semantic constant value.
    page.goto(HOST+"/?surface=desktop#"+batch,wait_until="domcontentloaded")
    reopen=page.locator('form[data-eidos-id="evo-object-extension.batch-import"]')
    expect(reopen).to_be_visible(timeout=30000)
    expect(reopen.locator('select[name="batchSubjectType"]')).to_have_value("ORGANIZATION")
    page.screenshot(path=str(OUT/"v3-batch-constant-restored-desktop.png"),full_page=True)
    desktop.close()

    mobile=browser.new_context(viewport={"width":390,"height":844},is_mobile=True,
      has_touch=True,locale="zh-CN")
    mobile.add_init_script("""
      if(location.origin===%s){
        localStorage.setItem("evo.context.id",%s);
        localStorage.setItem("evo.locale","zh-CN");
      }
    """ % (json.dumps(HOST),json.dumps(CTX)))
    phone=mobile.new_page()
    phone.goto(HOST+"/?surface=desktop#"+batch,wait_until="domcontentloaded")
    mobile_form=phone.locator('form[data-eidos-id="evo-object-extension.batch-import"]')
    expect(mobile_form).to_be_visible(timeout=30000)
    expect(mobile_form.locator('select[name="batchSubjectType"]')).to_have_value("ORGANIZATION")
    assert phone.evaluate("document.documentElement.scrollWidth<=innerWidth+2")
    phone.screenshot(path=str(OUT/"v3-batch-constant-restored-390px.png"),full_page=True)
    mobile.close()
    browser.close()
    (OUT/"v3-batch-constant-host-observation.json").write_text(
      json.dumps({"source":"synthetic isolated Host, NOT customer XLSX",
        "originalRows":len(original["rows"]),"constant":"ORGANIZATION",
        "jobState":"STAGED","originalSourcePreserved":True,
        "persistedAndRestored":True,"importCommitted":False,
        "desktopWidth":1280,"phoneWidth":390},ensure_ascii=False,indent=2),
      encoding="utf8")
    print("BEX01_V3_BATCH_CONSTANT_REAL_HOST_PERSIST_AND_RESTORE_PASS",flush=True)
