import type { EnterpriseOperatingGraphHostServiceV010 } from "./enterprise-operating-graph-service.js";
import type {
  EogExpectedSopTransitionInputV010,
  EogExpectedSopTransitionV010,
  EogExpectedSopV010
} from "../contracts/enterprise-operating-graph-sop.js";
import type { EogExpectedSopStoreV010 } from "./enterprise-operating-graph-sop-store.js";

function required(value: string, code: string): string {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(code);
  }
  return value.trim();
}

function normalizeOptional(value: string | undefined): string | undefined {
  if (value === undefined) return undefined;
  const normalized = value.trim();
  return normalized || undefined;
}

export interface EogExpectedSopServiceV010 {
  create(input: {
    enterpriseId: string;
    graphId: string;
    sopId: string;
    title: string;
    applicationNodeIds: string[];
    transitions?: EogExpectedSopTransitionInputV010[];
  }): EogExpectedSopV010;
  revise(input: {
    enterpriseId: string;
    graphId: string;
    sopId: string;
    expectedRevision: number;
    title?: string;
    applicationNodeIds?: string[];
    transitions?: EogExpectedSopTransitionInputV010[];
  }): EogExpectedSopV010;
  publish(input: {
    enterpriseId: string;
    graphId: string;
    sopId: string;
    expectedRevision: number;
    subjectId: string;
  }): EogExpectedSopV010;
  list(input: {
    enterpriseId: string;
    graphId: string;
  }): EogExpectedSopV010[];
  listPublished(input: {
    enterpriseId: string;
    graphId: string;
  }): EogExpectedSopV010[];
}

export function createEogExpectedSopServiceV010(input: {
  store: EogExpectedSopStoreV010;
  graphService: EnterpriseOperatingGraphHostServiceV010;
  now?: () => Date;
}): EogExpectedSopServiceV010 {
  const now = input.now ?? (() => new Date());

  const applications = (
    enterpriseId: string,
    graphId: string,
    ids: string[]
  ): string[] => {
    const graph = input.graphService.get({ enterpriseId, graphId });
    const unique = [...new Set(
      ids.map(id =>
        required(id, "EOG_EXPECTED_SOP_APPLICATION_REQUIRED")
      )
    )];
    if (unique.length !== ids.length) {
      throw new Error("EOG_EXPECTED_SOP_APPLICATION_DUPLICATE");
    }
    for (const id of unique) {
      const node = graph.nodes.find(item => item.nodeId === id);
      if (!node || node.kind !== "APPLICATION") {
        throw new Error("EOG_EXPECTED_SOP_APPLICATION_NODE_REQUIRED");
      }
    }
    return unique;
  };

  const transitions = (
    ids: string[],
    definitions?: EogExpectedSopTransitionInputV010[]
  ): EogExpectedSopTransitionV010[] => {
    if (definitions === undefined) {
      const linear: EogExpectedSopTransitionV010[] = [];
      for (let index = 0; index + 1 < ids.length; index += 1) {
        linear.push({
          transitionId: "transition:" + (index + 1),
          fromApplicationNodeId: ids[index]!,
          toApplicationNodeId: ids[index + 1]!,
          kind: "EXPECTED"
        });
      }
      return linear;
    }

    return definitions.map((definition, index) => ({
      transitionId: "transition:" + (index + 1),
      fromApplicationNodeId: required(
        definition.fromApplicationNodeId,
        "EOG_EXPECTED_SOP_TRANSITION_FROM_REQUIRED"
      ),
      toApplicationNodeId: required(
        definition.toApplicationNodeId,
        "EOG_EXPECTED_SOP_TRANSITION_TO_REQUIRED"
      ),
      kind: definition.kind ?? "EXPECTED",
      ...(normalizeOptional(definition.conditionRef) !== undefined
        ? { conditionRef: normalizeOptional(definition.conditionRef) }
        : {}),
      ...(normalizeOptional(definition.exceptionCode) !== undefined
        ? { exceptionCode: normalizeOptional(definition.exceptionCode) }
        : {})
    }));
  };

  return {
    create(request) {
      const timestamp = now().toISOString();
      const ids = applications(
        request.enterpriseId,
        request.graphId,
        request.applicationNodeIds
      );
      return input.store.create({
        contractVersion: "0.1.0",
        sopId: required(request.sopId, "EOG_EXPECTED_SOP_ID_REQUIRED"),
        enterpriseId: required(
          request.enterpriseId,
          "EOG_ENTERPRISE_ID_REQUIRED"
        ),
        graphId: required(request.graphId, "EOG_GRAPH_ID_REQUIRED"),
        title: required(
          request.title,
          "EOG_EXPECTED_SOP_TITLE_REQUIRED"
        ),
        state: "DRAFT",
        revision: 0,
        steps: ids.map((applicationNodeId, index) => ({
          stepId: "step:" + (index + 1),
          applicationNodeId
        })),
        transitions: transitions(ids, request.transitions),
        createdAt: timestamp,
        updatedAt: timestamp
      });
    },

    revise(request) {
      const current = input.store.get(request.sopId);
      if (
        !current
        || current.enterpriseId !== request.enterpriseId
        || current.graphId !== request.graphId
      ) {
        throw new Error("EOG_EXPECTED_SOP_NOT_FOUND");
      }
      if (current.state !== "DRAFT") {
        throw new Error("EOG_EXPECTED_SOP_PUBLISHED_IMMUTABLE");
      }
      if (current.revision !== request.expectedRevision) {
        throw new Error("EOG_EXPECTED_SOP_REVISION_CONFLICT");
      }

      const ids = request.applicationNodeIds
        ? applications(
            request.enterpriseId,
            request.graphId,
            request.applicationNodeIds
          )
        : current.steps.map(step => step.applicationNodeId);

      const nextTransitions = request.transitions !== undefined
        ? transitions(ids, request.transitions)
        : request.applicationNodeIds !== undefined
          ? transitions(ids)
          : current.transitions;

      return input.store.replace({
        ...current,
        revision: current.revision + 1,
        title: request.title === undefined
          ? current.title
          : required(
              request.title,
              "EOG_EXPECTED_SOP_TITLE_REQUIRED"
            ),
        steps: ids.map((applicationNodeId, index) => ({
          stepId: "step:" + (index + 1),
          applicationNodeId
        })),
        ...(nextTransitions === undefined
          ? {}
          : { transitions: nextTransitions }),
        updatedAt: now().toISOString()
      });
    },

    publish(request) {
      const current = input.store.get(request.sopId);
      if (
        !current
        || current.enterpriseId !== request.enterpriseId
        || current.graphId !== request.graphId
      ) {
        throw new Error("EOG_EXPECTED_SOP_NOT_FOUND");
      }
      if (current.state !== "DRAFT") {
        throw new Error("EOG_EXPECTED_SOP_PUBLISHED_IMMUTABLE");
      }
      if (current.revision !== request.expectedRevision) {
        throw new Error("EOG_EXPECTED_SOP_REVISION_CONFLICT");
      }
      if (
        current.steps.length < 2
        || !current.transitions
        || current.transitions.length < 1
      ) {
        throw new Error("EOG_EXPECTED_SOP_MINIMUM_PATH_REQUIRED");
      }

      const timestamp = now().toISOString();
      return input.store.replace({
        ...current,
        state: "PUBLISHED",
        revision: current.revision + 1,
        publishedAt: timestamp,
        publishedBySubjectId: required(
          request.subjectId,
          "EOG_EXPECTED_SOP_PUBLISHER_REQUIRED"
        ),
        updatedAt: timestamp
      });
    },

    list(request) {
      return input.store.listByGraph(request);
    },

    listPublished(request) {
      return input.store
        .listByGraph(request)
        .filter(sop => sop.state === "PUBLISHED");
    }
  };
}
