import test from "node:test";
import assert from "node:assert/strict";

import {
  createMemoryEnterpriseResourceRepositoryV010
} from "../../dist/providers/enterprise-context/resources.js";
import {
  createDataImportRepositoryV010
} from "../../dist/apps/data-import/repository.js";
import {
  createDataImportServiceV010
} from "../../dist/apps/data-import/service.js";

function target() {
  return {
    contractVersion: "0.1.0",
    targetId: "fixture.subject",
    label: { default: "Fixtures" },
    objectType: "fixture.subject",
    ownerPackageId: "fixture-owner",
    describe() {
      return {
        contractVersion: "0.1.0",
        objectType: "fixture.subject",
        ownerPackageId: "fixture-owner",
        baseSchemaRef: "fixture/0.1.0",
        locale: "en",
        activeRelationshipRoles: [],
        fields: []
      };
    },
    validateRow() {
      return { ok: true, issues: [] };
    },
    commitRow() {
      return {
        objectType: "fixture.subject",
        objectId: "fixture-1"
      };
    }
  };
}

test("Data Import resolves targets from current lifecycle state instead of construction-time cache", () => {
  const resources = createMemoryEnterpriseResourceRepositoryV010();
  const repository = createDataImportRepositoryV010(resources);
  let active = true;
  const fixtureTarget = target();
  const service = createDataImportServiceV010({
    repository,
    resolveTargets() {
      return active ? [fixtureTarget] : [];
    }
  });

  service.stage({
    contextId: "enterprise-context:a",
    importJobId: "job-active",
    targetId: "fixture.subject",
    source: {
      kind: "ROWS",
      name: "fixture",
      headers: [],
      rows: []
    },
    mapping: [],
    actorSubjectId: "owner-a",
    recordedAt: "2026-10-09T12:01:00.000Z"
  });

  active = false;
  assert.throws(() => service.stage({
    contextId: "enterprise-context:a",
    importJobId: "job-inactive",
    targetId: "fixture.subject",
    source: {
      kind: "ROWS",
      name: "fixture",
      headers: [],
      rows: []
    },
    mapping: [],
    actorSubjectId: "owner-a",
    recordedAt: "2026-10-09T12:02:00.000Z"
  }), /DATA_IMPORT_TARGET_NOT_FOUND/);

  assert.throws(() => service.dryRun({
    contextId: "enterprise-context:a",
    importJobId: "job-active",
    actorSubjectId: "owner-a",
    recordedAt: "2026-10-09T12:03:00.000Z"
  }), /DATA_IMPORT_TARGET_NOT_FOUND/);
});
