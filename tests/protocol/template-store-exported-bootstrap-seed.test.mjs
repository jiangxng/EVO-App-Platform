import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import {
  assertTemplateTransferBundleV010
} from "../../dist/contracts/template-transfer.js";
import {
  ledgerRuntimeBaselineBundleV010,
  ledgerRuntimeBaselineBundleV2V010,
  templateStoreSeedRecordsV010
} from "../../dist/apps/template-store/seed-records.js";
import {
  createLedgerRuntimeConfiguratorService
} from "../../dist/apps/ledger-runtime-configurator/service.js";

const productionTemplate = JSON.parse(
  readFileSync(
    "apps/template-store/seeds/evo-ledger-runtime-production.template.json",
    "utf8"
  )
);
const referenceLibrary = JSON.parse(
  readFileSync(
    "apps/template-store/seeds/bookkeeping-legacy-posting-rules.reference.json",
    "utf8"
  )
);
const seed = JSON.parse(
  readFileSync(
    "apps/template-store/seeds/evo-ledger-runtime-baseline.v0.2.seed.json",
    "utf8"
  )
);

test("production Ledger Runtime template is exactly the Configurator export", () => {
  const service = createLedgerRuntimeConfiguratorService();
  const exported = service.exportTemplate();

  assert.deepEqual(productionTemplate, exported);
  assert.equal(productionTemplate.kind, "evo.ledger-runtime.template");
  assert.equal(productionTemplate.compatibility.burnReady, true);
  assert.deepEqual(productionTemplate.compatibility.blockers, []);

  assert.equal(productionTemplate.configuration.accounts.length, 141);
  assert.equal(productionTemplate.configuration.applications.length, 143);
  assert.equal(productionTemplate.configuration.dictionaries.length, 106);
  assert.equal(productionTemplate.configuration.postingRules.length, 912);
});

test("production Ledger Runtime template remains validation and burn ready", () => {
  const service = createLedgerRuntimeConfiguratorService();
  const imported = service.importTemplate(structuredClone(productionTemplate));

  assert.equal(imported.ok, true, JSON.stringify(imported.errors, null, 2));
  assert.equal(imported.burn.ready, true);
  assert.deepEqual(imported.burn.blockers, []);

  const compiled = service.compileCurrent();
  assert.equal(compiled.rules.length, 912);
  assert.equal(compiled.compiler.uniqueExpressionCount, 401);
  assert.equal(
    compiled.compiler.compiledExpressionCount,
    compiled.compiler.uniqueExpressionCount
  );
});

test("587 legacy posting rules remain a separate reference library", () => {
  assert.equal(
    referenceLibrary.kind,
    "evo.ledger-runtime.reference-rule-library"
  );
  assert.equal(referenceLibrary.status, "REFERENCE");
  assert.equal(referenceLibrary.ruleCount, 587);
  assert.equal(referenceLibrary.postingRules.length, 587);
});

test("Template Store bootstrap Seed wraps the production Ledger Runtime template", () => {
  assert.equal(seed.contractVersion, "0.1.0");
  assert.equal(seed.templateId, "evo.ledger-runtime.baseline.v0.1");
  assert.equal(seed.version, 2);

  const bundle = assertTemplateTransferBundleV010(seed.bundle);
  assert.equal(bundle.definition.kind, "LEDGER_RUNTIME_TEMPLATE");
  assert.deepEqual(bundle.definition.payload, productionTemplate);
  assert.match(bundle.contentDigest, /^sha256:[0-9a-f]{64}$/);

  assert.deepEqual(bundle, ledgerRuntimeBaselineBundleV2V010);
});

test("Template Store v3 adds Projection Gallery without mutating the runtime payload", () => {
  const v3 = templateStoreSeedRecordsV010.find(record => record.version === 3);
  assert.ok(v3);
  assert.deepEqual(v3.bundle.definition.payload, productionTemplate);
  assert.equal(
    v3.bundle.definition.projectionGallery.primaryProjectionId,
    "projection:main"
  );
  assert.equal(v3.bundle.definition.projectionGallery.projections.length, 1);
  assert.equal(
    v3.bundle.definition.projectionGallery.projections[0].view.kind,
    "DIAGRAM_2D"
  );
  assert.deepEqual(v3.bundle, ledgerRuntimeBaselineBundleV010);
  assert.match(v3.bundle.contentDigest, /^sha256:[0-9a-f]{64}$/);
});
