import test from "node:test";
import assert from "node:assert/strict";
import { createCounterpartyProjectionServiceV010 } from "../../dist/apps/counterparty/projection-service.js";
import { createCounterpartyProjectionActionHandlersV010 } from "../../dist/apps/counterparty/projection-actions.js";
import { parseCounterpartyProjectionQueryV010 } from "../../dist/apps/counterparty/projection-query.js";
import { COUNTERPARTY_MY_SUPPLIER_PROJECTION_V010 } from "../../dist/apps/counterparty/projections.js";
import { COUNTERPARTY_MY_SUPPLIERS_READ_COMMAND_V010 } from "../../dist/apps/counterparty/constants.js";

const contextId = "enterprise-context:bex-paging";
const principalId = "buyer-paging";
function requestContext() {
  return {
    contractVersion: "0.1.0",
    principal: { contractVersion: "0.1.0", subjectId: principalId,
      actorType: "HUMAN", identityProviderId: "test", sessionId: "bex" },
    scope: { contractVersion: "0.1.0", enterpriseId: "ent-paging", userId: principalId },
    context: { contractVersion: "0.1.0",
      activeContext: { kind: "ENTERPRISE", contextId, enterpriseId: "ent-paging" } },
    correlationId: "bex-paging"
  };
}
function fixture() {
  const records = Array.from({length: 140}, (_, n) => ({
    contractVersion: "0.1.0", counterpartyId: "supplier-" + String(n).padStart(4,"0"),
    code: "S" + String(n).padStart(4,"0"),
    displayName: "Supplier " + String(n).padStart(4,"0"),
    subjectType: "ORGANIZATION", status: "ACTIVE",
    email: "private@example.com"
  }));
  // The permission provider rejects some records and all non-listed fields.
  const authorized = new Set(records.filter((_, n) => n % 4 === 0).map(x => x.counterpartyId));
  const responsibilities = records.map(x => ({
    status: "ACTIVE", responsibilityType: "PROCUREMENT_OWNER",
    targetRef: {objectType: "counterparty.subject",objectId: x.counterpartyId},
    assigneeRef: {kind:"PRINCIPAL", id:principalId}
  }));
  const service = createCounterpartyProjectionServiceV010({
    repository: {list: () => records},
    roleRepository: {list: () => records.map(x => ({
      counterpartyId:x.counterpartyId,roleCode:"SUPPLIER"
    }))},
    responsibilityRepository: {list: () => responsibilities},
    resolveAuthorizationProvider: () => ({
      check: async request => ({
        allowed: request.resource.type.includes("field")
          ? ["displayName", "code"].includes(request.resource.id)
          : authorized.has(request.resource.id)
      })
    }),
    fieldIds: () => ["displayName","code","email","status"]
  });
  return {service,authorized};
}
test("BEX-01 pagination scopes and filters before slicing; result is bounded and stable", async () => {
  const { service,authorized } = fixture();
  const input = { contextId, projectionId:COUNTERPARTY_MY_SUPPLIER_PROJECTION_V010,
    requestContext:requestContext(),enterpriseRelationshipKind:"MEMBER" };
  const first = await service.read({...input,query:{page:0,pageSize:25,sort:"code"}});
  const second = await service.read({...input,query:{page:1,pageSize:25,sort:"code"}});
  assert.equal(first.count,35);
  assert.deepEqual(first.pageInfo,{page:0,pageSize:25,total:35,hasMore:true});
  assert.deepEqual(second.pageInfo,{page:1,pageSize:25,total:35,hasMore:false});
  assert.equal(first.counterparties.length,25);
  assert.equal(second.counterparties.length,10);
  assert.equal(new Set([...first.counterparties,...second.counterparties].map(x=>x.counterpartyId)).size,35);
  assert.ok([...first.counterparties,...second.counterparties].every(x=>authorized.has(x.counterpartyId)));
  const searched=await service.read({...input,query:{search:"S0008",page:0,pageSize:25}});
  assert.equal(searched.count,1);
  assert.equal(searched.counterparties[0].code,"S0008");
  const denied=await service.read({...input,query:{search:"S0009",page:0,pageSize:25}});
  assert.equal(denied.count,0);
  const late=await service.read({...input,query:{page:3,pageSize:25}});
  assert.equal(late.counterparties.length,0);
  assert.equal(late.pageInfo.total,35);
  const legacy=await service.read(input);
  assert.equal(legacy.counterparties.length,35);
  assert.equal(legacy.pageInfo,undefined);
});
test("BEX-01 cannot sort on a field the principal cannot read",async()=>{
  const {service}=fixture();
  await assert.rejects(service.read({
    contextId,projectionId:COUNTERPARTY_MY_SUPPLIER_PROJECTION_V010,
    requestContext:requestContext(),enterpriseRelationshipKind:"MEMBER",
    query:{page:0,pageSize:25,sort:"status"}
  }),/COUNTERPARTY_QUERY_SORT_FORBIDDEN/);
});
test("BEX-01 scoped ActionHost query rejects injected params and unbounded pages",async()=>{
  const {service}=fixture();
  const handlers=createCounterpartyProjectionActionHandlersV010({
    service,resolveEnterpriseRelationshipKind:()=> "MEMBER"
  });
  const handler=handlers.find(x=>x.commandCode===COUNTERPARTY_MY_SUPPLIERS_READ_COMMAND_V010);
  const base={
    contractVersion:"0.1.0",type:"command",
    command:{code:COUNTERPARTY_MY_SUPPLIERS_READ_COMMAND_V010,inputVersion:"0.1.0"},
    sourceInteractionId:"bex",actionId:"bex",requiresConfirmation:false
  };
  const pass=await handler.execute({...base,values:{page:1,pageSize:25}},requestContext());
  assert.equal(pass.ok,true);
  assert.equal(pass.result.pageInfo.page,1);
  const reject=await handler.execute({...base,values:{page:0,extra:"unauthorized"}},requestContext());
  assert.equal(reject.ok,false);
  assert.equal(reject.error.code,"COUNTERPARTY_QUERY_FIELD_UNSUPPORTED");
  for(const values of [{pageSize:100000},{page:-1},{search:"x".repeat(121)},{sort:"email"}]){
    assert.throws(()=>parseCounterpartyProjectionQueryV010(values));
  }
});
