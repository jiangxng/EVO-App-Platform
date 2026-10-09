import {
  createReadStream,
  readFileSync,
  writeFileSync
} from "node:fs";
import { createHash } from "node:crypto";
import { createInterface } from "node:readline";
import { performance } from "node:perf_hooks";
import { pathToFileURL } from "node:url";

function requiredText(value, code) {
  if (typeof value !== "string" || !value.trim()) throw new Error(code);
  return value.trim();
}

function positiveInteger(value, code) {
  if (!Number.isInteger(value) || value < 1) throw new Error(code);
  return value;
}

export function assertWarehouseRvcManifestV010(value) {
  if (!value || value.contractVersion !== "0.1.0") {
    throw new Error("WAREHOUSE_RVC_MANIFEST_VERSION_INVALID");
  }
  const retrievedAt = requiredText(
    value.retrievedAt,
    "WAREHOUSE_RVC_RETRIEVED_AT_REQUIRED"
  );
  if (!Number.isFinite(Date.parse(retrievedAt))) {
    throw new Error("WAREHOUSE_RVC_RETRIEVED_AT_INVALID");
  }
  if (!Array.isArray(value.boundingBoxes) || value.boundingBoxes.length === 0) {
    throw new Error("WAREHOUSE_RVC_BOUNDING_BOX_REQUIRED");
  }
  return {
    contractVersion: "0.1.0",
    sourceId: requiredText(value.sourceId, "WAREHOUSE_RVC_SOURCE_ID_REQUIRED"),
    sourceUrl: requiredText(
      value.sourceUrl,
      "WAREHOUSE_RVC_SOURCE_URL_REQUIRED"
    ),
    dataPath: requiredText(value.dataPath, "WAREHOUSE_RVC_DATA_PATH_REQUIRED"),
    retrievedAt,
    sourceVersion: requiredText(
      value.sourceVersion,
      "WAREHOUSE_RVC_SOURCE_VERSION_REQUIRED"
    ),
    schemaVersion: requiredText(
      value.schemaVersion,
      "WAREHOUSE_RVC_SCHEMA_VERSION_REQUIRED"
    ),
    license: requiredText(value.license, "WAREHOUSE_RVC_LICENSE_REQUIRED"),
    attributionRequirements: requiredText(
      value.attributionRequirements,
      "WAREHOUSE_RVC_ATTRIBUTION_REQUIRED"
    ),
    redistributionConstraints: requiredText(
      value.redistributionConstraints,
      "WAREHOUSE_RVC_REDISTRIBUTION_REQUIRED"
    ),
    adapterVersion: requiredText(
      value.adapterVersion,
      "WAREHOUSE_RVC_ADAPTER_VERSION_REQUIRED"
    ),
    sampleLimit: positiveInteger(
      value.sampleLimit,
      "WAREHOUSE_RVC_SAMPLE_LIMIT_INVALID"
    ),
    sampleRows: positiveInteger(
      value.sampleRows,
      "WAREHOUSE_RVC_SAMPLE_ROWS_INVALID"
    ),
    boundingBoxes: value.boundingBoxes.map(box => ({
      name: requiredText(box.name, "WAREHOUSE_RVC_BBOX_NAME_REQUIRED"),
      xmin: Number(box.xmin),
      ymin: Number(box.ymin),
      xmax: Number(box.xmax),
      ymax: Number(box.ymax)
    })),
    sampleContentDigest: requiredText(
      value.sampleContentDigest,
      "WAREHOUSE_RVC_SAMPLE_DIGEST_REQUIRED"
    )
  };
}

function increment(map, key) {
  const normalized = key || "(missing)";
  map.set(normalized, (map.get(normalized) ?? 0) + 1);
}

function sortedCounts(map, limit = 25) {
  return [...map.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([value, count]) => ({ value, count }));
}

function normalizedName(value) {
  return value.trim().normalize("NFKC").toLocaleLowerCase();
}

function uuidLike(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu
    .test(value);
}

export async function* readWarehouseRvcJsonlV010(path, limit) {
  const lines = createInterface({
    input: createReadStream(path, { encoding: "utf8" }),
    crlfDelay: Infinity
  });
  let emitted = 0;
  for await (const line of lines) {
    if (!line.trim()) continue;
    const row = JSON.parse(line);
    if (!row || typeof row !== "object" || Array.isArray(row)) {
      throw new Error("WAREHOUSE_RVC_ROW_INVALID");
    }
    yield row;
    emitted += 1;
    if (emitted >= limit) break;
  }
}

export async function analyzeOvertureWarehouseRvcV010(input) {
  const manifest = assertWarehouseRvcManifestV010(input.manifest);
  const started = performance.now();

  let totalRows = 0;
  let duplicateExternalIds = 0;
  let uuidLikeExternalIds = 0;
  let missingName = 0;
  let duplicateNameCandidates = 0;
  let heightPresent = 0;
  let floorCountPresent = 0;
  let hasPartsTrue = 0;
  let undergroundTrue = 0;
  let namedRowsWithSourceRecord = 0;

  const ids = new Set();
  const names = new Map();
  const sourceDatasets = new Map();
  const sourceProviders = new Map();
  const sourceRecordPrefixes = new Map();
  const subtypeCounts = new Map();
  const heightBands = new Map();
  const floorBands = new Map();
  const bboxRegions = new Map();

  for await (const row of readWarehouseRvcJsonlV010(
    input.inputPath,
    manifest.sampleLimit
  )) {
    totalRows += 1;
    const id = String(row.id ?? "").trim();
    const name = String(row.name ?? "").trim();
    const sourceDataset = String(row.source_dataset ?? "").trim();
    const sourceProvider = String(row.source_provider ?? "").trim();
    const sourceRecordId = String(row.source_record_id ?? "").trim();
    const subtype = String(row.subtype ?? "").trim();

    if (ids.has(id) && id) duplicateExternalIds += 1;
    if (id) ids.add(id);
    if (uuidLike(id)) uuidLikeExternalIds += 1;

    if (!name) {
      missingName += 1;
    } else {
      const key = normalizedName(name);
      if (names.has(key)) duplicateNameCandidates += 1;
      names.set(key, (names.get(key) ?? 0) + 1);
      if (sourceRecordId) namedRowsWithSourceRecord += 1;
    }

    increment(sourceDatasets, sourceDataset);
    increment(sourceProviders, sourceProvider);
    increment(
      sourceRecordPrefixes,
      sourceRecordId ? sourceRecordId.slice(0, 1) : ""
    );
    increment(subtypeCounts, subtype);

    const height = Number(row.height);
    if (Number.isFinite(height) && height > 0) {
      heightPresent += 1;
      increment(
        heightBands,
        height < 5 ? "<5m"
          : height < 10 ? "5-10m"
            : height < 20 ? "10-20m"
              : height < 40 ? "20-40m"
                : ">=40m"
      );
    }

    const floors = Number(row.num_floors);
    if (Number.isInteger(floors) && floors > 0) {
      floorCountPresent += 1;
      increment(
        floorBands,
        floors === 1 ? "1"
          : floors === 2 ? "2"
            : floors <= 5 ? "3-5"
              : ">=6"
      );
    }

    if (row.has_parts === true) hasPartsTrue += 1;
    if (row.is_underground === true) undergroundTrue += 1;
    increment(bboxRegions, String(row.rvc_region ?? "").trim());
  }

  if (totalRows !== manifest.sampleRows) {
    throw new Error(
      "WAREHOUSE_RVC_SAMPLE_ROW_COUNT_MISMATCH:"
      + totalRows
      + ":"
      + manifest.sampleRows
    );
  }

  const elapsedMs = performance.now() - started;
  return {
    contractVersion: "0.1.0",
    objectType: "warehouse.subject",
    source: {
      sourceId: manifest.sourceId,
      sourceUrl: manifest.sourceUrl,
      dataPath: manifest.dataPath,
      retrievedAt: manifest.retrievedAt,
      sourceVersion: manifest.sourceVersion,
      schemaVersion: manifest.schemaVersion,
      license: manifest.license,
      attributionRequirements: manifest.attributionRequirements,
      redistributionConstraints: manifest.redistributionConstraints,
      adapterVersion: manifest.adapterVersion,
      sampleContentDigest: manifest.sampleContentDigest,
      manifestDigest: createHash("sha256")
        .update(JSON.stringify(manifest))
        .digest("hex")
    },
    sample: {
      requestedLimit: manifest.sampleLimit,
      totalRows,
      boundingBoxes: manifest.boundingBoxes
    },
    evidence: {
      distinctExternalIds: ids.size,
      duplicateExternalIds,
      uuidLikeExternalIds,
      missingName,
      duplicateNameCandidates,
      heightPresent,
      floorCountPresent,
      hasPartsTrue,
      undergroundTrue,
      namedRowsWithSourceRecord,
      sourceDatasets: sortedCounts(sourceDatasets),
      sourceProviders: sortedCounts(sourceProviders),
      sourceRecordPrefixes: sortedCounts(sourceRecordPrefixes),
      subtypeCounts: sortedCounts(subtypeCounts),
      heightBands: sortedCounts(heightBands),
      floorBands: sortedCounts(floorBands),
      sampleRegions: sortedCounts(bboxRegions)
    },
    semanticBoundary: {
      externalBuildingFeatureIsEnterpriseWarehouseIdentity: false,
      gersIdIsWarehouseId: false,
      buildingNameIsRequiredWarehouseDisplayName: false,
      buildingPartIsWarehouseOperationalLocation: false,
      physicalBuildingHierarchyDefinesZoneLocationBin: false,
      externalGeometryDefinesInventoryPosition: false,
      externalFacilityEvidenceMayAttachToWarehouse: true,
      recommendedFacilityRelation:
        "Preserve external facility/building identifiers, geometry and structural attributes as provenance-bearing facility evidence related to an enterprise Warehouse; do not replace warehouseId/code/displayName.",
      recommendedLocationHierarchy:
        "Zone/Location/Bin remains enterprise operational structure. Building/building-part geometry may inform spatial views but is not WMS hierarchy authority.",
      recommendedExternalIdentifierModel:
        "scheme + value + source/provenance (for example Overture GERS or GS1 GLN) separate from warehouseId",
      warehouseInventoryBoundary:
        "Warehouse and Warehouse Location answer where. Inventory Position separately answers what Item is there and how much."
    },
    performance: {
      elapsedMs: Math.round(elapsedMs * 100) / 100,
      rowsPerSecond: elapsedMs > 0
        ? Math.round((totalRows / elapsedMs) * 1000)
        : totalRows
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
      "Usage: node tools/warehouse-rvc-overture.mjs --manifest <manifest.json> --input <sample.jsonl> [--report <report.json>]"
    );
  }
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  const report = await analyzeOvertureWarehouseRvcV010({
    manifest,
    inputPath
  });
  const output = JSON.stringify(report, null, 2) + "\n";
  if (reportPath) writeFileSync(reportPath, output, "utf8");
  else process.stdout.write(output);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(error => {
    console.error(
      error instanceof Error ? error.stack ?? error.message : String(error)
    );
    process.exitCode = 1;
  });
}
