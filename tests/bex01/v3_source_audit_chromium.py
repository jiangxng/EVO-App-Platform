#!/usr/bin/env python3
"""Independent real-Host/source-audit Chromium checks using disposable fixture."""
import json
from pathlib import Path
from playwright.sync_api import sync_playwright, expect

OUT = Path("artifacts/bex01-browser")
fixture = json.loads((OUT / "fixture.json").read_text())
assert fixture["isolated"] and not fixture["productionUsed"]
host = fixture["hostUrl"]
ctx = fixture["contextId"]
route = "/data-import/jobs/" + fixture["failedJobId"] + "/review"

with sync_playwright() as playwright:
    browser = playwright.chromium.launch(headless=True)
    for width, height, mobile in [(1280, 820, False), (390, 844, True)]:
        context = browser.new_context(
            viewport={"width": width, "height": height},
            is_mobile=mobile, has_touch=mobile, locale="zh-CN")
        context.add_init_script("""
          if (location.origin === %s) {
            localStorage.setItem("evo.context.id", %s);
            localStorage.setItem("evo.locale", "zh-CN");
          }
        """ % (json.dumps(host), json.dumps(ctx)))
        page = context.new_page()
        page.goto(host + "/?surface=desktop#" + route, wait_until="domcontentloaded")
        review = page.locator('[data-eidos-id="evo-data-import.review"]')
        expect(review).to_be_visible(timeout=30000)
        # Compare actual raw CSV source, not transformed/prepared values.
        for index, name in enumerate(["往来编码", "往来名称", "主体类型"]):
            item = review.locator('[data-eidos-catalog-item="source:%d"]' % index)
            expect(item).to_be_visible()
            expect(item).to_contain_text(name)
        issue = review.locator('[data-eidos-catalog-item="row:1"]')
        expect(issue).to_be_visible()
        expect(issue).to_contain_text("主体类型：（空）")
        source = review.locator('[data-eidos-catalog-item="source:2"]')
        expect(source).to_contain_text("本列样本均为空")
        edit = source.locator('[data-eidos-catalog-action="review-source:2"]')
        expect(edit).to_be_visible()
        expect(edit).to_contain_text("核对或调整本列")
        assert review.locator('[data-eidos-catalog-action="commit"]').count() == 0
        if mobile:
            dimensions = page.evaluate("""() => ({
              width:innerWidth, scroll:document.documentElement.scrollWidth
            })""")
            assert dimensions["scroll"] <= dimensions["width"] + 2, dimensions
            bounds = edit.bounding_box()
            assert bounds and bounds["width"] > 0 and bounds["height"] >= 32, bounds
        page.screenshot(path=str(OUT / ("v3-source-audit-phone.png" if mobile
                                             else "v3-source-audit-desktop.png")),
                        full_page=True)
        edit.click()
        expect(page.locator('form[data-eidos-id="evo-data-import.mapping"]')).to_be_visible(timeout=25000)
        context.close()
        print("BEX01_V3_HOST_SOURCE_AUDIT_PASS:" + ("PHONE" if mobile else "DESKTOP"), flush=True)
    browser.close()
