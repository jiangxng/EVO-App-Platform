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
BCTX=fixture["secondaryContextId"]
B_ONLY=fixture["secondaryNames"]
assert BCTX!=CTX and set(B_ONLY)==set(p["name"] for p in fixture["plans"])
errors=[]
results=[]
switch_results=[]
action_inputs={}
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
            if(!localStorage.getItem("evo.context.id")) localStorage.setItem("evo.context.id",%s);
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
            action_inputs[name]=actual_values
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
        # Same browser storage/session: context A -> enterprise B -> A.
        # This is an isolated static HUMAN fixture, not two real user logins.
        for plan in fixture["plans"]:
            name=plan["name"]
            swapped=context.new_page()
            swapped.on("pageerror",lambda error: errors.append(str(error)))
            swapped.goto(HOST+"/?surface=desktop#"+plan["route"],wait_until="domcontentloaded")
            expect(swapped.locator('[data-eidos-catalog-table] tbody tr')).to_have_count(1,timeout=30000)
            swapped.evaluate("(id) => localStorage.setItem('evo.context.id',id)",BCTX)
            b_route=plan["route"].replace("page=1","page=0")
            swapped.goto(HOST+"/?surface=desktop#"+b_route,wait_until="domcontentloaded")
            swapped.reload(wait_until="domcontentloaded")
            table=swapped.locator('[data-eidos-catalog-table]')
            expect(table.locator("tbody tr")).to_have_count(1,timeout=30000)
            expect(table.locator("tbody tr").first).to_contain_text(B_ONLY[name])
            assert expected[name] not in table.inner_text(),(
                "CV04_CROSS_ENTERPRISE_A_ROW_LEAK:"+name)
            b_action=swapped.locator('[data-eidos-catalog-action="export-current-page"]')
            expect(b_action).to_be_visible()
            assert b_action.get_attribute("data-eidos-command")==plan["command"]
            b_values=json.loads(b_action.get_attribute("data-eidos-action-values"))
            assert b_values["page"]==0 and b_values["pageSize"]==1
            with swapped.expect_download(timeout=20000) as b_event:
                b_action.click()
            b_download=b_event.value
            assert b_download.failure() is None,b_download.failure()
            assert b_download.suggested_filename.endswith("-page-1.csv")
            b_raw=Path(b_download.path()).read_bytes()
            assert b_raw.startswith(b"\xef\xbb\xbf"),"CV04_SECOND_CONTEXT_BOM_MISSING"
            b_csv=b_raw.decode("utf-8-sig")
            b_rows=list(csv.reader(io.StringIO(b_csv,newline="")))
            assert len(b_rows)==2 and B_ONLY[name] in b_rows[1],(
                "CV04_SECOND_CONTEXT_CSV_WRONG:"+name)
            assert b_rows[0]==b_values["fieldIds"]
            for forbidden in [expected[name],"Alpha CSV Dictionary",
                              "Customer Alpha CV04","Supplier Alpha CV04",
                              "PRIVATE-","SECRET-","B Private Option"]:
                assert forbidden not in b_csv,{"name":name,"crossTenantLeak":forbidden}
            swapped.screenshot(
                path=str(OUT/("%s-%s-enterprise-b.png"%
                              (name,"phone390" if is_phone else "desktop1280"))),
                full_page=True)
            # Re-enter A using the same browser storage and assert old scoped
            # page is freshly re-queried rather than retaining B's Blob.
            swapped.evaluate("(id) => localStorage.setItem('evo.context.id',id)",CTX)
            swapped.goto(HOST+"/?surface=desktop#"+plan["route"],wait_until="domcontentloaded")
            swapped.reload(wait_until="domcontentloaded")
            restored=swapped.locator('[data-eidos-catalog-table] tbody tr')
            expect(restored).to_have_count(1,timeout=30000)
            expect(restored.first).to_contain_text(expected[name])
            assert B_ONLY[name] not in restored.first.inner_text()
            switch_results.append({"surface":name,"viewportWidth":size,
              "fromEnterprise":"A","toEnterprise":"B","restoredEnterprise":"A",
              "secondEnterpriseDownload":b_download.suggested_filename,
              "foreignDataAbsent":True})
            print("CV04_PHYSICAL_CHROMIUM_ENTERPRISE_SWITCH_PASS:%s:%d"%(name,size),flush=True)
            swapped.close()
        context.close()
    assert not errors,"EIDOS_BROWSER_PAGE_ERRORS:"+repr(errors)
    browser.close()
    # Real installed Host lifecycle change after browser reads: stale action
    # submissions must fail, not mint a CSV download after Feature disable.
    api_ctx=api.request.new_context(base_url=HOST,
      extra_http_headers={"x-evo-context-id":CTX})
    disabled=api_ctx.post("/v1/disable",data={"packageId":"evo-business-dictionary"})
    assert disabled.status==200,("CV04_HOST_DISABLE_FAILED",disabled.status,disabled.text()[:900])
    assert not any(x.get("featureId")=="evo-business-dictionary.default"
      for x in disabled.json()["snapshot"].get("activeFeatures",[])),(
        "CV04_HOST_DICTIONARY_FEATURE_STILL_ACTIVE")
    stale={
      "contractVersion":"0.1.0","type":"command",
      "command":{"code":"dictionary.collection.page.export.csv","inputVersion":"0.1.0"},
      "values":action_inputs["dictionary"],
      "sourceInteractionId":"cv04-real-host-stale-blob",
      "actionId":"export-current-page","requiresConfirmation":False
    }
    response=api_ctx.post("/v1/actions",data=stale)
    denied=response.json()
    assert denied.get("ok") is False,("CV04_DISABLED_EXPORT_ALLOWED",denied)
    assert "download" not in json.dumps(denied),(
      "CV04_DISABLED_EXPORT_CONTAINED_BLOB")
    assert denied.get("error",{}).get("code")=="ACTION_FEATURE_NOT_ACTIVE",denied
    api_ctx.dispose()
    print("CV04_REAL_HOST_DISABLED_FEATURE_STALE_EXPORT_DENIED_PASS",flush=True)

assert len(results)==6
assert len(switch_results)==6
(OUT/"browser-results.json").write_text(
    json.dumps({"sourceSha":fixture["sourceSha"],"fixture":"ISOLATED_ACTUAL_HOST",
      "notProduction":True,"notHuman":True,
      "results":results,"enterpriseSwitchResults":switch_results,
      "featureDisabledExportDenied":True},ensure_ascii=False,indent=2),encoding="utf-8")
print("CV04_REAL_HOST_CHROMIUM_DESKTOP_PHONE_CSV_TERMINAL_PASS=6",flush=True)

print("CV04_REAL_HOST_CHROMIUM_ENTERPRISE_SWITCH_TERMINAL_PASS=6",flush=True)
print("CV04_REAL_HOST_CHROMIUM_DISABLED_FEATURE_DENY_TERMINAL_PASS=1",flush=True)
