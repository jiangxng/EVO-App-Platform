#!/usr/bin/env node
/**
 * TR-01B2B: isolated EVO PostgreSQL **reference certification only**.
 * No demo cost/replay POST endpoints are called by
 * App Platform application/Agent code. This consumes the exact
 * App-Platform-created immutable TR-01B1 BusinessData from the preceding CI
 * step, checks valuation posting, COGS and full replay via EVO's own owner.
 */
import assert from "node:assert/strict";
import { createDatabase } from "../evo/dist/platform/database/src/index.js";
import { createEvoRuntime, drainPosting } from "../evo/dist/apps/api/src/evo-runtime.js";

const base=(process.env.EVO_BASE_URL??"http://127.0.0.1:3000").replace(/\/$/u,"");
const orderNo="TR01B-SO-001";
const customer="cp-tr01b-customer";
const item="item-tr01b";
const warehouse="wh-tr01b";
const code=process.env.EVO_ENTERPRISE_CODE??"EVO_DEMO";
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function get(path){
  const response=await fetch(base+path,{headers:{accept:"application/json"}});
  const data=await response.json();
  if(!response.ok) throw Error("TR01B2B_EVO_HTTP_"+response.status+":"+JSON.stringify(data));
  return data;
}
const dims={order_no:orderNo,customer,product_id:item,warehouse};
const finDims={order_no:orderNo,customer};
async function exactBalance(enterprise,ledger,scope){
  const qs=new URLSearchParams({enterprise_id:enterprise,limit:"100"});
  for(const [k,v] of Object.entries(scope)) qs.set("dimension."+k,v);
  const page=await get("/api/v1/ledgers/"+encodeURIComponent(ledger)+"/balances?"+qs);
  assert.equal(page.truncated,false,"Valuation ledger API may not be truncated");
  const rows=page.items.filter(row=>Object.entries(scope).every(([k,v])=>row.dimensions?.[k]===v));
  assert.equal(rows.length,1,"Unique dimensioned "+ledger+" LedgerBalance required");
  assert.equal(rows.length,page.items.length,"No cross-scope ledger rows allowed");
  return rows[0];
}
const tenant=await get("/api/v1/enterprises/"+encodeURIComponent(code));
const enterprise=tenant.id;
const beforeInventory=await exactBalance(enterprise,"inventory",dims);
assert.equal(Number(beforeInventory.quantity),0);
assert.equal(Number(beforeInventory.amount),125,
 "B2A observed unvalued Inventory amount must be retained before EVO CostEngine");
const beforeReceivable=await exactBalance(enterprise,"receivable",finDims);
const beforeCash=await exactBalance(enterprise,"cash",finDims);
assert.equal(Number(beforeReceivable.amount),0);
assert.equal(Number(beforeCash.amount),1000);

// Deliberate CI-only reference call. /demo/* routes have no production
// commitment, no Host principal/scope authorization, and may not be
// registered as an Agent Capability Operation.
// CI-only EVO OWNER RUNTIME: No production API, Agent capability or App
// Platform product code invokes the private cost/replay internals.
// All writes here remain in the disposable CI PostgreSQL EVO runtime.
const database=createDatabase(process.env.DATABASE_URL
  ?? "postgres://evo:evo@localhost:5432/evo");
const runtime=createEvoRuntime(database);
try {
 const vp=await runtime.db.selectFrom("valuation_policy")
  .select(["id","version"]).where("enterprise_id","=",enterprise)
  .where("code","=","inventory_fifo").where("method","=","FIFO")
  .where("status","=","ACTIVE").where("version","=",1)
  .executeTakeFirstOrThrow();
 const ap=await runtime.db.selectFrom("allocation_policy")
  .select(["id","version"]).where("enterprise_id","=",enterprise)
  .where("code","=","inventory_fifo").where("status","=","PUBLISHED")
  .where("version","=",1).executeTakeFirstOrThrow();
 const pins={
  valuationPolicyId:vp.id,valuationPolicyVersion:vp.version,
  allocationPolicyId:ap.id,allocationPolicyVersion:ap.version
 };
 const cost=await runtime.cost.recalculate(enterprise,"FIFO",pins);
 assert.ok(cost.costRunId,JSON.stringify(cost));
 assert.equal(cost.method,"FIFO");
 assert.ok(cost.resultCount>=1,JSON.stringify(cost));
 assert.ok(cost.valuationPostingCount>=1,JSON.stringify(cost));
const inventory=await exactBalance(enterprise,"inventory",dims);
const cogs=await exactBalance(enterprise,"cogs",dims);
assert.equal(Number(inventory.quantity),0);
assert.equal(Number(inventory.amount),0,
 "Pinned valuation must remove residual inventory amount through EVO valuation posting");
assert.equal(Number(cogs.amount),125,
 "Only EVO cost allocation + valuation may recognize shipment COGS");
assert.equal(Number(cogs.quantity),0);

const beforeDigest=await runtime.query.balanceDigest(enterprise);
const replay=await runtime.replay.prepareFullReplay(enterprise);
assert.equal(replay.beforeDigest,beforeDigest);
assert.equal(replay.costMethod,"FIFO");
assert.ok(replay.costPins?.valuationPolicyId);
assert.ok(replay.costPins?.allocationPolicyId);
const posted=await drainPosting(runtime,enterprise);
assert.ok(posted>=4,"Replay must rebuild the four immutable sales facts");
const replayedCost=await runtime.cost.recalculate(
 enterprise,replay.costMethod,replay.costPins
);
assert.ok(replayedCost.valuationPostingCount>=1);
await runtime.work.refresh(enterprise);
const afterDigest=await runtime.query.balanceDigest(enterprise);
await runtime.replay.completeFullReplay(
 replay.replayRunId,enterprise,afterDigest
);
assert.equal(beforeDigest,afterDigest,"EVO economic digest changed after pinned Full Replay");
const rebuiltInventory=await exactBalance(enterprise,"inventory",dims);
const rebuiltCogs=await exactBalance(enterprise,"cogs",dims);
const rebuiltReceivable=await exactBalance(enterprise,"receivable",finDims);
const rebuiltCash=await exactBalance(enterprise,"cash",finDims);
for(const [name,actual,expected] of [
 ["inventoryQty",rebuiltInventory.quantity,0],
 ["inventoryAmount",rebuiltInventory.amount,0],
 ["COGS",rebuiltCogs.amount,125],
 ["receivable",rebuiltReceivable.amount,0],
 ["cash",rebuiltCash.amount,1000]
]){
 assert.equal(Number(actual),expected,"Replay changed "+name);
}
const openWork=await get("/api/v1/work-items?enterprise_id="+encodeURIComponent(enterprise)+"&limit=100");
assert.ok(!openWork.items.some(x=>x.dimensions?.order_no===orderNo
  && ["SHIP","COLLECT"].includes(x.workType)),
 "Authoritative SHIP/COLLECT Work must remain closed after replay");

console.log("TR01B2B_EVO_PINNED_COST_COGS_REPLAY_PROOF="+JSON.stringify({
 status:"PASS",enterpriseId:enterprise,orderNo,
 factsSource:"TR01B1_APP_PLATFORM_PUBLIC_BUSINESS_DATA",
 runtimeCostOwner:"EVO_COST_ENGINE_AND_VALUATION_POSTING",
 certificationEndpoint:"EVO_DEMO_ONLY_NOT_PRODUCTION_CONTRACT",
 method:"FIFO",costRunId:cost.costRunId,
 originalQuantity:Number(beforeInventory.quantity),
 originalInventoryRawAmount:Number(beforeInventory.amount),
 valuedInventoryAmount:Number(inventory.amount),
 valuedCOGS:Number(cogs.amount),
 replayDeterministic:replay.deterministic,
 unchangedReceivable:Number(rebuiltReceivable.amount),
 unchangedCash:Number(rebuiltCash.amount),
 financialAccountMasterObject:"NOT_IMPLEMENTED",
 formalCashAllocation:"NOT_CERTIFIED",
 productionCostCommand:"MISSING_GOVERNED_PUBLIC_API"
}));
