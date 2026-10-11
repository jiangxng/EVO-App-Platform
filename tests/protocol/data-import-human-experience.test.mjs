import test from "node:test";
import assert from "node:assert/strict";

import {
  parseXlsxSourceV010
} from "../../dist/apps/data-import/xlsx.js";
import {
  suggestDataImportMappingV010
} from "../../dist/apps/data-import/service.js";
import {
  createDataImportRepositoryV010
} from "../../dist/apps/data-import/repository.js";
import {
  createDataImportRecipeRepositoryV010
} from "../../dist/apps/data-import/recipe.js";
import {
  createDataImportServiceV010
} from "../../dist/apps/data-import/service.js";
import {
  createDataImportActionHandlersV010
} from "../../dist/apps/data-import/actions.js";
import {
  DATA_IMPORT_COMMIT_COMMAND_V010,
  DATA_IMPORT_REVIEW_COMMAND_V010,
  DATA_IMPORT_STAGE_FILE_COMMAND_V010
} from "../../dist/apps/data-import/constants.js";
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


function request(commandCode, values = {}) {
  return {
    contractVersion: "0.1.0",
    type: "command",
    command: {
      code: commandCode,
      inputVersion: "0.1.0"
    },
    values,
    sourceInteractionId: "data-import-human-test",
    actionId: commandCode,
    requiresConfirmation: false
  };
}

function platformContext() {
  return {
    contractVersion: "0.1.0",
    principal: {
      contractVersion: "0.1.0",
      subjectId: "owner-a",
      actorType: "HUMAN",
      identityProviderId: "test.identity",
      sessionId: "session-a"
    },
    scope: {
      contractVersion: "0.1.0",
      enterpriseId: "ent-a"
    },
    context: {
      contractVersion: "0.1.0",
      personalContext: {
        contractVersion: "0.1.0",
        kind: "PERSONAL",
        contextId: "personal:owner-a",
        ownerSubjectId: "owner-a"
      },
      activeContext: {
        contractVersion: "0.1.0",
        kind: "ENTERPRISE",
        contextId: "enterprise-context:a",
        enterpriseId: "ent-a"
      }
    },
    correlationId: "data-import-human-test"
  };
}

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
  assert.equal(directory.density, "compact");
  assert.equal(directory.itemActivation, "primary-action");
  assert.equal(directory.collectionTitle, "导入历史");
  assert.match(directory.collectionDescription, /过去的导入任务/);
  assert.equal(directory.items.length, 0);
  assert.deepEqual(
    directory.actions.map(action => [
      action.label,
      action.route,
      action.primary === true
    ]),
    [["导入往来对象", "/data-import/new/counterparty.subject", true]]
  );

  const upload = createDataImportUploadPageV010({
    target,
    locale: "zh-CN"
  });
  assert.deepEqual(
    upload.contextNavigation.items.map(item => [item.label, item.route]),
    [["数据导入", "/data-import"], ["上传数据文件", undefined]]
  );
  assert.match(upload.description, /CSV \/ XLSX/);

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
  assert.match(html, /data-eidos-context-navigation/);
  assert.match(html, /data-eidos-page-description/);

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
  assert.deepEqual(
    mappingPage.contextNavigation.items.map(item => [item.label, item.route]),
    [["数据导入", "/data-import"], ["字段映射", undefined]]
  );
  assert.match(mappingPage.description, /确认每一列对应的 EVO 字段/);
  assert.equal(
    mappingPage.fields.find(field => field.key === "map_0").initialValue,
    "code"
  );
  const agentAction = mappingPage.actions.find(
    action => action.type === "agent"
  );
  assert.ok(agentAction);
  assert.equal(agentAction.label, "AI 自动匹配");
  assert.equal(agentAction.prompt, "帮我做字段映射");
  assert.equal(agentAction.agentCapability, "agent.personal");
  assert.equal(agentAction.refreshSourceOnComplete, true);
  assert.deepEqual(agentAction.context, {
    taskKind: "data-import.mapping",
    importJobId: "import-human-1",
    targetId: "counterparty.subject"
  });
  const mappingHtml = renderToHtml(mappingPage);
  assert.match(mappingHtml, /data-eidos-agent-action="ai-auto-map"/);
  assert.match(mappingHtml, />AI 自动匹配<\/button>/);

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
  assert.equal(reviewPage.density, "compact");
  assert.deepEqual(
    reviewPage.contextNavigation.items.map(item => [item.label, item.route]),
    [
      ["数据导入", "/data-import"],
      ["字段映射", "/data-import/jobs/import-human-1/map"],
      ["导入预检查", undefined]
    ]
  );
  assert.equal(summary.status.label, "预检查通过");
  assert.equal(summary.primaryAction, undefined);
  assert.equal(summary.secondaryActions, undefined);
  assert.ok(
    reviewPage.actions.some(action =>
      action.command === "data-import.commit"
      && action.primary === true
    )
  );
  assert.ok(
    reviewPage.actions.some(action =>
      action.type === "navigate"
      && action.route === "/data-import/jobs/import-human-1/map"
    )
  );
});


test("Human file action stages XLSX, preserves suggested mapping and reaches dry-run review", async () => {
  const resources = createMemoryEnterpriseResourceRepositoryV010();
  const counterparties = createCounterpartyRepositoryV010(resources);
  const roles = createCounterpartyRoleRepositoryV010(resources, counterparties);
  const extensions = createObjectExtensionRepositoryV010(resources);
  const values = createObjectExtensionValueRepositoryV010(resources);
  const target = createCounterpartyImportTargetV010({
    resources,
    repository: counterparties,
    roleRepository: roles,
    extensionRepository: extensions,
    extensionValueRepository: values
  });
  const repository = createDataImportRepositoryV010(resources);
  const service = createDataImportServiceV010({
    repository,
    targets: [target]
  });
  let sequence = 0;
  const handlers = createDataImportActionHandlersV010({
    service,
    repository,
    targets: [target],
    canManageEnterpriseContext: () => true,
    idFactory: () => "import-human-action-" + (++sequence),
    now: () => new Date("2026-10-07T06:30:00.000Z")
  });
  const stageFile = handlers.find(
    item => item.commandCode === DATA_IMPORT_STAGE_FILE_COMMAND_V010
  );
  const review = handlers.find(
    item => item.commandCode === DATA_IMPORT_REVIEW_COMMAND_V010
  );
  assert.ok(stageFile);
  assert.ok(review);

  const bytes = Buffer.from(XLSX_BASE64, "base64");
  const staged = await stageFile.execute(
    request(DATA_IMPORT_STAGE_FILE_COMMAND_V010, {
      targetId: "counterparty.subject",
      file: {
        name: "往来对象.xlsx",
        mediaType:
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        size: bytes.byteLength,
        contentBase64: XLSX_BASE64
      },
      parameter__relationshipMode: "CUSTOMER"
    }),
    platformContext()
  );

  assert.equal(staged.ok, true);
  assert.equal(
    staged.result.navigateTo,
    "/data-import/jobs/import-human-action-1/map"
  );
  const job = repository.get(
    "enterprise-context:a",
    "import-human-action-1"
  );
  assert.equal(job.source.kind, "XLSX");
  assert.equal(job.targetParameters.relationshipMode, "CUSTOMER");
  assert.deepEqual(job.mapping, [{
    sourceColumn: "往来编码",
    targetFieldId: "code"
  }, {
    sourceColumn: "往来名称",
    targetFieldId: "displayName"
  }, {
    sourceColumn: "主体类型",
    targetFieldId: "subjectType"
  }]);

  const reviewed = await review.execute(
    request(DATA_IMPORT_REVIEW_COMMAND_V010, {
      importJobId: job.importJobId,
      map_0: "code",
      map_1: "displayName",
      map_2: "subjectType"
    }),
    platformContext()
  );

  assert.equal(reviewed.ok, true);
  assert.equal(
    reviewed.result.navigateTo,
    "/data-import/jobs/import-human-action-1/review"
  );
  const ready = repository.get(
    "enterprise-context:a",
    "import-human-action-1"
  );
  assert.equal(ready.state, "DRY_RUN_READY");
  assert.equal(ready.dryRun.validRows, 1);
  assert.equal(counterparties.list("enterprise-context:a").length, 0);
});

test("CP-03D first confirmed import teaches a recipe and second same-structure import reuses it without remapping", async () => {
  const resources = createMemoryEnterpriseResourceRepositoryV010();
  const counterparties = createCounterpartyRepositoryV010(resources);
  const roles = createCounterpartyRoleRepositoryV010(resources, counterparties);
  const extensions = createObjectExtensionRepositoryV010(resources);
  const values = createObjectExtensionValueRepositoryV010(resources);
  const target = createCounterpartyImportTargetV010({
    resources,
    repository: counterparties,
    roleRepository: roles,
    extensionRepository: extensions,
    extensionValueRepository: values
  });
  const repository = createDataImportRepositoryV010(resources);
  const recipes = createDataImportRecipeRepositoryV010(resources);
  const service = createDataImportServiceV010({
    repository,
    recipeRepository: recipes,
    targets: [target]
  });
  let sequence = 0;
  const handlers = createDataImportActionHandlersV010({
    service,
    repository,
    targets: [target],
    canManageEnterpriseContext: () => true,
    idFactory: () => "import-learning-" + (++sequence),
    now: () => new Date("2026-10-08T00:00:00.000Z")
  });
  const stageFile = handlers.find(
    item => item.commandCode === DATA_IMPORT_STAGE_FILE_COMMAND_V010
  );
  const review = handlers.find(
    item => item.commandCode === DATA_IMPORT_REVIEW_COMMAND_V010
  );
  const commit = handlers.find(
    item => item.commandCode === DATA_IMPORT_COMMIT_COMMAND_V010
  );
  assert.ok(stageFile);
  assert.ok(review);
  assert.ok(commit);

  const csvFile = (name, code, displayName) => {
    const csv = [
      "往来编码,往来名称,主体类型,备注",
      [code, displayName, "ORGANIZATION", "保留原始备注"].join(",")
    ].join("\n");
    return {
      name,
      mediaType: "text/csv",
      size: Buffer.byteLength(csv),
      contentBase64: Buffer.from(csv).toString("base64")
    };
  };

  const firstStage = await stageFile.execute(
    request(DATA_IMPORT_STAGE_FILE_COMMAND_V010, {
      targetId: "counterparty.subject",
      file: csvFile("客户首批.csv", "C101", "首批客户"),
      parameter__relationshipMode: "CUSTOMER"
    }),
    platformContext()
  );
  assert.equal(firstStage.ok, true);
  assert.equal(
    firstStage.result.navigateTo,
    "/data-import/jobs/import-learning-1/map"
  );

  const firstReview = await review.execute(
    request(DATA_IMPORT_REVIEW_COMMAND_V010, {
      importJobId: "import-learning-1",
      map_0: "code",
      map_1: "displayName",
      map_2: "subjectType",
      map_3: "__IGNORE__"
    }),
    platformContext()
  );
  assert.equal(firstReview.ok, true);

  const firstCommit = await commit.execute(
    request(DATA_IMPORT_COMMIT_COMMAND_V010, {
      importJobId: "import-learning-1"
    }),
    platformContext()
  );
  assert.equal(firstCommit.ok, true);

  const first = repository.get(
    "enterprise-context:a",
    "import-learning-1"
  );
  assert.equal(first.state, "COMMITTED");
  assert.equal(first.mappingOrigin, "HUMAN");
  // An unmapped vendor column remains durable import-source evidence after commit.
  // It is NOT silently written into a Counterparty core/profile/extension field.
  assert.deepEqual(first.source.headers, [
    "往来编码", "往来名称", "主体类型", "备注"
  ]);
  assert.equal(first.source.rows[0]["备注"], "保留原始备注");
  assert.equal(first.mapping.some(item => item.sourceColumn === "备注"), false);
  const importedSubject = counterparties.list("enterprise-context:a")
    .find(item => item.code === "C101");
  assert.ok(importedSubject);
  assert.equal(importedSubject.notes, undefined);
  assert.equal(values.listForObject({
    contextId: "enterprise-context:a",
    objectType: "counterparty.subject",
    objectId: importedSubject.counterpartyId
  }).length, 0);
  assert.ok(first.appliedRecipeId);
  assert.ok(recipes.get(
    "enterprise-context:a",
    first.appliedRecipeId
  ));

  const secondStage = await stageFile.execute(
    request(DATA_IMPORT_STAGE_FILE_COMMAND_V010, {
      targetId: "counterparty.subject",
      file: csvFile("客户次批.csv", "C102", "次批客户"),
      parameter__relationshipMode: "CUSTOMER"
    }),
    platformContext()
  );
  assert.equal(secondStage.ok, true);
  assert.equal(
    secondStage.result.navigateTo,
    "/data-import/jobs/import-learning-2/review"
  );
  assert.equal(secondStage.result.mappingOrigin, "RECIPE");
  assert.equal(secondStage.result.appliedRecipeId, first.appliedRecipeId);

  const second = repository.get(
    "enterprise-context:a",
    "import-learning-2"
  );
  assert.equal(second.state, "DRY_RUN_READY");
  assert.equal(second.mappingOrigin, "RECIPE");
  assert.equal(second.appliedRecipeId, first.appliedRecipeId);
  assert.equal(
    second.mapping.some(item => item.sourceColumn === "备注"),
    false
  );

  const reviewPage = createDataImportReviewPageV010({
    job: second,
    locale: "zh-CN"
  });
  assert.match(reviewPage.description, /已复用此前确认成功的企业导入规则/);
  const summary = reviewPage.items.find(item => item.id === "summary");
  assert.equal(summary.metadata["映射来源"], "已学习规则");
  assert.equal(summary.metadata["导入规则"], first.appliedRecipeId);
  assert.equal(summary.metadata["未映射列"], "备注");
  assert.equal(summary.metadata["原始来源"], "已保留");

  const evidence = reviewPage.items.find(item => item.id === "evidence");
  assert.ok(evidence);
  assert.match(evidence.summary, /未映射列不会.*丢弃/);

  const directory = createDataImportDirectoryPageV010({
    targets: [target],
    jobs: repository.list("enterprise-context:a"),
    locale: "zh-CN"
  });
  const secondHistory = directory.items.find(
    item => item.id === "job:import-learning-2"
  );
  assert.equal(secondHistory.metadata["映射来源"], "已学习规则");
  assert.equal(secondHistory.metadata["导入规则"], first.appliedRecipeId);
  assert.equal(secondHistory.metadata["未映射列"], "备注");
});

test("CP-03D EC learns a Human-confirmed field mapping and reuses it across a different table structure", async () => {
  const resources = createMemoryEnterpriseResourceRepositoryV010();
  const counterparties = createCounterpartyRepositoryV010(resources);
  const roles = createCounterpartyRoleRepositoryV010(resources, counterparties);
  const extensions = createObjectExtensionRepositoryV010(resources);
  const values = createObjectExtensionValueRepositoryV010(resources);
  const target = createCounterpartyImportTargetV010({
    resources,
    repository: counterparties,
    roleRepository: roles,
    extensionRepository: extensions,
    extensionValueRepository: values
  });
  const repository = createDataImportRepositoryV010(resources);
  const recipes = createDataImportRecipeRepositoryV010(resources);
  const service = createDataImportServiceV010({
    repository,
    recipeRepository: recipes,
    targets: [target]
  });

  const learned = new Map();
  let recordSequence = 0;
  const experienceAdvisor = {
    async recordSuccessful(input) {
      const key = [input.tenantId, input.targetId, input.sourceColumn].join("|");
      learned.set(key, input.targetFieldId);
      const n = ++recordSequence;
      return {
        observationRecordId: "observation-" + n,
        patternRecordId: "pattern-" + n
      };
    },
    async recommend(input) {
      return input.sourceColumns.flatMap(sourceColumn => {
        const key = [input.tenantId, input.targetId, sourceColumn].join("|");
        const targetFieldId = learned.get(key);
        if (!targetFieldId || !input.availableTargetFieldIds.includes(targetFieldId)) {
          return [];
        }
        return [{
          sourceColumn,
          targetFieldId,
          confidence: 0.90,
          supportCount: 1,
          conflictCount: 0,
          supportingRecordIds: ["pattern-known"],
          rationale: "Prior Human-confirmed successful import",
          advisoryOnly: true
        }];
      });
    }
  };

  let sequence = 0;
  const handlers = createDataImportActionHandlersV010({
    service,
    repository,
    targets: [target],
    experienceAdvisor,
    canManageEnterpriseContext: () => true,
    idFactory: () => "import-ec-learning-" + (++sequence),
    now: () => new Date("2026-10-08T01:30:00.000Z")
  });
  const stageFile = handlers.find(
    item => item.commandCode === DATA_IMPORT_STAGE_FILE_COMMAND_V010
  );
  const review = handlers.find(
    item => item.commandCode === DATA_IMPORT_REVIEW_COMMAND_V010
  );
  const commit = handlers.find(
    item => item.commandCode === DATA_IMPORT_COMMIT_COMMAND_V010
  );

  const csvFile = (name, headers, row) => {
    const csv = [headers.join(","), row.join(",")].join("\n");
    return {
      name,
      mediaType: "text/csv",
      size: Buffer.byteLength(csv),
      contentBase64: Buffer.from(csv).toString("base64")
    };
  };

  const firstStage = await stageFile.execute(
    request(DATA_IMPORT_STAGE_FILE_COMMAND_V010, {
      targetId: "counterparty.subject",
      file: csvFile(
        "legacy-a.csv",
        ["名称", "编码", "主体"],
        ["第一客户", "EC-C001", "ORGANIZATION"]
      ),
      parameter__relationshipMode: "CUSTOMER"
    }),
    platformContext()
  );
  assert.equal(firstStage.ok, true);

  const firstReview = await review.execute(
    request(DATA_IMPORT_REVIEW_COMMAND_V010, {
      importJobId: "import-ec-learning-1",
      map_0: "displayName",
      map_1: "code",
      map_2: "subjectType"
    }),
    platformContext()
  );
  assert.equal(firstReview.ok, true);

  const firstCommit = await commit.execute(
    request(DATA_IMPORT_COMMIT_COMMAND_V010, {
      importJobId: "import-ec-learning-1"
    }),
    platformContext()
  );
  assert.equal(firstCommit.ok, true);

  const first = repository.get(
    "enterprise-context:a",
    "import-ec-learning-1"
  );
  assert.equal(first.state, "COMMITTED");
  assert.equal(first.mappingOrigin, "HUMAN");
  assert.equal(first.experienceLearning.status, "RECORDED");
  assert.equal(first.experienceLearning.learnedMappings, 3);
  assert.equal(
    learned.get("ent-a|counterparty.subject|编码"),
    "code"
  );

  const secondStage = await stageFile.execute(
    request(DATA_IMPORT_STAGE_FILE_COMMAND_V010, {
      targetId: "counterparty.subject",
      file: csvFile(
        "legacy-b.csv",
        ["联系电话", "编码", "客户名称", "主体类型"],
        ["13800138000", "EC-C002", "第二客户", "ORGANIZATION"]
      ),
      parameter__relationshipMode: "CUSTOMER"
    }),
    platformContext()
  );
  assert.equal(secondStage.ok, true);
  assert.equal(
    secondStage.result.navigateTo,
    "/data-import/jobs/import-ec-learning-2/map"
  );
  assert.match(secondStage.result.message, /Experience Compiler/);

  const second = repository.get(
    "enterprise-context:a",
    "import-ec-learning-2"
  );
  const learnedCode = second.mapping.find(
    item => item.sourceColumn === "编码"
  );
  assert.equal(learnedCode.targetFieldId, "code");
  assert.equal(learnedCode.advisory.source, "EXPERIENCE_COMPILER");
  assert.equal(learnedCode.advisory.confidence, 0.90);
  assert.equal(second.mappingOrigin, "DETERMINISTIC");

  const schema = target.describe({
    contextId: "enterprise-context:a",
    locale: "zh-CN",
    parameters: { relationshipMode: "CUSTOMER" }
  });
  const mappingPage = createDataImportMappingPageV010({
    job: second,
    schema,
    locale: "zh-CN"
  });
  assert.match(mappingPage.description, /Experience Compiler/);
  assert.equal(
    mappingPage.fields.find(field => field.key === "map_1").initialValue,
    "code"
  );
  const advisoryField = mappingPage.fields.find(
    field => field.semanticType === "data-import-ec-recommendation"
  );
  assert.ok(advisoryField);
  assert.match(advisoryField.initialValue, /编码 → 往来编码 · code/);
  assert.match(advisoryField.initialValue, /90%/);
});

test("Human review preserves Agent CONSTANT and unchanged VALUE_MAP mappings", async () => {
  const resources = createMemoryEnterpriseResourceRepositoryV010();
  const counterparties = createCounterpartyRepositoryV010(resources);
  const roles = createCounterpartyRoleRepositoryV010(resources, counterparties);
  const extensions = createObjectExtensionRepositoryV010(resources);
  const values = createObjectExtensionValueRepositoryV010(resources);
  const target = createCounterpartyImportTargetV010({
    resources,
    repository: counterparties,
    roleRepository: roles,
    extensionRepository: extensions,
    extensionValueRepository: values
  });
  const repository = createDataImportRepositoryV010(resources);
  const service = createDataImportServiceV010({
    repository,
    targets: [target]
  });
  const handlers = createDataImportActionHandlersV010({
    service,
    repository,
    targets: [target],
    canManageEnterpriseContext: () => true,
    idFactory: () => "unused",
    now: () => new Date("2026-10-07T07:30:00.000Z")
  });
  const review = handlers.find(
    item => item.commandCode === DATA_IMPORT_REVIEW_COMMAND_V010
  );
  assert.ok(review);

  service.stage({
    contextId: "enterprise-context:a",
    importJobId: "import-advanced-human-review",
    targetId: target.targetId,
    targetParameters: { relationshipMode: "SUPPLIER" },
    source: {
      kind: "ROWS",
      headers: ["供应商编码", "供应商名称", "供应商类型"],
      rows: [{
        供应商编码: "S001",
        供应商名称: "甲供应商",
        供应商类型: "设备"
      }]
    },
    mapping: [],
    actorSubjectId: "owner-a",
    recordedAt: "2026-10-07T07:20:00.000Z"
  });

  service.updateMapping({
    contextId: "enterprise-context:a",
    importJobId: "import-advanced-human-review",
    mapping: [{
      sourceColumn: "供应商编码",
      targetFieldId: "code"
    }, {
      sourceColumn: "供应商名称",
      targetFieldId: "displayName"
    }, {
      targetFieldId: "subjectType",
      transform: {
        kind: "CONSTANT",
        value: "ORGANIZATION"
      }
    }],
    mappingOrigin: "AGENT",
    actorSubjectId: "agent-a",
    recordedAt: "2026-10-07T07:21:00.000Z"
  });

  const schema = target.describe({
    contextId: "enterprise-context:a",
    locale: "zh-CN",
    parameters: { relationshipMode: "SUPPLIER" }
  });
  const page = createDataImportMappingPageV010({
    job: repository.get(
      "enterprise-context:a",
      "import-advanced-human-review"
    ),
    schema,
    locale: "zh-CN"
  });
  const constantField = page.fields.find(
    field => field.semanticType === "data-import-batch-constant"
  );
  assert.ok(constantField);
  assert.equal(constantField.readOnly, true);
  assert.equal(constantField.initialValue, "ORGANIZATION");
  assert.match(constantField.label, /主体类型/);

  const reviewed = await review.execute(
    request(DATA_IMPORT_REVIEW_COMMAND_V010, {
      importJobId: "import-advanced-human-review",
      map_0: "code",
      map_1: "displayName",
      map_2: "__IGNORE__"
    }),
    platformContext()
  );

  assert.equal(reviewed.ok, true);
  const ready = repository.get(
    "enterprise-context:a",
    "import-advanced-human-review"
  );
  assert.equal(ready.state, "DRY_RUN_READY");
  assert.equal(ready.dryRun.validRows, 1);
  assert.deepEqual(
    ready.mapping.find(item => item.targetFieldId === "subjectType"),
    {
      targetFieldId: "subjectType",
      transform: {
        kind: "CONSTANT",
        value: "ORGANIZATION"
      }
    }
  );
});

test("Counterparty import target remains the first Foundation Object consumer, not a generic framework branch", () => {
  assert.equal(
    counterpartyFoundationObjectDescriptorV010.objectType,
    "counterparty.subject"
  );
});
