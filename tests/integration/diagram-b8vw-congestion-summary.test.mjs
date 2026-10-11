import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";

/** Structural guard only. Real DOM count and accessibility are validated in
 * EVO B8v Chrome and Firefox/WebKit workflows; don't conflate the two. */
test("B8v congested summary is derived from rendered geometry, never persisted",async()=>{
 const source=await readFile(new URL("../../vendor/eidos/src/diagram/surface.ts",import.meta.url),"utf8");
 assert.match(source,/let congestedRouteCount = 0;/);
 assert.match(source,/if \(geometry\.congested\) \{\s*congestedRouteCount \+= 1;/);
 assert.match(source,/svg\.setAttribute\("data-eidos-diagram-congested-count", String\(congestedRouteCount\)\)/);
 assert.match(source,/if \(congestedRouteCount > 0\)/);
 assert.match(source,/summary\.setAttribute\("role", "note"\)/);
 assert.match(source,/pointer-events:none;z-index:5/);
 assert.match(source,/canvas\.replaceChildren\(\)/);
 assert.doesNotMatch(source,/summary\.setAttribute\("role", "alert"\)/);
});
