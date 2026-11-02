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

test("HX-01: the existing primary action names model preparation for proposed columns", () => {
  const page = createDataImportMappingPageV010({
    job, schema, locale: "zh-CN", canCreateExtension: true
  });
  assert.equal(page.actions.find(x => x.id === "review").label,
    "保存选择并准备目标字段");
  assert.equal(page.reviewTable.utilityNavigation, undefined);
  assert.equal(validateUidl(page).ok, true);
  assert.match(renderToHtml(page), /保存选择并准备目标字段/);
  assert.equal(page.reviewTask.metrics.find(x => x.id === "attention").value, "0",
    "model preparation must not inflate V3 validation issues");
  assert.deepEqual(job.mapping, [{ sourceColumn: "往来编码", targetFieldId: "code" }]);
  assert.equal(job.source.rows[0]["客户等级"], "重点");
});

test("HX-01: no management permission or unrelated object keeps the original primary action", () => {
  for (const override of [
    { canCreateExtension: false },
    { canCreateExtension: true, job: { ...job, targetId: "item.master" } }
  ]) {
    const page = createDataImportMappingPageV010({
      job: override.job ?? job, schema, locale: "en",
      canCreateExtension: override.canCreateExtension
    });
    assert.notEqual(page.actions.find(x => x.id === "review").label,
      "Save choices and prepare target fields");
    assert.equal(validateUidl(page).ok, true);
  }
});
