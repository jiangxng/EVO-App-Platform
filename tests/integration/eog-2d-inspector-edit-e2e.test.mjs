import test from "node:test";
import assert from "node:assert/strict";

import {
  createMemoryEnterpriseOperatingGraphStoreV010
} from "../../dist/apps/eog-2d-designer/enterprise-operating-graph-store.js";
import {
  createEnterpriseOperatingGraphHostServiceV010
} from "../../dist/apps/eog-2d-designer/enterprise-operating-graph-service.js";
import {
  createEnterpriseOperatingGraphEditorPageV010,
  createEnterpriseOperatingGraphViewActionHandlersV010,
  projectEnterpriseOperatingGraphEditorStateV010
} from "../../dist/apps/eog-2d-designer/enterprise-operating-graph-page.js";
import {
  createMemoryEogViewStateStoreV010
} from "../../dist/providers/eog-view-state/store.js";
import {
  createEogViewStateProviderV010
} from "../../dist/providers/eog-view-state/runtime.js";
import {
  PRIMARY_EOG_DIAGRAM_VIEW_ID_V010
} from "../../dist/contracts/enterprise-operating-graph-view.js";
import {
  diagramWorkspaceOperationRequestV010
} from "../../dist/vendor/eidos/src/2d/index.js";

const activeContext = {
  contractVersion: "0.1.0",
  kind: "ENTERPRISE",
  contextId: "enterprise:demo",
  enterpriseId: "enterprise:demo"
};

const requestContext = {
  contractVersion: "0.1.0",
  principal: {
    contractVersion: "0.1.0",
    subjectId: "human:demo",
    actorType: "HUMAN",
    identityProviderId: "test"
  },
  scope: {
    contractVersion: "0.1.0",
    enterpriseId: "enterprise:demo"
  },
  context: {
    contractVersion: "0.1.0",
    personalContext: {
      contractVersion: "0.1.0",
      kind: "PERSONAL",
      contextId: "personal:human:demo",
      ownerSubjectId: "human:demo"
    },
    activeContext
  },
  correlationId: "corr:eog-inspector"
};

const authorization = {
  providerId: "test.allow",
  check(request) {
    return {
      contractVersion: "0.1.0",
      allowed: true,
      policyProviderId: "test.allow",
      reasonCodes: ["TEST_ALLOW"],
      request
    };
  }
};

const emptyInspectorResolver = {
  hasCandidates() {
    return false;
  },
  async inspect() {
    return [];
  }
};

test("Designer Inspector Save flows through ActionHost and creates a new Enterprise Graph revision", async () => {
  let serial = 0;
  const graphService = createEnterpriseOperatingGraphHostServiceV010({
    store: createMemoryEnterpriseOperatingGraphStoreV010(),
    id: () => "id:" + (++serial),
    now: () => new Date("2026-10-02T14:30:00.000Z")
  });
  const viewService = createEogViewStateProviderV010({
    store: createMemoryEogViewStateStoreV010(),
    now: () => new Date("2026-10-02T14:30:00.000Z")
  });

  const created = graphService.create({
    enterpriseId: "enterprise:demo",
    graphId: "eog:primary",
    actor: {
      type: "HUMAN",
      subjectId: "human:demo"
    }
  });
  const graph = graphService.apply({
    enterpriseId: "enterprise:demo",
    graphId: "eog:primary",
    expectedRevision: created.revision,
    mutation: {
      type: "NODE_BIND",
      node: {
        nodeId: "app:1",
        kind: "APPLICATION",
        semanticRef: {
          authority: "HOST",
          kind: "APPLICATION",
          refId: "application:sales"
        }
      }
    },
    actor: {
      type: "HUMAN",
      subjectId: "human:demo"
    }
  });

  const view = viewService.ensure({
    enterpriseId: "enterprise:demo",
    graphId: "eog:primary",
    viewId: PRIMARY_EOG_DIAGRAM_VIEW_ID_V010,
    kind: "DIAGRAM_2D"
  });
  const state = projectEnterpriseOperatingGraphEditorStateV010(
    graph,
    view
  );
  const page = createEnterpriseOperatingGraphEditorPageV010({
    activeContext
  });

  const property = state.nodes[0].properties.find(
    item => item.key === "semantic.ref"
  );
  assert.ok(property?.editor);

  const operation = structuredClone(property.editor.operation);
  operation[property.editor.valueField] = "application:renewed-sales";

  const request = diagramWorkspaceOperationRequestV010(
    page,
    state,
    operation,
    property.editor.actionId,
    property.editor.requiresConfirmation === true,
    property.editor.command
  );

  const handlers = createEnterpriseOperatingGraphViewActionHandlersV010({
    service: graphService,
    viewService,
    resolveAuthorizationProvider: () => authorization,
    inspectorResolver: emptyInspectorResolver
  });
  const handler = handlers.find(
    item => item.commandCode === page.operationCommand.code
  );
  assert.ok(handler);

  const result = await handler.execute(request, requestContext);
  assert.equal(result.ok, true);

  const latest = graphService.get({
    enterpriseId: "enterprise:demo",
    graphId: "eog:primary"
  });
  assert.equal(latest.revision, graph.revision + 1);
  assert.equal(
    latest.nodes.find(item => item.nodeId === "app:1").semanticRef.refId,
    "application:renewed-sales"
  );
  assert.equal(
    graph.nodes.find(item => item.nodeId === "app:1").semanticRef.refId,
    "application:sales"
  );
});

test("Viewer-style shared projection has no semantic editor to generate the same write request", async () => {
  const { projectEnterpriseOperatingGraphDiagramBaseV010 } =
    await import("../../dist/eog/diagram-projection.js");

  const graph = {
    contractVersion: "0.1.0",
    graphId: "eog:primary",
    enterpriseId: "enterprise:demo",
    revision: 1,
    state: "DRAFT",
    nodes: [{
      nodeId: "app:1",
      kind: "APPLICATION",
      semanticRef: {
        authority: "HOST",
        kind: "APPLICATION",
        refId: "application:sales"
      }
    }],
    guidanceRelations: [],
    enterpriseRelations: [],
    createdAt: "2026-10-02T00:00:00.000Z",
    updatedAt: "2026-10-02T00:00:00.000Z"
  };
  const view = {
    contractVersion: "0.1.0",
    viewId: "eog-view:primary:diagram-2d",
    graphId: "eog:primary",
    enterpriseId: "enterprise:demo",
    kind: "DIAGRAM_2D",
    revision: 0,
    placements: [],
    createdAt: "2026-10-02T00:00:00.000Z",
    updatedAt: "2026-10-02T00:00:00.000Z"
  };

  const viewer = projectEnterpriseOperatingGraphDiagramBaseV010({
    graph,
    view,
    readOnly: true
  });
  const property = viewer.nodes[0].properties.find(
    item => item.key === "semantic.ref"
  );
  assert.equal(property.editor, undefined);
});
