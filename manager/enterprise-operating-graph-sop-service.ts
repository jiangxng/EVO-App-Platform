import type {
  BusinessDefinitionAttributionV010,
  BusinessDefinitionRepositoryV010,
  BusinessDefinitionRevisionV010
} from "../contracts/business-definition-repository.js";
import {
  BUSINESS_DEFINITION_KIND_SOP_V010
} from "../contracts/business-definition-repository.js";
import type { EnterpriseOperatingGraphHostServiceV010 } from "./enterprise-operating-graph-service.js";
import type {
  EogExpectedSopStepV010,
  EogExpectedSopTransitionInputV010,
  EogExpectedSopTransitionV010,
  EogExpectedSopV010
} from "../contracts/enterprise-operating-graph-sop.js";

interface SopDefinitionPayloadV010 {
  graphId: string;
  steps: EogExpectedSopStepV010[];
  transitions: EogExpectedSopTransitionV010[];
}

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

function payload(value: BusinessDefinitionRevisionV010): SopDefinitionPayloadV010 {
  if (value.kind !== BUSINESS_DEFINITION_KIND_SOP_V010) {
    throw new Error("EOG_EXPECTED_SOP_DEFINITION_KIND_INVALID");
  }
  const raw = value.payload;
  if (
    typeof raw.graphId !== "string"
    || !raw.graphId.trim()
    || !Array.isArray(raw.steps)
    || !Array.isArray(raw.transitions)
  ) {
    throw new Error("EOG_EXPECTED_SOP_DEFINITION_PAYLOAD_INVALID");
  }
  return {
    graphId: raw.graphId.trim(),
    steps: structuredClone(raw.steps) as EogExpectedSopStepV010[],
    transitions:
      structuredClone(raw.transitions) as EogExpectedSopTransitionV010[]
  };
}

function toSop(
  value: BusinessDefinitionRevisionV010
): EogExpectedSopV010 {
  const definition = payload(value);
  return {
    contractVersion: "0.1.0",
    sopId: value.definitionId,
    enterpriseId: value.enterpriseId,
    graphId: definition.graphId,
    title: value.title,
    state: value.state,
    revision: value.revision,
    steps: definition.steps,
    transitions: definition.transitions,
    createdAt: value.definitionCreatedAt,
    updatedAt: value.recordedAt,
    ...(value.publishedAt === undefined
      ? {}
      : { publishedAt: value.publishedAt }),
    ...(value.publishedBySubjectId === undefined
      ? {}
      : { publishedBySubjectId: value.publishedBySubjectId })
  };
}

function actor(
  value: BusinessDefinitionAttributionV010
): BusinessDefinitionAttributionV010 {
  return {
    actorType: value.actorType,
    subjectId: required(
      value.subjectId,
      "EOG_EXPECTED_SOP_ACTOR_REQUIRED"
    )
  };
}

export interface EogExpectedSopServiceV010 {
  create(input: {
    enterpriseId: string;
    graphId: string;
    sopId: string;
    title: string;
    applicationNodeIds: string[];
    transitions?: EogExpectedSopTransitionInputV010[];
    actor: BusinessDefinitionAttributionV010;
  }): EogExpectedSopV010;
  revise(input: {
    enterpriseId: string;
    graphId: string;
    sopId: string;
    expectedRevision: number;
    title?: string;
    applicationNodeIds?: string[];
    transitions?: EogExpectedSopTransitionInputV010[];
    actor: BusinessDefinitionAttributionV010;
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
  history(input: {
    enterpriseId: string;
    graphId: string;
    sopId: string;
  }): EogExpectedSopV010[];
}

export function createEogExpectedSopServiceV010(input: {
  repository: BusinessDefinitionRepositoryV010;
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

  const current = (
    enterpriseId: string,
    graphId: string,
    sopId: string
  ): EogExpectedSopV010 => {
    const found = input.repository.getLatest({
      enterpriseId,
      definitionId: sopId
    });
    if (!found) throw new Error("EOG_EXPECTED_SOP_NOT_FOUND");
    const sop = toSop(found);
    if (sop.graphId !== graphId) {
      throw new Error("EOG_EXPECTED_SOP_NOT_FOUND");
    }
    return sop;
  };

  return {
    create(request) {
      const enterpriseId = required(
        request.enterpriseId,
        "EOG_ENTERPRISE_ID_REQUIRED"
      );
      const graphId = required(request.graphId, "EOG_GRAPH_ID_REQUIRED");
      const ids = applications(
        enterpriseId,
        graphId,
        request.applicationNodeIds
      );
      const recordedAt = now().toISOString();
      return toSop(input.repository.createDraft({
        enterpriseId,
        definitionId: required(
          request.sopId,
          "EOG_EXPECTED_SOP_ID_REQUIRED"
        ),
        kind: BUSINESS_DEFINITION_KIND_SOP_V010,
        title: required(
          request.title,
          "EOG_EXPECTED_SOP_TITLE_REQUIRED"
        ),
        payload: {
          graphId,
          steps: ids.map((applicationNodeId, index) => ({
            stepId: "step:" + (index + 1),
            applicationNodeId
          })),
          transitions: transitions(ids, request.transitions)
        },
        actor: actor(request.actor),
        recordedAt
      }));
    },

    revise(request) {
      const existing = current(
        request.enterpriseId,
        request.graphId,
        request.sopId
      );
      if (existing.state !== "DRAFT") {
        throw new Error("EOG_EXPECTED_SOP_PUBLISHED_IMMUTABLE");
      }
      if (existing.revision !== request.expectedRevision) {
        throw new Error("EOG_EXPECTED_SOP_REVISION_CONFLICT");
      }

      const ids = request.applicationNodeIds
        ? applications(
            request.enterpriseId,
            request.graphId,
            request.applicationNodeIds
          )
        : existing.steps.map(step => step.applicationNodeId);

      const nextTransitions = request.transitions !== undefined
        ? transitions(ids, request.transitions)
        : request.applicationNodeIds !== undefined
          ? transitions(ids)
          : existing.transitions ?? transitions(ids);

      return toSop(input.repository.reviseDraft({
        enterpriseId: request.enterpriseId,
        definitionId: request.sopId,
        expectedRevision: request.expectedRevision,
        title: request.title === undefined
          ? existing.title
          : required(
              request.title,
              "EOG_EXPECTED_SOP_TITLE_REQUIRED"
            ),
        payload: {
          graphId: existing.graphId,
          steps: ids.map((applicationNodeId, index) => ({
            stepId: "step:" + (index + 1),
            applicationNodeId
          })),
          transitions: nextTransitions
        },
        actor: actor(request.actor),
        recordedAt: now().toISOString()
      }));
    },

    publish(request) {
      const existing = current(
        request.enterpriseId,
        request.graphId,
        request.sopId
      );
      if (existing.state !== "DRAFT") {
        throw new Error("EOG_EXPECTED_SOP_PUBLISHED_IMMUTABLE");
      }
      if (existing.revision !== request.expectedRevision) {
        throw new Error("EOG_EXPECTED_SOP_REVISION_CONFLICT");
      }
      if (
        existing.steps.length < 2
        || !existing.transitions
        || existing.transitions.length < 1
      ) {
        throw new Error("EOG_EXPECTED_SOP_MINIMUM_PATH_REQUIRED");
      }

      return toSop(input.repository.publish({
        enterpriseId: request.enterpriseId,
        definitionId: request.sopId,
        expectedRevision: request.expectedRevision,
        actor: {
          actorType: "HUMAN",
          subjectId: required(
            request.subjectId,
            "EOG_EXPECTED_SOP_PUBLISHER_REQUIRED"
          )
        },
        recordedAt: now().toISOString()
      }));
    },

    list(request) {
      return input.repository
        .listLatest({
          enterpriseId: request.enterpriseId,
          kind: BUSINESS_DEFINITION_KIND_SOP_V010
        })
        .map(toSop)
        .filter(sop => sop.graphId === request.graphId);
    },

    listPublished(request) {
      return input.repository
        .listLatest({
          enterpriseId: request.enterpriseId,
          kind: BUSINESS_DEFINITION_KIND_SOP_V010
        })
        .filter(item => item.state === "PUBLISHED")
        .map(toSop)
        .filter(sop => sop.graphId === request.graphId);
    },

    history(request) {
      return input.repository
        .listHistory({
          enterpriseId: request.enterpriseId,
          definitionId: request.sopId
        })
        .map(toSop)
        .filter(sop => sop.graphId === request.graphId);
    }
  };
}
