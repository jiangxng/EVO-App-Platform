import { createHash } from "node:crypto";
import {
  createReadStream,
  readFileSync,
  writeFileSync
} from "node:fs";
import { performance } from "node:perf_hooks";
import { createInterface } from "node:readline";
import { pathToFileURL } from "node:url";

import {
  createMemoryEnterpriseResourceRepositoryV010
} from "../dist/providers/enterprise-context/resources.js";
import {
  createItemRepositoryV010
} from "../dist/apps/item/repository.js";
import {
  createObjectExtensionRepositoryV010
} from "../dist/apps/object-extension/repository.js";
import {
  createObjectExtensionValueRepositoryV010,
  OBJECT_EXTENSION_VALUE_COLLECTION_V010,
  OBJECT_EXTENSION_VALUE_RESOURCE_TYPE_V010
} from "../dist/apps/object-extension/values.js";
import {
  createDataImportRepositoryV010
} from "../dist/apps/data-import/repository.js";
import {
  createDataImportServiceV010
} from "../dist/apps/data-import/service.js";
import {
  createItemImportTargetV010
} from "../dist/apps/item/import-target.js";
import {
  ITEM_RESOURCE_TYPE_V010,
  ITEM_TRADE_PROFILE_SLOT_V010
} from "../dist/apps/item/foundation-object.js";

function requiredText(value, code) {
  if (typeof value !== "string" || !value.trim()) throw new Error(code);
  return value.trim();
}

function optionalText(value) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function positiveInteger(value, code) {
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
  const fieldMap = value.fieldMap ?? {};
  return {
    contractVersion: "0.1.0",
    sourceId: requiredText(value.sourceId, "ITEM_RVC_SOURCE_ID_REQUIRED"),
    sourceUrl: requiredText(value.sourceUrl, "ITEM_RVC_SOURCE_URL_REQUIRED"),
    resolvedDataUrl: requiredText(
      value.resolvedDataUrl,
      "ITEM_RVC_RESOLVED_DATA_URL_REQUIRED"
    ),
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
      method: value.sampling?.method === "FIRST_N_NONEMPTY_CODE"
        ? "FIRST_N_NONEMPTY_CODE"
        : (() => { throw new Error("ITEM_RVC_SAMPLING_METHOD_INVALID"); })(),
      limit: positiveInteger(
        value.sampling?.limit,
        "ITEM_RVC_SAMPLING_LIMIT_INVALID"
      )
    },
    importPressure: {
      limit: positiveInteger(
        value.importPressure?.limit,
        "ITEM_RVC_IMPORT_LIMIT_INVALID"
      )
    },
    fieldMap: {
      code: requiredText(fieldMap.code, "ITEM_RVC_CODE_FIELD_REQUIRED"),
      productName: requiredText(
        fieldMap.productName,
        "ITEM_RVC_PRODUCT_NAME_FIELD_REQUIRED"
      ),
      ...(optionalText(fieldMap.quantity)
        ? { quantity: optionalText(fieldMap.quantity) }
        : {}),
      ...(optionalText(fieldMap.brands)
        ? { brands: optionalText(fieldMap.brands) }
        : {}),
      ...(optionalText(fieldMap.categories)
        ? { categories: optionalText(fieldMap.categories) }
        : {}),
      ...(optionalText(fieldMap.countries)
        ? { countries: optionalText(fieldMap.countries) }
        : {})
    },
    ...(optionalText(value.sampleContentDigest)
      ? { sampleContentDigest: optionalText(value.sampleContentDigest) }
      : {})
  };
}

function csvRecordComplete(value) {
  let quoted = false;
  for (let i = 0; i < value.length; i += 1) {
    if (value[i] !== '"') continue;
    if (quoted && value[i + 1] === '"') {
      i += 1;
      continue;
    }
    quoted = !quoted;
  }
  return !quoted;
}

export function parseCsvRecordV010(value) {
  const cells = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < value.length; i += 1) {
    const ch = value[i];
    if (quoted) {
      if (ch === '"') {
        if (value[i + 1] === '"') {
          cell += '"';
          i += 1;
        } else {
          quoted = false;
        }
      } else {
        cell += ch;
      }
    } else if (ch === '"') {
      quoted = true;
    } else if (ch === ",") {
      cells.push(cell);
      cell = "";
    } else {
      cell += ch;
    }
  }
  if (quoted) throw new Error("ITEM_RVC_CSV_UNCLOSED_QUOTE");
  cells.push(cell);
  return cells;
}

export async function* readCsvObjectsV010(inputPath, limit) {
  const lines = createInterface({
    input: createReadStream(inputPath, { encoding: "utf8" }),
    crlfDelay: Infinity
  });
  let pending = "";
  let headers;
  let emitted = 0;
  for await (const line of lines) {
    pending = pending ? pending + "\n" + line : line;
    if (!csvRecordComplete(pending)) continue;
    const cells = parseCsvRecordV010(pending);
    pending = "";
    if (!headers) {
      headers = cells.map((item, index) =>
        (index === 0 ? item.replace(/^\uFEFF/u, "") : item).trim()
      );
      if (headers.some(item => !item)) {
        throw new Error("ITEM_RVC_CSV_HEADER_REQUIRED");
      }
      if (new Set(headers).size !== headers.length) {
        throw new Error("ITEM_RVC_CSV_HEADER_DUPLICATE");
      }
      continue;
    }
    if (cells.length > headers.length) {
      throw new Error("ITEM_RVC_CSV_TOO_MANY_COLUMNS");
    }
    const row = {};
    headers.forEach((header, index) => {
      row[header] = cells[index] ?? "";
    });
    yield row;
    emitted += 1;
    if (emitted >= limit) break;
  }
  if (pending) throw new Error("ITEM_RVC_CSV_UNCLOSED_QUOTE");
  if (!headers) throw new Error("ITEM_RVC_CSV_EMPTY");
}

export function validGtinChecksumV010(value) {
  const code = String(value ?? "").trim();
  if (!/^\d+$/u.test(code) || ![8, 12, 13, 14].includes(code.length)) {
    return false;
  }
  const digits = [...code].map(Number);
  const check = digits.pop();
  let sum = 0;
  let weight = 3;
  for (let index = digits.length - 1; index >= 0; index -= 1) {
    sum += digits[index] * weight;
    weight = weight === 3 ? 1 : 3;
  }
  return (10 - (sum % 10)) % 10 === check;
}

function normalizedName(value) {
  return value.trim().normalize("NFKC").toLocaleLowerCase();
}

function increment(map, key) {
  const normalized = key || "(missing)";
  map.set(normalized, (map.get(normalized) ?? 0) + 1);
}

function sortedCounts(map, limit = 30) {
  return [...map.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([value, count]) => ({ value, count }));
}

function quantityUnit(value) {
  const text = String(value ?? "").normalize("NFKC").trim().toLocaleLowerCase();
  if (!text) return undefined;
  const regex = /(\d+(?:[.,]\d+)?)\s*(fl\s*oz|kg|mg|g|ml|cl|dl|l|oz|lb|pcs?|pieces?|units?)\b/giu;
  let match;
  let unit;
  while ((match = regex.exec(text))) unit = match[2].replaceAll(" ", "");
  if (!unit) return undefined;
  if (unit === "piece" || unit === "pieces" || unit === "pc" || unit === "pcs"
      || unit === "unit" || unit === "units") return "count";
  return unit;
}

const REC20_COMMON_MAPPING = Object.freeze({
  g: "GRM",
  kg: "KGM",
  ml: "MLT",
  l: "LTR",
  count: "C62"
});

function codeShape(code) {
  if (!code) return "missing";
  if (!/^\d+$/u.test(code)) return "non-numeric";
  return "numeric-" + code.length;
}

function deterministicRvcItemCode(sourceCode) {
  return "RVC-" + createHash("sha256")
    .update(sourceCode)
    .digest("hex")
    .slice(0, 20)
    .toUpperCase();
}

function extensionDefinition(fieldId, semanticType, order) {
  return {
    contractVersion: "0.1.0",
    extensionId: "it01e.off." + fieldId,
    targetObjectType: ITEM_RESOURCE_TYPE_V010,
    targetSlot: ITEM_TRADE_PROFILE_SLOT_V010,
    namespace: "rvc.open-food-facts",
    fieldId,
    semanticType,
    valueType: "STRING",
    label: { default: fieldId },
    required: false,
    order,
    applicability: {
      qualifiers: {
        "item.kind": ["GOODS"]
      }
    },
    surfaces: ["DETAIL"],
    searchable: false,
    importable: true,
    exportable: true,
    agentReadable: true,
    agentWritable: false
  };
}

function exerciseGenericItemImport(input) {
  const resources = createMemoryEnterpriseResourceRepositoryV010();
  const items = createItemRepositoryV010(resources);
  const extensions = createObjectExtensionRepositoryV010(resources);
  const extensionValues = createObjectExtensionValueRepositoryV010(resources);
  const jobs = createDataImportRepositoryV010(resources);
  const contextId = "enterprise-context:it01e-off-rvc";
  const actorSubjectId = "it01e-rvc";
  const recordedAt = input.recordedAt;

  for (const [index, definition] of [
    extensionDefinition(
      "rvcExternalTradeItemCode",
      "external-trade-item-identifier-evidence",
      10
    ),
    extensionDefinition(
      "rvcPackageQuantityText",
      "package-quantity-source-text",
      20
    ),
    extensionDefinition(
      "rvcSourceBrands",
      "external-brand-evidence",
      30
    ),
    extensionDefinition(
      "rvcSourceCategories",
      "external-category-evidence",
      40
    )
  ].entries()) {
    extensions.save({
      contextId,
      definition,
      actorSubjectId,
      recordedAt: new Date(
        Date.parse(recordedAt) + index * 1000
      ).toISOString()
    });
  }

  const target = createItemImportTargetV010({
    resources,
    repository: items,
    extensionRepository: extensions,
    extensionValueRepository: extensionValues
  });
  const service = createDataImportServiceV010({
    repository: jobs,
    targets: [target]
  });
  const headers = [
    "enterpriseCode",
    "displayName",
    "itemKind",
    "baseUomCode",
    "rvcExternalTradeItemCode",
    "rvcPackageQuantityText",
    "rvcSourceBrands",
    "rvcSourceCategories"
  ];
  const sourceRows = input.rows.map(row => ({
    enterpriseCode: deterministicRvcItemCode(row.sourceCode),
    displayName: row.productName,
    itemKind: "GOODS",
    baseUomCode: "C62",
    rvcExternalTradeItemCode: row.sourceCode,
    rvcPackageQuantityText: row.quantity,
    rvcSourceBrands: row.brands,
    rvcSourceCategories: row.categories
  }));
  const mapping = [
    ["enterpriseCode", "code"],
    ["displayName", "displayName"],
    ["itemKind", "itemKind"],
    ["baseUomCode", "baseUomCode"],
    ["rvcExternalTradeItemCode", "rvcExternalTradeItemCode"],
    ["rvcPackageQuantityText", "rvcPackageQuantityText"],
    ["rvcSourceBrands", "rvcSourceBrands"],
    ["rvcSourceCategories", "rvcSourceCategories"]
  ].map(([sourceColumn, targetFieldId]) => ({
    sourceColumn,
    targetFieldId
  }));
  const importJobId =
    "it01e-off-" + input.sourceVersion.replace(/[^a-z0-9]/giu, "").slice(0, 16);

  service.stage({
    contextId,
    importJobId,
    targetId: "item.subject",
    source: {
      kind: "ROWS",
      name: "Open Food Facts RVC adapter sample",
      headers,
      rows: sourceRows
    },
    mapping,
    actorSubjectId,
    recordedAt
  });
  const dryRun = service.dryRun({
    contextId,
    importJobId,
    actorSubjectId,
    recordedAt
  });
  if (dryRun.state !== "DRY_RUN_READY") {
    return {
      requestedRows: sourceRows.length,
      dryRunState: dryRun.state,
      validRows: dryRun.dryRun?.validRows ?? 0,
      invalidRows: dryRun.dryRun?.invalidRows ?? sourceRows.length,
      commitState: "NOT_ATTEMPTED",
      committedRows: 0,
      itemResources: 0,
      extensionValueSets: 0
    };
  }
  const committed = service.commit({
    contextId,
    importJobId,
    actorSubjectId,
    recordedAt
  });
  const itemResources = items.list(contextId).length;
  const extensionValueSets = resources.list({
    contextId,
    namespace: "evo.object-extension",
    collectionId: OBJECT_EXTENSION_VALUE_COLLECTION_V010,
    resourceType: OBJECT_EXTENSION_VALUE_RESOURCE_TYPE_V010,
    lifecycleState: "ACTIVE"
  }).length;
  return {
    requestedRows: sourceRows.length,
    dryRunState: dryRun.state,
    validRows: dryRun.dryRun?.validRows ?? 0,
    invalidRows: dryRun.dryRun?.invalidRows ?? 0,
    commitState: committed.state,
    committedRows: committed.receipt?.succeededRows ?? 0,
    failedCommitRows: committed.receipt?.failedRows ?? sourceRows.length,
    itemResources,
    extensionValueSets,
    adapterRules: {
      enterpriseItemCode:
        "RVC-only deterministic surrogate derived from source code; not a production identity rule.",
      itemKind: "GOODS",
      baseUomCode:
        "C62 (one) as an explicit RVC adapter assumption: one external trade-item record is treated as one operational unit for pipeline pressure only.",
      externalTradeItemCode:
        "Preserved in Item trade-profile extension evidence; never promoted to itemId."
    }
  };
}

export async function analyzeOpenFoodFactsItemRvcV010(input) {
  const manifest = assertItemRvcManifestV010(input.manifest);
  const started = performance.now();
  const codes = new Set();
  const names = new Map();
  const codeShapeCounts = new Map();
  const quantityUnitCounts = new Map();
  const rec20CodeCounts = new Map();
  const importRows = [];
  const importCodes = new Set();

  let totalRows = 0;
  let duplicateExternalCodes = 0;
  let duplicateNameCandidates = 0;
  let missingProductName = 0;
  let missingQuantity = 0;
  let missingBrands = 0;
  let missingCategories = 0;
  let missingCountries = 0;
  let numericCodes = 0;
  let gtinShapeCandidates = 0;
  let validGtinChecksumCandidates = 0;
  let invalidGtinChecksumCandidates = 0;
  let nonNumericCodes = 0;
  let offAssigned200PrefixCandidates = 0;
  let quantityRowsWithParsedUnit = 0;
  let quantityRowsWithRec20Mapping = 0;

  for await (const row of readCsvObjectsV010(
    input.inputPath,
    manifest.sampling.limit
  )) {
    totalRows += 1;
    const sourceCode = String(row[manifest.fieldMap.code] ?? "").trim();
    const productName = String(
      row[manifest.fieldMap.productName] ?? ""
    ).trim();
    const quantity = manifest.fieldMap.quantity
      ? String(row[manifest.fieldMap.quantity] ?? "").trim()
      : "";
    const brands = manifest.fieldMap.brands
      ? String(row[manifest.fieldMap.brands] ?? "").trim()
      : "";
    const categories = manifest.fieldMap.categories
      ? String(row[manifest.fieldMap.categories] ?? "").trim()
      : "";
    const countries = manifest.fieldMap.countries
      ? String(row[manifest.fieldMap.countries] ?? "").trim()
      : "";

    if (codes.has(sourceCode) && sourceCode) duplicateExternalCodes += 1;
    if (sourceCode) codes.add(sourceCode);

    const nameKey = productName ? normalizedName(productName) : "";
    if (nameKey && names.has(nameKey)) duplicateNameCandidates += 1;
    if (nameKey) names.set(nameKey, (names.get(nameKey) ?? 0) + 1);

    if (!productName) missingProductName += 1;
    if (!quantity) missingQuantity += 1;
    if (!brands) missingBrands += 1;
    if (!categories) missingCategories += 1;
    if (!countries) missingCountries += 1;

    const shape = codeShape(sourceCode);
    increment(codeShapeCounts, shape);
    if (/^\d+$/u.test(sourceCode)) {
      numericCodes += 1;
      if ([8, 12, 13, 14].includes(sourceCode.length)) {
        gtinShapeCandidates += 1;
        if (validGtinChecksumV010(sourceCode)) {
          validGtinChecksumCandidates += 1;
        } else {
          invalidGtinChecksumCandidates += 1;
        }
      }
      if (sourceCode.startsWith("200")) {
        offAssigned200PrefixCandidates += 1;
      }
    } else if (sourceCode) {
      nonNumericCodes += 1;
    }

    const unit = quantityUnit(quantity);
    if (unit) {
      quantityRowsWithParsedUnit += 1;
      increment(quantityUnitCounts, unit);
      const rec20 = REC20_COMMON_MAPPING[unit];
      if (rec20) {
        quantityRowsWithRec20Mapping += 1;
        increment(rec20CodeCounts, rec20);
      }
    }

    if (
      importRows.length < manifest.importPressure.limit
      && sourceCode
      && productName
      && !importCodes.has(sourceCode)
    ) {
      importCodes.add(sourceCode);
      importRows.push({
        sourceCode,
        productName,
        quantity,
        brands,
        categories
      });
    }
  }

  const importStarted = performance.now();
  const importPressure = exerciseGenericItemImport({
    rows: importRows,
    recordedAt: manifest.retrievedAt,
    sourceVersion: manifest.sourceVersion
  });
  const importElapsedMs = performance.now() - importStarted;
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
      resolvedDataUrl: manifest.resolvedDataUrl,
      retrievedAt: manifest.retrievedAt,
      sourceVersion: manifest.sourceVersion,
      license: manifest.license,
      attributionRequirements: manifest.attributionRequirements,
      redistributionConstraints: manifest.redistributionConstraints,
      adapterVersion: manifest.adapterVersion,
      manifestDigest,
      ...(manifest.sampleContentDigest
        ? { sampleContentDigest: manifest.sampleContentDigest }
        : {})
    },
    sampling: manifest.sampling,
    rawEvidence: {
      totalRows,
      distinctExternalCodes: codes.size,
      duplicateExternalCodes,
      duplicateNameCandidates,
      missingProductName,
      missingQuantity,
      missingBrands,
      missingCategories,
      missingCountries,
      numericCodes,
      nonNumericCodes,
      gtinShapeCandidates,
      validGtinChecksumCandidates,
      invalidGtinChecksumCandidates,
      offAssigned200PrefixCandidates,
      codeShapeCounts: sortedCounts(codeShapeCounts),
      quantityRowsWithParsedUnit,
      quantityRowsWithRec20Mapping,
      quantityUnitCounts: sortedCounts(quantityUnitCounts),
      rec20CodeCounts: sortedCounts(rec20CodeCounts)
    },
    importPressure: {
      ...importPressure,
      elapsedMs: Math.round(importElapsedMs * 100) / 100,
      rowsPerSecond: importElapsedMs > 0
        ? Math.round((importPressure.committedRows / importElapsedMs) * 1000)
        : importPressure.committedRows
    },
    performance: {
      elapsedMs: Math.round(elapsedMs * 100) / 100,
      rawRowsPerSecond: elapsedMs > 0
        ? Math.round((totalRows / elapsedMs) * 1000)
        : totalRows
    },
    semanticBoundary: {
      sourceSchemaIsCanonicalEvoSchema: false,
      sourceCodeIsEnterpriseItemIdentity: false,
      sourceCodeMayBeGtin: true,
      allSourceCodesAreGtins: false,
      gtinIsUniversalItemPrimaryKey: false,
      packageQuantityDefinesEnterpriseBaseUom: false,
      sourceCategoryIsCoreItemIdentity: false,
      sourceBrandIsCoreItemIdentity: false,
      recommendedExternalIdentifierModel:
        "scheme + value identifier evidence attached to a trade profile or related identifier resource, separate from itemId/item code",
      recommendedCategoryModel:
        "governed classification/taxonomy relation; not a scalar core identity field",
      recommendedProductVariantSkuModel:
        "defer universal Product/SKU/variant core fields; model only when enterprise semantics prove grouping, sellable/stock unit or variant relationships",
      recommendedUomModel:
        "baseUomCode remains enterprise operational UOM and should reference governed Rec20-compatible codes; external package quantity is separate measure evidence"
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
      "Usage: node tools/item-rvc-open-food-facts.mjs --manifest <manifest.json> --input <sample.csv> [--report <report.json>]"
    );
  }
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  const report = await analyzeOpenFoodFactsItemRvcV010({
    manifest,
    inputPath
  });
  const output = JSON.stringify(report, null, 2) + "\n";
  if (reportPath) writeFileSync(reportPath, output, "utf8");
  else process.stdout.write(output);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(error => {
    console.error(error instanceof Error ? error.stack ?? error.message : String(error));
    process.exitCode = 1;
  });
}
