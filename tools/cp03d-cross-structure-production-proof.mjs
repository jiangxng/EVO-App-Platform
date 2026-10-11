import {
  createHttpDataImportExperienceAdvisorV010
} from "../dist/apps/data-import/experience-advisor.js";
import {
  createDataImportActionHandlersV010
} from "../dist/apps/data-import/actions.js";
import {
  DATA_IMPORT_COMMIT_COMMAND_V010,
  DATA_IMPORT_REVIEW_COMMAND_V010,
  DATA_IMPORT_STAGE_FILE_COMMAND_V010
} from "../dist/apps/data-import/constants.js";
import {
  createDataImportRepositoryV010
} from "../dist/apps/data-import/repository.js";
import {
  createDataImportRecipeRepositoryV010
} from "../dist/apps/data-import/recipe.js";
import {
  createDataImportServiceV010
} from "../dist/apps/data-import/service.js";
import {
  createCounterpartyImportTargetV010
} from "../dist/apps/counterparty/import-target.js";
import {
  createCounterpartyRepositoryV010
} from "../dist/apps/counterparty/repository.js";
import {
  createCounterpartyRoleRepositoryV010
} from "../dist/apps/counterparty/roles.js";
import {
  createObjectExtensionRepositoryV010
} from "../dist/apps/object-extension/repository.js";
import {
  createObjectExtensionValueRepositoryV010
} from "../dist/apps/object-extension/values.js";
import {
  createMemoryEnterpriseResourceRepositoryV010
} from "../dist/providers/enterprise-context/resources.js";

function fail(message, details = {}) {
  console.error("CP03D_CROSS_STRUCTURE_PRODUCTION_PROOF_FAIL", JSON.stringify({
    message,
    ...details
  }));
  process.exitCode = 1;
  throw new Error(message);
}

function assert(condition, message, details = {}) {
  if (!condition) fail(message, details);
}

function request(commandCode, values = {}) {
  return {
    contractVersion: "0.1.0",
    type: "command",
    command: {
      code: commandCode,
      inputVersion: "0.1.0"
    },
    values,
    sourceInteractionId: "cp03d-cross-structure-production-proof",
    actionId: commandCode,
    requiresConfirmation: false
  };
}

function csvFile(name, headers, row) {
  const csv = [headers.join(","), row.join(",")].join("\n");
  return {
    name,
    mediaType: "text/csv",
    size: Buffer.byteLength(csv),
    contentBase64: Buffer.from(csv).toString("base64")
  };
}

const ecBaseUrl = process.env.APP_PLATFORM_EC_ADVISORY_BASE_URL;
if (!ecBaseUrl) {
  fail("APP_PLATFORM_EC_ADVISORY_BASE_URL_REQUIRED");
}

const deploymentSuffix = (
  process.env.RAILWAY_DEPLOYMENT_ID
  ?? process.env.CP03D_PROOF_RUN_ID
  ?? "manual"
).replace(/[^a-zA-Z0-9-]/gu, "-");
const enterpriseId = "proof-cp03d-cross-structure-" + deploymentSuffix;
const contextId = "enterprise-context:" + enterpriseId;
const subjectId = "proof-human";

function platformContext() {
  return {
    contractVersion: "0.1.0",
    principal: {
      contractVersion: "0.1.0",
      subjectId,
      actorType: "HUMAN",
      identityProviderId: "proof.identity",
      sessionId: "proof-session"
    },
    scope: {
      contractVersion: "0.1.0",
      enterpriseId
    },
    context: {
      contractVersion: "0.1.0",
      personalContext: {
        contractVersion: "0.1.0",
        kind: "PERSONAL",
        contextId: "personal:" + subjectId,
        ownerSubjectId: subjectId
      },
      activeContext: {
        contractVersion: "0.1.0",
        kind: "ENTERPRISE",
        contextId,
        enterpriseId
      }
    },
    correlationId: "cp03d-cross-structure-production-proof"
  };
}

const resources = createMemoryEnterpriseResourceRepositoryV010();
const counterparties = createCounterpartyRepositoryV010(resources);
const roles = createCounterpartyRoleRepositoryV010(resources, counterparties);
const extensions = createObjectExtensionRepositoryV010(resources);
const extensionValues = createObjectExtensionValueRepositoryV010(resources);
const target = createCounterpartyImportTargetV010({
  resources,
  repository: counterparties,
  roleRepository: roles,
  extensionRepository: extensions,
  extensionValueRepository: extensionValues
});
const repository = createDataImportRepositoryV010(resources);
const recipes = createDataImportRecipeRepositoryV010(resources);
const service = createDataImportServiceV010({
  repository,
  recipeRepository: recipes,
  targets: [target]
});
const experienceAdvisor = createHttpDataImportExperienceAdvisorV010({
  baseUrl: ecBaseUrl,
  timeoutMs: 5000
});

let sequence = 0;
const handlers = createDataImportActionHandlersV010({
  service,
  repository,
  targets: [target],
  experienceAdvisor,
  canManageEnterpriseContext: () => true,
  idFactory: () => "cp03d-proof-import-" + (++sequence)
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
assert(stageFile && review && commit, "DATA_IMPORT_HANDLERS_REQUIRED");

const firstHeaders = [
  "旧客户名称",
  "旧客户编码",
  "旧主体分类",
  "来源备注"
];
const secondHeaders = [
  "联系电话",
  "旧客户编码",
  "开户银行",
  "旧客户名称",
  "旧主体分类"
];

const firstStage = await stageFile.execute(
  request(DATA_IMPORT_STAGE_FILE_COMMAND_V010, {
    targetId: target.targetId,
    file: csvFile(
      "cp03d-proof-structure-a.csv",
      firstHeaders,
      ["证明客户A", "PROOF-A-001", "ORGANIZATION", "结构A"]
    ),
    parameter__relationshipMode: "CUSTOMER"
  }),
  platformContext()
);
assert(firstStage.ok === true, "FIRST_STAGE_FAILED", { firstStage });

const firstJobId = firstStage.result.job.importJobId;
const firstReview = await review.execute(
  request(DATA_IMPORT_REVIEW_COMMAND_V010, {
    importJobId: firstJobId,
    map_0: "displayName",
    map_1: "code",
    map_2: "subjectType",
    map_3: "__IGNORE__"
  }),
  platformContext()
);
assert(firstReview.ok === true, "FIRST_REVIEW_FAILED", { firstReview });
assert(
  firstReview.result.job.state === "DRY_RUN_READY",
  "FIRST_DRY_RUN_NOT_READY",
  { state: firstReview.result.job.state }
);

const firstCommit = await commit.execute(
  request(DATA_IMPORT_COMMIT_COMMAND_V010, {
    importJobId: firstJobId
  }),
  platformContext()
);
assert(firstCommit.ok === true, "FIRST_COMMIT_ACTION_FAILED", { firstCommit });

const committed = repository.get(contextId, firstJobId);
assert(committed?.state === "COMMITTED", "FIRST_IMPORT_NOT_COMMITTED", {
  state: committed?.state
});
assert(
  committed?.experienceLearning?.status === "RECORDED",
  "EC_EXPERIENCE_NOT_RECORDED",
  { experienceLearning: committed?.experienceLearning }
);
assert(
  committed.experienceLearning.learnedMappings === 3,
  "EC_LEARNED_MAPPING_COUNT_INVALID",
  { experienceLearning: committed.experienceLearning }
);

const secondStage = await stageFile.execute(
  request(DATA_IMPORT_STAGE_FILE_COMMAND_V010, {
    targetId: target.targetId,
    file: csvFile(
      "cp03d-proof-structure-b.csv",
      secondHeaders,
      ["+85200000000", "PROOF-B-001", "Proof Bank", "证明客户B", "ORGANIZATION"]
    ),
    parameter__relationshipMode: "CUSTOMER"
  }),
  platformContext()
);
assert(secondStage.ok === true, "SECOND_STAGE_FAILED", { secondStage });

const second = repository.get(
  contextId,
  secondStage.result.job.importJobId
);
assert(second, "SECOND_JOB_MISSING");
assert(
  second.appliedRecipeId === undefined,
  "SECOND_STRUCTURE_MUST_NOT_USE_WHOLE_FILE_RECIPE",
  { appliedRecipeId: second.appliedRecipeId }
);

const expected = new Map([
  ["旧客户编码", "code"],
  ["旧客户名称", "displayName"],
  ["旧主体分类", "subjectType"]
]);
const learned = second.mapping.filter(
  item => item.advisory?.source === "EXPERIENCE_COMPILER"
);
assert(learned.length === 3, "EC_RECOMMENDATION_COUNT_INVALID", {
  mapping: second.mapping
});

for (const item of learned) {
  assert(
    expected.get(item.sourceColumn) === item.targetFieldId,
    "EC_RECOMMENDATION_TARGET_INVALID",
    { item }
  );
  assert(
    item.advisory.confidence >= 0.90,
    "EC_RECOMMENDATION_CONFIDENCE_TOO_LOW",
    { item }
  );
  assert(
    item.advisory.supportCount >= 1,
    "EC_RECOMMENDATION_MISSING_SUPPORT",
    { item }
  );
  assert(
    item.advisory.conflictCount === 0,
    "EC_RECOMMENDATION_HAS_CONFLICT",
    { item }
  );
  assert(
    item.advisory.supportingRecordIds.length >= 1,
    "EC_RECOMMENDATION_MISSING_PROVENANCE",
    { item }
  );
}

assert(
  String(secondStage.result.message).includes("Experience Compiler"),
  "EC_RECOMMENDATION_NOT_SURFACED_FOR_HUMAN_REVIEW",
  { message: secondStage.result.message }
);

console.log("CP03D_CROSS_STRUCTURE_PRODUCTION_PROOF_PASS", JSON.stringify({
  enterpriseId,
  firstImportJobId: firstJobId,
  firstHeaders,
  secondImportJobId: second.importJobId,
  secondHeaders,
  wholeFileRecipeReused: false,
  learnedMappings: committed.experienceLearning.learnedMappings,
  recommendations: learned.map(item => ({
    sourceColumn: item.sourceColumn,
    targetFieldId: item.targetFieldId,
    confidence: item.advisory.confidence,
    supportCount: item.advisory.supportCount,
    conflictCount: item.advisory.conflictCount,
    supportingRecordIds: item.advisory.supportingRecordIds,
    advisoryOnly: true
  })),
  humanReviewRequired: true,
  operationalDataPersistence: "MEMORY_ONLY_PROOF_CONTEXT",
  ecService: ecBaseUrl
}));
