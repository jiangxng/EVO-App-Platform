import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  createFileTemplateStoreRepositoryV010
} from "../../dist/apps/template-store/repository.js";
import {
  templateStoreSeedRecordsV010
} from "../../dist/apps/template-store/seed-records.js";
import {
  templateTransferDigestV010
} from "../../dist/contracts/template-transfer.js";

function revisedBundle(seed, transferId, sharedAt) {
  const unsigned = structuredClone(seed.bundle);
  delete unsigned.contentDigest;
  unsigned.transferId = transferId;
  unsigned.sharedAt = sharedAt;
  return {
    ...unsigned,
    contentDigest: templateTransferDigestV010(unsigned)
  };
}

test("file Template Store repository exposes the built-in seed before a state file exists", () => {
  const dir = mkdtempSync(join(tmpdir(), "evo-template-store-"));
  const path = join(dir, "template-store.json");

  try {
    const repository = createFileTemplateStoreRepositoryV010(
      path,
      templateStoreSeedRecordsV010
    );
    const seed = repository.getLatest("evo.ledger-runtime.baseline.v0.1");
    assert.ok(seed);
    assert.equal(seed.version, 1);
    assert.equal(seed.bundle.definition.kind, "LEDGER_RUNTIME_TEMPLATE");
    assert.equal(existsSync(path), false);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("file Template Store repository persists published records together with the built-in seed", () => {
  const dir = mkdtempSync(join(tmpdir(), "evo-template-store-"));
  const path = join(dir, "template-store.json");

  try {
    const repository = createFileTemplateStoreRepositoryV010(
      path,
      templateStoreSeedRecordsV010
    );
    const seeded = repository.getLatest("evo.ledger-runtime.baseline.v0.1");
    assert.ok(seeded);

    repository.publish({
      templateId: "template:second",
      bundle: revisedBundle(
        seeded,
        "test:template:second:v1",
        "2026-10-04T02:00:00.000Z"
      ),
      publishedAt: "2026-10-04T02:00:00.000Z"
    });

    const reopened = createFileTemplateStoreRepositoryV010(
      path,
      templateStoreSeedRecordsV010
    );
    assert.ok(reopened.getLatest("template:second"));
    assert.equal(
      JSON.parse(readFileSync(path, "utf8")).records.length,
      2
    );
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
