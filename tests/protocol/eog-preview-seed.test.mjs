import test from "node:test";
import assert from "node:assert/strict";

import {
  applyEogPreviewSeedV010,
  parseEogPreviewSeedV010
} from "../../dist/manager/eog-preview-seed.js";
import {
  createEnterpriseOperatingGraphHostServiceV010
} from "../../dist/apps/eog-2d-designer/enterprise-operating-graph-service.js";
import {
  createMemoryEnterpriseOperatingGraphStoreV010
} from "../../dist/apps/eog-2d-designer/enterprise-operating-graph-store.js";

const seed = {
  enterpriseId: "enterprise:preview",
  graphId: "eog:primary",
  nodes: [
    {
      nodeId: "app:sales",
      kind: "APPLICATION",
      semanticRef: {
        kind: "APPLICATION",
        authority: "HOST",
        refId: "application:sales"
      }
    },
    {
      nodeId: "ledger:receivable",
      kind: "LEDGER",
      semanticRef: {
        kind: "LEDGER_DEFINITION",
        authority: "HOST",
        refId: "ledger:receivable"
      }
    },
    {
      nodeId: "app:planning",
      kind: "APPLICATION",
      semanticRef: {
        kind: "APPLICATION",
        authority: "HOST",
        refId: "application:planning"
      }
    }
  ],
  guidanceRelations: [{
    relationId: "guidance:sales-receivable",
    kind: "APPLICATION_LEDGER",
    applicationNodeId: "app:sales",
    ledgerNodeId: "ledger:receivable",
    source: {
      kind: "ENTERPRISE_TEMPLATE",
      sourceRef: "preview:eog"
    }
  }]
};

test("preview seed is opt-in and parses explicit JSON only", () => {
  assert.equal(parseEogPreviewSeedV010(undefined), undefined);
  assert.deepEqual(
    parseEogPreviewSeedV010(JSON.stringify(seed)),
    seed
  );
});

test("preview seed uses normal EOG service and is idempotent", () => {
  const service = createEnterpriseOperatingGraphHostServiceV010({
    store: createMemoryEnterpriseOperatingGraphStoreV010(),
    id: () => "id"
  });
  const first = applyEogPreviewSeedV010({ service, seed });
  const second = applyEogPreviewSeedV010({ service, seed });

  assert.equal(first.seeded, true);
  assert.equal(second.seeded, false);

  const graph = service.get({
    enterpriseId: seed.enterpriseId,
    graphId: seed.graphId
  });
  assert.equal(graph.nodes.length, 3);
  assert.equal(graph.guidanceRelations.length, 1);
  assert.equal(graph.revision, 4);
});
