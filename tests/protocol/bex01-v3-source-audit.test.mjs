import test from "node:test";
import assert from "node:assert/strict";
import { createDataImportReviewPageV010 } from "../../dist/apps/data-import/page.js";
import { dataImportMappingRouteV010 } from "../../dist/apps/data-import/constants.js";

const headers = [
  "往来编码", "往来名称", "主体类型", "开户银行",
  ...Array.from({ length: 17 }, (_, i) => "企业属性" + (i + 1)),
  "原系统备注"
];

function fixture(state = "DRY_RUN_FAILED") {
  const rows = Array.from({ length: 40 }, (_, i) => Object.fromEntries(
    headers.map(header => [header,
      header === "主体类型" && i >= 34 && i <= 36 ? ""
        : header === "主体类型" ? "ORGANIZATION"
          : header === "开户银行" ? "上海分行"
            : header === "往来编码" ? "SUP-" + (i + 1)
              : header + "-" + (i + 1)])
  ));
  return {
    contractVersion: "0.1.0",
    importJobId: "source-audit-host-job",
    targetId: "counterparty.subject",
    targetParameters: { relationshipMode: "SUPPLIER" },
    state,
    source: { kind: "XLSX", name: "供应商.xlsx", headers, rows },
    mapping: [
      { sourceColumn: "往来编码", targetFieldId: "code" },
      { sourceColumn: "往来名称", targetFieldId: "displayName" },
      { sourceColumn: "主体类型", targetFieldId: "subjectType" },
      { sourceColumn: "开户银行", targetFieldId: "bank.receiving" }
    ],
    ignoredSourceColumns: ["原系统备注"],
    mappingOrigin: "RECIPE",
    appliedRecipeId: "confirmed-recipe",
    stagedAt: "2026-10-15T00:00:00.000Z",
    stagedBySubjectId: "authorized-owner",
    dryRun: {
      schemaDigest: "source-audit-schema",
      totalRows: rows.length,
      validRows: 37,
      invalidRows: 3,
      rows: rows.map((_, i) => ({
        rowNumber: i + 1,
        ok: i < 34 || i > 36,
        issues: i >= 34 && i <= 36
          ? [{
              code: "DATA_IMPORT_REQUIRED_VALUE_MISSING",
              fieldId: "subjectType",
              message: "Missing required subject type"
            }]
          : []
      }))
    }
  };
}

const schema = {
  contractVersion: "0.1.0",
  fields: [
    { fieldId: "subjectType", resolvedLabel: "主体类型",
      readable: true, writable: true, surfaces: ["IMPORT"],
      label: { default: "主体类型" } },
    { fieldId: "bank.receiving", resolvedLabel: "开户银行",
      resolvedDescription: "用于接收客户付款", readable: true, writable: true,
      surfaces: ["IMPORT"], label: { default: "开户银行" } },
    { fieldId: "bank.settlement", resolvedLabel: "开户银行",
      resolvedDescription: "用于对供应商付款", readable: true, writable: true,
      surfaces: ["IMPORT"], label: { default: "开户银行" } }
  ]
};

test("real Host review model audits every Excel source column and leaves source untouched", () => {
  const job = fixture();
  const untouched = structuredClone(job);
  const page = createDataImportReviewPageV010({ job, schema, locale: "zh-CN" });
  const sources = page.items.filter(item => item.id.startsWith("source:"));

  assert.equal(sources.length, 22);
  assert.deepEqual(sources.map(item => item.title), headers);
  assert.equal(page.items[2].id, "row:35",
    "An error near the end must precede successful rows and full source audit");
  assert.deepEqual(page.items.slice(2, 5).map(item => item.id),
    ["row:35", "row:36", "row:37"]);
  assert.match(page.items[2].metadata["原始行核对"], /主体类型：（空）/);
  assert.doesNotMatch(page.items[2].metadata["原始行核对"], /ORGANIZATION/);
  assert.equal(sources[2].metadata["目标字段标识"], "subjectType");
  assert.match(sources[3].metadata["原始样本"], /上海分行/);
  assert.equal(sources[21].status.label, "已忽略，可撤销");
  assert.equal(sources[21].primaryAction.route,
    dataImportMappingRouteV010(job.importJobId));
  assert.equal(sources[15].status.label, "尚未映射");
  assert.equal(page.actions.some(action => action.command === "data-import.commit"), false);
  assert.deepEqual(job, untouched, "Rendering never changes the original rows or Recipe");
});

test("same-name bank candidates expose distinct field IDs and business purpose", () => {
  const page = createDataImportReviewPageV010({
    job: fixture(), schema, locale: "zh-CN"
  });
  const bank = page.items.find(item => item.id === "source:3");
  assert.equal(bank.status.label, "同名字段需核对");
  const comparison = bank.metadata["同名目标候选（按用途区分）"];
  assert.match(comparison, /bank.receiving/);
  assert.match(comparison, /用于接收客户付款/);
  assert.match(comparison, /bank.settlement/);
  assert.match(comparison, /用于对供应商付款/);
  assert.equal(bank.metadata["目标字段标识"], "bank.receiving",
    "A saved mapping is shown, not silently changed to its same-name alternative");
  assert.match(JSON.stringify(page), /同名字段需核对/);
  assert.match(JSON.stringify(page), /供应商.xlsx/);
  // Live Eidos HTML rendering is independently exercised by Chromium.
});

test("committed imports offer no remapping action from source audit", () => {
  const job = fixture("COMMITTED");
  const page = createDataImportReviewPageV010({ job, schema, locale: "en-US" });
  const sources = page.items.filter(item => item.id.startsWith("source:"));
  assert.equal(sources.length, headers.length);
  assert.ok(sources.every(item => !item.primaryAction));
  assert.equal(page.actions.some(action => action.command === "data-import.commit"), false);
  assert.equal(page.items[2].metadata["Original row values"], "主体类型：(blank)");
});
