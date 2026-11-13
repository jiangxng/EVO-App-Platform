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
                '[data-eidos-context-route="'+plan["route"]+'"]')
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
            screenshot(page,f"{name}-{width}-enterprise-b")

            # A -> B -> A context switch restores scoped source data.
            page.evaluate("(value)=>localStorage.setItem('evo.context.id',value)",CTX)
            page.goto(HOST+"/?surface=desktop#"+plan["route"],
                wait_until="domcontentloaded")
            page.reload(wait_until="domcontentloaded")
            catalog_a=page.locator('[data-eidos-catalog-has-table="true"]')
            expect(catalog_a).to_contain_text(plan["expectedA"],timeout=30000)
            assert plan["expectedB"] not in catalog_a.inner_text()
            results.append({
                "name":name,"viewport":width,
                "actionInputFromRealOwner":True,"actionMethod":"touch" if phone else "keyboard",
                "navRoute":plan["route"],"listRead":True,
                "detailReturnFilterPreserved":True,"enterpriseSwitchReauthorized":True,
                "noHorizontalOverflow":True,"chatScreenshot":initial,
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
