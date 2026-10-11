import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { analyzeOpenFoodFactsItemRvcV010 } from "../../tools/item-rvc-open-food-facts.mjs";

function manifest(limit = 100) {
  return {
    contractVersion: "0.1.0",
    sourceId: "open-food-facts",
    sourceUrl: "https://world.openfoodfacts.org/data/exports/products.csv.gz",
    resolvedDataUrl: "https://world.openfoodfacts.org/data/exports/products.csv.gz",
    retrievedAt: "2026-10-09T12:30:00.000Z",
    sourceVersion: "offline synthetic CSV fixture",
    license: "Open Database License (ODbL)",
    attributionRequirements: "Preserve OFF source and identity attribution.",
    redistributionConstraints: "Only synthetic fixtures are committed.",
    adapterVersion: "item-open-food-facts-csv-v0.1",
    sampling: { method: "FIRST_N_NONEMPTY_CODE", limit },
    importPressure: { limit: 100 },
    fieldMap: {
      code: "code",
      productName: "product_name",
      quantity: "quantity",
      brands: "brands",
      categories: "categories"
    }
  };
}

async function withCsv(lines, action) {
  const dir = mkdtempSync(join(tmpdir(), "evo-item-rvc-"));
  const path = join(dir, "synthetic.csv");
  try {
    writeFileSync(path, lines.join("\n") + "\n", "utf8");
    return await action(path);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

test("IT-01E synthetic OFF CSV keeps source barcode, trade quantity, and category separate from Item identity", async () => {
  const report = await withCsv([
    "code,product_name,quantity,brands,categories",
    "3017620422003,Hazelnut spread,400 g,Brand A,Spreads",
    "3017620422010,Hazelnut spread,250 g,Brand A,Spreads",
    "store-internal-42,Prepared service bundle,500 ml,Store Brand,Services"
  ], path => analyzeOpenFoodFactsItemRvcV010({
    manifest: manifest(),
    inputPath: path
  }));

  assert.equal(report.objectType, "item.subject");
  assert.equal(report.rawEvidence.totalRows, 3);
  assert.equal(report.rawEvidence.distinctExternalCodes, 3);
  assert.equal(report.rawEvidence.duplicateNameCandidates, 1);
  assert.equal(report.rawEvidence.numericCodes, 2);
  assert.equal(report.rawEvidence.nonNumericCodes, 1);
  assert.equal(report.rawEvidence.quantityRowsWithRec20Mapping, 3);
  assert.deepEqual(report.rawEvidence.rec20CodeCounts, [
    { value: "GRM", count: 2 },
    { value: "MLT", count: 1 }
  ]);
  assert.equal(report.semanticBoundary.sourceCodeIsEnterpriseItemIdentity, false);
  assert.equal(report.semanticBoundary.gtinIsUniversalItemPrimaryKey, false);
  assert.equal(report.semanticBoundary.packageQuantityDefinesEnterpriseBaseUom, false);
  assert.equal(report.semanticBoundary.sourceCategoryIsCoreItemIdentity, false);
  assert.equal(report.semanticBoundary.sourceBrandIsCoreItemIdentity, false);
});

test("IT-01E OFF CSV accounts for duplicated external codes and missing source descriptions without inventing Item identity", async () => {
  const report = await withCsv([
    "code,product_name,quantity,brands,categories",
    "12345678,Valid,1 g,Brand A,Snacks",
    "12345678,Duplicate,1 g,Brand A,Snacks",
    ",,1 g,,"
  ], path => analyzeOpenFoodFactsItemRvcV010({
    manifest: manifest(10),
    inputPath: path
  }));
  assert.equal(report.rawEvidence.totalRows, 3);
  assert.equal(report.rawEvidence.distinctExternalCodes, 1);
  assert.equal(report.rawEvidence.duplicateExternalCodes, 1);
  assert.equal(report.rawEvidence.missingProductName, 1);
  assert.equal(report.semanticBoundary.allSourceCodesAreGtins, false);
});
