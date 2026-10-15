#!/usr/bin/env python3
"""Verify actual isolated Host row correction, automatic preflight and revert in Chromium."""
import json
from pathlib import Path
from playwright.sync_api import sync_playwright, expect

out=Path("artifacts/bex01-browser")
fixture=json.loads((out/"fixture.json").read_text())
assert fixture["isolated"] and not fixture["productionUsed"]
host=fixture["hostUrl"]; context_id=fixture["contextId"]
job=fixture["failedJobId"]
review="/data-import/jobs/"+job+"/review"
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True)
 for width,mobile in [(1280,False),(390,True)]:
  context=browser.new_context(viewport={"width":width,"height":844},
      locale="zh-CN",is_mobile=mobile,has_touch=mobile)
  context.add_init_script("""
   if (location.origin === %s) {
    localStorage.setItem("evo.context.id", %s);
    localStorage.setItem("evo.locale", "zh-CN");
   }
  """ % (json.dumps(host),json.dumps(context_id)))
  page=context.new_page()
  page.goto(host+"/?surface=desktop#"+review,wait_until="domcontentloaded")
  root=page.locator('[data-eidos-id="evo-data-import.review"]')
  expect(root).to_be_visible(timeout=30000)
  row=root.locator('[data-eidos-catalog-item="row:1"]')
  expect(row).to_contain_text("主体类型")
  row.locator('[data-eidos-catalog-action="correct-row:1"]').click()
  form=page.locator('form[data-eidos-id="evo-data-import.row-correct"]')
  expect(form).to_be_visible(timeout=20000)
  expect(form.locator('select[name="sourceColumn"]')).to_have_value("主体类型")
  expect(form.locator('select[name="value"]')).to_have_value("")
  expect(form).to_contain_text("Excel 原值")
  if mobile:
   width_data=page.evaluate("""() => ({
     width:innerWidth,scroll:document.documentElement.scrollWidth
   })""")
   assert width_data["scroll"] <= width_data["width"] + 2, width_data
   control=form.locator('select[name="value"]')
   bounds=control.bounding_box()
   assert bounds and bounds["height"]>=32, bounds
  form.locator('select[name="value"]').select_option("ORGANIZATION")
  page.screenshot(path=str(out/("v3-correction-phone.png" if mobile
                else "v3-correction-desktop.png")),full_page=True)
  form.locator('button[type="submit"]').click()
  review_page=page.locator('[data-eidos-id="evo-data-import.review"]')
  expect(review_page).to_be_visible(timeout=30000)
  expect(review_page.locator('[data-eidos-catalog-action="commit"]')).to_have_count(0)
  expect(review_page.locator('[data-eidos-catalog-item="row:2"]')).to_contain_text("主体类型")
  fixed=review_page.locator('[data-eidos-catalog-item="row:1"]')
  expect(fixed).to_contain_text("查看或撤销本行更正")
  fixed.locator('[data-eidos-catalog-action="correct-row:1"]').click()
  form=page.locator('form[data-eidos-id="evo-data-import.row-correct"]')
  expect(form).to_be_visible(timeout=20000)
  expect(form.locator('select[name="value"]')).to_have_value("ORGANIZATION")
  form.locator('select[name="mode"]').select_option("REVERT")
  form.locator('button[type="submit"]').click()
  review_page=page.locator('[data-eidos-id="evo-data-import.review"]')
  expect(review_page).to_be_visible(timeout=30000)
  expect(review_page.locator('[data-eidos-catalog-item="row:1"]')).to_contain_text("主体类型：（空）")
  print("BEX01_V3_ROW_CORRECTION_HOST_PASS:"+("PHONE" if mobile else "DESKTOP"),flush=True)
  context.close()
 browser.close()
