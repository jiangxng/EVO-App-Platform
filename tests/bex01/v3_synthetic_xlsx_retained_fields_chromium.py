#!/usr/bin/env python3
"""22 x 172 genuine Host XLSX with 18 retained business fields and one ignored metadata column.

The fixture is entirely synthetic, including every bank and enterprise attribute.
This is an isolated development test, NOT customer data, production authorization,
or human signoff. Runs after legacy Host/Chromium scenarios to avoid field conflicts.
"""
import base64
import hashlib
import json
import re
from pathlib import Path
from playwright.sync_api import sync_playwright, expect

OUT=Path("artifacts/bex01-browser")
fixture=json.loads((OUT/"fixture.json").read_text())
HOST=fixture["hostUrl"];CTX=fixture["contextId"]
assert HOST.startswith("http://127.0.0.1:")
assert fixture["isolated"] and not fixture["productionUsed"]
assert fixture["retainedCodePrefix"]=="RET-"
xlsx=(OUT/fixture["retainedXlsxArtifact"]).read_bytes()
assert xlsx[:4]==b"PK\x03\x04"
EXPECTED_BANK="ext_"+hashlib.sha256(
    "counterparty.subject|开户银行".encode("utf8")
).hexdigest()[:16]
FIELDS=["企业属性"+str(i) for i in range(1,18)]

with sync_playwright() as pw:
    api=pw.request.new_context(base_url=HOST,
      extra_http_headers={"x-evo-context-id":CTX,
                           "content-type":"application/json","accept":"application/json"})
    def command(code, values, confirm=False):
        payload={"contractVersion":"0.1.0","type":"command",
          "command":{"code":code,"inputVersion":"0.1.0"},
          "values":values,"sourceInteractionId":"bex01-retained-xlsx-isolated",
          "actionId":code,"requiresConfirmation":confirm}
        response=api.post("/v1/actions",data=json.dumps(payload,ensure_ascii=False))
        data=response.json()
        assert response.status==200 and data.get("ok"), (
          code,response.status,json.dumps(data,ensure_ascii=False)[:1700])
        return data["result"]

    staged=command("data-import.stage-file",{
      "targetId":"counterparty.subject",
      "file":{"name":"BEX-SYNTHETIC-RET-172.xlsx",
        "mediaType":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "size":len(xlsx),"contentBase64":base64.b64encode(xlsx).decode()},
      "parameter__relationshipMode":"SUPPLIER"})
    job=staged["job"]; jobid=job["importJobId"]
    assert job["source"]["kind"]=="XLSX"
    assert len(job["source"]["headers"])==22
    assert len(job["source"]["rows"])==172
    assert job["source"]["rows"][171]["企业属性17"]=="synthetic-20-0172"
    assert job["source"]["rows"][171]["往来编码"]=="RET-0172"
    # The existing field for 开户银行 must be REUSED by real fieldId,
    # not silently deleted, recreated or inferred from the duplicate-name legend.
    choice={"importJobId":jobid,"map_0":"code","map_1":"displayName",
       "map_2":"subjectType","map_3":EXPECTED_BANK,"map_21":"__IGNORE__"}
    for col in range(4,21):
        choice["map_"+str(col)]="__CREATE__"
    reviewed=command("data-import.review",choice)
    assert "mode=batch" in reviewed["navigateTo"],reviewed
    assert reviewed["job"]["state"]=="STAGED"
    assert reviewed["job"]["source"]["rows"]==job["source"]["rows"]
    assert reviewed["job"]["mapping"] and any(
      x.get("sourceColumn")=="开户银行" and x["targetFieldId"]==EXPECTED_BANK
      for x in reviewed["job"]["mapping"])
    assert reviewed["job"]["ignoredSourceColumns"]==["原系统备注"]
    print("BEX01_V3_XLSX_RETAINED_22_SOURCE_AND_BANK_REUSE_PASS",flush=True)

    browser=pw.chromium.launch(headless=True)
    context=browser.new_context(viewport={"width":1280,"height":900},locale="zh-CN")
    context.add_init_script("""
      if(location.origin===%s) {
        localStorage.setItem("evo.context.id",%s);
        localStorage.setItem("evo.locale","zh-CN");
      }
    """ % (json.dumps(HOST),json.dumps(CTX)))
    page=context.new_page()
    page.on("dialog",lambda dialog: dialog.accept())
    # Verify exactly the /map URL a Human actually opens. The former test
    # only visited the separate /object-extensions/...&mode=batch screen.
    mapping="/data-import/jobs/"+jobid+"/map"
    page.goto(HOST+"/?surface=desktop#"+mapping,wait_until="domcontentloaded")
    map_form=page.locator('form[data-eidos-id="evo-data-import.mapping"]')
    expect(map_form).to_be_visible(timeout=30000)
    map_groups=map_form.locator('[data-eidos-form-review-group]')
    expect(map_groups).to_have_count(22)
    expect(map_form.locator('[data-eidos-review-group-primary] select')).to_have_count(22)
    first_map=map_groups.first
    expect(first_map).to_contain_text("往来编码")
    expect(first_map.locator('select[name="map_0"]')).to_have_value("code")
    expect(map_groups.nth(4)).to_contain_text("synthetic-4-0001")
    expect(map_groups.nth(4).locator('select[name="map_4"]')).to_have_value("__CREATE__")
    map_groups.nth(4).locator('[data-eidos-review-group-detail] summary').click()
    expect(map_groups.nth(4).locator('input[name="sourceEvidence_4"]')).to_be_visible()
    expect(map_groups.nth(21).locator('select[name="map_21"]')).to_have_value("__IGNORE__")
    assert map_form.locator('[data-eidos-agent-action="ai-auto-map"]').count()==1
    entry=map_form.locator('[data-eidos-field-context-link]')
    expect(entry.first).to_be_visible()
    assert "B 方案" not in map_form.inner_text()
    page.screenshot(path=str(OUT/"v3-actual-map-22-rows-desktop.png"),full_page=True)
    print("BEX01_V3_ACTUAL_MAP_ROUTE_22_GROUPS_PASS:DESKTOP",flush=True)
    batch=reviewed["navigateTo"]
    page.goto(HOST+"/?surface=desktop#"+batch,wait_until="domcontentloaded")
    form=page.locator('form[data-eidos-id="evo-object-extension.batch-import"]')
    expect(form).to_be_visible(timeout=30000)
    expect(form.locator('[data-eidos-form-review-group]')).to_have_count(18)
    expect(form.locator('[data-eidos-review-group-primary] select')).to_have_count(18)
    # The Eidos framework renders a compact generic group. Business controls
    # remain the exact same 17 one-to-one source-column keys and Host actions.
    phone=browser.new_context(viewport={"width":390,"height":844},
        is_mobile=True,has_touch=True,locale="zh-CN")
    phone.add_init_script("""
      if(location.origin===%s){
        localStorage.setItem("evo.context.id",%s);
        localStorage.setItem("evo.locale","zh-CN");
      }
    """ % (json.dumps(HOST),json.dumps(CTX)))
    small=phone.new_page()
    small.goto(HOST+"/?surface=desktop#"+mapping,wait_until="domcontentloaded")
    mobile_map=small.locator('form[data-eidos-id="evo-data-import.mapping"]')
    expect(mobile_map).to_be_visible(timeout=30000)
    expect(mobile_map.locator('[data-eidos-form-review-group]')).to_have_count(22)
    mobile_map_group=mobile_map.locator('[data-eidos-form-review-group]').nth(4)
    expect(mobile_map_group.locator('select[name="map_4"]')).to_be_visible()
    mobile_map_group.locator('[data-eidos-review-group-detail] summary').click()
    expect(mobile_map_group.locator('input[name="sourceEvidence_4"]')).to_be_visible()
    assert small.evaluate("document.documentElement.scrollWidth <= innerWidth + 2")
    small.screenshot(path=str(OUT/"v3-actual-map-22-rows-phone.png"),full_page=True)
    print("BEX01_V3_ACTUAL_MAP_ROUTE_22_GROUPS_PASS:PHONE",flush=True)
    small.goto(HOST+"/?surface=desktop#"+batch,wait_until="domcontentloaded")
    mobile_form=small.locator('form[data-eidos-id="evo-object-extension.batch-import"]')
    expect(mobile_form).to_be_visible(timeout=30000)
    expect(mobile_form.locator('[data-eidos-form-review-group]')).to_have_count(18)
    expect(mobile_form.locator('[data-eidos-review-group-primary] select')).to_have_count(18)
    mobile_group=mobile_form.locator('[data-eidos-form-review-group]').first
    mobile_group.locator('[data-eidos-review-group-detail] summary').click()
    expect(mobile_group.locator('input[name="label_0"]')).to_be_visible()
    geometry=small.evaluate("""() => ({
      viewport:innerWidth,document:document.documentElement.scrollWidth
    })""")
    assert geometry["document"]<=geometry["viewport"]+2,geometry
    small.screenshot(path=str(OUT/"v3-eidos-grouped-batch-17-phone.png"),full_page=True)
    phone.close()
    print("BEX01_V3_EIDOS_GROUPED_18_PHONE_PASS",flush=True)
    for i,label in enumerate(FIELDS):
        expect(form.locator('select[name="choice_%d"]'%i)).to_have_value("__CREATE__")
        expect(form.locator('input[name="label_%d"]'%i)).to_have_value(label)
    expect(form.locator('input[name="sample_0"]')).to_have_value(
      re.compile(r"synthetic-4-0001"))
    expect(form.locator('input[name="sample_16"]')).to_have_value(
      re.compile(r"synthetic-20-0001"))
    page.screenshot(path=str(OUT/"v3-retained-xlsx-batch-17-fields.png"),
                    full_page=True)
    form.locator('button[type="submit"]').click()
    mapping=page.locator('form[data-eidos-id="evo-data-import.mapping"]')
    expect(mapping).to_be_visible(timeout=45000)
    for index,label in enumerate(FIELDS):
        target="ext_"+hashlib.sha256(
          ("counterparty.subject|"+label).encode("utf8")
        ).hexdigest()[:16]
        expect(mapping.locator('select[name="map_%d"]'%(index+4))
          ).to_have_value(target)
    expect(mapping.locator('select[name="map_3"]')).to_have_value(EXPECTED_BANK)
    expect(mapping.locator('select[name="map_21"]')).to_have_value("__IGNORE__")
    print("BEX01_V3_XLSX_RETAINED_17_FIELDS_CREATED_AND_MAPPED_PASS",flush=True)
    mapping.locator('button[type="submit"]').click()
    review=page.locator('[data-eidos-id="evo-data-import.review"]')
    expect(review).to_be_visible(timeout=45000)
    for number in [165,169,172]:
        expect(review.locator('[data-eidos-catalog-item="row:%d"]'%number)
          ).to_contain_text("主体类型：（空）")
    assert review.locator('[data-eidos-catalog-action="commit"]').count()==0
    for number in [165,169,172]:
        el=review.locator('[data-eidos-catalog-item="row:%d"]'%number)
        el.locator('[data-eidos-catalog-action="correct-row:%d"]'%number).click()
        fix=page.locator('form[data-eidos-id="evo-data-import.row-correct"]')
        expect(fix).to_be_visible(timeout=30000)
        expect(fix.locator('select[name="value"]')).to_have_value("")
        fix.locator('select[name="value"]').select_option("ORGANIZATION")
        fix.locator('button[type="submit"]').click()
        review=page.locator('[data-eidos-id="evo-data-import.review"]')
        expect(review).to_be_visible(timeout=45000)
        if number!=172:
            assert review.locator('[data-eidos-catalog-action="commit"]').count()==0
    commit=review.locator('[data-eidos-catalog-action="commit"]')
    expect(commit).to_be_visible(timeout=45000)
    sources=review.locator('[data-eidos-catalog-item^="source:"]')
    expect(sources).to_have_count(22)
    expect(review.locator('[data-eidos-catalog-item="source:21"]')
           ).to_contain_text("已忽略")
    page.screenshot(path=str(OUT/"v3-retained-xlsx-ready-172.png"),
                    full_page=True)
    commit.click()
    # Verify the final row through the real Human detail projection; checking
    # only a successful receipt would not prove values reached Business Data.
    page.goto(HOST+"/?surface=desktop#"+fixture["route"],
              wait_until="domcontentloaded")
    expect(page.locator('[data-eidos-catalog-table]')).to_be_visible(timeout=30000)
    page.locator('[data-eidos-catalog-server-search] input[name="search"]'
      ).fill("Retained Supplier 0172")
    page.locator('[data-eidos-catalog-server-search] button[type="submit"]').click()
    expect(page.locator('[data-eidos-catalog-table] tbody tr')).to_have_count(1,timeout=30000)
    page.locator('[data-eidos-catalog-table] tbody tr:first-child button').first.click()
    details=page.locator('[data-eidos-catalog-item$=":enterprise-extension"]')
    expect(details).to_be_visible(timeout=30000)
    for label in FIELDS:
        expect(details).to_contain_text(label)
    expect(details).to_contain_text("synthetic-4-0172")
    expect(details).to_contain_text("synthetic-20-0172")
    expect(details).to_contain_text("测试银行-2")
    page.screenshot(path=str(OUT/"v3-retained-xlsx-172-detail.png"),
                    full_page=True)
    print("BEX01_V3_XLSX_RETAINED_172_18_BUSINESS_FIELDS_PASS:ISOLATED_HOST",
          flush=True)
    context.close()
    browser.close()
    api.dispose()
