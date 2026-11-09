import test from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { existsSync, mkdtempSync, mkdirSync, rmSync, rmdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  createMemoryEnterpriseResourceRepositoryV010,
  createFileEnterpriseResourceRepositoryV010
} from "../../dist/providers/enterprise-context/resources.js";

const address = {
  contextId: "enterprise-context:alpha",
  namespace: "evo.saved-views",
  collectionId: "counterparty.my-suppliers",
  resourceType: "saved-collection-view",
  resourceId: "private:hkinbound"
};
const input = (name, expectedRevision, overrides = {}) => ({
  ...address,
  schemaRef: "counterparty.collection/0.1.0",
  payload: { name },
  actorSubjectId: "person:owner",
  recordedAt: "2026-11-09T04:00:00.000Z",
  expectedRevision,
  ...overrides
});

test("C3-01 process-local provider enforces create/update/archive CAS and isolation", () => {
  const repo = createMemoryEnterpriseResourceRepositoryV010();
  assert.equal(repo.conditionalWriteConsistency, "PROCESS_LOCAL");
  const first = repo.putIfRevision(input("Hong Kong suppliers", null));
  assert.equal(first.revision, 0);
  assert.equal(first.lifecycleState, "ACTIVE");
  assert.equal(repo.get({ ...address, contextId: "enterprise-context:other" }), undefined);
  assert.throws(() => repo.putIfRevision(input("duplicate", null)), /ENTERPRISE_RESOURCE_REVISION_CONFLICT/);
  assert.throws(() => repo.putIfRevision(input("stale", 3)), /ENTERPRISE_RESOURCE_REVISION_CONFLICT/);
  assert.throws(() => repo.putIfRevision(input("invalid", -1)), /ENTERPRISE_RESOURCE_REVISION_INVALID/);
  const updated = repo.putIfRevision(input("Hong Kong - authorized", 0));
  assert.equal(updated.revision, 1);
  assert.equal(updated.createdAt, first.createdAt);
  assert.deepEqual(repo.get(address).payload, { name: "Hong Kong - authorized" });
  assert.throws(() => repo.put(input("unconditional", null)), /ENTERPRISE_RESOURCE_CONDITIONAL_WRITE_REQUIRED/);
  assert.throws(() => repo.putMany([input("unconditional batch", null)]), /ENTERPRISE_RESOURCE_CONDITIONAL_WRITE_REQUIRED/);
  assert.throws(() => repo.archive({address,actorSubjectId:"person:owner", recordedAt:"2026-11-09T05:00:00.000Z"}), /ENTERPRISE_RESOURCE_CONDITIONAL_WRITE_REQUIRED/);
  assert.throws(() => repo.archiveIfRevision({address,expectedRevision:0,actorSubjectId:"person:owner",recordedAt:"2026-11-09T05:00:00.000Z"}), /ENTERPRISE_RESOURCE_REVISION_CONFLICT/);
  const archived = repo.archiveIfRevision({address,expectedRevision:1,actorSubjectId:"person:owner",recordedAt:"2026-11-09T05:00:00.000Z"});
  assert.equal(archived.revision, 2);
  assert.equal(archived.lifecycleState, "ARCHIVED");
  assert.throws(() => repo.putIfRevision(input("reuse archived ID", null)), /ENTERPRISE_RESOURCE_REVISION_CONFLICT/);
  assert.throws(() => repo.putIfRevision(input("revive archived ID", 2)), /ENTERPRISE_RESOURCE_ALREADY_ARCHIVED/);
  assert.throws(() => repo.archiveIfRevision({address,expectedRevision:2,actorSubjectId:"person:owner",recordedAt:"2026-11-09T06:00:00.000Z"}), /ENTERPRISE_RESOURCE_ALREADY_ARCHIVED/);
});

test("C3-01 existing unversioned data remains compatible and can migrate conditionally", () => {
  const repo = createMemoryEnterpriseResourceRepositoryV010();
  repo.put(input("legacy", null));
  assert.equal(repo.get(address).revision, undefined);
  const upgraded = repo.putIfRevision(input("upgraded", 0));
  assert.equal(upgraded.revision, 1);
  assert.throws(() => repo.put(input("legacy writer after upgrade", null)), /ENTERPRISE_RESOURCE_CONDITIONAL_WRITE_REQUIRED/);
});

test("C3-01 file provider serializes independent repository objects with restart readback and fails closed on lock", () => {
  const dir = mkdtempSync(join(tmpdir(), "evo-c301-"));
  const filePath = join(dir,"resources.json");
  try {
    const a=createFileEnterpriseResourceRepositoryV010(filePath);
    const b=createFileEnterpriseResourceRepositoryV010(filePath);
    assert.equal(a.conditionalWriteConsistency, "SAME_FILESYSTEM_LOCK");
    assert.equal(b.conditionalWriteConsistency, "SAME_FILESYSTEM_LOCK");
    assert.equal(a.putIfRevision(input("created", null)).revision, 0);
    assert.throws(() => b.putIfRevision(input("duplicate", null)), /ENTERPRISE_RESOURCE_REVISION_CONFLICT/);
    assert.equal(b.putIfRevision(input("updated", 0)).revision, 1);
    assert.throws(() => a.putIfRevision(input("lost update", 0)), /ENTERPRISE_RESOURCE_REVISION_CONFLICT/);
    assert.deepEqual(createFileEnterpriseResourceRepositoryV010(filePath).get(address).payload, {name:"updated"});
    mkdirSync(filePath+".write-lock");
    assert.throws(() => a.putIfRevision(input("busy", 1)), /ENTERPRISE_RESOURCE_STORE_BUSY/);
    assert.throws(() => b.put(input("busy legacy", null)), /ENTERPRISE_RESOURCE_STORE_BUSY/);
    rmdirSync(filePath+".write-lock");
    assert.equal(createFileEnterpriseResourceRepositoryV010(filePath).archiveIfRevision({
      address,expectedRevision:1,actorSubjectId:"person:owner",recordedAt:"2026-11-09T06:00:00.000Z"
    }).revision,2);
    assert.equal(b.get(address).lifecycleState,"ARCHIVED");
    assert.equal(existsSync(filePath),true);
  } finally {
    rmSync(dir,{recursive:true,force:true});
  }
});

function runWriter(filePath, gate, name) {
  const script = `
    import { existsSync } from "node:fs";
    import { createFileEnterpriseResourceRepositoryV010 } from "./dist/providers/enterprise-context/resources.js";
    const address = ${JSON.stringify(address)};
    const repo = createFileEnterpriseResourceRepositoryV010(process.argv[1]);
    process.stdout.write("READY\\n");
    while (!existsSync(process.argv[2])) Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 10);
    try {
      const saved = repo.putIfRevision({
        ...address, schemaRef:"counterparty.collection/0.1.0", payload:{name:process.argv[3]},
        actorSubjectId:"person:owner",recordedAt:"2026-11-09T05:00:00.000Z",expectedRevision:0
      });
      process.stdout.write("SUCCESS " + saved.revision + "\\n");
    } catch (error) {
      process.stdout.write("REJECT " + error.message + "\\n");
      process.exitCode = 2;
    }
  `;
  const child=spawn(process.execPath,["--input-type=module","-e",script,filePath,gate,name],{cwd:process.cwd()});
  let stdout="", stderr="", readyResolve, readyReject;
  const ready=new Promise((resolve,reject)=>{readyResolve=resolve;readyReject=reject;});
  const done=new Promise(resolve=>{
    child.stdout.on("data",data=>{
      stdout+=data.toString();
      if (stdout.includes("READY")) readyResolve();
    });
    child.stderr.on("data",data=>{stderr+=data.toString();});
    child.on("error",error=>{readyReject(error);resolve({code:-1,stdout,stderr:String(error)});});
    child.on("close",code=>{
      if (!stdout.includes("READY")) readyReject(new Error("child exited before ready: "+stderr));
      resolve({code,stdout,stderr});
    });
  });
  return {ready,done};
}

test("C3-01 real separate OS processes writing same file/revision allow only one update", async () => {
  const dir=mkdtempSync(join(tmpdir(),"evo-c301-processes-"));
  const filePath=join(dir,"resources.json");
  const gate=join(dir,"start");
  try {
    const repo=createFileEnterpriseResourceRepositoryV010(filePath);
    repo.putIfRevision(input("initial",null));
    const a=runWriter(filePath,gate,"agent-a");
    const b=runWriter(filePath,gate,"agent-b");
    await Promise.all([a.ready,b.ready]);
    writeFileSync(gate,"go");
    const results=await Promise.all([a.done,b.done]);
    assert.equal(results.filter(x=>x.code===0).length,1,JSON.stringify(results));
    assert.equal(results.filter(x=>x.code===2).length,1,JSON.stringify(results));
    assert.ok(results.some(x=>/ENTERPRISE_RESOURCE_(REVISION_CONFLICT|STORE_BUSY)/.test(x.stdout)),JSON.stringify(results));
    const restarted=createFileEnterpriseResourceRepositoryV010(filePath);
    assert.equal(restarted.get(address).revision,1);
    assert.ok(["agent-a","agent-b"].includes(restarted.get(address).payload.name));
  } finally {
    rmSync(dir,{recursive:true,force:true});
  }
});
