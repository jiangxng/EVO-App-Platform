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
column_results=[]
counterparty_columns=[]
combined_filter_results=[]
keyboard_filter_results=[]
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
            if name=="dictionary":
                # Click the actual Host Eidos controls, not a synthetic HTML or
                # browser-only style switch. Re-read the Domain page via route.
                chooser=page.locator("[data-eidos-catalog-column-controls]")
                expect(chooser).to_have_count(1)
                chooser.locator("summary").click()
                chooser.locator('[data-eidos-catalog-action="column-toggle-state"]').click()
                expect(page.locator('[data-eidos-catalog-table] thead th')).to_have_count(4,timeout=30000)
                expect(page.locator('[data-eidos-catalog-table] [data-eidos-col="state"]')).to_have_count(0)
                assert "columns=" in page.url,page.url
                changed_export=page.locator('[data-eidos-catalog-action="export-current-page"]')
                expect(changed_export).to_be_visible()
                selected=json.loads(changed_export.get_attribute("data-eidos-action-values"))
                assert selected["page"]==1 and selected["pageSize"]==1
                assert selected["fieldIds"]==["displayName","dictionaryId","version","optionCount"],selected
                with page.expect_download(timeout=20000) as changed_event:
                    changed_export.click()
                changed_bytes=Path(changed_event.value.path()).read_bytes()
                assert changed_bytes.startswith(b"\xef\xbb\xbf")
                changed_rows=list(csv.reader(io.StringIO(changed_bytes.decode("utf-8-sig"),newline="")))
                assert changed_rows[0]==selected["fieldIds"]
                assert expected[name] in changed_rows[1]
                for secret in absent[name]:
                    assert secret not in changed_bytes.decode("utf-8-sig"),secret
                page.screenshot(path=str(OUT/("dictionary-layout-%d.png"%size)),full_page=True)
                no_overflow=page.evaluate("document.documentElement.scrollWidth <= innerWidth+2")
                assert no_overflow,{"width":size,"url":page.url}
                column_results.append({"viewportWidth":size,"columns":selected["fieldIds"],
                    "pagePreserved":True,"csvParity":True,"horizontalOverflow":False})
                print("CV02_OWNER_COLUMN_CHROMIUM_CSV_PARITY_PASS:%d"%size,flush=True)
            elif name in ("my-customers","my-suppliers"):
                # A physical Eidos click triggers a fresh authorized Owner READ.
                chooser=page.locator("[data-eidos-catalog-column-controls]")
                expect(chooser).to_have_count(1)
                chooser.locator("summary").click()
                chooser.locator('[data-eidos-catalog-action="column-toggle-code"]').click()
                assert "columns=" in page.url,page.url
                expect(page.locator('[data-eidos-catalog-table] [data-eidos-col="code"]')).to_have_count(0)
                current=page.locator('[data-eidos-catalog-action="export-current-page"]')
                expect(current).to_be_visible()
                selected=json.loads(current.get_attribute("data-eidos-action-values"))
                assert selected["page"]==1 and selected["pageSize"]==1
                assert "code" not in selected["fieldIds"],selected
                assert selected["fieldIds"][0]=="displayName"
                assert page.locator('[data-eidos-catalog-table] thead th').count()==len(selected["fieldIds"])
                with page.expect_download(timeout=20000) as changed_event:
                    current.click()
                changed_bytes=Path(changed_event.value.path()).read_bytes()
                assert changed_bytes.startswith(b"\xef\xbb\xbf")
                rows=list(csv.reader(io.StringIO(changed_bytes.decode("utf-8-sig"),newline="")))
                assert rows[0]==selected["fieldIds"],{"name":name,"csv":rows[0],"table":selected}
                assert len(rows)==2 and expected[name] in rows[1]
                for secret in absent[name]:
                    assert secret not in changed_bytes.decode("utf-8-sig"),secret
                no_overflow=page.evaluate("document.documentElement.scrollWidth <= innerWidth+2")
                assert no_overflow,{"name":name,"width":size}
                page.screenshot(path=str(OUT/("%s-layout-%d.png"%(name,size))),full_page=True)
                counterparty_columns.append({"surface":name,"viewportWidth":size,
                    "columns":selected["fieldIds"],"pagePreserved":True,"csvParity":True})
                print("CV02_COUNTERPARTY_COLUMN_CHROMIUM_CSV_PARITY_PASS:%s:%d"%(name,size),flush=True)
                # The Eidos quick filter navigates to full authorized Owner
                # status+search query, not a client-only filter of page 2.
                quick=page.locator('[data-eidos-catalog-quick-filters]')
                expect(quick).to_have_count(1)
                assert quick.get_attribute("aria-label")=="状态筛选"
                assert quick.locator('button[type="button"]').count()==3
                all_button=quick.locator('[data-eidos-catalog-action="quick-filter-all"]')
                active_button=quick.locator('[data-eidos-catalog-action="quick-filter-active"]')
                expect(all_button).to_have_attribute("aria-current","page")
                assert quick.locator('[aria-current="page"]').count()==1
                # Actual native keyboard path: Tab reaches the next filter,
                # Enter activates Owner navigation (not a local row filter).
                all_button.focus()
                expect(all_button).to_be_focused()
                page.keyboard.press("Tab")
                expect(active_button).to_be_focused()
                page.keyboard.press("Enter")
                expect(page.locator('[data-eidos-catalog-action="quick-filter-active"]')).to_have_attribute(
                    "aria-current","page",timeout=30000)
                assert quick.locator('[aria-current="page"]').count()==1
                search=page.locator('[data-eidos-catalog-server-search]')
                expect(search).to_have_count(1)
                search_input=search.locator('input[name="search"]')
                expect(search_input).to_have_attribute("type","search")
                search_input.fill("Beta")
                search_input.press("Enter")
                expect(page.locator('[data-eidos-catalog-table] tbody tr')).to_have_count(1,timeout=30000)
                expect(page.locator('[data-eidos-catalog-table] tbody tr').first).to_contain_text("Beta")
                assert "status=ACTIVE" in page.url and "search=Beta" in page.url,page.url
                active_action=page.locator('[data-eidos-catalog-action="export-current-page"]')
                active_values=json.loads(active_action.get_attribute("data-eidos-action-values"))
                assert active_values["status"]=="ACTIVE" and active_values["search"]=="Beta"
                with page.expect_download(timeout=20000) as filtered_download:
                    active_action.click()
                active_csv=Path(filtered_download.value.path()).read_bytes().decode("utf-8-sig")
                assert "Beta" in active_csv and "Alpha" not in active_csv
                assert list(csv.reader(io.StringIO(active_csv,newline="")))[0]==active_values["fieldIds"]
                # Desktop Chromium validates Space activation. In mobile
                # touch emulation Playwright's synthetic Space-to-click is
                # intermittent; use native Enter activation there. A physical
                # phone/keyboard and screen reader remain Human NOT_SIGNED.
                # locator.press focuses the fresh button at the key event.
                inactive_button=page.locator('[data-eidos-catalog-action="quick-filter-inactive"]')
                inactive_button.press("Enter" if is_phone else "Space")
                expect(page.locator('[data-eidos-catalog-action="quick-filter-inactive"]')).to_have_attribute(
                    "aria-current","page",timeout=30000)
                assert quick.locator('[aria-current="page"]').count()==1
                expect(page.locator('[data-eidos-catalog-table] tbody tr')).to_have_count(0,timeout=30000)
                assert "status=INACTIVE" in page.url and "search=Beta" in page.url
                inactive_action=page.locator('[data-eidos-catalog-action="export-current-page"]')
                inactive_values=json.loads(inactive_action.get_attribute("data-eidos-action-values"))
                assert inactive_values["status"]=="INACTIVE" and inactive_values["search"]=="Beta"
                with page.expect_download(timeout=20000) as empty_download:
                    inactive_action.click()
                empty_csv=Path(empty_download.value.path()).read_bytes().decode("utf-8-sig")
                empty_rows=list(csv.reader(io.StringIO(empty_csv,newline="")))
                assert len(empty_rows)==1 and empty_rows[0]==inactive_values["fieldIds"],empty_rows
                clear_button=page.locator('[data-eidos-catalog-action="quick-filter-all"]')
                clear_button.press("Enter")
                expect(page.locator('[data-eidos-catalog-action="quick-filter-all"]')).to_have_attribute(
                    "aria-current","page",timeout=30000)
                assert quick.locator('[aria-current="page"]').count()==1
                expect(page.locator('[data-eidos-catalog-table] tbody tr')).to_have_count(1,timeout=30000)
                expect(page.locator('[data-eidos-catalog-table] tbody tr').first).to_contain_text("Beta")
                assert "status=" not in page.url and "search=Beta" in page.url
                combined_filter_results.append({"surface":name,"viewportWidth":size,
                    "statusAndSearch":True,"ownerCsvParity":True,"inactiveEmpty":True})
                keyboard_filter_results.append({"surface":name,"viewportWidth":size,
                    "tabToActive":True,"enterSearch":True,
                    "spaceToInactive":not is_phone,"enterToInactive":is_phone,
                    "enterClear":True,"singleCurrentState":True,
                    "mobileSyntheticSpaceUnproven":is_phone})
                print("CV02_OWNER_COMBINED_FILTER_CHROMIUM_PASS:%s:%d"%(name,size),flush=True)
                print("CV02_OWNER_KEYBOARD_FILTER_CHROMIUM_PASS:%s:%d"%(name,size),flush=True)
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
assert len(column_results)==2
assert len(counterparty_columns)==4
assert len(combined_filter_results)==4
assert len(keyboard_filter_results)==4
(OUT/"browser-results.json").write_text(
    json.dumps({"sourceSha":fixture["sourceSha"],"fixture":"ISOLATED_ACTUAL_HOST",
      "notProduction":True,"notHuman":True,
      "results":results,"enterpriseSwitchResults":switch_results,
      "columnControlsResults":column_results,
      "counterpartyColumnResults":counterparty_columns,
      "combinedFilterResults":combined_filter_results,
      "keyboardFilterResults":keyboard_filter_results,
      "featureDisabledExportDenied":True},ensure_ascii=False,indent=2),encoding="utf-8")
print("CV04_REAL_HOST_CHROMIUM_DESKTOP_PHONE_CSV_TERMINAL_PASS=6",flush=True)

print("CV04_REAL_HOST_CHROMIUM_ENTERPRISE_SWITCH_TERMINAL_PASS=6",flush=True)
print("CV04_REAL_HOST_CHROMIUM_DISABLED_FEATURE_DENY_TERMINAL_PASS=1",flush=True)

print("CV02_OWNER_COLUMN_CHROMIUM_DESKTOP_PHONE_PASS=2",flush=True)

print("CV02_COUNTERPARTY_COLUMN_CHROMIUM_DESKTOP_PHONE_PASS=4",flush=True)

print("CV02_OWNER_COMBINED_FILTER_CHROMIUM_DESKTOP_PHONE_PASS=4",flush=True)
print("CV02_OWNER_KEYBOARD_FILTER_CHROMIUM_DESKTOP_PHONE_PASS=4",flush=True)
