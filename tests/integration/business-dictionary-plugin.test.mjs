import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  createFileEnterpriseResourceRepositoryV010,
  createMemoryEnterpriseResourceRepositoryV010
} from "../../dist/providers/enterprise-context/resources.js";
import {
  createBusinessDictionaryRepositoryV010
} from "../../dist/apps/business-dictionary/repository.js";
import {
  createBusinessDictionaryActionHandlersV010
} from "../../dist/apps/business-dictionary/actions.js";
import {
  businessDictionaryPackage
} from "../../dist/apps/business-dictionary/package.js";
import {
  createBusinessDictionaryRuntimeHostV010
} from "../../dist/manager/business-dictionary-runtime.js";

const contextId = "enterprise-context:a";
const options = [
  { code: "A", label: { default: "Strategic", translations: { "zh-CN": "重点客户" } },
    aliases: ["重点"], status: "ACTIVE" },
  { code: "B", label: { default: "Standard" }, aliases: ["普通"], status: "ACTIVE" },
  { code: "C", label: { default: "Retired" }, aliases: ["旧客户"], status: "INACTIVE" }
];
const fixed = { contextId, dictionaryId: "counterparty.customer-level",
  actorSubjectId: "owner-a", recordedAt: "2026-10-30T00:00:00.000Z" };
function ctx(kind = "OWNER", id = contextId, actorType = "HUMAN") {
  return {
    contractVersion: "0.1.0",
    principal: {
      contractVersion: "0.1.0", subjectId: "owner-a",
      identityProviderId: "test", sessionId: "session-a", actorType
    },
    scope: { contractVersion: "0.1.0", enterpriseId: id === contextId ? "ent-a" : "ent-b" },
    context: {
      contractVersion: "0.1.0",
      personalContext: { contractVersion: "0.1.0", kind: "PERSONAL",
        contextId: "personal:owner-a", ownerSubjectId: "owner-a" },
      activeContext: { contractVersion: "0.1.0", kind: "ENTERPRISE",
        contextId: id, enterpriseId: id === contextId ? "ent-a" : "ent-b" }
    },
    correlationId: kind
  };
}
function request(code, values) {
  return {
    contractVersion: "0.1.0", type: "command",
    command: { code, inputVersion: "0.1.0" }, values,
    actionId: code, sourceInteractionId: "dictionary-test", requiresConfirmation: false
  };
}
const commands = {
  draft: "dictionary.draft.save", publish: "dictionary.publish",
  list: "dictionary.list", resolve: "dictionary.resolve.batch"
};

test("RD-02 plugin is opt-in and requires Enterprise Resource; no eager business payload", () => {
  const feature = businessDictionaryPackage.features[0];
  assert.equal(businessDictionaryPackage.packageId, "evo-business-dictionary");
  assert.equal(feature.defaultActivation, true);
  assert.ok(feature.requiresCapabilities.includes("enterprise.resource.repository"));
  assert.ok(feature.providesCapabilities.includes("enterprise.business-dictionary"));
  assert.ok(feature.contributions.some(x => x.kind === "platform.capability-operation"));
});

test("RD-02: enterprise draft, human publication, stable resolution and history", () => {
  const repo = createBusinessDictionaryRepositoryV010(createMemoryEnterpriseResourceRepositoryV010());
  const draft = repo.saveDraft({ ...fixed, expectedVersion: 0, options });
  assert.equal(draft.version, 1);
  assert.equal(draft.state, "DRAFT");
  assert.equal(repo.getEffective(contextId, fixed.dictionaryId), undefined);
  const published = repo.publish({ ...fixed, expectedVersion: 1, actorType: "HUMAN" });
  assert.equal(published.state, "PUBLISHED");
  assert.deepEqual(repo.resolveBatch({ contextId, dictionaryId: fixed.dictionaryId,
    sourceValues: ["重点", "普通", "旧客户", "重点客户"] }).map(x => x.status),
    ["RESOLVED", "RESOLVED", "INACTIVE", "UNKNOWN"]);
  assert.deepEqual(repo.history(contextId, fixed.dictionaryId).map(x => [x.version, x.state]),
    [[1, "PUBLISHED"]]);
  const updated = repo.saveDraft({ ...fixed, expectedVersion: 1, options: [
    { ...options[0], label: { default: "Strategic VIP" } }, ...options.slice(1)
  ] });
  assert.equal(updated.state, "DRAFT");
  assert.equal(updated.version, 2);
  assert.equal(repo.getEffective(contextId, fixed.dictionaryId).version, 1);
  assert.equal(repo.resolveBatch({ contextId, dictionaryId: fixed.dictionaryId,
    sourceValues: ["重点"] })[0].optionCode, "A");
  assert.deepEqual(repo.history(contextId, fixed.dictionaryId).map(x => x.version), [1, 2]);
});

test("RD-02: repeated drafts and repeated publish are idempotent; stale changes fail", () => {
  const repo = createBusinessDictionaryRepositoryV010(createMemoryEnterpriseResourceRepositoryV010());
  assert.equal(repo.saveDraft({ ...fixed, expectedVersion: 0, options }).version, 1);
  assert.equal(repo.saveDraft({ ...fixed, expectedVersion: 0, options }).version, 1);
  assert.equal(repo.publish({ ...fixed, expectedVersion: 1, actorType: "HUMAN" }).state, "PUBLISHED");
  assert.equal(repo.publish({ ...fixed, expectedVersion: 1, actorType: "HUMAN" }).state, "PUBLISHED");
  assert.throws(() => repo.saveDraft({ ...fixed, expectedVersion: 0,
    options: [{ ...options[0], label: { default: "Wrong retry" } }] }),
  /BUSINESS_DICTIONARY_VERSION_CONFLICT/);
  assert.throws(() => repo.publish({ ...fixed, expectedVersion: 0, actorType: "HUMAN" }),
  /BUSINESS_DICTIONARY_VERSION_CONFLICT/);
});

test("RD-02: collision and invalid options refuse publication atomically", () => {
  const repo = createBusinessDictionaryRepositoryV010(createMemoryEnterpriseResourceRepositoryV010());
  const conflict = [...options, { code: "D", label: { default: "Other" },
    aliases: ["重点"], status: "ACTIVE" }];
  const draft = repo.saveDraft({ ...fixed, expectedVersion: 0, options: conflict });
  assert.throws(() => repo.publish({ ...fixed, expectedVersion: draft.version, actorType: "HUMAN" }),
    /BUSINESS_DICTIONARY_AMBIGUOUS_ALIAS/);
  assert.equal(repo.get(contextId, fixed.dictionaryId).state, "DRAFT");
  assert.throws(() => repo.saveDraft({ ...fixed, expectedVersion: 1,
    options: [{ ...options[0], code: "a" }, options[0]] }),
    /BUSINESS_DICTIONARY_CODE_DUPLICATE/);
  assert.equal(repo.history(contextId, fixed.dictionaryId).length, 1);
});

test("RD-02: publisher must be Human and a different enterprise cannot read source", () => {
  const repo = createBusinessDictionaryRepositoryV010(createMemoryEnterpriseResourceRepositoryV010());
  repo.saveDraft({ ...fixed, expectedVersion: 0, options });
  assert.throws(() => repo.publish({ ...fixed, expectedVersion: 1, actorType: "AI" }),
    /BUSINESS_DICTIONARY_PUBLISH_HUMAN_REQUIRED/);
  assert.equal(repo.get("enterprise-context:b", fixed.dictionaryId), undefined);
  assert.equal(repo.getEffective("enterprise-context:b", fixed.dictionaryId), undefined);
  assert.throws(() => repo.resolveBatch({ contextId: "enterprise-context:b",
    dictionaryId: fixed.dictionaryId, sourceValues: ["重点"] }),
    /BUSINESS_DICTIONARY_NOT_PUBLISHED/);
});

test("RD-02: file-backed Enterprise Context survives process-style repository re-open", () => {
  const dir = mkdtempSync(join(tmpdir(), "evo-dictionary-rd02-"));
  try {
    const path = join(dir, "enterprise-resources.json");
    let repo = createBusinessDictionaryRepositoryV010(createFileEnterpriseResourceRepositoryV010(path));
    repo.saveDraft({ ...fixed, expectedVersion: 0, options });
    repo.publish({ ...fixed, expectedVersion: 1, actorType: "HUMAN" });
    repo = createBusinessDictionaryRepositoryV010(createFileEnterpriseResourceRepositoryV010(path));
    assert.equal(repo.getEffective(contextId, fixed.dictionaryId)?.version, 1);
    assert.equal(repo.resolveBatch({ contextId, dictionaryId: fixed.dictionaryId,
      expectedVersion: 1, sourceValues: ["A"] })[0].status, "RESOLVED");
    assert.equal(repo.resolveBatch({ contextId, dictionaryId: fixed.dictionaryId,
      expectedVersion: 2, sourceValues: ["A"] })[0].status, "VERSION_MISMATCH");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("RD-02: ActionHost rejects missing context, non-admin writes, AI publication and enterprise spoof", async () => {
  const repo = createBusinessDictionaryRepositoryV010(createMemoryEnterpriseResourceRepositoryV010());
  const isManager = (_, id) => id === contextId;
  const handlers = createBusinessDictionaryActionHandlersV010({
    repository: repo, canRead: isManager, canManage: isManager
  });
  const perform = (code, values, context) =>
    handlers.find(h => h.commandCode === code).execute(request(code, values), context);
  assert.equal((await perform(commands.draft, {
    dictionaryId: fixed.dictionaryId, expectedVersion: 0, options
  }, undefined)).error.code, "BUSINESS_DICTIONARY_ENTERPRISE_CONTEXT_REQUIRED");
  const denied = createBusinessDictionaryActionHandlersV010({
    repository: repo, canRead: () => true, canManage: () => false
  }).find(h => h.commandCode === commands.draft);
  assert.equal((await denied.execute(request(commands.draft, {
    dictionaryId: fixed.dictionaryId, expectedVersion: 0, options
  }), ctx())).error.code, "BUSINESS_DICTIONARY_PERMISSION_DENIED");
  assert.equal((await perform(commands.draft, {
    dictionaryId: fixed.dictionaryId, expectedVersion: 0, options
  }, ctx())).ok, true);
  assert.equal((await perform(commands.publish, {
    dictionaryId: fixed.dictionaryId, expectedVersion: 1
  }, ctx("OWNER", contextId, "AI"))).error.code, "BUSINESS_DICTIONARY_PUBLISH_HUMAN_REQUIRED");
  assert.equal((await perform(commands.publish, {
    dictionaryId: fixed.dictionaryId, expectedVersion: 1
  }, ctx())).ok, true);
  const spoof = ctx(); spoof.scope.enterpriseId = "ent-other";
  assert.equal((await perform(commands.list, {}, spoof)).error.code,
    "BUSINESS_DICTIONARY_ENTERPRISE_CONTEXT_REQUIRED");
});

test("RD-02: lazy runtime blocks disabled plugin, and reacts to shutdown", async () => {
  let active = false;
  const runtime = createBusinessDictionaryRuntimeHostV010({
    isActive: () => active, resources: createMemoryEnterpriseResourceRepositoryV010()
  });
  await assert.rejects(runtime.resolve(), /PROVIDER_NOT_ACTIVE_OR_STOPPING/);
  active = true;
  const repo = await runtime.resolve();
  repo.saveDraft({ ...fixed, expectedVersion: 0, options });
  active = false;
  assert.throws(() => repo.list(contextId), /PROVIDER_NOT_ACTIVE_OR_STOPPING/);
  await runtime.stop();
  await assert.rejects(runtime.resolve(), /PROVIDER_NOT_ACTIVE_OR_STOPPING/);
});
