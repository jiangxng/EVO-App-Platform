import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("EVO Runtime Observatory Provider has no private EOG application or manager dependency", async () => {
  const source = await readFile(
    "providers/evo-runtime-observatory/runtime.ts",
    "utf8"
  );
  assert.equal(source.includes("../../apps/eog-"), false);
  assert.equal(source.includes("../../manager/"), false);
});

test("Bottleneck provider does not import private EOG application implementation", async () => {
  const source = await readFile(
    "providers/eog-bottleneck-analysis/runtime.ts",
    "utf8"
  );
  assert.equal(source.includes("../../apps/eog-"), false);
});

test("the existing SOP dependency is explicitly preserved debt, not a new target boundary", async () => {
  const source = await readFile(
    "providers/eog-bottleneck-analysis/runtime.ts",
    "utf8"
  );
  const audit = JSON.parse(await readFile(
    "docs/architecture/eog-provider-boundary-audit.v0.1.json",
    "utf8"
  ));
  assert.equal(
    source.includes("../../manager/enterprise-operating-graph-sop-service.js"),
    true
  );
  assert.equal(
    audit.providers.eogBottleneckAnalysis.sopBranchStatus,
    "FROZEN_DEFERRED"
  );
  assert.equal(audit.sop.productDevelopment, "DEFERRED");
});
