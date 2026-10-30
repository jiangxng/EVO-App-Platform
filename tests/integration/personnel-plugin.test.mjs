import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

import {
  createFileEnterpriseResourceRepositoryV010,
  createMemoryEnterpriseResourceRepositoryV010
} from "../../dist/providers/enterprise-context/resources.js";
import { createOrganizationRepositoryV010 } from "../../dist/apps/organization/repository.js";
import { createPersonnelRepositoryV010 } from "../../dist/apps/personnel/repository.js";
import { createPersonnelActionHandlersV010 } from "../../dist/apps/personnel/actions.js";
import { createOrganizationRuntimeHostV010 } from "../../dist/manager/organization-runtime.js";
import { createPersonnelRuntimeHostV010 } from "../../dist/manager/personnel-runtime.js";
import { personnelPackage } from "../../dist/catalog/seed.js";
import { createAppActionRouter } from "../../dist/actions/router.js";
import { createLazyAppActionHandlerV010 } from "../../dist/actions/lazy-handler.js";

const contextId = "enterprise:a", organizationId = "org.test", directoryId = "staff";
const base = { contextId, actorSubjectId: "owner", recordedAt: "2026-10-30T10:00:00Z" };
const units = [
  { unitId: "OU-01", code: "DEPT-01", displayName: { default: "Sales" },
    kind: "DEPARTMENT", status: "ACTIVE" },
  { unitId: "OU-02", code: "DEPT-02", displayName: { default: "Support" },
    kind: "DEPARTMENT", status: "ACTIVE" },
  { unitId: "OU-OLD", code: "OLD", displayName: { default: "Retired" },
    kind: "DEPARTMENT", status: "INACTIVE" }
];
const assignment = { organizationId, organizationVersion: 1, unitId: "OU-01" };
const people = [
  { personId: "P-01", code: "EMP-101", displayName: { default: "张三" },
    aliases: ["SYS-101"], state: "ACTIVE", assignments: [assignment],
    linkedPrincipalSubjectId: "login-1" },
  { personId: "P-02", code: "EMP-202", displayName: { default: "张三" },
    aliases: ["SYS-202"], state: "ACTIVE",
    assignments: [{ ...assignment, unitId: "OU-02" }] },
  { personId: "P-03", code: "EMP-303", displayName: { default: "王五" },
    state: "INACTIVE", assignments: [] }
];
function setup(resources = createMemoryEnterpriseResourceRepositoryV010()) {
  const org = createOrganizationRepositoryV010(resources);
  org.saveDraft({ ...base, organizationId, expectedVersion: 0, units });
  org.publish({ ...base, organizationId, expectedVersion: 1, actorType: "HUMAN" });
  return { resources, org, directory: createPersonnelRepositoryV010(resources, org) };
}
const params = { ...base, personnelDirectoryId: directoryId };
function ctx(actorType = "HUMAN") {
  return { contractVersion: "0.1.0",
    principal: { contractVersion: "0.1.0", subjectId: "owner",
      identityProviderId: "test", sessionId: "test", actorType },
    scope: { contractVersion: "0.1.0", enterpriseId: "company-A" },
    context: { contractVersion: "0.1.0",
      personalContext: { contractVersion: "0.1.0", kind: "PERSONAL",
        contextId: "personal:owner", ownerSubjectId: "owner" },
      activeContext: { contractVersion: "0.1.0", kind: "ENTERPRISE",
        contextId, enterpriseId: "company-A" }
    }, correlationId: "people-test" };
}
function command(code, values) {
  return { contractVersion: "0.1.0", type: "command",
    command: { code, inputVersion: "0.1.0" }, values,
    actionId: code, sourceInteractionId: "people-test", requiresConfirmation: false };
}

test("PE-01: personnel is opt-in and depends on published organization owner", () => {
  const feature = personnelPackage.features[0];
  assert.equal(personnelPackage.packageId, "evo-personnel");
  assert.ok(feature.requiresCapabilities.includes("enterprise.organization"));
  assert.ok(feature.requiresCapabilities.includes("enterprise.resource.repository"));
  assert.equal(feature.contributions.filter(x => x.kind === "platform.capability-operation").length, 4);
});

test("PE-01/02: same-name employees stay separate via stable codes and optional account link", () => {
  const { directory } = setup();
  directory.saveDraft({ ...params, expectedVersion: 0, persons: people });
  assert.equal(directory.getEffective(contextId, directoryId), undefined);
  const publication = directory.publish({ ...params, expectedVersion: 1, actorType: "HUMAN" });
  assert.equal(publication.state, "PUBLISHED");
  const results = directory.resolveBatch({ contextId, personnelDirectoryId: directoryId,
    sourceValues: ["EMP-101", "SYS-202", "张三", "EMP-303", "unknown"] });
  assert.deepEqual(results.map(x => x.status),
    ["RESOLVED", "RESOLVED", "UNKNOWN", "INACTIVE", "UNKNOWN"]);
  assert.deepEqual(results.slice(0, 2).map(x => x.personId), ["P-01", "P-02"]);
  assert.equal(directory.get(contextId, directoryId).persons[0].linkedPrincipalSubjectId, "login-1");
});

test("PE-02: idempotent batch draft and Human publish; changed source on stale version rejects", () => {
  const { directory } = setup();
  const initial = directory.saveDraft({ ...params, expectedVersion: 0, persons: people });
  assert.equal(initial.version, 1);
  assert.equal(directory.saveDraft({ ...params, expectedVersion: 0, persons: people }).version, 1);
  assert.throws(() => directory.publish({ ...params, expectedVersion: 1, actorType: "AI" }),
    /PERSONNEL_PUBLISH_HUMAN_REQUIRED/);
  assert.equal(directory.publish({ ...params, expectedVersion: 1, actorType: "HUMAN" }).state, "PUBLISHED");
  assert.equal(directory.publish({ ...params, expectedVersion: 1, actorType: "HUMAN" }).state, "PUBLISHED");
  assert.throws(() => directory.saveDraft({ ...params, expectedVersion: 0,
    persons: [{ ...people[0], code: "CHANGED" }] }), /PERSONNEL_VERSION_CONFLICT/);
  directory.saveDraft({ ...params, expectedVersion: 1, persons: people.map(x => ({
    ...x, displayName: { default: "updated" }
  })) });
  assert.equal(directory.getEffective(contextId, directoryId).version, 1);
  assert.equal(directory.history(contextId, directoryId).length, 2);
});

test("PE-01: invalid, missing, inactive, foreign or unpublished organization references cannot publish", () => {
  const invalid = [
    [{ ...people[0], assignments: [{ ...assignment, unitId: "MISSING" }] },
      /PERSONNEL_ORGANIZATION_UNIT_NOT_FOUND/],
    [{ ...people[0], assignments: [{ ...assignment, unitId: "OU-OLD" }] },
      /PERSONNEL_ORGANIZATION_UNIT_INACTIVE/],
    [{ ...people[0], assignments: [{ ...assignment, organizationVersion: 3 }] },
      /PERSONNEL_ORGANIZATION_VERSION_STALE/],
    [{ ...people[0], assignments: [{ ...assignment, organizationId: "other-org" }] },
      /PERSONNEL_ORGANIZATION_NOT_PUBLISHED/]
  ];
  for (const [person, expected] of invalid) {
    const { directory } = setup();
    directory.saveDraft({ ...params, expectedVersion: 0, persons: [person] });
    assert.throws(() => directory.publish({ ...params, expectedVersion: 1, actorType: "HUMAN" }), expected);
    assert.equal(directory.getEffective(contextId, directoryId), undefined);
  }
  const isolated = createPersonnelRepositoryV010(
    createMemoryEnterpriseResourceRepositoryV010(),
    createOrganizationRepositoryV010(createMemoryEnterpriseResourceRepositoryV010())
  );
  isolated.saveDraft({ ...params, expectedVersion: 0, persons: [people[0]] });
  assert.throws(() => isolated.publish({ ...params, expectedVersion: 1, actorType: "HUMAN" }),
    /PERSONNEL_ORGANIZATION_NOT_PUBLISHED/);
});

test("PE-01: duplicate business codes, IDs, source aliases and appointments fail closed", () => {
  for (const [persons, expected, publishing] of [
    [[people[0], { ...people[1], code: "emp-101" }], /PERSONNEL_DUPLICATE_CODE/, false],
    [[people[0], { ...people[1], personId: "P-01" }], /PERSONNEL_DUPLICATE_PERSON_ID/, false],
    [[people[0], { ...people[1], aliases: ["SYS-101"] }], /PERSONNEL_SOURCE_MAPPING_AMBIGUOUS/, true],
    [[{ ...people[0], assignments: [assignment, assignment] }], /PERSONNEL_ASSIGNMENT_DUPLICATE/, false]
  ]) {
    const { directory } = setup();
    if (publishing) {
      directory.saveDraft({ ...params, expectedVersion: 0, persons });
      assert.throws(() => directory.publish({ ...params, expectedVersion: 1, actorType: "HUMAN" }), expected);
    } else {
      assert.throws(() => directory.saveDraft({ ...params, expectedVersion: 0, persons }), expected);
    }
  }
});

test("PE-02: source reference access is tenant-isolated and organogram revisions invalidate refs", () => {
  const { directory, org } = setup();
  directory.saveDraft({ ...params, expectedVersion: 0, persons: people });
  directory.publish({ ...params, expectedVersion: 1, actorType: "HUMAN" });
  assert.equal(directory.getEffective("enterprise:b", directoryId), undefined);
  assert.throws(() => directory.resolveBatch({ contextId: "enterprise:b",
    personnelDirectoryId: directoryId, sourceValues: ["EMP-101"] }),
  /PERSONNEL_NOT_PUBLISHED/);
  assert.equal(directory.resolveBatch({ contextId, personnelDirectoryId: directoryId,
    expectedVersion: 2, sourceValues: ["EMP-101"] })[0].status, "VERSION_MISMATCH");
  org.saveDraft({ ...base, organizationId, expectedVersion: 1,
    units: units.map(x => ({ ...x, displayName: { default: "New" } })) });
  org.publish({ ...base, organizationId, expectedVersion: 2, actorType: "HUMAN" });
  assert.throws(() => directory.resolveBatch({ contextId,
    personnelDirectoryId: directoryId, sourceValues: ["EMP-101"] }),
  /PERSONNEL_ORGANIZATION_VERSION_STALE/);
});

test("PE-02: file-backed enterprise resources survive restart", () => {
  const temp = mkdtempSync(join(tmpdir(), "evo-personnel-"));
  try {
    const file = join(temp, "enterprise.json");
    let { directory } = setup(createFileEnterpriseResourceRepositoryV010(file));
    directory.saveDraft({ ...params, expectedVersion: 0, persons: people });
    directory.publish({ ...params, expectedVersion: 1, actorType: "HUMAN" });
    const reopened = createFileEnterpriseResourceRepositoryV010(file);
    directory = createPersonnelRepositoryV010(reopened, createOrganizationRepositoryV010(reopened));
    assert.equal(directory.getEffective(contextId, directoryId).version, 1);
    assert.equal(directory.resolveBatch({ contextId, personnelDirectoryId: directoryId,
      sourceValues: ["EMP-202"] })[0].personId, "P-02");
  } finally { rmSync(temp, { recursive: true, force: true }); }
});

test("PE-02: ActionHost guards management, shields login association and rejects cross-enterprise spoof", async () => {
  const { directory } = setup();
  const handlers = createPersonnelActionHandlersV010({
    repository: directory, canRead: () => true, canManage: () => true
  });
  const perform = (code, values, context) => handlers.find(x => x.commandCode === code)
    .execute(command(code, values), context);
  assert.equal((await perform("personnel.draft.save", {
    personnelDirectoryId: directoryId, expectedVersion: 0, persons: people
  }, undefined)).error.code, "PERSONNEL_ENTERPRISE_CONTEXT_REQUIRED");
  const deny = createPersonnelActionHandlersV010({
    repository: directory, canRead: () => true, canManage: () => false
  }).find(x => x.commandCode === "personnel.draft.save");
  assert.equal((await deny.execute(command("personnel.draft.save", {
    personnelDirectoryId: directoryId, expectedVersion: 0, persons: people
  }), ctx())).error.code, "PERSONNEL_PERMISSION_DENIED");
  assert.equal((await perform("personnel.draft.save", {
    personnelDirectoryId: directoryId, expectedVersion: 0, persons: people
  }, ctx())).ok, true);
  assert.equal((await perform("personnel.publish", {
    personnelDirectoryId: directoryId, expectedVersion: 1
  }, ctx("AI"))).error.code, "PERSONNEL_WRITE_HUMAN_REQUIRED");
  assert.equal((await perform("personnel.publish", {
    personnelDirectoryId: directoryId, expectedVersion: 1
  }, ctx())).ok, true);
  const listing = await perform("personnel.list", { personnelDirectoryId: directoryId }, ctx());
  assert.equal(listing.ok, true);
  assert.equal(listing.result.data.persons[0].linkedPrincipalSubjectId, undefined);
  const spoofed = ctx(); spoofed.scope.enterpriseId = "company-B";
  assert.equal((await perform("personnel.list", {}, spoofed)).error.code,
    "PERSONNEL_ENTERPRISE_CONTEXT_REQUIRED");
});

test("PE-02: lazy Host router refuses inactive personnel or organization dependency", async () => {
  let orgActive = false, staffActive = false, loads = 0;
  const resources = createMemoryEnterpriseResourceRepositoryV010();
  const orgHost = createOrganizationRuntimeHostV010({ isActive: () => orgActive, resources });
  const staffHost = createPersonnelRuntimeHostV010({
    isActive: () => staffActive, resources, organization: () => orgHost.resolve()
  });
  const codes = ["personnel.list", "personnel.draft.save",
    "personnel.publish", "personnel.resolve.batch"];
  const router = createAppActionRouter(codes.map(code => createLazyAppActionHandlerV010({
    packageId: "evo-personnel", featureId: "evo-personnel.default", commandCode: code,
    async load() {
      loads++;
      return createPersonnelActionHandlersV010({
        resolveRepository: () => staffHost.resolve(),
        canRead: () => true, canManage: () => true
      }).find(h => h.commandCode === code);
    }
  })), feature => staffActive && feature === "evo-personnel.default");
  const draft = command("personnel.draft.save", {
    personnelDirectoryId: directoryId, expectedVersion: 0, persons: people
  });
  assert.equal((await router.execute(draft, ctx())).error.code, "ACTION_FEATURE_NOT_ACTIVE");
  assert.equal(loads, 0);
  staffActive = true;
  assert.equal((await router.execute(draft, ctx())).error.code, "PROVIDER_NOT_ACTIVE_OR_STOPPING");
  orgActive = true;
  const org = await orgHost.resolve();
  org.saveDraft({ ...base, organizationId, expectedVersion: 0, units });
  org.publish({ ...base, organizationId, expectedVersion: 1, actorType: "HUMAN" });
  assert.equal((await router.execute(draft, ctx())).ok, true);
  assert.equal((await router.execute(command("personnel.publish", {
    personnelDirectoryId: directoryId, expectedVersion: 1
  }), ctx())).ok, true);
  assert.equal((await router.execute(command("personnel.resolve.batch", {
    personnelDirectoryId: directoryId, sourceValues: ["SYS-202"]
  }), ctx())).result.data[0].personId, "P-02");
  staffActive = false;
  assert.equal((await router.execute(draft, ctx())).error.code, "ACTION_FEATURE_NOT_ACTIVE");
  await staffHost.stop();
  await orgHost.stop();
});
