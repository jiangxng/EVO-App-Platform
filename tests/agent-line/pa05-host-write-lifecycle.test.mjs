import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { createPackageCatalog } from "../../dist/catalog/catalog.js";
import { createAppManagerService } from "../../dist/manager/service.js";
import { createMemoryLifecycleStore } from "../../dist/manager/store.js";
import {
  createPa05HostWriteLifecycleV010,
  assertPa05ProtectedAgentWriteCoverageV010,
  Pa05HostLifecycleDeniedV010,
  pa05HostLifecycleConfigurationV010
} from "../../dist/manager/agent-plugin-write-host-lifecycle.js";

const packageId = "pa05-host-guarded-sandbox";
const auxiliary = "pa05-unguarded-read-sandbox";
const makePackage = (id, effect) => ({
  contractVersion: "0.1.0",
  packageId: id, displayName: id, version: "0.1.0", type: "APPLICATION",
  features: [{
    contractVersion: "0.1.0", packageId: id, featureId: id + ".default",
    version: "0.1.0", activationScope: "INSTALLATION", defaultActivation: true,
    providesCapabilities: [id + ".capability"],
    contributions: [{
      kind: "platform.capability-operation",
      operation: {
        contractVersion: "0.1.0", operationId: id + ".operation",
        capability: id + ".capability", operationVersion: "0.1.0",
        title: id, description: "Host lifecycle test only",
        effect, dataScope: "ENTERPRISE",
        authorization: {
          action: id + ".read-or-write",
          resource: { type: id, idSource: "INPUT", inputKey: "recordId" }
        },
        inputSchema: { type: "object" }, outputSchema: { type: "object" },
        binding: {
          type: "ACTION_HOST", commandCode: id + ".command", inputVersion: "0.1.0"
        },
        exposure: ["PERSONAL_AGENT"],
        ...(effect === "WRITE" ? {
          writeSafety: { idempotency: "HOST_REQUIRED", receipt: "HOST_REQUIRED" }
        } : {})
      }
    }]
  }]
});
function fixture() {
  const m = createAppManagerService(
    createPackageCatalog([makePackage(packageId, "WRITE"), makePackage(auxiliary, "READ")]),
    createMemoryLifecycleStore()
  );
  m.install(packageId);
  m.install(auxiliary);
  return m;
}
test("PA05 Host controller rejects incomplete configuration, malformed IDs and unknown operation", async () => {
  const m = fixture();
  assert.throws(() => createPa05HostWriteLifecycleV010({
    manager: m, protectedPackageIds: [packageId]
  }), /PA05_HOST_LIFECYCLE_CONFIGURATION_INCOMPLETE/);
  assert.throws(() => createPa05HostWriteLifecycleV010({
    manager: m, protectedPackageIds: [packageId, packageId],
    databaseUrl: "postgres://fixture", schema: "fixture"
  }), /PA05_HOST_LIFECYCLE_IDS_INVALID/);
  assert.deepEqual(pa05HostLifecycleConfigurationV010({
    PA05_WRITE_LIFECYCLE_PACKAGES: packageId,
    PA05_WRITE_LIFECYCLE_DATABASE_URL: "postgres://fixture",
    PA05_WRITE_LIFECYCLE_SCHEMA: "pa05_demo"
  }), {
    protectedPackageIds: [packageId],
    databaseUrl: "postgres://fixture",
    schema: "pa05_demo"
  });
  const host = createPa05HostWriteLifecycleV010({ manager: m, protectedPackageIds: [] });
  await assert.rejects(host.apply("RENAME", auxiliary), Pa05HostLifecycleDeniedV010);
  await host.close();
});

test("PA05 Host controller never falls back to direct manager on missing gate or pending WRITE", async () => {
  const m = fixture();
  let creates = 0, calls = 0, closes = 0;
  const host = createPa05HostWriteLifecycleV010({
    manager: m, protectedPackageIds: [packageId],
    gateFactory: async () => {
      creates++;
      return {
        async transition({packageId: id,operation}) {
          calls++;
          assert.equal(id, packageId);
          assert.equal(operation, "DISABLE");
          return { status: "BLOCKED_PENDING_WRITE", pendingCount: 2 };
        },
        async close() { closes++; }
      };
    }
  });
  for (let i = 0; i < 2; i++) {
    await assert.rejects(
      host.apply("DISABLE", packageId),
      e => e instanceof Pa05HostLifecycleDeniedV010
        && e.code === "PA05_HOST_LIFECYCLE_PENDING_WRITE"
    );
  }
  assert.equal(creates, 1);
  assert.equal(calls, 2);
  assert.ok(m.listEffectiveCapabilityOperations().some(o => o.packageId === packageId));
  // Unprotected READ package remains on existing Host lifecycle behavior.
  await host.apply("DISABLE", auxiliary);
  assert.equal(m.listEffectiveCapabilityOperations().some(o => o.packageId === auxiliary), false);
  await host.close();
  assert.equal(closes, 1);
});

test("PA05 Host controller blocks PostgreSQL outage and does not expose backend details", async () => {
  const m = fixture();
  const host = createPa05HostWriteLifecycleV010({
    manager: m, protectedPackageIds: [packageId],
    gateFactory: async () => {
      throw new Error("sensitive://backend-or-credential");
    }
  });
  await assert.rejects(
    host.apply("UPGRADE", packageId),
    e => e instanceof Pa05HostLifecycleDeniedV010
      && e.code === "PA05_HOST_LIFECYCLE_GUARD_UNAVAILABLE"
      && !e.message.includes("sensitive")
  );
  assert.ok(m.listEffectiveCapabilityOperations().some(x => x.packageId === packageId));
  await host.close();
});

test("PA05 Host controller forwards upgrade trust context through the guarded owner", async () => {
  const m = fixture();
  const approval = { trustApproved: true, approvedPermissions: ["read.trading"] };
  let actual;
  const host = createPa05HostWriteLifecycleV010({
    manager: m, protectedPackageIds: [packageId],
    gateFactory: async () => ({
      async transition(input) {
        actual = input;
        return { status: "APPLIED", pendingCount: 0 };
      },
      async close() {}
    })
  });
  const snapshot = await host.apply("UPGRADE", packageId, approval);
  assert.deepEqual(actual, { packageId, operation: "UPGRADE", authorization: approval });
  assert.deepEqual(snapshot, m.getSnapshot());
  await host.close();
});

test("PA05 Host HTTP Action and /v1 routes all use the single guarded lifecycle seam", () => {
  const source = readFileSync(new URL("../../manager/server.ts", import.meta.url), "utf8");
  const count = needle => source.split(needle).length - 1;
  assert.equal(count('pa05WriteLifecycleHost.apply("UPGRADE", itemId'), 1);
  assert.equal(count('pa05WriteLifecycleHost.apply("UPGRADE", body.packageId'), 1);
  // E01J4D routes *every* legacy Action and direct HTTP removal through a
  // single READ+WRITE-compatible guarded Host composition. Nothing may
  // quietly fall back to raw AppManager or the WRITE-only route for READ.
  assert.equal(count('applyPa05ReadLifecycleMutation(request,"DISABLE",itemId)'), 2);
  assert.equal(count('applyPa05ReadLifecycleMutation(request,"UNINSTALL",itemId)'), 2);
  assert.equal(count('applyPa05ReadLifecycleMutation(request,"DISABLE",body.packageId)'), 1);
  assert.equal(count('applyPa05ReadLifecycleMutation(request,"UNINSTALL",body.packageId)'), 1);
  assert.equal(count('return pa05WriteLifecycleHost.apply(operation, packageId)'), 1);
  assert.equal(count('pa05WriteLifecycleHost.apply("DISABLE", itemId'), 0);
  assert.equal(count('pa05WriteLifecycleHost.apply("UNINSTALL", itemId'), 0);
  assert.equal(count('pa05WriteLifecycleHost.apply("DISABLE", body.packageId'), 0);
  assert.equal(count('pa05WriteLifecycleHost.apply("UNINSTALL", body.packageId'), 0);
  for (const forbidden of [
    "manager.disable(itemId)", "manager.uninstall(itemId)",
    "manager.upgrade(itemId,", "manager.disable(body.packageId)",
    "manager.uninstall(body.packageId)", "manager.upgrade(body.packageId,"
  ]) assert.equal(count(forbidden), 0, "unguarded route " + forbidden);
  assert.ok(source.includes("error instanceof Pa05HostLifecycleDeniedV010"));
});

test("PA05-04D refuses partially covered active Agent WRITE packages at opt-in construction", async () => {
  const missing = "pa05-second-owner-sandbox";
  const m = createAppManagerService(
    createPackageCatalog([
      makePackage(packageId, "WRITE"),
      makePackage(missing, "WRITE")
    ]), createMemoryLifecycleStore()
  );
  m.install(packageId);
  m.install(missing);
  assert.throws(
    () => assertPa05ProtectedAgentWriteCoverageV010(m, [packageId]),
    /PA05_HOST_LIFECYCLE_OWNER_COVERAGE_INCOMPLETE/
  );
  assert.throws(
    () => createPa05HostWriteLifecycleV010({
      manager: m, protectedPackageIds: [packageId],
      gateFactory: async () => { throw new Error("should not contact PG"); }
    }),
    /PA05_HOST_LIFECYCLE_OWNER_COVERAGE_INCOMPLETE/
  );
  assert.doesNotThrow(
    () => assertPa05ProtectedAgentWriteCoverageV010(m, [packageId, missing])
  );
  // An unconfigured Host has never claimed PA05 WRITE protection and retains
  // old behavior, but it must not be mistaken for certified guarded execution.
  assert.doesNotThrow(
    () => assertPa05ProtectedAgentWriteCoverageV010(m, [])
  );
});

test("PA05-04D detects an Agent WRITE owner installed after protected Host construction", async () => {
  const missing = "pa05-later-write-owner";
  const m = createAppManagerService(
    createPackageCatalog([
      makePackage(packageId, "WRITE"),
      makePackage(missing, "WRITE"),
      makePackage(auxiliary, "READ")
    ]), createMemoryLifecycleStore()
  );
  m.install(packageId);
  const host = createPa05HostWriteLifecycleV010({
    manager: m, protectedPackageIds: [packageId],
    gateFactory: async () => { throw new Error("must not contact PG"); }
  });
  try {
    m.install(missing);
    await assert.rejects(
      host.apply("DISABLE", packageId),
      /PA05_HOST_LIFECYCLE_OWNER_COVERAGE_INCOMPLETE/
    );
    assert.ok(m.listEffectiveCapabilityOperations().some(x =>
      x.packageId === packageId
    ));
  } finally {
    await host.close();
  }
});

test("PA05-04D2 installation and enablement routes must not bypass guarded admission", () => {
  const source = readFileSync(new URL("../../manager/server.ts", import.meta.url), "utf8");
  const count = needle => source.split(needle).length - 1;
  assert.equal(count('pa05WriteLifecycleHost.admitActivation("INSTALL", itemId'), 1);
  assert.equal(count('pa05WriteLifecycleHost.admitActivation("ENABLE", itemId'), 2);
  assert.equal(count('pa05WriteLifecycleHost.admitActivation("INSTALL", body.packageId'), 1);
  assert.equal(count('pa05WriteLifecycleHost.admitActivation("ENABLE", body.packageId'), 1);
  for (const bypass of [
    "manager.install(itemId,", "manager.enable(itemId)",
    "manager.install(body.packageId,", "manager.enable(body.packageId)"
  ]) assert.equal(count(bypass), 0, "host activation bypass: " + bypass);
});

test("PA05-04D2 Host reserves protected Agent WRITE before enabling and never auto-reopens", async () => {
  const m = fixture();
  m.disable(packageId);
  let admits = 0;
  const host = createPa05HostWriteLifecycleV010({
    manager: m, protectedPackageIds: [packageId],
    gateFactory: async () => ({
      async reserveActivation(id, version) {
        admits++;
        assert.equal(id, packageId);
        assert.equal(version, "0.1.0");
        return {state: "FROZEN", pendingCount: 0};
      },
      async close() {}
    })
  });
  try {
    const snapshot = await host.admitActivation("ENABLE", packageId);
    assert.equal(admits, 1);
    assert.ok(snapshot.activeFeatures.some(x => x.packageId === packageId));
    // The admission port cannot create an ACTIVE gate or auto-register a
    // trusted business Owner. Only explicit Host re-certification can do so.
  } finally {
    await host.close();
  }
});

test("PA05-04D2 refuses missing protected dependency and leaves other packages untouched", async () => {
  const write = makePackage(packageId, "WRITE");
  const dependant = makePackage("pa05-read-depends-on-write", "READ");
  dependant.features[0].requiresCapabilities = [packageId + ".capability"];
  const m = createAppManagerService(
    createPackageCatalog([write, dependant]),
    createMemoryLifecycleStore()
  );
  const host = createPa05HostWriteLifecycleV010({
    manager: m, protectedPackageIds: ["unused-frozen-owner"],
    gateFactory: async () => { throw Error("unexpected PG connection"); }
  });
  try {
    await assert.rejects(
      host.admitActivation("INSTALL", dependant.packageId),
      e => e.code === "PA05_HOST_WRITE_OWNER_NOT_PROTECTED"
    );
    assert.equal(m.getSnapshot().installedPackages.length, 0);
  } finally {
    await host.close();
  }
});

test("PA05-04D2 incomplete SQL reserve or pending WRITE cannot enable owner", async () => {
  const m = fixture();
  m.disable(packageId);
  let unavailable = false;
  const host = createPa05HostWriteLifecycleV010({
    manager: m, protectedPackageIds: [packageId],
    gateFactory: async () => ({
      async reserveActivation() {
        if (unavailable) throw Error("PRIVATE_DATABASE_FAILURE");
        return {state: "FROZEN", pendingCount: 1};
      },
      async close() {}
    })
  });
  try {
    await assert.rejects(host.admitActivation("ENABLE", packageId),
      e => e.code === "PA05_HOST_LIFECYCLE_PENDING_WRITE");
    assert.equal(m.getSnapshot().activeFeatures.some(x => x.packageId === packageId), false);
    unavailable = true;
    await assert.rejects(host.admitActivation("ENABLE", packageId),
      e => e.code === "PA05_HOST_LIFECYCLE_GUARD_UNAVAILABLE"
        && !e.message.includes("PRIVATE_DATABASE"));
    assert.equal(m.getSnapshot().activeFeatures.some(x => x.packageId === packageId), false);
  } finally {
    await host.close();
  }
});

test("PA05-04D3 guarded Host bootstrap never installs or enables a WRITE Owner synchronously", async () => {
  const m = fixture();
  m.disable(packageId);
  const host = createPa05HostWriteLifecycleV010({
    manager: m, protectedPackageIds: [packageId],
    gateFactory: async () => { throw Error("bootstrap must not connect PG"); }
  });
  try {
    assert.throws(() => host.bootstrapActivation("INSTALL", packageId),
      e => e.code === "PA05_HOST_BOOTSTRAP_WRITE_REQUIRES_ASYNC_ADMISSION");
    assert.throws(() => host.bootstrapActivation("ENABLE", packageId),
      e => e.code === "PA05_HOST_BOOTSTRAP_WRITE_REQUIRES_ASYNC_ADMISSION");
    assert.equal(m.getSnapshot().activeFeatures.some(x => x.packageId === packageId), false);
    assert.ok(host.bootstrapActivation("ENABLE", auxiliary)
      .installedPackages.some(x => x.packageId === auxiliary));
  } finally {
    await host.close();
  }
});

test("PA05-04D3 all 17 synchronous Host bootstrap calls use fail-closed adapter before listen", () => {
  const s = readFileSync(new URL("../../manager/server.ts", import.meta.url), "utf8");
  assert.equal((s.match(/pa05WriteLifecycleHost\.bootstrapActivation\("INSTALL",/g) ?? []).length, 16);
  assert.equal((s.match(/pa05WriteLifecycleHost\.bootstrapActivation\("ENABLE",/g) ?? []).length, 1);
  const helper = s.slice(s.indexOf("function installBusinessDefaultOnce("), s.indexOf("installBusinessDefaultOnce(BI_WORKBENCH_PACKAGE_ID_V010,"));
  assert.match(helper, /startupDefaults\.apply\(/);
  assert.match(helper, /install\(\) \{ pa05WriteLifecycleHost\.bootstrapActivation\("INSTALL", packageId\); \}/);
  const mapActivation = s.slice(s.indexOf("if (evoObservatoryApplicationMap.length > 0) {"), s.indexOf("const configuredApplicationRuntimeBindingProvider ="));
  assert.match(mapActivation, /installBusinessDefaultOnce\(APPLICATION_RUNTIME_BINDING_PACKAGE_ID, true, true\)/);
  assert.doesNotMatch(mapActivation, /bootstrapActivation\(/);
  assert.equal((s.match(/manager\.install\(/g) ?? []).length, 0);
  assert.equal((s.match(/manager\.enable\(/g) ?? []).length, 0);
  assert.ok(s.indexOf("await pa05WriteLifecycleHost.attestStartupActivation();")
    < s.indexOf("server.listen(port,"));
  assert.ok(s.includes("await pa05WriteLifecycleHost.attestStartupActivation();"));
});

test("PA05-04D3 Host pre-listen attestation freezes active WRITE Owners and rejects unresolved effects", async () => {
  const m = fixture();
  let reservations = 0;
  const host = createPa05HostWriteLifecycleV010({
    manager: m, protectedPackageIds: [packageId],
    gateFactory: async () => ({
      async reserveActivation(id, version) {
        assert.equal(id, packageId);
        assert.equal(version, "0.1.0");
        reservations++;
        return {state: "FROZEN", pendingCount: 0};
      },
      async close() {}
    })
  });
  try {
    await host.attestStartupActivation();
    assert.equal(reservations, 1);
    await host.attestStartupActivation();
    assert.equal(reservations, 2);
  } finally {
    await host.close();
  }
  const failing = createPa05HostWriteLifecycleV010({
    manager: m, protectedPackageIds: [packageId],
    gateFactory: async () => ({
      async reserveActivation() { return {state: "FROZEN", pendingCount: 1}; },
      async close() {}
    })
  });
  try {
    await assert.rejects(failing.attestStartupActivation(),
      e => e.code === "PA05_HOST_LIFECYCLE_PENDING_WRITE");
  } finally {
    await failing.close();
  }
});

test("PA05-04D3 opt-in Host explicitly rejects different/duplicated worker schemas", async () => {
  const m = fixture();
  for (const workerSchemas of [
    ["owner_schema", "other_worker_schema"],
    ["owner_schema", "owner_schema"],
    ["", "owner_schema"]
  ]) assert.throws(() => createPa05HostWriteLifecycleV010({
    manager: m, protectedPackageIds: [packageId],
    databaseUrl: "postgres://invalid.example/test",
    schema: "owner_schema", workerSchemas
  }), /PA05_HOST_WORKER_SCHEMA_NOT_SHARED/);
  const config = pa05HostLifecycleConfigurationV010({
    PA05_WRITE_LIFECYCLE_PACKAGES: packageId,
    PA05_WRITE_LIFECYCLE_DATABASE_URL: "postgres://invalid.example/test",
    PA05_WRITE_LIFECYCLE_SCHEMA: "owner_schema",
    PA05_WRITE_LIFECYCLE_WORKER_SCHEMAS: "owner_schema,other_worker_schema"
  });
  assert.deepEqual(config.workerSchemas, ["owner_schema", "other_worker_schema"]);
  const accepted = createPa05HostWriteLifecycleV010({
    manager: m, protectedPackageIds: [packageId],
    databaseUrl: "postgres://invalid.example/test",
    schema: "owner_schema", workerSchemas: ["owner_schema"]
  });
  await accepted.close();
});

test("PA05-04D4 shared authority requires explicit opt-in and trusted complete Schema inventory", async () => {
  const m=fixture();
  assert.throws(()=>createPa05HostWriteLifecycleV010({
    manager:m,protectedPackageIds:[packageId],
    databaseUrl:"postgres://fixture",schema:"owner_schema",
    workerSchemas:["owner_schema","second_schema"]
  }),/PA05_HOST_WORKER_SCHEMA_NOT_SHARED/);
  assert.throws(()=>createPa05HostWriteLifecycleV010({
    manager:m,protectedPackageIds:[packageId],
    databaseUrl:"postgres://fixture",schema:"owner_schema",
    sharedWorkerSchemaAuthority:true
  }),/PA05_HOST_SHARED_AUTHORITY_CONFIGURATION_INCOMPLETE/);
  const host=createPa05HostWriteLifecycleV010({
    manager:m,protectedPackageIds:[packageId],
    databaseUrl:"postgres://fixture",schema:"owner_schema",
    workerSchemas:["owner_schema","second_schema"],
    sharedWorkerSchemaAuthority:true,
    gateFactory:async()=>({
      async reserveActivation(){return {state:"FROZEN",pendingCount:0};},
      async close(){}
    })
  });
  try{
    assert.ok(host);
  }finally{await host.close();}
  assert.deepEqual(pa05HostLifecycleConfigurationV010({
    PA05_WRITE_LIFECYCLE_PACKAGES:packageId,
    PA05_WRITE_LIFECYCLE_DATABASE_URL:"postgres://fixture",
    PA05_WRITE_LIFECYCLE_SCHEMA:"owner_schema",
    PA05_WRITE_LIFECYCLE_WORKER_SCHEMAS:"owner_schema,second_schema",
    PA05_SHARED_SCHEMA_AUTHORITY_ENABLED:"1"
  }),{
    protectedPackageIds:[packageId],
    databaseUrl:"postgres://fixture",
    schema:"owner_schema",
    workerSchemas:["owner_schema","second_schema"],
    sharedWorkerSchemaAuthority:true
  });
});

test("PA05-04D4 dedicated shared authority Schema is accepted only with Host opt-in", async () => {
  const m=fixture();
  const options={
    manager:m,protectedPackageIds:[packageId],
    databaseUrl:"postgres://fixture",schema:"first_worker",
    workerSchemas:["first_worker","second_worker"],
    sharedAuthoritySchema:"central_owner"
  };
  assert.throws(()=>createPa05HostWriteLifecycleV010(options),
    /PA05_HOST_WORKER_SCHEMA_NOT_SHARED|PA05_HOST_SHARED_AUTHORITY_CONFIGURATION_INCOMPLETE/);
  const host=createPa05HostWriteLifecycleV010({
    ...options,sharedWorkerSchemaAuthority:true,
    gateFactory:async()=>({async close(){}})
  });
  await host.close();
  const configured=pa05HostLifecycleConfigurationV010({
    PA05_WRITE_LIFECYCLE_PACKAGES:packageId,
    PA05_WRITE_LIFECYCLE_DATABASE_URL:"postgres://fixture",
    PA05_WRITE_LIFECYCLE_SCHEMA:"first_worker",
    PA05_WRITE_LIFECYCLE_WORKER_SCHEMAS:"first_worker,second_worker",
    PA05_WRITE_LIFECYCLE_AUTHORITY_SCHEMA:"central_owner",
    PA05_SHARED_SCHEMA_AUTHORITY_ENABLED:"1"
  });
  assert.equal(configured.sharedAuthoritySchema,"central_owner");
});


test("PA05-04D6 Host requires complete trusted PostgreSQL identities for optional ACL attestation", async () => {
  const m=fixture();
  const config=pa05HostLifecycleConfigurationV010({
    PA05_WRITE_LIFECYCLE_PACKAGES:packageId,
    PA05_WRITE_LIFECYCLE_DATABASE_URL:"postgres://fixture",
    PA05_WRITE_LIFECYCLE_SCHEMA:"pa05_worker_schema",
    PA05_WRITE_LIFECYCLE_AUTHORITY_SCHEMA:"pa05_central_authority",
    PA05_WRITE_LIFECYCLE_WORKER_SCHEMAS:"pa05_worker_schema,other_worker_schema",
    PA05_SHARED_SCHEMA_AUTHORITY_ENABLED:"1",
    PA05_SQL_WRITE_ADMISSION_ENABLED:"1",
    PA05_SQL_WORKER_IDENTITIES:"pa05_worker_schema:agent_role_a,other_worker_schema:agent_role_b"
  });
  assert.deepEqual(config.workerIdentities,[
    {schema:"pa05_worker_schema",role:"agent_role_a"},
    {schema:"other_worker_schema",role:"agent_role_b"}
  ]);
  const mockGate=async()=>({async close(){}});
  const host=createPa05HostWriteLifecycleV010({
    manager:m,gateFactory:mockGate,...config
  });
  await host.close();
  for (const identities of [
    [{schema:"pa05_worker_schema",role:"agent_role_a"}],
    [{schema:"pa05_worker_schema",role:"agent_role_a"},
     {schema:"other_worker_schema",role:"agent_role_a"}],
    [{schema:"pa05_worker_schema",role:"agent_role_a"},
     {schema:"not_registered",role:"agent_role_b"}]
  ]) assert.throws(()=>createPa05HostWriteLifecycleV010({
    manager:m,gateFactory:mockGate,...config,workerIdentities:identities
  }),/PA05_HOST_WORKER_IDENTITIES_INVALID/);
  assert.throws(()=>createPa05HostWriteLifecycleV010({
    manager:m,gateFactory:mockGate,...config,enforceSqlOwnerAdmission:false
  }),/PA05_HOST_WORKER_IDENTITIES_INVALID/);
  assert.throws(()=>pa05HostLifecycleConfigurationV010({
    PA05_SQL_WORKER_IDENTITIES:"worker_without_role"
  }),/PA05_HOST_WORKER_IDENTITIES_INVALID/);
});
