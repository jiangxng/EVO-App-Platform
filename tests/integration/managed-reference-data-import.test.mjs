import test from "node:test";
import assert from "node:assert/strict";

import { createMemoryEnterpriseResourceRepositoryV010 } from "../../dist/providers/enterprise-context/resources.js";
import { createBusinessDictionaryRepositoryV010 } from "../../dist/apps/business-dictionary/repository.js";
import { createOrganizationRepositoryV010 } from "../../dist/apps/organization/repository.js";
import { createPersonnelRepositoryV010 } from "../../dist/apps/personnel/repository.js";
import { createManagedReferencePublicationResolverV010 } from "../../dist/foundation/reference-resolution/model.js";
import { createObjectExtensionModelPublicationV010 } from "../../dist/apps/object-extension/model-publication.js";
import { createObjectExtensionRepositoryV010 } from "../../dist/apps/object-extension/repository.js";
import { createObjectExtensionValueRepositoryV010 } from "../../dist/apps/object-extension/values.js";
import { createCounterpartyRepositoryV010 } from "../../dist/apps/counterparty/repository.js";
import { createCounterpartyRoleRepositoryV010 } from "../../dist/apps/counterparty/roles.js";
import { createCounterpartyContactRepositoryV010, createCounterpartyAddressRepositoryV010,
  createCounterpartyProfileRepositoryV010 } from "../../dist/apps/counterparty/facets.js";
import { createCounterpartyImportTargetV010 } from "../../dist/apps/counterparty/import-target.js";
import { createDataImportRepositoryV010 } from "../../dist/apps/data-import/repository.js";
import { createDataImportServiceV010 } from "../../dist/apps/data-import/service.js";
import { parseCsvSourceV010 } from "../../dist/apps/data-import/csv.js";

const contextId="enterprise:a", at="2026-10-30T12:00:00.000Z";
const actorSubjectId="owner";
const owner={actorSubjectId,recordedAt:at};
const allRows=[
  ["CP-100","甲客户","ORGANIZATION","重点","销售一部","EMP-101"],
  ["CP-200","乙客户","ORGANIZATION","普通","销售二部","EMP-202"],
  ["CP-300","丙客户","ORGANIZATION","未知等级","销售一部",""],
  ["CP-400","丁客户","ORGANIZATION","旧客户","废弃部门","EMP-404"]
];
function csv(rows=allRows.slice(0,2)){
  return parseCsvSourceV010({
    name:"counterparty-import.csv",
    csv:[
      "往来编码,往来名称,主体类型,客户等级,负责部门,负责人源编码",
      ...rows.map(row=>row.join(","))
    ].join("\n")
  });
}
function extension(column, fieldId, kind, sourceId) {
  return {
    contractVersion:"0.1.0", extensionId:"enterprise." + fieldId,
    targetObjectType:"counterparty.subject",
    targetSlot:"counterparty.customer-profile",
    namespace:"enterprise.a.counterparty",fieldId,
    semanticType:"enterprise-business-reference",
    valueType:"REFERENCE",label:{default:column},
    required:false,order:35,applicability:{relationshipRoles:["CUSTOMER"]},
    surfaces:["DETAIL","EDIT","IMPORT"],importable:true,
    agentReadable:true,agentWritable:false,
    reference:{sourceKind:kind,sourceId,expectedVersion:1,cardinality:"ONE"}
  };
}
const referenceDefs=[
  ["客户等级","customerLevelRef","BUSINESS_DICTIONARY","counterparty.customer-level"],
  ["负责部门","departmentRef","ORGANIZATION","org.main"],
  ["负责人源编码","personRef","PERSONNEL","staff"]
];
const coreMap=[
  {sourceColumn:"往来编码",targetFieldId:"code"},
  {sourceColumn:"往来名称",targetFieldId:"displayName"},
  {sourceColumn:"主体类型",targetFieldId:"subjectType"}
];

function fixture(rows=allRows.slice(0,2)){
  const resources=createMemoryEnterpriseResourceRepositoryV010();
  const dictionary=createBusinessDictionaryRepositoryV010(resources);
  const organization=createOrganizationRepositoryV010(resources);
  const personnel=createPersonnelRepositoryV010(resources,organization);
  dictionary.saveDraft({contextId,dictionaryId:"counterparty.customer-level",
    expectedVersion:0,options:[
      {code:"A",label:{default:"Key"},aliases:["重点"],status:"ACTIVE"},
      {code:"B",label:{default:"Normal"},aliases:["普通"],status:"ACTIVE"},
      {code:"C",label:{default:"Retired"},aliases:["旧客户"],status:"INACTIVE"}
    ],...owner});
  dictionary.publish({contextId,dictionaryId:"counterparty.customer-level",
    expectedVersion:1,actorType:"HUMAN",...owner});
  organization.saveDraft({contextId,organizationId:"org.main",
    expectedVersion:0,units:[
      {unitId:"OU-01",code:"DEPT-01",displayName:{default:"Sales"},
        aliases:["销售一部"],kind:"DEPARTMENT",status:"ACTIVE"},
      {unitId:"OU-02",code:"DEPT-02",displayName:{default:"Service"},
        aliases:["销售二部"],kind:"DEPARTMENT",status:"ACTIVE"},
      {unitId:"OU-OLD",code:"OLD",displayName:{default:"Retired"},
        aliases:["废弃部门"],kind:"DEPARTMENT",status:"INACTIVE"}
    ],...owner});
  organization.publish({contextId,organizationId:"org.main",expectedVersion:1,
    actorType:"HUMAN",...owner});
  personnel.saveDraft({contextId,personnelDirectoryId:"staff",
    expectedVersion:0,persons:[
      {personId:"P-101",code:"EMP-101",displayName:{default:"张三"},
        state:"ACTIVE",assignments:[{organizationId:"org.main",organizationVersion:1,unitId:"OU-01"}]},
      {personId:"P-202",code:"EMP-202",displayName:{default:"张三"},
        state:"ACTIVE",assignments:[{organizationId:"org.main",organizationVersion:1,unitId:"OU-02"}]}
    ],...owner});
  personnel.publish({contextId,personnelDirectoryId:"staff",
    expectedVersion:1,actorType:"HUMAN",...owner});
  const active={dictionary:true,organization:true,personnel:true};
  const readers={
    businessDictionary:{isActive:()=>active.dictionary,reader:dictionary,repository:dictionary},
    organization:{isActive:()=>active.organization,reader:organization,repository:organization},
    personnel:{isActive:()=>active.personnel,reader:personnel,repository:personnel}
  };
  const publication=({fieldId,reference})=>
    createManagedReferencePublicationResolverV010({
      contextId,...readers
    })({fieldId,reference});
  const counterpartyRepository=createCounterpartyRepositoryV010(resources);
  const roleRepository=createCounterpartyRoleRepositoryV010(resources,counterpartyRepository);
  const extensionRepository=createObjectExtensionRepositoryV010(resources);
  const extensionValueRepository=createObjectExtensionValueRepositoryV010(resources);
  const target=createCounterpartyImportTargetV010({
    resources,repository:counterpartyRepository,roleRepository,
    contactRepository:createCounterpartyContactRepositoryV010({resources,counterpartyRepository}),
    addressRepository:createCounterpartyAddressRepositoryV010({resources,counterpartyRepository}),
    profileRepository:createCounterpartyProfileRepositoryV010({resources,counterpartyRepository,roleRepository}),
    extensionRepository,extensionValueRepository,
    referenceReaders:readers,
    resolvePublishedReference(_contextId,reference) {
      return publication({fieldId:"counterparty",reference});
    }
  });
  const importRepository=createDataImportRepositoryV010(resources);
  const service=createDataImportServiceV010({repository:importRepository,targets:[target]});
  const importJobId="import-refs";
  service.stage({contextId,importJobId,targetId:"counterparty.subject",
    targetParameters:{relationshipRoles:["CUSTOMER"]},
    source:csv(rows),mapping:coreMap,...owner});
  const model=createObjectExtensionModelPublicationV010({
    resources,getImportJob:(id,jobId)=>importRepository.get(id,jobId),
    isPublishedReference:(_contextId,reference)=>publication({fieldId:"model",reference})
  });
  const original=model.propose(contextId,importJobId);
  for(const [column,fieldId,kind,sourceId] of referenceDefs){
    const draft=model.saveDraft({
      contextId,importJobId,sourceColumn:column,
      sourceRevision:original.sourceRevision,
      definition:extension(column,fieldId,kind,sourceId),
      expectedVersion:0,...owner
    });
    model.publish({
      contextId,modelDraftId:draft.modelDraftId,
      expectedVersion:1,actorType:"HUMAN",...owner
    });
  }
  service.updateMapping({
    contextId,importJobId,
    mapping:[...coreMap,...referenceDefs.map(([column,fieldId])=>({
      sourceColumn:column,targetFieldId:fieldId
    }))],mappingOrigin:"HUMAN",...owner
  });
  return {
    resources,dictionary,organization,personnel,active,
    counterpartyRepository,extensionValueRepository,importRepository,
    service,target,importJobId
  };
}

test("IM-01: real governed dictionaries, organizations and people resolve to stable IDs in one Data Import job",()=>{
  const f=fixture();
  const dry=f.service.dryRun({contextId,importJobId:f.importJobId,locale:"zh-CN",...owner});
  assert.equal(dry.state,"DRY_RUN_READY");
  assert.equal(dry.dryRun.invalidRows,0);
  assert.deepEqual(dry.dryRun.rows.map(x=>[
    x.prepared.values.customerLevelRef,
    x.prepared.values.departmentRef,
    x.prepared.values.personRef
  ]),[["A","OU-01","P-101"],["B","OU-02","P-202"]]);
  assert.equal(dry.dryRun.schemaDigest.length > 10,true);
  assert.equal(dry.source.rows[0]["客户等级"],"重点","Original evidence remains untouched");
  const saved=f.service.commit({contextId,importJobId:f.importJobId,...owner});
  assert.equal(saved.state,"COMMITTED");
  assert.equal(saved.receipt.succeededRows,2);
  const subjects=f.counterpartyRepository.list(contextId);
  assert.equal(subjects.length,2);
  for(const item of subjects){
    const values=f.extensionValueRepository.listForObject({
      contextId,objectType:"counterparty.subject",objectId:item.counterpartyId
    });
    assert.ok(values.some(x=>Object.values(x.values).includes("P-101")
      ||Object.values(x.values).includes("P-202")));
  }
});

test("IM-01: unknown, inactive, missing personnel rows fail with exact row and field evidence, no partial commit",()=>{
  const f=fixture(allRows);
  const dry=f.service.dryRun({contextId,importJobId:f.importJobId,...owner});
  assert.equal(dry.state,"DRY_RUN_FAILED");
  assert.equal(dry.dryRun.totalRows,4);
  assert.equal(dry.dryRun.invalidRows,2);
  assert.deepEqual(dry.dryRun.rows.filter(x=>!x.ok).map(x=>x.rowNumber),[3,4]);
  assert.ok(dry.dryRun.rows[2].issues.some(x=>
    x.fieldId==="customerLevelRef" && x.code==="DATA_IMPORT_REFERENCE_UNKNOWN"));
  assert.ok(dry.dryRun.rows[3].issues.some(x=>
    x.fieldId==="customerLevelRef" && x.code==="DATA_IMPORT_REFERENCE_INACTIVE"));
  assert.ok(dry.dryRun.rows[3].issues.some(x=>
    x.fieldId==="departmentRef" && x.code==="DATA_IMPORT_REFERENCE_INACTIVE"));
  assert.ok(dry.dryRun.rows[3].issues.some(x=>
    x.fieldId==="personRef" && x.code==="DATA_IMPORT_REFERENCE_UNKNOWN"));
  assert.equal(dry.source.rows[2]["客户等级"],"未知等级");
  assert.throws(()=>f.service.commit({contextId,importJobId:f.importJobId,...owner}),
    /DATA_IMPORT_DRY_RUN_REQUIRED/);
  assert.equal(f.counterpartyRepository.list(contextId).length,0);
});

test("IM-01: changed published dictionary version or stopped plugin invalidates prior good preflight",()=>{
  for(const mode of ["version","stop"]){
    const f=fixture();
    const dry=f.service.dryRun({contextId,importJobId:f.importJobId,...owner});
    assert.equal(dry.state,"DRY_RUN_READY");
    if(mode==="version"){
      f.dictionary.saveDraft({contextId,dictionaryId:"counterparty.customer-level",
        expectedVersion:1,options:[
          {code:"A",label:{default:"New"},aliases:["重点"],status:"ACTIVE"}
        ],...owner});
      f.dictionary.publish({contextId,dictionaryId:"counterparty.customer-level",
        expectedVersion:2,actorType:"HUMAN",...owner});
    }else{
      f.active.dictionary=false;
    }
    assert.throws(()=>f.service.commit({contextId,importJobId:f.importJobId,...owner}),
      /FOUNDATION_OBJECT_REFERENCE_NOT_PUBLISHED/);
    assert.equal(f.counterpartyRepository.list(contextId).length,0);
  }
});

test("IM-01: optional blank reference cells do not become false failures",()=>{
  const f=fixture([["CP-500","空引用客户","ORGANIZATION","","",""]]);
  const dry=f.service.dryRun({contextId,importJobId:f.importJobId,...owner});
  assert.equal(dry.state,"DRY_RUN_READY");
  assert.equal(dry.dryRun.rows[0].prepared.values.customerLevelRef,null);
});
