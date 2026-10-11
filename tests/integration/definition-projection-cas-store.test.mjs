import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  createMemoryDefinitionProjectionStoreV010,
  createFileDefinitionProjectionStoreV010
} from "../../dist/providers/enterprise-context/definition-projection-store.js";
import { ledgerRuntimeBaselineBundleV010 } from "../../dist/apps/template-store/seed-records.js";

const identity = {
  enterpriseId: "enterprise-a",
  definitionId: "ledger:main",
  definitionRevision: 0
};
const gallery = ledgerRuntimeBaselineBundleV010.definition.projectionGallery;
function entry() {
  return {
    ...identity,
    gallery: structuredClone(gallery),
    updatedAt: "2026-10-10T00:00:00.000Z",
    updatedBySubjectId: "actor-a"
  };
}

test("memory store increments independently from business revision and rejects stale CAS", () => {
  const store = createMemoryDefinitionProjectionStoreV010();
  assert.equal(store.getVersion(identity), 0);
  assert.equal(store.putIfVersion(entry(), 0).version, 1);
  const before = store.snapshot();
  assert.throws(() => store.putIfVersion(entry(), 0), /DEFINITION_PROJECTION_WRITE_CONFLICT/);
  assert.deepEqual(store.snapshot(), before);
  assert.equal(store.putIfVersion(entry(), 1).version, 2);
  assert.equal(store.getVersion(identity), 2);
  assert.equal(store.snapshot().entries[0].definitionRevision, 0);
});

test("legacy projection snapshots without gallery version migrate on next write", () => {
  const old = createMemoryDefinitionProjectionStoreV010({
    contractVersion: "0.1.0", entries: [entry()]
  });
  assert.equal(old.getVersion(identity), 1);
  assert.equal(old.putIfVersion(entry(), 1).version, 2);
  assert.equal(old.snapshot().entries[0].version, 2);
  assert.throws(() => old.putIfVersion(entry(), -1), /DEFINITION_PROJECTION_WRITE_TOKEN_INVALID/);
});

test("independent file-backed store instances compare tokens against fresh disk state", () => {
  const dir = mkdtempSync(join(tmpdir(), "evo-projection-cas-"));
  try {
    const path = join(dir, "projection-state.json");
    const first = createFileDefinitionProjectionStoreV010(path);
    const second = createFileDefinitionProjectionStoreV010(path);
    assert.equal(first.getVersion(identity), 0);
    assert.equal(first.putIfVersion(entry(), 0).version, 1);
    const before = first.snapshot();
    assert.equal(second.getVersion(identity), 1);
    assert.throws(() => second.putIfVersion(entry(), 0), /DEFINITION_PROJECTION_WRITE_CONFLICT/);
    assert.deepEqual(first.snapshot(), before);
    mkdirSync(path + ".lock");
    assert.throws(() => second.putIfVersion(entry(), 1), /DEFINITION_PROJECTION_STORE_LOCKED/);
    assert.deepEqual(first.snapshot(), before);
    rmSync(path + ".lock", { recursive: true });
    assert.equal(second.putIfVersion(entry(), 1).version, 2);
    assert.equal(first.getVersion(identity), 2);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
