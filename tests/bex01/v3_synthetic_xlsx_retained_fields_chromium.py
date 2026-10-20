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


def capture_map_scroll_evidence(page, form, device):
    """Capture scrollable Eidos shell at each review landmark, not only document height.

    page.screenshot(full_page=True) alone stops at the *nested app scroller* and
    previously cut away the file overview/footer. Screens are entirely synthetic
    and MUST NOT be treated as customer/production visual sign-off.
    """
    viewport=page.viewport_size
    assert viewport and viewport["width"] in (1280,390),viewport
    landmarks=[
      ("overview",form.locator('[data-eidos-form-task-overview]')),
      ("first-row",form.locator('[data-eidos-form-review-table-row]').first),
      ("last-row",form.locator('[data-eidos-form-review-table-row]').last),
      ("submit",form.locator('button[type="submit"]').first)
    ]
    readings=[]
    for name,element in landmarks:
        expect(element).to_be_visible(timeout=15000)
        element.scroll_into_view_if_needed(timeout=15000)
        rect=element.bounding_box()
        assert rect and rect["y"] < viewport["height"] and (
          rect["y"]+rect["height"]>0), (device,name,rect)
        page.screenshot(
          path=str(OUT/("v3-e4-map-%s-%s.png"%(device,name))),
          full_page=False)
        scroll=element.evaluate("""(el) => {
          const items=[]; let parent=el;
          for(let n=0;parent&&n<25;n++,parent=parent.parentElement){
            if(parent.scrollHeight > parent.clientHeight + 4) {
              items.push({tag:parent.tagName,
                scrollTop:Math.round(parent.scrollTop),
                scrollHeight:parent.scrollHeight,
                clientHeight:parent.clientHeight});
            }
          }
          const root=document.scrollingElement;
          if(root && !items.some(v=>v.tag===root.tagName &&
            v.scrollHeight===root.scrollHeight)) {
            items.push({tag:root.tagName,scrollTop:Math.round(root.scrollTop),
              scrollHeight:root.scrollHeight,clientHeight:root.clientHeight});
          }
          return items;
        }""")
        readings.append({"landmark":name,"rectangle":{
          key:round(rect[key]) for key in ("x","y","width","height")},
          "scroll":scroll})
    # A nested Host scroller can exceed the screen by 4–10x: four landmarks
    # show top and bottom but do not prove *contiguous* visual coverage.
    # Take viewport-sized frames with ~20% overlap from its actual scrollTop.
    container=form.evaluate("""(el) => {
      for(let parent=el;parent;parent=parent.parentElement){
        if(parent.scrollHeight>parent.clientHeight+40){
          return {height:parent.scrollHeight,viewport:parent.clientHeight,
            tag:parent.tagName};
        }
      }
      return null;
    }""")
    assert container and container["height"] > container["viewport"], (
      device,container)
    maximum=container["height"]-container["viewport"]
    step=max(1,int(container["viewport"]*0.8))
    positions=list(range(0,maximum+1,step))
    if positions[-1]!=maximum:positions.append(maximum)
    assert positions[0]==0 and positions[-1]==maximum
    sweep=[]
    for index,position in enumerate(positions):
        actual=form.evaluate("""(el,position) => {
          for(let p=el;p;p=p.parentElement){
            if(p.scrollHeight>p.clientHeight+40){
              p.scrollTop=position;
              return Math.round(p.scrollTop);
            }
          }
          return -1;
        }""",position)
        assert abs(actual-position)<=2,(device,position,actual)
        # A nested compositor scroller can expose a partially blank frame if
        # Playwright captures immediately after setting scrollTop. Wait for two
        # animation frames before recording visual proof, not a fixed timer.
        page.evaluate("""async () => {
          await new Promise(resolve => requestAnimationFrame(
            () => requestAnimationFrame(resolve)));
        }""")
        page.screenshot(path=str(OUT/(
          "v3-e4-map-%s-contiguous-%02d.png"%(device,index))),
          full_page=False)
        sweep.append({"frame":index,"scrollTop":actual})
    assert all(sweep[i]["scrollTop"]<=sweep[i+1]["scrollTop"]
      for i in range(len(sweep)-1))
    # Compact V3 shortens rows; retain full scroll-range coverage instead of
    # requiring the legacy page's minimum frame count.
    assert 2<=len(sweep)<=25,(device,len(sweep))
    assert all(sweep[i+1]["scrollTop"]-sweep[i]["scrollTop"]<=
      container["viewport"] for i in range(len(sweep)-1))
    sweep_data={"scrollContainer":container,"lastScrollTop":maximum,
      "overlapRatio":0.2,"frames":sweep}
    (OUT/("v3-e4-map-%s-scroll-manifest.json"%device)).write_text(
      json.dumps({"evidence":"synthetic isolated Host, not production",
        "device":device,"viewport":viewport,"screens":readings,
        "continuousSweep":sweep_data},
        ensure_ascii=False,indent=2),encoding="utf8")
    print("BEX01_E4_FULL_REVIEW_SCROLL_EVIDENCE_PASS:"+device,flush=True)


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
        // Start with an explicit saved preference; absence of a stored layout
        // is not evidence that route focus overwrote a user's preference.
        localStorage.setItem("eidos.workbench.layout",JSON.stringify({
          contractVersion:"0.1.0",activeActivityId:"apps",
          sidePanelVisible:true,sidePanelWidth:420,
          workspaceTarget:"/workspace"
        }));
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
    # Exact V3 routes are now wide without changing the saved navigation state.
    shell=page.locator('[data-eidos-app-host-layout="workbench"]')
    expect(shell).to_have_attribute("data-eidos-workspace-focused","true")
    assert page.locator('[data-eidos-side-panel]').evaluate(
      "(node) => getComputedStyle(node).display")=="none"
    wide_width=map_form.evaluate("(node) => Math.round(node.getBoundingClientRect().width)")
    assert 1120 <= wide_width <= 1220,("v3-wide-review-width",wide_width)
    focus_toggle=page.locator('[data-eidos-workspace-focus-toggle]')
    expect(focus_toggle).to_be_visible()
    expect(focus_toggle).to_have_attribute("aria-pressed","true")
    saved_layout=page.evaluate("""() => {
      const value=JSON.parse(localStorage.getItem("eidos.workbench.layout")||"{}");
      return {sidePanelVisible:value.sidePanelVisible,sidePanelWidth:value.sidePanelWidth};
    }""")
    focus_toggle.click()
    expect(shell).to_have_attribute("data-eidos-workspace-focused","false")
    expect(page.locator('[data-eidos-side-panel]')).to_be_visible()
    focus_toggle.click()
    expect(shell).to_have_attribute("data-eidos-workspace-focused","true")
    # Existing workbench keyboard shortcut must also reveal/refocus, without
    # clobbering the sidebar preference that other applications use.
    page.keyboard.press("Control+b")
    expect(shell).to_have_attribute("data-eidos-workspace-focused","false")
    expect(page.locator('[data-eidos-side-panel]')).to_be_visible()
    page.keyboard.press("Control+b")
    expect(shell).to_have_attribute("data-eidos-workspace-focused","true")
    # Existing activity-strip navigation must remain usable in focused mode.
    page.locator('[data-eidos-activity-bar] button[data-activity-id="apps"]').click()
    expect(shell).to_have_attribute("data-eidos-workspace-focused","false")
    expect(page.locator('[data-eidos-side-panel]')).to_be_visible()
    focus_toggle.click()
    expect(shell).to_have_attribute("data-eidos-workspace-focused","true")
    final_layout=page.evaluate("""() => {
      const value=JSON.parse(localStorage.getItem("eidos.workbench.layout")||"{}");
      return {sidePanelVisible:value.sidePanelVisible,sidePanelWidth:value.sidePanelWidth};
    }""")
    assert final_layout==saved_layout, (
        "route-focus must not overwrite persisted sidebar preference: "
        + json.dumps({"saved":saved_layout,"actual":final_layout},ensure_ascii=False))
    # An independent user may already have the sidebar OFF in saved layout.
    # The V3 form still gets 1200px, and Ctrl+B must explicitly reveal the
    # original navigation rather than being overridden by default focus.
    hidden_context=browser.new_context(
      viewport={"width":1280,"height":900},locale="zh-CN")
    hidden_context.add_init_script("""
      if(location.origin===%s) {
        localStorage.setItem("evo.context.id",%s);
        localStorage.setItem("evo.locale","zh-CN");
        localStorage.setItem("eidos.workbench.layout",JSON.stringify({
          contractVersion:"0.1.0",activeActivityId:"apps",
          sidePanelVisible:false,sidePanelWidth:420,
          workspaceTarget:"/workspace"
        }));
      }
    """ % (json.dumps(HOST),json.dumps(CTX)))
    hidden_page=hidden_context.new_page()
    hidden_page.goto(HOST+"/?surface=desktop#"+mapping,
      wait_until="domcontentloaded")
    hidden_form=hidden_page.locator('form[data-eidos-id="evo-data-import.mapping"]')
    expect(hidden_form).to_be_visible(timeout=30000)
    hidden_shell=hidden_page.locator('[data-eidos-app-host-layout="workbench"]')
    expect(hidden_shell).to_have_attribute("data-eidos-workspace-focused","true")
    expect(hidden_page.locator('[data-eidos-workspace-focus-toggle]')).not_to_be_visible()
    hidden_width=hidden_form.evaluate(
      "(node) => Math.round(node.getBoundingClientRect().width)")
    assert 1120<=hidden_width<=1220,("saved-hidden-wide-review",hidden_width)
    assert hidden_page.evaluate("""() =>
      JSON.parse(localStorage.getItem("eidos.workbench.layout")).sidePanelVisible
    """) is False
    hidden_page.keyboard.press("Control+b")
    expect(hidden_shell).to_have_attribute("data-eidos-workspace-focused","false")
    expect(hidden_page.locator('[data-eidos-side-panel]')).to_be_visible()
    assert hidden_page.evaluate("""() =>
      JSON.parse(localStorage.getItem("eidos.workbench.layout")).sidePanelVisible
    """) is True, "explicit Ctrl+B must remain effective"
    hidden_context.close()
    expect(map_form.locator('[data-eidos-form-review-table-wrap]')).to_have_attribute(
        'data-eidos-review-table-presentation','compact')
    # Match the full #909 workflow hierarchy: source and actionable issues
    # precede decisions; do not force choices ahead of actual business issues.
    expect(map_form.locator('[data-eidos-task-presentation="workbench"]')).to_be_visible()
    expect(map_form.locator('[data-eidos-form-task-context]')).to_be_visible()
    expect(map_form.locator('[data-eidos-form-task-metrics]')).to_be_visible()
    expect(map_form.locator('[data-eidos-form-task-details]')).to_have_count(0)
    page.screenshot(path=str(OUT/"v3-fidelity-workbench-map-1280.png"),
      full_page=False)
    expect(map_form.locator('input[type="hidden"][name="importJobId"][data-eidos-hidden-field]')).to_have_value(jobid)
    expect(map_form.locator('select[name="importJobId"]')).to_have_count(0)
    expect(map_form.locator('[data-eidos-form-task-context]')).to_contain_text(
        "BEX-SYNTHETIC-RET-172.xlsx")
    expect(map_form.locator('[data-eidos-form-task-overview]')).to_be_visible()
    expect(map_form.locator('[data-eidos-form-task-metric]')).to_have_count(4)
    expect(map_form.locator('[data-eidos-form-task-steps] li')).to_have_count(2)
    # Separate evidence view from the scrollable Eidos shell: capture actual E3
    # overview/metrics rather than assuming a mid-table full_page shot includes it.
    map_form.locator('[data-eidos-form-task-overview]').screenshot(
        path=str(OUT/"v3-e4-task-overview-desktop.png"))
    focus_actions=map_form.locator('[data-eidos-form-task-focus]')
    # This synthetic fixture has already chosen every field: no invented blockers.
    # A focus button appears only for an actual ambiguous/unconfirmed source.
    map_rows=map_form.locator('[data-eidos-form-review-table-row]')
    expect(map_form.locator('table[data-eidos-form-review-table]')).to_be_visible()
    expect(map_rows).to_have_count(22)
    assert map_form.locator('[data-eidos-review-table-detail-row]').count()==0, (
        "Pinned Eidos E4 must not reserve an extra row for collapsed source details")
    expect(map_rows.first.locator(
        '[data-eidos-review-table-evidence] [data-eidos-review-group-detail]')).to_have_count(1)
    expect(map_form.locator('[data-eidos-review-table-choice] select')).to_have_count(22)
    map_filter=map_form.locator('[data-eidos-form-review-table-filter]')
    expect(map_filter).to_have_value("needs")
    expect(map_rows.first).to_be_hidden()
    expect(map_rows.nth(4)).to_be_visible()
    expect(map_rows.nth(4)).to_contain_text("synthetic-4-0001")
    expect(map_rows.nth(4).locator('[data-eidos-review-table-evidence]')).not_to_contain_text(
        "synthetic-4-0002")
    expect(map_rows.nth(4).locator('select[name="map_4"]')).to_have_value("__CREATE__")
    # Eidos E3 task issue focus must recover even a filtered-out row without
    # creating a Host command or changing any form values.
    if focus_actions.count():
        focus_actions.first.click()
        target=focus_actions.first.get_attribute("data-eidos-form-task-focus")
        expect(map_form.locator('[data-eidos-form-review-table-row="'+target+'"]')).to_be_visible()
    map_filter.select_option("all")
    expect(map_rows.first).to_be_visible()
    expect(map_rows.first).to_contain_text("往来编码")
    expect(map_rows.first.locator('select[name="map_0"]')).to_have_value("code")
    # Unambiguous labels remain business-language while submitted option values
    # still carry the original stable schema field ID.
    code_option=map_rows.first.locator('select[name="map_0"] option[value="code"]')
    assert " · code" not in code_option.inner_text()
    map_rows.first.locator('[data-eidos-review-group-detail] summary').click()
    expect(map_rows.first.locator('input[name="sourceEvidence_0"]')).to_be_visible()
    assert "RET-0002" in map_rows.first.locator(
        'input[name="sourceEvidence_0"]').input_value()
    map_rows.nth(4).locator('[data-eidos-review-group-detail] summary').click()
    expect(map_rows.nth(4).locator('input[name="sourceEvidence_4"]')).to_be_visible()
    # The direct single-field create action still exists but is no longer a
    # repetitive long line below every visible select in compact V3 rows.
    expect(map_rows.nth(4).locator(
      '[data-eidos-review-table-evidence] [data-eidos-field-context-link]')).to_be_visible()
    expect(map_rows.nth(4).locator(
      '[data-eidos-review-table-choice] [data-eidos-field-context-link]')).to_have_count(0)
    assert "synthetic-4-0002" in map_rows.nth(4).locator(
        'input[name="sourceEvidence_4"]').input_value()
    expect(map_rows.nth(21).locator('select[name="map_21"]')).to_have_value("__IGNORE__")
    map_filter.select_option("needs")
    expect(map_rows.first).to_be_hidden()
    expect(map_rows.nth(4).locator('select[name="map_4"]')).to_have_value("__CREATE__")
    map_filter.select_option("all")
    expect(map_rows.nth(21)).to_be_visible()
    print("BEX01_V3_E2_ACTUAL_MAP_TABLE_FILTER_PRESERVES_22_VALUES",flush=True)
    assert map_form.locator('[data-eidos-agent-action="ai-auto-map"]').count()==1
    entry=map_form.locator('[data-eidos-field-context-link]')
    expect(entry.first).to_be_visible()
    assert "B 方案" not in map_form.inner_text()
    capture_map_scroll_evidence(page,map_form,"desktop")
    page.screenshot(path=str(OUT/"v3-e2-actual-map-22-rows-desktop.png"),full_page=True)
    print("BEX01_V3_E2_ACTUAL_MAP_22_TABLE_ROWS_PASS:DESKTOP",flush=True)
    # Exiting a focused review route restores the user's regular navigation
    # without altering persisted layout; a second eligible route re-enters focus.
    page.goto(HOST+"/?surface=desktop#/workspace",wait_until="domcontentloaded")
    expect(page.locator('[data-eidos-app-host-layout="workbench"]')).to_have_attribute(
      "data-eidos-workspace-focused","false")
    expect(page.locator('[data-eidos-side-panel]')).to_be_visible()
    assert page.evaluate("""() => {
      const value=JSON.parse(localStorage.getItem("eidos.workbench.layout")||"{}");
      return {sidePanelVisible:value.sidePanelVisible,sidePanelWidth:value.sidePanelWidth};
    }""")==saved_layout, (
      "route exit must not persist a new panel preference")
    batch=reviewed["navigateTo"]
    page.goto(HOST+"/?surface=desktop#"+batch,wait_until="domcontentloaded")
    form=page.locator('form[data-eidos-id="evo-object-extension.batch-import"]')
    expect(form).to_be_visible(timeout=30000)
    expect(page.locator('[data-eidos-app-host-layout="workbench"]')).to_have_attribute(
      "data-eidos-workspace-focused","true")
    expect(form.locator('[data-eidos-task-presentation="workbench"]')).to_be_visible()
    expect(form.locator('[data-eidos-form-task-context]')).to_be_visible()
    expect(form.locator('[data-eidos-form-task-metrics]')).to_be_visible()
    expect(form.locator('[data-eidos-form-task-details]')).to_have_count(0)
    page.screenshot(path=str(OUT/"v3-fidelity-workbench-batch-1280.png"),
      full_page=False)
    expect(form.locator('[data-eidos-form-review-table-wrap]')).to_have_attribute(
        'data-eidos-review-table-presentation','compact')
    expect(form.locator('[data-eidos-form-review-table-row]')).to_have_count(18)
    expect(form.locator('[data-eidos-review-table-choice] select')).to_have_count(18)
    # V3: this authorized Job maps subjectType from an Excel source column.
    # A batch constant would overwrite mixed rows and MUST NOT be offered.
    expect(form.locator('input[name="subjectTypeSourceNotice"]')).to_be_visible()
    expect(form.locator('select[name="batchSubjectType"]')).to_have_count(0)
    plan=form.locator('[data-eidos-form-review-plan]')
    expect(plan).to_be_visible()
    expect(plan.locator('[data-eidos-review-plan-items] li')).to_have_count(18)
    proposed_preview=plan.locator('[data-eidos-review-plan-count="create"] strong')
    ignored_preview=plan.locator('[data-eidos-review-plan-count="ignore"] strong')
    first_plan_proposed=int(proposed_preview.inner_text())
    first_plan_ignored=int(ignored_preview.inner_text())
    # V3: changing a proposed field locally updates status, filter and counts
    # without any creation, mapping write or supplier data submission.
    batch_filter=form.locator('[data-eidos-form-review-table-filter]')
    expect(batch_filter).to_have_value("needs")
    first_batch_row=form.locator('[data-eidos-form-review-table-row]').first
    first_choice=first_batch_row.locator('select[name="choice_0"]')
    expect(first_choice).to_have_value("__CREATE__")
    # Eidos #201: live task counters remain visible while Human choices change.
    proposed_count=form.locator('[data-eidos-form-task-metric-id="proposed"] strong')
    ignored_count=form.locator('[data-eidos-form-task-metric-id="ignored"] strong')
    expect(proposed_count).to_be_visible()
    expect(ignored_count).to_be_visible()
    before_proposed=int(proposed_count.inner_text())
    before_ignored=int(ignored_count.inner_text())
    first_choice.select_option("__IGNORE__")
    expect(first_batch_row).to_have_attribute("data-eidos-review-table-status-key","ignored")
    expect(first_batch_row.locator('[data-eidos-review-table-status]')).to_have_text("不导入")
    expect(proposed_count).to_have_text(str(before_proposed-1))
    expect(ignored_count).to_have_text(str(before_ignored+1))
    expect(first_batch_row).to_be_hidden()
    expect(proposed_preview).to_have_text(str(first_plan_proposed-1))
    expect(ignored_preview).to_have_text(str(first_plan_ignored+1))
    expect(plan.locator('[data-eidos-review-plan-items] li')).to_have_count(18)
    batch_filter.select_option("all")
    expect(first_batch_row).to_be_visible()
    first_choice.select_option("__CREATE__")
    expect(first_batch_row).to_have_attribute("data-eidos-review-table-status-key","proposed")
    expect(first_batch_row.locator('[data-eidos-review-table-status]')).to_have_text("待新增")
    expect(proposed_count).to_have_text(str(before_proposed))
    expect(ignored_count).to_have_text(str(before_ignored))
    expect(proposed_preview).to_have_text(str(first_plan_proposed))
    expect(ignored_preview).to_have_text(str(first_plan_ignored))
    first_batch_row.locator('[data-eidos-review-group-detail] summary').click()
    name_field=first_batch_row.locator('input[name="label_0"]')
    original_name=name_field.input_value()
    name_field.fill("人工审核后的名称")
    expect(plan.locator('[data-eidos-review-plan-items] li').first).to_contain_text("人工审核后的名称")
    assert "仅预览当前未保存的选择" in plan.inner_text()
    plan.locator("h2").scroll_into_view_if_needed()
    page.evaluate("""async () => {await new Promise(done =>
      requestAnimationFrame(()=>requestAnimationFrame(done)));}""")
    page.screenshot(path=str(OUT/"v3-e6-plan-preview-desktop.png"),full_page=False)
    # E7: save the modified proposal without approving a schema field, then
    # navigate away and restore the exact authorized per-Human draft.
    save_draft=form.locator('button[data-eidos-action="save-review-draft"]')
    expect(save_draft).to_be_visible()
    save_draft.click()
    expect(page.locator('[data-eidos-action-status]').last).to_contain_text(
      "unapproved draft",timeout=30000)
    saved_for_actor=command("data-import.get",{"importJobId":jobid})["job"]
    assert len(saved_for_actor.get("batchReviewDrafts",[]))==1, "authorized actor draft missing from stored Job"
    assert any(entry.get("label")=="人工审核后的名称" for entry in saved_for_actor["batchReviewDrafts"][0]["columns"])
    print("BEX01_V3_E7_DRAFT_READ_DIAGNOSTIC="+json.dumps({
      "jobState":saved_for_actor["state"],
      "draftsVisibleToActionActor":[{
        "actor":d.get("actorSubjectId"),
        "columns":len(d.get("columns",[])),
        "hasEditedLabel":any(e.get("label")=="人工审核后的名称" for e in d.get("columns",[]))
      } for d in saved_for_actor.get("batchReviewDrafts",[])]
    },ensure_ascii=False),flush=True)
    fresh_page=api.get("/v1/experience-pages",params={
      "source":"evo-object-extension.from-import","route":batch})
    fresh_page_json=fresh_page.json()
    assert fresh_page.status==200
    assert "draft restored" in fresh_page_json["reviewTask"]["subject"]["statusLabel"]
    print("BEX01_V3_E7_PAGE_READ_DIAGNOSTIC="+json.dumps({
      "status":fresh_page.status,
      "taskStatus":fresh_page_json.get("reviewTask",{}).get("subject",{}).get("statusLabel"),
      "restoredLabel":next((f.get("initialValue") for f in fresh_page_json.get("fields",[])
        if f.get("key")=="label_0"),None)
    },ensure_ascii=False),flush=True)
    # Same-URL hash navigation can leave the mounted SPA page untouched.
    # Force real re-entry through a full document reload before asserting restore.
    page.reload(wait_until="domcontentloaded")
    form=page.locator('form[data-eidos-id="evo-object-extension.batch-import"]')
    expect(form).to_be_visible(timeout=30000)
    expect(form.locator('[data-eidos-form-task-source-status]')).to_contain_text(
      "草稿已恢复")
    first_batch_row=form.locator('[data-eidos-form-review-table-row]').first
    batch_filter=form.locator('[data-eidos-form-review-table-filter]')
    batch_filter.select_option("all")
    first_choice=first_batch_row.locator('select[name="choice_0"]')
    expect(first_choice).to_have_value("__CREATE__")
    first_batch_row.locator('[data-eidos-review-group-detail] summary').click()
    name_field=first_batch_row.locator('input[name="label_0"]')
    expect(name_field).to_have_value("人工审核后的名称")
    name_field.scroll_into_view_if_needed()
    page.screenshot(path=str(OUT/"v3-e7-owner-draft-restored-desktop.png"),
      full_page=False)
    # This scenario later verifies original business fields were preserved.
    # Restore the intentionally edited *unsaved* test input before approval.
    name_field.fill(original_name)
    plan=form.locator('[data-eidos-form-review-plan]')
    expect(plan.locator('[data-eidos-review-plan-items] li').first).to_contain_text(original_name)
    form.locator('button[data-eidos-action="save-review-draft"]').click()
    expect(page.locator('[data-eidos-action-status]').last).to_contain_text(
      "unapproved draft",timeout=30000)
    batch_filter.select_option("needs")
    expect(first_batch_row).to_be_visible()
    print("BEX01_V3_LIVE_CHOICE_STATUS_NO_HOST_WRITE_PASS",flush=True)
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
    # Small screens keep the existing Eidos single-column navigation. The
    # desktop-only route focus toggle must not occupy 390px toolbar space.
    expect(small.locator('[data-eidos-workspace-focus-toggle]')).not_to_be_visible()
    expect(mobile_map.locator('[data-eidos-form-review-table-row]')).to_have_count(22)
    mobile_filter=mobile_map.locator('[data-eidos-form-review-table-filter]')
    expect(mobile_filter).to_have_value("needs")
    mobile_map_group=mobile_map.locator('[data-eidos-form-review-table-row]').nth(4)
    expect(mobile_map_group.locator('select[name="map_4"]')).to_be_visible()
    mobile_map_group.locator('[data-eidos-review-group-detail] summary').click()
    expect(mobile_map_group.locator('input[name="sourceEvidence_4"]')).to_be_visible()
    mobile_map.locator('[data-eidos-form-task-overview]').screenshot(
        path=str(OUT/"v3-e4-task-overview-phone.png"))
    mobile_filter.select_option("all")
    expect(mobile_map.locator('[data-eidos-form-review-table-row]').first).to_be_visible()
    expect(mobile_map.locator('select[name="map_0"]')).to_have_value("code")
    assert small.evaluate("document.documentElement.scrollWidth <= innerWidth + 2")
    mobile_geometry=small.evaluate("""() => {
      const form=document.querySelector('form[data-eidos-id="evo-data-import.mapping"]');
      const rows=[...form.querySelectorAll('[data-eidos-form-review-table-row]')];
      const aligned=rows.filter(row => !row.hidden).map(row => {
        const subject=row.querySelector('[data-eidos-review-table-subject]');
        const status=row.querySelector('[data-eidos-review-table-status]');
        const choice=row.querySelector('[data-eidos-review-table-choice] select');
        const s=subject.getBoundingClientRect(),t=status.getBoundingClientRect();
        const textRange=document.createRange();
        textRange.selectNodeContents(subject);
        return {name:subject.innerText,status:status.innerText,
          aligned:Math.abs((s.top+s.bottom-t.top-t.bottom)/2)<=16,
          subjectWidth:Math.round(s.width),
          subjectTextLines:textRange.getClientRects().length,
          choiceHeight:choice.getBoundingClientRect().height};
      });
      let scroller=form;
      while(scroller && scroller.scrollHeight<=scroller.clientHeight+40)
        scroller=scroller.parentElement;
      return {totalRows:rows.length,visibleRows:aligned.length,
        aligned:aligned.every(x=>x.aligned),
        minChoiceHeight:Math.min(...aligned.map(x=>x.choiceHeight)),
        scrollHeight:scroller?.scrollHeight,
        scrollerViewport:scroller?.clientHeight,
        statusExamples:aligned.slice(0,4)};
    }""")
    assert mobile_geometry["totalRows"]==22,mobile_geometry
    assert mobile_geometry["visibleRows"]==22,mobile_geometry
    assert mobile_geometry["aligned"],mobile_geometry
    first_fields=mobile_geometry["statusExamples"][:4]
    assert all(item["subjectWidth"]>=120 for item in first_fields),first_fields
    assert all(item["subjectTextLines"]==1 for item in first_fields),first_fields
    assert mobile_geometry["minChoiceHeight"]>=44,mobile_geometry
    # Prior same fixture at 390px: 9,139px (#978 exact-HEAD artifact).
    # All original 22 source cards are still visible; inline status eliminates
    # a repeated dedicated heading/row without hiding inputs or source values.
    assert mobile_geometry["scrollHeight"]<9139,mobile_geometry
    (OUT/"v3-e4-mobile-inline-status-measurement.json").write_text(
      json.dumps({"source":"Eidos #193 generic mobile CSS; isolated synthetic Host",
        "baselineScrollHeight":9139,"measured":mobile_geometry},
        ensure_ascii=False,indent=2),encoding="utf8")
    print("BEX01_E4_MOBILE_INLINE_STATUS_ALIGNMENT_PASS",flush=True)
    capture_map_scroll_evidence(small,mobile_map,"phone")
    small.screenshot(path=str(OUT/"v3-e2-actual-map-22-rows-phone.png"),full_page=True)
    print("BEX01_V3_E2_ACTUAL_MAP_22_TABLE_ROWS_PASS:PHONE",flush=True)
    small.goto(HOST+"/?surface=desktop#"+batch,wait_until="domcontentloaded")
    mobile_form=small.locator('form[data-eidos-id="evo-object-extension.batch-import"]')
    expect(mobile_form).to_be_visible(timeout=30000)
    small.screenshot(path=str(OUT/"v3-fidelity-first-viewport-batch-390.png"),
      full_page=False)
    expect(mobile_form.locator('[data-eidos-form-review-table-row]')).to_have_count(18)
    expect(mobile_form.locator('[data-eidos-review-table-choice] select')).to_have_count(18)
    expect(mobile_form.locator('input[name="subjectTypeSourceNotice"]')).to_be_visible()
    expect(mobile_form.locator('select[name="batchSubjectType"]')).to_have_count(0)
    mobile_plan=mobile_form.locator('[data-eidos-form-review-plan]')
    expect(mobile_plan.locator('[data-eidos-review-plan-items] li')).to_have_count(18)
    expect(mobile_plan.locator('[data-eidos-review-plan-count="create"] strong')).to_be_visible()
    mobile_plan.locator("h2").scroll_into_view_if_needed()
    small.evaluate("""async () => {await new Promise(done =>
      requestAnimationFrame(()=>requestAnimationFrame(done)));}""")
    small.screenshot(path=str(OUT/"v3-e6-plan-preview-phone.png"),full_page=False)
    mobile_group=mobile_form.locator('[data-eidos-form-review-table-row]').first
    mobile_group.locator('[data-eidos-review-group-detail] summary').click()
    expect(mobile_group.locator('input[name="label_0"]')).to_be_visible()
    geometry=small.evaluate("""() => ({
      viewport:innerWidth,document:document.documentElement.scrollWidth
    })""")
    assert geometry["document"]<=geometry["viewport"]+2,geometry
    small.screenshot(path=str(OUT/"v3-eidos-v3-batch-17-review-table-phone.png"),full_page=True)
    phone.close()
    print("BEX01_V3_EIDOS_BATCH_REVIEW_TABLE_18_PHONE_PASS",flush=True)
    for i,label in enumerate(FIELDS):
        expect(form.locator('select[name="choice_%d"]'%i)).to_have_value("__CREATE__")
        expect(form.locator('input[name="label_%d"]'%i)).to_have_value(label)
    expect(form.locator('input[name="sample_0"]')).to_have_value(
      re.compile(r"synthetic-4-0001"))
    expect(form.locator('input[name="sample_16"]')).to_have_value(
      re.compile(r"synthetic-20-0001"))
    page.screenshot(path=str(OUT/"v3-retained-xlsx-batch-17-fields.png"),
                    full_page=True)
    approval=form.locator('button[data-eidos-action="create-extension-batch"]')
    expect(approval).to_have_count(1)
    approval.click()
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
