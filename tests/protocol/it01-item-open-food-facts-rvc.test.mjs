import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  analyzeOpenFoodFactsItemRvcV010,
  validGtinChecksumV010
} from "../../tools/item-rvc-open-food-facts.mjs";

test("IT-01E validates GTIN check digits without making GTIN an Item identity rule", () => {
  assert.equal(validGtinChecksumV010("3017620422003"), true);
  assert.equal(validGtinChecksumV010("7622210449283"), true);
  assert.equal(validGtinChecksumV010("12345670"), true);
  assert.equal(validGtinChecksumV010("12345671"), false);
  assert.equal(validGtinChecksumV010("LOCAL-42"), false);
});

test("IT-01E Open Food Facts RVC separates external trade-item evidence from enterprise Item identity", async () => {
  const dir = mkdtempSync(join(tmpdir(), "it01e-off-rvc-"));
  const csvPath = join(dir, "sample.csv");
  writeFileSync(csvPath, [
    "code,product_name,quantity,brands,categories_tags,countries_tags",
    '3017620422003,Nutella,400 g,Ferrero,"en:spreads,en:chocolate-spreads",en:france',
    '7622210449283,Oreo Original,154 g,Mondelez,en:biscuits,en:france',
    'LOCAL-42,Local Store Item,1 L,Local Brand,en:drinks,en:japan',
    '3017620422003,Nutella duplicate,,Ferrero,en:spreads,en:france',
    '12345671,Invalid GTIN Shape,250 ml,Example,en:test,en:us'
  ].join("\n") + "\n", "utf8");

  const report = await analyzeOpenFoodFactsItemRvcV010({
    inputPath: csvPath,
    manifest: {
      contractVersion: "0.1.0",
      sourceId: "open-food-facts-product-database",
      sourceUrl: "https://huggingface.co/datasets/openfoodfacts/product-database",
      resolvedDataUrl: "https://example.invalid/food.parquet",
      retrievedAt: "2026-10-09T12:30:00.000Z",
      sourceVersion: "fixture-sha",
      license: "ODbL-1.0",
      attributionRequirements: "Open Food Facts",
      redistributionConstraints: "Derived test evidence only",
      adapterVersion: "it01e-off-rvc-v0.1",
      sampling: {
        method: "FIRST_N_NONEMPTY_CODE",
        limit: 5
      },
      importPressure: {
        limit: 3
      },
      fieldMap: {
        code: "code",
        productName: "product_name",
        quantity: "quantity",
        brands: "brands",
        categories: "categories_tags",
        countries: "countries_tags"
      }
    }
  });

  assert.equal(report.rawEvidence.totalRows, 5);
  assert.equal(report.rawEvidence.duplicateExternalCodes, 1);
  assert.equal(report.rawEvidence.nonNumericCodes, 1);
  assert.equal(report.rawEvidence.gtinShapeCandidates, 4);
  assert.equal(report.rawEvidence.validGtinChecksumCandidates, 3);
  assert.equal(report.rawEvidence.invalidGtinChecksumCandidates, 1);
  assert.ok(report.rawEvidence.quantityRowsWithRec20Mapping >= 3);

  assert.equal(report.importPressure.requestedRows, 3);
  assert.equal(report.importPressure.dryRunState, "DRY_RUN_READY");
  assert.equal(report.importPressure.commitState, "COMMITTED");
  assert.equal(report.importPressure.committedRows, 3);
  assert.equal(report.importPressure.itemResources, 3);
  assert.equal(report.importPressure.extensionValueSets, 3);

  assert.equal(
    report.semanticBoundary.sourceCodeIsEnterpriseItemIdentity,
    false
  );
  assert.equal(
    report.semanticBoundary.gtinIsUniversalItemPrimaryKey,
    false
  );
  assert.equal(
    report.semanticBoundary.packageQuantityDefinesEnterpriseBaseUom,
    false
  );
});
