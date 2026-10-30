import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

import {
  createFileEnterpriseResourceRepositoryV010,
  createMemoryEnterpriseResourceRepositoryV010
} from "../../dist/providers/enterprise-context/resources.js";
import {
  createOrganizationRepositoryV010
} from "../../dist/apps/organization/repository.js";
import {
  createOrganizationActionHandlersV010
} from "../../dist/apps/organization/actions.js";
import {
  createOrganizationRuntimeHostV010
} from "../../dist/manager/organization-runtime.js";
import { organizationPackage } from "../../dist/catalog/seed.js";
import { createAppActionRouter } from "../../dist/actions/router.js";
import { createLazyAppActionHandlerV010 } from "../../dist/actions/lazy-handler.js";

const scope="enterprise-context:a", organizationId="org.main";
const options=[
  {unitId:"OU-ROOT",code:"ROOT",displayName:{default:"Group"},
    kind:"DIVISION",status:"ACTIVE"},
  {unitId:"OU-01",code:"DEPT-01",displayName:{default:"Sales",translations:{"zh-CN":"销售一部"}},
    aliases:["销售一部"],kind:"DEPARTMENT",parentUnitId:"OU-ROOT",
    status:"ACTIVE",effectiveFrom:"2026-01-01"},
  {unitId:"OU-02",code:"DEPT-02",displayName:{default:"Support"},
    kind:"DEPARTMENT",status:"ACTIVE"},
  {unitId:"OU-OLD",code:"OLD",displayName:{default:"Closed"},
    kind:"TEAM",status:"INACTIVE"}
];
const base={contextId:scope,organizationId,actorSubjectId:"owner",
  recordedAt:"2026-10-30T00:00:00.000Z"};
const repo=()=>createOrganizationRepositoryV010(createMemoryEnterpriseResourceRepositoryV010());
function context(actorType="HUMAN") {
  return {
    contractVersion:"0.1.0",
    principal:{contractVersion:"0.1.0",subjectId:"owner",actorType,
      identityProviderId:"test",sessionId:"s"},
    scope:{contractVersion:"0.1.0",enterpriseId:"enterprise-a"},
    context:{contractVersion:"0.1.0",
      personalContext:{contractVersion:"0.1.0",kind:"PERSONAL",
        contextId:"personal:owner",ownerSubjectId:"owner"},
      activeContext:{contractVersion:"0.1.0",kind:"ENTERPRISE",
        contextId:scope,enterpriseId:"enterprise-a"}},
    correlationId:"org-test"
  };
}
function request(code,values) {
  return {contractVersion:"0.1.0",type:"command",
    command:{code,inputVersion:"0.1.0"},values,
    actionId:code,sourceInteractionId:"org-test",requiresConfirmation:false};
}
test("OR-01: optional organization plugin depends on existing enterprise resource",()=>{
  const feature=organizationPackage.features[0];
  assert.equal(organizationPackage.packageId,"evo-organization");
  assert.ok(feature.requiresCapabilities.includes("enterprise.resource.repository"));
  assert.ok(feature.providesCapabilities.includes("enterprise.organization"));
  assert.equal(feature.contributions.filter(x=>x.kind==="platform.capability-operation").length,4);
});
test("OR-01/02: publish forest with stable units; no forced single organization tree",()=>{
  const db=repo();
  const draft=db.saveDraft({...base,expectedVersion:0,units:options});
  assert.equal(draft.state,"DRAFT");
  assert.equal(db.getEffective(scope,organizationId),undefined);
  assert.equal(db.publish({...base,expectedVersion:1,actorType:"HUMAN"}).state,"PUBLISHED");
  const matches=db.resolveBatch({contextId:scope,organizationId,
    sourceValues:["DEPT-01","销售一部","销售一部 ","OLD","销售二部"]});
  assert.deepEqual(matches.map(x=>x.status),[
    "RESOLVED","RESOLVED","RESOLVED","INACTIVE","UNKNOWN"
  ]);
  assert.equal(matches[0].unitId,"OU-01");
  assert.deepEqual(db.history(scope,organizationId).map(x=>x.version),[1]);
  assert.equal(db.list(scope).length,1);
});
test("OR-01: cycle, missing and inactive parent cannot be published",()=>{
  const invalid=[
    [[{...options[0],parentUnitId:"OU-01"},...options.slice(1)],"CYCLE"],
    [[options[0],{...options[1],parentUnitId:"MISSING"},...options.slice(2)],"PARENT_NOT_FOUND"],
    [[{...options[0],status:"INACTIVE"},...options.slice(1)],"PARENT_INACTIVE"]
  ];
  for(const [units,code] of invalid){
    const db=repo();
    db.saveDraft({...base,expectedVersion:0,units});
    assert.throws(()=>db.publish({...base,expectedVersion:1,actorType:"HUMAN"}),
      new RegExp("ORGANIZATION_.*"+code));
    assert.equal(db.getEffective(scope,organizationId),undefined);
  }
});
test("OR-01: alias collisions reject publication and source labels never become IDs",()=>{
  const db=repo();
  db.saveDraft({...base,expectedVersion:0,units:[
    options[0],{...options[1],aliases:["SUPPORT"]},options[2],options[3]
  ]});
  assert.throws(()=>db.publish({...base,expectedVersion:1,actorType:"HUMAN"}),
    /ORGANIZATION_SOURCE_MAPPING_AMBIGUOUS/);
  assert.throws(()=>db.saveDraft({...base,expectedVersion:1,
    units:[options[0],{...options[1],code:"root"},...options.slice(2)]}),
    /ORGANIZATION_DUPLICATE_CODE/);
});
test("OR-02: versions, stable identity, idempotent publish and retained effective read",()=>{
  const db=repo();
  assert.equal(db.saveDraft({...base,expectedVersion:0,units:options}).version,1);
  assert.equal(db.saveDraft({...base,expectedVersion:0,units:options}).version,1);
  assert.throws(()=>db.publish({...base,expectedVersion:1,actorType:"AI"}),
    /ORGANIZATION_PUBLISH_HUMAN_REQUIRED/);
  db.publish({...base,expectedVersion:1,actorType:"HUMAN"});
  db.publish({...base,expectedVersion:1,actorType:"HUMAN"});
  db.saveDraft({...base,expectedVersion:1,units:[
    options[0],{...options[1],displayName:{default:"New Sales Name"}},...options.slice(2)
  ]});
  assert.equal(db.getEffective(scope,organizationId).version,1);
  assert.equal(db.resolveBatch({contextId:scope,organizationId,expectedVersion:2,
    sourceValues:["DEPT-01"]})[0].status,"VERSION_MISMATCH");
  assert.equal(db.resolveBatch({contextId:scope,organizationId,
    sourceValues:["New Sales Name"]})[0].status,"UNKNOWN");
  assert.throws(()=>db.publish({...base,expectedVersion:1,actorType:"HUMAN"}),
    /ORGANIZATION_VERSION_CONFLICT/);
});
test("OR-02: tenant isolation, effective dates and durable process-style restart",()=>{
  const dir=mkdtempSync(join(tmpdir(),"org-evo-"));
  try{
    const path=join(dir,"resources.json");
    let db=createOrganizationRepositoryV010(createFileEnterpriseResourceRepositoryV010(path));
    db.saveDraft({...base,expectedVersion:0,units:options});
    db.publish({...base,expectedVersion:1,actorType:"HUMAN"});
    db=createOrganizationRepositoryV010(createFileEnterpriseResourceRepositoryV010(path));
    assert.equal(db.getEffective(scope,organizationId).version,1);
    assert.equal(db.getEffective("enterprise-context:b",organizationId),undefined);
    assert.throws(()=>db.resolveBatch({contextId:"enterprise-context:b",organizationId,
      sourceValues:["DEPT-01"]}),/ORGANIZATION_NOT_PUBLISHED/);
    assert.equal(db.resolveBatch({contextId:scope,organizationId,
      effectiveAt:"2025-12-01",sourceValues:["DEPT-01"]})[0].status,"INACTIVE");
  }finally{rmSync(dir,{recursive:true,force:true})}
});
test("OR-02: Host ActionRouter and lazy lease deny inactive state and unauthorized publish",async()=>{
  let active=false,loads=0;
  const host=createOrganizationRuntimeHostV010({isActive:()=>active,
    resources:createMemoryEnterpriseResourceRepositoryV010()});
  const codes=["organization.list","organization.draft.save",
    "organization.publish","organization.resolve.batch"];
  const router=createAppActionRouter(codes.map(code=>createLazyAppActionHandlerV010({
    packageId:"evo-organization",featureId:"evo-organization.default",
    commandCode:code,
    async load(){
      loads++;
      return createOrganizationActionHandlersV010({
        resolveRepository:()=>host.resolve(),canRead:()=>true,canManage:()=>true
      }).find(x=>x.commandCode===code);
    }
  })),id=>active&&id==="evo-organization.default");
  const draft=request("organization.draft.save",{organizationId,expectedVersion:0,units:options});
  assert.equal((await router.execute(draft,context())).error.code,"ACTION_FEATURE_NOT_ACTIVE");
  assert.equal(loads,0);
  active=true;
  assert.equal((await router.execute(draft,context())).ok,true);
  assert.equal((await router.execute(request("organization.publish",{organizationId,expectedVersion:1}),
    context("AI"))).error.code,"ORGANIZATION_PUBLISH_HUMAN_REQUIRED");
  assert.equal((await router.execute(request("organization.publish",{organizationId,expectedVersion:1}),
    context())).ok,true);
  const read=await router.execute(request("organization.resolve.batch",
    {organizationId,sourceValues:["DEPT-01"]}),context());
  assert.equal(read.result.data[0].unitId,"OU-01");
  active=false;
  assert.equal((await router.execute(draft,context())).error.code,"ACTION_FEATURE_NOT_ACTIVE");
  await host.stop();
});
