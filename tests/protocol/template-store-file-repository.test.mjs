import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
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
    assert.equal(seed.version, 3);
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
      3
    );
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});


test("durable Template Store preserves old versions and adds Projection Gallery v3", () => {
  const dir = mkdtempSync(join(tmpdir(), "evo-template-store-"));
  const path = join(dir, "template-store.json");

  try {
    const currentSeed = templateStoreSeedRecordsV010.find(
      record => record.version === 3
    );
    assert.ok(currentSeed);
    assert.equal(currentSeed.version, 3);

    const oldUnsigned = structuredClone(currentSeed.bundle);
    delete oldUnsigned.contentDigest;
    oldUnsigned.transferId = "built-in:evo.ledger-runtime.baseline.v0.1";
    oldUnsigned.source.definitionRevision = 0;
    oldUnsigned.definition.payload = {
      contractVersion: "0.1.0",
      runtimeFlow: [
        "BusinessData",
        "Posting",
        "LedgerEntry",
        "LedgerBalance"
      ]
    };

    const oldRecord = {
      contractVersion: "0.1.0",
      templateId: currentSeed.templateId,
      version: 1,
      bundle: {
        ...oldUnsigned,
        contentDigest: templateTransferDigestV010(oldUnsigned)
      },
      publishedAt: "2026-10-04T00:00:00.000Z"
    };

    writeFileSync(
      path,
      JSON.stringify({
        contractVersion: "0.1.0",
        records: [oldRecord]
      }, null, 2) + "\n",
      "utf8"
    );

    const repository = createFileTemplateStoreRepositoryV010(
      path,
      templateStoreSeedRecordsV010
    );

    assert.equal(
      repository.getVersion(currentSeed.templateId, 1)?.version,
      1
    );
    assert.equal(
      repository.getVersion(currentSeed.templateId, 2)?.version,
      2
    );
    assert.equal(
      repository.getVersion(currentSeed.templateId, 3)?.version,
      3
    );
    assert.equal(
      repository.getLatest(currentSeed.templateId)?.version,
      3
    );
    assert.equal(
      repository.getLatest(currentSeed.templateId)
        ?.bundle.definition.projectionGallery.primaryProjectionId,
      "projection:main"
    );
    assert.equal(
      repository.getLatest(currentSeed.templateId)
        ?.bundle.definition.payload.kind,
      "evo.ledger-runtime.template"
    );
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
