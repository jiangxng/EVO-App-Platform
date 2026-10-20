#!/usr/bin/env python3
"""Actual isolated Host and Chromium viewport tests. Not Safari/Android physical device."""
import json
from datetime import datetime, timezone
from pathlib import Path
from playwright.sync_api import sync_playwright, expect

OUT=Path("artifacts/bex01-browser")
fixture=json.loads((OUT/"fixture.json").read_text())
HOST=fixture["hostUrl"]; CTX=fixture["contextId"]; route=fixture["route"]
assert HOST.startswith("http://127.0.0.1:")
assert fixture["isolated"] and not fixture["productionUsed"]
checks=[]; errors=[]
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True)
 def make_context(width,height,phone):
  context=browser.new_context(
   viewport={"width":width,"height":height},device_scale_factor=2 if phone else 1,
   is_mobile=phone,has_touch=phone,locale="zh-CN"
  )
  context.add_init_script("""
   if (location.origin === %s) {
     localStorage.setItem("evo.context.id", %s);
     localStorage.setItem("evo.locale", "zh-CN");
   }
  """ % (json.dumps(HOST),json.dumps(CTX)))
  return context
 def run(name,fn):
  try:
   value=fn()
   checks.append({"name":name,"result":"PASS","observed":value})
   print("BEX01_BROWSER_PASS:"+name,flush=True)
  except Exception as e:
   checks.append({"name":name,"result":"FAIL","error":repr(e)})
   print("BEX01_BROWSER_FAIL:"+name+":"+repr(e),flush=True)
 def open_supplier(context):
  page=context.new_page()
  page.on("pageerror",lambda error: errors.append(str(error)))
  page.goto(HOST+"/?surface=desktop#"+route,wait_until="domcontentloaded")
  expect(page.locator('[data-eidos-catalog-has-table="true"]')).to_have_count(1,timeout=30000)
  page.wait_for_timeout(700)
  diagnostic=page.evaluate("""async () => {
    const el=document.querySelector('[data-eidos-catalog-has-table="true"]');
    const trace=[];let target=el;
    for(let n=0;target&&n<10;n++,target=target.parentElement){
      const styles=getComputedStyle(target);
      trace.push({tag:target.tagName,id:target.id,cls:target.className,
       display:styles.display,visibility:styles.visibility,
       width:Math.round(target.getBoundingClientRect().width)});
    }
    const cards=el?.querySelector('[data-eidos-catalog-items]');
    const table=el?.querySelector('[data-eidos-catalog-table]');
    const tableWrap=el?.querySelector('[data-eidos-catalog-table-wrap]');
    const cssLink=document.querySelector('link[rel="stylesheet"]');
    const cssResponse=cssLink?await fetch(cssLink.href):null;
    const cssBody=cssResponse?await cssResponse.text():"";
    const mark=cssBody.indexOf("data-eidos-catalog-has-table");
    const tableWrapRules=[];
    const collectRules=rules=>{
      for(const rule of rules){
        if(rule.cssRules) collectRules(rule.cssRules);
        if(rule.selectorText?.includes("data-eidos-catalog-table-wrap")){
          let matches=false;
          try{matches=Boolean(tableWrap?.matches(rule.selectorText));}catch{}
          tableWrapRules.push({selector:rule.selectorText,display:rule.style?.display??null,
            media:rule.parentRule?.conditionText??null,matches});
        }
      }
    };
    for(const sheet of document.styleSheets){try{collectRules(sheet.cssRules)}catch{}}
    const mobileRule=cssBody.lastIndexOf("data-eidos-catalog-table-wrap");
    return {innerWidth:innerWidth,pathname:location.pathname,hash:location.hash,
      phoneMediaMatches:matchMedia("(max-width:700px)").matches,
      cssStatus:cssResponse?.status,cssLength:cssBody.length,
      cssHasTableRule:mark>=0,cssRuleExcerpt:mark>=0?cssBody.slice(mark-45,mark+105):null,
      cssMobileTableRuleExcerpt:mobileRule>=0?cssBody.slice(Math.max(0,mobileRule-60),mobileRule+180):null,
      mobileSurface:document.querySelector("[data-mobile-surface]")?.getAttribute("data-mobile-surface"),
      rootTableFlag:el?.getAttribute("data-eidos-catalog-has-table"),
      tableWrapFound:Boolean(tableWrap),
      tableWrapWithinRoot:Boolean(el&&tableWrap&&el.contains(tableWrap)),
      tableWrapDisplay:tableWrap?getComputedStyle(tableWrap).display:null,
      tableWrapInlineDisplay:tableWrap?.style.display||null,
      tableWrapRules,
      cardsDisplay:cards?getComputedStyle(cards).display:null,
      tableDisplay:table?getComputedStyle(table).display:null,
      styleSheets:[...document.styleSheets].map(x=>x.href).slice(0,10),parents:trace};
  }""")
  print("BEX01_BROWSER_DOM_DIAGNOSTIC="+json.dumps(diagnostic,ensure_ascii=False),flush=True)
  page.screenshot(path=str(OUT/("initial-phone.png" if page.viewport_size["width"]<700 else "initial-desktop.png")),full_page=True)
  return page
 def desktop():
  context=make_context(1280,820,False)
  page=open_supplier(context)
  try:
   table=page.locator('[data-eidos-catalog-table]')
   expect(table.locator("tbody tr")).to_have_count(25)
   assert table.is_visible(),"DESKTOP_TABLE_MUST_BE_VISIBLE"
   assert not page.locator('[data-eidos-catalog-has-table="true"] [data-eidos-catalog-items]').is_visible(),"DESKTOP_CARDS_SHOULD_COLLAPSE"
   styling=page.evaluate("""() => {
     const table=document.querySelector('[data-eidos-catalog-table]');
     const heading=table.querySelector('thead th button');
     const name=table.querySelector('tbody td:first-child button');
     const label=document.querySelector('[data-eidos-catalog-search-label]');
     const rect=table.getBoundingClientRect();
     return {
       headingBorder:getComputedStyle(heading).borderTopWidth,
       nameBorder:getComputedStyle(name).borderTopWidth,
       headingBackground:getComputedStyle(heading).backgroundColor,
       tableBackground:getComputedStyle(table).backgroundColor,
       firstColumnShare:table.querySelector('thead th').getBoundingClientRect().width/rect.width,
       firstRowHeight:table.querySelector('tbody tr').getBoundingClientRect().height,
       visuallyHiddenSearchLabel:getComputedStyle(label).position==='absolute',
       overflow:document.documentElement.scrollWidth>innerWidth+2
     };
   }""")
   assert styling["headingBorder"]=="0px","SORT_HEADER_MUST_NOT_LOOK_LIKE_FORM_BUTTON: "+str(styling)
   assert styling["nameBorder"]=="0px","SUPPLIER_NAME_MUST_LOOK_LIKE_TEXT_LINK: "+str(styling)
   assert .38<=styling["firstColumnShare"]<=.56,"UNBALANCED_COLUMNS: "+str(styling)
   assert styling["firstRowHeight"]<=56,"TABLE_ROW_NOT_COMPACT: "+str(styling)
   assert styling["visuallyHiddenSearchLabel"],"DUPLICATED_VISIBLE_SEARCH_CAPTION"
   assert not styling["overflow"],"DESKTOP_HORIZONTAL_OVERFLOW"
   page.screenshot(path=str(OUT/"desktop-supplier-table-polished.png"),full_page=True)
   next_button=page.locator('[data-eidos-catalog-action="next-page"]')
   expect(next_button).to_be_visible()
   next_button.click()
   expect(page.locator('[data-eidos-page-summary]')).to_have_text("26–50 / 54")
   expect(page.locator('[data-eidos-catalog-table] tbody tr')).to_have_count(25)
   assert "page=1" in page.url,page.url
   page.locator('[data-eidos-catalog-action="next-page"]').click()
   expect(page.locator('[data-eidos-page-summary]')).to_have_text("51–54 / 54")
   expect(page.locator('[data-eidos-catalog-table] tbody tr')).to_have_count(4)
   page.go_back(wait_until="domcontentloaded")
   expect(page.locator('[data-eidos-page-summary]')).to_have_text("26–50 / 54")
   page.locator('[data-eidos-catalog-server-search] input[name="search"]').fill("Supplier 0003")
   page.locator('[data-eidos-catalog-server-search] button[type="submit"]').click()
   expect(page.locator('[data-eidos-page-summary]')).to_have_text("1–1 / 1")
   expect(page.locator('[data-eidos-catalog-table] tbody tr')).to_have_count(1)
   assert "search=Supplier" in page.url,page.url
   page.screenshot(path=str(OUT/"desktop-supplier-filter.png"),full_page=True)
   return {"table":True,"pages":[25,25,4],"backRestoresPage":True,"serverSearch":True}
  finally: context.close()
 run("desktop-live-Host-search-page-and-browser-back",desktop)
 def failed_precheck_navigation():
  context=make_context(1280,820,False)
  page=context.new_page()
  bad_id=fixture["failedJobId"]
  try:
   review_route="/data-import/jobs/"+bad_id+"/review"
   page.goto(HOST+"/?surface=desktop#"+review_route,wait_until="domcontentloaded")
   review=page.locator('[data-eidos-id="evo-data-import.review"]')
   expect(review).to_be_visible(timeout=30000)
   expect(review.locator('[data-eidos-catalog-item="row:1"]')).to_contain_text("主体类型")
   expect(review.locator('[data-eidos-catalog-item="row:1"]')).to_contain_text("调整字段映射")
   expect(review.locator('[data-eidos-catalog-action="commit"]')).to_have_count(0)
   back=review.locator('[data-eidos-catalog-action="return-to-target"]')
   expect(back).to_be_visible()
   expect(back).to_have_text("返回供应商列表")
   assert back.get_attribute("data-eidos-route")==route
   assert review.locator('[data-eidos-context-route="'+route+'"]').count()==1
   page.screenshot(path=str(OUT/"supplier-invalid-import-return.png"),full_page=True)
   back.click()
   expect(page.locator('[data-eidos-id="evo-counterparty.projection.counterparty.suppliers"]')).to_have_count(1,timeout=15000)
   # Direct revisit must still show the staged failed job (exit is navigation only).
   page.goto(HOST+"/?surface=desktop#"+review_route,wait_until="domcontentloaded")
   expect(page.locator('[data-eidos-catalog-item="row:3"]')).to_contain_text("主体类型")
   # Same safe workspace exit is present from field mapping.
   mapping_route="/data-import/jobs/"+bad_id+"/map"
   page.goto(HOST+"/?surface=desktop#"+mapping_route,wait_until="domcontentloaded")
   mapping_form=page.locator('[data-eidos-id="evo-data-import.mapping"]')
   expect(mapping_form).to_be_visible(timeout=20000)
   assert page.locator('[data-eidos-context-route="'+route+'"]').count()==1
   # A failed dry-run is already persisted Host evidence. The mapping page
   # must surface the three missing subjectType rows before the user edits.
   issue_panel=mapping_form.locator('[data-eidos-form-task-issues]')
   expect(issue_panel).to_be_visible()
   expect(issue_panel).to_contain_text("主体类型")
   expect(issue_panel).to_contain_text("3 条记录缺少主体类型")
   expect(issue_panel).to_contain_text("第 1、2、3 行")
   record_issue=issue_panel.locator('[data-eidos-form-task-issue-related]')
   expect(record_issue).to_have_count(1)
   record_issue.locator("summary").click()
   row_links=record_issue.locator('[data-eidos-form-task-issue-row]')
   expect(row_links).to_have_count(3)
   for n in [1,2,3]:
    expect(row_links.nth(n-1)).to_have_text("第 %d 行"%n)
    assert (row_links.nth(n-1).get_attribute("data-eidos-context-route")
      or "").endswith("/fix/%d/2"%n)
   page.screenshot(path=str(OUT/"v3-map-row-issues-desktop.png"),full_page=True)
   row_links.first.click()
   fix_form=page.locator('form[data-eidos-id="evo-data-import.row-correct"]')
   expect(fix_form).to_be_visible(timeout=20000)
   expect(fix_form.locator('select[name="rowNumber"]')).to_have_value("1")
   page.goto(HOST+"/?surface=desktop#"+mapping_route,wait_until="domcontentloaded")
   expect(page.locator('form[data-eidos-id="evo-data-import.mapping"]')).to_be_visible(timeout=20000)
   phone_context=make_context(390,844,True)
   try:
    phone_page=phone_context.new_page()
    phone_page.goto(HOST+"/?surface=desktop#"+mapping_route,wait_until="domcontentloaded")
    phone_form=phone_page.locator('[data-eidos-id="evo-data-import.mapping"]')
    expect(phone_form).to_be_visible(timeout=20000)
    phone_issue_panel=phone_form.locator('[data-eidos-form-task-issues]')
    expect(phone_issue_panel).to_be_visible()
    expect(phone_issue_panel).to_contain_text("3 条记录缺少主体类型")
    expect(phone_issue_panel).to_contain_text("第 1、2、3 行")
    phone_record=phone_issue_panel.locator('[data-eidos-form-task-issue-related]')
    expect(phone_record).to_have_count(1)
    phone_record.locator("summary").click()
    phone_rows=phone_record.locator('[data-eidos-form-task-issue-row]')
    expect(phone_rows).to_have_count(3)
    phone_rows.nth(1).click()
    fix=phone_page.locator('form[data-eidos-id="evo-data-import.row-correct"]')
    expect(fix).to_be_visible(timeout=20000)
    expect(fix.locator('select[name="rowNumber"]')).to_have_value("2")
    phone_page.goto(HOST+"/?surface=desktop#"+mapping_route,wait_until="domcontentloaded")
    expect(phone_form).to_be_visible(timeout=20000)
    expect(phone_page.locator("html")).to_have_js_property("scrollWidth",390)
    phone_page.screenshot(path=str(OUT/"v3-map-row-issues-phone.png"),full_page=True)
   finally:
    phone_context.close()
   # The upload step also retains the originating business workspace.
   upload="/data-import/new/counterparty.subject?parameter__relationshipMode=SUPPLIER"
   page.goto(HOST+"/?surface=desktop#"+upload,wait_until="domcontentloaded")
   expect(page.locator('[data-eidos-id="evo-data-import.upload"]')).to_be_visible(timeout=20000)
   assert page.locator('[data-eidos-context-route="'+route+'"]').count()==1
   return {"failedRows":3,"safeExitAllSteps":True,
     "noAccidentalCommit":True,"localizedErrors":True,
     "stagedJobPreserved":True}
  finally: context.close()
 run("failed-supplier-import-review-mapping-upload-return",failed_precheck_navigation)
 def extension_field_from_import():
  import hashlib
  ctx=make_context(1280,820,False)
  page=ctx.new_page()
  job=fixture["extensionJobId"]
  expected_field="ext_"+hashlib.sha256("counterparty.subject|开户银行".encode()).hexdigest()[:16]
  try:
   mapping="/data-import/jobs/"+job+"/map"
   page.goto(HOST+"/?surface=desktop#"+mapping,wait_until="domcontentloaded")
   page.wait_for_timeout(800)
   print("BEX_EXT_MAP_FIRST="+json.dumps({"url":page.url,
      "text":page.locator("body").inner_text()[:600]},ensure_ascii=False),flush=True)
   expect(page.locator('[data-eidos-id="evo-data-import.mapping"]')).to_be_visible(timeout=15000)
   # Create from the unmapped column itself, without changing the Agent entry.
   mapping_form=page.locator('form[data-eidos-id="evo-data-import.mapping"]')
   expect(mapping_form.locator('[data-eidos-agent-action="ai-auto-map"]')).to_be_visible()
   # Batch B is now visible beside the original per-column action.
   expect(mapping_form.locator('[data-eidos-context-navigation-desktop] [data-eidos-context-route*="mode=batch"]')).to_have_count(1)
   inline=mapping_form.locator('[data-eidos-field-context-link][data-eidos-context-route*="column="]')
   expect(inline).to_have_count(1)
   expect(inline.first).to_have_attribute("data-eidos-context-route",
     "/object-extensions/from-import?job="+job+"&column=%E5%BC%80%E6%88%B7%E9%93%B6%E8%A1%8C")
   # In generic Eidos compact ReviewTable, source-bound actions are available
   # in that same source row's accessible evidence disclosure.
   bank_row=mapping_form.locator('[data-eidos-form-review-table-row="map-source-3"]')
   bank_row.locator('[data-eidos-review-group-detail] summary').click()
   expect(inline.first).to_be_visible()
   inline.first.click()
   print("BEX_EXT_OPEN="+json.dumps({"url":page.url,
      "text":page.locator("body").inner_text()[:400]},ensure_ascii=False),flush=True)
   expect(page.locator('form[data-eidos-id="evo-object-extension.import"]')).to_be_visible(timeout=15000)
   form=page.locator('form[data-eidos-id="evo-object-extension.import"]')
   expect(form.locator('select[name="sourceColumn"]')).to_have_value("开户银行")
   expect(form.locator('select[name="sourceColumn"] option')).to_have_count(1)
   expect(form.locator('input[name="label"]')).to_have_value("开户银行")
   expect(form.locator('input[name="sourceSample"]')).to_have_value("HSBC")
   form.locator('select[name="valueType"]').select_option("STRING")
   page.screenshot(path=str(OUT/"extension-field-create.png"),full_page=True)
   form.locator('button[type="submit"]').click()
   page.wait_for_timeout(800)
   print("BEX_EXT_AFTER_CREATE="+json.dumps({"url":page.url,
      "text":page.locator("body").inner_text()[:800]},ensure_ascii=False),flush=True)
   expect(page.locator('[data-eidos-id="evo-data-import.mapping"]')).to_be_visible(timeout=15000)
   mapping_form=page.locator('form[data-eidos-id="evo-data-import.mapping"]')
   expect(mapping_form.locator('select[name="map_3"] option[value="'+expected_field+'"]')).to_have_count(1)
   expect(mapping_form.locator('select[name="map_3"]')).to_have_value(expected_field)
   expect(mapping_form.locator('[data-eidos-field-context-link][data-eidos-context-route*="column="]')).to_have_count(0)
   mapping_form.locator('select[name="map_0"]').select_option("code")
   # A mapped system field must disappear from every other Excel column.
   expect(mapping_form.locator('select[name="map_1"] option[value="code"]')).to_have_count(0)
   expect(mapping_form.locator('select[name="map_3"] option[value="code"]')).to_have_count(0)
   # Release restores original option order and availability without refresh.
   mapping_form.locator('select[name="map_0"]').select_option("__IGNORE__")
   expect(mapping_form.locator('select[name="map_1"] option[value="code"]')).to_have_count(1)
   mapping_form.locator('select[name="map_0"]').select_option("code")
   expect(mapping_form.locator('select[name="map_1"] option[value="code"]')).to_have_count(0)
   expect(mapping_form.locator('select[name="map_0"] option[value="__IGNORE__"]')).to_have_count(1)
   expect(mapping_form.locator('select[name="map_1"] option[value="__IGNORE__"]')).to_have_count(1)
   mapping_form.locator('select[name="map_1"]').select_option("displayName")
   mapping_form.locator('select[name="map_2"]').select_option("subjectType")
   mapping_form.locator('select[name="map_3"]').select_option(expected_field)
   mapping_form.locator('button[type="submit"]').click()
   expect(page.locator('[data-eidos-id="evo-data-import.review"]')).to_be_visible(timeout=30000)
   review=page.locator('[data-eidos-id="evo-data-import.review"]')
   expect(review.locator('[data-eidos-catalog-action="commit"]')).to_be_visible()
   page.on("dialog",lambda dialog: dialog.accept())
   review.locator('[data-eidos-catalog-action="commit"]').click()
   page.wait_for_timeout(900)
   print("BEX_EXT_AFTER_COMMIT="+json.dumps({"url":page.url,
     "text":page.locator("body").inner_text()[-1700:]},ensure_ascii=False),flush=True)
   expect(page.locator('[data-eidos-id="evo-data-import.review"]')).to_be_visible(timeout=30000)
   expect(page.locator('[data-eidos-catalog-action="return-to-target"]')).to_be_visible()
   page.goto(HOST+"/?surface=desktop#"+route,wait_until="domcontentloaded")
   expect(page.locator('[data-eidos-catalog-table]')).to_be_visible(timeout=30000)
   search=page.locator('[data-eidos-catalog-server-search] input[name="search"]')
   search.fill("Extension Field Supplier")
   page.locator('[data-eidos-catalog-server-search] button[type="submit"]').click()
   page.wait_for_timeout(700)
   print("BEX_EXT_SEARCH="+json.dumps({"url":page.url,
      "text":page.locator("body").inner_text()[-800:]},ensure_ascii=False),flush=True)
   expect(page.locator('[data-eidos-catalog-table] tbody tr')).to_have_count(1)
   page.locator('[data-eidos-catalog-table] tbody tr:first-child button').first.click()
   expect(page.locator('[data-eidos-id="evo-counterparty.detail"]')).to_be_visible(timeout=30000)
   expect(page.locator('[data-eidos-catalog-item$=":enterprise-extension"]')).to_contain_text("开户银行")
   expect(page.locator('[data-eidos-catalog-item$=":enterprise-extension"]')).to_contain_text("HSBC")
   page.screenshot(path=str(OUT/"extension-value-in-supplier-detail.png"),full_page=True)
   return {"definedSourceColumn":"开户银行","mappedNewField":expected_field,
    "committedSupplier":"EXT001","displayedSavedValue":"HSBC"}
  finally: ctx.close()
 run("extension-field-create-map-commit-detail",extension_field_from_import)
 def batch_extension_from_import():
  import hashlib
  ctx=make_context(1280,820,False)
  page=ctx.new_page()
  page.on("pageerror",lambda error:print("BEX_BATCH_PAGE_ERROR="+str(error),flush=True))
  page.on("console",lambda msg:print("BEX_BATCH_CONSOLE_ERROR="+msg.text,flush=True)
    if msg.type=="error" else None)
  page.on("response",lambda response:print("BEX_BATCH_API_RESPONSE="+str(response.status)
    +" "+response.url,flush=True) if "/v1/experience-pages" in response.url else None)
  job=fixture["batchJobId"]
  names=["默认支付方式","结算方式","默认账期方式","账期天数"]
  try:
   mapping="/data-import/jobs/"+job+"/map"
   page.goto(HOST+"/?surface=desktop#"+mapping,wait_until="domcontentloaded")
   expect(page.locator('form[data-eidos-id="evo-data-import.mapping"]')).to_be_visible(timeout=30000)
   expect(page.locator('[data-eidos-agent-action="ai-auto-map"]')).to_be_visible()
   entry=page.locator('[data-eidos-context-route*="&mode=batch"]')
   expect(entry.first).to_be_visible()
   entry.first.click()
   page.wait_for_timeout(850)
   print("BEX_BATCH_ROUTE_AFTER_CLICK="+json.dumps(page.evaluate("""() => ({
     url: location.href,
     pageContainer:document.querySelector("[data-eidos-page]")?.outerHTML.slice(0,4500),
     previews:[...document.querySelectorAll("pre")].map(x=>x.innerText).slice(0,4),
     bodyEnd:document.body.innerText.slice(-2200),
     formIds:[...document.querySelectorAll("form[data-eidos-id]")].map(x=>x.getAttribute("data-eidos-id"))
   })"""),ensure_ascii=False),flush=True)
   form=page.locator('form[data-eidos-id="evo-object-extension.batch-import"]')
   expect(form).to_be_visible(timeout=30000)
   groups=form.locator('[data-eidos-form-review-table-row]')
   expect(groups).to_have_count(5)
   expect(form.locator('[data-eidos-form-review-table]')).to_be_visible()
   expect(form.locator('[data-eidos-form-review-table-filter]')).to_have_value("needs")
   expect(form.locator('[data-eidos-form-task-metric]')).to_have_count(4)
   first=groups.first
   expect(first.locator('[data-eidos-review-table-choice] select[name="choice_0"]')).to_be_visible()
   expect(first.locator('[data-eidos-review-group-detail]')).not_to_have_attribute("open","")
   first.locator('[data-eidos-review-group-detail] summary').click()
   expect(first.locator('input[name="label_0"]')).to_be_visible()
   expect(first.locator('input[name="sample_0"]')).to_be_visible()
   first.locator('[data-eidos-review-group-detail] summary').click()
   expect(first.locator('select[name="choice_0"]')).to_be_visible()
   for i,name in enumerate(names):
    expect(form.locator('select[name="choice_'+str(i)+'"]')).to_have_value("__CREATE__")
    expect(form.locator('input[name="label_'+str(i)+'"]')).to_have_value(name)
   expect(form.locator('select[name="type_3"]')).to_have_value("NUMBER")
   # Business samples come from the authorized staged Host job, not HTML mock values.
   expect(form.locator('input[name="sample_0"]')).to_have_value(
     "非空 1 / 1 行 · 来源样本：转账"
   )
   expect(form.locator('input[name="sample_3"]')).to_have_value(
     "非空 1 / 1 行 · 来源样本：30"
   )
   expect(form.locator('select[name="choice_4"]')).to_have_value("__REVIEW__")
   form.locator('select[name="choice_4"]').select_option("__IGNORE__")
   page.screenshot(path=str(OUT/"extension-batch-review-before-confirm.png"),full_page=True)
   page.on("dialog",lambda dialog: dialog.accept())
   form.locator('button[data-eidos-action="create-extension-batch"]').click()
   mapped=page.locator('form[data-eidos-id="evo-data-import.mapping"]')
   expect(mapped).to_be_visible(timeout=30000)
   for i,name in enumerate(names):
    expected="ext_"+hashlib.sha256(("counterparty.subject|"+name).encode()).hexdigest()[:16]
    expect(mapped.locator('select[name="map_'+str(i+3)+'"]')).to_have_value(expected)
   expect(mapped.locator('select[name="map_7"]')).to_have_value("__IGNORE__")
   page.screenshot(path=str(OUT/"extension-batch-auto-mapped.png"),full_page=True)
   mapped.locator('select[name="map_0"]').select_option("code")
   mapped.locator('select[name="map_1"]').select_option("displayName")
   mapped.locator('select[name="map_2"]').select_option("subjectType")
   mapped.locator('button[type="submit"]').click()
   review=page.locator('[data-eidos-id="evo-data-import.review"]')
   expect(review).to_be_visible(timeout=30000)
   expect(review.locator('[data-eidos-catalog-action="commit"]')).to_be_visible()
   review.locator('[data-eidos-catalog-action="commit"]').click()
   page.goto(HOST+"/?surface=desktop#"+route,wait_until="domcontentloaded")
   expect(page.locator('[data-eidos-catalog-table]')).to_be_visible(timeout=30000)
   page.locator('[data-eidos-catalog-server-search] input[name="search"]').fill("Batch Extension Supplier")
   page.locator('[data-eidos-catalog-server-search] button[type="submit"]').click()
   expect(page.locator('[data-eidos-catalog-table] tbody tr')).to_have_count(1,timeout=30000)
   page.locator('[data-eidos-catalog-table] tbody tr:first-child button').first.click()
   detail=page.locator('[data-eidos-catalog-item$=":enterprise-extension"]')
   expect(detail).to_contain_text("默认支付方式")
   expect(detail).to_contain_text("结算方式")
   expect(detail).to_contain_text("默认账期方式")
   expect(detail).to_contain_text("账期天数")
   expect(detail).to_contain_text("30")
   page.screenshot(path=str(OUT/"extension-batch-supplier-detail.png"),full_page=True)
   return {"batchColumns":names,"batchCreatedAndMapped":4,
     "explicitImportCommit":True,"supplierDetailValues":True}
  finally:ctx.close()
 run("batch-extension-one-screen-confirm-map-commit-detail",batch_extension_from_import)
 def phone():
  context=make_context(390,844,True)
  page=open_supplier(context)
  try:
   table=page.locator('[data-eidos-catalog-table]')
   assert not table.is_visible(),"PHONE_TABLE_SHOULD_REFLOW_TO_CARDS"
   cards=page.locator('[data-eidos-catalog-items] [data-eidos-catalog-item]')
   expect(cards).to_have_count(25)
   assert cards.first.is_visible(),"PHONE_CARDS_MUST_BE_VISIBLE"
   size=page.evaluate("""() => ({
    viewport: window.innerWidth,
    scrollWidth: document.documentElement.scrollWidth
   })""")
   assert size["scrollWidth"] <= size["viewport"]+2, "PHONE_HORIZONTAL_PAGE_OVERFLOW: "+str(size)
   control=page.locator('[data-eidos-catalog-server-search] input[name="search"]')
   assert control.bounding_box()["height"] >= 44, "PHONE_SEARCH_TOUCH_TARGET"
   page.locator('[data-eidos-catalog-action="next-page"]').click()
   expect(page.locator('[data-eidos-page-summary]')).to_have_text("26–50 / 56")
   expect(cards).to_have_count(25)
   page.locator('[data-eidos-catalog-server-search] input[name="search"]').fill("Supplier 0053")
   page.locator('[data-eidos-catalog-server-search] button[type="submit"]').click()
   expect(page.locator('[data-eidos-page-summary]')).to_have_text("1–1 / 1")
   expect(cards).to_have_count(1)
   assert "Supplier 0053" in cards.first.inner_text()
   page.screenshot(path=str(OUT/"phone-supplier-search.png"),full_page=True)
   page.locator('[data-eidos-catalog-action="import"]').click()
   expect(page.locator('[name="parameter__relationshipMode"]')).to_have_value("SUPPLIER",timeout=25000)
   return {"viewport":size,"touchSearch":True,"mobileCards":True,
    "supplierImportRolePrefilled":True}
  finally: context.close()
 run("touch-Chromium-phone-cards-search-import-and-safe-width",phone)
 version=browser.version
 browser.close()
report={"checkedAtUtc":datetime.now(timezone.utc).isoformat(),
 "browser":"Headless Chromium "+version,
 "actualHost":True,"data":"disposable isolated fixture, 54 committed supplier rows",
 "device":"desktop plus touch-enabled 390px Chromium mobile emulation",
 "notProven":["iOS Safari","physical Android Chrome","real weak-network/mobile keyboard"],
 "passed":sum(i["result"]=="PASS" for i in checks),
 "total":len(checks),"cases":checks,"browserErrors":errors[-20:]}
(OUT/"report.json").write_text(json.dumps(report,ensure_ascii=False,indent=2))
print("BEX01_BROWSER_SUMMARY="+json.dumps({"passed":report["passed"],"total":report["total"],
 "browser":report["browser"]}),flush=True)
assert report["passed"]==report["total"],"BEX01_BROWSER_FAILED"
