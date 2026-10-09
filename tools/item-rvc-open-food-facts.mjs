import { createHash } from "node:crypto";
import { createReadStream, writeFileSync } from "node:fs";
import { createInterface } from "node:readline";
import { pathToFileURL } from "node:url";
import { performance } from "node:perf_hooks";

function requiredText(value, code) {
  if (typeof value !== "string" || !value.trim()) throw new Error(code);
  return value.trim();
}

function optionalText(value) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function integer(value, code) {
  if (!Number.isInteger(value) || value < 1) throw new Error(code);
  return value;
}

export function assertItemRvcManifestV010(value) {
  if (!value || value.contractVersion !== "0.1.0") {
    throw new Error("ITEM_RVC_MANIFEST_VERSION_INVALID");
  }
  const retrievedAt = requiredText(
    value.retrievedAt,
    "ITEM_RVC_RETRIEVED_AT_REQUIRED"
  );
  if (!Number.isFinite(Date.parse(retrievedAt))) {
    throw new Error("ITEM_RVC_RETRIEVED_AT_INVALID");
  }
  return {
    contractVersion: "0.1.0",
    sourceId: requiredText(value.sourceId, "ITEM_RVC_SOURCE_ID_REQUIRED"),
    sourceUrl: requiredText(value.sourceUrl, "ITEM_RVC_SOURCE_URL_REQUIRED"),
    retrievedAt,
    sourceVersion: requiredText(
      value.sourceVersion,
      "ITEM_RVC_SOURCE_VERSION_REQUIRED"
    ),
    license: requiredText(value.license, "ITEM_RVC_LICENSE_REQUIRED"),
    attributionRequirements: requiredText(
      value.attributionRequirements,
      "ITEM_RVC_ATTRIBUTION_REQUIRED"
    ),
    redistributionConstraints: requiredText(
      value.redistributionConstraints,
      "ITEM_RVC_REDISTRIBUTION_REQUIRED"
    ),
    adapterVersion: requiredText(
      value.adapterVersion,
      "ITEM_RVC_ADAPTER_VERSION_REQUIRED"
    ),
    sampling: {
      method: value.sampling?.method === "FIRST_N"
        ? "FIRST_N"
        : (() => { throw new Error("ITEM_RVC_SAMPLING_METHOD_INVALID"); })(),
      limit: integer(value.sampling?.limit, "ITEM_RVC_SAMPLING_LIMIT_INVALID")
    },
    ...(optionalText(value.contentDigest)
      ? { contentDigest: optionalText(value.contentDigest) }
      : {})
  };
}

function text(value) {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  return "";
}

function stringArray(value) {
  if (Array.isArray(value)) {
    return value
      .map(item => text(item))
      .filter(Boolean);
  }
  const scalar = text(value);
  if (!scalar) return [];
  return scalar.split(",").map(item => item.trim()).filter(Boolean);
}

function normalized(value) {
  return text(value).normalize("NFKC").toLocaleLowerCase();
}

function increment(map, key) {
  const normalizedKey = key || "(missing)";
  map.set(normalizedKey, (map.get(normalizedKey) ?? 0) + 1);
}

function sortedCounts(map, limit = 25) {
  return [...map.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([value, count]) => ({ value, count }));
}

function gtinShape(code) {
  if (!/^\d+$/u.test(code)) return undefined;
  if (![8, 12, 13, 14].includes(code.length)) return undefined;
  return "GTIN_" + code.length;
}

function rec20Candidate(sourceUnit) {
  const unit = normalized(sourceUnit).replaceAll(" ", "");
  const known = new Map([
    ["g", "GRM"],
    ["gram", "GRM"],
    ["grams", "GRM"],
    ["kg", "KGM"],
    ["kilogram", "KGM"],
    ["kilograms", "KGM"],
    ["ml", "MLT"],
    ["millilitre", "MLT"],
    ["milliliter", "MLT"],
    ["l", "LTR"],
    ["liter", "LTR"],
    ["litre", "LTR"],
    ["cl", "CLT"]
  ]);
  return known.get(unit);
}

function productName(row) {
  return text(row.product_name)
    || text(row.product_name_en)
    || text(row.generic_name)
    || text(row.generic_name_en);
}

function commercialGroupingKey(row) {
  const name = normalized(productName(row));
  const brand = normalized(
    text(row.brands)
    || stringArray(row.brands_tags)[0]
    || ""
  );
  if (!name) return "";
  return name + "|" + brand;
}

function classificationCardinality(row) {
  const categories = stringArray(row.categories_tags);
  const brands = stringArray(row.brands_tags).length > 0
    ? stringArray(row.brands_tags)
    : stringArray(row.brands);
  const packaging = stringArray(row.packaging_tags);
  return { categories, brands, packaging };
}

export async function analyzeOpenFoodFactsItemRvcV010(input) {
  const manifest = assertItemRvcManifestV010(input.manifest);
  const started = performance.now();
  const lines = createInterface({
    input: createReadStream(input.inputPath, { encoding: "utf8" }),
    crlfDelay: Infinity
  });

  const codes = new Set();
  const commercialGroups = new Map();
  const gtinShapeCounts = new Map();
  const sourceUnitCounts = new Map();
  const rec20CandidateCounts = new Map();
  const categoryCardinalityCounts = new Map();
  const brandCardinalityCounts = new Map();
  const packagingCardinalityCounts = new Map();

  let totalRows = 0;
  let validJsonRows = 0;
  let invalidJsonRows = 0;
  let rowsWithCode = 0;
  let duplicateCodes = 0;
  let gtinLikeCodes = 0;
  let nonGtinLikeCodes = 0;
  let missingDisplayName = 0;
  let rowsWithMultipleCategories = 0;
  let rowsWithMultipleBrands = 0;
  let rowsWithMultiplePackagingTags = 0;
  let rowsWithSourceQuantityUnit = 0;
  let rowsWithRec20Candidate = 0;
  let sameCommercialDescriptionDifferentCode = 0;
  let localizedNameFallbacks = 0;

  for await (const line of lines) {
    if (totalRows >= manifest.sampling.limit) break;
    if (!line.trim()) continue;
    totalRows += 1;

    let row;
    try {
      row = JSON.parse(line);
      validJsonRows += 1;
    } catch {
      invalidJsonRows += 1;
      continue;
    }

    const code = text(row.code || row._id || row.id);
    if (code) {
      rowsWithCode += 1;
      if (codes.has(code)) duplicateCodes += 1;
      codes.add(code);
      const shape = gtinShape(code);
      if (shape) {
        gtinLikeCodes += 1;
        increment(gtinShapeCounts, shape);
      } else {
        nonGtinLikeCodes += 1;
      }
    }

    const name = productName(row);
    if (!name) {
      missingDisplayName += 1;
    } else if (!text(row.product_name) && text(row.product_name_en)) {
      localizedNameFallbacks += 1;
    }

    const groupingKey = commercialGroupingKey(row);
    if (groupingKey && code) {
      const prior = commercialGroups.get(groupingKey);
      if (prior && !prior.has(code)) {
        sameCommercialDescriptionDifferentCode += 1;
      }
      const group = prior ?? new Set();
      group.add(code);
      commercialGroups.set(groupingKey, group);
    }

    const cardinality = classificationCardinality(row);
    increment(categoryCardinalityCounts, String(cardinality.categories.length));
    increment(brandCardinalityCounts, String(cardinality.brands.length));
    increment(packagingCardinalityCounts, String(cardinality.packaging.length));
    if (cardinality.categories.length > 1) rowsWithMultipleCategories += 1;
    if (cardinality.brands.length > 1) rowsWithMultipleBrands += 1;
    if (cardinality.packaging.length > 1) rowsWithMultiplePackagingTags += 1;

    const sourceUnit = text(
      row.product_quantity_unit
      || row.product_quantity_unit_en
      || row.serving_quantity_unit
    );
    if (sourceUnit) {
      rowsWithSourceQuantityUnit += 1;
      increment(sourceUnitCounts, sourceUnit);
      const candidate = rec20Candidate(sourceUnit);
      if (candidate) {
        rowsWithRec20Candidate += 1;
        increment(rec20CandidateCounts, candidate);
      }
    }
  }

  const elapsedMs = performance.now() - started;
  const manifestDigest = createHash("sha256")
    .update(JSON.stringify(manifest))
    .digest("hex");

  return {
    contractVersion: "0.1.0",
    objectType: "item.subject",
    source: {
      sourceId: manifest.sourceId,
      sourceUrl: manifest.sourceUrl,
      retrievedAt: manifest.retrievedAt,
      sourceVersion: manifest.sourceVersion,
      license: manifest.license,
      attributionRequirements: manifest.attributionRequirements,
      redistributionConstraints: manifest.redistributionConstraints,
      adapterVersion: manifest.adapterVersion,
      manifestDigest,
      ...(manifest.contentDigest ? { contentDigest: manifest.contentDigest } : {})
    },
    sampling: manifest.sampling,
    evidence: {
      totalRows,
      validJsonRows,
      invalidJsonRows,
      rowsWithCode,
      duplicateCodes,
      gtinLikeCodes,
      nonGtinLikeCodes,
      gtinShapeCounts: sortedCounts(gtinShapeCounts),
      missingDisplayName,
      localizedNameFallbacks,
      sameCommercialDescriptionDifferentCode,
      rowsWithMultipleCategories,
      rowsWithMultipleBrands,
      rowsWithMultiplePackagingTags,
      categoryCardinalityCounts: sortedCounts(categoryCardinalityCounts),
      brandCardinalityCounts: sortedCounts(brandCardinalityCounts),
      packagingCardinalityCounts: sortedCounts(packagingCardinalityCounts),
      rowsWithSourceQuantityUnit,
      rowsWithRec20Candidate,
      sourceUnitCounts: sortedCounts(sourceUnitCounts),
      rec20CandidateCounts: sortedCounts(rec20CandidateCounts)
    },
    performance: {
      elapsedMs: Math.round(elapsedMs * 100) / 100,
      rowsPerSecond: elapsedMs > 0
        ? Math.round((totalRows / elapsedMs) * 1000)
        : totalRows
    },
    interpretation: {
      sourceCodeIsEvoItemIdentity: false,
      sourceBarcodeOrGtinIsPrimaryItemIdentity: false,
      commercialDescriptionEqualityIsIdentityEquality: false,
      sourceQuantityUnitIsBaseUomAuthority: false,
      categoriesBrandsPackagingAreIdentity: false,
      separatelyTradedVariantRule:
        "If a variant is separately priced, ordered or invoiced, model it as a distinct Item/trade item identity rather than a decorative attribute on one Item.",
      externalIdentifierRule:
        "Store barcode/GTIN-like values as external identifiers with an explicit scheme and provenance; validate true GTIN semantics separately from source key shape.",
      productGroupingRule:
        "Product is an optional managed/grouping concept over one or more Items, not the durable Item identity itself.",
      skuRule:
        "SKU is enterprise-specific coding/stock semantics and may map to enterprise Item code under explicit policy; it is not a universal external identifier.",
      uomRule:
        "EVO baseUomCode should reference governed unit codes such as UN/CEFACT Recommendation 20. Open Food Facts quantity-unit text is source evidence, not authority."
    }
  };
}

function argument(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

async function main() {
  const manifestPath = argument("--manifest");
  const inputPath = argument("--input");
  const reportPath = argument("--report");
  if (!manifestPath || !inputPath) {
    throw new Error(
      "Usage: node tools/item-rvc-open-food-facts.mjs --manifest <manifest.json> --input <sample.jsonl> [--report <report.json>]"
    );
  }
  const { readFile } = await import("node:fs/promises");
  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  const report = await analyzeOpenFoodFactsItemRvcV010({ manifest, inputPath });
  const output = JSON.stringify(report, null, 2) + "\n";
  if (reportPath) writeFileSync(reportPath, output, "utf8");
  else process.stdout.write(output);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(error => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
