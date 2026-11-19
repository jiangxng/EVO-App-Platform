#!/usr/bin/env python3
"""CV07 installed Host + real Chromium Eidos Item Collection acceptance.

Runs against existing isolated CV04 static-session Host, not production,
Tokyo, a real Human login or a live model. Tests actual Eidos JS navigation
and Item Owner reauthorization at 1280px and Chromium mobile 390px.
"""
import json
from pathlib import Path
from urllib.parse import parse_qs, urlsplit
from playwright.sync_api import sync_playwright, expect

OUT=Path("artifacts/cv07-item-browser")
data=json.loads((OUT/"fixture.json").read_text(encoding="utf-8"))
assert data["isolated"] and not data["productionUsed"]
assert not data["humanLoginUsed"] and not data["liveLlmUsed"]
HOST=data["hostUrl"]
A,B=data["contextId"],data["secondaryContextId"]
assert HOST.startswith("http://127.0.0.1:") and A!=B
A_NAMES=[x["displayName"] for x in data["inA"]]
B_NAME=data["inB"][0]["displayName"]
assert len(A_NAMES)==3 and len(data["inB"])==1
results=[]
errors=[]

def visit(page,route):
    page.goto(HOST+"/?surface=desktop#"+route,wait_until="domcontentloaded")
    root=page.locator('[data-eidos-catalog-has-table="true"]')
    expect(root).to_have_count(1,timeout=30000)
    expect(root.locator('[data-eidos-catalog-table]')).to_have_count(1)
    return root

def table_row(page,contains):
    table=page.locator('[data-eidos-catalog-table]')
    expect(table.locator("tbody tr")).to_have_count(1,timeout=30000)
    expect(table.locator("tbody tr").first).to_contain_text(contains,timeout=30000)
    return table

def actual_click(button,phone):
    expect(button).to_be_visible(timeout=12000)
    if phone: button.tap()
    else:
        button.focus()
        button.press("Enter")

def screenshot(page,label):
    name=str(OUT/(label+".png"))
    page.screenshot(path=name,full_page=True)
    return name

def no_overflow(page,width):
    metrics=page.evaluate("""() => ({
       innerWidth,scrollWidth:document.documentElement.scrollWidth
    })""")
    assert metrics["innerWidth"]==width,metrics
    assert metrics["scrollWidth"]<=width+2,("CV07_HORIZONTAL_OVERFLOW",metrics)

with sync_playwright() as api:
    browser=api.chromium.launch(headless=True)
    for width in (1280,390):
        phone=width==390
        context=browser.new_context(
            viewport={"width":width,"height":844},
            device_scale_factor=2 if phone else 1,
            is_mobile=phone,has_touch=phone,locale="zh-CN"
        )
        context.add_init_script("""
            if(location.origin===%s){
              if(!localStorage.getItem('evo.context.id'))
                localStorage.setItem('evo.context.id',%s);
              localStorage.setItem('evo.locale','zh-CN');
            }
        """%(json.dumps(HOST),json.dumps(A)))
        page=context.new_page()
        page.on("pageerror",lambda error:errors.append(str(error)))
        root=visit(page,data["route"])
        table=table_row(page,A_NAMES[0])
        for foreign in (A_NAMES[1],A_NAMES[2],B_NAME,"PRIVATE-"):
            assert foreign not in table.inner_text(),("CV07_PAGE_NOT_BOUNDED",foreign)
        pagination=root.locator('[data-eidos-catalog-pagination]')
        expect(pagination).to_be_visible()
        assert "/items" in page.url and "pageSize=1" in page.url
        no_overflow(page,width)
        screenshot(page,"item-all-initial-%d"%width)

        # Owner controls: native HTML search, server-side sorting and paging.
        nav=root.locator('[data-eidos-catalog-view-navigation]')
        expect(nav).to_be_visible()
        buttons=nav.locator("button")
        expect(buttons).to_have_count(2)
        rects=buttons.evaluate_all("""els=>els.map(x=>{
          const r=x.getBoundingClientRect();return {
            width:r.width,height:r.height,left:r.left,right:r.right,
            selected:x.getAttribute("aria-current")==="page"
          };
        })""")
        assert sum(x["selected"] for x in rects)==1,rects
        for rect in rects:
            assert rect["height"]>=44 and rect["width"]>=44,(
                "CV07_VIEW_TOUCH_TARGET",width,rect)
            assert rect["left"]>=-1 and rect["right"]<=width+2,rect

        sort=page.locator(
            '[data-eidos-catalog-action="mobile-sort-displayName"]'
            if phone else '[data-eidos-catalog-action="sort-displayName"]')
        if phone:
            mobile_sort=page.locator('[data-eidos-catalog-mobile-sort]')
            expect(mobile_sort).to_be_visible()
            buttons=mobile_sort.locator('button')
            assert buttons.count()>=1
            for rect in buttons.evaluate_all("""els=>els.map(x=>{
              const r=x.getBoundingClientRect();return {
                width:r.width,height:r.height,left:r.left,right:r.right
              };
            })"""):
                assert rect["height"]>=44 and rect["width"]>=44,(
                    "CV07_MOBILE_SORT_TOUCH_TARGET",rect)
                assert rect["left"]>=-1 and rect["right"]<=width+2,(
                    "CV07_MOBILE_SORT_OVERFLOW",rect)
        actual_click(sort,phone)
        table_row(page,A_NAMES[2])
        assert "direction=desc" in page.url,page.url
        next_page=page.locator('[data-eidos-catalog-action="next-page"]')
        actual_click(next_page,phone)
        table_row(page,A_NAMES[1])
        assert "page=1" in page.url,page.url
        current_route=page.url.split("#",1)[1]
        assert current_route.startswith("/items?"),current_route
        screenshot(page,"item-all-page2-%d"%width)

        # Real Eidos Table action for desktop, responsive authorized card
        # tap on Chromium mobile. Detail returnTo is not an access grant.
        if phone:
            open_detail=page.locator(
                '[data-eidos-catalog-items] '
                '[data-eidos-catalog-row-route]:visible').first
        else:
            open_detail=page.locator(
                '[data-eidos-catalog-table] tbody tr:first-child '
                '[data-eidos-catalog-action="view"]')
        actual_click(open_detail,phone)
        detail_hash=page.url.split("#",1)[1]
        assert detail_hash.startswith("/items/detail?"),detail_hash
        return_route=parse_qs(urlsplit("https://evo.invalid"+detail_hash).query
            ).get("returnTo",[""])[0]
        assert return_route==current_route,(
            "CV07_DETAIL_RETURN_LOST_QUERY",return_route,current_route)
        # Navigation changes location before asynchronous Host page content
        # is fully rendered. Wait for the real Eidos return control.
        return_link=page.locator(
            '[data-eidos-context-route="'+return_route+'"]:visible').first
        expect(return_link).to_be_visible(timeout=30000)
        actual_click(return_link,phone)
        table_row(page,A_NAMES[1])
        assert current_route in page.url,("CV07_DETAIL_RETURN_COORDINATES",page.url)
        no_overflow(page,width)
        screenshot(page,"item-return-%d"%width)

        # Switch to existing Eidos My Items, never a second HTML list.
        mine=page.locator('[data-eidos-catalog-action="select-view-mine"]')
        actual_click(mine,phone)
        assert "/items/my-items?" in page.url,page.url
        table_row(page,A_NAMES[1])
        assert A_NAMES[2] not in page.locator(
            '[data-eidos-catalog-table]').inner_text()
        # A real form submit goes back through Host route/Item Owner.
        form=page.locator('[data-eidos-catalog-server-search]')
        expect(form).to_be_visible()
        form.locator('input[name="search"]').fill("Apple")
        form.locator('button[type="submit"]').click()
        table_row(page,A_NAMES[0])
        assert "search=Apple" in page.url,page.url
        assert "page=0" in page.url,page.url
        screenshot(page,"item-my-search-%d"%width)
        form=page.locator('[data-eidos-catalog-server-search]')
        form.locator('input[name="search"]').fill("CV07")
        form.locator('button[type="submit"]').click()
        expect(page.locator('[data-eidos-catalog-view-selected="true"]')).to_have_count(1)
        assert A_NAMES[2] not in page.locator(
            '[data-eidos-catalog-table]').inner_text()
        all_btn=page.locator('[data-eidos-catalog-action="select-view-all"]')
        actual_click(all_btn,phone)
        assert "/items?" in page.url and "/items/my-items?" not in page.url
        no_overflow(page,width)

        # A->B->A is an actual Host re-read using the same source route.
        # No A snapshot or stale navigable page is permitted after switch.
        page.evaluate("(v)=>localStorage.setItem('evo.context.id',v)",B)
        page.goto(HOST+"/?surface=desktop#"+data["route"],
            wait_until="domcontentloaded")
        page.reload(wait_until="domcontentloaded")
        visit(page,data["route"])
        table_row(page,B_NAME)
        for name in A_NAMES:
            assert name not in page.locator(
                '[data-eidos-catalog-table]').inner_text(),(
                "CV07_CROSS_ENTERPRISE_ITEM_LEAK",name)
        screenshot(page,"item-b-enterprise-%d"%width)
        page.evaluate("(v)=>localStorage.setItem('evo.context.id',v)",A)
        page.goto(HOST+"/?surface=desktop#"+data["route"],
            wait_until="domcontentloaded")
        page.reload(wait_until="domcontentloaded")
        visit(page,data["route"])
        table_row(page,A_NAMES[0])
        assert B_NAME not in page.locator(
            '[data-eidos-catalog-table]').inner_text()
        no_overflow(page,width)
        results.append({
            "viewportWidth":width,"realHost":True,"realEidos":True,
            "ownerServerSearchSortPage":True,
            "myItemsStewardship":True,
            "detailReturnPreservesCoordinates":True,
            "enterpriseSwitchReauthorized":True,
            "viewTargets44px":True,"horizontalOverflow":False
        })
        page.close()
        context.close()
        print("CV07_ITEM_REAL_HOST_CHROMIUM_PASS:%d"%width,flush=True)

    # Revocation: a stale authorized query is forbidden after disabling Item.
    client=api.request.new_context(
        base_url=HOST,extra_http_headers={"x-evo-context-id":A})
    disabled=client.post("/v1/disable",data={"packageId":"evo-item"})
    assert disabled.status==200,("CV07_ITEM_DISABLE_FAILED",disabled.status)
    assert not any(p.get("featureId")=="evo-item.default"
        for p in disabled.json()["snapshot"].get("activeFeatures",[]))
    stale=client.post("/v1/actions",data={
        "contractVersion":"0.1.0","type":"command",
        "command":{"code":"item.collection.directory.query",
                   "inputVersion":"0.1.0"},
        "values":{"search":"CV07","page":0,"pageSize":1},
        "sourceInteractionId":"cv07-stale","actionId":"read",
        "requiresConfirmation":False
    })
    assert stale.status==200,("CV07_STALE_ITEM_ACTION_HTTP",stale.status)
    denied=stale.json()
    assert denied.get("ok") is False,("CV07_ITEM_REVOKED_QUERY_ALLOWED",denied)
    assert denied.get("error",{}).get("code")=="ACTION_FEATURE_NOT_ACTIVE",denied
    client.dispose()
    browser.close()

assert len(results)==2
assert not errors,("CV07_CHROMIUM_PAGE_ERRORS",errors)
(OUT/"browser-results.json").write_text(json.dumps({
    "notProduction":True,"notHuman":True,"notLiveLlm":True,
    "results":results,"pluginDisabledDenied":True,
    "pageErrors":errors
},ensure_ascii=False,indent=2),encoding="utf-8")
print("CV07_ITEM_REAL_HOST_BROWSER_ACCEPTANCE_PASS=2",flush=True)
