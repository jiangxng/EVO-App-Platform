import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  analyzeOpenFoodFactsItemRvcV010
} from "../../tools/item-rvc-open-food-facts.mjs";

function manifest(limit = 100) {
  return {
    contractVersion: "0.1.0",
    sourceId: "open-food-facts",
    sourceUrl:
      "https://world.openfoodfacts.org/data/exports/products.random-modulo-1000.jsonl.gz",
    retrievedAt: "2026-10-09T12:30:00.000Z",
    sourceVersion: "daily random-modulo-1000 sample",
    license: "Open Database License (ODbL)",
    attributionRequirements:
      "Attribute Open Food Facts and retain source identity in RVC evidence.",
    redistributionConstraints:
      "Raw sample remains external; repository retains only adapter/tests/derived evidence.",
    adapterVersion: "item-open-food-facts-jsonl-v0.1",
    sampling: {
      method: "FIRST_N",
      limit
    }
  };
}

test("IT-01E OFF RVC separates source barcode/trade data from EVO Item identity", async () => {
  const dir = mkdtempSync(join(tmpdir(), "evo-item-rvc-"));
  const path = join(dir, "sample.jsonl");
  const rows = [{
    code: "3017620422003",
    product_name: "Hazelnut spread",
    brands_tags: ["en:brand-a"],
    categories_tags: ["en:spreads", "en:hazelnut-spreads"],
    packaging_tags: ["en:jar"],
    product_quantity_unit: "g"
  }, {
    code: "3017620422010",
    product_name: "Hazelnut spread",
    brands_tags: ["en:brand-a"],
    categories_tags: ["en:spreads"],
    packaging_tags: ["en:jar", "en:glass"],
    product_quantity_unit: "g"
  }, {
    code: "store-internal-42",
    product_name_en: "Prepared service bundle",
    brands: "Store Brand",
    categories_tags: [],
    product_quantity_unit: "ml"
  }];
  writeFileSync(path, rows.map(row => JSON.stringify(row)).join("\n") + "\n");

  const report = await analyzeOpenFoodFactsItemRvcV010({
    manifest: manifest(),
    inputPath: path
  });

  assert.equal(report.evidence.totalRows, 3);
  assert.equal(report.evidence.gtinLikeCodes, 2);
  assert.equal(report.evidence.nonGtinLikeCodes, 1);
  assert.equal(report.evidence.sameCommercialDescriptionDifferentCode, 1);
  assert.equal(report.evidence.rowsWithMultipleCategories, 1);
  assert.equal(report.evidence.rowsWithMultiplePackagingTags, 1);
  assert.equal(report.evidence.rowsWithRec20Candidate, 3);
  assert.deepEqual(report.evidence.rec20CandidateCounts, [
    { value: "GRM", count: 2 },
    { value: "MLT", count: 1 }
  ]);
  assert.equal(report.interpretation.sourceCodeIsEvoItemIdentity, false);
  assert.equal(
    report.interpretation.sourceQuantityUnitIsBaseUomAuthority,
    false
  );
  assert.equal(
    report.interpretation.categoriesBrandsPackagingAreIdentity,
    false
  );
});

test("IT-01E OFF RVC retains malformed-source evidence without treating source schema as authority", async () => {
  const dir = mkdtempSync(join(tmpdir(), "evo-item-rvc-invalid-"));
  const path = join(dir, "sample.jsonl");
  writeFileSync(path, [
    JSON.stringify({ code: "12345678", product_name: "Valid" }),
    "{malformed",
    JSON.stringify({ code: "", product_name: "" })
  ].join("\n") + "\n");

  const report = await analyzeOpenFoodFactsItemRvcV010({
    manifest: manifest(10),
    inputPath: path
  });
  assert.equal(report.evidence.totalRows, 3);
  assert.equal(report.evidence.validJsonRows, 2);
  assert.equal(report.evidence.invalidJsonRows, 1);
  assert.equal(report.evidence.missingDisplayName, 1);
  assert.equal(report.evidence.rowsWithCode, 1);
});
