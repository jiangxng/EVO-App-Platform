import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";

import {
  createWebAssetArchiveV010
} from "../../dist/manager/web-asset-archive.js";

test("web asset archive snapshots JS/CSS and serves exact old revision bytes", async () => {
  const root = await mkdtemp(join(tmpdir(), "evo-web-assets-"));
  const sourceRoot = join(root, "dist");
  const archiveRoot = join(root, "archive");

  try {
    await mkdir(join(sourceRoot, "manager"), { recursive: true });
    await mkdir(join(sourceRoot, "vendor", "eidos"), { recursive: true });
    await writeFile(
      join(sourceRoot, "manager", "app-host-client.js"),
      "export const version = 'rev-1';\n",
      "utf8"
    );
    await writeFile(
      join(sourceRoot, "vendor", "eidos", "runtime.js"),
      "export const runtime = 1;\n",
      "utf8"
    );
    await writeFile(
      join(sourceRoot, "manager", "ignored.txt"),
      "not a browser module\n",
      "utf8"
    );

    const archive = createWebAssetArchiveV010({
      currentRevision: "rev-1",
      sourceRoot,
      archiveRoot,
      shellCss: "body{display:block}",
      retention: 3
    });

    await archive.ensureCurrent();

    assert.equal(
      (await archive.readArchived(
        "rev-1",
        "manager/app-host-client.js"
      ))?.toString("utf8"),
      "export const version = 'rev-1';\n"
    );
    assert.equal(
      (await archive.readArchived(
        "rev-1",
        "manager/app-host-shell.css"
      ))?.toString("utf8"),
      "body{display:block}"
    );
    assert.equal(
      await archive.readArchived("rev-1", "manager/ignored.txt"),
      undefined
    );
    assert.deepEqual(await archive.revisions(), ["rev-1"]);

    // Mutating the live source does not mutate the immutable archived revision.
    await writeFile(
      join(sourceRoot, "manager", "app-host-client.js"),
      "export const version = 'rev-2';\n",
      "utf8"
    );
    assert.equal(
      (await readFile(
        join(
          archiveRoot,
          "rev-1",
          "manager",
          "app-host-client.js"
        ),
        "utf8"
      )),
      "export const version = 'rev-1';\n"
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("web asset archive rejects traversal and unknown revisions", async () => {
  const root = await mkdtemp(join(tmpdir(), "evo-web-assets-safe-"));
  try {
    const archive = createWebAssetArchiveV010({
      currentRevision: "rev-safe",
      sourceRoot: root,
      archiveRoot: join(root, "archive"),
      shellCss: "",
      retention: 2
    });

    assert.equal(
      await archive.readArchived("../bad", "manager/a.js"),
      undefined
    );
    assert.equal(
      await archive.readArchived("rev-safe", "../secret.js"),
      undefined
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
