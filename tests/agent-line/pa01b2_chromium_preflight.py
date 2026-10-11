#!/usr/bin/env python3
"""Native Chromium guard preflight on built PA-01B2 code. NOT a full App Host/backend gate."""
import json
import re
from datetime import datetime, timezone
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[2]
MODULE = ROOT / "dist/vendor/eidos/src/app-host/contextual-assistance.js"
assert MODULE.is_file(), "Build App Platform before Chromium test"
source = MODULE.read_text(encoding="utf-8")
assert not re.search(r"(?m)^\s*import\s", source), "Guard gained runtime imports; migrate to ES module harness"
source = re.sub(r"\bexport\s+", "", source)
OUT = ROOT / "artifacts/agent-pa01b2-chromium"
OUT.mkdir(parents=True, exist_ok=True)
SOURCE = {"pageId": "mapping", "route": "/data-import/jobs/isolated-job", "actionId": "ai-auto-map"}
CONTEXT = {"taskKind": "data-import.mapping", "importJobId": "isolated-job", "targetId": "counterparty.subject"}
results = []

with sync_playwright() as pw:
    browser = pw.chromium.launch(headless=True)
    def run(name, check):
        page = browser.new_page(viewport={"width": 1200, "height": 760})
        exceptions = []
        page.on("pageerror", lambda e: exceptions.append(str(e)))
        page.set_content('<div id="work"><label>Mapping<input name="mapping" aria-label="Mapping" value="initial"></label><label>Notes<textarea name="notes" aria-label="Notes">initial</textarea></label><label>Type<select name="type" aria-label="Type"><option>SUPPLIER</option><option>CUSTOMER</option></select></label></div><div data-eidos-chat-composer><textarea aria-label="Chat">hello</textarea></div>')
        page.add_script_tag(content=source)
        page.evaluate('window.draft=trackContextualFormDraftV010(document.querySelector("#work"))')
        try:
            observed = check(page)
            assert not exceptions, exceptions
            results.append({"case": name, "status": "PASS", "observed": observed})
        except Exception as exc:
            results.append({"case": name, "status": "FAIL", "error": str(exc)})
        finally:
            page.close()

    def response(state="SUCCEEDED", request_id="assist-1"):
        return {"ok": True, "result": {
            "run": {"runId": "run-1", "state": state},
            "assistanceResult": {"contractVersion": "0.1.0", "requestId": request_id,
                "taskKind": "data-import.mapping", "source": SOURCE,
                "runId": "run-1", "runState": state, "actionReceiptIds": []}
        }}

    def decision(page, payload, same_mount=True):
        dirty = page.evaluate("window.draft.isDirty()")
        choice = page.evaluate("(input)=>contextualRefreshDecisionV010(input)",
            {"result": payload, "requestId": "assist-1", "source": SOURCE,
             "taskKind": "data-import.mapping", "sameMount": same_mount, "dirty": dirty})
        return {"decision": choice, "dirty": dirty}

    def clean(page):
        state = decision(page, response())
        assert state == {"decision": "REFRESH", "dirty": False}
        page.locator("#work").evaluate("(el)=>el.innerHTML=\"<input name='mapping' value='fresh'>\"")
        assert page.locator('input[name="mapping"]').input_value() == "fresh"
        return state
    run("clean-success", clean)

    def before(page):
        page.get_by_label("Mapping").fill("human draft before")
        state = decision(page, response())
        assert state == {"decision": "PRESERVE_DRAFT", "dirty": True}
        assert page.get_by_label("Mapping").input_value() == "human draft before"
        page.screenshot(path=str(OUT / "existing-draft.png"))
        return state
    run("existing-draft", before)

    def inflight(page):
        assert page.evaluate("window.draft.isDirty()") is False
        page.get_by_label("Notes").fill("edited while Agent pending")
        state = decision(page, response())
        assert state["decision"] == "PRESERVE_DRAFT"
        assert page.get_by_label("Notes").input_value() == "edited while Agent pending"
        return state
    run("inflight-draft", inflight)

    def reopened(page):
        page.evaluate("window.draft.dispose()")
        page.locator("#work").evaluate("(el)=>el.innerHTML=\"<input name='mapping' value='new mount'>\"")
        state = decision(page, response(), same_mount=False)
        assert state["decision"] == "IGNORE"
        assert page.locator('input[name="mapping"]').input_value() == "new mount"
        return state
    run("same-route-remount", reopened)

    for kind in ("FAILED", "PAUSED", "CANCELLED"):
        def rejected(page, status=kind):
            state = decision(page, response(status))
            assert state["decision"] == "IGNORE"
            return state
        run(kind.lower() + "-no-refresh", rejected)

    def uncorrelated(page):
        state = decision(page, response(request_id="other"))
        assert state["decision"] == "IGNORE"
        return state
    run("request-id-mismatch", uncorrelated)

    def ordinary(page):
        value = page.evaluate('contextualAssistanceRequestV010("hello","chat-1",undefined)')
        assert value is None
        return {"assistanceRequestAdded": False}
    run("ordinary-chat", ordinary)

    def field_mapping(page):
        value = page.evaluate('(context)=>contextualAssistanceRequestV010("map fields","assist-1",context)',
                              {"source": SOURCE, "context": CONTEXT})
        assert value["taskKind"] == "data-import.mapping"
        assert value["context"]["importJobId"] == "isolated-job"
        assert value["source"]["actionId"] == "ai-auto-map"
        assert "principal" not in value
        return {"requestId": value["requestId"], "taskKind": value["taskKind"], "source": value["source"]}
    run("data-import-mapping-envelope", field_mapping)

    proof = {"testedAtUtc": datetime.now(timezone.utc).isoformat(),
             "browser": browser.version,
             "source": str(MODULE.relative_to(ROOT)),
             "evidenceLevel": "NATIVE_CHROMIUM_HELPER_PREFLIGHT_ONLY",
             "fullAppHostWithMatchingBackendAccepted": False,
             "passed": sum(row["status"] == "PASS" for row in results),
             "total": len(results), "results": results}
    (OUT / "report.json").write_text(json.dumps(proof, indent=2, ensure_ascii=False), encoding="utf-8")
    print(json.dumps(proof, indent=2, ensure_ascii=False))
    browser.close()
    assert proof["passed"] == proof["total"], "Native Chromium preflight failed"
