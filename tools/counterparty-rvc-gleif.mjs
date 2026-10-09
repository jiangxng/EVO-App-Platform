import { createHash } from "node:crypto";
import { createReadStream, writeFileSync } from "node:fs";
import { createInterface } from "node:readline";
import { pathToFileURL } from "node:url";
import { performance } from "node:perf_hooks";

import {
  assertCounterpartySubjectV010
} from "../dist/apps/counterparty/repository.js";

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

export function assertCounterpartyRvcManifestV010(value) {
  if (!value || value.contractVersion !== "0.1.0") {
    throw new Error("COUNTERPARTY_RVC_MANIFEST_VERSION_INVALID");
  }
  const retrievedAt = requiredText(
    value.retrievedAt,
    "COUNTERPARTY_RVC_RETRIEVED_AT_REQUIRED"
  );
  if (!Number.isFinite(Date.parse(retrievedAt))) {
    throw new Error("COUNTERPARTY_RVC_RETRIEVED_AT_INVALID");
  }
  const fieldMap = value.fieldMap ?? {};
  return {
    contractVersion: "0.1.0",
    sourceId: requiredText(value.sourceId, "COUNTERPARTY_RVC_SOURCE_ID_REQUIRED"),
    sourceUrl: requiredText(value.sourceUrl, "COUNTERPARTY_RVC_SOURCE_URL_REQUIRED"),
    retrievedAt,
    sourceVersion: requiredText(
      value.sourceVersion,
      "COUNTERPARTY_RVC_SOURCE_VERSION_REQUIRED"
    ),
    license: requiredText(value.license, "COUNTERPARTY_RVC_LICENSE_REQUIRED"),
    attributionRequirements: requiredText(
      value.attributionRequirements,
      "COUNTERPARTY_RVC_ATTRIBUTION_REQUIRED"
    ),
    redistributionConstraints: requiredText(
      value.redistributionConstraints,
      "COUNTERPARTY_RVC_REDISTRIBUTION_REQUIRED"
    ),
    adapterVersion: requiredText(
      value.adapterVersion,
      "COUNTERPARTY_RVC_ADAPTER_VERSION_REQUIRED"
    ),
    sampling: {
      method: value.sampling?.method === "FIRST_N" ? "FIRST_N" : (() => {
        throw new Error("COUNTERPARTY_RVC_SAMPLING_METHOD_INVALID");
      })(),
      limit: integer(
        value.sampling?.limit,
        "COUNTERPARTY_RVC_SAMPLING_LIMIT_INVALID"
      )
    },
    fieldMap: {
      externalId: requiredText(
        fieldMap.externalId,
        "COUNTERPARTY_RVC_EXTERNAL_ID_FIELD_REQUIRED"
      ),
      legalName: requiredText(
        fieldMap.legalName,
        "COUNTERPARTY_RVC_LEGAL_NAME_FIELD_REQUIRED"
      ),
      ...(optionalText(fieldMap.countryOrRegion)
        ? { countryOrRegion: optionalText(fieldMap.countryOrRegion) }
        : {}),
      ...(optionalText(fieldMap.jurisdiction)
        ? { jurisdiction: optionalText(fieldMap.jurisdiction) }
        : {}),
      ...(optionalText(fieldMap.entityStatus)
        ? { entityStatus: optionalText(fieldMap.entityStatus) }
        : {}),
      ...(optionalText(fieldMap.registrationStatus)
        ? { registrationStatus: optionalText(fieldMap.registrationStatus) }
        : {})
    },
    ...(optionalText(value.contentDigest)
      ? { contentDigest: optionalText(value.contentDigest) }
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
  if (quoted) throw new Error("COUNTERPARTY_RVC_CSV_UNCLOSED_QUOTE");
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
        throw new Error("COUNTERPARTY_RVC_CSV_HEADER_REQUIRED");
      }
      if (new Set(headers).size !== headers.length) {
        throw new Error("COUNTERPARTY_RVC_CSV_HEADER_DUPLICATE");
      }
      continue;
    }
    if (cells.length > headers.length) {
      throw new Error("COUNTERPARTY_RVC_CSV_TOO_MANY_COLUMNS");
    }
    const row = {};
    headers.forEach((header, index) => {
      row[header] = cells[index] ?? "";
    });
    yield row;
    emitted += 1;
    if (emitted >= limit) break;
  }
  if (pending) throw new Error("COUNTERPARTY_RVC_CSV_UNCLOSED_QUOTE");
  if (!headers) throw new Error("COUNTERPARTY_RVC_CSV_EMPTY");
}

function normalizedName(value) {
  return value.trim().normalize("NFKC").toLocaleLowerCase();
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

function validationBand(count) {
  if (count >= 1_000_000) return "PERFORMANCE";
  if (count >= 100_000) return "INTEGRATION";
  if (count >= 10_000) return "DESIGN";
  return "CI_FIXTURE";
}

export async function analyzeCounterpartyRvcCsvV010(input) {
  const manifest = assertCounterpartyRvcManifestV010(input.manifest);
  const started = performance.now();
  const externalIds = new Set();
  const names = new Map();
  const statusCounts = new Map();
  const registrationStatusCounts = new Map();
  const jurisdictionCounts = new Map();
  let totalRows = 0;
  let validSubjects = 0;
  let invalidSubjects = 0;
  let duplicateExternalIds = 0;
  let duplicateNameCandidates = 0;
  let missingCountryOrRegion = 0;
  let nonLatinNames = 0;
  let longNames = 0;

  for await (const row of readCsvObjectsV010(
    input.inputPath,
    manifest.sampling.limit
  )) {
    totalRows += 1;
    const externalId = (row[manifest.fieldMap.externalId] ?? "").trim();
    const legalName = (row[manifest.fieldMap.legalName] ?? "").trim();
    const countryOrRegion = manifest.fieldMap.countryOrRegion
      ? (row[manifest.fieldMap.countryOrRegion] ?? "").trim()
      : "";
    const entityStatus = manifest.fieldMap.entityStatus
      ? (row[manifest.fieldMap.entityStatus] ?? "").trim()
      : "";
    const registrationStatus = manifest.fieldMap.registrationStatus
      ? (row[manifest.fieldMap.registrationStatus] ?? "").trim()
      : "";
    const jurisdiction = manifest.fieldMap.jurisdiction
      ? (row[manifest.fieldMap.jurisdiction] ?? "").trim()
      : "";

    if (externalIds.has(externalId) && externalId) duplicateExternalIds += 1;
    if (externalId) externalIds.add(externalId);

    const nameKey = legalName ? normalizedName(legalName) : "";
    if (nameKey && names.has(nameKey)) duplicateNameCandidates += 1;
    if (nameKey) names.set(nameKey, (names.get(nameKey) ?? 0) + 1);

    if (!countryOrRegion) missingCountryOrRegion += 1;
    if (legalName && /[^\u0000-\u024F]/u.test(legalName)) nonLatinNames += 1;
    if (legalName.length > 160) longNames += 1;
    increment(statusCounts, entityStatus);
    increment(registrationStatusCounts, registrationStatus);
    increment(jurisdictionCounts, jurisdiction);

    try {
      assertCounterpartySubjectV010({
        contractVersion: "0.1.0",
        counterpartyId: externalId,
        code: externalId,
        displayName: legalName,
        legalName,
        subjectType: "ORGANIZATION",
        status: entityStatus === "INACTIVE" ? "INACTIVE" : "ACTIVE",
        ...(countryOrRegion ? { countryOrRegion } : {})
      });
      validSubjects += 1;
    } catch {
      invalidSubjects += 1;
    }
  }

  const elapsedMs = performance.now() - started;
  const manifestDigest = createHash("sha256")
    .update(JSON.stringify(manifest))
    .digest("hex");

  return {
    contractVersion: "0.1.0",
    objectType: "counterparty.subject",
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
      validationBand: validationBand(totalRows),
      validSubjects,
      invalidSubjects,
      duplicateExternalIds,
      duplicateNameCandidates,
      missingCountryOrRegion,
      nonLatinNames,
      longNames,
      entityStatusCounts: sortedCounts(statusCounts),
      registrationStatusCounts: sortedCounts(registrationStatusCounts),
      jurisdictionCounts: sortedCounts(jurisdictionCounts)
    },
    performance: {
      elapsedMs: Math.round(elapsedMs * 100) / 100,
      rowsPerSecond: elapsedMs > 0
        ? Math.round((totalRows / elapsedMs) * 1000)
        : totalRows
    },
    interpretation: {
      sourceSchemaIsCanonicalEvoSchema: false,
      duplicateNamesAreIdentityMatches: false,
      sourceStatusDirectlyDefinesEvoLifecycle: false,
      note: "RVC evidence pressures the Counterparty contract; it does not become enterprise master data or schema authority."
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
      "Usage: node tools/counterparty-rvc-gleif.mjs --manifest <manifest.json> --input <golden-copy.csv> [--report <report.json>]"
    );
  }
  const { readFile } = await import("node:fs/promises");
  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  const report = await analyzeCounterpartyRvcCsvV010({ manifest, inputPath });
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
