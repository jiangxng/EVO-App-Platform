import test from 'node:test';
import assert from 'node:assert/strict';
import { createPackageCatalog } from '../../dist/catalog/catalog.js';
import { createMemoryLifecycleStore } from '../../dist/manager/store.js';
import { createAppManagerService } from '../../dist/manager/service.js';
import { createAppActionRouter } from '../../dist/actions/router.js';
import { createMemoryEnterpriseResourceRepositoryV010 } from '../../dist/providers/enterprise-context/resources.js';
import { createObjectExtensionRepositoryV010 } from '../../dist/apps/object-extension/repository.js';
import { createObjectExtensionValueRepositoryV010 } from '../../dist/apps/object-extension/values.js';
import { createObjectExtensionActionHandlersV010 } from '../../dist/apps/object-extension/actions.js';
import { objectExtensionPackage } from '../../dist/apps/object-extension/package.js';
import { OBJECT_EXTENSION_DEFINITION_UPSERT_COMMAND_V010 } from '../../dist/apps/object-extension/constants.js';
import { responsibilityPackage } from '../../dist/apps/responsibility/package.js';
import { itemPackage } from '../../dist/apps/item/package.js';
import { createItemRepositoryV010 } from '../../dist/apps/item/repository.js';
import { createItemImportTargetV010 } from '../../dist/apps/item/import-target.js';
import { ITEM_RESOURCE_TYPE_V010, ITEM_TRADE_PROFILE_SLOT_V010 } from '../../dist/apps/item/foundation-object.js';
import { createDataImportServiceV010 } from '../../dist/apps/data-import/service.js';
import { createDataImportRepositoryV010 } from '../../dist/apps/data-import/repository.js';

const contextId='enterprise:a';
const definition={contractVersion:'0.1.0',extensionId:'enterprise.demo.commodity',targetObjectType:ITEM_RESOURCE_TYPE_V010,targetSlot:ITEM_TRADE_PROFILE_SLOT_V010,namespace:'enterprise.demo',fieldId:'commodityClass',semanticType:'commodity-class',valueType:'STRING',label:{default:'Commodity'},required:false,order:1,surfaces:['DETAIL'],importable:true,exportable:true,agentReadable:true,agentWritable:true};
const context={contractVersion:'0.1.0',principal:{contractVersion:'0.1.0',subjectId:'owner',actorType:'HUMAN',identityProviderId:'test'},scope:{contractVersion:'0.1.0',enterpriseId:'e'},context:{contractVersion:'0.1.0',activeContext:{contractVersion:'0.1.0',kind:'ENTERPRISE',contextId,enterpriseId:'e'}}};
const request={contractVersion:'0.1.0',type:'command',command:{code:OBJECT_EXTENSION_DEFINITION_UPSERT_COMMAND_V010,inputVersion:'0.1.0'},values:{definition},actionId:'test',sourceInteractionId:'test',requiresConfirmation:true};

for(const transition of ['disable','uninstall']) test(`extension ${transition}: management stops, existing schema/value composition survives without definition mutation`,async()=>{
  const generic={contractVersion:'0.1.0',packageId:'fixture-generic',displayName:'Generic',version:'0.1.0',type:'RUNTIME_EXTENSION',features:[{contractVersion:'0.1.0',packageId:'fixture-generic',featureId:'fixture-generic.default',version:'0.1.0',activationScope:'INSTALLATION',defaultActivation:true,providesCapabilities:['enterprise.directory','enterprise.resource.repository']}]};
  const manager=createAppManagerService(createPackageCatalog([generic,responsibilityPackage,itemPackage,objectExtensionPackage]),createMemoryLifecycleStore());
  manager.install(itemPackage.packageId);manager.install(objectExtensionPackage.packageId);
  const resources=createMemoryEnterpriseResourceRepositoryV010();
  const definitions=createObjectExtensionRepositoryV010(resources),values=createObjectExtensionValueRepositoryV010(resources),items=createItemRepositoryV010(resources);
  let allowed=true;
  const handlers=createObjectExtensionActionHandlersV010({repository:definitions,canManageEnterpriseContext:()=>allowed});
  const router=createAppActionRouter(handlers,id=>manager.getSnapshot().activeFeatures.some(f=>f.featureId===id));
  assert.equal((await router.execute(request,context)).ok,true);
  const before=resources.list({contextId,namespace:'evo.object-extension',collectionId:'definitions'});
  manager[transition](objectExtensionPackage.packageId);
  assert.ok(manager.getSnapshot().activeFeatures.some(f=>f.packageId===itemPackage.packageId));
  assert.equal((await router.execute(request,context)).error.code,'ACTION_FEATURE_NOT_ACTIVE');
  // Real target receives no definition save/archive methods. This is a domain
  // component test, not a claim that direct service calls authorize HTTP users.
  const reader={list:definitions.list.bind(definitions),get:definitions.get.bind(definitions)};
  const target=createItemImportTargetV010({resources,repository:items,extensionRepository:reader,extensionValueRepository:values});
  const schema=target.describe({contextId});assert.ok(schema.fields.some(f=>f.fieldId==='commodityClass'));
  const source={kind:'ROWS',name:'fixture',headers:['code','displayName','itemKind','baseUomCode','commodityClass'],rows:[{code:'ITEM-1',displayName:'Tea',itemKind:'GOODS',baseUomCode:'C62',commodityClass:'BEVERAGE'}]};
  const service=createDataImportServiceV010({repository:createDataImportRepositoryV010(resources),targets:[target]});
  const base={contextId,importJobId:'job',actorSubjectId:'owner',recordedAt:'2026-10-17T00:00:00Z'};
  service.stage({...base,targetId:target.targetId,source,mapping:service.suggestMapping({schema,source}),mappingOrigin:'DETERMINISTIC'});
  assert.equal(service.dryRun(base).state,'DRY_RUN_READY');assert.equal(service.commit(base).state,'COMMITTED');
  assert.deepEqual(resources.list({contextId,namespace:'evo.object-extension',collectionId:'definitions'}),before);
  const item=items.list(contextId)[0];const stored=values.listForObject({contextId,objectType:ITEM_RESOURCE_TYPE_V010,objectId:item.itemId});
  assert.equal(stored[0].values.commodityClass,'BEVERAGE');
  assert.deepEqual(values.listForObject({contextId:'enterprise:b',objectType:ITEM_RESOURCE_TYPE_V010,objectId:item.itemId}),[]);
  manager.install(objectExtensionPackage.packageId);
  // install may preserve a previously disabled feature; explicitly re-enable.
  manager.enable(objectExtensionPackage.packageId);
  allowed=false;assert.equal((await router.execute(request,context)).error.code,'OBJECT_EXTENSION_MANAGE_ROLE_REQUIRED');
  allowed=true;assert.equal((await router.execute(request,context)).ok,true);
  assert.deepEqual(values.listForObject({contextId,objectType:ITEM_RESOURCE_TYPE_V010,objectId:item.itemId}),stored);
});
