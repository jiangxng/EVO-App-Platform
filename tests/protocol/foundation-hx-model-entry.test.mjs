import test from "node:test";
import assert from "node:assert/strict";
import { createDataImportMappingPageV010 } from "../../dist/apps/data-import/page.js";
import { validateUidl } from "../../dist/vendor/eidos/src/runtime/validate.js";
import { renderToHtml } from "../../dist/vendor/eidos/src/renderers/html/index.js";

const job = {
  contractVersion: "0.1.0", importJobId: "hx01-review-1",
  targetId: "counterparty.subject", state: "STAGED", mappingOrigin: "HUMAN",
  source: { kind: "CSV", name: "counterparties.csv",
    headers: ["往来编码", "客户等级"],
    rows: [{ "往来编码": "CP-001", "客户等级": "重点" }] },
  mapping: [{ sourceColumn: "往来编码", targetFieldId: "code" }],
  stagedAt: "2026-10-30T00:00:00Z", stagedBySubjectId: "owner"
};
const schema = { fields: [{
  fieldId: "code", resolvedLabel: "往来编码", valueType: "STRING",
  required: true, readable: true, writable: true, surfaces: ["IMPORT"]
}] };

test("HX-01: governed model preparation is visible beside the exact proposed source column", () => {
  const page = createDataImportMappingPageV010({
    job, schema, locale: "zh-CN", canCreateExtension: true
  });
  const issue = page.reviewTask.issues.find(x => x.title === "客户等级");
  assert.ok(issue, "proposed extension needs an actionable review issue");
  assert.equal(issue.relatedRoutes[0].label, "准备并审核目标字段");
  assert.equal(issue.relatedRoutes[0].route,
    "/object-extensions/from-import?job=hx01-review-1&column=%E5%AE%A2%E6%88%B7%E7%AD%89%E7%BA%A7");
  assert.equal(validateUidl(page).ok, true);
  assert.match(renderToHtml(page), /准备并审核目标字段/);
  assert.deepEqual(job.mapping, [{ sourceColumn: "往来编码", targetFieldId: "code" }]);
  assert.equal(job.source.rows[0]["客户等级"], "重点");
});

test("HX-01: no management permission or unrelated object never exposes a prepare-model link", () => {
  for (const override of [
    { canCreateExtension: false },
    { canCreateExtension: true, job: { ...job, targetId: "item.master" } }
  ]) {
    const page = createDataImportMappingPageV010({
      job: override.job ?? job, schema, locale: "en",
      canCreateExtension: override.canCreateExtension
    });
    assert.ok(page.reviewTask.issues.every(x =>
      !x.relatedRoutes?.some(link => link.label.includes("Prepare and review"))));
    assert.equal(validateUidl(page).ok, true);
  }
});
