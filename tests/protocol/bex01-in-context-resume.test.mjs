import test from "node:test";
import assert from "node:assert/strict";

import { createDataImportDirectoryPageV010 } from "../../dist/apps/data-import/page.js";
import {
  dataImportMappingRouteV010,
  dataImportReviewRouteV010
} from "../../dist/apps/data-import/constants.js";
import { createCounterpartyImportTargetV010 } from "../../dist/apps/counterparty/import-target.js";
import { createCounterpartyRepositoryV010 } from "../../dist/apps/counterparty/repository.js";
import { createCounterpartyRoleRepositoryV010 } from "../../dist/apps/counterparty/roles.js";
import { createObjectExtensionRepositoryV010 } from "../../dist/apps/object-extension/repository.js";
import { createObjectExtensionValueRepositoryV010 } from "../../dist/apps/object-extension/values.js";
import { createMemoryEnterpriseResourceRepositoryV010 } from "../../dist/providers/enterprise-context/resources.js";

function supplierTarget() {
  const resources = createMemoryEnterpriseResourceRepositoryV010();
  const counterparties = createCounterpartyRepositoryV010(resources);
  return createCounterpartyImportTargetV010({
    resources,
    repository: counterparties,
    roleRepository: createCounterpartyRoleRepositoryV010(resources, counterparties),
    extensionRepository: createObjectExtensionRepositoryV010(resources),
    extensionValueRepository: createObjectExtensionValueRepositoryV010(resources)
  });
}

function job(id, state, day, targetId="counterparty.subject") {
  return {
    contractVersion: "0.1.0",
    importJobId: id,
    targetId,
    state,
    targetParameters: { relationshipMode: "SUPPLIER" },
    source: {
      kind: "XLSX",
      name: id + ".xlsx",
      headers: ["供应商编码", "供应商名称", "主体类型"],
      rows: [{ 供应商编码: id, 供应商名称: "华昇科技", 主体类型: "ORGANIZATION" }]
    },
    mapping: [
      { sourceColumn: "供应商编码", targetFieldId: "code" },
      { sourceColumn: "供应商名称", targetFieldId: "displayName" },
      { sourceColumn: "主体类型", targetFieldId: "subjectType" }
    ],
    stagedAt: "2026-10-" + String(day).padStart(2, "0") + "T09:00:00.000Z",
    stagedBySubjectId: "owner-a"
  };
}

test("actual import directory brings an unfinished job into the primary action", () => {
  const target = supplierTarget();
  const jobs = [
    job("already-committed", "COMMITTED", 15),
    job("needs-mapping", "STAGED", 12),
    job("needs-validation", "DRY_RUN_READY", 14),
    job("needs-fixing", "DRY_RUN_FAILED", 13)
  ];
  const before = structuredClone(jobs);
  const page = createDataImportDirectoryPageV010({ targets: [target], jobs, locale: "zh-CN" });
  const resume = page.actions.find(x => x.id === "resume-import");

  assert.ok(resume);
  assert.equal(resume.primary, true);
  assert.match(resume.label, /继续导入.*needs-validation.xlsx/);
  assert.equal(resume.route, dataImportReviewRouteV010("needs-validation"));
  assert.equal(page.actions.filter(x => x.primary).length, 1);
  assert.equal(page.items[0].id, "job:needs-validation");
  assert.equal(page.items[0].category, "待完成");
  assert.match(page.collectionDescription, /之前保存的字段选择/);
  assert.deepEqual(jobs, before, "Rendering must neither mutate a job nor change its state");
});

test("mapping state resumes at the mapping page; failed dry-run resumes in review", () => {
  const target = supplierTarget();
  const staged = createDataImportDirectoryPageV010({
    targets: [target], jobs: [job("mapping", "STAGED", 12)], locale: "zh-CN"
  });
  assert.equal(staged.actions[0].route, dataImportMappingRouteV010("mapping"));
  assert.equal(staged.items[0].primaryAction.label, "继续核对字段");

  const failed = createDataImportDirectoryPageV010({
    targets: [target], jobs: [job("failed", "DRY_RUN_FAILED", 12)], locale: "zh-CN"
  });
  assert.equal(failed.actions[0].route, dataImportReviewRouteV010("failed"));
  assert.equal(failed.items[0].primaryAction.label, "处理导入问题");
  assert.equal(failed.actions[0].requiresConfirmation, false,
    "Resuming may only navigate, never commit");
  assert.equal(failed.actions[0].type, "navigate");
});

test("older unfinished work is not lost behind twenty completed jobs", () => {
  const jobs = Array.from({length: 25}, (_,i)=>
    job("completed-" + i, "COMMITTED", 15));
  jobs.push(job("unfinished-old", "STAGED", 2));
  const page = createDataImportDirectoryPageV010({
    targets: [supplierTarget()], jobs, locale: "zh-CN"
  });
  assert.equal(page.items.length, 20);
  assert.equal(page.items[0].id, "job:unfinished-old");
  assert.equal(page.actions[0].route, dataImportMappingRouteV010("unfinished-old"));
});

test("committed, partly committed, and unavailable target jobs never offer unsafe resume", () => {
  const target = supplierTarget();
  const page = createDataImportDirectoryPageV010({
    targets: [target],
    jobs: [
      job("partially-committed", "COMMITTED_WITH_ERRORS", 15),
      job("already-committed", "COMMITTED", 14),
      job("other-object-pending", "STAGED", 13, "another.object")
    ],
    locale: "zh-CN"
  });
  assert.equal(page.actions.some(x=>x.id==="resume-import"), false);
  assert.equal(page.actions.filter(x=>x.primary).length, 1);
  assert.equal(page.actions[0].id, "import:counterparty.subject");
  assert.match(page.description, /CSV \/ XLSX/);
});

test("English resume label is business-readable and requires no raw job ID", () => {
  const page = createDataImportDirectoryPageV010({
    targets: [supplierTarget()], jobs: [job("abc123", "STAGED", 12)], locale: "en-US"
  });
  assert.match(page.actions[0].label, /Continue import.*abc123.xlsx/);
  assert.equal(page.items[0].category, "To finish");
  assert.doesNotMatch(page.collectionDescription, /importJobId|STAGED|Schema/);
});
