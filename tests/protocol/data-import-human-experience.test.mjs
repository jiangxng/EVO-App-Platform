import test from "node:test";
import assert from "node:assert/strict";

import {
  parseXlsxSourceV010
} from "../../dist/apps/data-import/xlsx.js";
import {
  suggestDataImportMappingV010
} from "../../dist/apps/data-import/service.js";
import {
  createDataImportDirectoryPageV010,
  createDataImportMappingPageV010,
  createDataImportReviewPageV010,
  createDataImportUploadPageV010
} from "../../dist/apps/data-import/page.js";
import {
  counterpartyFoundationObjectDescriptorV010,
  createCounterpartyEffectiveObjectSchemaV010
} from "../../dist/apps/counterparty/foundation-object.js";
import {
  createCounterpartyImportTargetV010
} from "../../dist/apps/counterparty/import-target.js";
import {
  createMemoryEnterpriseResourceRepositoryV010
} from "../../dist/providers/enterprise-context/resources.js";
import {
  createCounterpartyRepositoryV010
} from "../../dist/apps/counterparty/repository.js";
import {
  createCounterpartyRoleRepositoryV010
} from "../../dist/apps/counterparty/roles.js";
import {
  createObjectExtensionRepositoryV010
} from "../../dist/apps/object-extension/repository.js";
import {
  createObjectExtensionValueRepositoryV010
} from "../../dist/apps/object-extension/values.js";
import {
  renderToHtml
} from "../../dist/vendor/eidos/src/renderers/html/index.js";
import {
  validateValues
} from "../../dist/vendor/eidos/src/runtime/values.js";

const XLSX_BASE64 =
  "UEsDBBQAAAAIAM4wR11k+29epgAAANkAAAAPAAAAeGwvd29ya2Jvb2sueG1sNY7NCoMwEIRfJey9RnsoRdReSsFz2wdI46pBsyvZ9O/tG6GeZoZhmK86ffysXhjEMdVQZDkoJMudo6GG++2yO4KSaKgzMxPW8EWBU1O9OUwP5kmlOUkZahhjXEqtxY7ojWS8IKWu5+BNTDEMmvveWTyzfXqkqPd5ftABZxPTtYxuEWgqGRGj/FWR8enyuvoiYazadokSVChdMqHtCtBNpbeZ3riaH1BLAwQUAAAACADOMEddWv2Ca7EAAAAoAQAAGgAAAHhsL19yZWxzL3dvcmtib29rLnhtbC5yZWxzjc/JCsJADAbgVxlyt2k9iEinXkToVeoDDNN0oZ2Fybj07R08iAUPnkLyky+kPD7NLO4UeHRWQpHlIMhq1462l3Btzps9CI7Ktmp2liQsxHCsygvNKqYVHkbPIhmWJQwx+gMi64GM4sx5sinpXDAqpjb06JWeVE+4zfMdhm8D1qaoWwmhbgsQzeLpH9t13ajp5PTNkI0/TuDDhYkHophQFXqKEj4jxncpsqQCViWuPqxeUEsDBBQAAAAIAM4wR10ht7IB4wAAAM8BAAAYAAAAeGwvd29ya3NoZWV0cy9zaGVldDEueG1ss7GvyM1RKEstKs7Mz7NVMtQzUFJIzUvOT8nMS7dVCg1x07VQUiguScxLSczJz0u1VapMLVayt7Mpzy/KLs5ITS2xswFTLokliXZcNkX55QpFQGOU7GySQQxHQyWFElulzLyczLzU4JIioHhmsZ1Nid3TfQ3P5i59vmfa8wWNNvpAU/RB4vrJUH1O+PU9ndD7fPkGLPqccel7smP3k72Tn2/c/XReN6o+faCbES43grvcCIdJzgYGhthcjEv98ymbnrauedq/A5tzcWnyD3J39POMcgzx9PfD6lx9RKjb6CMiAwBQSwECFAMUAAAACADOMEddZPtvXqYAAADZAAAADwAAAAAAAAAAAAAAgAEAAAAAeGwvd29ya2Jvb2sueG1sUEsBAhQDFAAAAAgAzjBHXVr9gmuxAAAAKAEAABoAAAAAAAAAAAAAAIAB0wAAAHhsL19yZWxzL3dvcmtib29rLnhtbC5yZWxzUEsBAhQDFAAAAAgAzjBHXSG3sgHjAAAAzwEAABgAAAAAAAAAAAAAAIABvAEAAHhsL3dvcmtzaGVldHMvc2hlZXQxLnhtbFBLBQYAAAAAAwADAMsAAADVAgAAAAA=";

function targetFixture() {
  const resources = createMemoryEnterpriseResourceRepositoryV010();
  const counterparties = createCounterpartyRepositoryV010(resources);
  const roles = createCounterpartyRoleRepositoryV010(resources, counterparties);
  const extensions = createObjectExtensionRepositoryV010(resources);
  const values = createObjectExtensionValueRepositoryV010(resources);
  return createCounterpartyImportTargetV010({
    resources,
    repository: counterparties,
    roleRepository: roles,
    extensionRepository: extensions,
    extensionValueRepository: values
  });
}

test("XLSX adapter parses first worksheet into staged row model", () => {
  const source = parseXlsxSourceV010({
    name: "往来对象.xlsx",
    bytes: Buffer.from(XLSX_BASE64, "base64")
  });
  assert.equal(source.kind, "XLSX");
  assert.deepEqual(source.headers, ["往来编码", "往来名称", "主体类型"]);
  assert.equal(source.rows.length, 1);
  assert.deepEqual(source.rows[0], {
    往来编码: "C001",
    往来名称: "甲公司",
    主体类型: "ORGANIZATION"
  });
});

test("localized spreadsheet headers auto-map through EffectiveObjectSchema", () => {
  const source = parseXlsxSourceV010({
    bytes: Buffer.from(XLSX_BASE64, "base64")
  });
  const schema = createCounterpartyEffectiveObjectSchemaV010({
    locale: "en"
  });
  const mapping = suggestDataImportMappingV010({ schema, source });
  assert.deepEqual(mapping, [{
    sourceColumn: "往来编码",
    targetFieldId: "code"
  }, {
    sourceColumn: "往来名称",
    targetFieldId: "displayName"
  }, {
    sourceColumn: "主体类型",
    targetFieldId: "subjectType"
  }]);
});

test("Data Import Human experience exposes target selection, file upload and target parameters", () => {
  const target = targetFixture();
  assert.equal(target.label.translations["zh-CN"], "往来对象");
  assert.equal(target.parameters[0].key, "relationshipMode");

  const directory = createDataImportDirectoryPageV010({
    targets: [target],
    jobs: [],
    locale: "zh-CN"
  });
  assert.equal(directory.title, "数据导入");
  assert.equal(directory.items[0].title, "往来对象");
  assert.equal(
    directory.items[0].primaryAction.route,
    "/data-import/new/counterparty.subject"
  );

  const upload = createDataImportUploadPageV010({
    target,
    locale: "zh-CN"
  });
  const file = upload.fields.find(field => field.key === "file");
  assert.equal(file.control, "file");
  assert.ok(file.accept.includes(".xlsx"));
  assert.equal(file.maxBytes, 20 * 1024 * 1024);
  const relation = upload.fields.find(
    field => field.key === "parameter__relationshipMode"
  );
  assert.equal(relation.control, "select");
  assert.equal(relation.initialValue, "NONE");

  const html = renderToHtml(upload);
  assert.match(html, /type="file"/);
  assert.match(html, /\.xlsx/);

  const validated = validateValues(upload, {
    targetId: "counterparty.subject",
    file: {
      name: "sample.xlsx",
      mediaType:
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      size: Buffer.from(XLSX_BASE64, "base64").byteLength,
      contentBase64: XLSX_BASE64
    },
    parameter__relationshipMode: "CUSTOMER"
  });
  assert.equal(validated.ok, true);
});

test("mapping and review pages keep validation and commit explicit", () => {
  const target = targetFixture();
  const schema = target.describe({
    contextId: "enterprise-context:a",
    locale: "zh-CN",
    parameters: { relationshipMode: "CUSTOMER" }
  });
  const job = {
    contractVersion: "0.1.0",
    importJobId: "import-human-1",
    targetId: target.targetId,
    targetParameters: { relationshipMode: "CUSTOMER" },
    state: "STAGED",
    source: {
      kind: "XLSX",
      name: "客户.xlsx",
      headers: ["往来编码", "往来名称", "主体类型"],
      rows: [{
        往来编码: "C001",
        往来名称: "甲公司",
        主体类型: "ORGANIZATION"
      }]
    },
    mapping: [{
      sourceColumn: "往来编码",
      targetFieldId: "code"
    }, {
      sourceColumn: "往来名称",
      targetFieldId: "displayName"
    }, {
      sourceColumn: "主体类型",
      targetFieldId: "subjectType"
    }],
    stagedAt: "2026-10-07T05:00:00.000Z",
    stagedBySubjectId: "owner-a"
  };

  const mappingPage = createDataImportMappingPageV010({
    job,
    schema,
    locale: "zh-CN"
  });
  assert.equal(mappingPage.command.code, "data-import.review");
  assert.equal(
    mappingPage.fields.find(field => field.key === "map_0").initialValue,
    "code"
  );

  const reviewPage = createDataImportReviewPageV010({
    job: {
      ...job,
      state: "DRY_RUN_READY",
      dryRun: {
        schemaDigest: "digest",
        totalRows: 1,
        validRows: 1,
        invalidRows: 0,
        rows: [{
          rowNumber: 1,
          ok: true,
          prepared: {
            rowNumber: 1,
            values: {
              code: "C001",
              displayName: "甲公司",
              subjectType: "ORGANIZATION"
            },
            dedupeKey: "counterparty-code:c001"
          },
          issues: []
        }]
      }
    },
    locale: "zh-CN"
  });
  const summary = reviewPage.items[0];
  assert.equal(summary.status.label, "预检查通过");
  assert.ok(
    summary.secondaryActions.some(action =>
      action.command === "data-import.commit"
    )
  );
  assert.ok(
    summary.secondaryActions.some(action =>
      action.type === "navigate"
      && action.route === "/data-import/jobs/import-human-1/map"
    )
  );
});

test("Counterparty import target remains the first Foundation Object consumer, not a generic framework branch", () => {
  assert.equal(
    counterpartyFoundationObjectDescriptorV010.objectType,
    "counterparty.subject"
  );
});
