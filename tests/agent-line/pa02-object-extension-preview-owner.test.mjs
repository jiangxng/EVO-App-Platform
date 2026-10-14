import test from "node:test";
import assert from "node:assert/strict";
import {createHash,randomUUID} from "node:crypto";
import {mkdtempSync,rmSync,readFileSync} from "node:fs";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {
  createMemoryEnterpriseResourceRepositoryV010,
  createFileEnterpriseResourceRepositoryV010
} from "../../dist/providers/enterprise-context/resources.js";
import {createObjectExtensionRepositoryV010}
  from "../../dist/apps/object-extension/repository.js";
import {createObjectExtensionSingleProcessPreviewOwnerV010}
  from "../../dist/apps/object-extension/agent-owner-preview.js";
import {OBJECT_EXTENSION_DEFINITION_UPSERT_OPERATION_V010}
  from "../../dist/apps/object-extension/constants.js";

const stable=x=>Array.isArray(x)?x.map(stable):
  x&&typeof x==="object"?Object.fromEntries(Object.entries(x)
    .sort(([a],[b])=>a.localeCompare(b)).map(([k,v])=>[k,stable(v)])):x;
const h=s=>createHash("sha256").update(s).digest("hex");
const scope={principalSubjectId:"human",principalActorType:"HUMAN",
  contextKind:"ENTERPRISE",contextId:"enterprise:one",enterpriseId:"org:one"};
const definition={
  contractVersion:"0.1.0",extensionId:"ext:agent:preview:1",
  targetObjectType:"counterparty.subject",targetSlot:"basic",
  namespace:"demo",fieldId:"agentGeneratedAlias",semanticType:"text",
  valueType:"STRING",label:{default:"Agent Alias"},required:false,
  order:101,surfaces:["DETAIL"]
};
const argumentsValue={definition};
const base={
  scope,runId:"run:preview:1",effectId:"effect:preview:1",
  receiptId:"receipt:preview:1",idempotencyKey:"idempotency:preview:1",
  inputDigest:h(JSON.stringify(stable(argumentsValue))),
  toolId:OBJECT_EXTENSION_DEFINITION_UPSERT_OPERATION_V010,
  arguments:argumentsValue
};
const verifyRequest={
  scope,runId:base.runId,effectId:base.effectId,receiptId:base.receiptId,
  ownerPackageId:"evo-object-extension",inputDigest:base.inputDigest
};
const preview=resources=>createObjectExtensionSingleProcessPreviewOwnerV010({
  resources,singleProcessDevelopmentOnly:true,
  now:()=>new Date("2026-10-14T00:00:00.000Z")
});

test("PA02 real Object Extension Owner: one atomic business write, evidence, replay and reconnect",async()=>{
  const dir=mkdtempSync(join(tmpdir(),"pa02-object-extension-owner-"));
  const file=join(dir,"business-resource.json");
  try{
    const res=createFileEnterpriseResourceRepositoryV010(file);
    const {owner,verifier}=preview(res);
    assert.equal((await verifier.verify(verifyRequest)).outcome,"UNRESOLVED");
    await owner.invoke(base);
    const domain=createObjectExtensionRepositoryV010(res);
    assert.equal(domain.get(scope.contextId,definition.extensionId)?.fieldId,
      definition.fieldId);
    const first=JSON.stringify(JSON.parse(readFileSync(file,"utf8")));
    const verified=await verifier.verify(verifyRequest);
    assert.equal(verified.outcome,"SUCCEEDED");
    assert.equal(verified.terminal.status,"SUCCEEDED");
    assert.deepEqual(verified.terminal.resultEntityRefs,
      ["object-extension:"+definition.extensionId]);
    // A lost Owner reply never justifies a second domain operation.
    await owner.invoke(base);
    assert.equal(JSON.stringify(JSON.parse(readFileSync(file,"utf8"))),first);
    const restarted=preview(createFileEnterpriseResourceRepositoryV010(file));
    assert.equal((await restarted.verifier.verify(verifyRequest)).outcome,
      "SUCCEEDED","independent Owner proof survives process-style reopen");
    await restarted.owner.invoke(base);
    assert.equal(JSON.stringify(JSON.parse(readFileSync(file,"utf8"))),first);
    await assert.rejects(restarted.owner.invoke({
      ...base,runId:"run:different"
    }),/PA02_EXTENSION_PREVIEW_IDEMPOTENCY_CONFLICT/);
    await assert.rejects(restarted.owner.invoke({
      ...base,inputDigest:h("different")
    }),/PA02_EXTENSION_PREVIEW_DIGEST_MISMATCH/);
    await assert.rejects(restarted.owner.invoke({
      ...base,scope:{...scope,contextKind:"PERSONAL"}
    }),/PA02_EXTENSION_PREVIEW_ENTERPRISE_REQUIRED/);
    assert.equal((await restarted.verifier.verify({
      ...verifyRequest,scope:{...scope,contextId:"enterprise:other",
        enterpriseId:"org:other"}
    })).outcome,"UNRESOLVED");
    assert.equal((await restarted.verifier.verify({
      ...verifyRequest,ownerPackageId:"untrusted"
    })).outcome,"UNRESOLVED");
    assert.equal((await restarted.verifier.verify({
      ...verifyRequest,inputDigest:h("forged")
    })).outcome,"UNRESOLVED");
    assert.equal((await restarted.verifier.verify({
      ...verifyRequest,scope:{...scope,enterpriseId:"org:other"}
    })).outcome,"UNRESOLVED","same contextId cannot spoof Enterprise identity");
    assert.equal((await restarted.verifier.verify({
      ...verifyRequest,scope:{...scope,principalSubjectId:"other-human"}
    })).outcome,"UNRESOLVED","Owner attestation bound to original principal");
    await assert.rejects(restarted.owner.invoke({
      ...base,runId:"run:new",effectId:"effect:new",
      receiptId:"receipt:new",idempotencyKey:"idem:new"
    }),/PA02_EXTENSION_PREVIEW_CREATE_ONLY/,
    "ordinary UPSERT overwrite is forbidden to preview Owner");
    // An altered business object must not be certified solely because an old
    // immutable Owner receipt remains in the resource snapshot.
    const changed={...definition,label:{default:"Changed by Human"}};
    domain.save({contextId:scope.contextId,definition:changed,
      actorSubjectId:"another-user",recordedAt:"2026-10-14T01:00:00.000Z"});
    assert.equal((await verifier.verify(verifyRequest)).outcome,"UNRESOLVED");
    console.log("PA02_OBJECT_EXTENSION_OWNER_PREVIEW="+JSON.stringify({
      actualDomainPlugin:true,atomicResourceAndEvidence:true,
      restartProof:true,noDuplicateWrite:true,ownerAttestationIndependent:true,
      crossTenantDenied:true,changedBusinessStateNotAttested:true,
      crossProcessConcurrencyProven:false,productionEligible:false
    }));
  }finally{rmSync(dir,{recursive:true,force:true});}
});

test("PA02 Owner preview refuses non-transactional repositories and rolls back on evidence failure",async()=>{
  const resources=createMemoryEnterpriseResourceRepositoryV010();
  assert.throws(()=>createObjectExtensionSingleProcessPreviewOwnerV010({
    resources:{...resources,transaction:undefined},
    singleProcessDevelopmentOnly:true
  }),/PA02_EXTENSION_PREVIEW_ATOMIC_LOCAL_TRANSACTION_REQUIRED/);
  const broken={
    ...resources,
    transaction:resources.transaction.bind(resources),
    put(data){
      if(data.resourceType==="agent.owner-evidence.preview")
        throw Error("SIMULATED_RECEIPT_WRITE_FAILURE");
      return resources.put(data);
    }
  };
  const {owner,verifier}=preview(broken);
  await assert.rejects(owner.invoke(base),/SIMULATED_RECEIPT_WRITE_FAILURE/);
  assert.equal(createObjectExtensionRepositoryV010(resources).get(
    scope.contextId,definition.extensionId),undefined,
    "business mutation rolled back with receipt in same resource snapshot");
  assert.equal((await verifier.verify(verifyRequest)).outcome,"UNRESOLVED");
  await assert.rejects(owner.invoke({...base,toolId:"unregistered.tool"}),
    /PA02_EXTENSION_PREVIEW_OPERATION_DENIED/);
});
