import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";

import {
  analyzeCounterpartyRvcCsvV010,
  assertCounterpartyRvcManifestV010,
  parseCsvRecordV010
} from "../../tools/counterparty-rvc-gleif.mjs";

function manifest(limit = 100_000) {
  return {
    contractVersion: "0.1.0",
    sourceId: "gleif-golden-copy-level1",
    sourceUrl: "https://goldencopy.gleif.org/api/v2/golden-copies/publishes/lei2/latest.csv",
    retrievedAt: "2026-10-08T18:00:00.000Z",
    sourceVersion: "2026-10-08-1600 / LEI-CDF 3.1",
    license: "CC0-1.0",
    attributionRequirements: "None required by CC0; retain GLEIF provenance in EVO RVC evidence.",
    redistributionConstraints: "None from CC0; original large dataset remains external to Git by EVO RVC policy.",
    adapterVersion: "gleif-golden-copy-csv-v0.1",
    sampling: {
      method: "FIRST_N",
      limit
    },
    fieldMap: {
      externalId: "LEI",
      legalName: "Entity.LegalName",
      countryOrRegion: "Entity.LegalAddress.Country",
      jurisdiction: "Entity.LegalJurisdiction",
      entityStatus: "Entity.EntityStatus",
      registrationStatus: "Registration.RegistrationStatus"
    }
  };
}

test("CP-07 RVC manifest requires provenance, licensing and bounded sampling", () => {
  const accepted = assertCounterpartyRvcManifestV010(manifest());
  assert.equal(accepted.sourceId, "gleif-golden-copy-level1");
  assert.equal(accepted.sampling.limit, 100_000);
  assert.throws(
    () => assertCounterpartyRvcManifestV010({ ...manifest(), retrievedAt: "" }),
    /COUNTERPARTY_RVC_RETRIEVED_AT_REQUIRED/
  );
  assert.throws(
    () => assertCounterpartyRvcManifestV010({
      ...manifest(),
      sampling: { method: "RANDOM", limit: 100_000 }
    }),
    /COUNTERPARTY_RVC_SAMPLING_METHOD_INVALID/
  );
});

test("CP-07 RVC CSV parser preserves quoted commas and embedded line breaks", () => {
  assert.deepEqual(
    parseCsvRecordV010('A,"B, C","Line 1\nLine 2","A ""quoted"" value"'),
    ["A", "B, C", "Line 1\nLine 2", 'A "quoted" value']
  );
});

test("CP-07 GLEIF RVC adapter produces auditable Counterparty identity evidence without treating source schema as EVO authority", async () => {
  const dir = await mkdtemp(join(tmpdir(), "evo-cp07-rvc-"));
  const inputPath = join(dir, "gleif-sample.csv");
  await writeFile(inputPath, [
    "LEI,Entity.LegalName,Entity.LegalAddress.Country,Entity.LegalJurisdiction,Entity.EntityStatus,Registration.RegistrationStatus",
    "LEI-001,Alpha Holdings,GB,GB,ACTIVE,ISSUED",
    'LEI-002,"Beta, Ltd",JP,JP,ACTIVE,ISSUED',
    'LEI-003,"株式会社ガンマ",JP,JP,ACTIVE,ISSUED',
    'LEI-004,"Delta\nInternational",,US-DE,INACTIVE,LAPSED',
    "LEI-004,Delta Duplicate,US,US-DE,ACTIVE,ISSUED",
    ",Missing Identifier,FR,FR,ACTIVE,ISSUED"
  ].join("\n"), "utf8");

  const report = await analyzeCounterpartyRvcCsvV010({
    manifest: manifest(100),
    inputPath
  });

  assert.equal(report.evidence.totalRows, 6);
  assert.equal(report.evidence.validationBand, "CI_FIXTURE");
  assert.equal(report.evidence.validSubjects, 5);
  assert.equal(report.evidence.invalidSubjects, 1);
  assert.equal(report.evidence.duplicateExternalIds, 1);
  assert.equal(report.evidence.nonLatinNames, 1);
  assert.equal(report.evidence.missingCountryOrRegion, 1);
  assert.equal(report.interpretation.sourceSchemaIsCanonicalEvoSchema, false);
  assert.equal(report.interpretation.duplicateNamesAreIdentityMatches, false);
  assert.equal(report.interpretation.sourceStatusDirectlyDefinesEvoLifecycle, false);
  assert.ok(report.performance.rowsPerSecond > 0);
});
