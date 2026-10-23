#!/usr/bin/env python3
"""Real isolated Host+Chromium XLSX journey using GENERATED synthetic values only.

172 rows / 22 columns / three blank subjectTypes resembles the disclosed
structural edge case, NOT the customer's original private XLSX or an
authenticated production import. No production credentials or endpoints.
"""
import json
from pathlib import Path
from playwright.sync_api import sync_playwright, expect

OUT=Path("artifacts/bex01-browser")
fixture=json.loads((OUT/"fixture.json").read_text())
assert fixture["isolated"] and not fixture["productionUsed"]
assert fixture["hostUrl"].startswith("http://127.0.0.1:")
assert fixture["syntheticXlsxRows"]==172
assert fixture["syntheticXlsxColumns"]==22
missing=fixture["syntheticXlsxMissingRows"]
assert missing==[165,169,172]
HOST=fixture["hostUrl"];CTX=fixture["contextId"]
job=fixture["syntheticXlsxJobId"]
review_route="/data-import/jobs/"+job+"/review"

with sync_playwright() as browser_api:
    browser=browser_api.chromium.launch(headless=True)
    def context(width,phone=False):
        profile=browser.new_context(viewport={"width":width,"height":844},
            is_mobile=phone,has_touch=phone,locale="zh-CN")
        profile.add_init_script("""
          if(location.origin===%s){
            localStorage.setItem("evo.context.id",%s);
            localStorage.setItem("evo.locale","zh-CN");
          }
        """ % (json.dumps(HOST),json.dumps(CTX)))
        return profile

    def review(page):
        page.goto(HOST+"/?surface=desktop#"+review_route,
                  wait_until="domcontentloaded")
        locator=page.locator('[data-eidos-id="evo-data-import.review"]')
        expect(locator).to_be_visible(timeout=30000)
        return locator

    def assert_unmodified_review(el, label):
        sources=el.locator('[data-eidos-catalog-item^="source:"]')
        expect(sources).to_have_count(22)
        for index,name in [(0,"往来编码"),(1,"往来名称"),(2,"主体类型"),
                           (3,"开户银行"),(21,"原系统备注")]:
            expect(el.locator('[data-eidos-catalog-item="source:%d"]' % index)
                   ).to_contain_text(name)
        expect(el.locator('[data-eidos-catalog-item="source:3"]')
               ).to_contain_text("测试银行")
        expect(el.locator('[data-eidos-catalog-item="source:21"]')
               ).to_contain_text("已忽略")
        for index in missing:
            expect(el.locator('[data-eidos-catalog-item="row:%d"]' % index)
                   ).to_contain_text("主体类型：（空）")
        assert el.locator('[data-eidos-catalog-action="commit"]').count()==0
        print("BEX01_V3_SYNTHETIC_XLSX_22_SOURCE_REVIEW_PASS:"+label,flush=True)

    # Phone viewport: all 22 source columns and three end-of-file errors are
    # accessible without horizontal overflow; perform the first real correction.
    phone=context(390,True)
    p=phone.new_page()
    page_review=review(p)
    assert_unmodified_review(page_review,"PHONE")
    geometry=p.evaluate("""() => ({
      viewport:innerWidth,document:document.documentElement.scrollWidth
    })""")
    assert geometry["document"]<=geometry["viewport"]+2,geometry
    target=page_review.locator('[data-eidos-catalog-item="row:165"]')
    expect(target).to_be_visible()
    target.locator('[data-eidos-catalog-action="correct-row:165"]').click()
    form=p.locator('form[data-eidos-id="evo-data-import.row-correct"]')
    expect(form).to_be_visible(timeout=30000)
    expect(form).to_contain_text("Excel 原值")
    expect(form.locator('select[name="sourceColumn"]')).to_have_value("主体类型")
    expect(form.locator('select[name="value"]')).to_have_value("")
    bounds=form.locator('select[name="value"]').bounding_box()
    assert bounds and bounds["height"]>=32,bounds
    form.locator('select[name="value"]').select_option("ORGANIZATION")
    p.screenshot(path=str(OUT/"synthetic-xlsx-172-correction-phone.png"),
                 full_page=True)
    form.locator('button[type="submit"]').click()
    page_review=p.locator('[data-eidos-id="evo-data-import.review"]')
    expect(page_review).to_be_visible(timeout=30000)
    expect(page_review.locator('[data-eidos-catalog-item="row:169"]')
           ).to_contain_text("主体类型：（空）")
    expect(page_review.locator('[data-eidos-catalog-item="row:172"]')
           ).to_contain_text("主体类型：（空）")
    assert page_review.locator('[data-eidos-catalog-action="commit"]').count()==0
    print("BEX01_V3_SYNTHETIC_XLSX_PHONE_CORRECTION_PASS:165",flush=True)
    phone.close()

    # New browser session, same durable Host enterprise job: the first
    # correction survives navigation and the remaining two are still flagged.
    desktop=context(1280)
    p=desktop.new_page()
    page_review=review(p)
    expect(page_review.locator('[data-eidos-catalog-item="row:165"]')
           ).to_contain_text("查看或撤销本行更正")
    for row_number in missing[1:]:
        target=page_review.locator(
            '[data-eidos-catalog-item="row:%d"]' % row_number)
        expect(target).to_be_visible()
        target.locator(
            '[data-eidos-catalog-action="correct-row:%d"]' % row_number
        ).click()
        form=p.locator('form[data-eidos-id="evo-data-import.row-correct"]')
        expect(form).to_be_visible(timeout=30000)
        expect(form.locator('select[name="value"]')).to_have_value("")
        form.locator('select[name="value"]').select_option("ORGANIZATION")
        form.locator('button[type="submit"]').click()
        page_review=p.locator('[data-eidos-id="evo-data-import.review"]')
        expect(page_review).to_be_visible(timeout=30000)
        if row_number==169:
            assert page_review.locator(
                '[data-eidos-catalog-action="commit"]').count()==0
    commit=page_review.locator('[data-eidos-catalog-action="commit"]')
    expect(commit).to_be_visible(timeout=30000)
    expect(page_review.locator('[data-eidos-catalog-item^="source:"]')
           ).to_have_count(22)
    expect(page_review.locator('[data-eidos-catalog-item="source:21"]')
           ).to_contain_text("已忽略")
    p.screenshot(path=str(OUT/"synthetic-xlsx-172-ready-desktop.png"),
                 full_page=True)
    p.on("dialog",lambda dialog: dialog.accept())
    commit.click()
    p.wait_for_timeout(900)
    # Actual enterprise Business Data must now be visible through the
    # already installed suppliers' governed Human list, not a mock receipt.
    supplier_route=fixture["route"]
    p.goto(HOST+"/?surface=desktop#"+supplier_route,
           wait_until="domcontentloaded")
    catalog=p.locator('[data-eidos-id="evo-counterparty.projection.counterparty.suppliers"]')
    expect(catalog).to_be_visible(timeout=30000)
    p.locator('[data-eidos-catalog-server-search] input[name="search"]'
             ).fill("Synthetic Supplier 0172")
    p.locator('[data-eidos-catalog-server-search] button[type="submit"]'
             ).click()
    expect(p.locator('[data-eidos-catalog-table] tbody tr')).to_have_count(1)
    expect(p.locator('[data-eidos-catalog-table] tbody tr')).to_contain_text(
        "Synthetic Supplier 0172")
    p.screenshot(path=str(OUT/"synthetic-xlsx-172-committed-desktop.png"),
                 full_page=True)
    print("BEX01_V3_SYNTHETIC_XLSX_172_IMPORT_PASS:ISOLATED_HOST",flush=True)
    desktop.close()
    browser.close()
