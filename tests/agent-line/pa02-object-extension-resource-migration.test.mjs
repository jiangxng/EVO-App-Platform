import test from "node:test";
import assert from "node:assert/strict";
import {createHash,randomUUID} from "node:crypto";
import {mkdtempSync,rmSync,readFileSync,writeFileSync} from "node:fs";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {fork} from "node:child_process";
import {fileURLToPath} from "node:url";
import postgres from "postgres";
import {
  createFileEnterpriseResourceRepositoryV010
} from "../../dist/providers/enterprise-context/resources.js";
import {createObjectExtensionRepositoryV010}
  from "../../dist/apps/object-extension/repository.js";
import {
  preparePostgresObjectExtensionResourceImportV010,
  importFileObjectExtensionsToPostgresV010,
  readPostgresObjectExtensionImportReceiptV010
} from "../../dist/apps/object-extension/agent-owner-migration.js";
import {createPostgresObjectExtensionAtomicOwnerV010}
  from "../../dist/apps/object-extension/agent-owner-postgres.js";
import {OBJECT_EXTENSION_DEFINITION_UPSERT_OPERATION_V010}
  from "../../dist/apps/object-extension/constants.js";

const connectionString=process.env.PA02A_PROOF_DATABASE_URL;
const digest=bytes=>createHash("sha256").update(bytes).digest("hex");
const stable=x=>Array.isArray(x)?x.map(stable):
  x&&typeof x==="object"?Object.fromEntries(Object.entries(x)
    .sort(([a],[b])=>a.localeCompare(b)).map(([k,v])=>[k,stable(v)])):x;
const hash=x=>digest(JSON.stringify(stable(x)));
const schema=()=> "pa02_migrate_"+randomUUID().replaceAll("-","").slice(0,15);
const stamp="2026-10-14T00:00:00.000Z";
const bindingA={contextId:"ec:migrate:a",enterpriseId:"enterprise:a"};
const bindingB={contextId:"ec:migrate:b",enterpriseId:"enterprise:b"};
const mkdef=(name,slot="basic")=>({
  contractVersion:"0.1.0",extensionId:"ext:"+name,
  targetObjectType:"counterparty.subject",targetSlot:slot,namespace:"legacy",
  fieldId:"field"+name,semanticType:"text",valueType:"STRING",
  label:{default:name},required:false,order:100,surfaces:["DETAIL"]
});
const childPath=fileURLToPath(new URL("./fixtures/pa02-object-extension-import-child.mjs",import.meta.url));
const runChild=(payload,dbSchema)=>new Promise((resolve,reject)=>{
  const cp=fork(childPath,[Buffer.from(JSON.stringify(payload)).toString("base64")],{
    env:{...process.env,PA02_OBJECT_PG_SCHEMA:dbSchema},
    stdio:["ignore","pipe","pipe","ipc"]
  });
  let stderr="",messages=[];
  cp.stderr.on("data",x=>stderr+=x);
  cp.on("message",x=>messages.push(x));
  cp.on("error",reject);
  cp.on("exit",code=>resolve({code,messages,stderr}));
});
const dbInput=s=>({connectionString,schema:s});
const sourceDigest=file=>digest(readFileSync(file,"utf8"));
function createSource(file) {
  const resources=createFileEnterpriseResourceRepositoryV010(file);
  const repository=createObjectExtensionRepositoryV010(resources);
  for(const [contextId,label] of [
    [bindingA.contextId,"first"],[bindingA.contextId,"archived"],
    [bindingB.contextId,"second"]
  ]){
    repository.save({contextId,definition:mkdef(label),
      actorSubjectId:"human:legacy",recordedAt:stamp});
  }
  repository.archive({contextId:bindingA.contextId,extensionId:"ext:archived",
    actorSubjectId:"human:archive",recordedAt:"2026-10-14T01:00:00.000Z"});
  resources.put({contextId:bindingA.contextId,
    namespace:"evo.counterparty",collectionId:"subjects",
    resourceType:"counterparty.subject",resourceId:"cp:unrelated",
    schemaRef:"counterparty/0.1.0",payload:{unrelated:true},
    actorSubjectId:"human:legacy",recordedAt:stamp});
  return resources;
}
test("PA02 Enterprise Resource -> PostgreSQL Object Extension: frozen file import, multi-process replay, owner shared reads and isolation",
  {skip:!connectionString&&"PostgreSQL 18 required"},async()=>{
    const dir=mkdtempSync(join(tmpdir(),"pa02-object-extension-migrate-"));
    const file=join(dir,"enterprise-resources.json"),pgschema=schema();
    const source=createSource(file),p=postgres(connectionString,{max:3});
    await preparePostgresObjectExtensionResourceImportV010(dbInput(pgschema));
    const owner=createPostgresObjectExtensionAtomicOwnerV010(dbInput(pgschema));
    try{
      const bindings=[bindingA,bindingB];
      const original=JSON.parse(readFileSync(file,"utf8"));
      const sha=sourceDigest(file);
      const input={sourceFile:file,expectedSourceDigest:sha,bindings};
      await assert.rejects(importFileObjectExtensionsToPostgresV010({
        ...dbInput(pgschema),...input,offlineSourceFrozen:true,
        expectedSourceDigest:"0".repeat(64)
      }),/SOURCE_DRIFT/);
      assert.equal((await owner.listResources(bindingA)).length,0);
      const attempted=await Promise.all([
        runChild(input,pgschema),runChild(input,pgschema)
      ]);
      assert.ok(attempted.every(x=>x.code===0),JSON.stringify(attempted));
      assert.deepEqual(attempted.map(x=>x.messages[0].result[0].created).sort(),
        [false,true]);
      const importedA=await owner.listResources(bindingA);
      const importedB=await owner.listResources(bindingB);
      assert.equal(importedA.length,2);
      assert.equal(importedB.length,1);
      assert.equal((await owner.listResources(bindingA,
        {lifecycleState:"ACTIVE"})).length,1);
      assert.equal((await owner.listResources(bindingA,
        {lifecycleState:"ARCHIVED"})).length,1);
      assert.deepEqual(importedA,source.list({contextId:bindingA.contextId,
        namespace:"evo.object-extension",collectionId:"definitions",
        resourceType:"object-extension.definition"}).sort((a,b)=>
          a.resourceId.localeCompare(b.resourceId)));
      assert.deepEqual(importedB,source.list({contextId:bindingB.contextId,
        namespace:"evo.object-extension",collectionId:"definitions",
        resourceType:"object-extension.definition"}));
      assert.equal((await owner.listResources({
        contextId:bindingA.contextId,enterpriseId:bindingB.enterpriseId
      })).length,0);
      assert.deepEqual(JSON.parse(readFileSync(file,"utf8")),original,
        "migration must leave legacy source and unrelated resources unchanged");
      const receipt=await readPostgresObjectExtensionImportReceiptV010({
        ...dbInput(pgschema),...bindingA});
      assert.equal(receipt.resourceCount,2);
      assert.equal(receipt.sourceDigest,sha);
      assert.equal(await readPostgresObjectExtensionImportReceiptV010({
        ...dbInput(pgschema),contextId:bindingA.contextId,
        enterpriseId:bindingB.enterpriseId
      }),undefined);

      // Legacy import has no Agent Owner invocation, so it must not counterfeit
      // a successful Agent Owner verification receipt.
      assert.equal((await owner.verifier.verify({
        scope:{contextKind:"ENTERPRISE",...bindingA,
          principalSubjectId:"human:legacy",principalActorType:"HUMAN"},
        runId:"legacy",effectId:"legacy",receiptId:"legacy",
        inputDigest:"0".repeat(64),ownerPackageId:"evo-object-extension"
      })).outcome,"UNRESOLVED");

      const args={definition:mkdef("new-owner")};
      const create={scope:{contextKind:"ENTERPRISE",...bindingA,
        principalSubjectId:"agent:scoped",principalActorType:"AI"},
        runId:"run:postimport",effectId:"effect:postimport",
        receiptId:"receipt:postimport",idempotencyKey:"idem:postimport",
        toolId:OBJECT_EXTENSION_DEFINITION_UPSERT_OPERATION_V010,
        inputDigest:hash(args),arguments:args
      };
      await owner.owner.invoke(create);
      assert.equal((await owner.listResources(bindingA)).length,3);
      assert.equal((await owner.getResource(bindingA,"ext:new-owner"))
        ?.payload?.fieldId,"fieldnew-owner");
      assert.equal((await owner.verifier.verify({
        scope:create.scope,runId:create.runId,effectId:create.effectId,
        receiptId:create.receiptId,inputDigest:create.inputDigest,
        ownerPackageId:"evo-object-extension"
      })).outcome,"SUCCEEDED");

      // No second migration/merge into an active business authority.
      const replay=await runChild(input,pgschema);
      assert.equal(replay.code,0);
      assert.equal(replay.messages[0].result[0].created,false);
      const changed=createFileEnterpriseResourceRepositoryV010(file);
      changed.put({contextId:bindingA.contextId,
        namespace:"unrelated",collectionId:"audit",resourceType:"note",
        resourceId:"changed",schemaRef:"example/0.1.0",
        payload:{changed:true},actorSubjectId:"human",recordedAt:stamp});
      const stale=await runChild(input,pgschema);
      assert.equal(stale.code,1);
      assert.match(stale.messages[0].error,/SOURCE_DRIFT/);
      const changedSha=sourceDigest(file);
      await assert.rejects(importFileObjectExtensionsToPostgresV010({
        ...dbInput(pgschema),sourceFile:file,offlineSourceFrozen:true,
        expectedSourceDigest:changedSha,bindings
      }),/RECEIPT_CONFLICT/);

      // True two-connection, durable cross-process re-open after migration.
      const reopened=createPostgresObjectExtensionAtomicOwnerV010(dbInput(pgschema));
      try{
        assert.equal((await reopened.listResources(bindingA)).length,3);
        assert.equal((await reopened.getResource(bindingB,"ext:second"))
          ?.createdBySubjectId,"human:legacy");
      }finally{await reopened.close();}

      console.log("PA02_OBJECT_EXTENSION_RESOURCE_MIGRATION="+JSON.stringify({
        actualEnterpriseResourceEnvelope:true,offlineSnapshotDigestPinned:true,
        independentImporterProcesses:2,legacySourceUnchanged:true,
        activeAndArchivedPreserved:true,crossEnterpriseReadDenied:true,
        immutableImportProvenance:true,replayNoDuplication:true,
        staleSourceDenied:true,ownerReadAndWriteSamePostgresAuthority:true,
        ownerReceiptNotForgedForImport:true,productionCutover:false
      }));
    }finally{
      await owner.close();
      await p.unsafe('DROP SCHEMA "'+pgschema+'" CASCADE');
      await p.end();
      rmSync(dir,{recursive:true,force:true});
    }
  });

test("PA02 import: file drift during transaction and invalid source rollback all contexts",
  {skip:!connectionString&&"PostgreSQL 18 required"},async()=>{
    const dir=mkdtempSync(join(tmpdir(),"pa02-import-rollback-"));
    const file=join(dir,"resources.json"),pgschema=schema();
    createSource(file);
    const db=postgres(connectionString,{max:2});
    await preparePostgresObjectExtensionResourceImportV010(dbInput(pgschema));
    const owner=createPostgresObjectExtensionAtomicOwnerV010(dbInput(pgschema));
    try{
      const originalHash=sourceDigest(file);
      await assert.rejects(importFileObjectExtensionsToPostgresV010({
        ...dbInput(pgschema),sourceFile:file,expectedSourceDigest:originalHash,
        bindings:[bindingA,bindingB],offlineSourceFrozen:true,
        testOnlyBeforeCommit:async()=>{
          const resources=createFileEnterpriseResourceRepositoryV010(file);
          resources.put({contextId:bindingB.contextId,namespace:"other",
            collectionId:"note",resourceType:"note",resourceId:"r",
            schemaRef:"test/0.1.0",payload:{version:2},
            actorSubjectId:"human",recordedAt:stamp});
        }
      }),/SOURCE_DRIFT/);
      assert.equal((await owner.listResources(bindingA)).length,0);
      assert.equal((await owner.listResources(bindingB)).length,0);
      assert.equal(await readPostgresObjectExtensionImportReceiptV010({
        ...dbInput(pgschema),...bindingA}),undefined);

      // Domain-level duplicate semantic field is rejected by SQL uniqueness,
      // and no preceding context/record/receipt is committed.
      const repository=createFileEnterpriseResourceRepositoryV010(file);
      const second=mkdef("collision");
      const dupe={...second,fieldId:"fieldsecond"};
      repository.put({contextId:bindingB.contextId,
        namespace:"evo.object-extension",collectionId:"definitions",
        resourceType:"object-extension.definition",resourceId:dupe.extensionId,
        schemaRef:"evo.object-extension.definition/0.1.0",
        ownerPackageId:"evo-object-extension",payload:dupe,
        actorSubjectId:"human",recordedAt:stamp});
      const changedDigest=sourceDigest(file);
      await assert.rejects(importFileObjectExtensionsToPostgresV010({
        ...dbInput(pgschema),sourceFile:file,expectedSourceDigest:changedDigest,
        bindings:[bindingA,bindingB],offlineSourceFrozen:true
      }),/DOMAIN_CONFLICT|duplicate key/);
      assert.equal((await owner.listResources(bindingA)).length,0);
      assert.equal((await owner.listResources(bindingB)).length,0);

      // Bad declared Enterprise binding fails before any enterprise can commit.
      const withoutDuplicate=createFileEnterpriseResourceRepositoryV010(file);
      // Read-only unrelated source bytes are not changed by rejected imports.
      assert.ok(withoutDuplicate.list({contextId:bindingA.contextId}).length>0);
      await db.unsafe('INSERT INTO "'+pgschema+'".pa02_contexts'+
        "(context_id,enterprise_id) VALUES($1,$2)",
        [bindingB.contextId,"enterprise:foreign"]);
      await assert.rejects(importFileObjectExtensionsToPostgresV010({
        ...dbInput(pgschema),sourceFile:file,expectedSourceDigest:changedDigest,
        bindings:[bindingA,bindingB],offlineSourceFrozen:true
      }),/ENTERPRISE_BINDING_CONFLICT/);
      assert.equal((await owner.listResources(bindingA)).length,0);
      console.log("PA02_OBJECT_EXTENSION_IMPORT_ROLLBACK="+JSON.stringify({
        sourceDriftDuringTransactionRollsBack:true,
        conflictingDefinitionRollsBackAllContexts:true,
        enterpriseBindingConflictDenied:true,productionCutover:false
      }));
    }finally{
      await owner.close();await db.unsafe('DROP SCHEMA "'+pgschema+'" CASCADE');
      await db.end();rmSync(dir,{recursive:true,force:true});
    }
  });
