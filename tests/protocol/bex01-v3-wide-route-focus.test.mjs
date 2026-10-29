import test from "node:test";
import assert from "node:assert/strict";
import {shouldFocusBex01V3ReviewWorkspaceRouteV010 as focus}
  from "../../dist/manager/desktop-workbench-runtime.js";

test("V3 wide review scopes only actual mapping and authorized batch route shapes",()=>{
  assert.equal(focus("/data-import/jobs/import-abc/map"),true);
  assert.equal(focus("/data-import/jobs/import-abc/map?source=review"),true);
  assert.equal(focus("/object-extensions/from-import?job=import-abc&mode=batch"),true);
  assert.equal(focus("/object-extensions/from-import?mode=batch&job=import-abc"),true);
  assert.equal(focus("/object-extensions/from-import?job=import-abc&mode=confirm"),true);
  for(const wrong of [
    "/data-import",
    "/data-import/jobs/import-abc",
    "/data-import/jobs/import-abc/validate",
    "/data-import/jobs/import-abc/map/extra",
    "/data-import/jobs/import-abc/map-internal",
    "/object-extensions/from-import?job=import-abc",
    "/object-extensions/from-import?mode=batch",
    "/object-extensions/from-import?mode=batch&job=",
    "/object-extensions/from-import?mode=confirm&job=",
    "/object-extensions/from-import?job=import-abc&mode=single",
    "/counterparties/suppliers",
    "/enterprise-agent",
    "https://ledger-configurator-production.up.railway.app/"
  ])assert.equal(focus(wrong),false,wrong);
});

test("Platform does not write V3 route focus into persisted navigation preferences",async()=>{
  const fs=await import("node:fs/promises");
  const source=await fs.readFile(new URL("../../manager/desktop-workbench-runtime.ts",import.meta.url),"utf8");
  assert.match(source,/shouldFocusBex01V3ReviewWorkspaceRouteV010/);
  assert.doesNotMatch(source,/eidos\.workbench\.layout.*BEX-01|localStorage\.setItem\("evo\.v3\.focus"/);
});
