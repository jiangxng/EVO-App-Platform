#!/usr/bin/env python3
"""CV05 real Chromium click/keyboard/390px proof against an isolated actual EVO Host.

Host data and Eidos Chat markup are generated from a real authorized READ by
tools/cv05/prepare-real-host-agent-list-browser.mjs. Message insertion is a
test seam, NOT a live LLM conversation or real production session. The clicks,
navigation, Eidos App Host JS, domain page loads and returns are real.
"""
import json
from pathlib import Path
from playwright.sync_api import sync_playwright, expect

OUT=Path("artifacts/cv05-agent-list-browser")
data=json.loads((OUT/"fixture.json").read_text(encoding="utf-8"))
assert data["isolated"] and not data["productionUsed"]
assert not data["liveLlmUsed"] and not data["humanLoginUsed"]
HOST=data["hostUrl"]
CTX, BCTX=data["contextId"],data["secondaryContextId"]
assert HOST.startswith("http://127.0.0.1:") and BCTX!=CTX
assert len(data["plans"])==2
errors=[]
results=[]

def inject_authenticated_read_message(page,plan):
    transcript=page.locator("[data-eidos-chat-transcript]")
    expect(transcript).to_have_count(1,timeout=30000)
    # Workbench and Chat mounted by actual Host; only the authoritative
    # already-rendered Chat Message is injected, never the action event.
    page.evaluate("""html => {
        const transcript=document.querySelector('[data-eidos-chat-transcript]');
        if (!transcript) throw new Error('CV05_CHAT_TRANSCRIPT_MISSING');
        transcript.insertAdjacentHTML('beforeend',html);
    }""",plan["messageHtml"])
    button=page.locator(
      '[data-eidos-chat-action="open-authorized-collection"]').last
    expect(button).to_be_visible(timeout=10000)
    assert button.get_attribute("data-eidos-route")==plan["route"]
    assert button.get_attribute("data-eidos-action-type")=="navigate"
    assert button.inner_text()=="在列表中打开"
    return button

def screenshot(page,name):
    image=OUT/(name+".png")
    page.screenshot(path=str(image),full_page=True)
    return str(image)

with sync_playwright() as playwright:
    browser=playwright.chromium.launch(headless=True)
    # The real Host static HUMAN identity was isolated by the CV04 fixture.
    requester=playwright.request.new_context(base_url=HOST)
    installed=requester.post("/v1/install",data={"packageId":"enterprise-agent"})
    assert installed.status==200,("AGENT_INSTALL_FAILED",installed.status,installed.text()[:700])
    assert any(p["packageId"]=="enterprise-agent"
        for p in installed.json()["snapshot"]["installedPackages"])
    requester.dispose()

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
        """%(json.dumps(HOST),json.dumps(CTX)))
        for plan in data["plans"]:
            name=plan["name"]
            page=context.new_page()
            page.on("pageerror",lambda error:errors.append(str(error)))
            page.goto(HOST+"/?surface=desktop#/enterprise-agent",
                wait_until="domcontentloaded")
            button=inject_authenticated_read_message(page,plan)
            metrics=page.evaluate("""() => {
                const button=document.querySelector(
                    '[data-eidos-chat-action="open-authorized-collection"]');
                const rect=button.getBoundingClientRect();
                return {
                    innerWidth,documentWidth:document.documentElement.scrollWidth,
                    buttonLeft:rect.left,buttonRight:rect.right,
                    buttonHeight:rect.height,buttonWidth:rect.width,
                    focusable:button.matches('button[type="button"]')
                };
            }""")
            assert metrics["innerWidth"]==width,metrics
            assert metrics["documentWidth"]<=width+2,(
                "CV05_CHAT_390_HORIZONTAL_OVERFLOW",name,metrics)
            assert metrics["buttonLeft"]>=-1 and metrics["buttonRight"]<=width+2,metrics
            assert metrics["buttonWidth"]>=80 and metrics["buttonHeight"]>=32,metrics
            assert metrics["focusable"],"CV05_NAVIGATION_NOT_NATIVE_BUTTON"
            initial=screenshot(page,f"{name}-{width}-chat")

            # Native keyboard activation at 1280 and actual Playwright touch
            # pointer activation at 390, not a synthetic dispatchEvent hack.
            if phone:
                button.tap()
            else:
                button.focus()
                button.press("Enter")
            expect(page.locator('[data-eidos-catalog-has-table="true"]')).to_have_count(
                1,timeout=30000)
            assert plan["route"] in page.url,(
                "CV05_NAVIGATION_LOST_FILTER",name,page.url,plan["route"])
            catalog=page.locator('[data-eidos-catalog-has-table="true"]')
            expect(catalog).to_contain_text(plan["expectedA"])
            assert plan["expectedB"] not in catalog.inner_text(),(
                "CV05_ENTERPRISE_B_LEAKED_IN_A",name)
            # Phone cards may legitimately show a locally authorized field
            # that desktop's compact Table omits. Use real Owner field grants,
            # never assume all synthetic tax IDs are forbidden to the operator.
            visible_a=catalog.inner_text()
            if "email" not in plan["readableFieldsA"]:
                assert "PRIVATE-" not in visible_a,("CV05_EMAIL_LEAK_A",name)
            if "taxIdentifier" not in plan["readableFieldsA"]:
                assert "SECRET-" not in visible_a,("CV05_TAX_ID_LEAK_A",name)
            assert "SECRET-B_SUPPLIER" not in visible_a
            assert "PRIVATE-B_SUPPLIER" not in visible_a
            # CV06 MVP #04: real 1280/390 click path Table -> separately
            # Host-authorized full-query Chart -> current-page read-only Board
            # -> Table, all on the same domain-owned filter and enterprise.
            chart=page.locator('[data-eidos-authorized-aggregate-bars]')
            if name=="dictionary":
                expect(chart).to_have_count(0)
                modes=page.locator('[data-eidos-catalog-presentation-navigation]')
                expect(modes).to_be_visible(timeout=12000)
                expect(modes.locator('[data-eidos-catalog-presentation-id]')).to_have_count(3)
                chart_button=modes.locator('[data-eidos-catalog-action="presentation-chart"]')
                if phone:
                    chart_button.tap()
                else:
                    chart_button.click()
                chart=page.locator('[data-eidos-authorized-aggregate-bars]')
                expect(chart).to_be_visible(timeout=12000)
                assert chart.get_attribute("data-eidos-chart-scope")==(
                    "AUTHORIZED_ALL_MATCHING_ROWS")
                assert chart.locator('[data-eidos-authorized-bar-key]').count()==2
                assert "PRIVATE OPTION VALUE" not in chart.inner_text()
                suppressed=chart.locator('[data-eidos-count-kind="SUPPRESSED"]')
                assert suppressed.count()>0
                assert chart.locator('[data-eidos-authorized-bar-count]').count()==2
                chart_size=chart.bounding_box()
                assert chart_size is not None
                assert chart_size["x"]>=-1 and chart_size["x"]+chart_size["width"]<=width+2,(
                    "CV06_CHART_HORIZONTAL_OVERFLOW",name,width,chart_size)
                assert page.evaluate("document.documentElement.scrollWidth")<=width+2
                screenshot(page,f"{name}-{width}-authorized-chart")

                board_button=page.locator(
                    '[data-eidos-catalog-action="presentation-board"]')
                if phone:
                    board_button.tap()
                else:
                    board_button.click()
                board=page.locator('[data-eidos-read-only-kanban]')
                expect(board).to_be_visible(timeout=15000)
                assert "仅展示当前有权分页" in board.inner_text()
                assert board.locator('[data-eidos-board-column]').count()==2
                assert plan["expectedA"] in board.inner_text()
                assert plan["expectedB"] not in board.inner_text()
                assert "PRIVATE OPTION VALUE" not in board.inner_text()
                assert page.evaluate("document.documentElement.scrollWidth")<=width+2,(
                    "CV06_KANBAN_390_HORIZONTAL_OVERFLOW",name,width)
                screenshot(page,f"{name}-{width}-current-page-kanban")

                table_button=page.locator(
                    '[data-eidos-catalog-action="presentation-table"]')
                if phone:
                    table_button.tap()
                else:
                    table_button.click()
                expect(page.locator('[data-eidos-read-only-kanban]')).to_have_count(0)
                expect(page.locator('[data-eidos-authorized-aggregate-bars]')).to_have_count(0)
                expect(page.locator('[data-eidos-catalog-has-table="true"]')
                       ).to_contain_text(plan["expectedA"],timeout=15000)
            else:
                expect(chart).to_have_count(0)
            opened=screenshot(page,f"{name}-{width}-list")

            # Real Eidos catalog row activation and domain-owned returnTo.
            # Eidos Productive CSS switches semantic Table to authorized
            # cards under 700px. Use the actual visible activation in each
            # responsive surface; never force a hidden desktop Table click.
            if phone:
                card=page.locator(
                    '[data-eidos-catalog-items] '
                    '[data-eidos-catalog-row-route]:visible').first
                expect(card).to_be_visible(timeout=10000)
                card.tap()
            else:
                detail=page.locator(
                    '[data-eidos-catalog-table] tbody tr:first-child '
                    '[data-eidos-catalog-action="view"]')
                expect(detail).to_be_visible(timeout=10000)
                detail.click()
            return_link=page.locator(
                '[data-eidos-context-route="'+plan["route"]+'"]:visible')
            expect(return_link.first).to_be_visible(timeout=30000)
            return_link.first.click()
            expect(page.locator('[data-eidos-catalog-has-table="true"]')).to_have_count(
                1,timeout=30000)
            assert plan["route"] in page.url,(
                "CV05_RETURN_LOST_FILTER",name,page.url,plan["route"])
            expect(page.locator('[data-eidos-catalog-has-table="true"]')).to_contain_text(
                plan["expectedA"])
            assert page.evaluate("document.documentElement.scrollWidth")<=width+2

            # Browser storage changes to authorized Enterprise B; replaying
            # the A-origin button must re-read B, never show A records.
            page.evaluate("(value)=>localStorage.setItem('evo.context.id',value)",BCTX)
            page.goto(HOST+"/?surface=desktop#/enterprise-agent",
                wait_until="domcontentloaded")
            page.reload(wait_until="domcontentloaded")
            stale=inject_authenticated_read_message(page,plan)
            if phone:
                stale.tap()
            else:
                stale.click()
            catalog_b=page.locator('[data-eidos-catalog-has-table="true"]')
            expect(catalog_b).to_contain_text(plan["expectedB"],timeout=30000)
            assert plan["expectedA"] not in catalog_b.inner_text(),(
                "CV05_STALE_AGENT_LINK_READ_FOREIGN_ENTERPRISE",name)
            visible_b=catalog_b.inner_text()
            if "taxIdentifier" not in plan["readableFieldsB"]:
                assert "SECRET-" not in visible_b,("CV05_TAX_ID_LEAK_B",name)
            if "email" not in plan["readableFieldsB"]:
                assert "PRIVATE-" not in visible_b,("CV05_EMAIL_LEAK_B",name)
            # Explicit foreign-tenant synthetic sentinels must never appear.
            for foreign in ("SECRET-S_ALPHA","SECRET-S_BETA","SECRET-S_HIDDEN",
                            "PRIVATE-S_ALPHA","PRIVATE-S_BETA","PRIVATE-S_HIDDEN"):
                assert foreign not in visible_b,("CV05_ENTERPRISE_A_FIELD_LEAK",foreign)
            if name=="dictionary":
                # Old A-origin Chat route now resolves B. A chart must be
                # separately reauthorized for B and never reuse A's result.
                expect(catalog_b.locator('[data-eidos-authorized-aggregate-bars]')
                       ).to_have_count(0)
                chart_button=catalog_b.locator(
                    '[data-eidos-catalog-action="presentation-chart"]')
                if phone:
                    chart_button.tap()
                else:
                    chart_button.click()
                chart_b=page.locator('[data-eidos-authorized-aggregate-bars]')
                expect(chart_b).to_be_visible(timeout=12000)
                assert chart_b.locator('[data-eidos-authorized-bar-key]').count()==2
                assert "Alpha CSV Dictionary" not in chart_b.inner_text()
                assert chart_b.get_attribute("data-eidos-chart-scope")==(
                    "AUTHORIZED_ALL_MATCHING_ROWS")
                table_button=page.locator(
                    '[data-eidos-catalog-action="presentation-table"]')
                if phone:
                    table_button.tap()
                else:
                    table_button.click()
                expect(page.locator('[data-eidos-authorized-aggregate-bars]')).to_have_count(0)
            screenshot(page,f"{name}-{width}-enterprise-b")

            # A -> B -> A context switch restores scoped source data.
            page.evaluate("(value)=>localStorage.setItem('evo.context.id',value)",CTX)
            page.goto(HOST+"/?surface=desktop#"+plan["route"],
                wait_until="domcontentloaded")
            page.reload(wait_until="domcontentloaded")
            catalog_a=page.locator('[data-eidos-catalog-has-table="true"]')
            expect(catalog_a).to_contain_text(plan["expectedA"],timeout=30000)
            assert plan["expectedB"] not in catalog_a.inner_text()

            # CV02 MVP #01: two native filter groups invoke *real* Owner
            # re-queries in Chromium; not a current-page JS predicate.
            if name=="my-suppliers":
                fields=set(plan["readableFieldsA"])
                assert {"status","subjectType"}.issubset(fields),(
                    "CV02_MVP_REQUIRED_FILTER_FIELD_GRANTS_MISSING",fields)
                filters=page.locator('[data-eidos-quick-filter-group]')
                expect(filters).to_have_count(2,timeout=15000)
                metrics=page.evaluate("""() => [...document.querySelectorAll(
                    '[data-eidos-quick-filter-group]')].map(nav=>({
                      id:nav.getAttribute('data-eidos-quick-filter-group'),
                      selected:[...nav.querySelectorAll('button[aria-current="page"]')].length,
                      buttons:[...nav.querySelectorAll('button')].map(b=>{
                        const r=b.getBoundingClientRect();
                        return {height:r.height,width:r.width,left:r.left,right:r.right};
                      })
                    }))""")
                assert [g["id"] for g in metrics]==["status","subjectType"],metrics
                for group in metrics:
                    assert group["selected"]==1,("CV02_FILTER_SELECTION",group)
                    for control in group["buttons"]:
                        assert control["height"]>=44 and control["width"]>=44,(
                            "CV02_FILTER_TOUCH_TARGET",width,control)
                        assert control["left"]>=-1 and control["right"]<=width+2,(
                            "CV02_FILTER_OVERFLOW",width,control)
                person=page.locator(
                    '[data-eidos-catalog-action="quick-filter-subjectType-person"]')
                expect(person).to_be_visible(timeout=10000)
                person_route=person.get_attribute("data-eidos-route")
                assert "subjectType=PERSON" in person_route and "search=Supplier" in person_route
                if phone: person.tap()
                else:
                    person.focus()
                    person.press("Enter")
                page.wait_for_function("(route)=>location.hash==='#'+route",
                    arg=person_route,timeout=20000)
                selected=page.locator(
                    '[data-eidos-catalog-action="quick-filter-subjectType-person"]')
                expect(selected).to_have_attribute("aria-current","page",timeout=15000)
                inactive=page.locator(
                    '[data-eidos-catalog-action="quick-filter-status-inactive"]')
                inactive_route=inactive.get_attribute("data-eidos-route")
                assert "status=INACTIVE" in inactive_route and "subjectType=PERSON" in inactive_route
                if phone: inactive.tap()
                else:
                    inactive.focus()
                    inactive.press("Enter")
                page.wait_for_function("(route)=>location.hash==='#'+route",
                    arg=inactive_route,timeout=20000)
                expect(page.locator(
                    '[data-eidos-catalog-action="quick-filter-status-inactive"]')
                ).to_have_attribute("aria-current","page",timeout=15000)
                expect(page.locator(
                    '[data-eidos-catalog-has-table="true"]')).not_to_contain_text(
                    plan["expectedA"])
                # Return to original authorized query before exercising view
                # switching, detail and tenant continuity in this same test.
                page.goto(HOST+"/?surface=desktop#"+plan["route"],
                    wait_until="domcontentloaded")
                expect(page.locator('[data-eidos-catalog-has-table="true"]')
                    ).to_contain_text(plan["expectedA"],timeout=30000)
                assert page.evaluate("document.documentElement.scrollWidth")<=width+2
                print(f"CV02_MVP_MULTI_FILTER_REAL_HOST_PASS:{width}",flush=True)

            # CV05 #05: inspect the actual rendered view switcher at both
            # viewport sizes. Prior real 390px screenshots showed unstyled
            # native buttons below Eidos' 44px touch target.
            switcher=page.locator('[data-eidos-catalog-view-navigation]')
            expect(switcher).to_be_visible(timeout=15000)
            nav_metrics=page.evaluate("""() => {
                return [...document.querySelectorAll(
                    '[data-eidos-catalog-view-navigation] button')].map(b=>{
                    const rect=b.getBoundingClientRect();
                    return {
                        id:b.dataset.eidosCatalogAction,
                        selected:b.getAttribute('aria-current')==='page',
                        height:rect.height,width:rect.width,
                        left:rect.left,right:rect.right
                    };
                });
            }""")
            assert len(nav_metrics)>=2,("CV05_VIEW_CHOICES_MISSING",name,nav_metrics)
            assert sum(item["selected"] for item in nav_metrics)==1,(
                "CV05_VIEW_SELECTION_NOT_UNIQUE",name,nav_metrics)
            for item in nav_metrics:
                assert item["height"]>=44 and item["width"]>=44,(
                    "CV05_VIEW_TOUCH_TARGET_UNDERSIZED",name,width,item)
                assert item["left"]>=-1 and item["right"]<=width+2,(
                    "CV05_VIEW_BUTTON_OUTSIDE_VIEWPORT",name,width,item)
            assert page.evaluate("document.documentElement.scrollWidth")<=width+2

            # Real native keyboard / tap on an unselected Eidos view option.
            # The Host must navigate through the existing business page
            # route, not a duplicate client-side filter implementation.
            alternate=page.locator(
                '[data-eidos-catalog-view-navigation] '
                'button:not([aria-current="page"])').first
            expect(alternate).to_be_visible()
            alternate_route=alternate.get_attribute("data-eidos-route")
            assert alternate_route and alternate_route.startswith("/")
            if phone:
                alternate.tap()
            else:
                alternate.focus()
                alternate.press("Enter")
            page.wait_for_function(
                "(route) => location.hash === '#' + route",
                arg=alternate_route,timeout=20000)
            expect(page.locator('[data-eidos-catalog-has-table="true"]')).to_have_count(
                1,timeout=30000)
            # Return to the exact old filtered route, including its page and
            # current-tenant owner scope, after switching to another view.
            page.goto(HOST+"/?surface=desktop#"+plan["route"],
                wait_until="domcontentloaded")
            expect(page.locator('[data-eidos-catalog-has-table="true"]')).to_contain_text(
                plan["expectedA"],timeout=30000)
            assert plan["route"] in page.url
            assert page.evaluate("document.documentElement.scrollWidth")<=width+2
            print(f"CV05_EIDOS_COLLECTION_VIEW_44PX_SWITCH_PASS:{name}:{width}",flush=True)
            results.append({
                "name":name,"viewport":width,
                "actionInputFromRealOwner":True,"actionMethod":"touch" if phone else "keyboard",
                "navRoute":plan["route"],"listRead":True,
                "detailReturnFilterPreserved":True,"enterpriseSwitchReauthorized":True,
                "noHorizontalOverflow":True,"viewTargets44px":True,
                "dictionaryAuthorizedChart":name=="dictionary",
                "alternateViewKeyboardOrTouch":True,"chatScreenshot":initial,
                "listScreenshot":opened,
                "notHuman":True,"notLiveLLM":True
            })
            print(f"CV05_REAL_HOST_CHROMIUM_LIST_JOURNEY_PASS:{name}:{width}",
                flush=True)
            page.close()
        context.close()
    assert not errors,("CV05_BROWSER_SCRIPT_ERRORS",errors)
    browser.close()

assert len(results)==4
(OUT/"browser-results.json").write_text(
    json.dumps({
        "sourceSha":data["sourceSha"],"fixture":"ISOLATED_ACTUAL_HOST",
        "notProduction":True,"notHuman":True,"notLiveLLM":True,
        "results":results
    },ensure_ascii=False,indent=2),encoding="utf-8")
print("CV05_REAL_HOST_CHROMIUM_1280_390_FINAL_PASS=4",flush=True)
