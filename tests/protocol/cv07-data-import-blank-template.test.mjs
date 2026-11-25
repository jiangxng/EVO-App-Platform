import test from "node:test";
import assert from "node:assert/strict";

import { dataImportBlankCsvTemplateV010 } from "../../dist/apps/data-import/template.js";
import { parseCsvSourceV010 } from "../../dist/apps/data-import/csv.js";
import { suggestDataImportMappingV010, createDataImportServiceV010 }
  from "../../dist/apps/data-import/service.js";
import { createDataImportRepositoryV010 }
  from "../../dist/apps/data-import/repository.js";
import { createDataImportActionHandlersV010 }
  from "../../dist/apps/data-import/actions.js";
import { createDataImportDirectoryPageV010 }
  from "../../dist/apps/data-import/page.js";
import {
  DATA_IMPORT_TEMPLATE_CSV_COMMAND_V010 as command,
  DATA_IMPORT_TEMPLATE_CSV_OPERATION_V010 as operation
} from "../../dist/apps/data-import/constants.js";
import { createMemoryEnterpriseResourceRepositoryV010 }
  from "../../dist/providers/enterprise-context/resources.js";
import { createCounterpartyRepositoryV010 }
  from "../../dist/apps/counterparty/repository.js";
import { createCounterpartyRoleRepositoryV010 }
  from "../../dist/apps/counterparty/roles.js";
import { createCounterpartyImportTargetV010 }
  from "../../dist/apps/counterparty/import-target.js";
import { createObjectExtensionRepositoryV010 }
  from "../../dist/apps/object-extension/repository.js";
import { createObjectExtensionValueRepositoryV010 }
  from "../../dist/apps/object-extension/values.js";
import { createBusinessDictionaryRepositoryV010 }
  from "../../dist/apps/business-dictionary/repository.js";
import { createBusinessDictionaryImportTargetV010 }
  from "../../dist/apps/business-dictionary/import-target.js";
import { dataImportPackage } from "../../dist/apps/data-import/package.js";
import { fieldsForSurfaceV010 }
  from "../../dist/contracts/foundation-object/schema.js";
import { actionResultDownloadV010 }
  from "../../dist/vendor/eidos/src/app-host/action-download.js";
import { renderCatalogBrowserToHtml }
  from "../../dist/vendor/eidos/src/catalog-browser/render.js";
import { dataImportActionTargetV010 }
  from "../../dist/apps/data-import/action-target.js";

const enterprise = "enterprise-context:a";
function fixture() {
  const resources = createMemoryEnterpriseResourceRepositoryV010();
  const counterparties = createCounterpartyRepositoryV010(resources);
  const roles = createCounterpartyRoleRepositoryV010(resources, counterparties);
  const target = createCounterpartyImportTargetV010({
    resources,
    repository: counterparties,
    roleRepository: roles,
    extensionRepository: createObjectExtensionRepositoryV010(resources),
    extensionValueRepository: createObjectExtensionValueRepositoryV010(resources)
  });
  const dictionary = createBusinessDictionaryImportTargetV010({
    resources, repository: createBusinessDictionaryRepositoryV010(resources)
  });
  const repository = createDataImportRepositoryV010(resources);
  const service = createDataImportServiceV010({
    repository, targets: [target, dictionary]
  });
  return { target, dictionary, repository, service };
}
function context(subjectId = "owner-a", enterpriseId = enterprise) {
  return {
    contractVersion: "0.1.0",
    principal: {
      contractVersion: "0.1.0", subjectId, actorType: "HUMAN",
      identityProviderId: "test.identity", sessionId: "session-a"
    },
    scope: { contractVersion: "0.1.0", enterpriseId: "ent-a" },
    context: {
      contractVersion: "0.1.0",
      personalContext: {
        contractVersion: "0.1.0", kind: "PERSONAL",
        contextId: "personal:owner-a", ownerSubjectId: "owner-a"
      },
      activeContext: {
        contractVersion: "0.1.0", kind: "ENTERPRISE",
        contextId: enterpriseId, enterpriseId: "ent-a"
      }
    },
    correlationId: "cv07-template-req"
  };
}
function request(values) {
  return {
    contractVersion: "0.1.0",
    type: "command",
    command: { code: command, inputVersion: "0.1.0" },
    values, sourceInteractionId: "evo-data-import.directory",
    actionId: "template:counterparty.subject", requiresConfirmation: false
  };
}
function handlers(f, management = () => true, resolveTargets) {
  return createDataImportActionHandlersV010({
    service: f.service, repository: f.repository,
    targets: [f.target, f.dictionary], ...(resolveTargets ? {resolveTargets}: {}),
    canManageEnterpriseContext: management,
    idFactory: () => { throw new Error("TEMPLATE_MUST_NOT_WRITE"); }
  });
}
const templateHandler = hs => hs.find(h => h.commandCode === command);

test("CV07 blank CSV generated from current Counterparty and Dictionary owner schema round-trips all importable fields", () => {
  const f = fixture();
  for (const [target, parameters] of [
    [f.target, {relationshipMode: "CUSTOMER"}],
    [f.target, {relationshipMode: "SUPPLIER"}],
    [f.dictionary, undefined]
  ]) {
    const schema = target.describe({
      contextId: enterprise, locale: "zh-CN", parameters
    });
    const download = dataImportBlankCsvTemplateV010({
      targetId: target.targetId, schema, locale: "zh-CN"
    });
    assert.match(download.fileName, /^data-import-[a-zA-Z0-9._-]+-blank\.csv$/);
    assert.equal(download.mediaType, "text/csv;charset=utf-8");
    assert.ok(download.content.startsWith("\uFEFF"));
    assert.ok(download.content.endsWith("\r\n"));
    assert.equal(download.content.split("\r\n").length, 2,
      "Only one header row; never create example business records");
    const source = parseCsvSourceV010({csv: download.content});
    assert.equal(source.rows.length, 0);
    const importFields = fieldsForSurfaceV010(schema, "IMPORT")
      .filter(field => field.writable);
    assert.equal(source.headers.length, importFields.length);
    assert.deepEqual(suggestDataImportMappingV010({schema, source})
      .map(item => item.targetFieldId), importFields.map(item => item.fieldId),
      "Every generated column must map unambiguously without Human guessing");
  }
});

test("CV07 duplicate localized labels use stable IDs; unsafe spreadsheet formula labels are never emitted", () => {
  const target = fixture().target;
  const schema = target.describe({contextId: enterprise, locale: "zh-CN"});
  const basis = schema.fields.find(x => x.writable && x.surfaces.includes("IMPORT"));
  assert.ok(basis);
  const field = (id, name, writable=true, surfaces=["IMPORT"]) => ({
    ...basis, fieldId: id, resolvedLabel: name,
    label: {default:name, translations:{"zh-CN":name}},
    source: "ENTERPRISE_EXTENSION", writable, readable:true, surfaces
  });
  const special = {
    ...schema, fields: [
      field("ext.bank.a", "开户银行"),
      field("ext.bank.b", "开户银行"),
      field("ext.formula", "=HYPERLINK(1)"),
      field("ext.private", "只供详情查看", true, ["DETAIL"]),
      field("ext.locked", "只读列", false)
    ]
  };
  const download = dataImportBlankCsvTemplateV010({
    targetId: target.targetId, schema:special, locale:"zh-CN"
  });
  const source = parseCsvSourceV010({csv:download.content});
  assert.deepEqual(source.headers, ["ext.bank.a", "ext.bank.b", "ext.formula"]);
  assert.doesNotMatch(download.content, /HYPERLINK|只供详情查看|只读列/);
  assert.deepEqual(suggestDataImportMappingV010({schema:special, source})
    .map(m => m.targetFieldId), source.headers);
  assert.throws(() => dataImportBlankCsvTemplateV010({
    targetId:"invalid", schema:{...special, fields:[]}
  }), /DATA_IMPORT_TEMPLATE_FIELDS_INVALID/);
});

test("CV07 managed template download executes via Eidos standard download result and never stages a Job", async () => {
  const f = fixture();
  const hs = handlers(f, (principal, id) =>
    principal.subjectId === "owner-a" && id === enterprise);
  const active = templateHandler(hs);
  assert.ok(active);
  const result = await active.execute(request({
    targetId:"counterparty.subject", locale:"zh-CN",
    targetParameters:{relationshipMode:"SUPPLIER"}
  }), context());
  assert.equal(result.ok, true);
  assert.equal(result.correlationId, "cv07-template-req");
  assert.ok(actionResultDownloadV010(result.result));
  const csv = actionResultDownloadV010(result.result).content;
  assert.equal(parseCsvSourceV010({csv}).rows.length, 0);
  assert.equal(f.repository.list(enterprise).length, 0,
    "Read-only template action may not stage, dry-run, commit or write Recipe");
  assert.equal(dataImportActionTargetV010({
    commandCode:command, request:request({targetId:"counterparty.subject"}),
    contextId:enterprise, repository:f.repository
  }), "counterparty.subject");
  for (const [values,ctx,expected] of [
    [{targetId:"counterparty.subject"},context("reader-b"),"DATA_IMPORT_MANAGE_ROLE_REQUIRED"],
    [{targetId:"counterparty.subject"},context("owner-a","enterprise-context:b"),"DATA_IMPORT_MANAGE_ROLE_REQUIRED"],
    [{targetId:"unknown.target"},context(),"DATA_IMPORT_TARGET_NOT_FOUND"],
    [{targetId:"counterparty.subject",targetParameters:{relationshipMode:"INVALID"}},context(),"DATA_IMPORT_TARGET_PARAMETER_INVALID"],
    [{targetId:"counterparty.subject",targetParameters:{unrecognized:"YES"}},context(),"DATA_IMPORT_TARGET_PARAMETER_INVALID"]
  ]) {
    const denied=await active.execute(request(values),ctx);
    assert.equal(denied.ok,false);
    assert.equal(denied.error.code,expected);
    assert.equal(f.repository.list(enterprise).length,0);
  }
  const disabled = templateHandler(handlers(f, () => true, () => []));
  assert.equal((await disabled.execute(request({
    targetId:"counterparty.subject"
  }),context())).error.code,"DATA_IMPORT_TARGET_NOT_FOUND");
});

test("CV07 Import Center shows per-target template actions only to eligible Host audience", () => {
  const f = fixture();
  const targets = [f.target, f.dictionary].map(x => ({targetId:x.targetId,label:x.label}));
  const eligible = createDataImportDirectoryPageV010({
    targets, jobs:[], locale:"zh-CN", showTemplateDownloads:true
  });
  const templates = eligible.actions.filter(a => a.id.startsWith("template:"));
  assert.equal(templates.length, 2);
  assert.ok(templates.every(a => a.type === "command" && a.command === command
    && a.requiresConfirmation === false && a.values.targetId));
  const html=renderCatalogBrowserToHtml(eligible);
  assert.match(html,/data-eidos-command="data-import\.template\.csv"/);
  assert.match(html,/空白 CSV 模板/);
  assert.equal(createDataImportDirectoryPageV010({
    targets,jobs:[],locale:"zh-CN",showTemplateDownloads:false
  }).actions.some(a=>a.id.startsWith("template:")),false);
  assert.equal(dataImportPackage.features[0].contributions.find(
    c=>c.kind==="platform.capability-operation"
      && c.operation.operationId===operation
  ).operation.effect,"READ");
});
