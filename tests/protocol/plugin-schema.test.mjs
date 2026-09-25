import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import { validatePluginManifestV010 } from "../../dist/contracts/plugin-protocol.js";

async function json(path) {
  return JSON.parse(await readFile(new URL(path, import.meta.url), "utf8"));
}

test("portable Package and Feature schemas are versioned Draft 2020-12 contracts", async () => {
  const packageSchema = await json("../../contracts/schema/plugin-package-v0.1.schema.json");
  const featureSchema = await json("../../contracts/schema/plugin-feature-v0.1.schema.json");

  assert.equal(packageSchema.$schema, "https://json-schema.org/draft/2020-12/schema");
  assert.equal(featureSchema.$schema, "https://json-schema.org/draft/2020-12/schema");
  assert.equal(packageSchema.properties.contractVersion.const, "0.1.0");
  assert.equal(featureSchema.properties.contractVersion.const, "0.1.0");
  assert.equal(packageSchema.properties.features.items.$ref, "./plugin-feature-v0.1.schema.json");
  assert.equal(packageSchema.additionalProperties, false);
  assert.equal(featureSchema.additionalProperties, false);
});

test("minimal standalone plugin example passes canonical semantic validation", async () => {
  const manifest = await json("../../examples/plugin-manifest.minimal.json");
  const result = validatePluginManifestV010(manifest);
  assert.equal(result.ok, true, JSON.stringify(result.issues));
});

test("portable schema includes current runtime, integrity and Eidos contribution surface", async () => {
  const packageSchema = await json("../../contracts/schema/plugin-package-v0.1.schema.json");
  const featureSchema = await json("../../contracts/schema/plugin-feature-v0.1.schema.json");

  assert.deepEqual(
    packageSchema.properties.runtime.properties.kind.enum,
    ["DECLARATIVE", "WORKER", "PROCESS", "REMOTE"]
  );
  assert.equal(packageSchema.properties.integrity.properties.algorithm.const, "Ed25519");
  assert.equal(
    featureSchema.$defs.workbenchContribution.properties.kind.const,
    "eidos.workbench-activity"
  );
  assert.equal(
    featureSchema.$defs.providerContribution.properties.kind.const,
    "platform.service-provider"
  );
});
