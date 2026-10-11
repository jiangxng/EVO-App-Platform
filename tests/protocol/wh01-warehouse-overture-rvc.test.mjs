import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  analyzeOvertureWarehouseRvcV010
} from "../../tools/warehouse-rvc-overture.mjs";

test("WH-01D real facility evidence does not become Warehouse identity or WMS hierarchy authority", async () => {
  const dir = mkdtempSync(join(tmpdir(), "wh01d-overture-rvc-"));
  const inputPath = join(dir, "warehouse-buildings.jsonl");
  writeFileSync(inputPath, [
    {
      id: "148f35b1-7bc1-4180-9280-10d39b13883b",
      name: "",
      subtype: "",
      height: 12,
      num_floors: 1,
      has_parts: false,
      is_underground: false,
      source_dataset: "OpenStreetMap",
      source_provider: "",
      source_record_id: "w519166507@1",
      rvc_region: "fixture-a"
    },
    {
      id: "19412d64-51ac-3d6a-ac2f-8a8c8b91bb60",
      name: "North Distribution Center",
      subtype: "",
      height: 18,
      num_floors: 2,
      has_parts: true,
      is_underground: false,
      source_dataset: "OpenStreetMap",
      source_provider: "",
      source_record_id: "w223076787@2",
      rvc_region: "fixture-a"
    },
    {
      id: "2b61d7ee-9c17-4aaa-8e1e-1f4d2e311511",
      name: "North Distribution Center",
      subtype: "",
      height: null,
      num_floors: null,
      has_parts: false,
      is_underground: false,
      source_dataset: "Microsoft ML Buildings",
      source_provider: "Microsoft",
      source_record_id: "msft-1",
      rvc_region: "fixture-b"
    },
    {
      id: "3b61d7ee-9c17-4aaa-8e1e-1f4d2e311512",
      name: "",
      subtype: "",
      height: null,
      num_floors: null,
      has_parts: false,
      is_underground: false,
      source_dataset: "OpenStreetMap",
      source_provider: "",
      source_record_id: "w42@1",
      rvc_region: "fixture-b"
    },
    {
      id: "4b61d7ee-9c17-4aaa-8e1e-1f4d2e311513",
      name: "Underground storage building",
      subtype: "",
      height: 6,
      num_floors: 1,
      has_parts: false,
      is_underground: true,
      source_dataset: "OpenStreetMap",
      source_provider: "",
      source_record_id: "w43@1",
      rvc_region: "fixture-c"
    }
  ].map(row => JSON.stringify(row)).join("\n") + "\n", "utf8");

  const report = await analyzeOvertureWarehouseRvcV010({
    inputPath,
    manifest: {
      contractVersion: "0.1.0",
      sourceId: "overture-buildings",
      sourceUrl: "https://overturemaps.org/",
      dataPath:
        "s3://overturemaps-us-west-2/release/2026-09-23.1/theme=buildings/type=building/*",
      retrievedAt: "2026-10-09T15:05:00.000Z",
      sourceVersion: "2026-09-23.1",
      schemaVersion: "v2.0.0",
      license: "ODbL-1.0",
      attributionRequirements: "Overture Maps Foundation and source attribution",
      redistributionConstraints: "Derived evidence only",
      adapterVersion: "wh01d-overture-rvc-v0.1",
      sampleLimit: 5,
      sampleRows: 5,
      boundingBoxes: [{
        name: "fixture-a",
        xmin: -1,
        ymin: -1,
        xmax: 1,
        ymax: 1
      }],
      sampleContentDigest: "sha256:fixture"
    }
  });

  assert.equal(report.sample.totalRows, 5);
  assert.equal(report.evidence.distinctExternalIds, 5);
  assert.equal(report.evidence.duplicateExternalIds, 0);
  assert.equal(report.evidence.uuidLikeExternalIds, 5);
  assert.equal(report.evidence.missingName, 2);
  assert.equal(report.evidence.duplicateNameCandidates, 1);
  assert.equal(report.evidence.heightPresent, 3);
  assert.equal(report.evidence.floorCountPresent, 3);
  assert.equal(report.evidence.hasPartsTrue, 1);
  assert.equal(report.evidence.undergroundTrue, 1);

  assert.equal(
    report.semanticBoundary.externalBuildingFeatureIsEnterpriseWarehouseIdentity,
    false
  );
  assert.equal(report.semanticBoundary.gersIdIsWarehouseId, false);
  assert.equal(
    report.semanticBoundary.buildingPartIsWarehouseOperationalLocation,
    false
  );
  assert.equal(
    report.semanticBoundary.physicalBuildingHierarchyDefinesZoneLocationBin,
    false
  );
  assert.equal(
    report.semanticBoundary.externalGeometryDefinesInventoryPosition,
    false
  );
  assert.match(
    report.semanticBoundary.warehouseInventoryBoundary,
    /what Item is there and how much/
  );
});
