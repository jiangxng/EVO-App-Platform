import test from "node:test";
import assert from "node:assert/strict";
import { createAppActionRouter } from "../../dist/actions/router.js";
import { createLazyAppActionHandlerV010 } from "../../dist/actions/lazy-handler.js";
import { counterpartyPackage } from "../../dist/apps/counterparty/package.js";
import { createCounterpartyProjectionActionHandlersV010 }
  from "../../dist/apps/counterparty/projection-actions.js";
import { counterpartyProjectionCollectionResultV010 }
  from "../../dist/apps/counterparty/collection-query.js";
import { COUNTERPARTY_MY_SUPPLIERS_COLLECTION_QUERY_V010 }
  from "../../dist/apps/counterparty/constants.js";

function context(active = "enterprise-context:a") {
  return {
    contractVersion:"0.1.0",correlationId:"cv01-test",
    principal:{contractVersion:"0.1.0",subjectId:"user-a",actorType:"HUMAN",
      identityProviderId:"test",sessionId:"test"},
    scope:{contractVersion:"0.1.0",enterpriseId:"enterprise-a"},
    context:{
      contractVersion:"0.1.0",
      activeContext:{contractVersion:"0.1.0",kind:"ENTERPRISE",
        contextId:active,enterpriseId:"enterprise-a"}
    }
  };
}
function request(code, values = {}) {
  return {contractVersion:"0.1.0",type:"command",
    command:{code,inputVersion:"0.1.0"},values,
    actionId:code,sourceInteractionId:"cv01-test",requiresConfirmation:false};
}
function authorizedProjection(query) {
  return {
    contractVersion:"0.1.0",projectionId:"counterparty.my-suppliers",
    route:"/counterparties/my-suppliers",count:2,
    readableFieldIds:["displayName","code"],
    counterparties:[{
      contractVersion:"0.1.0",counterpartyId:"supplier-a",
      displayName:"Hong Kong Supplier",code:"S001",
      email:"must-not-leak@example.invalid",status:"ACTIVE"
    }],
    pageInfo:{page:query?.page??0,pageSize:query?.pageSize??1,total:2,hasMore:true}
  };
}

test("CV-01 Counterparty normalized result never adds fields not permitted by owner", () => {
  const result = counterpartyProjectionCollectionResultV010(authorizedProjection({
    page:0,pageSize:1
  }));
  assert.equal(result.contractVersion,"0.1.0");
  assert.equal(result.collectionId,"counterparty.my-suppliers");
  assert.equal(result.schemaRef,"evo.counterparty/0.1.0");
  assert.equal(result.pageInfo.countKind,"EXACT");
  assert.deepEqual(result.rows[0], {
    rowId:"supplier-a",cells:{
      counterpartyId:"supplier-a",displayName:"Hong Kong Supplier",code:"S001"
    }
  });
  assert.equal(result.readableFieldIds.includes("email"),false);
  assert.equal(result.readableFieldIds.includes("status"),false);
  const unbounded = authorizedProjection({});
  delete unbounded.pageInfo;
  assert.throws(() => counterpartyProjectionCollectionResultV010(unbounded),
    /COUNTERPARTY_COLLECTION_PAGE_REQUIRED/);
});

test("CV-01 Customer/Supplier new READ operations share legacy owner, Host and Personal Agent exposure", async () => {
  const readOps = counterpartyPackage.features[0].contributions
    .filter(x => x.kind === "platform.capability-operation")
    .map(x => x.operation);
  const mySuppliers = readOps.find(x =>
    x.operationId === COUNTERPARTY_MY_SUPPLIERS_COLLECTION_QUERY_V010);
  assert.equal(mySuppliers.effect,"READ");
  assert.equal(mySuppliers.authorization.action,"counterparty.read");
  assert.ok(mySuppliers.exposure.includes("PERSONAL_AGENT"));
  assert.equal(mySuppliers.binding.type,"ACTION_HOST");
  assert.ok(mySuppliers.inputSchema.properties.pageSize.maximum <= 100);
  assert.ok(readOps.some(x => x.operationId ===
    "counterparty.collection.my-customers.query"));

  const calls = [];
  const service = {
    async read(input) {
      calls.push(input);
      if (input.contextId !== "enterprise-context:a")
        throw new Error("COUNTERPARTY_PERMISSION_DENIED");
      return authorizedProjection(input.query);
    }
  };
  const handlers = createCounterpartyProjectionActionHandlersV010({
    service,resolveEnterpriseRelationshipKind:()=>"MEMBER"
  });
  const normalized = handlers.find(h =>
    h.commandCode === COUNTERPARTY_MY_SUPPLIERS_COLLECTION_QUERY_V010);
  const first = await normalized.execute(request(
    COUNTERPARTY_MY_SUPPLIERS_COLLECTION_QUERY_V010,
    {search:"Hong Kong",sort:"displayName",page:0,pageSize:1}
  ),context());
  assert.equal(first.ok,true);
  assert.equal(first.result.collectionId,"counterparty.my-suppliers");
  assert.equal(first.result.pageInfo.total,2);
  assert.equal("counterparties" in first.result,false);
  assert.equal(calls[0].query.search,"Hong Kong");
  assert.equal(calls[0].enterpriseRelationshipKind,"MEMBER");

  const invalid = await normalized.execute(request(
    COUNTERPARTY_MY_SUPPLIERS_COLLECTION_QUERY_V010,{sort:"email"}
  ),context());
  assert.equal(invalid.ok,false);
  assert.equal(invalid.error.code,"COUNTERPARTY_QUERY_SORT_INVALID");
  assert.equal(calls.length,1,"bad query must not reach domain owner");

  const denied = await normalized.execute(request(
    COUNTERPARTY_MY_SUPPLIERS_COLLECTION_QUERY_V010,{}
  ),context("enterprise-context:b"));
  assert.equal(denied.ok,false);
  assert.equal(denied.error.code,"COUNTERPARTY_PERMISSION_DENIED");

  const legacy = handlers.find(h =>
    h.commandCode === "counterparty.projection.my-suppliers.read");
  const old = await legacy.execute(request(legacy.commandCode,{}),context());
  assert.equal(old.ok,true);
  assert.ok("counterparties" in old.result);
  assert.equal("rows" in old.result,false);

  let active = false, loads = 0;
  const lazy = createLazyAppActionHandlerV010({
    packageId:"evo-counterparty",featureId:"evo-counterparty.default",
    commandCode:COUNTERPARTY_MY_SUPPLIERS_COLLECTION_QUERY_V010,
    async load(){loads++;return normalized}
  });
  const router = createAppActionRouter([lazy],()=>active);
  const call = request(COUNTERPARTY_MY_SUPPLIERS_COLLECTION_QUERY_V010,{});
  assert.equal((await router.execute(call,context())).error.code,
    "ACTION_FEATURE_NOT_ACTIVE");
  assert.equal(loads,0,"disabled plugin is not loaded");
  active = true;
  assert.equal((await router.execute(call,context())).ok,true);
  assert.equal(loads,1);
});
