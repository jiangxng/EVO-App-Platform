#!/usr/bin/env python3
"""Capture pinned #909 and actual isolated Host side by side, without fake import approval.

This is an automated functional/layout/color evidence gate, NOT Human 100% signoff.
The reference is a pinned, hashed *demo*; the current implementation is a genuine
isolated enterprise Host with authorized synthetic data, never customer content.
"""
import json
from pathlib import Path
from playwright.sync_api import sync_playwright, expect

OUT=Path("artifacts/bex01-browser")
fixture=json.loads((OUT/"fixture.json").read_text(encoding="utf-8"))
assert fixture["isolated"] is True and fixture["productionUsed"] is False
assert fixture["hostUrl"].startswith("http://127.0.0.1:")
assert fixture["visualReviewRows"]==172 and fixture["visualReviewColumns"]==22
HOST=fixture["hostUrl"];CTX=fixture["contextId"];JOB=fixture["visualReviewJobId"]
PROTOTYPE=OUT/"approved-v3-prototype.html"
assert PROTOTYPE.is_file()
REFERENCE_BLOB="9f57e9320eb527786ff7b737be27777eba6f8a92"
EXPECTED_STATUS={
  "matched":(16,"rgb(234, 247, 241)","rgb(24, 118, 90)"),
  "proposed":(4,"rgb(238, 245, 253)","rgb(43, 101, 170)"),
  # The Host can distinguish pending vs suggested vs attention. The three
  # durable task issues include row errors and MUST NOT be equated to yellow
  # table rows. All three source-risk states share the pinned warning palette.
  "attention":(None,"rgb(255, 246, 231)","rgb(166, 103, 18)"),
  "pending":(None,"rgb(255, 246, 231)","rgb(166, 103, 18)"),
  "suggested":(None,"rgb(255, 246, 231)","rgb(166, 103, 18)")
}
observations={"reference":{"commit":"af58e0abad880439d54230485305bf2b4e05decc",
   "blob":REFERENCE_BLOB,"demoOnly":True},
   "actual":{"source":"isolated real Host", "synthetic":True,
     "jobIdRedacted":True,"authorizedCustomerImport":False},
   "humanSignoff":False,"viewports":[]}

def color(el,property_name):
    return el.evaluate("""(node,key) => getComputedStyle(node)[key]""",property_name)

def box(locator):
    r=locator.bounding_box()
    assert r and r["height"]>0 and r["width"]>0,r
    return {k:round(r[k],1) for k in ("x","y","width","height")}

with sync_playwright() as pw:
    browser=pw.chromium.launch(headless=True)
    for width,mobile in [(1280,False),(390,True)]:
        # Original locked, unmodified #909 HTML. Its demo-only source and
        # scripted mock decisions must NOT be interpreted as Host evidence.
        reference_context=browser.new_context(
            viewport={"width":width,"height":844},locale="zh-CN",
            color_scheme="light",is_mobile=mobile,has_touch=mobile)
        reference=reference_context.new_page()
        reference.goto(PROTOTYPE.resolve().as_uri(),wait_until="domcontentloaded")
        expect(reference.locator("#resumeImport")).to_be_visible(timeout=15000)
        reference.locator("#resumeImport").click()
        expect(reference.locator("#review")).to_be_visible()
        assert color(reference.locator("body"),"backgroundColor")=="rgb(245, 247, 250)"
        ref_issue=reference.locator("#bankIssue")
        expect(ref_issue).to_be_visible()
        ref_metrics=reference.locator(".metrics")
        assert ref_metrics.locator(".metric").count()==4
        # Use identical visible viewports for fair first-screen comparison;
        # retain the demo's full document separately as reference-only evidence.
        reference.screenshot(path=str(OUT/f"v3-locked-prototype-{width}px.png"),full_page=False)
        reference.screenshot(path=str(OUT/f"v3-locked-prototype-{width}px-document.png"),full_page=True)
        reference_data={
            "pageBackground":color(reference.locator("body"),"backgroundColor"),
            "font":color(reference.locator("body"),"color"),
            "metrics":box(ref_metrics),
            "firstIssue":box(ref_issue),
            "table":box(reference.locator(".mappingpanel")),
            "mockSaveNotice":True
        }
        reference_context.close()

        # This is a real mounted platform page and a real staged XLSX task.
        host_context=browser.new_context(viewport={"width":width,"height":844},
            locale="zh-CN",color_scheme="light",is_mobile=mobile,has_touch=mobile)
        host_context.add_init_script("""
          if(location.origin===%s){
            localStorage.setItem("evo.context.id",%s);
            localStorage.setItem("evo.locale","zh-CN");
          }
        """ % (json.dumps(HOST),json.dumps(CTX)))
        page=host_context.new_page()
        post_actions=[]
        page.on("request",lambda req: post_actions.append(req.url)
            if req.method=="POST" and "/v1/actions" in req.url else None)
        page.goto(HOST+"/?surface=desktop#/data-import/jobs/"+JOB+"/map",
            wait_until="domcontentloaded")
        form=page.locator('form[data-eidos-id="evo-data-import.mapping"]')
        expect(form).to_be_visible(timeout=30000)
        expect(form).to_contain_text("BEX-V3-VISUAL-REVIEW-SYNTHETIC.xlsx")
        assert "172 条记录" in form.inner_text()
        assert "22 列" in form.inner_text()
        metrics=form.locator('[data-eidos-form-task-metrics]')
        expect(metrics.locator('[data-eidos-form-task-metric]')).to_have_count(4)
        counts={key:metrics.locator(
            f'[data-eidos-form-task-metric-id="{key}"] strong').inner_text()
            for key in ("matched","proposed","ignored","attention")}
        assert counts=={"matched":"16","proposed":"4","ignored":"0","attention":"3"},counts
        issues=form.locator('[data-eidos-form-task-issue]')
        expect(issues).to_have_count(3)
        assert "开户银行" in form.inner_text()
        assert "主体类型" in form.inner_text()
        assert "系统编码" in form.inner_text()
        assert form.locator('[data-eidos-form-task-issue-page]').count()==0
        rows=form.locator('[data-eidos-form-review-table-row]')
        expect(rows).to_have_count(22)
        selected=form.locator('[data-eidos-form-review-table-filter]')
        assert selected.count()==1
        selected.select_option("all")
        expect(rows.first).to_be_visible()

        swatches={}
        for key,(expected_count,bg,fg) in EXPECTED_STATUS.items():
            matching=form.locator(
                f'[data-eidos-form-review-table-row][data-eidos-review-table-status-key="{key}"]')
            count=matching.count()
            if expected_count is not None:
                assert count==expected_count,(key,count)
            if count==0:
                continue
            badge=matching.first.locator('[data-eidos-review-table-status-badge]')
            expect(badge).to_be_visible()
            swatches[key]={"count":count,"background":color(badge,"backgroundColor"),
                "text":color(badge,"color")}
            assert swatches[key]["background"]==bg,(key,swatches[key],bg)
            assert swatches[key]["text"]==fg,(key,swatches[key],fg)
        risk_rows=sum(swatches.get(key,{}).get("count",0)
            for key in ("attention","pending","suggested"))
        assert risk_rows==2,("Two undecided SOURCE columns, not three durable issues",swatches)
        assert sum(item["count"] for item in swatches.values())==22,swatches

        # Verify an actual unsaved Human choice changes only the local view,
        # and reset restores it without running a Host action or preflight.
        bank=form.locator('[data-eidos-form-review-table-row="map-source-20"]')
        bank_select=bank.locator('select[name="map_20"]')
        original_bank_target=bank_select.input_value()
        # The Host may have already approved an enterprise extension field.
        # Its real ext_* ID is authoritative; never hardcode __PENDING__ or
        # infer a customer bank-field identity from a demo fixture.
        assert original_bank_target and original_bank_target!="__IGNORE__"
        original_bank_tone=bank.get_attribute("data-eidos-review-table-status-key")
        assert original_bank_tone in ("attention","pending","suggested","matched"),original_bank_tone
        bank_select.select_option("__IGNORE__")
        expect(bank).to_have_attribute("data-eidos-review-table-status-key","ignored")
        assert color(bank.locator('[data-eidos-review-table-status-badge]'),
                     "backgroundColor")=="rgb(240, 243, 246)"
        assert metrics.locator(
            '[data-eidos-form-task-metric-id="attention"] strong').inner_text()=="3"
        form.locator('[data-eidos-form-task-reset]').click()
        expect(bank_select).to_have_value(original_bank_target)
        expect(bank).to_have_attribute("data-eidos-review-table-status-key",original_bank_tone)
        assert post_actions==[],post_actions

        # Capture the business-field editing position, then explicitly reset
        # the actual Host's inner scroll container for a FAIR first viewport
        # image against the reference's initial review viewport. "full_page"
        # alone does not scroll overflow:auto workbench content into view.
        page.screenshot(path=str(OUT/f"v3-real-host-{width}px-mapping-end.png"),
            full_page=False)
        workspace_scroll=page.locator('[data-eidos-workspace-content]')
        assert workspace_scroll.count()==1
        workspace_scroll.evaluate("(node) => {node.scrollTop=0; node.scrollLeft=0;}")
        assert workspace_scroll.evaluate("(node) => node.scrollTop")==0
        expect(form.locator('[data-eidos-page-header]')).to_be_visible()
        # The actual platform app provides a governed Host shell, not the
        # source demo topbar. Compare the content order and behavior only.
        content=form.locator('[data-eidos-form-task-context]')
        table=form.locator('[data-eidos-form-review-table-wrap]')
        issuebox=form.locator('[data-eidos-form-task-issues]')
        assert box(content)["y"] <= box(metrics)["y"] <= box(issuebox)["y"] <= box(table)["y"]
        assert color(form,"color")=="rgb(23, 43, 68)"
        assert color(metrics.locator('[data-eidos-form-task-metric-id="attention"]'),
                     "backgroundColor")=="rgb(255, 253, 250)"
        dimensions=page.evaluate("""() => ({
          viewport:innerWidth,scroll:document.documentElement.scrollWidth
        })""")
        assert dimensions["scroll"]<=dimensions["viewport"]+2,dimensions
        if mobile:
            control=bank.locator('select[name="map_20"]')
            assert box(control)["height"]>=32
            # Card adaptation is intentional rather than forced desktop table scroll.
            assert table.evaluate("""node =>
              getComputedStyle(node.querySelector("tbody tr")).display""") in ("block","grid")
        actual_data={
          "formTextColor":color(form,"color"),
          "attentionMetricBackground":color(metrics.locator(
            '[data-eidos-form-task-metric-id="attention"]'),"backgroundColor"),
          "counts":counts,"sourceColumns":rows.count(),"issues":issues.count(),
          "sourceStatusChips":swatches,
          "fileContext":box(content),"metrics":box(metrics),
          "firstViewportScrollTop":workspace_scroll.evaluate("(node) => node.scrollTop"),
          "issuesRegion":box(issuebox),"table":box(table),
          "horizontalOverflow":dimensions["scroll"]>dimensions["viewport"]+2,
          "unsavedChoiceReset":True,"actionsDispatchedOnLocalChoice":len(post_actions),
          "realHostAuthAndApprovalPreserved":True
        }
        assert box(content)["y"]>=0,("Comparison must use the Host first viewport",box(content))
        page.screenshot(path=str(OUT/f"v3-real-host-{width}px.png"),full_page=False)
        observations["viewports"].append({"width":width,"phone":mobile,
            "reference":reference_data,"realHost":actual_data})
        host_context.close()
        print("BEX01_V3_REAL_HOST_PINNED_SOURCE_PARITY_PASS:"+str(width),flush=True)
    browser.close()

(OUT/"v3-prototype-host-parity-observation.json").write_text(
    json.dumps(observations,ensure_ascii=False,indent=2),encoding="utf-8")
(OUT/"v3-prototype-host-human-review.html").write_text("""<!doctype html>
<html lang="zh-CN"><head><meta charset="utf-8"><title>BEX M06 source / Host visual review</title>
<style>body{font-family:system-ui;margin:24px;color:#172b44;background:#f5f7fa}
section{margin:24px 0}h2{font-size:21px}p{line-height:1.6}
.photos{display:grid;grid-template-columns:1fr 1fr;gap:12px}
img{width:100%;border:1px solid #ced9e4;background:#fff;object-fit:contain;object-position:top}
@media(max-width:640px){.photos{grid-template-columns:1fr}}</style></head>
<body><h1>BEX-01 V3 · M06 · 原型与真实 Host 对照</h1>
<p>左：#909 锁定的演示原型；右：隔离 Host 的合成 Excel。两边的数据和外壳不同，
只用于功能／布局／颜色分轴人工核对；绝不代表客户实际导入、视觉 100% 或授权发布。</p>
""" + "\n".join(f"""<section><h2>{v}px</h2><div class="photos">
<div><h3>已锁定原型</h3><img src="v3-locked-prototype-{v}px.png"></div>
<div><h3>真实 Host</h3><img src="v3-real-host-{v}px.png"></div></div></section>"""
for v in (1280,390))+
"""<p>左、右均为相同尺寸的首屏快照。完整原型另见 -document.png；
真实 Host 的业务表格末端另见 -mapping-end.png，
不得把内部滚动状态误判成布局差异。</p>
<p>机器验证结果：见 v3-prototype-host-parity-observation.json。
布局宽度、真实 Host 认证壳、新字段审批和显式保存差异仍须 Human 决策。</p>
</body></html>""",encoding="utf-8")
