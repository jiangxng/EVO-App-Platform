#!/usr/bin/env python3
"""CV04 physical Chromium on a disposable ACTUAL installed Host.

Not a production login, a Tokyo live-account test or a claim that a human
clicked anything. This runs Eidos' real JS, ActionHost HTTP and Blob download.
"""
import csv
import io
import json
from pathlib import Path
from playwright.sync_api import sync_playwright, expect

OUT=Path("artifacts/cv04-csv-browser")
fixture=json.loads((OUT/"fixture.json").read_text(encoding="utf-8"))
assert fixture["isolated"] is True and fixture["productionUsed"] is False
HOST=fixture["hostUrl"]; CTX=fixture["contextId"]
assert HOST.startswith("http://127.0.0.1:")
assert len(fixture["plans"])==3
errors=[]
results=[]
expected={
    "dictionary": "Beta CSV Dictionary",
    "my-customers": "Customer Beta CV04",
    "my-suppliers": "Supplier Beta CV04",
}
absent={
    "dictionary": ["Alpha CSV Dictionary","Never Export Option","SECRET_OPTION"],
    "my-customers": ["Customer Alpha CV04","Customer Hidden CV04","Supplier Beta CV04","PRIVATE-","SECRET-"],
    "my-suppliers": ["Supplier Alpha CV04","Supplier Hidden CV04","Customer Beta CV04","PRIVATE-","SECRET-"],
}
with sync_playwright() as api:
    browser=api.chromium.launch(headless=True)
    for size,is_phone in [(1280,False),(390,True)]:
        context=browser.new_context(
            viewport={"width":size,"height":820 if not is_phone else 844},
            device_scale_factor=2 if is_phone else 1,
            is_mobile=is_phone,has_touch=is_phone,accept_downloads=True,
            locale="zh-CN"
        )
        context.add_init_script("""
          if(location.origin===%s){
            localStorage.setItem("evo.context.id",%s);
            localStorage.setItem("evo.locale","zh-CN");
          }
        """ % (json.dumps(HOST),json.dumps(CTX)))
        for plan in fixture["plans"]:
            name=plan["name"]
            page=context.new_page()
            page.on("pageerror",lambda error: errors.append(str(error)))
            page.goto(HOST+"/?surface=desktop#"+plan["route"],wait_until="domcontentloaded")
            root=page.locator('[data-eidos-catalog-has-table="true"]')
            expect(root).to_have_count(1,timeout=30000)
            table=root.locator('[data-eidos-catalog-table]')
            expect(table.locator("tbody tr")).to_have_count(1,timeout=30000)
            row=table.locator("tbody tr").first
            expect(row).to_contain_text(expected[name])
            actions=root.locator('[data-eidos-catalog-action="export-current-page"]')
            expect(actions).to_have_count(1)
            expect(actions).to_be_visible()
            assert actions.get_attribute("data-eidos-command")==plan["command"]
            assert "当前页" in actions.inner_text()
            actual_values=json.loads(actions.get_attribute("data-eidos-action-values"))
            assert actual_values["page"]==1 and actual_values["pageSize"]==1
            assert actual_values["fieldIds"],"Missing current-table field selection"
            diagnostics=page.evaluate("""() => ({
              innerWidth:innerWidth,scrollWidth:document.documentElement.scrollWidth,
              documentHeight:document.documentElement.scrollHeight,
              exportActions:[...document.querySelectorAll('[data-eidos-catalog-action="export-current-page"]')]
                .map(button => ({
                  text:button.innerText,
                  visible:button.getBoundingClientRect().width>0
                    && button.getBoundingClientRect().height>0,
                  x:button.getBoundingClientRect().x,
                  w:button.getBoundingClientRect().width
                }))
            })""")
            assert diagnostics["scrollWidth"]<=size+2,(
                "CV04_HORIZONTAL_OVERFLOW "+name+" "+str(diagnostics))
            assert diagnostics["exportActions"][0]["visible"],"Export action not reachable"
            screenshot=OUT/("%s-%s.png"%(name,"phone390" if is_phone else "desktop1280"))
            page.screenshot(path=str(screenshot),full_page=True)
            with page.expect_download(timeout=20000) as event:
                actions.click()
            download=event.value
            assert download.failure() is None,download.failure()
            filename=download.suggested_filename
            assert filename.endswith("-page-2.csv"),filename
            raw=Path(download.path()).read_bytes()
            assert raw.startswith(b"\xef\xbb\xbf"),"UTF8_BOM_MISSING"
            data=raw.decode("utf-8-sig")
            rows=list(csv.reader(io.StringIO(data,newline="")))
            assert len(rows)==2,{"name":name,"rows":rows}
            assert rows[0]==actual_values["fieldIds"],{"name":name,"columns":rows[0],"ui":actual_values["fieldIds"]}
            assert expected[name] in rows[1],{"name":name,"row":rows[1]}
            assert len(rows[1])==len(rows[0])
            for secret in absent[name]:
                assert secret not in data,{"name":name,"leaked":secret}
            assert "page=1" in page.url,page.url
            expect(actions).to_be_visible()
            results.append({
                "surface":name,"viewportWidth":size,"download":filename,
                "csvHeader":rows[0],"csvRows":len(rows)-1,
                "pagePreserved":True,"horizontalOverflow":False,
                "expectedRow":expected[name],"screenshot":str(screenshot)
            })
            print("CV04_PHYSICAL_CHROMIUM_DOWNLOAD_PASS:%s:%d"%(name,size),flush=True)
            page.close()
        context.close()
    assert not errors,"EIDOS_BROWSER_PAGE_ERRORS:"+repr(errors)
    browser.close()

assert len(results)==6
(OUT/"browser-results.json").write_text(
    json.dumps({"sourceSha":fixture["sourceSha"],"fixture":"ISOLATED_ACTUAL_HOST",
      "notProduction":True,"notHuman":True,
      "results":results},ensure_ascii=False,indent=2),encoding="utf-8")
print("CV04_REAL_HOST_CHROMIUM_DESKTOP_PHONE_CSV_TERMINAL_PASS=6",flush=True)
