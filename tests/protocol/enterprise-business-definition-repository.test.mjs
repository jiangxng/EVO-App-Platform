import test from "node:test";
import assert from "node:assert/strict";

import {
  createMemoryBusinessDefinitionRepositoryV010
} from "../../dist/providers/enterprise-context/business-definitions.js";
import {
  ENTERPRISE_BUSINESS_DEFINITION_CAPABILITY_V010
} from "../../dist/contracts/enterprise-business-definition.js";
import {
  hostEnterpriseContextProviderPackage
} from "../../dist/providers/enterprise-context/package.js";

const human = {
  actorType: "HUMAN",
  subjectId: "human:owner"
};

test("Enterprise Context owns append-only Draft/Published/Effective definition lifecycle", () => {
  const repository = createMemoryBusinessDefinitionRepositoryV010();

  const draft0 = repository.createDraft({
    enterpriseId: "enterprise:a",
    definitionId: "process:o2c",
    kind: "PROCESS",
    title: "Order to cash",
    payload: { stage: "draft-0" },
    actor: human,
    recordedAt: "2026-09-30T01:00:00.000Z"
  });

  assert.equal(draft0.revision, 0);
  assert.equal(draft0.state, "DRAFT");
  assert.equal(
    repository.getEffective({
      enterpriseId: "enterprise:a",
      definitionId: "process:o2c"
    }),
    undefined
  );

  const draft1 = repository.reviseDraft({
    enterpriseId: "enterprise:a",
    definitionId: "process:o2c",
    expectedRevision: 0,
    title: "Order to cash",
    payload: { stage: "draft-1" },
    actor: {
      actorType: "AI",
      subjectId: "ec:compiler"
    },
    recordedAt: "2026-09-30T02:00:00.000Z"
  });

  assert.equal(draft1.revision, 1);
  assert.equal(draft1.state, "DRAFT");

  const published = repository.publish({
    enterpriseId: "enterprise:a",
    definitionId: "process:o2c",
    expectedRevision: 1,
    actor: human,
    recordedAt: "2026-09-30T03:00:00.000Z"
  });

  assert.equal(published.revision, 2);
  assert.equal(published.state, "PUBLISHED");
  assert.equal(published.publishedBySubjectId, "human:owner");

  const nextDraft = repository.beginDraft({
    enterpriseId: "enterprise:a",
    definitionId: "process:o2c",
    expectedRevision: 2,
    title: "Order to cash vNext",
    payload: { stage: "draft-next" },
    actor: {
      actorType: "AI",
      subjectId: "ec:compiler"
    },
    recordedAt: "2026-09-30T04:00:00.000Z"
  });

  assert.equal(nextDraft.revision, 3);
  assert.equal(nextDraft.state, "DRAFT");

  const latest = repository.getLatest({
    enterpriseId: "enterprise:a",
    definitionId: "process:o2c"
  });
  const effective = repository.getEffective({
    enterpriseId: "enterprise:a",
    definitionId: "process:o2c"
  });

  assert.equal(latest.revision, 3);
  assert.equal(latest.state, "DRAFT");
  assert.equal(effective.revision, 2);
  assert.equal(effective.state, "PUBLISHED");

  assert.deepEqual(
    repository.listHistory({
      enterpriseId: "enterprise:a",
      definitionId: "process:o2c"
    }).map(item => [item.revision, item.state]),
    [
      [0, "DRAFT"],
      [1, "DRAFT"],
      [2, "PUBLISHED"],
      [3, "DRAFT"]
    ]
  );

  assert.deepEqual(
    repository.listEffective({
      enterpriseId: "enterprise:a",
      kind: "PROCESS"
    }).map(item => item.revision),
    [2]
  );
});

test("Business Definition publication remains Human-governed", () => {
  const repository = createMemoryBusinessDefinitionRepositoryV010();
  repository.createDraft({
    enterpriseId: "enterprise:a",
    definitionId: "metric:cash-cycle",
    kind: "METRIC",
    title: "Cash cycle",
    payload: {},
    actor: {
      actorType: "AI",
      subjectId: "ec:compiler"
    }
  });

  assert.throws(
    () => repository.publish({
      enterpriseId: "enterprise:a",
      definitionId: "metric:cash-cycle",
      expectedRevision: 0,
      actor: {
        actorType: "AI",
        subjectId: "ec:compiler"
      }
    }),
    /BUSINESS_DEFINITION_PUBLISH_HUMAN_REQUIRED/
  );
});

test("Enterprise Context Package exposes Business Definition capability without a standalone BDR package", () => {
  const feature = hostEnterpriseContextProviderPackage.features[0];
  assert.ok(
    feature.providesCapabilities.includes(
      ENTERPRISE_BUSINESS_DEFINITION_CAPABILITY_V010
    )
  );

  const provider = feature.contributions
    .filter(item => item.kind === "platform.service-provider")
    .map(item => item.provider)
    .find(item =>
      item.capability === ENTERPRISE_BUSINESS_DEFINITION_CAPABILITY_V010
    );

  assert.equal(provider.providerId, "host.enterprise-context.business-definitions");
  assert.equal(
    provider.providerContract,
    "evo.enterprise.business-definition.repository"
  );
});
